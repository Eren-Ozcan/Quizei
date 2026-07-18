import { loc, t } from '../../core/i18n.ts';
import { GRADE_EMOJI, type Grade } from '../../core/scoring.ts';
import { arenaShareText, dailyShareText, shareOrCopy, streakShareText } from '../../core/share.ts';
import type { Session } from '../../core/session.ts';
import * as store from '../../core/storage.ts';
import { todayKey } from '../../core/daily.ts';
import { button, el } from '../dom.ts';
import type { PartyContext } from './game.ts';

export interface ResultOptions {
  session: Session;
  party?: PartyContext;
  onReplay: () => void;
  onHome: () => void;
}

export function renderResult(opts: ResultOptions): HTMLElement {
  const { session, party } = opts;
  const root = el('section', { class: 'screen screen--result' });

  if (party) {
    root.appendChild(renderPartyResult(party));
    root.appendChild(actions(opts, null));
    return root;
  }

  const isRecord = commitScores(session);
  const grades = session.grades;

  root.appendChild(
    el(
      'header',
      { class: 'result__head' },
      el('h1', { class: 'result__title' }, session.mode === 'streak' ? t('streakOver') : t('runComplete')),
      isRecord ? el('span', { class: 'result__record' }, t('newBest')) : null,
    ),
  );

  root.appendChild(
    el(
      'div',
      { class: 'result__score' },
      el(
        'div',
        { class: 'bigstat' },
        el('span', { class: 'bigstat__value' }, String(session.mode === 'streak' ? session.bestStreak : session.score)),
        el('span', { class: 'bigstat__label' }, session.mode === 'streak' ? t('streakLength') : t('totalScore')),
      ),
      el(
        'div',
        { class: 'bigstat bigstat--small' },
        el('span', { class: 'bigstat__value' }, `${Math.round(session.meanAccuracy * 100)}%`),
        el('span', { class: 'bigstat__label' }, t('accuracy')),
      ),
    ),
  );

  if (session.mode !== 'streak') {
    root.appendChild(renderGrid(grades));
  }

  root.appendChild(renderBreakdown(session));

  if (session.mode === 'daily') {
    root.appendChild(el('p', { class: 'result__note' }, t('comeBackTomorrow')));
  }

  root.appendChild(actions(opts, () => shareTextFor(session)));
  return root;
}

/** Persists mode-specific records and returns whether this run set one. */
function commitScores(session: Session): boolean {
  if (session.mode === 'daily') {
    store.recordDaily({
      date: todayKey(),
      score: session.score,
      grades: session.grades,
      correct: session.correctCount,
      total: session.answers.length,
    });
    return false;
  }
  if (session.mode === 'streak') return store.recordComparisonStreak(session.bestStreak);
  if (session.mode === 'arena') return store.recordArenaScore(session.score);
  return false;
}

function shareTextFor(session: Session): string {
  if (session.mode === 'daily') {
    return dailyShareText({
      dateKey: todayKey(),
      grades: session.grades,
      score: session.score,
      streak: store.load().dailyStreak,
    });
  }
  if (session.mode === 'streak') return streakShareText(session.bestStreak);
  return arenaShareText(session.score, session.correctCount, session.answers.length);
}

function renderGrid(grades: Grade[]): HTMLElement {
  return el(
    'div',
    { class: 'grid', 'aria-label': t('accuracy') },
    ...grades.map((g) => el('span', { class: `grid__cell grid__cell--${g}` }, GRADE_EMOJI[g])),
  );
}

function renderBreakdown(session: Session): HTMLElement {
  const list = el('ul', { class: 'breakdown' });

  for (const scored of session.answers) {
    const question = session.asked.find((q) => q.id === scored.questionId);
    if (!question) continue;

    const summary =
      question.type === 'comparison'
        ? `${loc(question.left.label)} / ${loc(question.right.label)}`
        : loc(question.prompt);

    list.appendChild(
      el(
        'li',
        { class: `breakdown__row breakdown__row--${scored.correct ? 'ok' : 'no'}` },
        el('span', { class: 'breakdown__text' }, summary),
        el('span', { class: 'breakdown__points' }, `+${scored.points}`),
      ),
    );
  }

  return list;
}

function actions(opts: ResultOptions, shareText: (() => string) | null): HTMLElement {
  const row = el('div', { class: 'result__actions' });

  if (shareText) {
    const shareBtn = button(t('share'), async () => {
      const outcome = await shareOrCopy(shareText(), t('shareTitleDaily'));
      if (outcome !== 'failed') {
        shareBtn.textContent = t('copied');
        setTimeout(() => (shareBtn.textContent = t('share')), 1800);
      }
    }, 'btn btn--primary btn--wide');
    row.appendChild(shareBtn);
  }

  if (opts.session.mode !== 'daily') {
    row.appendChild(button(t('playAgain'), opts.onReplay, 'btn btn--wide'));
  }
  row.appendChild(button(t('home'), opts.onHome, 'btn btn--quiet btn--wide'));
  return row;
}

function renderPartyResult(party: PartyContext): HTMLElement {
  const wrap = el('div', { class: 'party-result' });

  const ranked = party.names
    .map((name, i) => ({ name, score: party.scores[i] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  wrap.appendChild(el('h1', { class: 'result__title' }, t('scoreboard')));

  const top = ranked[0];
  if (top) {
    wrap.appendChild(
      el(
        'div',
        { class: 'party-result__winner' },
        el('span', { class: 'bigstat__label' }, t('winner')),
        el('span', { class: 'bigstat__value' }, top.name),
      ),
    );
  }

  const list = el('ol', { class: 'scoreboard' });
  for (const entry of ranked) {
    list.appendChild(
      el(
        'li',
        { class: 'scoreboard__row' },
        el('span', { class: 'scoreboard__name' }, entry.name),
        el('span', { class: 'scoreboard__score' }, String(entry.score)),
      ),
    );
  }
  wrap.appendChild(list);

  if (party.wildest && party.wildest.delta > 1) {
    wrap.appendChild(
      el(
        'p',
        { class: 'party-result__award' },
        `🤯 ${t('wildestGuess')}: ${party.wildest.name}`,
      ),
    );
  }

  return wrap;
}
