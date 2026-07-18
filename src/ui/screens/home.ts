import { t } from '../../core/i18n.ts';
import { todayKey } from '../../core/daily.ts';
import * as store from '../../core/storage.ts';
import { ALL_QUESTIONS } from '../../data/index.ts';
import type { GameMode } from '../../core/types.ts';
import { el } from '../dom.ts';

export interface HomeOptions {
  onPlay: (mode: GameMode) => void;
  onStats: () => void;
  onHowTo: () => void;
  onSeeDaily: () => void;
}

export function renderHome(opts: HomeOptions): HTMLElement {
  const save = store.load();
  const dailyDone = save.lastDailyDate === todayKey();

  const root = el('section', { class: 'screen screen--home' });

  root.appendChild(
    el(
      'header',
      { class: 'hero' },
      el('h1', { class: 'hero__title' }, t('appName')),
      el('p', { class: 'hero__tagline' }, t('tagline')),
    ),
  );

  const modes = el('div', { class: 'modes' });

  modes.appendChild(
    modeCard({
      mode: 'daily',
      title: t('modeDaily'),
      desc: dailyDone ? t('dailyDoneToday') : t('modeDailyDesc'),
      badge: save.dailyStreak > 0 ? `🔥 ${save.dailyStreak}` : null,
      cta: dailyDone ? t('seeResult') : t('play'),
      featured: true,
      onClick: () => (dailyDone ? opts.onSeeDaily() : opts.onPlay('daily')),
    }),
  );

  modes.appendChild(
    modeCard({
      mode: 'arena',
      title: t('modeArena'),
      desc: t('modeArenaDesc'),
      badge: save.bestArenaScore > 0 ? String(save.bestArenaScore) : null,
      cta: t('play'),
      onClick: () => opts.onPlay('arena'),
    }),
  );

  modes.appendChild(
    modeCard({
      mode: 'streak',
      title: t('modeStreak'),
      desc: t('modeStreakDesc'),
      badge: save.bestComparisonStreak > 0 ? `🔥 ${save.bestComparisonStreak}` : null,
      cta: t('play'),
      onClick: () => opts.onPlay('streak'),
    }),
  );

  modes.appendChild(
    modeCard({
      mode: 'party',
      title: t('modeParty'),
      desc: t('modePartyDesc'),
      badge: null,
      cta: t('play'),
      onClick: () => opts.onPlay('party'),
    }),
  );

  root.appendChild(modes);

  root.appendChild(
    el(
      'nav',
      { class: 'home__links' },
      el('button', { class: 'btn btn--quiet', type: 'button', onClick: opts.onHowTo }, t('howToPlay')),
      el('button', { class: 'btn btn--quiet', type: 'button', onClick: opts.onStats }, t('stats')),
    ),
  );

  root.appendChild(
    el('p', { class: 'home__pool' }, `${ALL_QUESTIONS.length} ${t('questionsInPool')}`),
  );

  return root;
}

interface ModeCardOptions {
  mode: GameMode;
  title: string;
  desc: string;
  badge: string | null;
  cta: string;
  featured?: boolean;
  onClick: () => void;
}

function modeCard(o: ModeCardOptions): HTMLElement {
  return el(
    'button',
    {
      class: `mode mode--${o.mode}${o.featured ? ' mode--featured' : ''}`,
      type: 'button',
      onClick: o.onClick,
    },
    el(
      'div',
      { class: 'mode__head' },
      el('h2', { class: 'mode__title' }, o.title),
      o.badge ? el('span', { class: 'mode__badge' }, o.badge) : null,
    ),
    el('p', { class: 'mode__desc' }, o.desc),
    el('span', { class: 'mode__cta' }, o.cta),
  );
}
