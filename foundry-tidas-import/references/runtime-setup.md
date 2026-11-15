# Installed Foundry runtime

The installation/deployment owner installs the public `@tiangong-lca/foundry` package and selects a verified complete runtime release. Ordinary skill calls use `tiangong-foundry` from PATH. `TIANGONG_FOUNDRY_COMMAND` optionally selects an executable or public JavaScript entry through `node scripts/run-foundry.mjs`.

Configure the installed entry once with `TIANGONG_FOUNDRY_MANIFEST` (absolute manifest path) and `TIANGONG_FOUNDRY_MANIFEST_SHA256` (independently verified release digest). `TIANGONG_FOUNDRY_CACHE_DIR` optionally selects an absolute component cache. The default declared launch is `foundry`; deployment may select `TIANGONG_FOUNDRY_ENTRY` explicitly.

Inspect the configuration before starting a new managed task.

```bash
node scripts/run-foundry.mjs runtime describe --json \
  --require-protocol tiangong-foundry.task-start.v1 \
  --require-protocol tiangong-foundry.semantic-input.v1 \
  --require-protocol tiangong-foundry.interaction-input.v1
```

The query reports the selected Foundry, bundled CLI, manifest digest, platform, installed components and supported protocol schemas. `ready` means the required protocols and local installation are available. Field-level features such as object-scoped interaction still require the selected runtime's schema and returned work-item evidence. Missing assets leave protocol assessment `not_checked`; unsupported required protocols are explicit. A query performs no installation, login or task creation.

A missing command needs the public Foundry package installed. An older entry that lacks `runtime describe` needs an entry upgrade by the installation owner. A missing selected component needs the existing `tiangong-lca runtime ensure --manifest <file> --manifest-sha256 <verified-digest> --cache-dir <directory>` installation step. A mismatched digest or damaged component needs installation repair. Inspect the current error before retrying a read-only query.

To adopt a compatible successor, deployment installs its verified assets, checks the same required protocols and changes the environment's manifest/digest selection together. The same skill files continue to work. Deployment retains the previous selection for rollback and the cache components needed by existing tasks. It records the actual adopted combination separately from skill content.

Continue existing tasks using their returned `executable`, `argv` and `cwd` unchanged, even after changing the default. Preserve the original Task/attempt and UNKNOWN recovery. An explicit native task-adoption operation owns any later task upgrade.

The retained `tiangong-runtime-bootstrap.sh`/`.ps1` and adjacent lock are a historical standalone-install compatibility path for the fixed release they identify. They are outside ordinary command selection. Current first-install bootstrap assets and their updates belong to Foundry releases. Updating this skill is unnecessary when deployment adopts a compatible release.
