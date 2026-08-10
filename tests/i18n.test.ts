import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { formatNumber, formatRatio, setLang, t } from '../src/core/i18n.ts';
import { installDom } from './helpers/dom-env.ts';

let teardown: () => void;

// setLang() touches document.documentElement, so these need a DOM in place —
// same helper the integration test uses.
before(() => {
  teardown = installDom();
});

after(() => teardown());

test('formatNumber trims large negative numbers without a spurious decimal', () => {
  setLang('en');
  assert.equal(formatNumber(-500e12), '-500 trillion');
});

test('formatNumber keeps a decimal for a small-magnitude compact value', () => {
  setLang('en');
  assert.equal(formatNumber(1.2e12), '1.2 trillion');
});

test('formatNumber switches suffix by magnitude', () => {
  setLang('en');
  assert.equal(formatNumber(2.5e6), '2.5 million');
  assert.equal(formatNumber(3e9), '3 billion');
});

test('t() interpolates {var} placeholders', () => {
  setLang('en');
  assert.equal(t('questionOf', { a: 2, b: 5 }), 'Question 2 of 5');
});

test('t() switches strings with the active language', () => {
  setLang('tr');
  assert.equal(t('play'), 'Oyna');
  setLang('en');
  assert.equal(t('play'), 'Play');
});

test('formatRatio renders small ratios with one decimal, large ones as whole numbers', () => {
  setLang('en');
  assert.equal(formatRatio(1.4), '1.4');
  assert.equal(formatRatio(12), '12');
});

test('formatRatio falls back to the infinity symbol for a non-finite ratio', () => {
  assert.equal(formatRatio(Infinity), '∞');
});
