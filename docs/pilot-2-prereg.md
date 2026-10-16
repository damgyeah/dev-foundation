# Pilot 2 pre-registration (written 2026-10-16, before any pilot 2 run)

Question: does the foundation core in a repository's AGENTS.md (v0.2.0) make Claude Opus agents
produce better changes than the same repository without it?

Arms: A = repository as is. C = repository plus the synced foundation core block. Same model
(claude-opus-5.5), CLI, flags, prompts and isolation as pilot 1. No plugin in either arm.

Repositories: microsoft/DNA (strong existing instructions) and one repository without DNA-grade
agent instructions, chosen for having at least 8 qualifiable bug-fix commits with tests.

Tasks per repository: at least 8 distinct qualified bug replays (hidden test fails on the base
for the reported reason and passes on the reference fix), one run per arm per task; and at least
4 seeded review defects that the repository's own checks do not catch, one run per arm.
Distinct tasks over repeats. Tasks are chosen and qualified before any arm runs.

Primary outcome: hidden-test pass rate per repository.
Secondary: blind pairwise judge preference (judge model family different from the arms where
available, otherwise Opus with labels stripped), seeded-defect detection, rule breaks, wall time.

Decision (per repository):
- Adopt the core there if C's pass rate >= A's AND the blind judge prefers C in more pairs than A
  AND C has no rule break that A does not.
- Do not adopt there if C's pass rate < A's OR the judge prefers A in more pairs than C.
- Otherwise (no difference): adopt only where it costs nothing to maintain (new repositories),
  not as a requirement in existing ones.
Program stop: if neither repository meets "adopt", stop building the core; keep the skills
library as optional.

Limits stated in advance: about 8 tasks per repository is a screen, not proof of a difference.
Budget: at most 6 hours elapsed and 100 runs in total.
