# Opening a PR

The last step of every playbook that changes code. The repository's `CONTRIBUTING.md` and PR template win over everything here.

**Worktree.** Work in a git worktree or branch off the up-to-date base. A dirty branch with unrelated work gets a fresh worktree. Never stage another writer's changes. Run `git status` and `git diff` before `git add`, and `git diff --cached` after.

**Commits.** Commit as you go, then rebase into small, ordered commits before the PR. Each commit is landable and green and moves the story forward. Amend when a fix belongs in the commit you just made. Commit bodies do not restate the subject. Add any trailers the repository or session requires.

**Before review.** Remove leftover debug code, dead code, and needless abstraction from the diff. Run [no-comments](../../no-comments/SKILL.md). Run the repository's own checks and the `code-review` agent on the diff, and fix its real findings. Write the title, description, and commit bodies per [technical-writing](../../technical-writing/SKILL.md) and [unslop](../../unslop/SKILL.md).

**Title.** Conventional Commits, `type(scope): subject`, no trailing period, unless the repository uses another convention. The subject is short and imperative and names a real symbol when one carries the change.

**Description.** When the repository has a PR template, fill it in completely: keep its headings, comments, checklist items, and order, and give every requested validation command with its result. Without a template, write a one-minute briefing for a reviewer who has the diff, with these `##` sections in order, dropping any with nothing to say:

- `## Why`. The problem and the approach, in one to three sentences.
- `## What changed`. One to three bullets. Name both sides of a rename.
- `## Scope`. What it covers and what it leaves out.
- `## Tradeoffs`. Only alternatives a reviewer would ask about.
- `## Blast radius`. Who or what it touches, and why that is safe or risky.
- `## Verification`. One to three bullets, each a real command and its outcome. For a bug fix, the red-then-green output. For performance, one number, `before → after`, with the rest in a linked artifact.

Attach screenshots or video when they prove a claim. Logs and long tables go in a linked artifact, not the body.

**Tooling.** When the session has a built-in pull request tool, create, edit, and mark ready through it. Otherwise use `gh`. Open PRs ready for review, not as drafts, unless the repository says otherwise.

**Size and stacks.** Prefer several narrow PRs to one large one. A stacked PR targets its parent branch, and its branch rebases onto the parent's tip. Branch from the base only for independent work.

**After opening.** Post the URL and keep going. Opening a PR does not start a watch loop on it. Merging follows the repository's rules: required checks, required reviews, and who may merge. Never bypass them.
