---
name: architect
description: "Sketch types, signatures, and module boundaries before writing code, compare at least two candidate shapes, get a rubber-duck critique, then implement against the chosen sketch. Use for 'architect this', 'design this', or any code that crosses a function boundary where jumping to code would lock in the wrong shape."
disable-model-invocation: true
---

# Architect

Sketch types, function signatures, and module boundaries with `not implemented` bodies and pseudocode. Compare candidate shapes, pick one, then fill in code against it.

Open a todo list with one entry per phase: Ground, Sketch, Critique, Implement, Scrap.

## Phase A: Ground the problem

Build a real model of every system the new code touches. Run [how](../how/SKILL.md) over the relevant subsystems and produce the explanation it prescribes. Naming a file is not grounding. If the design redefines ownership or layering, also run [why](../why/SKILL.md) on the existing shape, so its rationale becomes a constraint instead of a guess.

Skip Phase A only for true greenfield work with no surrounding system.

## Phase B: Sketch at least two candidates

Design it twice. Produce at least two structurally distinct candidates, whole shapes rather than point variations inside one shape, even when the first looks good enough. This is [principle-exhaust-the-design-space](../principle-exhaust-the-design-space/SKILL.md) made concrete.

Write each candidate yourself, or spawn one `general-purpose` subagent per candidate (`model: "claude-opus-5.5"`, `mode: "background"`, each in its own scratch directory or worktree) with [the sketch prompt](references/sketch-prompt.md), the Phase A grounding, and a different starting constraint, so the candidates do not converge.

Screen every candidate against [the design red flags](references/design-red-flags.md). Assume the next contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the shape where a change that looks right from one file is right for the whole repo.

Compare the survivors on interface depth. Prefer the one that hides more behind a smaller public surface. Pick a base, graft what the others did better, and record the choice in the rationale's Synthesis decision section.

## Phase C: Critique

Spawn the `rubber-duck` agent on the synthesized sketch and its rationale. Ask it for the strongest case against the shape: a missed constraint, a red flag, a simpler alternative. Fold in what holds up and record what you rejected and why. For a contested design, follow with [interrogate](../interrogate/SKILL.md).

Proceed to implementation without a human checkpoint unless the person asked for one ("stop and show me before implementing"). Then present the sketch and wait.

The sketch can land as its own commit, the scaffold-first move of [principle-foundational-thinking](../principle-foundational-thinking/SKILL.md). Planned, scoped breakage during fill-in is fine per [principle-outcome-oriented-execution](../principle-outcome-oriented-execution/SKILL.md), as long as every commit the repository requires to be green is green.

If the person pushes back on the shape, treat it as Phase A evidence. Re-ground and redo Phase B before writing more code.

## Phase D: Implement against the sketch

Replace `not implemented` bodies with code and pseudocode with logic. The sketch is the contract. A deviation is a signal to surface, not friction to absorb. If a function needs a parameter the sketch did not anticipate, decide whether the sketch was wrong, the requirement was missed, or the implementation is overreaching.

## Phase E: Scrap when the shape is wrong

If implementation keeps producing friction the sketch cannot absorb, throw the sketch out. Do not bolt fixes onto a wrong design, per [principle-redesign-from-first-principles](../principle-redesign-from-first-principles/SKILL.md) and [principle-fix-root-causes](../principle-fix-root-causes/SKILL.md).

The signal is a pattern, not one instance:

- The same workaround appears across unrelated code.
- Several unrelated edge cases each need a special branch.
- Types need escape hatches (`any`, casts, optional fields that are always set) to compile.
- A lock appears for state the sketch said was not shared.
- Callers must know the abstraction's internal rules to use it.
- Two or more Phase D deviations have the same shape.

A few edge cases do not condemn a design. Complexity in the data is not complexity in the design.

To scrap, run [how](../how/SKILL.md) over what was built, redesign as if the new constraints were day-one assumptions, make the new sketch smaller than the old one before it grows ([principle-subtract-before-you-add](../principle-subtract-before-you-add/SKILL.md)), and return to Phase B.

## Outputs

Write the caller's usage first and derive the type sketch from it. Small changes get one file of new types and signatures. Larger work gets a module map plus type definitions. The rationale ships alongside, shaped by [the rationale template](references/rationale-template.md).
