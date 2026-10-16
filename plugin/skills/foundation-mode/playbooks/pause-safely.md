# Pause safely

**You own a clean stop.** Leave a checkpoint a cold-start agent can resume from. Pause only when asked or when compaction is imminent. On "keep going" or "don't stop", do not pause.

1. Stop at a safe boundary. Finish the current atomic step or back out of it. Start nothing new, and stop any subagents you started.
2. Take no irreversible action to pause. No new PR and no push unless one was already out.
3. Make the work durable. Commit uncommitted edits as one clear `wip:` commit on the current branch, unless the repository forbids commits that fail its checks. Then leave them uncommitted and list them in the note. If the tree is broken, say so in one line.
4. Write the resume note outside the conversation, in the session folder or a gitignored file in the worktree: the intent, what you were doing, what is done and verified, the current state, the next steps, the key files, and the gotchas. If a [show-me-your-work](../../show-me-your-work/SKILL.md) log exists, point at it instead of repeating it.

**Reply:** where you are, what is on disk and what is only in your head (paths, no diff dumps), the commits you made and whether the tree is clean, and the first action on resume. This is a pause, not a final report.
