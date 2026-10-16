# Prototype

**You own the decision, not the code.** The prototype is a throwaway instrument. The real build follows [Feature](feature.md).

Here speed beats polish and code quality does not matter. The rigor is in settling the right question cheaply. Propose variations the person did not ask for, and throw an approach away to try another.

1. Name the decision the prototype exists to make: which layout, interaction, or density, or for an empirical fork, which behavior, timing, or approach. No decision means no prototype. Route to Feature.
2. When the design space is open, gather prior art and summarize the directions before building. Skip this when the direction is set.
3. Build it in a scratch folder outside production source. For a visual decision, plain HTML, CSS, and JavaScript or the lightest stack that renders the idea. For a behavioral or timing decision, the smallest script that exercises the question. No production framework, no tests, no abstractions.
4. To compare alternatives, put them behind one switcher with each variant labeled, per [principle-exhaust-the-design-space](../../principle-exhaust-the-design-space/SKILL.md).
5. Observe the thing you are deciding. For a visual decision, screenshot each variant and drive the interaction, through the repository's live-testing skill if it has one, otherwise a headless browser such as Playwright. For a behavioral decision, log the timing or print the output. The observation is the test.
6. Present the alternatives, the tradeoffs, and a recommendation. Hand the chosen direction to Feature, or to [architect](../../architect/SKILL.md) for the shape.

**Reply:** the variants, the evidence (screenshots, output, or timings), the tradeoffs, your recommendation, and the scratch path. Say plainly that the prototype is throwaway.
