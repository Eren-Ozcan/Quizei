import type { Category, Lang } from './types.ts';

const STRINGS = {
  // Shell
  appName: { tr: 'Quizei', en: 'Quizei' },
  tagline: {
    tr: 'Saçma ama gerçek. Ne kadarını kestirebilirsin?',
    en: 'Absurd but true. How much can you call?',
  },

  // Modes
  modeDaily: { tr: 'Günün Beşlisi', en: 'Daily Five' },
  modeDailyDesc: {
    tr: 'Herkese aynı 5 soru. Her gün yenilenir.',
    en: 'The same 5 questions for everyone, every day.',
  },
  modeArena: { tr: 'Arena', en: 'Arena' },
  modeArenaDesc: {
    tr: 'Üç formatın karışımı, 10 soruluk serbest tur.',
    en: 'All three formats mixed, a free run of 10.',
  },
  modeStreak: { tr: 'Kıyas Serisi', en: 'Comparison Streak' },
  modeStreakDesc: {
    tr: 'Hangisi daha büyük? Bir yanlış, seri biter.',
    en: 'Which is bigger? One wrong answer ends the run.',
  },
  modeParty: { tr: 'Parti', en: 'Party' },
  modePartyDesc: {
    tr: 'Aynı cihazda sırayla 2-8 kişi.',
    en: 'Pass and play, 2-8 players on one device.',
  },

  // Home
  play: { tr: 'Oyna', en: 'Play' },
  howToPlay: { tr: 'Nasıl oynanır', en: 'How to play' },
  stats: { tr: 'İstatistikler', en: 'Stats' },
  questionsInPool: { tr: 'havuzda soru', en: 'questions in the pool' },
  dailyDoneToday: { tr: 'Bugünkü beşliyi tamamladın', en: 'You finished today’s five' },
  seeResult: { tr: 'Sonucu gör', en: 'See result' },

  // Gameplay
  yes: { tr: 'Evet', en: 'Yes' },
  no: { tr: 'Hayır', en: 'No' },
  which: { tr: 'Hangisi daha fazla?', en: 'Which is more?' },
  yourGuess: { tr: 'Tahminin', en: 'Your guess' },
  submit: { tr: 'Gönder', en: 'Submit' },
  next: { tr: 'Devam', en: 'Next' },
  finish: { tr: 'Bitir', en: 'Finish' },
  questionOf: { tr: 'Soru {a} / {b}', en: 'Question {a} of {b}' },
  skip: { tr: 'Geç', en: 'Skip' },

  // Reveal
  correct: { tr: 'Doğru!', en: 'Correct!' },
  wrong: { tr: 'Yanlış', en: 'Wrong' },
  spotOn: { tr: 'Tam isabet!', en: 'Spot on!' },
  closeEnough: { tr: 'Yakın sayılır', en: 'Close enough' },
  wayOff: { tr: 'Çok uzak', en: 'Way off' },
  theAnswerIs: { tr: 'Cevap', en: 'The answer is' },
  youSaid: { tr: 'Sen dedin', en: 'You said' },
  offBy: { tr: '{n} kat sapma', en: 'off by {n}x' },
  tooLow: { tr: 'Az tahmin ettin', en: 'You lowballed it' },
  tooHigh: { tr: 'Fazla tahmin ettin', en: 'You overshot' },
  points: { tr: 'puan', en: 'points' },
  source: { tr: 'Kaynak', en: 'Source' },
  andItIsNotClose: { tr: '…ve fark {n} kat.', en: '…and it is {n}x.' },

  // Results
  runComplete: { tr: 'Tur bitti', en: 'Run complete' },
  totalScore: { tr: 'Toplam', en: 'Total' },
  accuracy: { tr: 'İsabet', en: 'Accuracy' },
  bestStreak: { tr: 'En uzun seri', en: 'Best streak' },
  share: { tr: 'Paylaş', en: 'Share' },
  copied: { tr: 'Panoya kopyalandı', en: 'Copied to clipboard' },
  playAgain: { tr: 'Tekrar oyna', en: 'Play again' },
  home: { tr: 'Ana ekran', en: 'Home' },
  comeBackTomorrow: { tr: 'Yeni beşli için yarın gel.', en: 'Come back tomorrow for a new five.' },
  newBest: { tr: 'Yeni rekor!', en: 'New best!' },

  // Streak mode
  streakOver: { tr: 'Seri bitti', en: 'Streak over' },
  streakLength: { tr: 'Seri', en: 'Streak' },
  lives: { tr: 'Can', en: 'Lives' },

  // Party
  players: { tr: 'Oyuncular', en: 'Players' },
  addPlayer: { tr: 'Oyuncu ekle', en: 'Add player' },
  playerName: { tr: 'Oyuncu {n}', en: 'Player {n}' },
  startParty: { tr: 'Başlat', en: 'Start' },
  passTo: { tr: 'Telefonu {name} adlı oyuncuya ver', en: 'Pass the phone to {name}' },
  ready: { tr: 'Hazırım', en: 'Ready' },
  roundsPerPlayer: { tr: 'Kişi başı soru', en: 'Questions per player' },
  scoreboard: { tr: 'Skor tablosu', en: 'Scoreboard' },
  winner: { tr: 'Kazanan', en: 'Winner' },
  needTwoPlayers: { tr: 'En az iki oyuncu gerekli.', en: 'You need at least two players.' },
  wildestGuess: { tr: 'En saçma tahmin', en: 'Wildest guess' },

  // Stats
  gamesPlayed: { tr: 'Oynanan tur', en: 'Runs played' },
  dailyStreak: { tr: 'Günlük seri', en: 'Daily streak' },
  maxDailyStreak: { tr: 'En uzun günlük seri', en: 'Longest daily streak' },
  bestStreakRun: { tr: 'Kıyas rekoru', en: 'Comparison record' },
  totalAnswered: { tr: 'Cevaplanan soru', en: 'Questions answered' },
  byFormat: { tr: 'Formata göre isabet', en: 'Accuracy by format' },
  noStatsYet: { tr: 'Henüz veri yok. Bir tur oyna!', en: 'Nothing here yet. Play a run!' },
  resetStats: { tr: 'İstatistikleri sıfırla', en: 'Reset stats' },
  resetConfirm: { tr: 'Tüm ilerlemen silinecek. Emin misin?', en: 'This erases all your progress. Sure?' },

  // Formats (used in stats and filters)
  formatBoolean: { tr: 'Evet / Hayır', en: 'Yes / No' },
  formatNumeric: { tr: 'Sayısal tahmin', en: 'Estimation' },
  formatComparison: { tr: 'Kıyaslama', en: 'Comparison' },

  // How to play
  howBooleanTitle: { tr: 'Evet / Hayır', en: 'Yes / No' },
  howBooleanBody: {
    tr: 'Basit bir iddia. Doğru mu, değil mi? Hızlı cevap ekstra puan getirir.',
    en: 'A plain claim. True or not? Answering fast earns extra points.',
  },
  howNumericTitle: { tr: 'Sayısal tahmin', en: 'Estimation' },
  howNumericBody: {
    tr: 'Tam sayıyı bilmen gerekmiyor. Puan büyüklük sırasına göre verilir: 10 kat sapma yarı puan, 100 kat sapma sıfır. Amaç "kaç sıfırlı?" sorusunu doğru cevaplamak.',
    en: 'You do not need the exact number. Scoring is by order of magnitude: 10x off is half credit, 100x off is nothing. The question is really "how many zeros?"',
  },
  howComparisonTitle: { tr: 'Kıyaslama', en: 'Comparison' },
  howComparisonBody: {
    tr: 'İki alakasız şey, tek bir ortak birime indirgenir. Sadece hangisinin büyük olduğunu seç.',
    en: 'Two unrelated things reduced to one shared unit. Just pick the bigger one.',
  },
  howSourcesTitle: { tr: 'Kaynaklar', en: 'Sources' },
  howSourcesBody: {
    tr: 'Her sorunun kaynak bağlantısı var ve cevap ekranında görünür. Bir hata bulursan bildir — güvenilirlik burada pazarlık konusu değil.',
    en: 'Every question carries a source link, shown on the reveal screen. If you spot an error, report it — accuracy is not negotiable here.',
  },

  // Settings / misc
  language: { tr: 'Dil', en: 'Language' },
  theme: { tr: 'Tema', en: 'Theme' },
  back: { tr: 'Geri', en: 'Back' },
  close: { tr: 'Kapat', en: 'Close' },
  categoriesLabel: { tr: 'Kategoriler', en: 'Categories' },
  allCategories: { tr: 'Hepsi', en: 'All' },
  shareTitleDaily: { tr: 'Quizei — Günün Beşlisi', en: 'Quizei — Daily Five' },
} as const;

