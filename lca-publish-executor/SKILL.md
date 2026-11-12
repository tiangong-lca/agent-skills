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

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
