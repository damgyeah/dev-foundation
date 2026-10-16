# Feature

**You own the design. Plan, review, verify.** Delegate implementation and stay in the lead.

1. Run [how](../../how/SKILL.md) over the affected subsystem.
2. Run [architect](../../architect/SKILL.md) for the design: at least two candidate shapes and a rubber-duck critique.
3. Write the throughput checkpoint as four todo items. A dimension that does not apply keeps its item with `n/a: <reason>`.
   - **Blocking first steps.** Gates that run before any fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers run in parallel. Shared writes run in sequence.
   - **Shared mutable state.** Split the target by default, per [principle-separate-before-serializing-shared-state](../../principle-separate-before-serializing-shared-state/SKILL.md). Serialize only for a real invariant.
   - **Smallest safe decomposition.** If one worker is best, say why.
4. Delegate the code to a `foundation:foundation-agent` subagent with a specific scope: file paths, the named data shape and its organizing structure per [principle-model-the-domain](../../principle-model-the-domain/SKILL.md), and success criteria. The delegate writes the code and you review it, so authoring and review stay separate. Port shared improvements to every consumer and verify each. Commit as you go.
5. Verify on the matching surface, through the repository's live-testing or verification skill when it has one. Inconclusive or wrong-surface is not a pass, so flag it.
6. Rebase into small, ordered commits that each stay green, per [principle-sequence-verifiable-units](../../principle-sequence-verifiable-units/SKILL.md). Stack follow-ups as separate PRs.
7. If the design is contested, run [interrogate](../../interrogate/SKILL.md) before shipping.
8. Run [Opening a PR](opening-a-pr.md).

Code-coupled work (one feature, one migration) goes to a single owner with the checkpoint inline. That owner fans out after the blocking phase. Fan out from the top only for slices that produce independent artifacts, such as audits or competing experiments. Rewrite the checkpoint at phase boundaries.

**Reply:** what you built, what you chose and why, the throughput checkpoint, and open decisions. Use a table for design alternatives.
