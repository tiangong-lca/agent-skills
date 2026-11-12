---
name: lifecyclemodel-automated-builder
description: Develop an explicit Lifecycle Model from selected Process datasets and evidence using current CLI graph, validation and write operations. Use for agent-assisted model authoring; generation and provider decisions remain with the caller.
---

# Model authoring

Establish the functional quantity, boundary and explicit Process instances before authoring. Discover suitable data, read exact versions and inspect input/output reference identities and units. The agent chooses and explains provider connections; the CLI does not discover them automatically across the database.

Read `dataset model contract`, author the canonical Model and supporting Process documents, inspect `dataset model graph --input graph-request.json`, and validate the content. The graph request contains `{ "content": <canonical Model> }`; validation takes the canonical document itself. Resolve actual connection/evidence problems; do not invent Process inventories or treat a graph image as numerical proof.

The wrapper accepts current `dataset model <action>` suffixes. `build-resulting-process --input request.json --output projection.json` writes a result bundle containing generated Process candidates from the native request contract; it does not create or publish that candidate. Model calculation uses `prepare` and `calculate` as described by their current help and the Study workflow.

Save or create only through an explicitly selected atomic write request, preserving actor/environment, exact identity and before-content where required. The old auto-build/run-directory/publication workflow is not a CLI operation; keep task goals, evidence, intermediate files and unfinished decisions in caller-owned notes. Registered Foundry tasks continue through their returned actions without replacing their runtime.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
