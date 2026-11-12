---
name: lifecycleinventory-review
description: Review canonical Process, Flow or Model data with current CLI validation and evidence-led scientific interpretation. Use for local inventory checks or reviewing explicitly selected remote versions.
---

# Inventory review

Use `dataset <type> validate --input content.json --json` for one canonical document. The convenience wrapper is `run-review.mjs --profile process|flow|model --input content.json --json`; default profile is Process. It forwards current validation flags and preserves the CLI result. Old QA row envelopes, run-directory profiles and LLM-validation flags are not equivalent inputs.

For remote data, `run-remote-process-review.mjs` forwards current `dataset process` actions. List a bounded scope, fetch an exact Process with `get --id <id> --version <version> --output content.json`, then validate that canonical content. Search/list envelopes are not validation payloads. Repeat only for explicitly selected objects and preserve completeness; do not claim an exhaustive remote audit from one page.

Read the two reviewed Process naming rules through `node scripts/read-public-rule.mjs --rule-id <id>`. Public rule definitions remain in the verified spec bundle and do not grant waivers or writes. Interpret schema, authoring evidence, content and multilingual layers separately. Remote references require explicitly selected evidence; missing evidence stays unverified. Scientific adequacy, review decisions and publication eligibility are separate from a successful validator invocation.

Return exact dataset identities, issue paths and evidence, checks actually performed and the proposed next action. Produce a local candidate only for authorized corrections; validate it and inspect its diff before a separate save. See `profiles/process/references/process-review-rules.md` for scientific review judgment.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
