---
name: foundation-mode
description: "Engineering workflow for nontrivial work in a repository: route the task to a playbook (investigation, bug fix, feature, refactoring, prototype, opening a PR, session pickup, pause safely), apply the principles that shape each decision, delegate to subagents, and prove the result before reporting. Use it first for any nontrivial task (a bug, a feature, a refactor, a design or how-and-why question, picking up or pausing work), when asked for foundation mode, or for /foundation:foundation-mode."
---

# Foundation mode

Every other foundation skill and playbook is a file next to this one. Follow the links: they work for every skill, including correct and reflect, which only a person can invoke by command.

## The repository's rules win

Before the first change, read the repository's `AGENTS.md`, `CONTRIBUTING.md`, PR template, and `.github/skills/`. Where they differ from foundation, they win. Foundation never authorizes bypassing a required review or check, an admin merge, a deploy, a consent or sign-in prompt, or anything else the repository reserves for humans. Verify live or UI behavior through the repository's own live-testing or verification skill when it has one.

## Run a playbook

Match the task to one playbook and open a todo list whose first items are its steps, copied verbatim. A step you skip stays on the list as `skip: <reason>`.

- [Investigation](playbooks/investigation.md). A read-only question: how does X work, why is Y built this way, are we sure about Z, should we do X or Y.
- [Bug fix](playbooks/bug-fix.md). A reported defect to reproduce, root-cause, and fix with runtime evidence.
- [Feature](playbooks/feature.md). New or changed behavior, built from a named data shape.
- [Refactoring](playbooks/refactoring.md). A behavior-preserving change to structure: rename, extract, inline, dedupe, move.
- [Prototype](playbooks/prototype.md). A throwaway sketch that settles a design or an empirical question by observing it.
- [Session pickup](playbooks/session-pickup.md). Resuming another agent's or session's in-flight work.
- [Pause safely](playbooks/pause-safely.md). Stopping cleanly so the work can resume, on request or before compaction.
- [Opening a PR](playbooks/opening-a-pr.md). The last step of every playbook that changes code.

When nothing fits (a large migration, a multi-day program, an overnight run), say so, write a short plan in the same shape (numbered steps that each end in a check), and follow it.

## Triggers

- Nontrivial change or "are we sure?" → [how](../how/SKILL.md). Motivation or history → [why](../why/SKILL.md).
- Code that crosses a function boundary → [architect](../architect/SKILL.md) before implementing. Name the data shape first, per [principle-model-the-domain](../principle-model-the-domain/SKILL.md).
- Contested design, or a change you do not trust → [interrogate](../interrogate/SKILL.md). What could it break elsewhere → [blast-radius](../blast-radius/SKILL.md).
- A bug with a cheap local test path → [tdd](../tdd/SKILL.md).
- A measured number you will report or act on → [benchmark-checklist](../benchmark-checklist/SKILL.md).
- A "which approach" fork whose answer you could observe by running something → the [Prototype](playbooks/prototype.md) playbook, not a question to the person.
- Any prose, your reply included → [unslop](../unslop/SKILL.md). Docs, PR descriptions, commit messages → [technical-writing](../technical-writing/SKILL.md).
- Before review → [no-comments](../no-comments/SKILL.md). Before commit, remove leftover debug code, dead code, and needless abstraction from the diff.
- The same correction twice → [correct](../correct/SKILL.md). The person says reflect → [reflect](../reflect/SKILL.md).
- Long, unattended, or multi-phase work → a decision trail with [show-me-your-work](../show-me-your-work/SKILL.md).
- A foundation skill that is wrong or broken mid-task → fix it in its own PR to dev-foundation. Do not silently work around it.

## Principles

Read a principle's file in full before you apply it. In the reply, name each principle that changed a decision and the choice it changed.

