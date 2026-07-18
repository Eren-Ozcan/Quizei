import { categoryLabel, formatNumber, formatRatio, loc, t } from '../../core/i18n.ts';
import {
  comparisonRatio,
  correctSide,
  logDelta,
  MAX_LOG_ERROR,
  numericAccuracy,
} from '../../core/scoring.ts';
import { Session } from '../../core/session.ts';
import type { Answer, Question, ScoredAnswer } from '../../core/types.ts';
import { button, clear, el, nextFrame } from '../dom.ts';

export interface PartyContext {
  names: string[];
  scores: number[];
  questionsPerPlayer: number;
  /** Largest |log10(guess/answer)| seen, for the "wildest guess" award. */
  wildest: { name: string; delta: number; question: Question } | null;
}

export interface GameScreenOptions {
  session: Session;
  party?: PartyContext;
  onFinish: () => void;
  onQuit: () => void;
}

export function renderGame(opts: GameScreenOptions): HTMLElement {
  const { session, party } = opts;
  const root = el('section', { class: 'screen screen--game' });

  let awaitingPass = party !== undefined;

  function currentPlayerIndex(): number {
    if (!party) return 0;
    return Math.floor(session.index / party.questionsPerPlayer) % party.names.length;
  }

  function draw(): void {
    clear(root);

    if (session.finished || !session.current) {
      opts.onFinish();
      return;
    }

    if (party && awaitingPass) {
      root.appendChild(renderPassScreen(party.names[currentPlayerIndex()] ?? '', () => {
        awaitingPass = false;
        session.markQuestionShown();
        draw();
      }));
      return;
    }

    root.appendChild(renderHud(session, party, currentPlayerIndex()));

    const question = session.current;
    const card = el('div', { class: 'card card--question' });
    card.appendChild(
      el(
        'div',
        { class: 'card__meta' },
        el('span', { class: 'chip' }, categoryLabel(question.category)),
        el('span', { class: 'chip chip--ghost' }, formatLabel(question)),
      ),
    );

    card.appendChild(renderPrompt(question, (answer) => onAnswer(question, answer, card)));
    root.appendChild(card);
    root.appendChild(
      el('div', { class: 'game__footer' }, button(t('back'), opts.onQuit, 'btn btn--quiet btn--small')),
    );

    session.markQuestionShown();
  }

  function onAnswer(question: Question, answer: Answer, card: HTMLElement): void {
    const scored = session.answer(answer);

    if (party) {
      const idx = currentPlayerIndex();
      party.scores[idx] = (party.scores[idx] ?? 0) + scored.points;
      trackWildest(party, party.names[idx] ?? '', question, answer);
    }

    // Freeze the prompt and slide the reveal in underneath it.
    card.querySelectorAll('button, input').forEach((node) => {
      (node as HTMLButtonElement).disabled = true;
    });
    markChoices(card, question, answer);

    const reveal = renderReveal(question, scored, () => {
      const playerBefore = currentPlayerIndex();
      const keepGoing = session.advance();
      if (!keepGoing) {
        opts.onFinish();
        return;
      }
      if (party && currentPlayerIndex() !== playerBefore) awaitingPass = true;
      draw();
    });

    root.appendChild(reveal);
    nextFrame(() => reveal.classList.add('reveal--in'));
    reveal.querySelector<HTMLButtonElement>('.btn--primary')?.focus();
  }

  draw();
  return root;
}

function formatLabel(q: Question): string {
  if (q.type === 'boolean') return t('formatBoolean');
  if (q.type === 'numeric') return t('formatNumeric');
  return t('formatComparison');
}

