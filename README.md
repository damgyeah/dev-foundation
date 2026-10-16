# dev-foundation

Our shared engineering foundation for coding agents, in two parts:

- **The core** ([core/AGENTS.core.md](core/AGENTS.core.md)): a short set of rules that lives in each repository's own `AGENTS.md`, kept in sync from here by a tool, with a CI check that fails when it is missing, hand-edited or stale.
- **The plugin** (`foundation`, optional): playbooks, skills and principles for depth.

## Adopt in a repository

Adopt the core in new repositories and in ones without strong agent instructions of their own. A
repository that already has a detailed `AGENTS.md`, skills and enforced checks gains little from
it; see [what the pilots found](docs/pilot-results.md).

In a pull request, from the repository root:

```sh
npx --yes github:damgyeah/dev-foundation#v0.3.0 sync
```

`sync` writes the core between `<!-- foundation:core … begin -->` and `<!-- foundation:core end -->` markers in `AGENTS.md`, creating the file or appending the block if needed. Every byte outside the markers stays as it was, line endings included. Then add `.github/workflows/foundation.yml`:

```yaml
name: foundation
on: pull_request
jobs:
  core:
    uses: damgyeah/dev-foundation/.github/workflows/core-check.yml@v0.3.0
    with: { ref: v0.3.0 }
```

Write the same tag in both places. Release tags here are immutable, so a tag pin cannot move under you.

To update, bump the tag in that workflow, run `sync` with the new tag, and open a PR.

`check` (run it locally the same way) fails with one of:

| Code | Meaning | Fix |
|---|---|---|
| `FOUNDATION_CORE_MISSING` | No core block in `AGENTS.md` | Run `sync` |
| `FOUNDATION_CORE_EDITED` | The block was edited by hand, or its markers are broken | Change the core here instead, then run `sync` (fix broken markers by hand first) |
| `FOUNDATION_CORE_STALE` | The block is from another tag than the one the workflow pins | Run `sync` with the pinned tag |

Use `--file <path>` for a file other than `AGENTS.md`.

## The plugin

Adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) (MIT, Lauren Tan) for the GitHub Copilot app and CLI running Claude Opus. [docs/porting.md](docs/porting.md) says what changed and why. [provenance/pstack.json](provenance/pstack.json) records every upstream file taken, from which commit.

## Install the plugin for yourself

The plugin is optional. Install it at user level when you want depth:

```sh
copilot plugin marketplace add damgyeah/dev-foundation
copilot plugin install foundation@dev-foundation
```

Do not enable it from a repository's `.github/copilot/settings.json`. Pilot 1 (2026-10-16) measured why: a repository enable loads nothing in a fresh environment's first session (a cloud agent, a CI runner, a new machine); a user install silently overrides the repository's pinned version, since both share one cache slot; and the always-on rule the plugin used to carry was ignored in 7 of 10 runs. What every repository needs is in the core instead.

## Use it

Nothing loads on its own. Run `/foundation:foundation-mode` followed by the task, or another skill's command. Copilot may also load a skill whose description matches the task. Every skill except the principles has a command:

| Command | Use it for |
|---|---|
| `/foundation:foundation-mode` | Any nontrivial task: a bug, a feature, a refactor, a design question |
| `/foundation:how` | How does this code work, where should this live |
| `/foundation:why` | Why is it built this way, with cited history |
| `/foundation:architect` | Sketch two or more designs before writing code |
| `/foundation:interrogate` | Adversarial review of a change |
| `/foundation:blast-radius` | What else could this change break |
| `/foundation:tdd` | Fix a bug test-first |
| `/foundation:no-comments` | Strip comments that narrate or excuse code |
| `/foundation:unslop`, `/foundation:technical-writing` | Prose, docs, PR descriptions, commit messages |
| `/foundation:benchmark-checklist` | Vet a performance number before reporting it |
| `/foundation:show-me-your-work` | A decision log for long or unattended work |
| `/foundation:correct` | Make a repeated mistake impossible |
| `/foundation:reflect` | Turn this session's lessons into skill edits |

The repository's `AGENTS.md`, `CONTRIBUTING.md`, PR template, and skills win over foundation. Foundation never bypasses a required review or check, merges past a rule, deploys, or answers a consent or sign-in prompt for you.

## Work on it

```text
core/AGENTS.core.md             the core; scripts/foundation.mjs syncs and checks it
.github/workflows/core-check.yml the reusable check adopting repositories call
plugin/                         the plugin; the whole folder is copied on install
  plugin.json
  skills/<name>/SKILL.md        foundation-mode and its playbooks, 13 skills, 24 principles
  com.github.copilot/agents/    foundation-agent, the delegate subagent
.github/plugin/marketplace.json the marketplace entry for the plugin
docs/ provenance/ scripts/ tests/
```

`npm test` runs the lint (`scripts/lint.mjs`) over the repository, then the tests of the lint and of `scripts/foundation.mjs`. It needs Node 22 or later and nothing else. The lint fails with a stable code for broken links, unknown skill or agent references, frontmatter Copilot does not read, an oversized or malformed rule, a bad marketplace entry, upstream terms that must not survive the port, and incomplete provenance.

To release, bump `version` in `package.json`, run `node scripts/foundation.mjs sync` so this repository's own `AGENTS.md` carries the new core, merge, then tag `v<version>` on that commit. `core-check` in `validate.yml` fails until `AGENTS.md` matches.

Try a change in an isolated Copilot home, never your real one:

```powershell
$env:COPILOT_HOME = "$PWD\.tmp\copilot-home"
$env:GH_TOKEN = $null
copilot plugin install ./plugin
copilot skill list
```

`upstream-watch.yml` checks upstream pstack weekly and keeps one issue open while it has drifted from the pinned commit.

## License

MIT. See [LICENSE](LICENSE). Portions copyright Lauren Tan (pstack).
