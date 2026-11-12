---
name: process-dedup-review
description: Compare explicitly selected Process candidates and explain whether they represent the same scientific object. Use for duplicate review without automatic merging, deletion or reference replacement.
---

# Process duplicate review

Search and read exact Process candidates through `dataset process search/get`. Compare reference products, units, boundaries, technology, geography, periods, allocation and inventories as well as names. Preserve evidence for both identities; similar names alone do not establish duplicates.

Use `tiangong-lca dataset process diff --input comparison.json --json`, where the native request contains `before` and `after` canonical content. `run-process-dedup-review.mjs` forwards this diff operation; it does not create an automatic deduplication report or decide a canonical identity. Inspect `list-references` on explicitly selected consumers when a change would affect references; outgoing references are not an exhaustive reverse-consumer index.

Return a supported recommendation to keep distinct, reuse an existing row, or investigate missing evidence. Any agreed edit, reference replacement, save or deletion is a separate authorized operation with exact scope and current preconditions. Do not bulk delete or merge because a comparison is similar. Missing reverse-impact evidence remains a gap.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
