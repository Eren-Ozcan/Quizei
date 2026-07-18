import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';

import { installDom } from './helpers/dom-env.ts';

let teardown: () => void;
let store: typeof import('../src/core/storage.ts');

before(async () => {
  teardown = installDom();
  store = await import('../src/core/storage.ts');
});

after(() => teardown());

beforeEach(() => store.resetAll());

function daily(date: string) {
  return { date, score: 100, grades: ['perfect'], correct: 1, total: 1 };
}

test('the first daily starts the streak at one', () => {
  const save = store.recordDaily(daily('2026-05-01'));
  assert.equal(save.dailyStreak, 1);
  assert.equal(save.maxDailyStreak, 1);
});

test('playing on consecutive days extends the streak', () => {
  store.recordDaily(daily('2026-05-01'));
  store.recordDaily(daily('2026-05-02'));
  const save = store.recordDaily(daily('2026-05-03'));
  assert.equal(save.dailyStreak, 3);
  assert.equal(save.maxDailyStreak, 3);
});

test('skipping a day resets the streak but keeps the record', () => {
  store.recordDaily(daily('2026-05-01'));
  store.recordDaily(daily('2026-05-02'));
  const save = store.recordDaily(daily('2026-05-05'));
  assert.equal(save.dailyStreak, 1, 'streak restarts after a gap');
  assert.equal(save.maxDailyStreak, 2, 'the best run is remembered');
});

test('replaying the same day does not inflate the streak', () => {
  store.recordDaily(daily('2026-05-01'));
  const save = store.recordDaily({ ...daily('2026-05-01'), score: 400 });
  assert.equal(save.dailyStreak, 1);
  assert.equal(save.lastDaily?.score, 400, 'the newer result is kept');
});

test('a streak survives a month boundary', () => {
  store.recordDaily(daily('2026-05-31'));
  const save = store.recordDaily(daily('2026-06-01'));
  assert.equal(save.dailyStreak, 2);
});

test('records only move upward', () => {
  assert.equal(store.recordComparisonStreak(7), true);
  assert.equal(store.recordComparisonStreak(4), false, 'a worse run is not a record');
  assert.equal(store.load().bestComparisonStreak, 7);

  assert.equal(store.recordArenaScore(5000), true);
  assert.equal(store.recordArenaScore(4999), false);
  assert.equal(store.load().bestArenaScore, 5000);
});

test('per-format accuracy accumulates', () => {
  store.recordAnswer('numeric', 0.5, true);
  store.recordAnswer('numeric', 1, true);
  store.recordAnswer('numeric', 0, false);

  const stat = store.load().formats.numeric;
  assert.equal(stat.answered, 3);
  assert.equal(stat.correct, 2);
  assert.equal(stat.accuracySum, 1.5);
  assert.equal(store.load().totalAnswered, 3);
});

test('resetting clears everything', () => {
  store.recordDaily(daily('2026-05-01'));
  store.recordAnswer('boolean', 1, true);
  store.resetAll();

  const save = store.load();
  assert.equal(save.totalAnswered, 0);
  assert.equal(save.dailyStreak, 0);
  assert.equal(save.lastDaily, null);
});
