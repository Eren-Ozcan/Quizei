import { t } from '../../core/i18n.ts';
import * as store from '../../core/storage.ts';
import { QUESTION_TYPES, type QuestionType } from '../../core/types.ts';
import { button, el } from '../dom.ts';

export function renderStats(onBack: () => void, onChanged: () => void): HTMLElement {
  const save = store.load();
  const root = el('section', { class: 'screen screen--stats' });

  root.appendChild(el('h1', { class: 'screen__title' }, t('stats')));

  if (save.totalAnswered === 0) {
    root.appendChild(el('p', { class: 'empty' }, t('noStatsYet')));
    root.appendChild(button(t('back'), onBack, 'btn btn--quiet btn--wide'));
    return root;
  }

  const tiles = el('div', { class: 'tiles' });
  tiles.appendChild(tile(String(save.runsPlayed), t('gamesPlayed')));
  tiles.appendChild(tile(String(save.totalAnswered), t('totalAnswered')));
  tiles.appendChild(tile(`🔥 ${save.dailyStreak}`, t('dailyStreak')));
  tiles.appendChild(tile(`🔥 ${save.maxDailyStreak}`, t('maxDailyStreak')));
  tiles.appendChild(tile(String(save.bestComparisonStreak), t('bestStreakRun')));
  tiles.appendChild(tile(String(save.bestArenaScore), t('modeArena')));
  root.appendChild(tiles);

  root.appendChild(el('h2', { class: 'section__title' }, t('byFormat')));

  const bars = el('div', { class: 'bars' });
  const labels: Record<QuestionType, string> = {
    boolean: t('formatBoolean'),
    numeric: t('formatNumeric'),
    comparison: t('formatComparison'),
  };

  for (const type of QUESTION_TYPES) {
    const stat = save.formats[type];
    const pct = stat.answered > 0 ? Math.round((stat.accuracySum / stat.answered) * 100) : 0;

    bars.appendChild(
      el(
        'div',
        { class: 'bar' },
        el(
          'div',
          { class: 'bar__head' },
          el('span', {}, labels[type]),
          el('span', { class: 'bar__value' }, stat.answered > 0 ? `${pct}%` : '—'),
        ),
        el('div', { class: 'bar__track' }, el('div', { class: 'bar__fill', style: `width:${pct}%` })),
        el('span', { class: 'bar__sub' }, `${stat.answered} ${t('totalAnswered').toLowerCase()}`),
      ),
    );
  }
  root.appendChild(bars);

  root.appendChild(
    el(
      'div',
      { class: 'stats__actions' },
      button(t('back'), onBack, 'btn btn--wide'),
      button(
        t('resetStats'),
        () => {
          if (confirm(t('resetConfirm'))) {
            store.resetAll();
            onChanged();
          }
        },
        'btn btn--quiet btn--danger btn--wide',
      ),
    ),
  );

  return root;
}

function tile(value: string, label: string): HTMLElement {
  return el(
    'div',
    { class: 'tile' },
    el('span', { class: 'tile__value' }, value),
    el('span', { class: 'tile__label' }, label),
  );
}
