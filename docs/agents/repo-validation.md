---
title: skills Validation Guide
docType: guide
scope: repo
status: active
authoritative: true
owner: skills
language: en
whenToUse:
  - when validating changed skills, wrappers, packaging rules, or documentation governance
  - when selecting proof for a skills repository PR
whenToUpdate:
  - when skill validation commands change
  - when wrapper or packaging proof expectations change
  - when docpact governance rules or CI behavior change
checkPaths:
  - .claude-plugin/marketplace.json
  - .gitattributes
  - .gitignore
  - AGENTS.md
  - .docpact/config.yaml
  - .github/workflows/ai-doc-lint.yml
  - scripts/validate-skills.mjs
  - scripts/check-toolchain.mjs
  - scripts/inspect-local-cli.mjs
  - scripts/lib/**
  - scripts/run-cli.mjs
  - scripts/sync-tidas-public-rules.mjs
  - package.json
  - pnpm-lock.yaml
  - test/**
  - "*/SKILL.md"
  - "*/agents/openai.yaml"
  - .githooks/pre-push
  - scripts/docpact
  - scripts/docpact-gate.sh
  - scripts/install-git-hooks.sh
lastReviewedAt: 2026-11-10
lastReviewedCommit: db8c30fd07de3824ef5c5dc98636fd9566fe8078
lastReviewedNote: "Reviewed Skills #148 V2 workflow and readback bindings. The prepared reference supplies the functional unit, the frozen Scenario preparation supplies the input hash, and the bound artifacts supply result axes and coverage. Optional capability and original-intent recovery rules still apply."
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-architecture.md
---

# skills Validation Guide

Install and validate with the exact repository toolchain:

```bash
pnpm install --frozen-lockfile
pnpm prepush:gate
```

The local `pre-push` hook runs docpact first, validates Node `24.19.0` / pnpm `11.24.0`, installs Skills from its frozen lockfile, and requires a configured installed CLI or explicit development source. A matching-release local `tiangong-lca/cli` is installed/built only when explicitly selected and only after package/engine/lock/source-manifest evidence succeeds. A different candidate must already be prepared and pass the reviewed file/digest qualification before execution; the hook does not eagerly reinstall it. The hook then runs the repository test/validation gate. The GitHub `validate-skills` workflow runs the four-platform contract matrix for runtime/launcher/inspection changes, Foundry package/test and dependency/configuration/Actions pull requests and manual dispatch; its exact release pin remains independent of local candidates.

You may pass one or more skill directories to validate only the touched skill packages.

## Required Validation Shape

- Skill instruction changes require validating the touched skill package.
- Public-rule asset changes require `node scripts/sync-tidas-public-rules.mjs` verification and `node --test test/public-rules-package.test.mjs`; the latter checks isolated copies and rejects altered index/source identity.
- Wrapper contract changes require checking the paired `agents/openai.yaml` and `SKILL.md` together.
- Validation-script or test changes require running the full `pnpm prepush:gate` command when feasible.
- New CLI-backed skills must be added to the default validation list when they are intended to ship as part of the standard checked-in skill set.
- Wrapper-launcher changes require `pnpm test:launcher`, the pnpm consumer contract tests, zero-dispatch missing-configuration and retired-selection cases, source-manifest identity checks, and full skill validation against frozen, built CLI release merge `89c71772ca1afcfc09705f8c27a9703c6bf8ccf6` from canonical `tiangong-lca/cli`. The published Foundry bootstrap/provenance remains bound to its own qualified release source (0.1.15, bundled CLI 0.1.24).
- Local-candidate changes additionally require the qualification and original-consumer acceptance below; passing published-release checks does not qualify a separate candidate.
- Validate the installed CLI 0.1.24 + SDK 0.4.1 Process/Flow context packs with the retired mixed SDK JSON/schema absent, and reject altered public-rule source identity. The earlier SDK 0.2.2 static-import limitation is historical evidence, not an active requirement.
- Launcher filesystem fixtures and expected paths must use the host `node:path` implementation. A test that passes a synthetic `platform` may validate executable dispatch, but must not combine that target platform with host-resolved fake paths.
- Repo-wide Markdown guards inventory only root-repository Git-tracked `*.md` paths through argv-based `git -C <root> ls-files -z`. Fixture and validator Git children remove inherited repository-location `GIT_*` variables first, so hook context cannot redirect their index or worktree; untracked or nested CI checkouts are not part of the Skills documentation contract.
- Documentation-governance changes require docpact validation.
- Remote-auth instruction changes require `test/oauth-skill-contract.test.mjs`, the repository-wide password-equivalent doc guard, validation against the exact OAuth-capable local CLI, and the full `pnpm prepush:gate` against the selected CLI with the required public capabilities.
- First-install bootstrap changes require `test/installed-hybrid-bootstrap.test.mjs`: copy each of the three hybrid-search skill directories into a fresh isolated directory, clear public auth/CLI overrides and executable search paths, prove missing selection fails with setup guidance and offline help remains available, and prove no session file or outside repository launcher is used. Bundled launchers must match the root authority byte-for-byte. A separate human-controlled fresh browser login plus live redacted doctor/read-only search remains release acceptance, never a repository test credential.

