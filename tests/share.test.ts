import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { setLang } from '../src/core/i18n.ts';
import { arenaShareText, dailyShareText, streakShareText } from '../src/core/share.ts';
import { installDom } from './helpers/dom-env.ts';

let teardown: () => void;

// setLang() touches document.documentElement, so these need a DOM in place.
before(() => {
  teardown = installDom();
});

after(() => teardown());

test('dailyShareText includes the puzzle number, grade row, and site link', () => {
  setLang('en');
  const text = dailyShareText({
    dateKey: '2026-01-02',
    grades: ['perfect', 'great', 'good', 'close', 'miss'],
    score: 3200,
    streak: 0,
  });
  const lines = text.split('\n');
  assert.equal(lines[0], 'Quizei #2 — 3200 pts');
  assert.equal(lines[1], '🟩🟢🟡🟠⬛');
  assert.equal(lines[lines.length - 1], 'https://quizei.pages.dev');
});

test('dailyShareText omits the streak line when the streak is 1 or less', () => {
  setLang('en');
  const text = dailyShareText({ dateKey: '2026-01-02', grades: ['perfect'], score: 100, streak: 1 });
  assert.ok(!text.includes('🔥'));
});

test('dailyShareText includes a streak line when the streak is above 1', () => {
  setLang('en');
  const text = dailyShareText({ dateKey: '2026-01-02', grades: ['perfect'], score: 100, streak: 4 });
  assert.ok(text.includes('🔥 4 days'));
});

test('streakShareText reports the streak length', () => {
  setLang('en');
  assert.equal(streakShareText(7), 'Quizei Comparison Streak: 7 🔥\nhttps://quizei.pages.dev');
});

test('arenaShareText reports score and correct/total', () => {
  setLang('en');
  assert.equal(arenaShareText(820, 8, 10), 'Quizei Arena: 820 pts (8/10)\nhttps://quizei.pages.dev');
});