export type StringKey = keyof typeof STRINGS;

const CATEGORY_LABELS: Record<Category, { tr: string; en: string }> = {
  animals: { tr: 'Hayvanlar', en: 'Animals' },
  space: { tr: 'Uzay', en: 'Space' },
  money: { tr: 'Para', en: 'Money' },
  history: { tr: 'Tarih', en: 'History' },
  body: { tr: 'İnsan vücudu', en: 'Human body' },
  earth: { tr: 'Dünya', en: 'Earth' },
  tech: { tr: 'Teknoloji', en: 'Tech' },
  food: { tr: 'Yiyecek', en: 'Food' },
};

let currentLang: Lang = 'tr';

export function setLang(lang: Lang): void {
  currentLang = lang;
  document.documentElement.lang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

/** Detects a sensible starting language from the browser. */
export function detectLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'tr';
  return nav.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

/** t('questionOf', { a: 2, b: 5 }) -> "Question 2 of 5" */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const entry = STRINGS[key];
  let out: string = entry[currentLang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category][currentLang];
}

/** Picks the active language out of any `{ tr, en }` pair from the data files. */
export function loc(text: { tr: string; en: string }): string {
  return text[currentLang];
}

/**
 * Big numbers are the whole point of this game, so they get compact suffixes
 * in the player's language rather than a wall of digits.
 */
