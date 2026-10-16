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
| Q2 | `com.github.copilot/agents/*.agent.md`? | **Loads**, as `compat-plugin:probe-agent`. `model:` and `tools:` take effect; `description` is shown. The `task` tool spawns it only by the namespaced name. A top-level `agents/` folder is **ignored**. |
| Q3 | `disable-model-invocation: true`? | **Honored.** The skill is hidden from the model (not listed, `skill` tool returns `Skill not found`) and **still runs** as `/compat-plugin:probe-beta args`. `user-invocable: false` is honored too (no slash command; the model can still use it). |
| Q4 | Repo `.github/copilot/settings.json` with `extraKnownMarketplaces` + `enabledPlugins`? | **Works, only in a trusted folder**, scoped to that repo. A `directory` marketplace loads live, even under `copilot -p` (contrary to github/copilot-cli#4507). A `github` marketplace is **installed only by the first interactive session** in the repo; after that `-p` loads it too. ACP sessions loaded only the agent. |
| Q5 | What makes a repo a marketplace; private repos? | `.github/plugin/marketplace.json` at the repo root, plugin `source` relative to the repo root (`./tests/fixtures/compat-plugin` worked from a GitHub repo). A **private** repo works when `git` itself can authenticate to github.com (`gh auth setup-git` or Git Credential Manager); `COPILOT_GITHUB_TOKEN` alone failed. |
| Q6 | Plugin `com.github.copilot/hooks/hooks.json`? | **Loads and runs.** A `sessionStart` hook's `additionalContext` reaches the model, at the start of the first user message. |
| Q7 | Always-on instructions from a plugin? | **Yes:** `com.github.copilot/rules/<name>.mdc` with `description` and `alwaysApply: true` lands in the system prompt as a `<custom_instruction>` block, every turn, no invocation. `.md` and `.instructions.md` files in the same folder are **ignored**. |

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
`com.github.copilot/` and also the ignored top-level `agents/`. A plugin served from a **local directory
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
- The bare name does **not** resolve:
  `Unknown agent_type: probe-agent. Valid types are: explore, task, general-purpose,
  rubber-duck, code-review, research, security-review, compat-plugin:probe-agent`.
  Instructions that spawn a plugin agent must use `<plugin>:<id>`.

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

**A `github` marketplace behaves differently.** Second consumer repo
(`tests/fixtures/compat-probe/consumer-github/`), trusted, same shape but:

```json
"compat-remote": {
  "source": { "source": "github", "repo": "damgyeah/dev-foundation", "ref": "compat-market-probe" }
}
```

(`compat-market-probe` was a temporary branch carrying a root marketplace; deleted after
the spike.) `copilot plugin marketplace list` in that repo shows
`compat-remote (GitHub: damgyeah/dev-foundation)`, and `marketplace update` fetches it, but
**`copilot -p` and ACP never installed the plugin** (`plugin skills = none; plugin agents =
none`, three tries). The first **interactive** session did (driven through a
pseudo-terminal by `pty-probe.mjs`):

```text
1 plugin, 5 skills ...
> /plugin list
Installed Plugins:• compat-plugin@compat-remote v0.0.1
```

After that, in the same repo, `copilot -p` loaded it
(`plugin skills = probe-alpha, probe-gamma; plugin agents = compat-plugin:probe-agent`),
and outside the repo `copilot plugin list` shows it `[disabled]`. It is installed to
`$COPILOT_HOME/installed-plugins/compat-remote/compat-plugin/` (a copy).

So the working JSON for a consumer of dev-foundation is the `github` form below (Q5), and
each person must open one interactive session in the repo before `-p` or automation sees
the plugin.

## Q5 Marketplace layout

What makes a repo a marketplace: a `marketplace.json` at one of `marketplace.json`,
`.plugin/marketplace.json`, `.github/plugin/marketplace.json` or
`.claude-plugin/marketplace.json` (CLI plugin reference, "File locations"). The probe used
`.github/plugin/marketplace.json`, both locally (`C:\Repos\foundation-scratch`) and on
GitHub (temporary branch of this repo). Its `name` is the registration key and the part
after `@` in `enabledPlugins`. A plugin `source` is relative to the **repo root**, and a
nested path works:

```text
> copilot plugin marketplace add damgyeah/dev-foundation#compat-market-probe
Marketplace "compat-remote" added successfully.
> copilot plugin marketplace browse compat-remote
  • compat-plugin - Synthetic probe plugin
> copilot plugin install compat-plugin@compat-remote      # source: ./tests/fixtures/compat-plugin
Plugin "compat-plugin" installed successfully. Installed 3 skills.
```

**Private repo.** The CLI fetches a GitHub marketplace with plain `git clone`. With every
git credential source removed (no credential helper, no `GIT_ASKPASS`), only
`COPILOT_GITHUB_TOKEN` set:

```text
Failed to add marketplace: ... Command failed: git clone --depth 1 --progress --branch compat-market-probe
https://github.com/damgyeah/dev-foundation.git ...
fatal: unable to get password from user
```

With a git config whose only credential helper is `gh auth git-credential` (what
`gh auth setup-git` writes), the same command succeeded and the install worked. So a
private dev-foundation works for anyone whose `git` can already clone it: Git Credential
Manager (the Git for Windows default) or `gh auth setup-git`. Unverified: whether a token
stored by an interactive `/login` makes the CLI's documented "retry once with your signed-in
GitHub token" work without a git credential helper.

### Recommended layout for dev-foundation

One repo that is both the marketplace and the plugin source, plugin under `plugin/`:

```text
dev-foundation/
  .github/plugin/marketplace.json      # the marketplace (name: dev-foundation)
  plugin/                              # the plugin root
    plugin.json                        # $schema agent-plugins 1.0.0, name: dev-foundation
    skills/<skill>/SKILL.md            # skills, portable (Copilot and Claude Code)
    com.github.copilot/agents/<id>.agent.md   # Copilot agents -> dev-foundation:<id>
    com.github.copilot/rules/<name>.mdc       # always-on instructions (Q7)
    com.github.copilot/hooks/hooks.json       # optional (Q6)
  docs/  tests/  provenance/           # outside plugin/: never installed
```

`.github/plugin/marketplace.json`:

```json
{
  "name": "dev-foundation",
  "owner": { "name": "damgyeah" },
  "plugins": [
    { "name": "dev-foundation", "description": "Shared engineering foundation", "source": "./plugin" }
  ]
}
```

A consuming repo's `.github/copilot/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "dev-foundation": { "source": { "source": "github", "repo": "damgyeah/dev-foundation" } }
  },
  "enabledPlugins": { "dev-foundation@dev-foundation": true }
}
```

Keep `plugin/` lean: a local-path or GitHub install copies the whole plugin directory into
the cache (the ignored top-level `agents/` of the fixture was copied too), so anything that
is not plugin content belongs outside `plugin/`.

Things to know when writing the plugin:

- Slash commands are `/<plugin>:<skill name>`, e.g. `/dev-foundation:poteto-mode`. A
  `name:` with spaces becomes hyphens with case kept (pstack's `Poteto Mode` →
  `/pstack:Poteto-Mode`), so use kebab-case names.
- Skills are deduplicated by `name` with project and personal skills winning (CLI plugin
  reference, "Loading order and precedence"), so a plugin skill named like a repo skill is
  silently shadowed.
- Agent IDs come from the file stem: `com.github.copilot/agents/poteto-agent.agent.md` →
  `dev-foundation:poteto-agent`. pstack's `agents/*.md` (top-level, no `.agent.md`) load
  nowhere in Copilot.

## Q6 Plugin hooks

Fixture: `com.github.copilot/hooks/hooks.json` with one `sessionStart` command hook that
writes a marker file and prints `{"additionalContext":"HOOK-CANARY-6021: ..."}`.

```text
# events.jsonl of the first copilot -p session after a direct install
{"type":"hook.start","data":{"hookType":"sessionStart","input":{"source":"new",...}}}
{"type":"hook.end","data":{"hookType":"sessionStart","success":true,
  "output":{"additionalContext":"HOOK-CANARY-6021: the session-start hook from compat-plugin ran."}}}
```

The marker file was written, and the model saw the context:

```text
> copilot -p "Without calling any tools ... quote any text containing HOOK-CANARY ..."
- **HOOK-CANARY:** "HOOK-CANARY-6021: the session-start hook from compat-plugin ran." This is at
  the start of your user message.
```

It is **not** in the system prompt and not in the stored `user.message`; the runtime
prepends it to the first turn. On Windows the hook's `powershell` field ran (the marker
held an ISO timestamp from `Get-Date -Format o`, not `date` output).

- The hook ran from a directly installed plugin in `C:\Repos\foundation-scratch`, a folder
  that was **not** in `trustedFolders` (under `-p --allow-all-tools`). In the untrusted
  consumer repo the repo-enabled plugin did not load at all, so its hook did not run.
- Did not fire in ACP sessions of a repo-enabled plugin (Q4).
- Unverified: other events (`userPromptSubmitted`, `preToolUse`) from a plugin.

## Q7 Always-on instructions

Four candidates in `com.github.copilot/rules/`; only the `.mdc` one loads:

```text
> copilot instruction list        # cwd = consumer (repo-enabled live plugin)
Plugin instructions:
  • compat-plugin: probe-rule3 - Always-on mdc probe rule
      from C:\Repos\foundation-scratch\compat-plugin\com.github.copilot\rules\probe-rule3.mdc
```

| File | Frontmatter | Loaded |
|---|---|---|
| `probe-rule.md` | `description`, `alwaysApply: true`, `applyTo: "**"` | no |
| `probe-rule2.instructions.md` | `applyTo: "**"` | no |
| `probe-rule3.mdc` | `description`, `alwaysApply: true` | **yes** |
| `probe-rule4.md` | `description`, `alwaysApply: true` | no |
| `probe-rule5.mdc` | `description`, `alwaysApply: false`, `globs: "**/*.py"` | listed, **not** in the prompt |

