import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { lint } from '../scripts/lint.mjs';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(repo, '.tmp'), { recursive: true });
const scratch = mkdtempSync(join(repo, '.tmp', 'lint-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

let n = 0;
function tree(files) {
  const root = join(scratch, String(n++));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const skill = (name, description = 'Does a thing.', body = '') =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n${body}`;

const codes = (root) => lint(root).map((f) => f.code);

test('the repository itself is clean', () => {
  assert.deepEqual(lint(repo), []);
});

test('a well-formed skill tree passes', () => {
  const root = tree({
    'plugin/skills/how/SKILL.md': skill('how', 'Explains code.', 'See [why](../why/SKILL.md) and the **why** skill, `/why`, principle-fix-root-causes.\n'),
    'plugin/skills/why/SKILL.md': skill('why', '>-\n  Folded\n  description.'),
    'plugin/skills/principle-fix-root-causes/SKILL.md': skill('principle-fix-root-causes'),
  });
  assert.deepEqual(lint(root), []);
});

test('skill name must equal its directory', () => {
  const root = tree({ 'plugin/skills/how/SKILL.md': skill('How') });
  assert.deepEqual(codes(root), ['SKILL_NAME_MISMATCH']);
});

test('skill needs frontmatter and a description within 1024 chars', () => {
  assert.deepEqual(codes(tree({ 'plugin/skills/a/SKILL.md': '# a\n' })), ['SKILL_FRONTMATTER_MISSING']);
  assert.deepEqual(codes(tree({ 'plugin/skills/a/SKILL.md': skill('a', '') })), ['SKILL_DESCRIPTION_MISSING']);
  assert.deepEqual(codes(tree({ 'plugin/skills/a/SKILL.md': skill('a', 'x'.repeat(1025)) })), ['SKILL_DESCRIPTION_TOO_LONG']);
  assert.deepEqual(codes(tree({ 'plugin/skills/a/SKILL.md': skill('a', 'x'.repeat(1024)) })), []);
  const long = `>\n  First paragraph.\n\n  ${'x'.repeat(1100)}`;
  assert.deepEqual(codes(tree({ 'plugin/skills/a/SKILL.md': skill('a', long) })), ['SKILL_DESCRIPTION_TOO_LONG']);
});

test('a broken relative link fails with its location', () => {
  const root = tree({ 'docs/a.md': 'ok\n[gone](./missing.md#part)\n' });
  assert.deepEqual(lint(root), [
    { code: 'LINK_BROKEN', file: 'docs/a.md', line: 2, message: 'link target "./missing.md#part" does not exist' },
  ]);
});

test('external links, anchors and links inside code are not followed', () => {
  const root = tree({ 'docs/a.md': '[x](https://example.com) [y](#top) `[z](nope.md)`\n```\n[w](nope.md)\n```\n' });
  assert.deepEqual(lint(root), []);
});

test('an unknown skill reference fails', () => {
  assert.deepEqual(codes(tree({ 'docs/a.md': 'Use the **missing** skill.\n' })), ['SKILL_REF_UNKNOWN']);
  assert.deepEqual(codes(tree({ 'docs/a.md': 'Run `/missing`.\n' })), ['SKILL_REF_UNKNOWN']);
  assert.deepEqual(codes(tree({ 'docs/a.md': 'Read principle-missing first.\n' })), ['SKILL_REF_UNKNOWN']);
  assert.deepEqual(codes(tree({ 'docs/a.md': 'Run `/plan`, `/init` then `/add-dir`.\n' })), []);
});

test('banned terms fail anywhere except the allowlist', () => {
  const root = tree({
    'plugin/skills/a/SKILL.md': skill('a', 'Uses AskQuestion.'),
    '.github/workflows/x.yml': 'run: grok\n',
    'plugin/scripts/setup': 'cat ~/.cursor/rules\n',
    'plugin/logo.png': 'grok\0',
    'docs/porting.md': 'AskQuestion maps to ask_user.\n',
    'provenance/notes.txt': 'subagent_type\n',
  });
  assert.deepEqual(
    lint(root).map((f) => [f.code, f.file, f.message]),
    [
      ['BANNED_TERM', '.github/workflows/x.yml', 'banned term "grok"'],
      ['BANNED_TERM', 'plugin/scripts/setup', 'banned term "~/.cursor"'],
      ['BANNED_TERM', 'plugin/scripts/setup', 'banned term ".cursor/"'],
      ['BANNED_TERM', 'plugin/skills/a/SKILL.md', 'banned term "AskQuestion"'],
    ],
  );
});

const prov = (files) => JSON.stringify({ upstream: { repo: 'https://example.com/r', commit: 'a'.repeat(40) }, files });
const hash = 'b'.repeat(64);

test('provenance entries must be complete and point at real targets', () => {
  const ok = tree({
    'plugin/skills/a/SKILL.md': skill('a'),
    'provenance/up.json': prov([
      { path: 'skills/a/SKILL.md', sha256: hash, status: 'adapted', target: 'plugin/skills/a/SKILL.md' },
      { path: 'skills/b/SKILL.md', sha256: hash, status: 'deferred', reason: 'later' },
    ]),
  });
  assert.deepEqual(lint(ok), []);

  const bad = tree({
    'provenance/up.json': prov([
      { path: 'a', sha256: hash, status: 'ported', target: 'plugin/nope.md' },
      { path: 'b', sha256: hash, status: 'dropped' },
      { path: 'c', sha256: 'short', status: 'deferred', reason: 'x' },
      { path: 'd', sha256: hash, status: 'copied' },
      { path: 'd', sha256: hash, status: 'deferred', reason: 'x' },
    ]),
  });
  assert.deepEqual(codes(bad), [
    'PROVENANCE_TARGET_MISSING',
    'PROVENANCE_REASON_MISSING',
    'PROVENANCE_HASH_INVALID',
    'PROVENANCE_STATUS_INVALID',
    'PROVENANCE_DUPLICATE_PATH',
  ]);
  assert.deepEqual(codes(tree({ 'provenance/up.json': '{' })), ['PROVENANCE_INVALID']);
});

test('fixtures and scratch directories are not linted', () => {
  const root = tree({ 'tests/fixtures/x/skills/a/SKILL.md': '# grok\n', '.tmp/b.md': '[x](nope.md)\n' });
  assert.deepEqual(lint(root), []);
});
