---
name: lifecyclemodel-hybrid-search
description: Find and compare TianGong model datasets through the installed CLI, select an explicit search scope and inspect exact candidate versions. Use for dataset discovery and choosing suitable modeling references.
---

# Model dataset search

Use `node scripts/run-lifecyclemodel-hybrid-search.mjs` for `tiangong-lca dataset model search`, or the bundled `scripts/run-cli.mjs` for other atomic operations. Read `--help --json` from the installed CLI before using its options. The wrapper forwards current flags without supplying a default query, translating legacy JSON filters, downloading a CLI or retrying an operation.

1. Run `tiangong-lca auth status --json` through the launcher before remote reads. If login is required, ask the human user to run `auth login` in a trusted terminal. Never collect a password or token.
2. State the research selection criteria and query. Use `--scope public` for published background discovery; the default is `current-user`. Where supported, use `--state 100`. A matching name is a candidate, not an approved substitute.
3. Search with a bounded `--limit`; inspect `completeness` and narrow the query when needed. Search has no cursor and is not an exhaustive inventory.
4. Inspect selected exact versions using `dataset model get --id <id> --version <version>`. Preserve identity and evidence when choosing a reference; do not silently switch to another version.

```bash
node scripts/run-lifecyclemodel-hybrid-search.mjs --help --json
node scripts/run-lifecyclemodel-hybrid-search.mjs --query electricity --scope public --limit 10 --json
node scripts/run-cli.mjs dataset model get --id <id> --version <version> --output dataset.json --json
```

The new search surface accepts `--query`, `--scope`, `--state`, `--limit`, `--output` and `--json` as advertised by its help. Old `--input` filter envelopes, `--dry-run` search planning and endpoint/header overrides are not translated; unsupported options fail before a remote operation. Use available selection information and exact reads for criteria not expressible as search flags; report any unverified criteria.

Inspect `operation`, `status`, `data`, `context`, `completeness`, `error` and `nextActions`. Empty results do not prove nonexistence; permission or transport failure is not an empty match. CLI owns authentication, retrieval implementation and safe errors. It does not expose raw service responses as the Skill contract.

Headless execution may use an orchestrator-injected short-lived `TIANGONG_LCA_ACCESS_TOKEN` only with its explicitly bound environment. Never put credentials in argv, prompts, logs or artifacts. Keep account contexts separate.

Read `references/env.md` for runtime selection, `references/request-response.md` for command semantics, and `references/testing.md` for validation. Query formulation guidance is in `references/prompts.md`.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