function renderHud(session: Session, party: PartyContext | undefined, playerIdx: number): HTMLElement {
  const hud = el('div', { class: 'hud' });

  if (session.mode === 'streak') {
    hud.appendChild(stat(t('streakLength'), String(session.streak)));
    hud.appendChild(stat(t('bestStreak'), String(session.bestStreak)));
  } else {
    const total = session.total ?? 0;
    hud.appendChild(
      stat(t('questionOf', { a: session.index + 1, b: total }), '', 'hud__progress-label'),
    );
    const bar = el('div', { class: 'progress' });
    bar.appendChild(
      el('div', { class: 'progress__fill', style: `width:${(session.index / total) * 100}%` }),
    );
    hud.appendChild(bar);
  }

  if (party) {
    hud.appendChild(stat(t('players'), party.names[playerIdx] ?? ''));
  } else {
    hud.appendChild(stat(t('points'), String(session.score)));
  }

  return hud;
}

function stat(label: string, value: string, cls = ''): HTMLElement {
  return el(
    'div',
    { class: `hud__stat ${cls}`.trim() },
    el('span', { class: 'hud__label' }, label),
    value ? el('span', { class: 'hud__value' }, value) : null,
  );
}

function renderPassScreen(name: string, onReady: () => void): HTMLElement {
  return el(
    'div',
    { class: 'card card--pass' },
    el('p', { class: 'pass__label' }, t('passTo', { name })),
    el('div', { class: 'pass__name' }, name),
    button(t('ready'), onReady, 'btn btn--primary btn--wide'),
  );
}

function renderPrompt(question: Question, submit: (answer: Answer) => void): HTMLElement {
  switch (question.type) {
    case 'boolean': {
      const wrap = el('div', { class: 'prompt' });
      wrap.appendChild(el('h2', { class: 'prompt__text' }, loc(question.prompt)));
      wrap.appendChild(
        el(
          'div',
          { class: 'choices choices--binary' },
          choiceButton(t('yes'), 'yes', () => submit({ type: 'boolean', picked: true })),
          choiceButton(t('no'), 'no', () => submit({ type: 'boolean', picked: false })),
        ),
      );
      return wrap;
    }

    case 'numeric': {
      const wrap = el('div', { class: 'prompt' });
      wrap.appendChild(el('h2', { class: 'prompt__text' }, loc(question.prompt)));
      if (question.hint) {
        wrap.appendChild(el('p', { class: 'prompt__hint' }, loc(question.hint)));
      }

      const input = el('input', {
        class: 'numeric__input',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        placeholder: t('yourGuess'),
        'aria-label': t('yourGuess'),
      });

      const preview = el('div', { class: 'numeric__preview', 'aria-live': 'polite' });
      const send = el('button', { class: 'btn btn--primary btn--wide', type: 'submit', disabled: true }, t('submit'));

      const parseGuess = (): number | null => {
        const value = parseLooseNumber(input.value);
        return value === null || !Number.isFinite(value) ? null : value;
      };

      input.addEventListener('input', () => {
        const guess = parseGuess();
        send.disabled = guess === null;
        preview.textContent = guess === null ? '' : formatNumber(guess);
      });

      const form = el(
        'form',
        {
          class: 'numeric',
          onSubmit: (ev: SubmitEvent) => {
            ev.preventDefault();
            const guess = parseGuess();
            if (guess !== null) submit({ type: 'numeric', guess });
          },
        },
        el(
          'div',
          { class: 'numeric__row' },
          input,
          el('span', { class: 'numeric__unit' }, loc(question.unit)),
        ),
        preview,
        send,
      );

      wrap.appendChild(form);
      nextFrame(() => input.focus());
      return wrap;
    }

    case 'comparison': {
      const wrap = el('div', { class: 'prompt' });
      wrap.appendChild(el('h2', { class: 'prompt__text' }, t('which')));
      wrap.appendChild(el('p', { class: 'prompt__unit' }, loc(question.unit)));
      wrap.appendChild(
        el(
          'div',
          { class: 'choices choices--versus' },
          sideButton(loc(question.left.label), 'left', () =>
            submit({ type: 'comparison', picked: 'left' }),
          ),
          el('div', { class: 'versus' }, 'vs'),
          sideButton(loc(question.right.label), 'right', () =>
            submit({ type: 'comparison', picked: 'right' }),
          ),
        ),
      );
      return wrap;
    }
  }
}

