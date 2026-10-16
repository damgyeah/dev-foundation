## Foundation core

Engineering rules shared by our repositories, synced from
[dev-foundation](https://github.com/damgyeah/dev-foundation). Each rule says how it is held:
`(enforced: <check>)` means CI fails without it, `(judgment)` means it is on you.

### Precedence

- This repository's own rules win. Where the rest of this file, CONTRIBUTING.md, the PR template
  or the repository's skills differ from this block, follow them. (judgment)
- Never bypass a required review or check, admin-merge, deploy, or answer a sign-in or consent
  prompt the repository reserves for a person. (judgment)
- Do not edit this block by hand. Change it in dev-foundation, then run `sync`.
  (enforced: core-check)

### Fixing a bug

- Reproduce it before you change code, on the surface where it was reported. A fix without a
  reproduction is a guess. (judgment)
- Write the failing test first and run it against the unfixed code. Keep the failing output.
  (judgment)
- Commit the test and the fix together, so every commit stays green, and put the red-then-green
  output in the PR. (judgment)
- Find the root cause by ruling out hypotheses with runtime evidence, not by suppressing the
  symptom where it shows. (judgment)
- Fix every path that produces the symptom, not only the one in the report: find every writer of
  the bad state and every caller of the code you change. (judgment)
- After two failed fixes on the same premise, stop and attack the premise: what you believe about
  the cause is probably wrong. (judgment)

### Making a change

- Make the smallest complete change: everything the task needs, including callers, tests,
  fixtures and docs, and nothing it does not. Delete before you add. (judgment)
- Name the data shape before writing logic that crosses a function boundary. (judgment)

### Proving it works

- Verify on the real artifact, not a proxy: run it, read the actual output or stored value, and
  quote it. A passing unit test shows a branch works, not that the bug is gone. (judgment)
- A check you have never seen fail is not evidence. After adding or changing a test or guard,
  break what it guards on purpose, watch it fail for the right reason, then restore it. (judgment)
- Label each claim measured, inferred or guessed. Do not hand the person a check you could run.
  (judgment)

### Learning

- A correction given twice becomes a check (a test, a lint rule, a CI step), not more prose.
  Instructions nothing enforces get ignored. (judgment)

### Autonomy

- Proceed on reversible work and report what you did. Settle a factual question by running
  something, not by asking. (judgment)
- Pause before irreversible actions: force-pushing a shared branch, deploying, deleting data,
  posting anything public or messaging customers. Ask only for product or preference calls.
  (judgment)

### Depth

The optional foundation plugin has skills for depth: `how` (how code works), `why` (why it is
built this way), `architect` (designs before code), `interrogate` (adversarial review),
`blast-radius` (what a change could break) and `correct` (make a repeated mistake impossible).
The rules above stand without them.
