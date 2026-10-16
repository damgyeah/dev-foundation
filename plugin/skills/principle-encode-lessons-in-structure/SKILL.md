---
name: principle-encode-lessons-in-structure
description: "Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, type, metadata flag, runtime check, or script instead of more text."
disable-model-invocation: true
---

# Encode Lessons in Structure

When the same instruction or correction comes up twice, stop adding prose. Encode the rule in something that fails when the rule is broken: a type that cannot hold the bad state, a lint whose error names the fix, a test, a metadata flag, a runtime check, or a script.

**Why:** Agents and people skip text. Nothing fails when they do. A check that fails runs every time, for every contributor, and its error message teaches the rule at the moment it matters.

**Pattern:**
- Prefer, in order: remove the possibility (architecture), make it unrepresentable (types), make it fail loudly (lint, test, runtime check), and last, write it down.
- Make the error name the fix: the file, type, or function to use instead.
- Prove the check can fail. Break the thing it guards once, watch it fail for the right reason, then restore it.

If the lesson needs judgment and cannot be encoded, make the instruction more prominent and add an example of the failure.

**Corollary:** If the fix is structural, ship only the structural fix. The instruction was the symptom.
