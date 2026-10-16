---
name: no-comments
description: "Before review, strip comments that narrate or excuse code, act on the flagged code, and offer structural encodings for constraint comments. Use for 'remove the comments', 'no comments', or the pre-review pass in foundation playbooks."
---

# No comments

A fresh subagent reviews the comments in scope. You judge its report and fix what it flags.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base branch (often `main`), working tree included.

## Steps

1. Spawn the comment reviewer with the `task` tool, `agent_type: "general-purpose"`, `model: "claude-opus-5.5"`, and the absolute path of [the comment reviewer prompt](references/comment-reviewer.md) with the scope filled in. Tell it to read that file first. Its links resolve relative to it. Do not restate its rules.
2. Check its report and its diff. Reject edits to application code, edits outside the scope, deletions the prompt's exceptions protect, `MUST KILL` flags with a false reason, and flags on intentional code that is fine. A flag to reshape a surprise in our own code stays actionable, and its comment stays deleted. A kept comment survives only with proof it describes something we cannot change. Look for lint and type-check suppressions in scope that it missed. Before accepting a thin `IMPORTANT` or `do not remove` verdict either way, investigate the symbol with [how](../how/SKILL.md) or [why](../why/SKILL.md). Restore a deletion only with an exact exception and proof. If a report is wrong, revert its changes and rerun once with the failure named. If the second report is also wrong, stop and report the pass as failed.
3. Fix trivial accepted flags directly: delete the dead path, drop the parameter, use the real API. If a fix needs a new shape, run [architect](../architect/SKILL.md) once over the accepted set and stop at the sketch.
4. Implement the smallest root-cause fix inside the scope and remove every workaround the report named. If the root cause is outside the scope, land the smallest fix inside it and report the rest as open. [principle-fix-root-causes](../principle-fix-root-causes/SKILL.md) guides the fix. It does not widen the scope. Never add a guard that hides the symptom.
5. Constraint comments (`do not remove`, `do not change wording`, `talk to X before changing`) about things we cannot change stay. For the others, offer the cheapest type, runtime check, test, or lint inside the scope that enforces the constraint. In an interactive session, wait for approval. Unattended, encode it only if the caller approved encodings up front. If approved, encode it and delete the comment. Otherwise delete the comment and report the constraint as open.
6. Report the deletion count, restored comments, reruns, any architect sketch, the fixes, the encodings offered and made, constraints left unenforced, and other open work.
