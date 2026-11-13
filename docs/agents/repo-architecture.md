---
title: skills Repo Architecture
docType: reference
scope: repo
status: active
authoritative: true
owner: skills
language: en
whenToUse:
  - when deciding whether a change belongs in the skills repository or the CLI repository
  - when changing checked-in skill instructions, wrappers, references, assets, or validation rules
whenToUpdate:
  - when skill package structure changes
  - when the CLI boundary changes
  - when skill validation or packaging ownership changes
checkPaths:
  - .claude-plugin/marketplace.json
  - .gitattributes
  - .gitignore
  - AGENTS.md
  - .docpact/config.yaml
  - "*/SKILL.md"
  - "*/agents/openai.yaml"
  - "*/scripts/**"
  - "*/references/**"
  - "*/assets/**"
  - .githooks/pre-push
  - scripts/docpact
  - scripts/docpact-gate.sh
  - scripts/install-git-hooks.sh
  - scripts/check-toolchain.mjs
  - scripts/inspect-local-cli.mjs
  - scripts/qualify-ci-cli.mjs
  - scripts/lib/**
  - scripts/run-cli.mjs
  - scripts/sync-tidas-public-rules.mjs
  - package.json
  - pnpm-lock.yaml
lastReviewedAt: 2026-11-13
lastReviewedCommit: 169fe0071fa81200ad05b3c90ca464f6348cbdd4
lastReviewedNote: "Skills #152: reviewed language-first Study replies and guided material intake; launcher and ownership contracts remain unchanged."
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-validation.md
---

# skills Repo Architecture

`tiangong-lca/agent-skills` owns checked-in skill packages and CLI-backed agent workflow wrappers for TianGong workflows.

## Owned Surfaces

- `*/SKILL.md` contains canonical skill instructions and trigger contracts.
- `*/agents/openai.yaml` contains wrapper contracts used by the skills CLI.
- `*/scripts/**`, `*/references/**`, and `*/assets/**` are skill-local support files intentionally shipped with a skill package.
- `scripts/validate-skills.mjs` and `test/**` define repo-level validation for wrappers and packaging rules.
- `scripts/sync-tidas-public-rules.mjs` binds the selected skill-local public-rule copies to one exact published `tidas-spec` source/version/hash; package-local readers fail closed on altered assets or overrides.
- `package.json` and `pnpm-lock.yaml` pin the validation-only Node `24.19.0` / pnpm `11.24.0` package contract; this does not turn the skill packages into a TypeScript runtime.
- `scripts/lib/cli-launcher.mjs` owns ordinary command and explicit installed/development selection, nested environment propagation and argv-only dispatch. `cli-installed.mjs` delegates installed identity to the CLI public runtime API. `cli-development.mjs` retains the existing explicit source-candidate evidence and preparation path. `scripts/run-cli.mjs` is the shared direct entry and read-only runtime identity inspection surface.
- `scripts/inspect-local-cli.mjs` owns observation of a prepared local CLI against caller-supplied source/version expectations; independent caller review and qualification remain outside the tool.
- `README.md` and `README.zh-CN.md` explain installation and usage.
- `.claude-plugin/marketplace.json` groups the existing skill packages for discovery. Its Foundry group lists the ordinary entry first, the on-demand authoring role, and the retained specialized workflows.

Top-level Foundry scenario skills are allowed in this repository when they only encode workflow order and routing:

- `external-dataset-curated-import`
- `source-evidence-dataset-development`

## Non-Owner Boundaries

- `tiangong-lca/cli` owns the native public command surface, low-level command semantics, REST clients, and auth behavior.
- External source-evidence research skill repositories, such as `tiangong-ai/skills`, own fast-moving Tiangong KB retrieval skills.
- Product/runtime repositories own business logic and API behavior.
- `lca-workspace` owns root integration state and submodule pointer updates.

If an atomic business operation is missing, implement it in `tiangong-lca/cli` and keep its caller thin. Scientific interpretation, research steps and multi-operation workflow decisions remain Skill responsibilities.

Remote authentication follows the same boundary. Skills may invoke `auth status`, instruct a human to run browser `auth login`, and require live redacted `doctor-auth`, but they never inspect session files or handle passwords, codes, or tokens. Explicit headless and multi-account configuration remain CLI/orchestrator responsibilities. The validator rejects password-equivalent invocation examples in active Markdown.

Official Production's public profile is owned and bundled by the CLI, not copied into Skills. A first install needs human browser login, not dashboard/client-ID setup. Complete custom environments and explicitly targeted headless tokens remain separate. The flow/process/lifecyclemodel hybrid-search packages bundle the root launcher byte-for-byte at their own `scripts/lib/cli-launcher.mjs` so copied individual installations do not import outside their package. The installed-consumer tests check bundle equality, missing-command guidance and offline setup help, real installed native help and validation, no local checkout/session creation, and rejection of retired search flags.

If a Foundry/source-evidence workflow needs an external Tiangong KB research skill, consume it with `npx skills` at runtime and record the resolved upstream ref in the task workspace. Do not copy the external skill package into this repository unless ownership is intentionally transferred.

Current-account dataset review is owned here only as a skill package and wrapper contract. Its durable runtime behavior belongs in public `tiangong-lca` CLI commands such as typed dataset validation, explicit patch, distinct create/save, and Model graph export.

The shared launcher defaults to `tiangong-lca` from PATH. Skills rely on public commands and help, with installation and compatibility handled by the CLI environment. `cli-command.mjs` provides shell-free command dispatch; on Windows it resolves the Node target of npm/pnpm command shims so user arguments are never shell text. No download, build, business retry or version/hash gate occurs on this path. Optional `--cli-command` or `TIANGONG_LCA_CLI_COMMAND` selects another executable or public JavaScript entry.

### Explicit runtime selection

Controlled environments may opt into the existing `--cli-installation` / `TIANGONG_LCA_CLI_INSTALLATION` selection with `--cli-runtime-expectation-file` / `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `--cli-runtime-expectation-sha256` / `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256`. These are optional controlled-mode settings, not ordinary Skill setup. The installed adapter retains CLI-owned public identity verification, exact Node/content checks and refusal without fallback. Existing configured callers retain this explicit contract.

`--cli-dir` / `TIANGONG_LCA_CLI_DIR` selects source development. Explicit command/installed/source selectors override inherited selection; contradictory inherited modes fail. Nested wrappers propagate the selected mode. `--runtime-info` remains optional observation, never a prerequisite or approval mechanism. Managed tasks continue using owner-returned commands; changing a default cannot replay UNKNOWN operations.

The copied Study and three hybrid packages carry byte-identical launcher, command, installed and development modules plus the direct entry. CI still qualifies exact source `955642482771a270fd49a199d1d7c86fcccc9ce2` after frozen build, independently of ordinary consumer execution.

### Explicit local candidate boundary

A different literal package version requires the directory plus both `--cli-candidate-file` and `--cli-candidate-sha256`; both candidate flags support separated values and `=value`. The equivalent environment variables are `TIANGONG_LCA_CLI_CANDIDATE_FILE` and `TIANGONG_LCA_CLI_CANDIDATE_SHA256`. Bundled and nested wrappers carry the directory/file/digest as one selection. Retired `--published-cli` and inherited published mode are rejected. Source evidence clears when selecting an installed entry. An explicit candidate failure never becomes a fallback.

The inventory schema is `tiangong-lca.skills-local-cli-candidate.v1`:

- `cli`: canonical `repository: tiangong-lca/cli`, 40-character `commit`, literal `packageVersion`, and `sourceSha256`, `packageSha256`, `lockSha256`, `tidasManifestSha256`.
- `toolchain`: exact `node: 24.19.0` and `pnpm: 11.24.0`.
- `build`: `distSha256` and `nodeModulesSha256` over the complete prepared content trees.

`scripts/inspect-local-cli.mjs --cli-dir <checkout> --expected-commit <approved-sha> --expected-version <approved-version> --out <new-file>` checks the exact toolchain, canonical origin and package repository, a clean checkout and all tracked source contents, the actual 18 pinned TIDAS schema hashes, package/lock/source-manifest bytes and complete `dist`/`node_modules` trees. It requires existing `dist/src/main.js`, `node_modules/.modules.yaml` and `node_modules/.pnpm/lock.yaml`; it performs no install or build and refuses to overwrite the output file. The caller supplies expected source/version from the authorized assignment, reviews the observation against verified frozen-install/build evidence and independently binds its exact file-byte digest. The inspector's printed digest is not self-approval.

Candidate selection first binds the reviewed file to the external SHA-256, then compares every recorded source, package, asset, dependency and build identity with the selected checkout. Missing or changed evidence is rejected before automatic preparation, without repair. After successful preflight, the existing source-mtime path may run `pnpm install --frozen-lockfile` then `pnpm run build`; every identity is checked again before dispatch and any drift blocks execution. No public no-install option exists, and internal `prepareLocalCli: false` skips preparation only, not qualification.

Recovery preserves the original failed/UNKNOWN task and its evidence. Prepare a new writable isolated checkout, observe it, review it and bind a new inventory digest. Never spoof a version, modify an old qualification to match changed artifacts, or retry with another runtime implicitly. Candidate selection grants no data or execution authority. It leaves Foundry 0.1.15 bootstrap/provenance, installed skills/runtimes, task/attempt state ownership and single-writer data permissions independent.

Public rules are spec-owned; runtime-ruleset profile projection is CLI-owned. Published SDK 0.3.0 has retired the legacy mixed-file static import; the CLI 0.2.0 development fixture consumes the public contract API.

## Integration Semantics

A merged PR in this repository is repo-complete only. If the updated skill set must ship through the workspace, root integration must deliberately update the `tiangong-lca/agent-skills` submodule pointer after merge.

## Local Docpact Push Gate

This repository has a versioned local `pre-push` hook under `.githooks/pre-push` that delegates to `scripts/docpact-gate.sh`, resolves the docpact CLI through `scripts/docpact`, installs Skills through its frozen pnpm lockfile, and can validate through the installed PATH command or an explicit runtime selection. It prepares matching-release local CLI checkouts only after launcher-owned evidence validation. Reviewed candidates must already be prepared and pass complete qualification; the hook does not eagerly reinstall them. The hook then runs `pnpm prepush:gate`; it is the local guard for docpact config validation, enforced doc-governance linting, toolchain tests, and skill validation. Locally retained generated reports under `.docpact/runs/` are ignored through `.gitignore`. The GitHub `validate-skills` workflow runs for runtime/launcher/inspection changes, Foundry package/test and dependency/configuration/Actions pull requests and manual dispatch, while keeping its existing release checkout pin.

The internal `foundry-tidas-authoring` package is data-only guidance over an existing Foundry work item. Its local semantic reference is self-contained; execution, artifact registration, current authorization and readback remain Foundry/CLI responsibilities. The original workflow skill purposes remain separate.

`foundry-tidas-import` owns ordinary task instructions for both packaged imports and source-evidence development. Its self-contained public workflow reference describes task/semantic selection and current-action consumption; it carries no state machine or database logic. A missing internal authoring skill can be handled from the runtime-generated work item and template without a sibling-directory dependency. The distributed final lock selects the independently qualified Foundry 0.1.15 release, and the marketplace lists this complete entry first.

The Foundry entry distributes byte-identical POSIX/PowerShell bootstrap scripts from the historical CLI `cli-v0.1.14` commit `bcc5dbee5b909dbb912e09d99ca07e858d3d7cec`. Skills owns their packaging, not their implementation. Path-specific Git attributes prevent checkout newline conversion for both scripts, the retained license and the adjacent final lock. The original scripts select only their adjacent lock; the adjacent final lock is copied byte-for-byte from independently qualified `foundry-runtime-v0.1.15` (lock SHA-256 `afdec0b1597f3c5e130ac70f4952af0e9793d2861448d014bf8962ebcc8731d8`). Its manifest SHA-256 is `52eb3a1a69872376b7943693e40cda35f62cbcc4ce9c71afb91a5d2ef1134f89`, binding Foundry source `0ab6b54513acccfe3253ea583b4f6b2e678c0485`, Node 24.19.0, the Foundry owner's bundled CLI 0.1.24 (tag `cli-v0.1.24`, commit `89c71772ca1afcfc09705f8c27a9703c6bf8ccf6`) and TIDAS 0.3.3. This package is intentionally independent from the shared wrapper's environment-selected CLI: the two owners' provenance identities are never conflated, and the independently copied package test verifies the public installed runtime, its warm start, current interaction and semantic-decision adoption, and its returned-action resume against that source and content identity.

The independently copied Foundry entry retains the original C1 copyright/license text at `assets/licenses/tiangong-cli-LICENSE` beside its bundled scripts. Its bytes are checked with the script pins; this adds no user-facing license command or confirmation flow.

The ordinary entry may use a copied source record to demonstrate a current runtime's interaction behavior without changing that record. The type-wide and object-scoped fixtures delivered by Skills #118 under Foundry 0.1.13 must continue to prove both the earlier type-wide interaction and two Processes in one task: a P1-only question leaves P2 independent, each answer reaches only its own work item, row adoption is indexed, and a correction reopens only the affected object. The earlier Foundry #197 read-only mine-water replay exercised 0.1.12 against a real ambiguity and missing Flow references. The actual mine-water XML repair is owned by `tiangong-lca/data#33`, with its own scientific evidence, review and workspace integration; this skill package cannot make that data delivery complete. User answers such as “暂不确定，先调查” stay unresolved investigation requests until a supported source or an explicit decision closes the gap.

The retained `external-dataset-curated-import` and `source-evidence-dataset-development` skills support independent CLI workflows. Within a registered public Foundry task they act as domain helpers over current work items and supplied actions; they return selected input files and cannot manually advance queues, checkpoints, registered artifacts or attempts. Their paired agent prompts preserve this boundary.

## LCA Study workflow

For optional hosted research, `lca-study` orchestrates the public core v2 and reporting v3 Study commands through the public CLI or its optional copied launcher. Its operation recipes describe owner-issued references, exact claim values and recovery; they contain no numerical algorithms, database adapters or local task engine. These hosted paths require current server capabilities and independently configured export anchors. P2 reports remain unreviewed; review/share and advanced profiles need their own qualified public contracts.

For Study qualification against an explicitly configured local service, the CLI-owned `tiangong.cli-loopback-auth-doctor.v1` output is a separate live diagnostic. The Skill checks its intended current tuple and actor; it does not promote that result into a canonical Production identity receipt or claim historical callback binding. Ordinary hosted doctor/identity behavior stays CLI-owned.

The copied `lca-study` entry conditionally routes P3 work to `references/review-sharing.md` while retaining its P2 recipes. Its wrapper bytes and runtime selection remain unchanged. Current actions/roles, exact review/delegation/finalization and named-recipient policy stay with public CLI/server owners; a Skill never derives those policies or changes credentials to bypass a denial.

The `lca-study` entry guides research from goals and evidence through explicit foreground/background Model construction and calculation. Intake and extraction are progressive references that can be delegated independently; they own evidence judgment, not deterministic calculation. Hosted Study/revision/report behavior is an optional reference. Local research does not require a server Study or caller-maintained hashes; installed CLI capability and actual service availability determine executable paths.

## Atomic skill workflows

Active wrappers call typed `dataset flow|process|model` actions and `review`. Searches use explicit queries/scopes, validation accepts one canonical document, and patches/diffs consume native request envelopes. Scientific authoring, dedup decisions and workflow order belong to Skills; retired automatic builders, QA directories, queues and repair aliases are not CLI capabilities. Existing Foundry tasks keep their owner-returned actions and independent runtime.

Local Study reporting uses a seventh workflow step: the Skill composes a lightweight report JSON from selected evidence/Model/Run content and calls CLI `report render`. HTML/SVG/browser/print code belongs to CLI. A research report does not require hosted Study registration, approval or caller-maintained hashes. Existing signed exports retain their service-owned contracts.

The Study first-use entry lives in `lca-study/references/getting-started.md`. It guides installation/configuration and then hands off to the research Skill. The one-line README prompts point there. This reference owns no installer or runtime qualification mechanism; package readiness and unavailable release artifacts remain explicit.

`lca-study/references/advanced-analysis.md` holds conditional V5 OAT/uncertainty and view2/export3 recipes. It consumes only installed public CLI commands; canonical values, configuration hashes, scientific execution, role policy, journals and artifact verification remain with their existing owners. The copied launcher graph is unchanged.

`lca-study/references/method-assessment.md` holds conditional V6 recorded-evidence, same-Study method assessment and method-report/view3/export4 guidance. The installed owner schemas supply exact configuration and source bindings. Twenty requirements, twenty-five categories and fifty-eight facts remain explicit, including unavailable N/W and false qualification flags. The Skill owns neither method arithmetic nor professional approval; runtime selection, CLI protocol/recovery and current source/review/disclosure authority remain unchanged.
