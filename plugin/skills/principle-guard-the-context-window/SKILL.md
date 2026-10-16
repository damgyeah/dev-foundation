---
name: principle-guard-the-context-window
description: "Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads."
disable-model-invocation: true
---

# Guard the Context Window

The main thread's context is the scarce resource. Spend it on decisions, not on raw material.

**Why:** Context overflow degrades reasoning, forces compaction that drops detail, and stalls progress.

**Pattern:**
- **Route bulk to subagents.** Broad searches, long logs, test output, and many-file reads go to a subagent (the `task` tool) that returns a summary with pointers. Keep the payload out of the main thread.
- **Pass pointers, not content.** Give subagents file paths and line ranges instead of pasting files into their prompts.
- **Read narrowly.** View line ranges, grep before you open, and filter command output (`--quiet`, `Select-Object -First`, `head`) to what you need.
- **Do not reread.** Note what you learned the first time.
- **Size phases and cap scope.** Limit the files per phase and the turns per step, and count the cost of each mechanism you add.
- **Write state down.** Long work keeps its plan and decisions in a file or todo list, so a compaction or a new session loses nothing.
