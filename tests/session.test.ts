import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Session } from '../src/core/session.ts';

test('streak mode filters to comparison questions even when the category filter would otherwise empty the pool', () => {
  // 'money' is a declared category with zero questions of any type, so
  // categories+forced-type used to intersect to empty and fall back to the
  // full unfiltered pool, letting non-comparison questions leak into streak
  // mode. See the matching fix in src/core/session.ts.
  const session = new Session({ mode: 'streak', categories: ['money'] });
  assert.equal(session.current?.type, 'comparison');
});

test('a session starts with the first question already current and unanswered', () => {
  const session = new Session({ mode: 'arena' });
  assert.equal(session.index, 0);
  assert.ok(session.current);
  assert.equal(session.finished, false);
  assert.equal(session.answers.length, 0);
});

test('advance() past the last question finishes the run', () => {
  const session = new Session({ mode: 'arena' });
  const total = session.total ?? 0;
  for (let i = 0; i < total; i++) {
    const question = session.current;
    assert.ok(question, `missing question at index ${i}`);
    session.answer(
      question.type === 'boolean'
        ? { type: 'boolean', picked: true }
        : question.type === 'numeric'
          ? { type: 'numeric', guess: 1 }
          : { type: 'comparison', picked: 'left' },
    );
    session.advance();
  }
  assert.equal(session.finished, true);
  assert.equal(session.current, null);
});