function choiceButton(label: string, key: string, onClick: () => void): HTMLElement {
  return el('button', { class: 'choice', type: 'button', 'data-key': key, onClick }, label);
}

function sideButton(label: string, key: string, onClick: () => void): HTMLElement {
  return el(
    'button',
    { class: 'choice choice--side', type: 'button', 'data-key': key, onClick },
    el('span', { class: 'choice__label' }, label),
  );
}

/** Paints the picked and the correct option once the answer is locked in. */
function markChoices(card: HTMLElement, question: Question, answer: Answer): void {
  const mark = (key: string, cls: string) => {
    card.querySelector(`[data-key="${key}"]`)?.classList.add(cls);
  };

  if (question.type === 'boolean' && answer.type === 'boolean') {
    mark(question.answer ? 'yes' : 'no', 'choice--correct');
    if (answer.picked !== question.answer) mark(answer.picked ? 'yes' : 'no', 'choice--wrong');
  }

  if (question.type === 'comparison' && answer.type === 'comparison') {
    const winner = correctSide(question);
    mark(winner, 'choice--correct');
    if (answer.picked !== winner) mark(answer.picked, 'choice--wrong');
  }
}

function renderReveal(question: Question, scored: ScoredAnswer, onNext: () => void): HTMLElement {
  const panel = el('div', { class: `reveal reveal--${scored.correct ? 'good' : 'bad'}` });

  panel.appendChild(
    el(
      'div',
      { class: 'reveal__verdict' },
      el('span', { class: 'reveal__headline' }, verdictText(question, scored)),
      el('span', { class: 'reveal__points' }, `+${scored.points}`),
    ),
  );

  const detail = revealDetail(question, scored);
  if (detail) panel.appendChild(detail);

  panel.appendChild(el('p', { class: 'reveal__explain' }, loc(question.explain)));

  panel.appendChild(
    el(
      'a',
      {
        class: 'reveal__source',
        href: question.source.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      `${t('source')}: ${question.source.label}`,
    ),
  );

  panel.appendChild(button(t('next'), onNext, 'btn btn--primary btn--wide'));
  return panel;
}

function verdictText(question: Question, scored: ScoredAnswer): string {
  if (question.type !== 'numeric') return scored.correct ? t('correct') : t('wrong');
  if (scored.accuracy >= 0.98) return t('spotOn');
  if (scored.accuracy >= 0.5) return t('closeEnough');
  return t('wayOff');
}

function revealDetail(question: Question, scored: ScoredAnswer): HTMLElement | null {
  if (question.type === 'numeric' && scored.answer.type === 'numeric') {
    const guess = scored.answer.guess;
    const delta = logDelta(question, guess);
    const ratio = guess > 0 ? Math.max(guess, question.answer) / Math.min(guess, question.answer) : Infinity;

    return el(
      'div',
      { class: 'reveal__numeric' },
      el(
        'div',
        { class: 'reveal__line' },
        el('span', { class: 'reveal__key' }, t('theAnswerIs')),
        el('strong', { class: 'reveal__answer' }, `${formatNumber(question.answer)} ${loc(question.unit)}`),
      ),
      el(
        'div',
        { class: 'reveal__line reveal__line--muted' },
        el('span', { class: 'reveal__key' }, t('youSaid')),
        el('span', {}, formatNumber(guess)),
        el(
          'span',
          { class: 'reveal__delta' },
          `${t('offBy', { n: formatRatio(ratio) })} · ${Number.isNaN(delta) ? '' : delta < 0 ? t('tooLow') : t('tooHigh')}`,
        ),
      ),
      renderLogScale(question.answer, guess),
    );
  }

  if (question.type === 'comparison') {
    const ratio = comparisonRatio(question);
    const winner = correctSide(question);
    const win = question[winner];
    const lose = question[winner === 'left' ? 'right' : 'left'];

    return el(
      'div',
      { class: 'reveal__compare' },
      el(
        'div',
        { class: 'reveal__line' },
        el('strong', {}, loc(win.label)),
        el('span', { class: 'reveal__value' }, `${formatNumber(win.value)} ${loc(question.unit)}`),
      ),
      el(
        'div',
        { class: 'reveal__line reveal__line--muted' },
        el('span', {}, loc(lose.label)),
        el('span', { class: 'reveal__value' }, `${formatNumber(lose.value)} ${loc(question.unit)}`),
      ),
      el('p', { class: 'reveal__ratio' }, t('andItIsNotClose', { n: formatRatio(ratio) })),
    );
  }

  return null;
}

/**
 * A log-scale ruler showing where the guess landed relative to the truth.
 * This is what teaches the scoring rule without a paragraph of explanation.
 */
function renderLogScale(answer: number, guess: number): HTMLElement {
  const delta = guess > 0 && answer > 0 ? Math.log10(guess / answer) : -MAX_LOG_ERROR;
  const clamped = Math.max(-MAX_LOG_ERROR, Math.min(MAX_LOG_ERROR, delta));
  const pct = ((clamped + MAX_LOG_ERROR) / (2 * MAX_LOG_ERROR)) * 100;
  const accuracy = numericAccuracy(guess, answer);

  return el(
    'div',
    { class: 'logscale', title: `${Math.round(accuracy * 100)}%` },
    el('div', { class: 'logscale__track' }),
    el('div', { class: 'logscale__target' }),
    el('div', { class: 'logscale__marker', style: `left:${pct}%` }),
    el(
      'div',
      { class: 'logscale__labels' },
      el('span', {}, '÷100'),
      el('span', {}, '×1'),
      el('span', {}, '×100'),
    ),
  );
}

function trackWildest(party: PartyContext, name: string, question: Question, answer: Answer): void {
  if (question.type !== 'numeric' || answer.type !== 'numeric') return;
  const delta = Math.abs(logDelta(question, answer.guess));
  if (!Number.isFinite(delta)) return;
  if (!party.wildest || delta > party.wildest.delta) {
    party.wildest = { name, delta, question };
  }
}

/**
 * Accepts what people actually type: "1.2 milyon", "3e9", "12,5", "1 000 000".
 * Returns null when there is no number in there at all.
 */
export function parseLooseNumber(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  const multipliers: Array<[RegExp, number]> = [
    [/\b(trilyon|trillion)\b/, 1e12],
    [/\b(milyar|billion)\b/, 1e9],
    [/\b(milyon|million)\b/, 1e6],
    [/\b(bin|thousand)\b/, 1e3],
  ];

  let multiplier = 1;
  let body = text;
  for (const [pattern, value] of multipliers) {
    if (pattern.test(body)) {
      multiplier = value;
      body = body.replace(pattern, ' ');
      break;
    }
  }

  // Scientific notation passes through untouched.
  const sci = body.match(/^\s*(-?\d+(?:[.,]\d+)?)\s*e\s*(-?\d+)\s*$/);
  if (sci) {
    const mantissa = Number(sci[1]!.replace(',', '.'));
    return Number.isFinite(mantissa) ? mantissa * 10 ** Number(sci[2]) * multiplier : null;
  }

  let cleaned = body.replace(/[^\d.,-]/g, '');
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // Whichever separator comes last is the decimal one; the other groups digits.
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const groupSep = decimalSep === ',' ? '.' : ',';
    cleaned = cleaned.split(groupSep).join('').replace(decimalSep, '.');
  } else if (lastComma > -1) {
    // A lone comma is a decimal point unless it groups exactly three digits.
    const after = cleaned.length - lastComma - 1;
    cleaned = after === 3 ? cleaned.split(',').join('') : cleaned.replace(',', '.');
  } else if (lastDot > -1) {
    const after = cleaned.length - lastDot - 1;
    if (after === 3 && cleaned.split('.').length > 2) cleaned = cleaned.split('.').join('');
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value * multiplier : null;
}
