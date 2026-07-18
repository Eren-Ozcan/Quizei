import { ALL_QUESTIONS } from '../data/index.ts';
import { seededRng, shuffle } from './rng.ts';
import type { Question, QuestionType } from './types.ts';

export const DAILY_SIZE = 5;

/** Local-date key. Using local time is deliberate: "today" should mean the player's today. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Day number since launch, used as the puzzle number in the share text. */
export const EPOCH = '2026-01-01';

export function dailyNumber(dateKey: string): number {
  const [ey, em, ed] = EPOCH.split('-').map(Number) as [number, number, number];
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number];
  const ms = Date.UTC(y, m - 1, d) - Date.UTC(ey, em - 1, ed);
  return Math.floor(ms / 86_400_000) + 1;
}

/**
 * The day's five questions.
 *
 * Composition is fixed rather than random — two of each of the first two
 * formats and one comparison — so every player gets the same shape of puzzle
 * and no one draws a day of five estimations.
 */
const DAILY_SHAPE: QuestionType[] = ['boolean', 'numeric', 'comparison', 'numeric', 'boolean'];

export function dailyQuestions(dateKey = todayKey()): Question[] {
  const rng = seededRng(`domina-daily-${dateKey}`);

  const byType = new Map<QuestionType, Question[]>();
  for (const type of ['boolean', 'numeric', 'comparison'] as QuestionType[]) {
    byType.set(
      type,
      shuffle(
        ALL_QUESTIONS.filter((q) => q.type === type),
        rng,
      ),
    );
  }

  const picked: Question[] = [];
  const used = new Set<string>();

  for (const type of DAILY_SHAPE) {
    const bucket = byType.get(type) ?? [];
    const next = bucket.find((q) => !used.has(q.id));
    if (next) {
      used.add(next.id);
      picked.push(next);
    }
  }

  // Backfill from anywhere if a bucket ran dry, so the daily is never short.
  if (picked.length < DAILY_SIZE) {
    for (const q of shuffle(ALL_QUESTIONS, rng)) {
      if (picked.length >= DAILY_SIZE) break;
      if (!used.has(q.id)) {
        used.add(q.id);
        picked.push(q);
      }
    }
  }

  return picked;
}
