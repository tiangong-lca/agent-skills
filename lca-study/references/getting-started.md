# Start an LCA study from an unprepared environment

Use this guide when the user wants to start a study and has not installed the
Skill, CLI or local calculation environment. Complete the available setup, verify
what actually works, then continue with [LCA Study](../SKILL.md). Reuse an existing
qualified installation; do not reinstall it just because a new study starts.

## One prompt for the user

```text
Read https://raw.githubusercontent.com/tiangong-lca/agent-skills/main/lca-study/references/getting-started.md, follow its setup instructions, and guide me through starting an LCA study.
```

Chinese equivalent:

```text
请阅读 https://raw.githubusercontent.com/tiangong-lca/agent-skills/main/lca-study/references/getting-started.md，按说明完成安装和配置，然后引导我开始一项 LCA 研究。
```

This URL is the published entry on `main`; a local or branch copy does not make
it publicly available. For a preview, read this file and the Skill package from
the same explicitly selected checkout or ref.

## 1. Establish the working environment

Identify the current Agent, operating system, architecture and the user's research
directory. Keep research files outside the installed Skill. Preserve any existing
materials and completed work. Check available Node and package-management tools;
if missing, use their official installation instructions and a version compatible
with the selected CLI release. Repository development tools are not prerequisites
for an installed Study consumer.

The Model installer supports macOS ARM64, Linux glibc x64/ARM64 and Windows x64.
Actual native release availability and qualification must also match the host;
an installer recognizing a platform does not prove a package has been published
or validated there. macOS Intel is unsupported.

## 2. Install the complete Study skill

Follow the [Skills installer documentation](https://github.com/vercel-labs/skills)
for the selected installer version. From the research directory, install just
this skill for the current Agent, using project scope unless the user requested
a global installation:

```sh
npx skills add https://github.com/tiangong-lca/agent-skills --skill lca-study
```

Select the current Agent in the installer; use its documented noninteractive
options when necessary. Inspect the resulting installation path with
`npx skills list`. Keep `SKILL.md`, `agents/`, `references/` and `scripts/`
together, including the bundled `scripts/lib/` files. Reading or copying only
`SKILL.md` does not install the executable package. If the host needs a session
reload to discover skills, retain the installed path and next action for resume.

## 3. Install and check the CLI

Use the [official CLI installation guidance](https://github.com/tiangong-lca/cli#readme)
and its [published releases](https://github.com/tiangong-lca/cli/releases).
Reuse an existing compatible installation. Make `tiangong-lca` available on the
Agent's PATH, then inspect the capabilities needed for this study:

```sh
tiangong-lca --help
tiangong-lca dataset process search --help --json
tiangong-lca dataset process get-result --help --json
tiangong-lca dataset model prepare --help --json
tiangong-lca dataset model calculate --help --json
tiangong-lca calculation result --help --json
tiangong-lca report render --help --json
```

No installation directory, runtime expectation file or hash is required for
ordinary Skill use. The CLI owns runtime compatibility; the installer owns
package integrity. Missing commands need a compatible published CLI. Help checks
establish availability, not successful computation. If a required release or
native package is unavailable, preserve the research work and name that blocker.

The optional `node scripts/run-cli.mjs` wrapper calls the same PATH command.
For a custom location use `--cli-command /absolute/path/to/tiangong-lca`;
quote paths containing spaces. Existing managed tasks retain the commands
returned by their owner.

## 4. Prepare local calculation and remote discovery

For a local Model, read `setup model-calculation --help --json` from the installed CLI. Obtain a trusted, host-matching Model runtime package from the owning
release or environment provider. Then use:

```sh
tiangong-lca setup model-calculation --install /absolute/path/to/model-runtime-package --json
tiangong-lca setup model-calculation --check --json
```

The package includes the engine, native dependencies and complete LCIA method
data. If a working engine/cache is already configured, check and reuse it. See
[Model calculation](model-calculation.md) for configuring existing paths. Local
setup needs no database, queue or login. If no qualified package is available,
state that calculation is pending; do not invent a download URL, silently build
a sibling Worker repository or switch to online computation. Online Models use
their supported online service; changing execution location is an explicit choice.

Before online background discovery, run `auth status --json` directly.
If login is required, give the user the installed CLI’s `auth login` command
to run in a trusted terminal, then recheck status. Do not request or read passwords,
authorization codes or tokens. Official Production configuration comes with the
CLI; no dashboard setup is required. Use `auth doctor-auth --json` before
account-sensitive operations. Authentication does not authorize dataset writes.

## 5. Begin the research

Briefly report the installed Skill location, actual CLI selection, local engine
readiness and remote login state, plus any precise remaining blocker. Do not
describe a help check as an end-to-end study or claim a calculation was performed.

Read [LCA Study](../SKILL.md) and continue from the user's existing evidence. When
starting from nothing, ask what product or service they want to assess, what the
study should answer, and what materials they can provide. Establish the functional
unit and boundary through that conversation. Proceed through evidence intake,
foreground modeling, explicit background selection, actual calculation and an
interactive HTML report with PDF printing. Do not create a dummy online Study,
publish datasets or fabricate a numerical result to prove setup succeeded.
