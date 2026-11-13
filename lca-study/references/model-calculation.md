# Explicit Model calculation

Call `tiangong-lca` directly with the following CLI arguments. Read help from the installed command before using a new capability; source changes are not proof that an installed release supports it.

## Background input

Discover state `100` Process candidates using supported search flags, inspect exact selected versions, then use `dataset process results --help --json` and `dataset process get-result --help --json` to select and download a complete `--kind lci` artifact. Full result retrieval belongs to CLI, including its HDF5 channel and pagination. Do not query a private reader or database directly. A Process can be discoverable while its usable result is absent; report that distinction and select another justified background or request evidence.

Read [background modeling](background-modeling.md) before building a new connection or a proxy/conversion. Keep each background's published reference quantity intact; connect its output to a matching input on the foreground or intermediate Process. Do not rewrite a background reference ID to make a link pass.

## Local environment and run

Read `setup model-calculation --help --json`. The environment owner can install an explicitly trusted local runtime package with `setup model-calculation --install <package-directory> --json` on macOS ARM64, Linux glibc x64/ARM64 or Windows x64 with a qualified host-matching package. It installs the engine, native dependencies and complete LCIA methods together, verifies readiness, then saves reusable configuration. No caller-maintained hashes belong in research inputs. Public download availability and qualification on other platforms must be checked separately; do not invent an available release or silently compile a sibling Worker checkout.

With existing engine and factor-cache locations, `setup model-calculation --engine <executable> --static-cache <directory> --json` verifies and saves them. Use `--check` to inspect without modifying configuration. Installation/configuration needs no login, database or queue and grants no remote permissions. CLI installation and Model engine installation are separate steps.

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

## Resolve an input failure

Read the returned error before changing the research design. For port/reference errors, compare the named instance, exchange direction, signed amount/coefficient, Flow identity/version, units and selected source/result. For a sign conflict, compare both ports: Input contributes minus its amount and Output contributes its amount; nonzero coefficients must be opposite. Preserve original signs instead of forcing a connection. Use an explicit exchange ID when identical Flow ports are ambiguous. Check quantities separately from identity: the background's published normalization can differ from the source Process's original exchange amount. Correct known input mistakes through the public command contract, then use a new Run. Keep a minimal failed input and diagnostic if the contradiction remains. Do not infer a solver limitation from an unconnected instance or a reversed/mismatched edge.

The [synthetic proxy case](../assets/proxy-example/README.md) supplies ordinary Process documents and an independent numeric expectation. It is a modeling example, not a substitute for company data or an automatic setup calculation.
