# Code archaeology (git, GitHub, and the repository)

## What this source contains

- Commit history: messages, dates, authors, diffs.
- Pull request descriptions, review comments, and discussion, through `gh`.
- GitHub issues and discussions linked from commits and pull requests.
- Code comments, TODOs, FIXMEs, and deprecation notes.
- Architecture decision records and design docs kept in the repository.
- Tests, whose names and assertions often encode the edge case behind a change.
- Files changed in the same commits (the co-change signal).
- Changelog entries and release notes.

It is tied directly to the code and is the most complete source. Everything that went through the repository is here.

## How to search it

Expand the seed commit list:

```bash
git log --follow --oneline -- <file>        # history through renames
git log -S '<exact string>' -- <file>       # commits that added or removed this text
git log -G '<regex>' -- <file>              # same, for a pattern
git blame -L <start>,<end> <file>           # who last touched each line
git show <hash>                             # one commit in full
git log <old>..<new> -p -- <file>           # changes between two points
```

Read the review history:

```bash
gh pr view <number> --json title,body,comments,reviews,closingIssuesReferences
gh pr list --state all --search '<symbol or phrase>' --limit 20
gh issue list --state all --search '<symbol or phrase>' --limit 20
gh issue view <number> --comments
```

Look for records outside the code:

```bash
git grep -l -i 'architecture decision' -- '*.md'
git grep -n -E '(TODO|FIXME|HACK|XXX|NOTE)' -- <file>
git grep -l '<symbol>' -- '*test*'
```

For defensive code, commit messages such as "fix for incident", "add defensive check", or a revert followed by "re-apply with..." are strong signals. Search for them around the dates the code was added.
