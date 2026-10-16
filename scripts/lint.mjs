#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.tmp']);
// Fixtures are deliberately malformed or foreign; the tests that own them check them.
const SKIP_PATHS = ['tests/fixtures'];

export const BANNED_TERMS = [
  '~/.cursor',
  '.cursor/',
  'AskQuestion',
  'subagent_type',
  '/loop',
  'Bugbot',
  'cursor-team-kit',
  'grok',
  'poteto',
  'Origin CLI',
  'agent-transcripts',
  'readonly: true',
];

// Files allowed to name the upstream's terms: the mapping that explains them, the record of what was
// taken, and this guard's own definition and tests.
const BANNED_ALLOW = [/^docs\/porting\.md$/, /^provenance\//, /^scripts\/lint\.mjs$/, /^tests\//];

// Copilot CLI slash commands that are not skills (`copilot help commands`, CLI 1.0.98).
const BUILTIN_COMMANDS = new Set([
  'add-dir', 'agent', 'allow-all', 'app', 'ask', 'autopilot', 'changelog', 'chronicle', 'clear',
  'collect-debug-logs', 'compact', 'computer', 'context', 'copy', 'cwd', 'delegate', 'diagnose', 'diff',
  'env', 'exit', 'experimental', 'feedback', 'fleet', 'footer', 'fork', 'help', 'ide', 'init',
  'instructions', 'keep-alive', 'limits', 'list-dirs', 'login', 'logout', 'lsp', 'mcp', 'memory', 'model',
  'move', 'new', 'permissions', 'plan', 'plugin', 'pr', 'refine', 'remote', 'rename', 'research',
  'reset-allowed-tools', 'restart', 'resume', 'review', 'rewind', 'rubber-duck', 'sandbox', 'search',
  'security-review', 'session', 'settings', 'share', 'skills', 'statusline', 'subagents', 'tasks',
  'terminal-setup', 'theme', 'update', 'usage', 'user', 'version', 'vim', 'voice', 'worktree',
]);

const STATUSES = new Set(['ported', 'adapted', 'deferred', 'dropped']);
const MAX_DESCRIPTION = 1024;
const SKILL_FILE = /(?:^|\/)skills\/([^/]+)\/SKILL\.md$/;

function toPosix(p) {
  return p.split(sep).join('/');
}

function walk(root, dir = root, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    const rel = toPosix(relative(root, abs));
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || SKIP_PATHS.includes(rel)) continue;
      walk(root, abs, out);
    } else {
      out.push(rel);
    }
  }
  return out;
}

