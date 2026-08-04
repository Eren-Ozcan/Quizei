/**
 * Data gate for the question pool.
 *
 * The idea this game is built on has one non-negotiable rule: a wrong "fact"
 * that goes viral kills the brand. So the pool is machine-checked before it can
 * ship — every question bilingual, every question sourced, every comparison
 * actually decidable.
 *
 * Run with: npm run validate:questions
 */

import { ALL_QUESTIONS, poolStats } from '../src/data/index.ts';
import { MIN_COMPARISON_RATIO } from '../src/core/scoring.ts';
import { CATEGORIES, type Question } from '../src/core/types.ts';

const errors: string[] = [];
const warnings: string[] = [];

function err(q: Question | null, message: string): void {
  errors.push(q ? `[${q.id}] ${message}` : message);
}

function warn(q: Question, message: string): void {
  warnings.push(`[${q.id}] ${message}`);
}

function checkText(q: Question, field: string, text: { tr: string; en: string } | undefined): void {
  if (!text) {
    err(q, `${field} is missing`);
    return;
  }
  for (const lang of ['tr', 'en'] as const) {
    const value = text[lang];
    if (!value || value.trim().length === 0) err(q, `${field}.${lang} is empty`);
    else if (value.trim().length < 2) err(q, `${field}.${lang} is suspiciously short`);
  }
}

const seenIds = new Set<string>();
const seenPrompts = new Map<string, string>();

for (const q of ALL_QUESTIONS) {
  if (!q.id || !/^[a-z]-[a-z0-9-]+$/.test(q.id)) {
    err(q, `id "${q.id}" should look like "b-some-slug"`);
  }
  if (seenIds.has(q.id)) err(q, 'duplicate id');
  seenIds.add(q.id);

  if (!CATEGORIES.includes(q.category)) err(q, `unknown category "${q.category}"`);
  if (![1, 2, 3].includes(q.difficulty)) err(q, `difficulty must be 1-3, got ${q.difficulty}`);

  // Sources are the whole trust model, so they are checked hard.
  if (!q.source || !q.source.url) err(q, 'missing source');
  else {
    if (!/^https:\/\//.test(q.source.url)) err(q, `source url must be https: ${q.source.url}`);
    if (!q.source.label || q.source.label.trim().length === 0) err(q, 'source label is empty');
  }

  checkText(q, 'explain', q.explain);

  switch (q.type) {
    case 'boolean': {
      checkText(q, 'prompt', q.prompt);
      if (typeof q.answer !== 'boolean') err(q, 'boolean answer must be true or false');
      break;
    }

    case 'numeric': {
      checkText(q, 'prompt', q.prompt);
      checkText(q, 'unit', q.unit);
      if (!Number.isFinite(q.answer)) err(q, 'numeric answer must be a finite number');
      if (q.answer <= 0) err(q, 'numeric answers must be positive (log scoring needs it)');
      if (q.hint) checkText(q, 'hint', q.hint);
      break;
    }

    case 'comparison': {
      checkText(q, 'unit', q.unit);
      checkText(q, 'left.label', q.left?.label);
      checkText(q, 'right.label', q.right?.label);

      const l = q.left?.value;
      const r = q.right?.value;

      if (!Number.isFinite(l) || !Number.isFinite(r)) {
        err(q, 'comparison sides need finite values');
      } else if (l <= 0 || r <= 0) {
        err(q, 'comparison values must be positive');
      } else {
        const ratio = Math.max(l, r) / Math.min(l, r);
        if (ratio < MIN_COMPARISON_RATIO) {
          err(
            q,
            `sides are only ${ratio.toFixed(2)}x apart — below the ${MIN_COMPARISON_RATIO}x floor, so this is a coin flip`,
          );
        } else if (ratio < 1.3) {
          warn(q, `sides are close (${ratio.toFixed(2)}x) — make sure the sources really support it`);
        }
      }
      break;
    }
  }

  // Near-duplicate detection on the Turkish prompt/label, which is what players read.
  const fingerprint = (
    q.type === 'comparison' ? `${q.left?.label?.tr}|${q.right?.label?.tr}` : q.prompt?.tr
  )
    ?.toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

  if (fingerprint) {
    const previous = seenPrompts.get(fingerprint);
    if (previous) err(q, `prompt duplicates ${previous}`);
    else seenPrompts.set(fingerprint, q.id);
  }
}

const stats = poolStats();

// A daily needs 2 boolean + 2 numeric + 1 comparison; anything thinner than a
// few weeks of non-repeating dailies is not shippable.
const MIN_PER_TYPE = 20;
for (const [type, count] of Object.entries(stats.byType)) {
  if (count < MIN_PER_TYPE) {
    errors.push(`pool has only ${count} "${type}" questions, need at least ${MIN_PER_TYPE}`);
  }
}

console.log(`\nQuizei question pool: ${stats.total} questions`);
console.log('  by format:  ', stats.byType);
console.log('  by category:', stats.byCategory);

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}

console.log('\nAll checks passed.\n');
