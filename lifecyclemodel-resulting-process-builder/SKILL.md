---
name: lifecyclemodel-resulting-process-builder
description: Generate a resulting Process candidate from an explicit Model using the current CLI aggregation operation, then validate it and perform a separate authorized create or save.
---

# Generate a resulting Process

Use `dataset model build-resulting-process --help --json` to read the current request shape. The command accepts explicit `source_model`, `projection` and exact `process_sources`, as advertised by the installed CLI. Old run roots, implicit latest reads and publication flags are not translated.

The convenience script forwards options directly to `dataset model build-resulting-process`; for example `node scripts/run-lifecyclemodel-resulting-process-builder.mjs --input request.json --output projection.json --json`. `aggregate` is the CLI's formal alias for this same operation. Do not confuse generated Process content with a Model LCIA Run.

The included `assets/example-request.json` and supporting canonical documents are synthetic local examples and require no remote lookup.

Inspect generation diagnostics, source-instance/exchange provenance and completeness. The output artifact contains diagnostics and a `bundle.projected_processes` collection, not one canonical Process document. Extract the intended entry’s `json_ordered` canonical content before validation or create/save. Validate that content; preserve the exact source/model selection and physical reference quantity. Generation never saves a dataset. Use a separate `dataset process create` for a new exact identity/version or `save` for an existing owned draft, with the native request envelope and concurrency preconditions. Never turn a conflict into an upsert.

Data review submission belongs to `review submit/resubmit`; data product Release operations have their independent contract. No `publish-resulting-process` shortcut exists. Preserve each operation's receipt and recover an unknown write by its original intent rather than generating a new request.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
