import { t } from '../../core/i18n.ts';
import { button, el } from '../dom.ts';

export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;

export interface PartySetupResult {
  names: string[];
  questionsPerPlayer: number;
}

export function renderPartySetup(
  onStart: (result: PartySetupResult) => void,
  onBack: () => void,
): HTMLElement {
  const names: string[] = [t('playerName', { n: 1 }), t('playerName', { n: 2 })];
  let questionsPerPlayer = 3;

  const root = el('section', { class: 'screen screen--party' });
  root.appendChild(el('h1', { class: 'screen__title' }, t('modeParty')));

  const list = el('div', { class: 'players' });
  const error = el('p', { class: 'form__error', 'aria-live': 'polite' });

  function drawPlayers(): void {
    list.replaceChildren();

    names.forEach((name, i) => {
      const input = el('input', {
        class: 'players__input',
        type: 'text',
        value: name,
        maxlength: 16,
        'aria-label': t('playerName', { n: i + 1 }),
        onInput: (ev: Event) => {
          names[i] = (ev.target as HTMLInputElement).value;
        },
      });

      const row = el('div', { class: 'players__row' }, el('span', { class: 'players__num' }, String(i + 1)), input);

      if (names.length > MIN_PLAYERS) {
        row.appendChild(
          button(
            '×',
            () => {
              names.splice(i, 1);
              drawPlayers();
            },
            'btn btn--icon',
          ),
        );
      }

      list.appendChild(row);
    });

    if (names.length < MAX_PLAYERS) {
      list.appendChild(
        button(
          `+ ${t('addPlayer')}`,
          () => {
            names.push(t('playerName', { n: names.length + 1 }));
            drawPlayers();
          },
          'btn btn--quiet btn--wide',
        ),
      );
    }
  }

  drawPlayers();
  root.appendChild(el('h2', { class: 'section__title' }, t('players')));
  root.appendChild(list);

  root.appendChild(el('h2', { class: 'section__title' }, t('roundsPerPlayer')));

  const counts = el('div', { class: 'segmented' });
  const options = [2, 3, 5];

  function drawCounts(): void {
    counts.replaceChildren();
    for (const value of options) {
      counts.appendChild(
        el(
          'button',
          {
            class: `segmented__item${value === questionsPerPlayer ? ' segmented__item--on' : ''}`,
            type: 'button',
            'aria-pressed': String(value === questionsPerPlayer),
            onClick: () => {
              questionsPerPlayer = value;
              drawCounts();
            },
          },
          String(value),
        ),
      );
    }
  }
  drawCounts();
  root.appendChild(counts);
  root.appendChild(error);

  root.appendChild(
    el(
      'div',
      { class: 'form__actions' },
      button(
        t('startParty'),
        () => {
          const cleaned = names.map((n, i) => n.trim() || t('playerName', { n: i + 1 }));
          if (cleaned.length < MIN_PLAYERS) {
            error.textContent = t('needTwoPlayers');
            return;
          }
          onStart({ names: cleaned, questionsPerPlayer });
        },
        'btn btn--primary btn--wide',
      ),
      button(t('back'), onBack, 'btn btn--quiet btn--wide'),
    ),
  );

  return root;
}
