import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { check, loadCore, render, sync } from '../scripts/foundation.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TOOL = join(ROOT, 'scripts', 'foundation.mjs');
const core = loadCore();
const older = { text: 'Old core.\n', tag: 'v0.1.0', hash: createHash('sha256').update('Old core.\n').digest('hex') };

const codeOf = (fn) => {
  try {
    fn();
  } catch (err) {
    return err.code;
  }
  return 'ok';
};

test('sync creates the block when there is no file, and check passes', () => {
  const out = sync(null, core);
  assert.equal(out, `${render(core)}\n`);
  assert.equal(codeOf(() => check(out, core)), 'ok');
});

test('sync appends to a file without markers and keeps its bytes as a prefix', () => {
  for (const before of ['# Rules\n\nBe kind.\n', '# Rules\r\n\r\nBe kind.', '\xEF\xBB\xBF# Rules\n', '']) {
    const out = sync(before, core);
    assert.ok(out.startsWith(before), JSON.stringify(before));
    assert.equal(codeOf(() => check(out, core)), 'ok');
    assert.equal(sync(out, core), out, 'idempotent');
  }
});

test('sync replaces an older block and leaves every byte outside it unchanged', () => {
  const head = '# Rules\r\n\r\nKeep this.\r\n\r\n';
  const tail = '\r\n\r\nAnd this, with no final newline.';
  const before = head + render(older, '\r\n') + tail;
  assert.equal(codeOf(() => check(before, core)), 'FOUNDATION_CORE_STALE');
  const out = sync(before, core);
  assert.equal(out, head + render(core, '\r\n') + tail);
  assert.ok(!/[^\r]\n/.test(out), 'CRLF file stays CRLF');
  assert.equal(codeOf(() => check(out, core)), 'ok');
  assert.equal(sync(out, core), out, 'idempotent');
});

test('an LF file stays LF and a block at the very end is found', () => {
  const before = `# Rules\n\n${render(older)}`;
  const out = sync(before, core);
  assert.equal(out, `# Rules\n\n${render(core)}`);
  assert.ok(!out.includes('\r'));
});

test('a line-ending-only difference inside the block is not an edit', () => {
  assert.equal(codeOf(() => check(`${render(core, '\r\n')}\r\n`, core)), 'ok');
});

test('check fails with a distinct code for each problem', () => {
  const good = `# Rules\n\n${render(core)}\n`;
  assert.equal(codeOf(() => check(null, core)), 'FOUNDATION_CORE_MISSING');
  assert.equal(codeOf(() => check('# Rules\n', core)), 'FOUNDATION_CORE_MISSING');
  assert.equal(codeOf(() => check(good.replace('Reproduce it', 'Maybe reproduce it'), core)), 'FOUNDATION_CORE_EDITED');
  assert.equal(codeOf(() => check(good.replace('<!-- foundation:core end -->\n', ''), core)), 'FOUNDATION_CORE_EDITED');
  assert.equal(codeOf(() => check(good + good, core)), 'FOUNDATION_CORE_EDITED');
  assert.equal(codeOf(() => check(good.replaceAll(' -->', ' --> '), core)), 'FOUNDATION_CORE_EDITED', 'mangled markers are not "missing"');
  assert.equal(codeOf(() => check(`<!-- foundation:core v0 begin -->\n${good}`, core)), 'FOUNDATION_CORE_EDITED');
  assert.equal(codeOf(() => check(`# Rules\n\n${render(older)}\n`, core)), 'FOUNDATION_CORE_STALE');
  assert.equal(codeOf(() => sync(good + good, core)), 'FOUNDATION_CORE_EDITED', 'sync refuses broken markers');
});

test('the CLI writes the file and exits non-zero with the code on stderr', (t) => {
  const dir = join(ROOT, '.tmp', `foundation-cli-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const run = (...args) => spawnSync(process.execPath, [TOOL, ...args], { cwd: dir, encoding: 'utf8' });

  assert.equal(run('check').status, 1);
  assert.match(run('check').stderr, /^FOUNDATION_CORE_MISSING/);
  assert.equal(run('sync').status, 0);
  assert.equal(run('check').status, 0);

  const file = join(dir, 'AGENTS.md');
  writeFileSync(file, readFileSync(file, 'latin1').replace('Reproduce it', 'Maybe reproduce it'), 'latin1');
  const edited = run('check');
  assert.equal(edited.status, 1);
  assert.match(edited.stderr, /^FOUNDATION_CORE_EDITED/);

  writeFileSync(join(dir, 'OTHER.md'), `${render(older)}\n`);
  assert.match(run('check', '--file', 'OTHER.md').stderr, /^FOUNDATION_CORE_STALE/);
  assert.equal(run('lint').status, 2);
});

test('the core block never contains a marker line', () => {
  assert.ok(!core.text.includes('<!-- foundation:core'));
});
