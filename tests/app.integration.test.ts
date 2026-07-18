import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { $, $$, byText, flush, installDom, textOf } from './helpers/dom-env.ts';

let teardown: () => void;

before(() => {
  teardown = installDom();
});

after(() => teardown());

/**
 * These drive the real screens through real clicks. If a render path throws,
 * a selector goes stale, or a mode cannot be completed, it fails here rather
 * than in someone's hands.
 */

async function boot() {
  const { startApp } = await import('../src/ui/app.ts');
  const { setSavedLang } = await import('../src/core/storage.ts');
  const root = document.getElementById('app');
  assert.ok(root, '#app must exist');

  // startApp picks the language before its first render, so pin it beforehand —
  // jsdom reports en-US and these assertions read the Turkish strings.
  setSavedLang('tr');
  startApp(root);
  return root;
}

/** Answers whatever question is on screen, whichever of the three formats it is. */
async function answerCurrentQuestion(): Promise<void> {
  const numericInput = $('.numeric__input') as HTMLInputElement | null;

  if (numericInput) {
    numericInput.value = '1000';
    numericInput.dispatchEvent(new Event('input', { bubbles: true }));
    const submit = $('.numeric button[type="submit"]') as HTMLButtonElement;
    assert.ok(!submit.disabled, 'submit should enable once a number is typed');
    submit.click();
  } else {
    const choice = $('.choice') as HTMLButtonElement | null;
    assert.ok(choice, 'a question must offer either an input or choices');
    choice.click();
  }

  await flush();
}

test('the app boots to the home screen with all four modes', async () => {
  await boot();
  assert.ok($('.screen--home'), 'home screen renders');
  assert.equal($$('.mode').length, 4, 'four modes are offered');
  assert.match(textOf('.hero__title'), /Domina/);
});

test('a full daily run plays through to a shareable result', async () => {
  await boot();
  byText('.mode', 'Günün Beşlisi').click();
  await flush();

  assert.ok($('.screen--game'), 'game screen opened');

  for (let i = 0; i < 5; i++) {
    assert.ok($('.card--question'), `question ${i + 1} rendered`);

    // The reveal must always cite a source — this is the product's core promise.
    await answerCurrentQuestion();
    const source = $('.reveal__source') as HTMLAnchorElement | null;
    assert.ok(source, `question ${i + 1} shows a source`);
    assert.match(source.href, /^https:\/\//, 'source link is https');

    byText('.reveal .btn', 'Devam').click();
    await flush();
  }

  assert.ok($('.screen--result'), 'result screen reached');
  assert.equal($$('.grid__cell').length, 5, 'share grid has one cell per question');
  assert.ok($$('.breakdown__row').length === 5, 'breakdown lists every question');
  assert.ok(byText('.btn', 'Paylaş'), 'a share button is offered');
});

test('replaying the daily the same day shows the recap instead of new questions', async () => {
  await boot();
  const card = byText('.mode', 'Günün Beşlisi');
  assert.match(card.textContent ?? '', /tamamladın|Sonucu gör/, 'home reflects the finished daily');

  card.click();
  await flush();

  assert.ok($('.screen--result'), 'recap screen shown');
  assert.equal($$('.grid__cell').length, 5, 'recap keeps the original grid');
  assert.equal($('.card--question'), null, 'no new questions are dealt');
});

test('the comparison streak ends on the first wrong answer', async () => {
  await boot();
  byText('.mode', 'Kıyas Serisi').click();
  await flush();

  const { COMPARISON_QUESTIONS } = await import('../src/data/comparison.ts');
  const { loc } = await import('../src/core/i18n.ts');

  let answered = 0;
  // Deliberately pick the smaller side to force a loss within a couple of turns.
  while ($('.card--question') && answered < 30) {
    const sides = $$('.choice--side');
    assert.equal(sides.length, 2, 'streak mode only serves comparisons');

    const leftLabel = sides[0]?.textContent?.trim() ?? '';
    const question = COMPARISON_QUESTIONS.find((q) => loc(q.left.label).trim() === leftLabel);
    assert.ok(question, `question for "${leftLabel}" found in the pool`);

    const smaller = question.left.value < question.right.value ? 0 : 1;
    sides[smaller]?.click();
    await flush();
    answered++;

    byText('.reveal .btn', 'Devam').click();
    await flush();
  }

  assert.equal(answered, 1, 'a single wrong answer ends the run');
  assert.ok($('.screen--result'), 'result screen reached');
  assert.match(textOf('.result__title'), /Seri bitti/);
});

test('an arena run lasts ten questions and reports a score', async () => {
  await boot();
  byText('.mode', 'Arena').click();
  await flush();

  let count = 0;
  while ($('.card--question') && count < 20) {
    await answerCurrentQuestion();
    count++;
    byText('.reveal .btn', 'Devam').click();
    await flush();
  }

  assert.equal(count, 10, 'arena is ten questions long');
  assert.ok($('.screen--result'));
  const score = Number(textOf('.bigstat__value'));
  assert.ok(Number.isFinite(score) && score >= 0, `score should be a number, got "${score}"`);
});

test('party mode cycles players and produces a scoreboard', async () => {
  await boot();
  byText('.mode', 'Parti').click();
  await flush();

  assert.equal($$('.players__row').length, 2, 'two players by default');

  // Two questions each keeps the run short.
  byText('.segmented__item', '2').click();
  byText('.btn', 'Başlat').click();
  await flush();

  let handoffs = 0;
  let guard = 0;

  while (guard++ < 30) {
    if ($('.card--pass')) {
      handoffs++;
      byText('.card--pass .btn', 'Hazırım').click();
      await flush();
      continue;
    }
    if (!$('.card--question')) break;

    await answerCurrentQuestion();
    byText('.reveal .btn', 'Devam').click();
    await flush();
  }

  assert.equal(handoffs, 2, 'each player is handed the device once');
  assert.ok($('.party-result'), 'scoreboard rendered');
  assert.equal($$('.scoreboard__row').length, 2, 'both players are ranked');
  assert.ok(textOf('.party-result__winner').length > 0, 'a winner is named');
});

test('stats accumulate across the runs just played', async () => {
  await boot();
  byText('.btn', 'İstatistikler').click();
  await flush();

  assert.ok($('.screen--stats'));
  assert.equal($('.empty'), null, 'stats are no longer empty after playing');

  const answered = $$('.tile__value').map((n) => Number(n.textContent));
  assert.ok(
    answered.some((v) => v > 0),
    'at least one stat tile has a non-zero value',
  );
  assert.equal($$('.bar').length, 3, 'accuracy is broken down by all three formats');
});

test('switching language re-renders the interface in English', async () => {
  await boot();
  byText('.langtoggle__item', 'EN').click();
  await flush();

  assert.match(textOf('.hero__tagline'), /Absurd but true/);
  assert.ok(byText('.mode', 'Daily Five'), 'mode titles are translated');
});

test('the how-to screen explains all three formats and returns home', async () => {
  await boot();
  byText('.btn', 'Nasıl oynanır').click();
  await flush();

  assert.equal($$('.rule').length, 4, 'three formats plus the sourcing policy');

  byText('.btn', 'Geri').click();
  await flush();
  assert.ok($('.screen--home'), 'back returns to home');
});
