---
docType: guide
scope: repo
status: active
authoritative: false
owner: skills
language: en
whenToUse:
  - when installing TianGong LCA skills
  - when checking wrapper execution expectations
whenToUpdate:
  - when skill installation guidance changes
  - when the unified CLI wrapper contract changes
checkPaths:
  - .claude-plugin/marketplace.json
  - README.md
  - README.zh-CN.md
  - scripts/lib/cli-launcher.mjs
  - scripts/inspect-local-cli.mjs
  - scripts/validate-skills.mjs
  - "*/SKILL.md"
  - "*/scripts/**"
lastReviewedAt: 2026-11-04
lastReviewedCommit: 8c2d96200aff353b8219ad3aa469d52ffb0b4e6d
lastReviewedNote: "Reviewed Skills #139 P3 Study instructions: exact public v4 review/finalization/named sharing, original-key recovery and current versus historical state. P2 recipes and launcher bytes remain; no runtime reselection, direct transport, grant manufacture or actual qualification claim."
---

# Tiangong LCA Skills

Repository: https://github.com/tiangong-lca/agent-skills

Use the `skills` CLI from https://github.com/vercel-labs/skills to install, update, and manage these skills.

## Install the CLI

```bash
npm i skills@latest -g
```

## Install

- List available skills (no install):
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills --list
  ```
- Install all skills (project scope by default):
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills
  ```
- Install specific skills:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills --skill flow-hybrid-search --skill process-hybrid-search
  ```

## Target agents and scope

- Target specific agents:
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills -a codex -a claude-code
  ```
- Install globally (user scope):
  ```bash
  npx skills add https://github.com/tiangong-lca/agent-skills -g
  ```
- Scope notes:
  - Project scope installs into `./<agent>/skills/`.
  - Global scope installs into the per-agent user skills directory resolved by the `skills` CLI on the current platform. Use `npx skills list` to inspect the exact path on macOS, Linux, or Windows.

## Install method

- Interactive installs let you choose:
  - Symlink (recommended)
  - Copy

## Update and verify

- List installed skills:
  ```bash
  npx skills list
  ```
- Check for updates:
  ```bash
  npx skills check
  ```
- Update all skills:
  ```bash
  npx skills update
  ```

## External runtime skills

This repository owns checked-in TianGong LCA workflow skills. Fast-moving Tiangong KB research skills are consumed from their owning repositories at runtime instead of being mirrored here.

For source-evidence dataset development that needs SCI paper evidence, resolve the latest external skill from `tiangong-ai/skills`:

```bash
npx skills use https://github.com/tiangong-ai/skills --skill tiangong-kb-sci-search --full-depth
```

Optional local project install:

```bash
npx skills add https://github.com/tiangong-ai/skills --skill tiangong-kb-sci-search --agent '*' --yes --full-depth
npx skills update --project --yes
```

Consuming projects should record the resolved upstream ref and command in task artifacts. Do not copy `tiangong-kb-*` skill folders into this repository unless the ownership boundary changes deliberately.

## TianGong Foundry

Use `$foundry-tidas-import` as the ordinary entry for external dataset packages, source-evidence development and continuing an existing Foundry task. It selects the qualified runtime through its bundled bootstrap and keeps task outputs in a separate writable workspace.

```bash
npx skills add https://github.com/tiangong-lca/agent-skills --skill foundry-tidas-import
```

The `lca-foundry-workflows` marketplace package lists this entry first. `foundry-tidas-authoring` is an internal role loaded only for a current semantic work item; it is not a second task entry. The ordinary entry can use the runtime's work-item instructions when that internal role is not installed.

