import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseLooseNumber } from '../src/ui/screens/game.ts';

/**
 * Players type estimates the way they speak them. Anything this parser rejects
 * is a guess the player has to retype, so the accepted set is deliberately wide.
 */

test('plain integers parse', () => {
  assert.equal(parseLooseNumber('206'), 206);
  assert.equal(parseLooseNumber('  42  '), 42);
});

test('scientific notation parses', () => {
  assert.equal(parseLooseNumber('3e9'), 3e9);
  assert.equal(parseLooseNumber('1.5e12'), 1.5e12);
  assert.equal(parseLooseNumber('2E6'), 2e6);
});

test('word multipliers parse in both languages', () => {
  assert.equal(parseLooseNumber('3 milyon'), 3e6);
  assert.equal(parseLooseNumber('3 million'), 3e6);
  assert.equal(parseLooseNumber('1.5 milyar'), 1.5e9);
  assert.equal(parseLooseNumber('2 trillion'), 2e12);
  assert.equal(parseLooseNumber('5 bin'), 5000);
});

test('a lone comma reads as a decimal point, Turkish style', () => {
  assert.equal(parseLooseNumber('12,5'), 12.5);
});

test('a comma grouping three digits reads as a thousands separator', () => {
  assert.equal(parseLooseNumber('100,000'), 100_000);
});

test('mixed separators resolve by which one comes last', () => {
  assert.equal(parseLooseNumber('1.234.567,89'), 1_234_567.89);
  assert.equal(parseLooseNumber('1,234,567.89'), 1_234_567.89);
});

test('spaces used as digit grouping are ignored', () => {
  assert.equal(parseLooseNumber('1 000 000'), 1_000_000);
});

test('junk returns null instead of NaN', () => {
  assert.equal(parseLooseNumber(''), null);
  assert.equal(parseLooseNumber('   '), null);
  assert.equal(parseLooseNumber('abc'), null);
  assert.equal(parseLooseNumber('milyon'), null);
});

test('a stray unit suffix does not break the number', () => {
  assert.equal(parseLooseNumber('8849 m'), 8849);
  assert.equal(parseLooseNumber('~150 ton'), 150);
});