## Installed consumer regression

`test/installed-cli-selection.test.mjs` runs a real isolated official CLI 0.1.28 install. The test-owned expected package digest is fixed independently of the consumer observation; the Node digest comes from the test host. This regression fixture is not production qualification. It copies QA and all three hybrid packages, removes executable search paths, compares a nonempty frozen Process QA result against the shared direct entry (excluding only `generated_at_utc`), checks unchanged input bytes and reads actual CLI version/selection provenance. No credentials or production data are used; search is dry-run only.

Synthetic public-owner fixtures exercise changed internal asset/layout identities without Skills edits, native nonzero stdout/stderr and UNKNOWN byte preservation, no replay, incomplete/ambiguous selection, changed expectation bytes, owner identity drift and missing installations. Existing source-candidate regressions remain mandatory. Both copied installed selection and missing/retired-selection regressions run on the existing four-platform matrix. All library bundles and the direct entry must be byte-identical to their root authority.

## Local Candidate Qualification and Acceptance

The caller must obtain the expected canonical commit and literal package version from the authorized assignment, preserve a clean isolated checkout, and verify frozen installation and build with Node `24.19.0` / pnpm `11.24.0` before inspection. The inspection output is an observation, not a qualification result. Review source/package/lock/TIDAS/dependency/build identities against that evidence and independently bind the exact inventory-file bytes. Keep the inventory and private operational evidence out of public Issues/PRs.

`test/local-cli-candidate.test.mjs` must exercise a real clean Git checkout and content inventories, rather than substituting a caller-created qualification object or mocked identity reader. Positive coverage must prove a different approved literal version can run with its reviewed file and external digest, and that matching-release `--cli-dir` without a candidate retains its original behavior. Required negative coverage includes:

- no qualification, one missing candidate flag, wrong file-byte digest, changed schema/expected commit/version/toolchain, and changed canonical source/package repository;
- dirty source, altered tracked source outside the entrypoint, package/lock/manifest or any actual pinned TIDAS schema mutation;
- missing or changed `dist/src/main.js`, `node_modules/.modules.yaml`, `node_modules/.pnpm/lock.yaml`, and changes anywhere in the qualified `dist`/`node_modules` trees;
- rejection before any automatic repair or CLI dispatch, rejection after preparation introduces identity drift, and qualification checks even with internal `prepareLocalCli: false`;
- preserved frozen-install-before-build ordering after successful preflight when mtimes require preparation, plus rechecking every identity before command dispatch.

Consumer tests must prove paired flag and `=value` forms, same-invocation environment selection, paths containing spaces, isolated copies of all three byte-identical hybrid-search bundles, nested wrapper propagation of the full directory/file/digest selection, and retired `--published-cli` rejection without fallback. A fixture-only pass cannot replace validation of the approved current-assignment CLI checkout and the original wrapper consumer that encountered the failure. Keep the rollout local until those checks and original-consumer validation have concrete evidence; report any FAILED/UNKNOWN original task unchanged and do not claim data/scientific acceptance or deployed behavior from repository tests.

Recovery must use another writable isolated checkout, fixed-toolchain frozen dependencies/build, a new observation, independent review and a new bound file digest. Changing the package version to bypass qualification, rewriting an old qualification, auto-repairing a preflight failure, and silent published fallback are not recovery paths. Foundry bootstrap/runtime qualification and task/attempt single-writer authorization remain separate acceptance boundaries.

## Docpact Validation

Run these commands for governance changes:

```bash
scripts/docpact validate-config --root . --strict
scripts/docpact lint --root . --base origin/main --head HEAD --mode enforce
```

During local implementation, use `--worktree` or an explicit `--files` list to include changes not yet committed. `.gitignore` excludes local generated reports under `.docpact/runs/`; that exclusion does not turn a saved report into public delivery evidence or authorize runtime work.

