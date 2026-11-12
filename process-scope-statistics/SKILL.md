---
name: process-scope-statistics
description: Count and summarize a clearly selected Process dataset scope through current CLI statistics. Use for state or classification distributions and honest reporting of bounded scans.
---

# Process scope statistics

Use `tiangong-lca dataset process statistics` through `node scripts/run-process-scope-statistics.mjs`. Read help for supported scope, owner, state, grouping and maximum-row limits. For example `--scope current-user --group-by state --max-rows 10000 --json`.

The optional `--input` is the current statistics request, with scope, owner, stateCodes, groupBy and maxRows; it is not an old snapshot directory. `--output` writes the result artifact. Do not translate old state-code, reuse-snapshot or out-dir flags silently.

Report selected scope, actual scanned count, group counts and completeness together. A bounded/partial scan is not a complete account or database total; preserve unknown counts and limits. Statistics neither proves scientific quality nor grants deletion or publication authority. Use exact typed reads for subsequent review rather than inferring individual rows from aggregate counts.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
