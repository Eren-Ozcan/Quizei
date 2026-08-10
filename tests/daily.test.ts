import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DAILY_SIZE, dailyNumber, dailyQuestions, todayKey } from '../src/core/daily.ts';
import { hashSeed, makeRng, seededRng, shuffle } from '../src/core/rng.ts';
import { daysBetween } from '../src/core/storage.ts';

test('the daily set is the same for every call on a given date', () => {
  const a = dailyQuestions('2026-03-14').map((q) => q.id);
  const b = dailyQuestions('2026-03-14').map((q) => q.id);
  assert.deepEqual(a, b);
});

test('different dates give different sets', () => {
  const a = dailyQuestions('2026-03-14').map((q) => q.id).join();
  const b = dailyQuestions('2026-03-15').map((q) => q.id).join();
  assert.notEqual(a, b);
});

test('every daily has the full five questions and no repeats', () => {
  for (const date of ['2026-01-01', '2026-06-30', '2026-12-31', '2027-02-28']) {
    const ids = dailyQuestions(date).map((q) => q.id);
    assert.equal(ids.length, DAILY_SIZE, `wrong size on ${date}`);
    assert.equal(new Set(ids).size, DAILY_SIZE, `repeat within ${date}`);
  }
});

test('every daily mixes all three formats', () => {
  for (const date of ['2026-04-01', '2026-08-19', '2027-01-05']) {
    const types = new Set(dailyQuestions(date).map((q) => q.type));
    assert.equal(types.size, 3, `only ${[...types].join('/')} on ${date}`);
  }
});

test('the daily number advances by one per day', () => {
  assert.equal(dailyNumber('2026-01-01'), 1);
  assert.equal(dailyNumber('2026-01-02'), 2);
  assert.equal(dailyNumber('2026-02-01'), 32);
});

test('the daily number never drops below 1 for dates before EPOCH', () => {
  assert.equal(dailyNumber('2025-12-31'), 1);
  assert.equal(dailyNumber('2025-01-01'), 1);
});

test('todayKey produces a zero-padded ISO date', () => {
  assert.match(todayKey(new Date(2026, 2, 5)), /^2026-03-05$/);
});

test('daysBetween handles month and year boundaries', () => {
  assert.equal(daysBetween('2026-01-01', '2026-01-02'), 1);
  assert.equal(daysBetween('2026-02-28', '2026-03-01'), 1);
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(daysBetween('2026-01-10', '2026-01-01'), -9);
});

test('the same seed always produces the same stream', () => {
  const a = Array.from({ length: 5 }, makeRng(hashSeed('quizei')));
  const b = Array.from({ length: 5 }, makeRng(hashSeed('quizei')));
  assert.deepEqual(a, b);
});

test('rng output stays inside [0, 1)', () => {
  const rng = seededRng('range-check');
  for (let i = 0; i < 1000; i++) {
    const value = rng();
    assert.ok(value >= 0 && value < 1, `out of range: ${value}`);
  }
});

test('shuffle keeps every element and leaves the input alone', () => {
  const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
  const out = shuffle(input, seededRng('shuffle'));
  assert.equal(out.length, input.length);
  assert.deepEqual([...out].sort((a, b) => a - b), [...input]);
});
