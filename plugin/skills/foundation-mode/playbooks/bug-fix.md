# Bug fix

**You own the fix. Plan, review, verify.** Delegate investigation and implementation to subagents and stay in the lead.

Be scientific. Every shipped line traces to runtime evidence. A change that "might help" is a hypothesis, not a fix, and it does not ship. When evidence refutes a hypothesis, revert what it motivated. Ship the smallest change the evidence justifies.

1. Reproduce it yourself on the surface where it was reported. For UI or live behavior, use the repository's live-testing or verification skill when it has one. Ask the person to reproduce only with a specific reason you cannot reach the surface, after driving it as far as it goes. If it will not reproduce directly, synthesize the trigger, tighten the conditions, or instrument until it fires.
2. Find the root cause by elimination. List the candidate hypotheses, seeded by [how](../../how/SKILL.md) over the affected code and [why](../../why/SKILL.md) for regression history. Each pass, take the split that rules out the most, get runtime evidence, and eliminate. When state is unclear, add logging and read it as the code runs. Do not guess. Confirm the surviving mechanism with evidence before planning the fix, per [principle-fix-root-causes](../../principle-fix-root-causes/SKILL.md).
3. Plan the fix. If it crosses a function boundary, run [architect](../../architect/SKILL.md) first. Delegate the implementation to a `foundation:foundation-agent` subagent with a specific scope.
4. Write the regression check. Use [tdd](../../tdd/SKILL.md) when a cheap local test path exists. Run it against the unfixed code and keep the failing output.
5. Verify on the same surface. The original reproduction now passes, and the regression check goes from red to green. Inconclusive or wrong-surface is not a pass, so flag it. Unit tests show branch behavior, not that the bug is gone.
6. Commit the failing test and the fix together, so every commit stays green, as most repositories require. If the repository allows a red commit and wants the test first, split them, per [principle-sequence-verifiable-units](../../principle-sequence-verifiable-units/SKILL.md).
7. Run [Opening a PR](opening-a-pr.md). Paste the red-then-green output in the PR description.

**Reply:** what was broken, the root cause, the fix, and how you verified it, with the failing-then-passing output verbatim.
