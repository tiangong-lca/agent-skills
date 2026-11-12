---
name: lifecyclemodel-recursive-orchestrator
description: Organize evidence-led multi-level Model authoring from exact Process and Model references. Use for decomposing a modeling task and resolving explicit dependencies through current atomic CLI operations.
---

# Multi-level Model authoring

Inspect the chosen root Model and its exact references before traversing dependencies. Maintain a caller-owned worklist with the requested boundary, visited exact identities and unresolved evidence. Distinguish repeated use of an existing Process from recursion; do not expand published aggregate background LCI into its original upstream graph.

Use `dataset model get`, `list-references`, `graph` and `validate`, plus typed Process reads, to inspect actual content. Follow only the references and authoring scope the task requires. A missing/invisible reference is an unresolved input, not permission to create a substitute. Handle circular dependencies as an explicit modeling decision; never silently truncate them.

Author and validate each needed candidate from source evidence. The wrapper forwards current `dataset model` actions; it does not execute a recursive production queue, automatically build missing Processes or publish related records. Create/save each authorized object through its native request contract and retain partial/unknown effects independently. Existing managed workflows keep their owner-returned continuations.

For a resulting Process, use `dataset model build-resulting-process` with explicit supported inputs, then validate and separately create/save the candidate only when requested. Record exactly which dependencies and effects completed; do not announce a whole tree as published from one successful operation.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
