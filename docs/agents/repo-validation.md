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
  - scripts/lib/cli-launcher.mjs
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
lastReviewedAt: 2026-10-03
lastReviewedCommit: e13d3d80ff16a9ee125c7ccf8856f65361db47c0
lastReviewedNote: 'Reviewed Skills #123 combined adoption of independently verified public CLI 0.1.24 and final Foundry 0.1.15 source 0ab6b545: original C1 scripts/license, Node 24.19.0, TIDAS 0.3.3 and auth/task/write/no-replay boundaries are unchanged.'
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

The local `pre-push` hook runs docpact first, validates Node `24.19.0` / pnpm `11.24.0`, installs Skills from its frozen lockfile, and defaults to published CLI `0.1.24`. A matching-release local `tiangong-lca/cli` is installed/built only when explicitly selected and only after package/engine/lock/source-manifest evidence succeeds. A different candidate must already be prepared and pass the reviewed file/digest qualification before execution; the hook does not eagerly reinstall it. The hook then runs the repository test/validation gate. The GitHub `validate-skills` workflow runs the four-platform contract matrix for runtime/launcher/inspection changes, Foundry package/test pull requests and manual dispatch; its exact release pin remains independent of local candidates.

You may pass one or more skill directories to validate only the touched skill packages.

## Required Validation Shape

- Skill instruction changes require validating the touched skill package.
- Public-rule asset changes require `node scripts/sync-tidas-public-rules.mjs` verification and `node --test test/public-rules-package.test.mjs`; the latter checks isolated copies and rejects altered index/source identity.
- Wrapper contract changes require checking the paired `agents/openai.yaml` and `SKILL.md` together.
- Validation-script or test changes require running the full `pnpm prepush:gate` command when feasible.
- New CLI-backed skills must be added to the default validation list when they are intended to ship as part of the standard checked-in skill set.
- Wrapper-launcher changes require `pnpm test:launcher`, the pnpm consumer contract tests, an exact published `@tiangong-lca/cli@0.1.24` help case, source-manifest identity checks, and full skill validation against frozen, built CLI release merge `89c71772ca1afcfc09705f8c27a9703c6bf8ccf6` from canonical `tiangong-lca/cli`. The published Foundry bootstrap/provenance remains bound to its own qualified release source (0.1.15, bundled CLI 0.1.24).
- Local-candidate changes additionally require the qualification and original-consumer acceptance below; passing published-release checks does not qualify a separate candidate.
- Validate the installed CLI 0.1.24 + SDK 0.4.1 Process/Flow context packs with the retired mixed SDK JSON/schema absent, and reject altered public-rule source identity. The earlier SDK 0.2.2 static-import limitation is historical evidence, not an active requirement.
- Launcher filesystem fixtures and expected paths must use the host `node:path` implementation. A test that passes a synthetic `platform` may validate executable dispatch, but must not combine that target platform with host-resolved fake paths.
- Repo-wide Markdown guards inventory only root-repository Git-tracked `*.md` paths through argv-based `git -C <root> ls-files -z`. Fixture and validator Git children remove inherited repository-location `GIT_*` variables first, so hook context cannot redirect their index or worktree; untracked or nested CI checkouts are not part of the Skills documentation contract.
- Documentation-governance changes require docpact validation.
- Remote-auth instruction changes require `test/oauth-skill-contract.test.mjs`, the repository-wide password-equivalent doc guard, validation against the exact OAuth-capable local CLI, and the full `pnpm prepush:gate` once the published CLI pin is updated.
- First-install bootstrap changes require `test/installed-hybrid-bootstrap.test.mjs`: copy each of the three hybrid-search skill directories into a fresh isolated directory, clear public auth/CLI overrides, run the real pinned published wrapper without login, inspect its Production dry-run, reject an incomplete custom URL, and prove no session file or outside repository launcher is used. Bundled launchers must match the root authority byte-for-byte. A separate human-controlled fresh browser login plus live redacted doctor/read-only search remains release acceptance, never a repository test credential.

## Local Candidate Qualification and Acceptance

The caller must obtain the expected canonical commit and literal package version from the authorized assignment, preserve a clean isolated checkout, and verify frozen installation and build with Node `24.19.0` / pnpm `11.24.0` before inspection. The inspection output is an observation, not a qualification result. Review source/package/lock/TIDAS/dependency/build identities against that evidence and independently bind the exact inventory-file bytes. Keep the inventory and private operational evidence out of public Issues/PRs.

`test/local-cli-candidate.test.mjs` must exercise a real clean Git checkout and content inventories, rather than substituting a caller-created qualification object or mocked identity reader. Positive coverage must prove a different approved literal version can run with its reviewed file and external digest, and that matching-release `--cli-dir` without a candidate retains its original behavior. Required negative coverage includes:

- no qualification, one missing candidate flag, wrong file-byte digest, changed schema/expected commit/version/toolchain, and changed canonical source/package repository;
- dirty source, altered tracked source outside the entrypoint, package/lock/manifest or any actual pinned TIDAS schema mutation;
- missing or changed `dist/src/main.js`, `node_modules/.modules.yaml`, `node_modules/.pnpm/lock.yaml`, and changes anywhere in the qualified `dist`/`node_modules` trees;
- rejection before any automatic repair or CLI dispatch, rejection after preparation introduces identity drift, and qualification checks even with internal `prepareLocalCli: false`;
- preserved frozen-install-before-build ordering after successful preflight when mtimes require preparation, plus rechecking every identity before command dispatch.

