#!/usr/bin/env node
// Compares upstream pstack at its default branch against the hashes pinned in provenance/pstack.json.
// Writes a markdown report and, under GitHub Actions, sets the `drift` output. Never edits the plugin.
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function compare(pinned, current) {
  const changed = [];
  const removed = [];
  for (const entry of pinned) {
    if (!current.has(entry.path)) removed.push(entry);
    else if (current.get(entry.path) !== entry.sha256) changed.push(entry);
  }
  const known = new Set(pinned.map((e) => e.path));
  const added = [...current.keys()].filter((p) => !known.has(p)).sort();
  return { changed, removed, added };
}

export function report({ upstream, head, changed, removed, added }) {
  const base = `${upstream.repo}/blob`;
  const line = (e) => `- [\`${e.path}\`](${base}/${head}/${upstream.path}/${e.path}) (${e.status}${e.target ? ` to \`${e.target}\`` : ''})`;
  const parts = [
    `Upstream \`${upstream.path}\` at ${upstream.repo}/commit/${head} differs from the pinned commit ${upstream.commit.slice(0, 12)}.`,
    'Review each file, port what matters, then re-pin `provenance/pstack.json`.',
  ];
  const section = (title, items) => items.length && parts.push(`### ${title} (${items.length})`, items.join('\n'));
  section('Changed', changed.map(line));
  section('Removed upstream', removed.map((e) => `- \`${e.path}\` (${e.status})`));
  section('New upstream, not in provenance', added.map((p) => `- [\`${p}\`](${base}/${head}/${upstream.path}/${p})`));
  return parts.join('\n\n') + '\n';
}

async function github(url, token, raw = false) {
  const headers = { 'User-Agent': 'dev-foundation-upstream-watch' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!raw) headers.Accept = 'application/vnd.github+json';
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`UPSTREAM_FETCH_FAILED ${res.status} ${url}`);
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json();
}

async function main(out) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const { upstream, files } = JSON.parse(readFileSync(join(root, 'provenance/pstack.json'), 'utf8'));
  const slug = new URL(upstream.repo).pathname.slice(1);
  const token = process.env.GITHUB_TOKEN;
  const head = (await github(`https://api.github.com/repos/${slug}/commits/HEAD`, token)).sha;
  const tree = await github(`https://api.github.com/repos/${slug}/git/trees/${head}?recursive=1`, token);
  if (tree.truncated) throw new Error('UPSTREAM_TREE_TRUNCATED');
  const prefix = `${upstream.path}/`;
  const current = new Map();
  for (const item of tree.tree) {
    if (item.type !== 'blob' || !item.path.startsWith(prefix)) continue;
    const bytes = await github(`https://raw.githubusercontent.com/${slug}/${head}/${item.path}`, token, true);
    current.set(item.path.slice(prefix.length), createHash('sha256').update(bytes).digest('hex'));
  }
  const diff = compare(files, current);
  const drift = diff.changed.length + diff.removed.length + diff.added.length > 0;
  const text = drift ? report({ upstream, head, ...diff }) : `No drift: upstream ${head} matches the pinned hashes.\n`;
  writeFileSync(out, text);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `drift=${drift}\n`);
  console.log(text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv[2] ?? 'upstream-watch.md');
}