export function parseFrontmatter(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const data = {};
  for (let i = 1; i < end; i++) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    let value = m[2].trim();
    if (!/^['"]/.test(value)) value = value.replace(/\s+#.*$/, '');
    if (value === '' || /^[>|][+-]?$/.test(value)) {
      const block = [];
      while (i + 1 < end && /^(\s|$)/.test(lines[i + 1])) block.push(lines[++i].trim());
      value = block.join(value.startsWith('|') ? '\n' : ' ').trim();
    } else if (/^(['"]).*\1$/.test(value)) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  return data;
}

// Markdown lines with fenced code blanked, so line numbers survive.
function proseLines(text) {
  let fence = null;
  return text.split(/\r?\n/).map((line) => {
    const f = /^\s*(```+|~~~+)/.exec(line);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return '';
    }
    return fence ? '' : line;
  });
}

function linkTargets(line) {
  const noCode = line.replace(/`[^`]*`/g, '');
  const targets = [...noCode.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^)]*["'])?\s*\)/g)].map((m) => m[1]);
  const def = /^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/.exec(noCode);
  if (def) targets.push(def[1]);
  return targets;
}

// A slash command for a plugin skill is namespaced (`/foundation:how`); the bare `/how` does not resolve.
// A skill with `disable-model-invocation: true` is hidden from the model, so prose must link to its file.
function skillRefs(line) {
  const refs = [];
  for (const m of line.matchAll(/`\/(?:([a-z0-9-]+):)?([a-z0-9][a-z0-9-]*)`/g)) {
    if (m[1]) refs.push({ name: m[2], kind: 'namespaced', plugin: m[1] });
    else if (!BUILTIN_COMMANDS.has(m[2])) refs.push({ name: m[2], kind: 'slash' });
  }
  for (const m of line.matchAll(/\*\*([a-z0-9][a-z0-9-]*)\*\* skill/g)) refs.push({ name: m[1], kind: 'bold' });
  for (const m of line.matchAll(/\bprinciple-[a-z0-9-]*[a-z0-9]/g)) refs.push({ name: m[0], kind: 'token' });
  return refs;
}

function checkRef(ref, skills, plugin) {
  if (ref.kind === 'namespaced' && ref.plugin !== plugin) {
    return ['SKILL_REF_UNKNOWN', `plugin "${ref.plugin}" is not this plugin ("${plugin ?? 'none'}")`];
  }
  if (!skills.has(ref.name)) return ['SKILL_REF_UNKNOWN', `skill "${ref.name}" does not exist`];
  if (ref.kind === 'slash') return ['SKILL_REF_UNNAMESPACED', `write \`/${plugin}:${ref.name}\`; \`/${ref.name}\` does not resolve`];
  if (ref.kind === 'bold' && skills.get(ref.name).hidden) {
    return ['SKILL_REF_HIDDEN', `"${ref.name}" is hidden from the model; link to its SKILL.md instead`];
  }
  return null;
}

export function lint(root) {
  root = resolve(root);
  const failures = [];
  const fail = (code, file, line, message) => failures.push({ code, file, line, message });
  const files = walk(root);
  const skills = new Map();
  for (const file of files) {
    const dir = SKILL_FILE.exec(file)?.[1];
    if (!dir) continue;
    const fm = parseFrontmatter(readFileSync(join(root, file), 'utf8'));
    skills.set(dir, { hidden: fm?.['disable-model-invocation'] === 'true' });
  }
  const manifest = join(root, 'plugin', 'plugin.json');
  const plugin = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).name : undefined;

  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    if (text.includes('\0')) continue;

    if (!BANNED_ALLOW.some((re) => re.test(file))) {
      text.split(/\r?\n/).forEach((line, i) => {
        const lower = line.toLowerCase();
        for (const term of BANNED_TERMS) {
          if (lower.includes(term.toLowerCase())) fail('BANNED_TERM', file, i + 1, `banned term "${term}"`);
        }
      });
    }

    const skillDir = SKILL_FILE.exec(file)?.[1];
    if (skillDir) {
      const fm = parseFrontmatter(text);
      if (!fm) {
        fail('SKILL_FRONTMATTER_MISSING', file, 1, 'SKILL.md has no frontmatter');
      } else {
        if (fm.name !== skillDir) {
          fail('SKILL_NAME_MISMATCH', file, 1, `name "${fm.name ?? ''}" does not equal directory "${skillDir}"`);
        }
        if (!fm.description) {
          fail('SKILL_DESCRIPTION_MISSING', file, 1, 'description is empty');
        } else if (fm.description.length > MAX_DESCRIPTION) {
          fail('SKILL_DESCRIPTION_TOO_LONG', file, 1, `description is ${fm.description.length} chars, max ${MAX_DESCRIPTION}`);
        }
      }
    }

    if (!file.endsWith('.md')) continue;
    proseLines(text).forEach((line, i) => {
      for (const target of linkTargets(line)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
        const path = decodeURIComponent(target.split(/[#?]/)[0]);
        if (!path) continue;
        const abs = path.startsWith('/') ? join(root, path) : resolve(root, dirname(file), path);
        if (!existsSync(abs)) fail('LINK_BROKEN', file, i + 1, `link target "${target}" does not exist`);
      }
      for (const ref of skillRefs(line)) {
        const problem = checkRef(ref, skills, plugin);
        if (problem) fail(problem[0], file, i + 1, problem[1]);
      }
    });
  }

  for (const file of files.filter((f) => /^provenance\/[^/]+\.json$/.test(f))) lintProvenance(root, file, fail);
  return failures;
}

function lintProvenance(root, file, fail) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(join(root, file), 'utf8'));
  } catch (err) {
    fail('PROVENANCE_INVALID', file, 1, `not valid JSON: ${err.message}`);
    return;
  }
  if (!doc.upstream?.repo || !/^[0-9a-f]{40}$/.test(doc.upstream?.commit ?? '') || !Array.isArray(doc.files)) {
    fail('PROVENANCE_INVALID', file, 1, 'needs upstream.repo, a 40-hex upstream.commit and a files array');
    return;
  }
  const seen = new Set();
  for (const entry of doc.files) {
    const where = entry.path ?? '(no path)';
    if (!entry.path) fail('PROVENANCE_INVALID', file, 1, 'file entry has no path');
    else if (seen.has(entry.path)) fail('PROVENANCE_DUPLICATE_PATH', file, 1, `${where} is listed twice`);
    seen.add(entry.path);
    if (!/^[0-9a-f]{64}$/.test(entry.sha256 ?? '')) fail('PROVENANCE_HASH_INVALID', file, 1, `${where} has no valid sha256`);
    if (!STATUSES.has(entry.status)) {
      fail('PROVENANCE_STATUS_INVALID', file, 1, `${where} has status "${entry.status}"`);
    } else if (entry.status === 'ported' || entry.status === 'adapted') {
      if (!entry.target || !existsSync(join(root, entry.target))) {
        fail('PROVENANCE_TARGET_MISSING', file, 1, `${where} is ${entry.status} to "${entry.target ?? ''}", which does not exist`);
      }
    } else if (!entry.reason) {
      fail('PROVENANCE_REASON_MISSING', file, 1, `${where} is ${entry.status} without a reason`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = lint(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
  for (const f of failures) console.error(`${f.code} ${f.file}:${f.line} ${f.message}`);
  if (failures.length) {
    console.error(`lint: ${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log('lint: ok');
}
