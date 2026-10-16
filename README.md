# dev-foundation

Our shared engineering foundation for GitHub Copilot: one Copilot plugin with the
skills, playbooks and principles every repository we own switches on.

Adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) (MIT,
Lauren Tan), ported from Cursor to the GitHub Copilot app and Claude Opus. What
was taken, from which commit, and what changed is recorded in
`provenance/pstack.json`.

Status: being built. See `docs/` once it lands.

`npm test` runs `scripts/lint.mjs` over the repository (skill frontmatter, links, skill references, banned upstream terms, provenance) and its tests. It needs Node 22 or later and nothing else.
