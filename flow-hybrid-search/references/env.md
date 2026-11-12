# Runtime and identity

Use `tiangong-lca` on PATH. Run `tiangong-lca --help` to verify installation and the relevant command’s `--help --json` to inspect its capabilities. Optional Node wrappers use the same command; `--cli-command <executable>` chooses a custom path. No runtime expectation variables are required.

CLI owns its official public environment profile. Custom environments require the complete matching configuration described by CLI help. The Skill does not accept a raw endpoint override, read session files or build authentication headers. Use `auth status --json`, hand `auth login` to the human in a trusted terminal when needed, and never request passwords or tokens. Orchestrator-injected headless credentials must remain bound to their explicit destination and absent from logs.
