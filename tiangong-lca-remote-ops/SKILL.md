---
name: tiangong-lca-remote-ops
description: Perform explicitly scoped remote dataset reads and authorized atomic draft writes with the current CLI. Use for exact readback, reference inspection and evidence-supported Process changes.
---

# Remote dataset operations

Use typed `dataset <type> get/list/search/versions` for reads. Preserve exact identities, scope and pagination completeness. Fetch canonical content before local edits or validation; do not pass a list envelope as a dataset.

For Process references, use `dataset process list-references`, exact target reads, local editing or `dataset process patch`, and validation. `update-process-references.mjs` now forwards the native explicit patch request; it does not resolve latest versions, refresh all references or save anything. `verify-process-rows.mjs` forwards `dataset process validate --input content.json`; remote existence/readback is a separate exact get, not a side effect of validation.

For writes read `references/process-write-routing.md`. Reuse one stable owned draft identity/version across edits, preserve the before-content and use explicit `save`. New objects or justified new versions use `create`. Actual current service permissions decide what is allowed; there is no raw database/MCP fallback. Re-read and compare after confirmed writes; an unknown outcome follows the original intent's recovery path.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
