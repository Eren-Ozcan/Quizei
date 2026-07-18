import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  accuracyFor,
  comparisonRatio,
  correctSide,
  gradeOf,
  isNumericCorrect,
  MAX_POINTS,
  numericAccuracy,
  scoreAnswer,
  speedBonus,
} from '../src/core/scoring.ts';
import type { BooleanQuestion, ComparisonQuestion, NumericQuestion } from '../src/core/types.ts';

const source = { url: 'https://example.org/x', label: 'Example' };
const bilingual = (s: string) => ({ tr: s, en: s });

const numeric: NumericQuestion = {
  id: 'n-test',
  type: 'numeric',
  category: 'space',
  difficulty: 2,
  prompt: bilingual('How many?'),
  answer: 1000,
  unit: bilingual('things'),
  explain: bilingual('Because.'),
  source,
};

const boolean: BooleanQuestion = {
  id: 'b-test',
  type: 'boolean',
  category: 'space',
  difficulty: 1,
  prompt: bilingual('Is it?'),
  answer: true,
  explain: bilingual('Yes.'),
  source,
};

const comparison: ComparisonQuestion = {
  id: 'c-test',
  type: 'comparison',
  category: 'space',
  difficulty: 1,
  unit: bilingual('count'),
  left: { label: bilingual('Big'), value: 900 },
  right: { label: bilingual('Small'), value: 90 },
  explain: bilingual('Ten to one.'),
  source,
};

test('an exact numeric guess scores full accuracy', () => {
  assert.equal(numericAccuracy(1000, 1000), 1);
});

test('being off by one order of magnitude scores half', () => {
  assert.equal(numericAccuracy(10_000, 1000), 0.5);
  assert.equal(numericAccuracy(100, 1000), 0.5);
});

test('being off by two orders of magnitude scores nothing', () => {
  assert.equal(numericAccuracy(100_000, 1000), 0);
  assert.equal(numericAccuracy(10, 1000), 0);
});

test('overshooting and undershooting by the same factor score identically', () => {
  // log10 is not bit-exact in both directions, so compare within a rounding step.
  const over = numericAccuracy(3000, 1000);
  const under = numericAccuracy(1000 / 3, 1000);
  assert.ok(Math.abs(over - under) < 1e-12, `${over} vs ${under}`);
});

test('a negative guess for a positive answer scores nothing', () => {
  assert.equal(numericAccuracy(-1000, 1000), 0);
});

test('non-finite guesses do not crash or leak NaN into the score', () => {
  assert.equal(numericAccuracy(Number.NaN, 1000), 0);
  assert.equal(numericAccuracy(Number.POSITIVE_INFINITY, 1000), 0);
});

test('numeric answers count as correct within one order of magnitude', () => {
  assert.equal(isNumericCorrect(9000, 1000), true);
  assert.equal(isNumericCorrect(20_000, 1000), false);
});

test('the speed bonus is full early, zero late, and monotonic between', () => {
  assert.equal(speedBonus(0), 1);
  assert.equal(speedBonus(2500), 1);
  assert.equal(speedBonus(20_000), 0);
  assert.ok(speedBonus(6000) > speedBonus(12_000));
});

test('a wrong answer earns no points however fast it was', () => {
  const scored = scoreAnswer(boolean, { type: 'boolean', picked: false }, 10);
  assert.equal(scored.points, 0);
  assert.equal(scored.correct, false);
});

test('an instant correct answer earns the maximum', () => {
  const scored = scoreAnswer(boolean, { type: 'boolean', picked: true }, 0);
  assert.equal(scored.points, MAX_POINTS);
});

test('a slow correct answer still beats a wrong one', () => {
  const slow = scoreAnswer(boolean, { type: 'boolean', picked: true }, 60_000);
  const wrong = scoreAnswer(boolean, { type: 'boolean', picked: false }, 0);
  assert.ok(slow.points > wrong.points);
  assert.ok(slow.points > 0);
});

test('points never exceed the maximum', () => {
  for (const ms of [0, 1, 2500, 5000, 30_000]) {
    const scored = scoreAnswer(numeric, { type: 'numeric', guess: 1000 }, ms);
    assert.ok(scored.points <= MAX_POINTS, `got ${scored.points} at ${ms}ms`);
  }
});

test('the larger comparison side is the correct one regardless of position', () => {
  assert.equal(correctSide(comparison), 'left');
  const flipped: ComparisonQuestion = {
    ...comparison,
    left: { label: bilingual('Small'), value: 90 },
    right: { label: bilingual('Big'), value: 900 },
  };
  assert.equal(correctSide(flipped), 'right');
});

test('comparison ratio is orientation independent', () => {
  assert.equal(comparisonRatio(comparison), 10);
});

test('accuracy is all or nothing for boolean and comparison', () => {
  assert.equal(accuracyFor(boolean, { type: 'boolean', picked: true }), 1);
  assert.equal(accuracyFor(boolean, { type: 'boolean', picked: false }), 0);
  assert.equal(accuracyFor(comparison, { type: 'comparison', picked: 'left' }), 1);
  assert.equal(accuracyFor(comparison, { type: 'comparison', picked: 'right' }), 0);
});

test('a mismatched answer shape scores zero rather than throwing', () => {
  assert.equal(accuracyFor(boolean, { type: 'numeric', guess: 5 }), 0);
  assert.equal(accuracyFor(numeric, { type: 'comparison', picked: 'left' }), 0);
});

test('grades bucket the way the share grid expects', () => {
  const grade = (guess: number) =>
    gradeOf(scoreAnswer(numeric, { type: 'numeric', guess }, 30_000));

  assert.equal(grade(1000), 'perfect');
  assert.equal(grade(100_000), 'miss');
  assert.ok(['great', 'good', 'close'].includes(grade(3000)));
});
