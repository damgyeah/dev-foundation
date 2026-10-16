# What the pilots found

Two offline pilots, October 2026, measured whether the foundation helps a Claude Opus 5.5 agent
(Copilot CLI) produce better changes. Each run had its own copy of the repository holding only
the history up to the task, no remote, no personal instructions and GitHub writes blocked.
Bug tasks replayed real past fixes, and were scored by the fix's own regression test, which had
to fail before that fix and pass after it. A blind judge compared each pair.

These are screens. With 8 to 13 tasks per repository they can show harm or a large effect, not a
small one.

## Pilot 1: the plugin (v0.1.0) in a repository with strong instructions

The repository already had a detailed `AGENTS.md`, seven skills and enforced checks.

| | Without | With the plugin |
|---|---|---|
| Hidden tests passed (3 bugs, 2 runs each) | 5 of 6 | 4 of 6 |
| Blind judge (6 pairs) | 2 wins | 0 wins, 4 ties |
| Planted review defects found | 4 of 4 | 4 of 4 |

The agent loaded the router in 3 of 10 runs; the always-on rule did not make it follow the
playbooks. A repository-level enable loaded nothing in a fresh environment's first session, and a
user-level install silently overrode the repository's version pin. Result: no benefit. The
plugin became an optional library (v0.2.0) and the core moved into `AGENTS.md`.

## Pilot 2: the core (v0.2.0), pre-registered

[Pre-registration](pilot-2-prereg.md), written before any run. Judge: a GPT model, judging Claude
runs with labels removed.

| Repository | Hidden tests, without / with core | Judge: without / with / tie | Pre-registered decision |
|---|---|---|---|
| Strong instructions (8 bugs) | 5/8 / 6/8 | 4 / 2 / 2 | Do not adopt |
| ljharb/qs, no agent instructions (13 bugs) | 13/13 / 13/13 | 4 / 5 / 4 | Adopt |

Both decisions rest on a one- or two-pair judge margin. Re-judging the first repository with the
pair order swapped gave 2 / 3 / 3, which would have read "adopt". Planted review defects, none of
them caught by the repository's own checks, were all found in both arms (16 of 16).

What the core measurably changed: in qs, every run with the core wrote and ran its test before
touching the source (13 of 13, against 1 of 13 without), at 22% more time and 43% more output
tokens per fix, with no change in pass rate on these tasks. In the repository with strong
instructions it changed little, because its own rules already drive verification.

## What we do with it

- New repositories and repositories without strong instructions adopt the core.
- Repositories with strong instructions of their own keep them; the core is optional there.
- The plugin is an optional user-level library.
- Nothing here supports replacing human review with agent review. That needs a comparison
  against human reviewers on harder tasks than these.