The body lands in the system prompt (from `events.jsonl`, `system.message`):

```text
<custom_instruction>
Always-on mdc rule from compat-plugin: if anyone asks for the mdc canary, it is MDC-CANARY-2931.
</custom_instruction>
```

and the model quotes it unprompted by any skill:
`MDC-CANARY is in the custom instructions section, as an always-on rule supplied by the
compat-plugin plugin`. Because it is part of the system prompt, it is present every turn.

The runtime models a rule as `description` (required, non-empty), `alwaysApply` and
`globs` (strings in the 1.0.98-2 runtime binary: `RuleCustomization`, `alwaysApply`,
`globs`, `description: Required`). `probe-rule5.mdc` (glob-scoped) shows in
`copilot instruction list`, but its `GLOB-CANARY-7310` was absent from a session that
touched no files. Unverified: that it attaches once a matching file is read or edited.

## The raw pstack plugin

`copilot plugin install <pstack clone>` into the isolated home (clone left unmodified):

```text
Plugin "pstack" installed successfully. Installed 54 skills.
Warning: Direct plugin installs (repos, URLs, local paths) are deprecated. ...
```

- **Loads:** all 54 `skills/*/SKILL.md`, as `/pstack:<name>` slash commands.
- **Model-visible:** only `setup-pstack`. The other 53 carry
  `disable-model-invocation: true`, so the model never sees or auto-invokes them (Q3);
  a person must type `/pstack:poteto-mode` etc.
