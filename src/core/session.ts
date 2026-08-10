import { ALL_QUESTIONS, filterPool } from '../data/index.ts';
import { dailyQuestions } from './daily.ts';
import { seededRng, shuffle } from './rng.ts';
import { gradeOf, scoreAnswer, type Grade } from './scoring.ts';
import * as store from './storage.ts';
import type { Answer, Category, GameMode, Question, QuestionType, ScoredAnswer } from './types.ts';

export const ARENA_SIZE = 10;
/** Comparison streak is sudden death; this is the whole tension of the mode. */
export const STREAK_LIVES = 1;

export interface SessionOptions {
  mode: GameMode;
  categories?: Category[];
  /** Party mode only. */
  playerCount?: number;
  questionsPerPlayer?: number;
}

export interface SessionSnapshot {
  mode: GameMode;
  index: number;
  total: number | null;
  question: Question | null;
  score: number;
  streak: number;
  bestStreak: number;
  lives: number;
  finished: boolean;
  answers: ScoredAnswer[];
}

/**
 * One run of the game. Deliberately UI-agnostic: screens read a snapshot and
 * call `answer()`, and everything about pacing, streaks and scoring lives here.
 */
export class Session {
  readonly mode: GameMode;
  private readonly pool: Question[];
  private queue: Question[];
  private cursor = 0;
  private questionStart = 0;

  score = 0;
  streak = 0;
  bestStreak = 0;
  lives = STREAK_LIVES;
  finished = false;
  readonly answers: ScoredAnswer[] = [];
  /** Every question actually put to the player, in order. */
  readonly asked: Question[] = [];

  constructor(opts: SessionOptions) {
    this.mode = opts.mode;
    const rng = seededRng(`${opts.mode}-${Date.now()}-${Math.random()}`);

    const forcedTypes: QuestionType[] | undefined = opts.mode === 'streak' ? ['comparison'] : undefined;
    const categories = opts.categories && opts.categories.length > 0 ? opts.categories : undefined;

    let filtered = filterPool(ALL_QUESTIONS, {
      ...(categories ? { categories } : {}),
      ...(forcedTypes ? { types: forcedTypes } : {}),
    });
    if (filtered.length === 0 && forcedTypes) {
      // The category filter emptied the pool for a mode with a forced type
      // (streak -> comparison-only). Dropping the type constraint here would
      // let non-comparison questions leak into streak mode, so drop the
      // category restriction instead and keep the type invariant.
      filtered = filterPool(ALL_QUESTIONS, { types: forcedTypes });
    }
    this.pool = filtered.length > 0 ? filtered : [...ALL_QUESTIONS];

    switch (opts.mode) {
      case 'daily':
        this.queue = dailyQuestions();
        break;
      case 'arena':
        this.queue = shuffle(this.pool, rng).slice(0, ARENA_SIZE);
        break;
      case 'streak':
        // Endless: the queue is the whole shuffled pool and the run ends on a miss.
        this.queue = shuffle(this.pool, rng);
        break;
      case 'party': {
        const count = (opts.playerCount ?? 2) * (opts.questionsPerPlayer ?? 3);
        this.queue = shuffle(this.pool, rng).slice(0, count);
        break;
      }
    }

    this.questionStart = now();
  }

  /** null in streak mode, where the run has no fixed length. */
  get total(): number | null {
    return this.mode === 'streak' ? null : this.queue.length;
  }

  get current(): Question | null {
    return this.queue[this.cursor] ?? null;
  }

  get index(): number {
    return this.cursor;
  }

  /** Restarts the per-question clock. Screens call this when the prompt becomes visible. */
  markQuestionShown(): void {
    this.questionStart = now();
  }

  answer(answer: Answer): ScoredAnswer {
    const question = this.current;
    if (!question || this.finished) {
      throw new Error('Session.answer called with no active question');
    }

    const elapsed = Math.max(0, now() - this.questionStart);
    const scored = scoreAnswer(question, answer, elapsed);

    this.answers.push(scored);
    this.asked.push(question);
    this.score += scored.points;

    if (scored.correct) {
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
    } else {
      this.streak = 0;
      if (this.mode === 'streak') this.lives -= 1;
    }

    store.recordAnswer(question.type, scored.accuracy, scored.correct);
    return scored;
  }

  /** Moves to the next question and reports whether the run is still going. */
  advance(): boolean {
    this.cursor += 1;

    const outOfQuestions = this.cursor >= this.queue.length;
    const outOfLives = this.mode === 'streak' && this.lives <= 0;

    if (outOfQuestions || outOfLives) {
      this.finish();
      return false;
    }

    this.questionStart = now();
    return true;
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    store.recordRunFinished();
  }

  get grades(): Grade[] {
    return this.answers.map(gradeOf);
  }

  get correctCount(): number {
    return this.answers.filter((a) => a.correct).length;
  }

  /** Mean accuracy across the run, 0..1. */
  get meanAccuracy(): number {
    if (this.answers.length === 0) return 0;
    const sum = this.answers.reduce((acc, a) => acc + a.accuracy, 0);
    return sum / this.answers.length;
  }

  snapshot(): SessionSnapshot {
    return {
      mode: this.mode,
      index: this.cursor,
      total: this.total,
      question: this.current,
      score: this.score,
      streak: this.streak,
      bestStreak: this.bestStreak,
      lives: this.lives,
      finished: this.finished,
      answers: [...this.answers],
    };
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
