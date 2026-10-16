---
name: how
description: "Explain how code works: subsystem architecture, runtime flow, where things live, and placement or ownership questions (\"where should this live\", \"is this the right layer\"). Use before changing unfamiliar code. Use why for motivation."
---

# How

Answer "how does X work?" at the level a senior engineer needs to start working in the area: a working mental model, not annotated source.

Spawn every subagent with the `task` tool, `agent_type: "explore"` for explorers and `agent_type: "general-purpose"` for the explainer, `model: "claude-opus-5.5"`. Explorers and the explainer only read. Run independent spawns in one turn with `mode: "background"`. Give each subagent the absolute path of its prompt file under this skill's folder (the folder of this SKILL.md), plus the values for its placeholders, and tell it to read that file first. Links inside a prompt file resolve relative to it.

## 1. Size the question

If the scope is ambiguous, state your reading and carry on. The user can redirect.

- **Simple.** One module, one utility, or one function. Spawn one explainer that explores and explains in one pass, built from [the explainer prompt](references/explainer-prompt.md) without the findings section. Go to step 4.
- **Complex.** A subsystem across several files or services, a cross-cutting feature, or a full overview. Go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Split the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn one explorer per angle in the same turn, each with [the explorer prompt](references/explorer-prompt.md) and its angle filled in.

## 3. Synthesize (complex only)

When every explorer has returned, spawn one explainer with the explainer prompt and all findings filled in.

## 4. Present

Present the explainer's output. Light edits for clarity or for context from the conversation are fine. Do not rewrite it.

The sections are the ones the explainer prompt defines: Overview, Key concepts, How it works, Where things live, Gotchas. Drop the ones that do not apply.