The manual `ai-doc-lint` workflow delegates to the same local docpact gate when remote reproduction is needed.

## Local Docpact Push Gate

Install the versioned local hook once per checkout:

```bash
./scripts/install-git-hooks.sh
```

The `pre-push` hook runs `scripts/docpact-gate.sh`, which delegates CLI lookup to `scripts/docpact` and performs strict config validation plus enforced lint before the push leaves the machine. It then runs `pnpm check:toolchain`, installs Skills with `pnpm install --frozen-lockfile`, and requires the configured installed CLI or explicit development source. If `TIANGONG_LCA_CLI_DIR` is explicitly set, `scripts/check-toolchain.mjs --cli-dir` verifies the matching-release package/name/version/engine/lock evidence or, when both candidate variables are set, the complete reviewed candidate qualification. The hook eagerly prepares only matching-release checkouts; candidate wrappers retain the post-preflight preparation and identity recheck contract. It finishes with `pnpm prepush:gate`. The wrapper checks `DOCPACT_BIN`, Cargo install locations, Homebrew install locations, and then `PATH`, so local agent shells should not fail only because bare `docpact` is unavailable. The default comparison base is `origin/main`. Override it for unusual stacks with `DOCPACT_BASE_REF=<ref>` or `scripts/docpact-gate.sh --base <ref>`. The gate writes its detailed report to a temporary file so normal pushes do not create `.docpact/runs/` artifacts.

The semantic-only Foundry authoring package is included in default validation. Validate a copied isolated package for its entry metadata and local reference closure; it intentionally has no wrapper script or bootstrap runtime. Runtime/F1 and ordinary entry bootstrap qualification remain separate requirements of the full migration.

Default validation now includes all 24 source skill directories: the original 21, the ordinary Foundry entry, internal authoring package and LCA Study workflow. Validate the entry after an isolated copy and check its task/semantic field contracts against the selected Foundry source. Source validation is supplemented by original-script equality, the independently verified final Foundry 0.1.15 lock and the four-platform copied public cold/warm/bootstrap test.

`test/foundry-bootstrap-package.test.mjs` checks both script SHA-256 values against the immutable C1 source and executes an isolated host bootstrap without its lock to prove refusal before installation or application launch. POSIX syntax is checked with `sh -n`; Run the PowerShell execution case on Windows without execution-policy bypass. These negative/source checks do not count as final public bootstrap qualification.

Marketplace changes must resolve every listed skill to a real package, preserve existing group memberships, and list the ordinary Foundry entry before its internal semantic role. Check the two-language installation guidance together. Catalogue presence alone does not qualify a missing F1 lock or replace four-platform public bootstrap tests.

For retained import/source-evidence helpers, review both invocation contexts: an independent CLI workflow keeps its original command/evidence capabilities, while a registered Foundry task consumes only current work items/actions and cannot enter the standalone checkpoint/queue procedure. Validate the changed skill and paired prompt together; this instruction review does not replace runtime no-replay tests.

`test/foundry-public-install.test.mjs` executes an isolated copy of the shipped Foundry entry against its adjacent final release lock. It begins with an empty private home/cache and a system-only PATH, verifies the downloaded manifest and actual Foundry/CLI/Node/TIDAS identities, performs a local cleanup task through start/status/resume, and rejects developer commands, changed scripts, a missing lock, changed cached manifests and changed base inventories. It restores the isolated altered bytes and verifies the runtime again. This credential-free installation proof is separate from the final live account RC01–RC06 evidence.

For Skills #118, the copied entry's type-wide Process interaction and dual-Process object-scope fixtures were delivered under the qualified 0.1.13 lock and remain mandatory under the current adjacent qualified 0.1.15 lock. They must prove a brief, a clear question, `investigate` retaining the original words, a superseding decision, fresh-process persistence, current row and interaction hashes, P2 work while P1 waits, exact per-object decision IDs, indexed adoption, P1-only correction and an honest partial recap. The earlier Foundry #197 read-only mine-water replay used 0.1.12 to expose a real source ambiguity and missing references; it does not validate or deliver the separate `tiangong-lca/data#33` XML repair. No synthetic or read-only result supplies scientific measurements or write permission.

The relevant pull-request/manual matrix runs the same test on all four supported native platforms and retains one `tiangong-skills.foundry-public-install.v1` report per platform. `FOUNDRY_INSTALL_PROOF_DIR` optionally selects an absolute output directory for these test reports; it is not forwarded to the installed runtime and cannot select its manifest or credentials. The report binds the independently qualified release expectation, shipped lock digest, observed runtime identity and individual check outcomes.

