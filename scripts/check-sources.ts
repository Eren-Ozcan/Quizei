/**
 * Pings every source URL in the pool and reports the dead ones.
 *
 * Kept separate from validate-questions because it needs the network and is
 * therefore not something to gate a build on. Run it before a content release.
 *
 * Usage: npm run check:sources
 */

import { ALL_QUESTIONS } from '../src/data/index.ts';

const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;

interface Result {
  url: string;
  ids: string[];
  status: number | string;
  ok: boolean;
}

const byUrl = new Map<string, string[]>();
for (const q of ALL_QUESTIONS) {
  const list = byUrl.get(q.source.url) ?? [];
  list.push(q.id);
  byUrl.set(q.source.url, list);
}

const urls = [...byUrl.keys()];
console.log(`Checking ${urls.length} unique source URLs across ${ALL_QUESTIONS.length} questions...\n`);

async function check(url: string): Promise<Result> {
  const ids = byUrl.get(url) ?? [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // HEAD first; some sites reject it, so fall back to a ranged GET.
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: { Range: 'bytes=0-2048' },
      });
    }
    return { url, ids, status: res.status, ok: res.ok };
  } catch (error) {
    const message = error instanceof Error ? error.name : 'error';
    return { url, ids, status: message, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

const results: Result[] = [];
const queue = [...urls];

await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      const result = await check(url);
      results.push(result);
      process.stdout.write(result.ok ? '.' : 'X');
    }
  }),
);

const broken = results.filter((r) => !r.ok);

console.log(`\n\n${results.length - broken.length}/${results.length} URLs reachable.`);

if (broken.length > 0) {
  console.error(`\n${broken.length} unreachable source(s):`);
  for (const r of broken) {
    console.error(`  x [${r.status}] ${r.url}`);
    console.error(`      used by: ${r.ids.join(', ')}`);
  }
  process.exit(1);
}

console.log('Every source resolves.\n');
