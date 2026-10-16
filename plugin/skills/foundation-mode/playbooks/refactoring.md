# Refactoring

**You own the contract. The structure changes. The behavior does not.** [Feature](feature.md) adds behavior and [Bug fix](bug-fix.md) corrects it.

If the cleanup reveals a missing feature or a real bug, split it out and ship the structural change first against the pinned contract. A redesign is allowed, but name it and route it to Feature.

1. Pin the behavior first. Run [how](../../how/SKILL.md) over the affected code to learn the contract, then write a characterization test, snapshot, or equivalence script that captures current behavior before any structure moves. Type checks and lint are not a pin.
2. Name the structure the code is missing, per [principle-model-the-domain](../../principle-model-the-domain/SKILL.md). Boring code stays when its shape is already clear and local. The reshape must delete branches or invalid states, not add indirection.
3. Name the target shape: the module layout, types, and call graph you would build today, per [principle-redesign-from-first-principles](../../principle-redesign-from-first-principles/SKILL.md). If it crosses a function boundary, run [architect](../../architect/SKILL.md) first.
4. Subtract before you add. Delete dead code, collapse one-caller wrappers, and drop redundant validators before the new shape goes in, per [principle-subtract-before-you-add](../../principle-subtract-before-you-add/SKILL.md). Revert a speculative cleanup that only "might help".
5. Move in small steps that each keep the pin green. For an API reshape, migrate every caller and delete the old API in the same wave, per [principle-migrate-callers-then-delete-legacy-apis](../../principle-migrate-callers-then-delete-legacy-apis/SKILL.md). Use a codemod for mechanical edits, per [principle-build-the-lever](../../principle-build-the-lever/SKILL.md). Check every rename against the files, since renames miss strings, docs, and back-references.
6. Prove behavior is unchanged on the real artifact, per [principle-prove-it-works](../../principle-prove-it-works/SKILL.md). For a larger reshape, run an equivalence check that diffs old and new outputs.
7. Confirm it is worth keeping. The measure is lower reader load, per [principle-minimize-reader-load](../../principle-minimize-reader-load/SKILL.md). If the diff lowers it nowhere, revert it.
8. Order the commits: subtraction, then the reshape, then follow-on cleanup, each green. Run [Opening a PR](opening-a-pr.md).

**Reply:** the structure that changed, the pin you held it against, the equivalence proof, the reader-load change, and what shipped and what you reverted.
