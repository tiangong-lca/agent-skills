---
name: flow-governance-review
description: Inspect Flow identity, content and references using public rules and current CLI validation. Use for evidence-led Flow governance and explicit repair proposals without automatic merging or specialized repair execution.
---

# Flow governance review

Read exact Flow candidates through `dataset flow search/get/list/versions`. Compare their scientific meaning, type, reference property/unit, substance identifiers, geography and intended uses; a name match alone is not equivalence. Use `diff` for explicit before/after documents and preserve the rationale for keeping distinct or choosing an existing reference.

For the five reviewed public Flow rules, `references/tidas_flows.yaml` keeps stable `public_rule_id` pointers. Read each applicable definition with `node scripts/read-public-rule.mjs --rule-id <id>`; the verified public-rule bundle remains unchanged. Public definitions do not grant write or waiver authority.

Validate canonical Flow content with `dataset flow validate --input flow.json`. Inspect validation layers, issue paths and checks not performed. Prepare evidence-supported edits locally, validate the candidate and use a separate authorized `create` or `save`. For Process consumers, list their references and inspect exact contents; replacing a reference is a deliberate local edit followed by independent validation/save, not a global alias repair.

The wrapper exposes current Flow actions: `search`, `get`, `list`, `versions`, `contract`, `list-references`, `validate`, `diff`, `patch`, `create`, `save`, `delete`. Use `<action> --help` for native inputs. Specialized identity/alias repair, merge plans and regeneration queues have no automatic replacement in CLI; scope and effect decisions remain with the authorized workflow owner. Do not infer a delete or bulk repair from a canonical-selection decision.

Read `references/decision-schema.md` for decision notes and `references/workflow.md` for an atomic review sequence. `run-flow-governance-review-fixture.mjs` verifies local validation and unchanged inputs; it grants no live data permission.

## Runtime and authorization

Use this package's `node scripts/run-cli.mjs` and the environment owner's qualified CLI selection. Inspect `--runtime-info` and current command `--help --json`; do not discover a sibling checkout, download a default version or reinterpret old request formats. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Use `node scripts/run-cli.mjs` for direct CLI calls so they share this skill wrapper's runtime selection. A consumer may configure `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256` once in its launch environment. These select an already installed and independently qualified CLI through its public runtime API; normal calls need no per-invocation overrides, Git checkout, pnpm or build. Inspect actual identity and selection source with `node scripts/run-cli.mjs --runtime-info`. Invalid configured evidence fails without falling back.

Without an installed selection, execution stops with CLI setup guidance; Skills never downloads or chooses a CLI version. `--cli-dir` is an explicit development-source path. CLI versions and release locks belong to the installation owner, while Skills depend on the public commands and capabilities they use. Continue existing managed tasks through their original owner-returned actions; do not replace their runtime or replay UNKNOWN operations with this standalone entry.
