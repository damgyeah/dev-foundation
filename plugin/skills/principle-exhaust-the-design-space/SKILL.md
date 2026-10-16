---
name: principle-exhaust-the-design-space
description: "Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare side by side before committing."
disable-model-invocation: true
---

# Exhaust the Design Space

When a decision has no precedent in the codebase, do not commit to the first shape that works. Build two or three competing versions and compare them side by side.

**Why:** The first idea is rarely the best one, and you cannot judge a shape against alternatives you never built. Throwaway sketches cost minutes. A wrong foundation costs every change after it.

**Pattern:**
- Make the candidates structurally different: different data shapes, ownership, or interaction models, not variations of one shape.
- Keep each one cheap: types and signatures, a throwaway HTML page, a script. Only enough to compare.
- Compare on the axes that matter for this decision (interface depth, what callers must know, how it feels to use), then pick, and graft the best parts of the losers.
- Delete the losers.

It also applies to product design decisions where the experience depends on feel, not logic. Settle those by building and looking, not by debating.

[architect](../architect/SKILL.md) applies this to code design.
