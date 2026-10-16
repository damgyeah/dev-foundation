#!/usr/bin/env node
// Keeps the foundation core block in a repository's AGENTS.md: `sync` writes it, `check` fails CI on drift.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BEGIN = /^<!-- foundation:core (\S+) ([0-9a-f]{64}) begin -->$/;
const END = '<!-- foundation:core end -->';
const BOM = '\xEF\xBB\xBF';

// Text is handled as latin1 so every byte round-trips unchanged, whatever the encoding.
const sha256 = (text) => createHash('sha256').update(text, 'latin1').digest('hex');
const toLf = (text) => text.replace(/\r\n/g, '\n');

export class FoundationError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

export function loadCore() {
  const text = toLf(readFileSync(new URL('../core/AGENTS.core.md', import.meta.url), 'latin1')).replace(/\n*$/, '\n');
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return { text, tag: `v${version}`, hash: sha256(text) };
}

export function render(core, eol = '\n') {
  const lines = [`<!-- foundation:core ${core.tag} ${core.hash} begin -->`, ...core.text.slice(0, -1).split('\n'), END];
  return lines.join(eol);
}

// Where the block sits in `body`: null when absent; throws when the markers are broken.
export function parse(body) {
  const begins = [];
  const ends = [];
  let broken = false;
  let offset = 0;
  for (const line of body.split('\n')) {
    const bare = line.replace(/\r$/, '');
    const m = BEGIN.exec(bare);
    if (m) begins.push({ offset, next: offset + line.length + 1, tag: m[1], hash: m[2] });
    else if (bare === END) ends.push(offset);
    else if (bare.includes('<!-- foundation:core')) broken = true;
    offset += line.length + 1;
  }
  if (!broken && !begins.length && !ends.length) return null;
  if (broken || begins.length !== 1 || ends.length !== 1 || ends[0] < begins[0].next) {
    throw new FoundationError('FOUNDATION_CORE_EDITED', 'the core block markers are broken; restore them by hand, then run sync');
  }
  const [begin] = begins;
  return { start: begin.offset, end: ends[0] + END.length, tag: begin.tag, hash: begin.hash, content: body.slice(begin.next, ends[0]) };
}

function split(text) {
  const bom = text.startsWith(BOM) ? BOM : '';
  return [bom, text.slice(bom.length)];
}

export function sync(text, core) {
  if (text === null) return `${render(core)}\n`;
  const [bom, body] = split(text);
  const eol = /\r?\n/.exec(body)?.[0] ?? '\n';
  const block = render(core, eol);
  const at = parse(body);
  if (at) return bom + body.slice(0, at.start) + block + body.slice(at.end);
  const gap = body === '' ? '' : (body.endsWith('\n') ? '' : eol) + eol;
  return bom + body + gap + block + eol;
}

export function check(text, core) {
  const at = text === null ? null : parse(split(text)[1]);
  if (!at) throw new FoundationError('FOUNDATION_CORE_MISSING', 'no foundation core block; run sync');
  if (sha256(toLf(at.content)) !== at.hash) {
    throw new FoundationError('FOUNDATION_CORE_EDITED', 'the core block was edited by hand; change it in dev-foundation and run sync');
  }
  if (at.tag !== core.tag || at.hash !== core.hash) {
    throw new FoundationError('FOUNDATION_CORE_STALE', `the core block is ${at.tag}, the pinned tool is ${core.tag}; run sync`);
  }
}

function main(argv) {
  const [command, ...rest] = argv;
  const i = rest.indexOf('--file');
  const file = i === -1 ? 'AGENTS.md' : rest[i + 1];
  if (!['sync', 'check'].includes(command) || !file) {
    console.error('FOUNDATION_USAGE: usage: foundation sync|check [--file AGENTS.md]');
    return 2;
  }
  const path = resolve(file);
  const core = loadCore();
  const text = existsSync(path) ? readFileSync(path, 'latin1') : null;
  try {
    if (command === 'sync') {
      const next = sync(text, core);
      if (next !== text) writeFileSync(path, next, 'latin1');
      console.log(`foundation: ${file} has core ${core.tag}`);
    } else {
      check(text, core);
      console.log(`foundation: ${file} core ${core.tag} ok`);
    }
    return 0;
  } catch (err) {
    if (!(err instanceof FoundationError)) throw err;
    console.error(err.message);
    return 1;
  }
}

// npx runs the bin through a symlink, so compare real paths.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