The complete entry bundles the final release lock for [Foundry 0.1.15](https://github.com/tiangong-lca/foundry/releases/tag/foundry-runtime-v0.1.15) (release source `0ab6b54513acccfe3253ea583b4f6b2e678c0485`), with its bundled CLI 0.1.24, Node 24.19.0 and TIDAS 0.3.3. Its public runtime is qualified for macOS arm64, Linux x64/arm64 and Windows x64. This release supports bound task briefs, immediate human questions, persistent user answers, scoped semantic decision adoption and an honest partial recap. The shared wrappers and hybrid-search packages use the environment-selected installed CLI; keep the Foundry entry's own bootstrap scripts/lock separate from those active wrappers, and never read one owner's CLI version as the other's. Keep the bundled scripts and adjacent lock together when installing or copying the entry. Installation and login do not grant permission to write data; continue the task's current authorization and recovery actions.

### Specialized workflows

The existing skills retain their independent uses:

- `$external-dataset-curated-import`: BAFU, USLCI, and other structured LCA package imports through CLI conversion, curation queue `next`/`verify`, child skills, and publish handoff gates.
- `$source-evidence-dataset-development`: evidence-driven data creation or update from PDFs, Word files, URLs, APIs, reports, database references, or scientific literature.
- `$dataset-rls-maintenance`: current-user RLS-scoped cleanup, delete/retire, reference repair, and redo planning for previously imported rows; orchestrates CLI maintenance plans and readback verification without private database access.

## Use one configured CLI entry

For an already installed, independently qualified CLI, configure its launch environment once. The environment/installation owner supplies the existing CLI public runtime expectation and its independently approved file-byte digest:

```sh
export TIANGONG_LCA_CLI_INSTALLATION=/absolute/path/to/installed/cli
export TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE=/absolute/path/to/approved-cli-expectation.json
export TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256='<approved-64-character-sha256>'
node scripts/run-cli.mjs --runtime-info
node scripts/run-cli.mjs auth status --json
node lifecycleinventory-review/scripts/run-review.mjs --rows-file /absolute/path/rows.json --out-dir /absolute/path/qa
```

In PowerShell set the same three `$env:TIANGONG_LCA_...` variables to the approved absolute paths/digest. Persist them in the consuming application's launch configuration when calls span shells. No project-path discovery or `.env` parsing is added. Skill-local `scripts/run-cli.mjs` selects exactly the same runtime as its wrapper. `--runtime-info` exposes the selected identity/source without writing a report; its observation cannot approve its own qualification.

Run the wrappers with the Node executable qualified by the supplied expectation. Normal configured calls need neither Git, source files nor pnpm and perform no install/build. The CLI owns its public identity verification; Skills does not fix its internal schemas or build layout. Changed/missing qualification fails without fallback. The environment owner remains responsible for installation provenance and dependencies beyond the public CLI-package identity scope.

Without this configuration, execution stops with setup guidance. Skills depend on public CLI capabilities, not a literal package version; the installation owner selects and locks that version. Skills never installs a default or latest package. The retired `--published-cli` and `TIANGONG_LCA_CLI_MODE=published` selections report an explicit error. `--help` provides offline setup guidance; native CLI help requires configuration. `--cli-dir` explicitly selects the development/candidate path. An explicit `--cli-installation <absolute-dir>` requires its matching `--cli-runtime-expectation-file` and `--cli-runtime-expectation-sha256`. Never substitute this independent entry for an existing task's owner-returned continuation or UNKNOWN recovery action.

## Remote authentication

Remote skills use the CLI-owned Supabase OAuth session. Official Production requires no public environment setup or dashboard/client-ID handoff. The published CLI owns its public URL/key/client/callback profile; Skills do not copy it. Start with:

```bash
node scripts/run-cli.mjs auth status --json
```

If the result is `login-required`, stop the agent workflow and let the human user run `tiangong-lca auth login` in a trusted terminal. Skills and agents must never request a username, password, authorization code, access token, refresh token, or the deprecated encoded API key. Use `tiangong-lca auth doctor-auth --json` before account-sensitive reads or commits.

Only custom environments need a complete matching `TIANGONG_LCA_API_BASE_URL`, `TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY`, and registered `TIANGONG_LCA_OAUTH_CLIENT_ID` plus its exact callback. Partial custom settings must not inherit Production fields. Use a separate private `TIANGONG_LCA_SESSION_FILE` for each account/project/client context. Approved headless automation must explicitly set its destination/key and `TIANGONG_LCA_AUTH_MODE=access-token` before the orchestrator injects one short-lived `TIANGONG_LCA_ACCESS_TOKEN`; a token alone never selects Production and must never enter argv, prompts, logs, or artifacts. No legacy API-key mode exists.

The three hybrid-search skill folders are independently installable: each includes the same byte-checked launcher and its example input, without a Skills/CLI/Data Foundry checkout. The CLI remains the authentication authority.

## Validation

- Repository validation requires Node `24.19.0` and pnpm `11.24.0`; install the pinned validation package from `pnpm-lock.yaml` first:
  ```bash
  pnpm install --frozen-lockfile
  ```
- Validate the canonical CLI-backed wrappers and migration doc guards locally:
  ```bash
  pnpm validate
  ```
- Validate against a local checkout matching the CLI 0.1.24 development-test baseline:
  ```bash
  TIANGONG_LCA_CLI_DIR=/path/to/tiangong-lca-cli \
  pnpm validate
  ```
- Validate only the skills you changed:
  ```bash
  pnpm validate lifecycleinventory-qa process-hybrid-search
  ```
- CI runs the same validation in `.github/workflows/validate-skills.yml` after checking out immutable development-test CLI commit `89c71772ca1afcfc09705f8c27a9703c6bf8ccf6` (published package 0.1.24), installing both repositories with frozen pnpm lockfiles, and building the CLI. The Foundry entry's bootstrap is tested against its own qualified 0.1.15 release lock and its bundled CLI 0.1.24.
- A different local candidate requires the reviewed inventory and independent digest described below. Local candidate acceptance also requires real qualification failures, isolated bundled and nested-wrapper propagation, and validation by the original consumer; a generated inventory or fixture-only result does not complete that acceptance.

## Execution note

Skills in this repository are expected to be thin wrappers over the unified `tiangong-lca` CLI.

Current rules:

- ordinary wrappers use the configured installed CLI; missing configuration stops execution without package download or PATH/sibling discovery
- source-development execution is opt-in only through `--cli-dir` or `TIANGONG_LCA_CLI_DIR`
- direct and nested wrappers propagate the same configured installation; retired published selection is rejected
- a matching-release local checkout still uses `--cli-dir` alone and must identify `@tiangong-lca/cli@0.1.24` with its exact Node/pnpm engines, v9 `pnpm-lock.yaml` and published TIDAS source manifest (spec 0.2.3)
- other local package versions require the reviewed candidate file and externally supplied digest below; an explicit local failure never silently falls back to the published package
- the local pre-push hook validates local release or candidate evidence first; wrapper preparation installs with `pnpm install --frozen-lockfile` before `pnpm run build` when source mtimes require it and rechecks candidate identity before dispatch
- launcher execution uses argv arrays with `shell: false`, so paths containing spaces remain one argument and child exit/stdout/stderr are preserved
- for remote process QA snapshots, prefer `tiangong-lca process list --json` followed by `qa process --rows-file ...` instead of ad hoc bridge scripts
- use native cross-platform Node `.mjs` wrappers as the canonical entrypoint
- skill wrappers should not bundle business-specific Python runtimes, shell shims, MCP transports, or private env parsers
- remote skill instructions must use CLI OAuth status/login/doctor handoff and must not add API-key flags or bearer examples
- if a capability is missing, add a native `tiangong-lca <noun> <verb>` command first, then update the skill to call it

### Reviewed local CLI candidates

Prepare a writable, isolated canonical `tiangong-lca/cli` checkout at the commit and literal package version approved for the assignment. Preserve its verified Node `24.19.0` / pnpm `11.24.0` frozen-install and build evidence. The checkout must be clean and already contain `dist/src/main.js`, `node_modules/.modules.yaml` and `node_modules/.pnpm/lock.yaml`.

The repository inspection tool observes that prepared checkout against caller-supplied expectations. Write a new file outside the CLI checkout:

```bash
node scripts/inspect-local-cli.mjs \
  --cli-dir /path/to/prepared-cli \
  --expected-commit "$APPROVED_CLI_COMMIT" \
  --expected-version "$APPROVED_CLI_VERSION" \
  --out /path/to/new-cli-inventory.json
```

The tool checks canonical source/package repository identity, clean tracked source content, all 18 pinned TIDAS schemas, package/lock/manifest identity and the complete prepared `dist` and `node_modules` content trees. Its inventory and printed digest are observations. Review them against the approved assignment and verified install/build evidence, then independently bind the exact inventory-file bytes before selecting the candidate. Inspection does not approve itself or grant execution or data-write permission.

Pass all three selections in one wrapper invocation:

```bash
node process-hybrid-search/scripts/run-process-hybrid-search.mjs \
  --cli-dir /path/to/prepared-cli \
  --cli-candidate-file /path/to/reviewed-cli-inventory.json \
  --cli-candidate-sha256 "$REVIEWED_CANDIDATE_SHA256" \
  --help
```

Both candidate flags also support `--flag=value`. Repository validation and nested wrappers propagate the same directory, file and digest through `TIANGONG_LCA_CLI_DIR`, `TIANGONG_LCA_CLI_CANDIDATE_FILE` and `TIANGONG_LCA_CLI_CANDIDATE_SHA256` in the same invocation:

```bash
TIANGONG_LCA_CLI_DIR=/path/to/prepared-cli \
TIANGONG_LCA_CLI_CANDIDATE_FILE=/path/to/reviewed-cli-inventory.json \
TIANGONG_LCA_CLI_CANDIDATE_SHA256="$REVIEWED_CANDIDATE_SHA256" \
pnpm validate
```

Missing or changed qualified artifacts are rejected before any automatic preparation. Once candidate preflight passes, the existing mtime-based frozen-install/build path remains available when needed; every recorded identity is checked again before the CLI command starts. Any drift stops dispatch. There is no public no-install switch, and an internal preparation skip cannot bypass qualification.

On failure, retain the original failed or UNKNOWN task and its recovery evidence. Prepare another isolated writable checkout, generate a new observation, review it and bind a new digest. Do not falsify the package version, edit the old qualification to fit changed files, or silently retry with the published CLI. This selection does not replace Foundry 0.1.15's bootstrap/lock, update installed skills/runtimes, or change task/attempt ownership and single-writer data authorization.

## Foundry semantic work

`foundry-tidas-authoring` is an internal on-demand role for a concrete Foundry work item. It reads the supplied full context and returns evidence-backed decisions or patch files to the invoking workflow. It does not install a runtime, manage authentication, apply rows or perform database operations.

## LCA Study

Install `lca-study` for a frozen research, scenario comparison and fact-backed report workflow. It is independently copyable and uses the configured installed CLI above; both core Study and reporting capabilities must be admitted by the selected service. It preserves original mutation recovery and uses independently configured export trust anchors. P3 adds exact-revision review/finalization and named sharing through admitted v4 commands; member/export upgrades explicitly select v4. It preserves one-use delegation and UNKNOWN recovery boundaries. P2 exports remain unreviewed historical copies; neither a signature nor actor approval proves current access or independent scientific certification. Dataset authoring and publication remain separate workflows.