The Windows matrix runs `pnpm test --test-concurrency=1`, giving each test file exclusive scheduling while retaining Node's process isolation, complete test discovery and every existing timeout/assertion. Other platforms retain `pnpm test`. Use the same explicit flag for local Windows reproduction. This limits test-file interference with the private PowerShell and copied native consumers; it does not claim a runtime or operating-system root cause. Skills #144's source-bound sequential controls passed every environment group and the original public consumer, while adding private-profile, OS or module variables did not materially change the approximately 22.5-second steady startup cost. The two original 90-second startup failures and the second attempt's unlocated EPERM remain historical observations; diagnostic success alone does not resolve their cause or replace the full matrix.

For Skills #144 investigation, manual dispatch with `windows_diagnostics=true` selects a separate bounded Windows job. Its independent private-profile, OS and system-only module-path controls keep the original 90-second startup/refusal deadlines, immutable bootstrap hash and fresh private trees; a final original-environment probe checks ordering. It then runs the normal public-install path once without concurrent repository test files, retaining its 30-minute test timeout. Only after an actual Windows assessment failure, the explicit diagnostic guard adds a manifest-bound copied-native execution and immediate-removal control; code/syscall/path observations are limited to its owned temporary directory. This instrumentation is diagnostic only and does not change normal qualification execution. The 60-minute diagnostic job retains control, raw test and cleanup/owned-process termination evidence. This opt-in observation is separate from normal qualification: default dispatch and pull requests retain the complete four-platform matrix, and diagnostic success alone does not qualify a correction or waive a failed assertion.

The copied entry must execute an exact returned command action in a new process and retain ready runtime qualification. Its independent manifest digest must also reject a changed action-cache snapshot. These checks protect the managed-context correction from Foundry #151; running every continuation through the bootstrap alone cannot prove the returned-action contract. The relevant PR matrix also covers `.gitattributes` changes, because newline conversion must not alter the original final lock bytes.

The copied `lca-study` package is covered by installed-selection tests for byte-identical launcher closure, offline help/missing configuration, original argv/UNKNOWN preservation and refusal after expectation drift. For calculation workflow guidance, trace the calculation-only request through the documented steps and installed CLI help: one baseline, current V2 capabilities, one completed run and its coverage. Use the base preparation’s reference Flow and unit, the frozen Scenario preparation’s input hash, and the run’s exact result and preparation artifacts to verify the documented bindings, impact axes and coverage. Check that an unmatched artifact cannot label results and that missing characterization remains distinct from zero. Review the case where V3–V6 are unavailable and confirm no optional capability is needed to reach the stop point. Separately trace a requested analysis or report to its explicit capability check and check that the original-intent recovery path is available in both cases. Repository tests use an explicitly synthetic owner and do not establish API or numerical execution. Actual installed CLI/auth/DB/native Worker numerical proof and optional report verification are separate runtime qualifications.

For the P3 Study extension, copied-wrapper tests preserve explicit v4 argv and original inputs, UNKNOWN and delegation-denial results without replay or fallback. Independent forward evaluation must exercise new-report approval, an ambiguous pending decision, original finalization versus later current state, and revoked/withdrawn sharing. Synthetic fixtures and instruction review do not replace the installed Skill/CLI/Platform actual flow under workspace #2180.

Skills #142 adds copied Study V5 regression cases for explicit versioned argv, unchanged canonical configuration/input bytes, UNKNOWN preservation and denial without replay or authority changes. These are synthetic installed-owner boundary tests. Validate the touched package and canonical gate against the environment-selected qualified installation; actual V5 CLI/service/native/report qualification remains separate under workspace #2181. Preserve P2/P3 package, journal and launcher tests.

For the V6 Study method extension, copied-wrapper checks preserve explicit evidence/assessment/typed-task/report/review/export4 argv, exact original evidence and UNKNOWN state, no replay, and refusal before dispatch after expectation drift. Independently qualified installed-package offline help/schema and malformed-input checks supplement those synthetic owner fixtures. Independent forward testing should cover a missing product/phase declaration, recorded-unverified evidence, an ambiguous mutation, unavailable complete-sixteen N/W and current versus historical report/share authority. These checks do not replace the actual authorized non-production installed Skill/CLI→Edge/Database/native Worker/Storage/report flow, a real complete industry case or professional qualification under workspace #2181.
