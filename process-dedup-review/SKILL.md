---
name: process-dedup-review
description: Compare explicitly selected Process candidates and explain whether they represent the same scientific object. Use for duplicate review without automatic merging, deletion or reference replacement.
---

# Process duplicate review

Search and read exact Process candidates through `dataset process search/get`. Compare reference products, units, boundaries, technology, geography, periods, allocation and inventories as well as names. Preserve evidence for both identities; similar names alone do not establish duplicates.

Use `tiangong-lca dataset process diff --input comparison.json --json`, where the native request contains `before` and `after` canonical content. `run-process-dedup-review.mjs` forwards this diff operation; it does not create an automatic deduplication report or decide a canonical identity. Inspect `list-references` on explicitly selected consumers when a change would affect references; outgoing references are not an exhaustive reverse-consumer index.

Return a supported recommendation to keep distinct, reuse an existing row, or investigate missing evidence. Any agreed edit, reference replacement, save or deletion is a separate authorized operation with exact scope and current preconditions. Do not bulk delete or merge because a comparison is similar. Missing reverse-impact evidence remains a gap.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
