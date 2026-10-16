# Multi-phase plan

**You own the plan and the queue, not the code.** For a program of several PRs: investigation, then prototypes, then architecture, then a stack of small PRs, each proven live. Writing the plan is the first deliverable. Execution starts on the person's explicit go.

1. Size it. One or two files with an obvious approach need no plan. Say so, name [Feature](feature.md) as the route, and stop.
2. Read the repository's `AGENTS.md`, `CONTRIBUTING.md`, PR template, and `.github/skills/`. They win over this template. Name its live-testing skill, if any.
3. Investigate. Run [Investigation](investigation.md) through `explore` subagents, independent questions in one turn with `mode: "background"`, per [principle-guard-the-context-window](../../principle-guard-the-context-window/SKILL.md). Each returns file pointers, conventions, test commands, and entry points. No dumps.
4. Prototype. Settle each open question with [Prototype](prototype.md). Keep the branch, SHA, and artifacts for Appendix A. Use `ask_user` only for a product call no run can settle, with options.
5. Design. Run [architect](../../architect/SKILL.md) phases A to C on the shape, stopping before Phase D, then `rubber-duck` on the PR split.
6. Write the plan from the template below, per [technical-writing](../../technical-writing/SKILL.md) and [unslop](../../unslop/SKILL.md). One section per PR. One PR is one verifiable unit with one owner, a stable label such as `owner-p1`, per [principle-sequence-verifiable-units](../../principle-sequence-verifiable-units/SKILL.md).
7. Check the plan. Every PR section has every sub-block in the template's order and an owner label no other PR uses. Depends on names a PR or None. Each of unit, live, and perf has a box with its evidence, or `n/a: <reason>`. A verdict like "looks fine" is not a reason. A live box names a scenario, its artifact, and a pass predicate.
8. Hand back the plan path and stop.

**Verification.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are checked or carry `n/a: <reason>`, per [principle-prove-it-works](../../principle-prove-it-works/SKILL.md). Live runs at the PR head through the repository's live-testing skill, otherwise Playwright or the CLI itself. One live box replays the main scenario on trunk too. If trunk lacks the feature, record that and gate the end state the user waits for. Perf names the metric, the probe, a trunk baseline measured first, and the number that fails.

## Run the program

**State note.** Keep one lean note in the session folder. It holds decisions, the queue (PR ids in order with status), PR numbers, and each owner label's worker id, and no working detail. Update it after every change, so a fresh coordinator can resume from it alone.

**Workers.** One owner per PR, a background `task` with `agent_type: "foundation:foundation-agent"`, `claude-opus-5.5` at effort `high`. Each works in its own worktree. Before spawning, write a self-contained brief file. It holds the goal, the plan's section for that PR, the rules and files to read, the check that proves done, and what to report. The prompt gives only the brief's absolute path.

**Nested sessions.** Where the app offers them, a PR that runs long or that the person will drive gets a nested session instead. Create it without a kickoff prompt, then deliver the brief with `send_session_message`. Kickoff prompts were lost when session creation timed out (2026-10-16). A message sent after creation arrives.

**Order.** Follow the dependency graph. A stacked PR branches from its parent and targets the parent's branch. Start independent PRs together.

**Audit.** On a cadence, autopilot or a session automation, never memory, re-read the plan and state note. Judge each worker by side effects (commits, PR state, CI), not its claims. Replace a stuck worker with a fresh one given the consolidated brief. Report only changes since the last report. On the person's hold, order every worker to stop writing.

**Merge.** You own every worker's output. Read its diff and its evidence boxes, then run `code-review`. Each PR follows [Opening a PR](opening-a-pr.md) and the repository's merge rules. A PR that changes an interaction waits for the person's review with screenshots.

## Plan template

````markdown
# <Program> plan

<Under ten lines. What changes, for whom, and the PR ids in order.>

## How to read this

One box is one unit of work. It names its evidence, a file, a log line, a screenshot, a test run, or a SHA, and is checked only when that exists. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are checked or carry `n/a: <reason>`.

## Program

- [ ] The person's go, recorded in the state note at `<path>`.
- [ ] <PR id> and <PR id> are independent and branch from `main`. <PR id> stacks on <PR id>.
- [ ] <PR id> touches only `<glob>`.
- [ ] Review-gated: <PR ids that change an interaction, or None>.

## <Task as a verb phrase> (<PR id>)

**Owner.** <Stable label.> Worker or session id <set at spawn>.

**Depends on.** <PR id, or None.>

**Files.**

- [ ] Edit `<path>`.

**Build.**

- [ ] <One change. Name the symbol and the file.>

**You see.**

- [ ] <One observable result, with the exact log line or screen state.>

**Verify, unit.**

- [ ] `<command>` passes with <the case it gains>.

**Verify, live.**

- [ ] Regression against trunk. <Scenario> at trunk and head. Save `<artifact>`. Pass when <predicate>.
- [ ] <Scenario> at head. Save `<artifact>`. Pass when <predicate>.

**Verify, perf.**

- [ ] <Metric, probe, trunk baseline first, and the number that fails. Or `n/a: <reason>`.>

**Merge.**

- [ ] Required checks green at head `<sha>`.
- [ ] <Who merges, per the repository's rules.> PR number in the state note.

## Close the program

- [ ] Every box above is checked or carries `n/a: <reason>`.

## Appendix A. Prototype evidence

## Appendix B. Alternatives rejected

## Appendix C. Risks, each with the PR it lands in

## Appendix D. Reading list
````

**Reply:** the plan path, the PR ids with their owners and dependencies, the review-gated set, what the prototypes proved and what stays unproven.
