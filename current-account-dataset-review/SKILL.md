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

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
