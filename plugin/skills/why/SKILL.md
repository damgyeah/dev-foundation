---
name: why
description: "Explain why code is shaped the way it is: design rationale, tradeoffs, regressions, data-backed thresholds. Searches git history, GitHub pull requests and issues, and any other evidence source available in the session in parallel, then returns a cited, confidence-tiered answer. Use how for runtime behavior."
---

# Why

Find the forces that gave code its shape. [how](../how/SKILL.md) answers what the code does. This skill answers why.

Spawn every subagent with the `task` tool, `agent_type: "general-purpose"`, `model: "claude-opus-5.5"`, independent spawns in one turn with `mode: "background"`. Investigators and the synthesizer read and query. They never write files, comment, or change external state. Give each subagent the absolute path of its prompt file under this skill's folder (the folder of this SKILL.md), plus the values for its placeholders, and tell it to read that file first. Links inside a prompt file resolve relative to it.

Work as a careful, cautious, precise investigator. Keep what you know apart from what you infer. [The epistemics guide](references/epistemics.md) is the confidence framework, and the synthesizer must follow it.

## 1. Pin the target and the question

The target is usually code, a pattern, a feature, or a named decision. The question is a rationale, a tradeoff, a motivating edge case, an external constraint, dead code, or a history sweep. If the target is vague, take your best reading from the conversation (open files, recent edits, what was just discussed), say it in one line, and proceed.

## 2. Build the code anchor

Before spawning anyone, collect the seed context yourself:

- File paths, line ranges, and key symbols.
- `git blame -L <start>,<end> <file>` for the last-touch commits.
- `git log --follow --oneline -20 -- <file>` for history through renames, with PR numbers visible.
- `git log -1 --format=%B <commit>` for the PR number and linked issues of each substantive commit.
- `gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews` for each pull request that matters.

Every investigator and the synthesizer get this anchor.

## 3. Investigate in parallel

Default to full coverage. An empty search is a finding, so document it instead of skipping it.

Source control always gets an investigator: git, `gh`, GitHub pull requests, reviews, issues and discussions, code comments, and tests. Give it [the code-archaeology playbook](references/sources/code-archaeology.md).

Then list the other evidence sources this session can reach, from the MCP servers in the tool list (search deferred tools too). Map each to one category, per [the source index](references/source-playbook.md): issue tracker, long-form documents, team chat, infrastructure observability, error tracking, product analytics. Spawn one investigator per available category in the same turn, each owning exactly one source.

Each investigator's prompt is [the investigator prompt](references/investigator-prompt.md) filled in, plus its playbook when one exists, the code anchor, and the user's question. If the target looks defensive (null checks, retries, timeouts, rate limits, feature flags, egress guards, out-of-memory handlers), tell every investigator to run incident-flavored searches in its own source.

Skip a category only with a written reason that goes in Sources consulted: no source is available ("Team chat not searched. No chat MCP in this session."), or the source is provably irrelevant ("Error tracking not searched. The target is a build-time script with no runtime path."). If the PR description already answers a trivial single-commit target completely, you may answer inline, and say so.

## 4. Synthesize

Spawn one synthesizer with [the synthesizer prompt](references/synthesizer-prompt.md), every investigator's findings including the empty ones, the skipped categories with reasons, the code anchor, and the question.

## 5. Present

Present the synthesizer's output. Edit lightly for clarity if you must. Never rewrite its confidence language.

Keep its structure: The question, The code in question, What we found, What we can reasonably infer, Competing hypotheses, What we don't know, Sources consulted, Confidence summary. Sources consulted has one line per category, including the empty and skipped ones with the reason.

If the question is a precursor to changing the code, end with the findings turned into a constraint set for the change: Preserve, Change, Avoid, Risk.

Watch for recency bias. The newest commit is rarely the whole story. The current shape is usually the sum of older decisions, so trace back.
