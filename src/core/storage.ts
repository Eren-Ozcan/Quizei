import type { Lang, QuestionType } from './types.ts';

const KEY = 'quizei.save.v1';

export interface FormatStat {
  answered: number;
  /** Sum of accuracies, so mean = accuracySum / answered. */
  accuracySum: number;
  correct: number;
}

export interface DailyResult {
  /** YYYY-MM-DD in the player's local timezone. */
  date: string;
  score: number;
  grades: string[];
  correct: number;
  total: number;
}

export interface SaveData {
  version: 1;
  lang: Lang | null;
  runsPlayed: number;
  totalAnswered: number;
  dailyStreak: number;
  maxDailyStreak: number;
  lastDailyDate: string | null;
  lastDaily: DailyResult | null;
  bestComparisonStreak: number;
  bestArenaScore: number;
  formats: Record<QuestionType, FormatStat>;
}

function emptyFormats(): Record<QuestionType, FormatStat> {
  const blank = (): FormatStat => ({ answered: 0, accuracySum: 0, correct: 0 });
  return { boolean: blank(), numeric: blank(), comparison: blank() };
}

export function defaultSave(): SaveData {
  return {
    version: 1,
    lang: null,
    runsPlayed: 0,
    totalAnswered: 0,
    dailyStreak: 0,
    maxDailyStreak: 0,
    lastDailyDate: null,
    lastDaily: null,
    bestComparisonStreak: 0,
    bestArenaScore: 0,
    formats: emptyFormats(),
  };
}

let cache: SaveData | null = null;

export function load(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cache = defaultSave();
      return cache;
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    // Merge onto defaults so a save written by an older build still loads.
    cache = { ...defaultSave(), ...parsed, formats: { ...emptyFormats(), ...parsed.formats } };
    return cache;
  } catch {
    // Corrupt or unavailable storage (private mode, quota) must not break play.
    cache = defaultSave();
    return cache;
  }
}

export function save(data: SaveData): void {
  cache = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage being unavailable costs the player their history, not their game.
  }
}

export function update(fn: (data: SaveData) => void): SaveData {
  const data = load();
  fn(data);
  save(data);
  return data;
}

export function resetAll(): void {
  cache = defaultSave();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function recordAnswer(type: QuestionType, accuracy: number, correct: boolean): void {
  update((d) => {
    const stat = d.formats[type];
    stat.answered += 1;
    stat.accuracySum += accuracy;
    if (correct) stat.correct += 1;
    d.totalAnswered += 1;
  });
}

/** Days between two YYYY-MM-DD strings, ignoring time and timezone drift. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number) as [number, number, number];
  const [by, bm, bd] = b.split('-').map(Number) as [number, number, number];
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}

/**
 * Records a finished daily run and moves the streak.
 * Playing yesterday extends the streak; any longer gap resets it to 1.
 */
export function recordDaily(result: DailyResult): SaveData {
  return update((d) => {
    if (d.lastDailyDate === result.date) {
      d.lastDaily = result;
      return;
    }
    const gap = d.lastDailyDate ? daysBetween(d.lastDailyDate, result.date) : Infinity;
    d.dailyStreak = gap === 1 ? d.dailyStreak + 1 : 1;
    d.maxDailyStreak = Math.max(d.maxDailyStreak, d.dailyStreak);
    d.lastDailyDate = result.date;
    d.lastDaily = result;
  });
}

export function recordRunFinished(): void {
  update((d) => {
    d.runsPlayed += 1;
  });
}

export function recordComparisonStreak(streak: number): boolean {
  const before = load().bestComparisonStreak;
  if (streak > before) {
    update((d) => {
      d.bestComparisonStreak = streak;
    });
    return true;
  }
  return false;
}

export function recordArenaScore(score: number): boolean {
  const before = load().bestArenaScore;
  if (score > before) {
    update((d) => {
      d.bestArenaScore = score;
    });
    return true;
  }
  return false;
}

export function setSavedLang(lang: Lang): void {
  update((d) => {
    d.lang = lang;
  });
}
