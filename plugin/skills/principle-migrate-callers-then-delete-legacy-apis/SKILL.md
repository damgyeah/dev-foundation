---
name: principle-migrate-callers-then-delete-legacy-apis
description: "Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving compatibility layers."
user-invocable: false
---

# Migrate Callers Then Delete Legacy APIs

When a new internal API replaces an old one, move every caller to the new API and delete the old one in the same wave. Do not leave both alive.

**Why:** Two ways to do one task both keep gaining callers, because the next contributor copies whichever example it finds first. A compatibility layer kept "for now" becomes permanent.

**Pattern:**
- Find every caller first (grep, the type checker, a codemod dry run), so the size of the wave is known.
- Migrate the callers, preferably with a codemod per [principle-build-the-lever](../principle-build-the-lever/SKILL.md).
- Delete the old API, its adapters, and its documentation in the same change or stack.
- Update tests to assert the new contract, and delete tests that only protect pre-refactor implementation details.

**When this applies:**
- No external users depend on backward compatibility.
- The project can absorb coordinated breaking changes.
- The new API is part of a simplification or refactor.

When external users do depend on the old API, deprecate it with a removal date instead.