export function formatNumber(n: number): string {
  const locale = currentLang === 'tr' ? 'tr-TR' : 'en-US';
  const abs = Math.abs(n);

  if (abs >= 1e15 || (abs > 0 && abs < 0.001)) {
    // Beyond quadrillions, exponent notation is kinder than 18 digits.
    const exp = Math.floor(Math.log10(abs));
    const mantissa = n / 10 ** exp;
    const m = Number(mantissa.toFixed(1));
    return `${m.toLocaleString(locale)} × 10^${exp}`;
  }
  if (abs >= 1e12) return `${trim(n / 1e12, locale)} ${currentLang === 'tr' ? 'trilyon' : 'trillion'}`;
  if (abs >= 1e9) return `${trim(n / 1e9, locale)} ${currentLang === 'tr' ? 'milyar' : 'billion'}`;
  if (abs >= 1e6) return `${trim(n / 1e6, locale)} ${currentLang === 'tr' ? 'milyon' : 'million'}`;

  return n.toLocaleString(locale, { maximumFractionDigits: abs < 10 ? 2 : 0 });
}

function trim(n: number, locale: string): string {
  return Number(n.toFixed(n < 10 ? 1 : 0)).toLocaleString(locale);
}

/** Ratio shown on the reveal screen: "12x", "1.4x". */
export function formatRatio(ratio: number): string {
  if (!Number.isFinite(ratio)) return '∞';
  if (ratio >= 1000) return formatNumber(Math.round(ratio));
  return Number(ratio.toFixed(ratio < 10 ? 1 : 0)).toLocaleString(
    currentLang === 'tr' ? 'tr-TR' : 'en-US',
  );
}
