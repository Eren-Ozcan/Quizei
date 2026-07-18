import type { Answer, ComparisonQuestion, NumericQuestion, Question, ScoredAnswer } from './types.ts';

export const MAX_POINTS = 1000;
/** Portion of a perfect score that comes from being right rather than fast. */
const ACCURACY_WEIGHT = 0.8;
const SPEED_WEIGHT = 1 - ACCURACY_WEIGHT;
/** Answer within this window and you keep the whole speed bonus. */
const FULL_SPEED_MS = 2500;
/** Past this, the speed bonus is gone. */
const NO_SPEED_MS = 20000;

/**
 * How many orders of magnitude off before a numeric guess scores zero.
 * Two decades is deliberately generous: the game rewards knowing that an
 * answer is "about a million" rather than "about a billion". Rewarding exact
 * recall instead would just hand the game to people who memorise trivia.
 */
export const MAX_LOG_ERROR = 2;

/** Guesses are clamped away from zero so log10 stays finite. */
const EPSILON = 1e-9;

/**
 * Order-of-magnitude accuracy in 0..1.
 *
 * Exact answer -> 1. Off by 10x -> 0.5. Off by 100x or more -> 0.
 * Sign matters: a negative guess for a positive answer is simply wrong.
 */
export function numericAccuracy(guess: number, answer: number): number {
  if (!Number.isFinite(guess)) return 0;
  if (answer === 0) return guess === 0 ? 1 : 0;
  if (Math.sign(guess) !== Math.sign(answer)) return 0;

  const g = Math.max(Math.abs(guess), EPSILON);
  const a = Math.max(Math.abs(answer), EPSILON);
  const logError = Math.abs(Math.log10(g / a));

  return Math.max(0, 1 - logError / MAX_LOG_ERROR);
}

/** A numeric guess counts as "correct" for streaks when within one decade. */
export function isNumericCorrect(guess: number, answer: number): boolean {
  return numericAccuracy(guess, answer) >= 0.5;
}

/** 1 just after answering, decaying to 0 at NO_SPEED_MS. */
export function speedBonus(elapsedMs: number): number {
  if (elapsedMs <= FULL_SPEED_MS) return 1;
  if (elapsedMs >= NO_SPEED_MS) return 0;
  return 1 - (elapsedMs - FULL_SPEED_MS) / (NO_SPEED_MS - FULL_SPEED_MS);
}

function comparisonWinner(q: ComparisonQuestion): 'left' | 'right' {
  return q.left.value >= q.right.value ? 'left' : 'right';
}

/**
 * A comparison is only fair if the two sides are far enough apart that the
 * intended answer is unambiguous. Anything inside this band is a coin flip
 * dressed up as knowledge, so the validator rejects it.
 */
export const MIN_COMPARISON_RATIO = 1.15;

export function accuracyFor(question: Question, answer: Answer): number {
  switch (question.type) {
    case 'boolean':
      return answer.type === 'boolean' && answer.picked === question.answer ? 1 : 0;
    case 'numeric':
      return answer.type === 'numeric' ? numericAccuracy(answer.guess, question.answer) : 0;
    case 'comparison':
      return answer.type === 'comparison' && answer.picked === comparisonWinner(question) ? 1 : 0;
  }
}

export function isCorrect(question: Question, answer: Answer): boolean {
  switch (question.type) {
    case 'boolean':
    case 'comparison':
      return accuracyFor(question, answer) === 1;
    case 'numeric':
      return answer.type === 'numeric' && isNumericCorrect(answer.guess, question.answer);
  }
}

export function scoreAnswer(question: Question, answer: Answer, elapsedMs: number): ScoredAnswer {
  const accuracy = accuracyFor(question, answer);
  // No speed bonus for a wrong answer — otherwise guessing fast beats thinking.
  const speed = accuracy > 0 ? speedBonus(elapsedMs) * accuracy : 0;
  const points = Math.round(MAX_POINTS * (ACCURACY_WEIGHT * accuracy + SPEED_WEIGHT * speed));

  return {
    questionId: question.id,
    answer,
    accuracy,
    points,
    correct: isCorrect(question, answer),
    elapsedMs,
  };
}

/** The side the player should have picked. Used by the reveal screen. */
export function correctSide(q: ComparisonQuestion): 'left' | 'right' {
  return comparisonWinner(q);
}

/** How many times bigger the winning side is. Drives the "…and it is not close" line. */
export function comparisonRatio(q: ComparisonQuestion): number {
  const hi = Math.max(q.left.value, q.right.value);
  const lo = Math.min(q.left.value, q.right.value);
  return lo === 0 ? Infinity : hi / lo;
}

/** Signed decades between guess and truth. Negative = the player lowballed. */
export function logDelta(q: NumericQuestion, guess: number): number {
  if (guess <= 0 || q.answer <= 0) return NaN;
  return Math.log10(guess / q.answer);
}

/** Five buckets, used for the emoji share grid and the result copy. */
export type Grade = 'perfect' | 'great' | 'good' | 'close' | 'miss';

export function gradeOf(scored: ScoredAnswer): Grade {
  if (scored.accuracy >= 0.98) return 'perfect';
  if (scored.accuracy >= 0.85) return 'great';
  if (scored.accuracy >= 0.6) return 'good';
  if (scored.accuracy > 0) return 'close';
  return 'miss';
}

export const GRADE_EMOJI: Record<Grade, string> = {
  perfect: '🟩',
  great: '🟢',
  good: '🟡',
  close: '🟠',
  miss: '⬛',
};
