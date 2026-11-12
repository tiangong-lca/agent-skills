# Runtime and identity

The installation owner configures `TIANGONG_LCA_CLI_INSTALLATION`, `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE` and `TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256`. Run the bundled `node scripts/run-cli.mjs --runtime-info` to inspect that selection. No automatic installation or PATH/sibling discovery occurs.

CLI owns its official public environment profile. Custom environments require the complete matching configuration described by CLI help. The Skill does not accept a raw endpoint override, read session files or build authentication headers. Use `auth status --json`, hand `auth login` to the human in a trusted terminal when needed, and never request passwords or tokens. Orchestrator-injected headless credentials must remain bound to their explicit destination and absent from logs.
