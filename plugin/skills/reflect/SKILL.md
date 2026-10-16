---
name: reflect
description: "Mine the current session for durable learnings with three parallel reviewers, then route each to a concrete edit on a skill the session used. Use when the person says reflect or asks what this session should teach future agents."
disable-model-invocation: true
---

# Reflect

Turn this session's corrections and discoveries into skill edits. Skip it when the session was trivial, off-topic, or followed an existing skill correctly. One-offs are not learnings.

## 1. Find the transcript

The session folder named in the system prompt ends in this session's id. Reviewers read the session through the `session_store_sql` tool, scoped to that id and never to other sessions:

```sql
SELECT turn_index, user_message, assistant_response
FROM turns WHERE session_id = '<id>' ORDER BY turn_index
```

If the cloud store has no rows yet, run the same query with `source: "local"`. If neither has the session, write a tight digest of the session yourself and pass that instead.

## 2. Spawn three reviewers in one turn

Use the `task` tool, `agent_type: "general-purpose"`, `model: "claude-opus-5.5"`, `mode: "background"`. Reviewers read and query. They never edit.

| Lens | Prompt |
|---|---|
| Judgment | [judgment-reviewer.md](references/judgment-reviewer.md) |
| Tooling | [tooling-reviewer.md](references/tooling-reviewer.md) |
| Divergent | [divergent-reviewer.md](references/divergent-reviewer.md) |

Pass each prompt verbatim with the session id or the digest filled in where marked.

## 3. Synthesize

Spawn one more `general-purpose` subagent the same way with [synthesizer.md](references/synthesizer.md) and every reviewer's full output inlined where marked. It returns Accepted, Rejected, and Backlog lists.

## 4. Check for a structural fix

Move to Backlog any Accepted item that a lint, script, metadata flag, or runtime check would enforce better than prose, per [principle-encode-lessons-in-structure](../principle-encode-lessons-in-structure/SKILL.md).

## 5. Apply after approval

Present the full Accepted, Rejected, and Backlog output and wait for the person to approve rows. Skill changes reach every future agent, so never apply them unapproved. Backlog items need no approval to be written down. File them where the repository tracks such work, or list them in the reply if it has no place for them.

Apply each approved row as routed:

- A small edit (a bullet, a tightened sentence, a stale fact) goes straight into the skill.
- A larger edit, a description tune, or a new skill follows these rules. The description says when to use the skill, front-loaded with the words a person would say, under 1024 characters. The body tells the agent what to do, not why, unless the rule is confusing without the reason. Delegate to other skills by link instead of restating them. Delete any line that does not change a decision.

Run the repository's skill lint (`npm test` in dev-foundation) on every skill you touched.

## 6. Reply

A short list, no preamble:

- Edits applied: the skill path and what changed, one line each.
- New skills: the path, one line each.
- Backlog: each item's title and where it went.
- Dropped: one line per rejected finding with the synthesizer's reason.
