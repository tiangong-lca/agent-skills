# Search verification

Run `node scripts/run-lifecyclemodel-hybrid-search.mjs --help --json` against the qualified CLI and verify the advertised current options. Missing runtime selection, invalid flags and legacy `--input`/`--dry-run` flags must fail without fallback. Copied-package tests must prove byte-identical launcher bundles and preserve exit/stdout/stderr.

For an authorized read-only service test, run a bounded `--query` with explicit scope, inspect candidate versions and read one exact dataset. Record the selected scope and returned completeness. Help and synthetic dispatch tests do not prove service search quality. No write, account switch or automatic installation is part of this test.
