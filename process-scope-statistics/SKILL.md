---
name: process-scope-statistics
description: Count and summarize a clearly selected Process dataset scope through current CLI statistics. Use for state or classification distributions and honest reporting of bounded scans.
---

# Process scope statistics

Use `tiangong-lca dataset process statistics` through `node scripts/run-process-scope-statistics.mjs`. Read help for supported scope, owner, state, grouping and maximum-row limits. For example `--scope current-user --group-by state --max-rows 10000 --json`.

The optional `--input` is the current statistics request, with scope, owner, stateCodes, groupBy and maxRows; it is not an old snapshot directory. `--output` writes the result artifact. Do not translate old state-code, reuse-snapshot or out-dir flags silently.

Report selected scope, actual scanned count, group counts and completeness together. A bounded/partial scan is not a complete account or database total; preserve unknown counts and limits. Statistics neither proves scientific quality nor grants deletion or publication authority. Use exact typed reads for subsequent review rather than inferring individual rows from aggregate counts.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
