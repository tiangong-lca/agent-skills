---
name: current-account-dataset-review
description: Review current-account datasets and apply explicit, evidence-supported repairs through typed CLI operations. Use for inspecting owned drafts, references and changes before separate saves.
---

# Current-account dataset review

Choose exact object types and scope before reading. Use `dataset <type> list --scope current-user` with supported pagination; inspect exact targets with `get --id <id> --version <version>`. Preserve original content and the returned actor/environment context.

1. Fetch the current type contract and validate canonical content with `dataset <type> validate --input content.json`.
2. Inspect outgoing references with `list-references`; use exact typed `get` for referenced data. Existence, visibility and relationship validity are separate facts.
3. For an agreed repair, edit a local candidate or apply an explicit `patch` request, inspect `diff` and validate again. Never silently advance references to latest.
4. Save an existing draft with an explicit `save` request containing its before-content and intended actor/environment; independently read back the exact target. Creation needs its own `create` intention. Model graphs use `dataset model graph --input graph-request.json`, whose input contains `{ "content": <canonical Model> }`.
5. Submit or resubmit through `review` only when requested. Reviewer decisions are separate from validation or authoring.

The convenience script accepts the current suffix `<type> <action> ...` after `dataset`; for example `run-current-account-dataset-review.mjs process validate --input process.json --json`. It does not implement batch repair, reference rewriting or automatic save.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