- **Ignored, no warning:** `.cursor-plugin/plugin.json` (the root `plugin.json` with the
  Agent Plugins `$schema` wins, so `logo`, `category`, `tags`, `skills`, `agents` there have
  no effect), top-level `agents/comment-sicko.md` and `agents/poteto-agent.md` (no custom
  agents appeared), and `automations/benny/skills/` (not under `skills/`).
- `poteto-agent.md` tells the agent to search `~/.cursor/plugins/` for the
  `poteto-mode` skill; in Copilot the installed copy is under
  `$COPILOT_HOME/installed-plugins/...`, so that instruction needs porting.

## Checking the app side

Everything above is the CLI. The GitHub Copilot app was not probed, and the ACP results
(repo-enabled plugin: agent only, no skills or hook) show a non-TUI host can differ. To
check the app, using the scratch repo left in place at `C:\Repos\foundation-scratch`:

1. Make the app use a plugin: either install `compat-plugin@compat-market` from the local
   marketplace (`copilot plugin marketplace add C:\Repos\foundation-scratch`, then
   `copilot plugin install compat-plugin@compat-market`, **in your real home**, and
   uninstall afterwards), or open a session on `C:\Repos\foundation-scratch\consumer`, which
   enables it through its `.github/copilot/settings.json` (needs that folder trusted).
2. In that session type `/` and look for `compat-plugin:probe-alpha` and
   `compat-plugin:probe-beta` (not `probe-gamma`).
3. Ask: "list your plugin skills and custom agents, and quote any MDC-CANARY or
   HOOK-CANARY in your context". Expect `probe-alpha`, `probe-gamma`,
   `compat-plugin:probe-agent`, `MDC-CANARY-2931` and `HOOK-CANARY-6021`.
4. Run `/compat-plugin:probe-beta hi`; expect `BETA-CANARY-3392 [hi]`.

Anything missing there is an app gap to design around, not a plugin layout problem.

## Reproducing

From `tests/fixtures/compat-probe/`, in one PowerShell process:

```powershell
. .\probe-env.ps1   # sets COPILOT_HOME/COPILOT_CACHE_HOME into the scratch repo; never prints the token
copilot plugin install ..\compat-plugin
Probe 'name' 'prompt' [cwd]                        # copilot -p with a 300 s hard stop
node acp-probe.mjs <cwd> <timeoutSec> '/compat-plugin:probe-beta hi'   # real slash commands
node pty-probe.mjs <cwd> <outFile> <totalSec> '25|/plugin list\r'     # interactive TUI; needs
                                                   # npm i @homebridge/node-pty-prebuilt-multiarch
```

`probe-env.ps1` and the two consumer `settings.json` files hard-code
`C:\Repos\foundation-scratch`; change them for another location.

## Unverified

- The GitHub Copilot app (see above) and Claude Code: nothing here was run in either.

- Where `argument-hint` is displayed; whether `license` does anything.
- That a glob-scoped rule (`alwaysApply: false` + `globs`) attaches when a matching file is touched.
- Plugin hook events other than `sessionStart`.
- A private marketplace using only an interactive `/login` token, without a git credential
  helper.
- Why ACP sessions skip repo-enabled plugin skills and hooks (observed, not explained).
