---
name: principle-laziness-protocol
description: "Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem."
user-invocable: false
---

# Laziness Protocol

Do the least work that fully solves the problem, and leave the least code behind.

- **Delete first.** Before adding, look for what can go: dead code, unused options, a layer with one caller.
- **Minimize the diff.** Make the smallest change that solves the problem. Fewer lines beat elegant boilerplate.
- **Consolidate decisions.** Do not repeat the same choice in several places. Put it behind one source of truth and pass the result as a simple value.
- **No speculative generality.** No parameters, hooks, or abstractions for cases that do not exist yet.
- **Reuse before you write.** Use the existing helper, library, or platform feature instead of a new one.

Lazy is not incomplete. The smallest change still has to solve the whole problem and be proven to work.
