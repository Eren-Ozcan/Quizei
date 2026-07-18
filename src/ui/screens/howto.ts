import { t } from '../../core/i18n.ts';
import { button, el } from '../dom.ts';

export function renderHowTo(onBack: () => void): HTMLElement {
  const root = el('section', { class: 'screen screen--howto' });

  root.appendChild(el('h1', { class: 'screen__title' }, t('howToPlay')));

  root.appendChild(rule('✅', t('howBooleanTitle'), t('howBooleanBody')));
  root.appendChild(rule('📏', t('howNumericTitle'), t('howNumericBody')));
  root.appendChild(rule('⚖️', t('howComparisonTitle'), t('howComparisonBody')));
  root.appendChild(rule('🔗', t('howSourcesTitle'), t('howSourcesBody')));

  root.appendChild(button(t('back'), onBack, 'btn btn--wide'));
  return root;
}

function rule(icon: string, title: string, body: string): HTMLElement {
  return el(
    'article',
    { class: 'rule' },
    el('div', { class: 'rule__icon' }, icon),
    el(
      'div',
      { class: 'rule__body' },
      el('h2', { class: 'rule__title' }, title),
      el('p', { class: 'rule__text' }, body),
    ),
  );
}
