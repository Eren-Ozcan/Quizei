import type { Category, Question, QuestionType } from '../core/types.ts';
import { BOOLEAN_QUESTIONS } from './boolean.ts';
import { NUMERIC_QUESTIONS } from './numeric.ts';
import { COMPARISON_QUESTIONS } from './comparison.ts';

export const ALL_QUESTIONS: Question[] = [
  ...BOOLEAN_QUESTIONS,
  ...NUMERIC_QUESTIONS,
  ...COMPARISON_QUESTIONS,
];

export const QUESTIONS_BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function questionById(id: string): Question | undefined {
  return QUESTIONS_BY_ID.get(id);
}

export interface PoolFilter {
  types?: QuestionType[];
  categories?: Category[];
}

export function filterPool(pool: readonly Question[], filter: PoolFilter): Question[] {
  return pool.filter((q) => {
    if (filter.types && filter.types.length > 0 && !filter.types.includes(q.type)) return false;
    if (filter.categories && filter.categories.length > 0 && !filter.categories.includes(q.category)) {
      return false;
    }
    return true;
  });
}

export function poolStats() {
  const byType = {} as Record<QuestionType, number>;
  const byCategory = {} as Record<Category, number>;
  for (const q of ALL_QUESTIONS) {
    byType[q.type] = (byType[q.type] ?? 0) + 1;
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
  }
  return { total: ALL_QUESTIONS.length, byType, byCategory };
}

export { BOOLEAN_QUESTIONS, NUMERIC_QUESTIONS, COMPARISON_QUESTIONS };
