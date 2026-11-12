---
name: lca-publish-executor
description: Prepare validated datasets for explicitly authorized review submission and distinguish draft persistence, review and data product publication. Use when a user asks to submit or continue dataset review.
---

# Dataset review submission

Confirm whether the user intends to create/save a dataset draft, submit/resubmit a review, process an assigned review, or publish a data product. These are distinct operations and authorities. Never translate a generic publish request directly into a write or Release approval.

Validate complete content and inspect exact referenced objects first. Perform an authorized `dataset <type> create` or `save` separately. Then use `review submit` or `review resubmit` with the installed command's supported input; read `review get` for actual status. The convenience `run-lca-publish-executor.mjs` forwards current `review <action>` arguments. It does not combine dataset writes and review submission into a transaction.

The supported service may submit one root and its related data; do not promise optional association switches or multi-root review packages unless capabilities actually advertise them. Submission means accepted for review, not approved or published. Reviewer decisions require the current assigned-role authority. Unknown outcomes use original-request recovery, not a new submission.

Data-product publication uses the separately authorized `release` workflow. This Skill does not reinterpret draft save or review submission as Release publication. Return each operation's actual identity, state, effects, unresolved outcome and next action.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
