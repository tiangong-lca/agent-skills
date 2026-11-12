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

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
