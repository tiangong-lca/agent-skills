# Explicit Model calculation

Use the package's `node scripts/run-cli.mjs` launcher for the following CLI arguments. Read help from the qualified installation before using a new capability; source changes are not proof that an installed release supports it.

## Background input

Discover state `100` Process candidates using supported search flags, inspect exact selected versions, then use `dataset process results --help --json` and `dataset process get-result --help --json` to select and download a complete `--kind lci` artifact. Full result retrieval belongs to CLI, including its HDF5 channel and pagination. Do not query a private reader or database directly. A Process can be discoverable while its usable result is absent; report that distinction and select another justified background or request evidence.

## Local environment and run

Read `setup model-calculation --help --json`. With explicitly installed engine and factor-cache locations, `setup model-calculation --engine <executable> --static-cache <directory> --json` verifies them and saves reusable local configuration. Use `--check` to inspect without modifying configuration. This does not install missing native components, start a database/queue, or grant remote permissions. If native components are absent, ask the environment owner to supply them through the supported distribution path; do not fabricate an installer or silently compile a sibling Worker checkout.

Read `dataset model prepare --help --json` for its request. Select the local Model file, supporting Process/Flow/property/unit documents, explicit complete background LCI files, methods, functional amount and any declared cutoffs. Enable remote dependency lookup only when intended. Preparation resolves required data; it does not calculate, add providers, rewrite the Model or save datasets.

```text
dataset model prepare --input request.json --output input.json --json
dataset model calculate --file input.json --output-dir run-1 --json
calculation get --dir run-1 --json
calculation result --dir run-1 --kind lcia --json
calculation result --dir run-1 --kind lci --output inventory.json --json
```

The prepared input is editable. Calculation saves actual input, prepared axes, results and summary in a new Run directory. Keep those files together. Read saved results without recalculation or authentication; use `--output` when stdout is truncated. Change relevant input values and create a new Run for a scenario. Raise resource budgets when justified by available local capacity; do not confuse a default instance/time/memory budget with an LCA modeling rule.

## Online execution and interpretation

An online Model is intended to use the online engine. Check the installed command and actual service capabilities before submission. If standalone online Model calculation is not available, state that precise dependency. Do not manufacture a successful task, automatically create a Study, or change execution location. An explicit user choice to export inputs and calculate locally is a separate supported route.

For supported remote jobs retain the original acceptance/task identity, poll actual status and use owner-returned recovery actions. Submission is not completion. A transport failure is not permission to resubmit. Existing hosted Study work follows [its dedicated reference](hosted-study.md).

Interpret LCIA against the selected complete method. A Flow without a defined factor makes no contribution to that method; this is normal sparse applicability, not a coverage warning or an incomplete score. Invalid method assets and incomplete data acquisition remain errors. Preserve signed historical artifacts and distinguish their recorded diagnostics from current interpretation. Compare Runs only after checking functional unit, boundary, background selections, methods and changed assumptions. Do not claim sensitivity or uncertainty capabilities beyond the installed engine's actual support.
