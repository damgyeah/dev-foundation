# How Copilot CLI loads an Agent Plugins 1.0 plugin

Measured on 2026-10-16 by running GitHub Copilot CLI against a synthetic plugin, not by
reading docs alone. Every answer below names the command that produced it and quotes its
output. Where a probe was not run, the answer says **unverified**.

- CLI: `copilot --version` → `GitHub Copilot CLI 1.0.98-2.` The session runtime reports
  itself as `1.0.94` (`session.start.copilotVersion` and the ACP `agentInfo.version`).
- Model for every probe: `claude-opus-5.5`.
- Fixture: [`tests/fixtures/compat-plugin/`](../tests/fixtures/compat-plugin/) (the plugin)
  and [`tests/fixtures/compat-probe/`](../tests/fixtures/compat-probe/) (the probe harness,
  a directory marketplace and a consumer repo's `.github/copilot/settings.json`).
- Isolation: every command ran with `COPILOT_HOME` and `COPILOT_CACHE_HOME` pointed into
  `C:\Repos\foundation-scratch` (see `probe-env.ps1`), so nothing was installed in a real
  `~/.copilot`.

Each skill, agent, hook and rule in the fixture carries a canary word (`ALPHA-CANARY-7741`,
`AGENT-CANARY-9113`, `HOOK-CANARY-6021`, …). A canary appearing in the model's output or
context is the evidence that the file loaded.

## Summary

| # | Question | Answer |
|---|---|---|
| Q1 | `skills/` discovered after `copilot plugin install <path>`? | **Yes.** Skill names are **not** namespaced for the model (`probe-alpha`), but slash commands **are** (`/compat-plugin:probe-alpha`). A local-path install is **copied** to `$COPILOT_HOME/installed-plugins/_direct/<plugin>/`. Relative links between skills resolve against that copy. |
| Q2 | `com.github.copilot/agents/*.agent.md`? | **Loads**, as `compat-plugin:probe-agent`. `model:` and `tools:` take effect; `description` is shown. The `task` tool spawns it by the namespaced name. A top-level `agents/` folder is **ignored**. |
| Q3 | `disable-model-invocation: true`? | **Honored.** The skill is hidden from the model (not listed, `skill` tool returns `Skill not found`) and **still runs** as `/compat-plugin:probe-beta args`. `user-invocable: false` is honored too (no slash command; the model can still use it). |
| Q4 | Repo `.github/copilot/settings.json` with `extraKnownMarketplaces` + `enabledPlugins`? | **Works, only in a trusted folder.** Loads as a "live" plugin scoped to that repo. In this version `copilot -p` **does** apply it (contrary to github/copilot-cli#4507). ACP sessions loaded only the agent. |
| Q5 | Marketplace layout | see [Q5](#q5-marketplace-layout) |
| Q6 | Plugin `com.github.copilot/hooks/hooks.json`? | see [Q6](#q6-plugin-hooks) |
| Q7 | Always-on instructions from a plugin? | see [Q7](#q7-always-on-instructions) |

## Q1 Skills discovery, naming, cache, relative links

```text
> copilot plugin install C:\Repos\foundation-scratch\compat-plugin
Plugin "compat-plugin" installed successfully. Installed 3 skills.
Warning: Direct plugin installs (repos, URLs, local paths) are deprecated. Only plugin@marketplace installs will be supported in a future release.

> copilot skill list
Plugin skills:
  probe-alpha - Use when the user asks for the probe-alpha canary word ...
  probe-beta - Use when the user asks for the probe-beta canary word ...
  probe-gamma - Use when the user asks for the probe-gamma canary word ...
```

The skills the **model** sees (from the session's `system.message` event in
`$COPILOT_HOME/session-state/<id>/events.jsonl`) carry the bare `name:` and
`<location>plugin</location>`:

```text
<available_skills> <skill> <name>probe-alpha</name> ... <location>plugin</location> </skill>
<skill> <name>probe-gamma</name> ... <location>plugin</location> </skill> ...
```

The **slash commands** a person sees are namespaced by plugin (ACP
`available_commands_update`, via `node acp-probe.mjs`):

```text
COMMANDS: add-dir, allow-all, ..., usage, compat-plugin:probe-alpha, compat-plugin:probe-beta
```

So `/probe-beta` does **not** resolve; `/compat-plugin:probe-beta` does.

**Cache.** A local-path install is a copy, not a link:
`$COPILOT_HOME\installed-plugins\_direct\compat-plugin\` holds `plugin.json`, `skills/`,
`com.github.copilot/` and also the ignored top-level `agents/`. Editing the source does not
change the install until `copilot plugin update`. A plugin served from a **local directory
marketplace** is the opposite: `copilot plugin list` reports it as
`Live Plugins (loaded from a local marketplace directory, never copied)`.

**Relative links resolve from the cache.** `copilot -p "Use the probe-alpha skill and follow
its instructions exactly ..."`:

```text
● skill(probe-alpha)
● Read SKILL.md
  │ .copilot-home\installed-plugins\_direct\compat-plugin\skills\probe-beta\SKILL.md
ALPHA-CANARY-7741
The canary inside it is **BETA-CANARY-3392**.
```

`../probe-beta/SKILL.md` from `probe-alpha/SKILL.md` was followed to the sibling inside the
installed copy, and it worked even though `probe-beta` is hidden from the model (Q3): the
link is read as a file, not invoked as a skill.

## Q2 Agents

```text
> copilot -p "Use the task tool to spawn the custom agent named probe-agent (try agent_type
  "compat-plugin:probe-agent", and if that fails, "probe-agent") ..."
● Compat-plugin:probe-agent (model: claude-haiku-4.5) Run probe agent
  └ AGENT-CANARY-9113
The `compat-plugin:probe-agent` agent_type worked on the first try with no errors
Here are the tools I have available:
- view
```

- Loads from `com.github.copilot/agents/probe-agent.agent.md`; the agent ID is
  `<plugin>:<file stem>` = `compat-plugin:probe-agent`.
- `model: claude-haiku-4.5` took effect (the parent session was `claude-opus-5.5`).
- `tools: ["view"]` took effect: the sub-agent listed exactly one tool, `view`.
- `description` is what the parent sees when choosing the agent.
- `agents/toplevel-agent.agent.md` (top-level `agents/`) never appeared in any listing and
  `TOPLEVEL-CANARY` never appeared: for an Agent Plugins 1.0 plugin the top-level `agents/`
  folder is **ignored** (it is still copied into the cache).
- Unverified: whether the bare `probe-agent` also resolves (the first try succeeded, so the
  fallback was never exercised).

## Q3 Skill frontmatter

`probe-beta` has `disable-model-invocation: true`; `probe-gamma` has `user-invocable: false`.

Not auto-invoked, not even visible to the model:

```text
> copilot -p "What is the probe-beta canary word? Use whatever skill applies ..."
There's no probe-beta skill in my available skills. The only probe skills I have are
probe-alpha and probe-gamma
```

Still user-invocable through the namespaced slash command (ACP session, a real slash
command, not text handed to the model):

```text
>>> /compat-plugin:probe-beta hello world
<<< (end_turn)
BETA-CANARY-3392 [hello world]
```

Arguments after the command are passed to the skill. The unnamespaced form fails:

```text
>>> /probe-beta hello world
TOOL_FAILED: {"message":"Skill not found: probe-beta","code":"failure"}
```

`copilot -p "/probe-beta ..."` does **not** run slash commands; the text goes to the model,
which then fails the same way. Test user-only skills through an interactive or ACP session.

`user-invocable: false` (`probe-gamma`): absent from the slash-command list above, yet listed
to the model and used by it (`● skill(probe-gamma)` → `GAMMA-CANARY-5520`).

`argument-hint` and `license` were accepted with no warning. Unverified: where
`argument-hint` is displayed (the probe printed command names only), and whether `license`
has any effect at all (none observed).

## Q4 Repository settings enable the plugin

Consumer repo `C:\Repos\foundation-scratch\consumer`, its own git repo, with this
`.github/copilot/settings.json` (also in `tests/fixtures/compat-probe/consumer/`):

```json
{
  "extraKnownMarketplaces": {
    "compat-market": {
      "source": { "source": "directory", "path": "C:\\Repos\\foundation-scratch" }
    }
  },
  "enabledPlugins": {
    "compat-plugin@compat-market": true
  }
}
```

The marketplace is `C:\Repos\foundation-scratch\.github\plugin\marketplace.json` listing
`"source": "./compat-plugin"`. The key in `enabledPlugins` is `<plugin>@<marketplace name>`,
where the marketplace name is the `name` in `marketplace.json`.

**Trust is required.** With the consumer folder not in `trustedFolders`
(`$COPILOT_HOME/config.json`):

```text
> copilot plugin list            # cwd = consumer
No plugins installed.
> copilot -p "...list skills and agents... quote any HOOK-CANARY"   # cwd = consumer
**Skills:** customize-cloud-agent, github-pr-media
**HOOK-CANARY:** None.
```

With the folder trusted:

```text
> copilot plugin list            # cwd = consumer
Live Plugins (loaded from a local marketplace directory, never copied):
  • compat-plugin@compat-market (v0.0.1) (enabled)
      from C:\Repos\foundation-scratch
> copilot plugin list            # cwd = C:\Repos\foundation-scratch (not the consumer)
No plugins installed.
> copilot -p "...list skills and agents... quote any HOOK-CANARY"   # cwd = consumer
- `probe-alpha`: from a plugin
- `probe-gamma`: from a plugin
- `compat-plugin:probe-agent`: from a plugin
> "HOOK-CANARY-6021: the session-start hook from compat-plugin ran."
```

So: scoped to the declaring repo, and **`copilot -p` applies it** in 1.0.98-2. The
`#4507` expectation did not hold here. The user's own `settings.json` stayed
`"enabledPlugins": {}`: nothing was written globally.

In an **ACP** session (`copilot --acp`, cwd = trusted consumer) only the agent loaded: no
plugin skills, no slash commands, no hook context, across three turns. Treat ACP and the
app (which is not the CLI) as needing their own check; see
[Checking the app side](#checking-the-app-side).

## Q5 Marketplace layout

_In progress._

## Q6 Plugin hooks

_In progress._

## Q7 Always-on instructions

_In progress._

## Checking the app side

_In progress._
