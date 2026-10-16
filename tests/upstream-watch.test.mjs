import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare, report } from '../scripts/upstream-watch.mjs';

const pinned = [
  { path: 'a.md', sha256: '1', status: 'adapted', target: 'plugin/a.md' },
  { path: 'b.md', sha256: '2', status: 'deferred', reason: 'later' },
  { path: 'c.md', sha256: '3', status: 'dropped', reason: 'no' },
];

test('no drift when every pinned hash matches and nothing is new', () => {
  const current = new Map([['a.md', '1'], ['b.md', '2'], ['c.md', '3']]);
  assert.deepEqual(compare(pinned, current), { changed: [], removed: [], added: [] });
});

test('changed, removed and new upstream files are all reported', () => {
  const current = new Map([['a.md', 'x'], ['b.md', '2'], ['z.md', '9']]);
  const diff = compare(pinned, current);
  assert.deepEqual(diff.changed.map((e) => e.path), ['a.md']);
  assert.deepEqual(diff.removed.map((e) => e.path), ['c.md']);
  assert.deepEqual(diff.added, ['z.md']);

  const upstream = { repo: 'https://github.com/o/r', path: 'p', commit: 'f'.repeat(40) };
  const text = report({ upstream, head: 'abc', ...diff });
  assert.match(text, /\[`a\.md`\]\(https:\/\/github\.com\/o\/r\/blob\/abc\/p\/a\.md\) \(adapted to `plugin\/a\.md`\)/);
  assert.match(text, /- `c\.md` \(dropped\)/);
  assert.match(text, /New upstream, not in provenance \(1\)/);
});
