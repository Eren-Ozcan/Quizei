/**
 * Domina question schema.
 *
 * Every question carries both languages and a source. The source is not
 * decoration: a wrong "fact" that goes viral is the one failure this product
 * cannot recover from, so `source` is required by the type system and the
 * data validator refuses to build without it.
 */

export type Lang = 'tr' | 'en';

export const CATEGORIES = [
  'animals',
  'space',
  'money',
  'history',
  'body',
  'earth',
  'tech',
  'food',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 1 = most people get it, 2 = coin flip, 3 = genuinely surprising. */
export type Difficulty = 1 | 2 | 3;

export interface Source {
  /** Stable, publicly reachable URL. Checked by `npm run check:sources`. */
  url: string;
  label: string;
}

export interface LocalizedText {
  tr: string;
  en: string;
}

interface QuestionBase {
  id: string;
  category: Category;
  difficulty: Difficulty;
  source: Source;
  /** 1-2 sentence "wow" context shown after the reveal. */
  explain: LocalizedText;
}

/** "Does a cockroach survive without its head?" */
export interface BooleanQuestion extends QuestionBase {
  type: 'boolean';
  prompt: LocalizedText;
  answer: boolean;
}

/**
 * "How many days does a headless cockroach live?"
 * Scored on order of magnitude, not exactness — see scoring.ts.
 */
export interface NumericQuestion extends QuestionBase {
  type: 'numeric';
  prompt: LocalizedText;
  answer: number;
  unit: LocalizedText;
  /** Optional anchor shown as a hint of the plausible range. */
  hint?: LocalizedText;
}

export interface ComparisonSide {
  label: LocalizedText;
  value: number;
}

/** "More cockroaches on Earth, or more dollars in Jeff Bezos' account?" */
export interface ComparisonQuestion extends QuestionBase {
  type: 'comparison';
  /** Both sides are reduced to one shared unit — that is the whole trick. */
  unit: LocalizedText;
  left: ComparisonSide;
  right: ComparisonSide;
}

export type Question = BooleanQuestion | NumericQuestion | ComparisonQuestion;

export type QuestionType = Question['type'];

export const QUESTION_TYPES: QuestionType[] = ['boolean', 'numeric', 'comparison'];

/** What the player did on a single question. */
export type Answer =
  | { type: 'boolean'; picked: boolean }
  | { type: 'numeric'; guess: number }
  | { type: 'comparison'; picked: 'left' | 'right' };

export interface ScoredAnswer {
  questionId: string;
  answer: Answer;
  /** 0..1 — how right they were. Boolean/comparison are 0 or 1. */
  accuracy: number;
  /** 0..1000 points including any speed bonus. */
  points: number;
  correct: boolean;
  /** Milliseconds spent on the question. */
  elapsedMs: number;
}

export type GameMode = 'daily' | 'arena' | 'streak' | 'party';