- [Laziness protocol](../principle-laziness-protocol/SKILL.md). Sizing a diff or tempted to add a layer: delete first, smallest change.
- [Foundational thinking](../principle-foundational-thinking/SKILL.md). Before logic: core types, data structures, scaffold before features.
- [Redesign from first principles](../principle-redesign-from-first-principles/SKILL.md). A new requirement in an existing design.
- [Attack the premise](../principle-attack-the-premise/SKILL.md). Two fixes on one premise have failed.
- [Subtract before you add](../principle-subtract-before-you-add/SKILL.md). Remove dead weight, then build.
- [Minimize reader load](../principle-minimize-reader-load/SKILL.md). Code that is hard to trace.
- [Outcome-oriented execution](../principle-outcome-oriented-execution/SKILL.md). Planned rewrites and migrations.
- [Experience first](../principle-experience-first/SKILL.md). Product and scope tradeoffs.
- [Exhaust the design space](../principle-exhaust-the-design-space/SKILL.md). A decision with no precedent.
- [Build the lever](../principle-build-the-lever/SKILL.md). Any nontrivial work: build the script that does or proves it.
- [Model the domain](../principle-model-the-domain/SKILL.md). Stateful or branchy code.
- [Boundary discipline](../principle-boundary-discipline/SKILL.md). Validation, errors, adapters.
- [Type system discipline](../principle-type-system-discipline/SKILL.md). Types and signatures.
- [Make operations idempotent](../principle-make-operations-idempotent/SKILL.md). Steps that run amid crashes and retries.
- [Migrate callers then delete legacy APIs](../principle-migrate-callers-then-delete-legacy-apis/SKILL.md). A new internal API with old callers.
- [Separate before serializing shared state](../principle-separate-before-serializing-shared-state/SKILL.md). Concurrent writers.
- [Prove it works](../principle-prove-it-works/SKILL.md). Before declaring done.
- [Fix root causes](../principle-fix-root-causes/SKILL.md). Debugging.
- [Sequence verifiable units](../principle-sequence-verifiable-units/SKILL.md). Multi-step work and commit order.
- [Test behavior, not implementation](../principle-test-behavior-not-implementation/SKILL.md). Writing or keeping a test.
- [Explain the number](../principle-explain-the-number/SKILL.md). A measured number.
- [Guard the context window](../principle-guard-the-context-window/SKILL.md). Large outputs and fan-out.
- [Never block on the human](../principle-never-block-on-the-human/SKILL.md). Tempted to ask on reversible work.
- [Encode lessons in structure](../principle-encode-lessons-in-structure/SKILL.md). The same instruction twice.

## Autonomy

Proceed on reversible work and report what you did. Settle an empirical fork by prototyping it. Pause for irreversible actions (force-pushing a shared branch, deploys, deleting data, messages to customers) and for anything the repository reserves for humans. Use `ask_user` only for a product or preference call no experiment can settle, and put what you found, what you propose, and why in the question itself.

No is an acceptable answer. Asked whether to do something or shown an approach, give your real judgment, including "this does not earn its place".

## Subagents

Spawn with the `task` tool. Run independent spawns in one turn with `mode: "background"`. Give each one file paths and the absolute path of any prompt file instead of pasting content.

- Code-writing and helper delegates inside a playbook step → `agent_type: "foundation:foundation-agent"`. Put this file's absolute path in its prompt. Never spawn one to run the playbook itself. The session that received foundation mode runs it.
- Read-only search → `explore`. Self-contained broad work → `general-purpose`.
- Second opinions → `rubber-duck` on a design or plan, `code-review` on a diff. Set no `model` on these two. The user's setup pins them to another model family.
- Every other spawn runs `claude-opus-5.5` at reasoning effort `high`, `xhigh` for the hardest changes, wherever the tool takes a model and an effort. Skills that prescribe their own spawns keep them.

You own every subagent's work. Read its diff and write your own summary. Give new work, a fix round, or a retry to a fresh subagent with the consolidated brief: the original ask, every later directive, and the prior report and branch. Message an existing one only when it holds state that is costly to move, such as uncommitted changes or a running process.

## Writing the reply

Write it clean the first time. A cleanup pass does not remove these patterns.

- Short declarative sentences, one thought each. No em dashes. No colon as a mid-sentence connector.
- Terse is not missing. Keep every section the playbook's reply names.
- Lead with what changes for the person who uses the work, then what the next maintainer inherits.
- Every claim carries its evidence or a label: measured, inferred, or guess. Never hand the person a check you could run.
- Link only what you produced or read in this session. PR links as `https://github.com/<owner>/<repo>/pull/<number>`.

## Comments and skills

Keep a code comment only for a non-obvious why the code cannot show. Test and verify scripts carry no step narration. The assertion message documents the step.

When you write or edit a skill, the description says when to use it in the words a person would say, the body tells the agent what to do, other skills are linked rather than restated, and every line changes a decision. Run the repository's skill lint on it.
