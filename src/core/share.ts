import { dailyNumber } from './daily.ts';
import { getLang } from './i18n.ts';
import { GRADE_EMOJI, type Grade } from './scoring.ts';

const SITE = 'https://domina.pages.dev';

/**
 * Emoji-grid share text, in the shape people already know from daily word
 * games. The grid must not leak the answers — only how well the player did.
 */
export function dailyShareText(opts: {
  dateKey: string;
  grades: Grade[];
  score: number;
  streak: number;
}): string {
  const lang = getLang();
  const n = dailyNumber(opts.dateKey);
  const row = opts.grades.map((g) => GRADE_EMOJI[g]).join('');
  const streakLine =
    opts.streak > 1 ? (lang === 'tr' ? `🔥 ${opts.streak} gün` : `🔥 ${opts.streak} days`) : '';

  const header = lang === 'tr' ? `Domina #${n} — ${opts.score} puan` : `Domina #${n} — ${opts.score} pts`;

  return [header, row, streakLine, SITE].filter(Boolean).join('\n');
}

export function streakShareText(streak: number): string {
  const lang = getLang();
  const header =
    lang === 'tr' ? `Domina Kıyas Serisi: ${streak} 🔥` : `Domina Comparison Streak: ${streak} 🔥`;
  return [header, SITE].join('\n');
}

export function arenaShareText(score: number, correct: number, total: number): string {
  const lang = getLang();
  const header =
    lang === 'tr'
      ? `Domina Arena: ${score} puan (${correct}/${total})`
      : `Domina Arena: ${score} pts (${correct}/${total})`;
  return [header, SITE].join('\n');
}

/**
 * Native share sheet where available, clipboard otherwise.
 * Resolves to how it went so the UI can show the right confirmation.
 */
export async function shareOrCopy(text: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      // A user dismissing the sheet is not an error worth falling back on.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared';
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return legacyCopy(text) ? 'copied' : 'failed';
  }
}

/** Fallback for browsers without the async clipboard API (and for file:// pages). */
function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
