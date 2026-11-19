# Installed Foundry runtime

The installation/deployment owner installs the public `@tiangong-lca/foundry` package and selects a verified complete runtime release. Ordinary skill calls use `tiangong-foundry` from PATH. `TIANGONG_FOUNDRY_COMMAND` optionally selects an executable or public JavaScript entry through `node scripts/run-foundry.mjs`.

Configure the installed entry once with `TIANGONG_FOUNDRY_MANIFEST` (absolute manifest path) and `TIANGONG_FOUNDRY_MANIFEST_SHA256` (independently verified release digest). `TIANGONG_FOUNDRY_CACHE_DIR` optionally selects an absolute component cache. The default declared launch is `foundry`; deployment may select `TIANGONG_FOUNDRY_ENTRY` explicitly.

Inspect the configuration before starting a new managed task. The following discovery command applies to the public installed entry.

```bash
node scripts/run-foundry.mjs runtime describe --json \
  --require-protocol tiangong-foundry.task-start.v1 \
  --require-protocol tiangong-foundry.semantic-input.v1 \
  --require-protocol tiangong-foundry.interaction-input.v1
```

The query reports the selected Foundry, bundled CLI, manifest digest, platform, installed components and supported protocol schemas. `ready` means the required protocols and local installation are available. Field-level features such as object-scoped interaction still require the selected runtime's schema and returned work-item evidence. Missing assets leave protocol assessment `not_checked`; unsupported required protocols are explicit. A query performs no installation, login or task creation.

A missing command needs the public Foundry package installed. An older entry that lacks `runtime describe` needs an entry upgrade by the installation owner. A missing selected component needs the existing `tiangong-lca runtime ensure --manifest <file> --manifest-sha256 <verified-digest> --cache-dir <directory>` installation step. A mismatched digest or damaged component needs installation repair. Inspect the current error before retrying a read-only query.

To adopt a compatible successor, deployment installs its verified assets, checks the same required protocols and changes the environment's manifest/digest selection together. The same skill files continue to work. Deployment retains the previous selection for rollback and the cache components needed by existing tasks. It records the actual adopted combination separately from skill content.

## CLI-only managed deployments

A deployment that already provides a verified `tiangong-lca runtime exec` entry can configure `TIANGONG_FOUNDRY_RUNTIME_CLI` with that CLI executable or absolute public JavaScript entry. Use the same absolute manifest, trusted digest and optional absolute cache variables above. Set exactly one of `TIANGONG_FOUNDRY_RUNTIME_CLI` and `TIANGONG_FOUNDRY_COMMAND`. Each variable contains one executable path, never a shell command string.

For example, an environment owner can supply these values through its launch environment.

```text
TIANGONG_FOUNDRY_RUNTIME_CLI=/opt/tiangong/cli/dist/src/main.js
TIANGONG_FOUNDRY_MANIFEST=/opt/tiangong/foundry/runtime-manifest.json
TIANGONG_FOUNDRY_MANIFEST_SHA256=<independently verified 64-character digest>
TIANGONG_FOUNDRY_CACHE_DIR=/opt/tiangong/component-cache
TIANGONG_FOUNDRY_ENTRY=foundry
```

From the caller's chosen directory, invoke `node <absolute-skill-directory>/scripts/run-foundry.mjs doctor --workspace <absolute-workspace> --json`. The adapter constructs an argv array equivalent to the following command, passing the current caller directory as the explicit runtime CWD and preserving every application argument after `--`.

```text
tiangong-lca runtime exec --manifest <absolute-manifest> --manifest-sha256 <trusted-digest> --cache-dir <absolute-cache> --entry foundry --cwd <absolute-caller-directory> -- doctor --workspace <absolute-workspace> --json
```

The actual executable is the configured CLI. The adapter performs one shell-free dispatch and preserves the native output and exit status. Manifest trust, runtime qualification, host context, task locks and authorization remain owned by CLI/Foundry. A controlled host must admit each explicitly authorized public operation, including task start/resume and original returned recovery actions. A host refusal needs correction in that host's scoped command policy. The Skill cannot expand it.

`runtime describe` belongs to the public Foundry installed entry. Raw `runtime exec` launches the application and cannot provide that discovery operation. In CLI-only mode the adapter returns this limitation before dispatch. The deployment owner must supply the verified selected release identity and supported protocol schemas, then check the managed `doctor --workspace <absolute-workspace> --json` result before a new task. A missing required protocol or unavailable qualification needs a compatible deployment or the discovery-capable public entry. A successful doctor alone cannot establish protocol support.

## Paths and original tasks

Launchers preserve the caller's working directory and forward path arguments unchanged. Resolve input, output, manifest and descriptor paths to absolute paths from the caller's intended base before handing them to an outer host that changes CWD. Preserve any runtime-provided action CWD exactly. Resolve a path while its original base is known, then pass it as one argv item. Never guess which strings are filesystem paths or rewrite arbitrary CLI arguments.

Local conversion, extraction and document validation need their native local prerequisites. The Skill launcher adds no remote authentication or identity-receipt preflight. Check account status for remote operations and require the selected runtime's account/authorization evidence for writes.

Continue existing tasks using their returned `executable`, `argv` and `cwd` unchanged, even after changing the default. Preserve the original Task/attempt and UNKNOWN recovery. An explicit native task-adoption operation owns any later task upgrade.

The retained `tiangong-runtime-bootstrap.sh`/`.ps1` and adjacent lock are a historical standalone-install compatibility path for the fixed release they identify. They are outside ordinary command selection. Current first-install bootstrap assets and their updates belong to Foundry releases. Updating this skill is unnecessary when deployment adopts a compatible release.