Consumer tests must prove paired flag and `=value` forms, same-invocation environment selection, paths containing spaces, isolated copies of all three byte-identical hybrid-search bundles, nested wrapper propagation of the full directory/file/digest selection, and `--published-cli` clearing candidate state. A fixture-only pass cannot replace validation of the approved current-assignment CLI checkout and the original wrapper consumer that encountered the failure. Keep the rollout local until those checks and original-consumer validation have concrete evidence; report any FAILED/UNKNOWN original task unchanged and do not claim data/scientific acceptance or deployed behavior from repository tests.

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

The `pre-push` hook runs `scripts/docpact-gate.sh`, which delegates CLI lookup to `scripts/docpact` and performs strict config validation plus enforced lint before the push leaves the machine. It then runs `pnpm check:toolchain`, installs Skills with `pnpm install --frozen-lockfile`, and defaults to the exact published CLI. If `TIANGONG_LCA_CLI_DIR` is explicitly set, `scripts/check-toolchain.mjs --cli-dir` verifies the matching-release package/name/version/engine/lock evidence or, when both candidate variables are set, the complete reviewed candidate qualification. The hook eagerly prepares only matching-release checkouts; candidate wrappers retain the post-preflight preparation and identity recheck contract. It finishes with `pnpm prepush:gate`. The wrapper checks `DOCPACT_BIN`, Cargo install locations, Homebrew install locations, and then `PATH`, so local agent shells should not fail only because bare `docpact` is unavailable. The default comparison base is `origin/main`. Override it for unusual stacks with `DOCPACT_BASE_REF=<ref>` or `scripts/docpact-gate.sh --base <ref>`. The gate writes its detailed report to a temporary file so normal pushes do not create `.docpact/runs/` artifacts.

The semantic-only Foundry authoring package is included in default validation. Validate a copied isolated package for its entry metadata and local reference closure; it intentionally has no wrapper script or bootstrap runtime. Runtime/F1 and ordinary entry bootstrap qualification remain separate requirements of the full migration.

Default validation now includes all 23 source skill directories: the original 21 plus the ordinary Foundry entry and internal authoring package. Validate the entry after an isolated copy and check its task/semantic field contracts against the selected Foundry source. Source validation is supplemented by original-script equality, the independently verified final Foundry 0.1.15 lock and the four-platform copied public cold/warm/bootstrap test.

`test/foundry-bootstrap-package.test.mjs` checks both script SHA-256 values against the immutable C1 source and executes an isolated host bootstrap without its lock to prove refusal before installation or application launch. POSIX syntax is checked with `sh -n`; Run the PowerShell execution case on Windows without execution-policy bypass. These negative/source checks do not count as final public bootstrap qualification.

Marketplace changes must resolve every listed skill to a real package, preserve existing group memberships, and list the ordinary Foundry entry before its internal semantic role. Check the two-language installation guidance together. Catalogue presence alone does not qualify a missing F1 lock or replace four-platform public bootstrap tests.

For retained import/source-evidence helpers, review both invocation contexts: an independent CLI workflow keeps its original command/evidence capabilities, while a registered Foundry task consumes only current work items/actions and cannot enter the standalone checkpoint/queue procedure. Validate the changed skill and paired prompt together; this instruction review does not replace runtime no-replay tests.

`test/foundry-public-install.test.mjs` executes an isolated copy of the shipped Foundry entry against its adjacent final release lock. It begins with an empty private home/cache and a system-only PATH, verifies the downloaded manifest and actual Foundry/CLI/Node/TIDAS identities, performs a local cleanup task through start/status/resume, and rejects developer commands, changed scripts, a missing lock, changed cached manifests and changed base inventories. It restores the isolated altered bytes and verifies the runtime again. This credential-free installation proof is separate from the final live account RC01–RC06 evidence.

For Skills #118, the copied entry's type-wide Process interaction and dual-Process object-scope fixtures were delivered under the qualified 0.1.13 lock and remain mandatory under the current adjacent qualified 0.1.15 lock. They must prove a brief, a clear question, `investigate` retaining the original words, a superseding decision, fresh-process persistence, current row and interaction hashes, P2 work while P1 waits, exact per-object decision IDs, indexed adoption, P1-only correction and an honest partial recap. The earlier Foundry #197 read-only mine-water replay used 0.1.12 to expose a real source ambiguity and missing references; it does not validate or deliver the separate `tiangong-lca/data#33` XML repair. No synthetic or read-only result supplies scientific measurements or write permission.

The relevant pull-request/manual matrix runs the same test on all four supported native platforms and retains one `tiangong-skills.foundry-public-install.v1` report per platform. `FOUNDRY_INSTALL_PROOF_DIR` optionally selects an absolute output directory for these test reports; it is not forwarded to the installed runtime and cannot select its manifest or credentials. The report binds the independently qualified release expectation, shipped lock digest, observed runtime identity and individual check outcomes.

The copied entry must execute an exact returned command action in a new process and retain ready runtime qualification. Its independent manifest digest must also reject a changed action-cache snapshot. These checks protect the managed-context correction from Foundry #151; running every continuation through the bootstrap alone cannot prove the returned-action contract. The relevant PR matrix also covers `.gitattributes` changes, because newline conversion must not alter the original final lock bytes.
