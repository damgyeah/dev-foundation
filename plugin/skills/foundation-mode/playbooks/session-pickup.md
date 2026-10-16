# Session pickup

**You own the resume point.** Read the prior trail. Do not redo it.

1. Find the prior trail: a session id, a pull request, or a pushed branch. Read another session through the `session_store_sql` tool, scoped to its id (`SELECT turn_index, user_message, assistant_response FROM turns WHERE session_id = '<id>' ORDER BY turn_index`, with `source: "local"` if the cloud store has no rows), and never browse unrelated sessions. Read the last turns first, then scan back for the decisions. Hand a long transcript to an `explore` or `general-purpose` subagent and keep only the reduced timeline, per [principle-guard-the-context-window](../../principle-guard-the-context-window/SKILL.md).
2. Rebuild the working state: the branch and worktree, what already landed (`git log` and `git diff` against the base), open todos, decisions made, and any decision log from [show-me-your-work](../../show-me-your-work/SKILL.md). The trail is authoritative input. Resist re-deriving it.
3. Compare done with pending and name the resume point. Do not rerun the prior reproduction or redo finished work.
4. Route the rest to the matching playbook and pick the verdict: continue the work, deliver a finished recommendation, confirm or overturn a prior conclusion, or write up a failed run. This playbook ends there.
5. Verify the inherited claims against the original goal on the real artifact, per [principle-prove-it-works](../../principle-prove-it-works/SKILL.md). A prior self-report is not proof.

**Reply:** where the prior work stopped, what you inherited and what you redid (ideally nothing), the resume point, and the outcome.
