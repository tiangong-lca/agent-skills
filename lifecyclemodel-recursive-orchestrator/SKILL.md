---
name: lifecyclemodel-recursive-orchestrator
description: Organize evidence-led multi-level Model authoring from exact Process and Model references. Use for decomposing a modeling task and resolving explicit dependencies through current atomic CLI operations.
---

# Multi-level Model authoring

Inspect the chosen root Model and its exact references before traversing dependencies. Maintain a caller-owned worklist with the requested boundary, visited exact identities and unresolved evidence. Distinguish repeated use of an existing Process from recursion; do not expand published aggregate background LCI into its original upstream graph.

Use `dataset model get`, `list-references`, `graph` and `validate`, plus typed Process reads, to inspect actual content. Follow only the references and authoring scope the task requires. A missing/invisible reference is an unresolved input, not permission to create a substitute. Handle circular dependencies as an explicit modeling decision; never silently truncate them.

Author and validate each needed candidate from source evidence. The wrapper forwards current `dataset model` actions; it does not execute a recursive production queue, automatically build missing Processes or publish related records. Create/save each authorized object through its native request contract and retain partial/unknown effects independently. Existing managed workflows keep their owner-returned continuations.

For a resulting Process, use `dataset model build-resulting-process` with explicit supported inputs, then validate and separately create/save the candidate only when requested. Record exactly which dependencies and effects completed; do not announce a whole tree as published from one successful operation.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
