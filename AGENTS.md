---
title: skills AI Working Guide
docType: contract
scope: repo
status: active
authoritative: true
owner: skills
language: en
whenToUse:
  - when a task may add, remove, rename, or restructure a checked-in TianGong skill
  - when deciding whether work belongs in this repository, in tiangong-lca/cli, or in a product/runtime repo
  - when routing from the workspace root into the skills repository
whenToUpdate:
  - when skill packaging rules or validation flow change
  - when repo ownership or CLI boundary rules change
  - when repo-local docpact governance or source docs change
checkPaths:
  - .claude-plugin/marketplace.json
  - .gitattributes
  - .gitignore
  - AGENTS.md
  - README.md
  - README.zh-CN.md
  - .docpact/config.yaml
  - docs/agents/**
  - */SKILL.md
  - */agents/openai.yaml
  - */scripts/**
  - */references/**
  - */assets/**
  - scripts/validate-skills.mjs
  - scripts/check-toolchain.mjs
  - scripts/inspect-local-cli.mjs
  - scripts/qualify-ci-cli.mjs
  - scripts/lib/**
  - scripts/run-cli.mjs
  - scripts/sync-tidas-public-rules.mjs
  - package.json
  - pnpm-lock.yaml
  - test/**
  - .github/workflows/**
  - .githooks/**
  - scripts/docpact
  - scripts/docpact-gate.sh
  - scripts/install-git-hooks.sh
lastReviewedAt: 2026-11-13
lastReviewedCommit: 169fe0071fa81200ad05b3c90ca464f6348cbdd4
lastReviewedNote: "Skills #152: reviewed language-first Study replies and guided material intake; launcher and ownership contracts remain unchanged."
related:
  - .docpact/config.yaml
  - docs/agents/repo-architecture.md
  - docs/agents/repo-validation.md
  - README.md
  - README.zh-CN.md
  - scripts/validate-skills.mjs
---

# AGENTS.md — skills AI Working Guide

`tiangong-lca/agent-skills` owns checked-in skill wrappers and skill packaging metadata for TianGong agent workflows. Start here when the task may change `SKILL.md`, `agents/openai.yaml`, validation rules, or the thin wrappers that connect skills to the unified CLI.

## AI Load Order

Load docs in this order:

1. `AGENTS.md`
2. `.docpact/config.yaml`
3. `docs/agents/repo-architecture.md`
4. `docs/agents/repo-validation.md`
5. `README.md` only when you need install or distribution context
6. the target skill's `SKILL.md`
7. `scripts/validate-skills.mjs` only when validation behavior itself is part of the task

Do not start by inferring behavior from chat history or one skill directory alone.

For hosted calculation projects, `lca-study` remains the installed skill ID and `study` remains the CLI command. An explicitly requested admitted V2 calculation ends at its result and producer-reported coverage. Local research uses the Model commands and normal sparse LCIA applicability. Route optional analyses, reports, review, sharing and industry method assessment through their own capability checks.

## Repo Ownership

This repo owns:

- `*/SKILL.md` for checked-in skill instructions
- `*/agents/openai.yaml` for the canonical CLI-backed wrapper contract
- skill-local `scripts/**`, `references/**`, and `assets/**` when they are part of one skill package
- `scripts/validate-skills.mjs` and repo validation tests
- `package.json`, `pnpm-lock.yaml`, and the shared CLI launcher/toolchain checks used by repo validation
- `scripts/inspect-local-cli.mjs` for observation-only inventories of explicitly prepared local CLI candidates; the caller owns qualification and the independent inventory-file digest
- `README.md` and `README.zh-CN.md` for install and usage guidance
- `.claude-plugin/marketplace.json` for grouped discovery, with one ordinary Foundry entry, an internal semantic role and retained specialized workflows

This repo does not own:

- the public CLI command surface
- external fast-moving source-evidence research skills such as `tiangong-kb-sci-search`
- product runtime business logic
- workspace integration state after merge

Route those tasks to:

- `tiangong-lca/cli` for new native `tiangong-lca <noun> <verb>` commands
- `tiangong-ai/skills` consumed through `npx skills` for external Tiangong KB research skills
- the owning product/runtime repo for business logic or API changes
- `lca-workspace` for root integration after merge

## Runtime Facts

- Repo-local documentation governance is encoded in `.docpact/config.yaml` and enforced locally by the pre-push docpact gate; `.github/workflows/ai-doc-lint.yml` is manual-dispatch fallback.
- This repo is distribution-oriented; each skill should stay a thin wrapper over the unified CLI or a data-only semantic role over current Foundry work items
- Active wrappers use typed CLI 0.2.0 dataset and review operations. Scientific workflows stay in Skills; missing workflow commands do not justify restoring legacy schedulers or repair aliases.
- If an atomic capability is missing, add it to `tiangong-lca/cli` first, then update the skill wrapper here
- Current-account dataset review skills may orchestrate frozen local inputs through public CLI commands, but must not own direct database access, credential parsing, or private account runtime logic.
- Active remote skills must check `tiangong-lca auth status --json`, hand `auth login` to a human-controlled trusted terminal when required, and use `auth doctor-auth` before account-sensitive commits. They never collect or emit usernames, passwords, authorization codes, tokens, or legacy API keys.
- Official Production public configuration belongs to the CLI and needs no Skills env setup. Only complete custom project URL/key/client/callback tuples override it; headless tokens require an explicit destination/key and must not implicitly select Production.
- The independently installable Study and three hybrid-search packages carry byte-identical `scripts/lib/cli-launcher.mjs` bundles inside their own directories. The root `scripts/lib/cli-{launcher,command,installed,development}.mjs` and `scripts/run-cli.mjs` remain the only source authorities; update all bundled files together and retain the isolated copied-package plus byte-equality regression. Do not add authentication or transport logic to those bundles.
- Headless tokens are orchestrator-injected, short-lived, and absent from argv/prompts/logs/artifacts. Multi-account work uses a distinct private `TIANGONG_LCA_SESSION_FILE` per account/project/client and preserves expected identity evidence.
- Source-evidence import skills may instruct agents to resolve external research skills with `npx skills`, but this repository should not mirror or pin those external skill packages.
- `external-dataset-curated-import`, `source-evidence-dataset-development`, and `dataset-rls-maintenance` are top-level workflow skills only; atomic conversion, validation and persistence stay in CLI-owned commands; managed task/queue state and returned actions stay in Foundry.
- Dataset maintenance under user RLS must use CLI-owned maintenance plans and readback verification. Skills must not add direct Supabase CRUD, service-role paths, or broad delete filters.
- Repository validation pins Node `24.19.0` / pnpm `11.24.0`. Ordinary Skills call `tiangong-lca` from PATH and depend on public command capabilities. Missing commands return official installation guidance; wrappers never install or retry business requests.
- Default to `tiangong-lca` on PATH. Optional `--cli-command` or `TIANGONG_LCA_CLI_COMMAND` selects an executable. Explicit installed/source selections remain available for controlled environments; they retain their own qualification checks. Conflicting inherited selections fail. Existing managed tasks keep owner-returned runtime and UNKNOWN recovery actions.
- A local checkout matching pinned CLI 0.1.24 retains the existing `--cli-dir` selection and package/engine/lock/source-manifest checks. Selecting another literal package version also requires both `--cli-candidate-file` and `--cli-candidate-sha256`, supplied from independently reviewed caller evidence. The paired environment variables are `TIANGONG_LCA_CLI_CANDIDATE_FILE` and `TIANGONG_LCA_CLI_CANDIDATE_SHA256`; pass them with the selected directory through the same wrapper invocation. Removing a selected source clears its candidate evidence; there is no published fallback.
- Candidate inspection requires the approved canonical source commit/version, a clean checkout, the fixed toolchain, the actual 18 pinned TIDAS schema contents, and already prepared `dist`/`node_modules` trees. It does not install, build, grant execution/data permission, or automatically qualify its own output. Review the inventory against the assignment and verified frozen-install/build evidence before independently binding its exact file-byte SHA-256.
- Candidate preflight rejects missing or changed source, package, lock, manifest, dependency or build evidence before preparation. It never repairs that failure. After successful preflight, the existing source-mtime preparation path remains: install with `pnpm install --frozen-lockfile` before `pnpm run build` when needed, then recheck every candidate identity before dispatch. There is no public no-install mode; internal `prepareLocalCli: false` does not bypass qualification. Recovery preserves a failed/UNKNOWN original task and qualifies a newly prepared isolated checkout, without version spoofing, editing an old qualification or silently falling back to published CLI.
- CLI child processes use authoritative argv arrays with `shell: false` and preserve child exit/stdout/stderr.
- The canonical local validation command is `pnpm validate` after `pnpm install --frozen-lockfile`.
- You may pass one or more skill paths to validate only the touched skills
- For documentation-governance changes, run `scripts/docpact validate-config --root . --strict` and `scripts/docpact lint --root . --base origin/main --head HEAD --mode enforce`

## Explicit runtime boundary

`cli-launcher.mjs` defaults to the public PATH command and owns selection, environment propagation and argv dispatch. `cli-installed.mjs` uses only `@tiangong-lca/cli/runtime` and its existing `tiangong-lca.cli-runtime-expectation.v1`; installation provenance/qualification belongs to the environment owner. The expectation file and independently approved digest must come from that owner, never self-approval of `--runtime-info`. Its `cli-package` scope does not attest the transitive dependency graph or grant data permission. The selected public API verifies package/content/platform/Node identity; Skills does not duplicate its file inventory, TIDAS schema or compatibility semantics.

Explicitly locked installed calls never install, build, scan Git or fall back. The existing source-candidate checks and source-mtime preparation are retained unchanged in `cli-development.mjs` and reached only for explicit development selection; ordinary calls without a source/locked installation use the PATH command. New task selection is not old-task migration: resume only owner-returned actions, preserving bound runtime, attempt and UNKNOWN semantics. `scripts/run-cli.mjs --runtime-info` is read-only identity inspection, not another execution ledger or business report.

## Hard Boundaries

- Do not add private business runtimes, MCP transports, or unrelated orchestration layers inside a skill when the behavior should live in the CLI or an owning repo
- Do not add legacy API-key flags, API-key assignment examples, or raw Authorization bearer examples to active skill instructions. The CLI has no legacy bootstrap or rollback mode.
- Do not vendor external runtime skills from `tiangong-ai/skills`; consuming projects should resolve them with `npx skills` and record the resolved upstream ref in task artifacts
- Do not leave a changed `SKILL.md` without updating the paired `agents/openai.yaml` when the invocation contract changed
- Do not treat a merged repo PR here as workspace-delivery complete if the root repo still needs a submodule bump

## Workspace Integration

A merged PR in `tiangong-lca/agent-skills` is repo-complete, not delivery-complete.

If the change must ship through the workspace:

1. merge the child PR into `tiangong-lca/agent-skills`
2. update the `lca-workspace` submodule pointer deliberately
3. complete any later workspace-level validation that depends on the updated skill set

## Local Docpact Push Gate

Install the versioned local hook once per checkout:

```bash
./scripts/install-git-hooks.sh
```

The `pre-push` hook runs `scripts/docpact-gate.sh`, which delegates CLI lookup to `scripts/docpact` and performs strict config validation plus enforced lint before the push leaves the machine. It validates Node `24.19.0` / pnpm `11.24.0` and installs Skills from its frozen lockfile. The hook can use the installed PATH CLI or an explicit runtime selection; when `TIANGONG_LCA_CLI_DIR` is explicitly set, it validates matching-release evidence or the complete reviewed candidate evidence before permitting local execution. An already qualified candidate is not eagerly reinstalled by the hook; wrapper preparation still rechecks it before dispatch. It then runs `pnpm prepush:gate`. The wrapper checks `DOCPACT_BIN`, Cargo install locations, Homebrew install locations, and then `PATH`, so local agent shells should not fail only because bare `docpact` is unavailable. The default comparison base is `origin/main`. Override it for unusual stacks with `DOCPACT_BASE_REF=<ref>` or `scripts/docpact-gate.sh --base <ref>`. The gate writes its detailed report to a temporary file so normal pushes do not create `.docpact/runs/` artifacts. Any separately retained local generated reports under `.docpact/runs/` are ignored through `.gitignore`, not delivery artifacts. The GitHub `validate-skills` workflow runs the four-platform contract matrix for runtime/launcher/inspection changes, Foundry package/test and dependency/configuration/Actions pull requests, and manual dispatch.

`foundry-tidas-authoring` is an internal on-demand semantic package. It reads supplied current task/context evidence and returns decision/patch files; it owns no runtime, credential parsing, deterministic apply or database operation. Its explicit-only policy is part of the approved Foundry entry migration.

`foundry-tidas-import` is the ordinary TianGong Foundry entry. Its instructions consume the public task protocol and current structured actions; the internal authoring role stays on demand. Its bundled bootstrap scripts and adjacent final lock select independently qualified Foundry 0.1.15 (release source `0ab6b54513acccfe3253ea583b4f6b2e678c0485`), with its own bundled CLI 0.1.24 independently bound by Foundry provenance, separate from the environment-selected wrapper CLI. The four-platform copied-entry test must prove actual installation and task operation before delivery; source validation alone does not establish installability.

The retained `external-dataset-curated-import` and `source-evidence-dataset-development` skills support independent CLI workflows. Within a registered public Foundry task they act as domain helpers over current work items and supplied actions; they return selected input files and cannot manually advance queues, checkpoints, registered artifacts or attempts. Their paired agent prompts preserve this boundary.

The Study P4 reference uses explicit V5 installed commands for separately admitted OAT sensitivity and bounded uncertainty. Skills owns the workflow instructions only; it does not sample, calculate, choose scientific settings, rebuild signatures or expand role/source authority. Existing P2/P3 defaults and bundled launcher bytes remain unchanged.
