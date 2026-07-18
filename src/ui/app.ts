import { dailyNumber } from '../core/daily.ts';
import { detectLang, getLang, setLang, t } from '../core/i18n.ts';
import { GRADE_EMOJI, type Grade } from '../core/scoring.ts';
import { dailyShareText, shareOrCopy } from '../core/share.ts';
import { Session } from '../core/session.ts';
import * as store from '../core/storage.ts';
import type { GameMode, Lang } from '../core/types.ts';
import { button, clear, el } from './dom.ts';
import { renderGame, type PartyContext } from './screens/game.ts';
import { renderHome } from './screens/home.ts';
import { renderHowTo } from './screens/howto.ts';
import { renderPartySetup } from './screens/party.ts';
import { renderResult } from './screens/result.ts';
import { renderStats } from './screens/stats.ts';

export function startApp(root: HTMLElement): void {
  const saved = store.load().lang;
  setLang(saved ?? detectLang());

  const header = el('header', { class: 'topbar' });
  const stage = el('main', { class: 'stage' });
  root.replaceChildren(header, stage);

  function show(node: HTMLElement): void {
    clear(stage);
    stage.appendChild(node);
    stage.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function drawHeader(): void {
    clear(header);
    header.appendChild(
      el('button', { class: 'topbar__brand', type: 'button', onClick: goHome }, t('appName')),
    );

    const langs: Lang[] = ['tr', 'en'];
    const toggle = el('div', { class: 'langtoggle', role: 'group', 'aria-label': t('language') });

    for (const lang of langs) {
      toggle.appendChild(
        el(
          'button',
          {
            class: `langtoggle__item${getLang() === lang ? ' langtoggle__item--on' : ''}`,
            type: 'button',
            'aria-pressed': String(getLang() === lang),
            onClick: () => {
              if (getLang() === lang) return;
              setLang(lang);
              store.setSavedLang(lang);
              drawHeader();
              // Language is a full re-render: every screen holds translated text.
              goHome();
            },
          },
          lang.toUpperCase(),
        ),
      );
    }

    header.appendChild(toggle);
  }

  function goHome(): void {
    show(
      renderHome({
        onPlay: startMode,
        onStats: goStats,
        onHowTo: () => show(renderHowTo(goHome)),
        onSeeDaily: goDailyRecap,
      }),
    );
  }

  function goStats(): void {
    show(renderStats(goHome, goStats));
  }

  function startMode(mode: GameMode): void {
    if (mode === 'party') {
      show(
        renderPartySetup(({ names, questionsPerPlayer }) => {
          const session = new Session({
            mode: 'party',
            playerCount: names.length,
            questionsPerPlayer,
          });
          const party: PartyContext = {
            names,
            scores: names.map(() => 0),
            questionsPerPlayer,
            wildest: null,
          };
          playSession(session, party);
        }, goHome),
      );
      return;
    }

    playSession(new Session({ mode }));
  }

  function playSession(session: Session, party?: PartyContext): void {
    show(
      renderGame({
        session,
        ...(party ? { party } : {}),
        onFinish: () =>
          show(
            renderResult({
              session,
              ...(party ? { party } : {}),
              onReplay: () => startMode(session.mode),
              onHome: goHome,
            }),
          ),
        onQuit: goHome,
      }),
    );
  }

  /** Shown when the player opens the daily a second time on the same day. */
  function goDailyRecap(): void {
    const last = store.load().lastDaily;
    if (!last) {
      startMode('daily');
      return;
    }

    const screen = el('section', { class: 'screen screen--result' });
    screen.appendChild(
      el('h1', { class: 'result__title' }, `${t('modeDaily')} #${dailyNumber(last.date)}`),
    );
    screen.appendChild(
      el(
        'div',
        { class: 'result__score' },
        el(
          'div',
          { class: 'bigstat' },
          el('span', { class: 'bigstat__value' }, String(last.score)),
          el('span', { class: 'bigstat__label' }, t('totalScore')),
        ),
        el(
          'div',
          { class: 'bigstat bigstat--small' },
          el('span', { class: 'bigstat__value' }, `${last.correct}/${last.total}`),
          el('span', { class: 'bigstat__label' }, t('accuracy')),
        ),
      ),
    );

    screen.appendChild(
      el(
        'div',
        { class: 'grid' },
        ...last.grades.map((g) => el('span', { class: `grid__cell grid__cell--${g}` }, gradeEmoji(g))),
      ),
    );

    screen.appendChild(el('p', { class: 'result__note' }, t('comeBackTomorrow')));

    const shareBtn = button(
      t('share'),
      async () => {
        const outcome = await shareOrCopy(
          dailyShareText({
            dateKey: last.date,
            grades: last.grades as never,
            score: last.score,
            streak: store.load().dailyStreak,
          }),
          t('shareTitleDaily'),
        );
        if (outcome !== 'failed') {
          shareBtn.textContent = t('copied');
          setTimeout(() => (shareBtn.textContent = t('share')), 1800);
        }
      },
      'btn btn--primary btn--wide',
    );

    screen.appendChild(
      el('div', { class: 'result__actions' }, shareBtn, button(t('home'), goHome, 'btn btn--quiet btn--wide')),
    );

    show(screen);
  }

  drawHeader();
  goHome();
}

function gradeEmoji(grade: string): string {
  return GRADE_EMOJI[grade as Grade] ?? '⬛';
}
