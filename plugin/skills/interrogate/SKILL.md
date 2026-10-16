---
name: interrogate
description: "Adversarial review of a change from two independent reviewers, an Opus reviewer with the full rubric and the code-review agent, judged into act on, consider, noted, and dismissed. Use for 'interrogate', 'adversarial review', 'challenge this', 'stress test this code', 'find blind spots', or a contested design before it ships."
disable-model-invocation: true
---

# Interrogate

Two reviewers challenge a change independently. The signal comes from their independence: different prompts and, for the code-review agent, the model family the user's setup pins for it. The deliverable is a judged verdict. Do not apply changes on your own.

## 1. Scope

- If the person points at files or a diff, use that.
- On a feature branch, use `git diff <base>...HEAD` for the whole change, where `<base>` is the branch the PR targets (often `main`).
- If the message refers to recent work, gather those files.

Package the diff or files with the surrounding context a reviewer needs.

## 2. Intent

Write the intent in one paragraph from the person's message, the commit messages, the PR description, and the code. If you cannot tell the intent, ask before reviewing. Reviewers judge the execution against it, not the intent itself.

## 3. Spawn both reviewers in one turn

- **Reviewer A.** The `task` tool with `agent_type: "general-purpose"`, `model: "claude-opus-5.5"`, `mode: "background"`. Its prompt is [the reviewer prompt](references/reviewer-prompt.md) filled in with the intent, the diff or files, [the rubric](references/rubric.md), and [the code-quality lens](references/code-quality-review.md). It reads and reports. It does not edit.
- **Reviewer B.** The `task` tool with `agent_type: "code-review"`, `mode: "background"`, and no `model`, so the user's setup decides it. Give it the intent, the base and head refs or the file list, and ask for high-confidence bugs, logic errors, and security issues.

## 4. Merge

Parse both reports. Merge findings that describe the same issue in different words and note who raised each. A finding both reviewers raised independently is the strongest signal. Weigh a lone finding on its evidence. Note where one reviewer says the opposite of the other.

## 5. Judge

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read [the lead-judgment framework](references/lead-judgment.md). Put every finding in one bucket, with who raised it and a one-line reason.

- **Act on.** Real issues of correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider.** Legitimate, but not clearly worth fixing now. The person should weigh them.
- **Noted.** True but not actionable: context-dependent, premature, or low impact.
- **Dismissed.** Wrong, nitpicky, or missing context, with the reason.

Trace a finding to a real call path before you act on it or dismiss it. Be slow to dismiss correctness and security findings.

## Output

```
### Intent
> <the paragraph from step 2>

### Reviewers
- Reviewer A: claude-opus-5.5, <N> findings
- Reviewer B: code-review agent, <N> findings

### Act on
<each: the issue, who raised it, why it matters>

### Consider
<each: the issue, who raised it, the tradeoff>

### Noted
<short list>

### Dismissed
<each with its reason>

### Agreement map
<where the reviewers agreed and diverged, and what that says>
```
