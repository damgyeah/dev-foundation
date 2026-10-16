# Porting pstack to foundation

`foundation` is adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) at commit `f713f14203cd6420cec13cd7c55c32d598dbab68` (v0.15.25, MIT, Lauren Tan). This page records how Cursor concepts map to the GitHub Copilot CLI runtime, what was taken, and what was left behind. [`provenance/pstack.json`](../provenance/pstack.json) lists every upstream file with its hash, its status (`ported`, `adapted`, `deferred`, or `dropped`), and its target or reason. How the CLI loads a plugin is measured in [copilot-compat.md](copilot-compat.md).

This is the one page, besides provenance, that may name the upstream's Cursor-specific terms. The lint refuses them everywhere else.

## Concept mapping

| pstack (Cursor) | foundation (Copilot) |
|---|---|
| `Task` with `subagent_type`, `readonly`, `run_in_background` | The `task` tool with `agent_type` (`explore`, `general-purpose`, `foundation:foundation-agent`, `rubber-duck`, `code-review`) and `mode: "background"`. Read-only is a prompt instruction or the `explore` agent. |
| `poteto-agent` (`agents/poteto-agent.md`) | `foundation-agent` at `plugin/com.github.copilot/agents/foundation-agent.agent.md`, spawned as `foundation:foundation-agent`. It reads foundation-mode first. A top-level `agents/` folder loads nowhere in Copilot. |
| `comment-sicko` agent | A prompt file, `no-comments/references/comment-reviewer.md`, run by a `general-purpose` subagent. |
| `poteto-mode` skill and Cursor custom mode | The `foundation-mode` skill, invoked as `/foundation:foundation-mode` or loaded by the model, plus the always-on rule `plugin/com.github.copilot/rules/foundation.mdc`, which tells the model when to load it. |
| `pstack-models.mdc`, the /setup-pstack command, per-role model lines, Grok and fast slugs | Removed. Every spawn runs `claude-opus-5.5` at effort `high` (`xhigh` for the hardest changes). Second opinions come from the `rubber-duck` (design) and `code-review` (diff) agents. Their model is left to the user's setup. |
| `arena` and multi-model bakeoffs | Removed. architect sketches two or more candidates, then asks rubber-duck. interrogate pairs an Opus reviewer with the code-review agent. |
| `AskQuestion` | `ask_user`, only for product or preference calls. |
| The /loop command | Autopilot mode or a session automation. |
| Bugbot | Copilot code review and the `code-review` agent. |
| Origin CLI | The session's built-in pull request tool, otherwise `gh`. |
| `deslop` from `cursor-team-kit` | The "before commit" line in foundation-mode and opening-a-pr, plus [unslop](../plugin/skills/unslop/SKILL.md) for prose. The `ponytail` skill, if installed, covers the same ground. |
| `control-ui` and `control-cli` | The repository's own live-testing or verification skill, otherwise Playwright. |
| `create-skill` | Short authoring rules at the end of foundation-mode and in reflect. |
| `agent-transcripts/` | The `session_store_sql` tool, scoped to one session id (`turns`, and `tool_requests` for tool calls). |
| `disable-model-invocation: true` on every skill | Kept only on `correct` and `reflect`, which only a person should start. In Copilot the flag hides a skill from the model entirely. The 24 principles use `user-invocable: false` instead: the model can load them, and they stay out of the `/` menu. |
| Slash commands such as /how and /why | Namespaced: `/foundation:how`. The bare form does not resolve. |
| The repository's rules | They win. Foundation never authorizes bypassing a required review or check, an admin merge, a deploy, or a consent or sign-in prompt. |

## What was ported

- Router: `poteto-mode` became `foundation-mode`, rewritten to under 10 KB.
- Playbooks: investigation, bug-fix, feature, refactoring, prototype, opening-a-pr, session-pickup, pause-safely. Bug fix now runs the regression check red before implementing, and commits the test and the fix together.
- Skills: how, why (git and GitHub sources only), architect, interrogate (with its rubric, lead judgment, and code-quality lens), blast-radius, tdd, correct, reflect, unslop, technical-writing, no-comments, benchmark-checklist, show-me-your-work.
- All 24 `principle-*` skills. Six whose upstream bodies were cut to a line or two were rewritten from the router's summaries.

## What was deferred

Listed so a later version can pick them up. Each has its reason in provenance.

- Playbooks: orchestrate, autopilot-full, autopilot-stack, shipping, babysit, multi-phase-plan, autonomous-run, hillclimb, perf-issue, runtime-forensics, trace-forensics, visual-parity, eval, worktree-cleanup, authoring-a-skill (replaced by inline rules).
- Skills: arena, swarm, setup-pstack, make-bot-ui, automate-me, recall, ketchup, teach, sharpen, bro, in-your-own-words, figure-it-out, create-verification-skill, maintain-verification-skill, typescript-best-practices, poteto-help.
- The benny automation.
- Every script: the Bun and TypeScript tooling under `poteto-mode/scripts/` and `show-me-your-work/scripts/log.sh`. No Bun.
- The bugbot-triage reference, which belongs with babysit.

Dropped outright: the Cursor plugin manifest, the logo and guide images, the user guide (`docs/guide/`, replaced by the README), and the why sources for Databricks, Datadog, Linear, Notion, Sentry, Slack, and incident postmortems (why keeps one generic investigator per available source).

## Staying current

`upstream-watch.yml` runs weekly. It hashes upstream pstack at its default branch against the pins in provenance and keeps one issue open while they differ. It never edits the plugin. To take an upstream change, port it by hand, then regenerate the entry's hash and status in provenance.
