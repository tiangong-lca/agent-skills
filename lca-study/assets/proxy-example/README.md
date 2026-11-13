# Synthetic ordinary-Process conversion example

`request.json` is a minimal local calculation projection, not company evidence or a publishable TIDAS dataset. All product/process identities and quantities are synthetic. The elementary CO₂ Flow and selected GWP100 method use public identities so an installed complete method cache can calculate the example. Do not run this example automatically during user onboarding.

The foreground produces 1 kg of product, consumes 2 kg of A and emits 1 kg fossil CO₂. An ordinary conversion Process produces 1 kg A, consumes 1.5 kg B and emits 2 kg fossil CO₂. The background supplies B: its published inventory contains 6 kg fossil CO₂ per **2 kg B**. Its original Process has a different reference quantity and an intentionally irrelevant upstream emission of 999 kg; that original inventory must not be added again.

Independent expectation for 1 kg product:

```text
Background intensity = 6 / 2 = 3 kg CO₂ per kg B
Inventory = 1 + 2 × (1.5 × 3 + 2) = 14 kg CO₂
GWP100 = 14 kg CO₂-eq (selected fossil CO₂ factor = 1)
```

With the CLI and local Model runtime already configured, run from this directory:

```sh
tiangong-lca dataset model prepare --input request.json --output input.json --json
tiangong-lca dataset model calculate --file input.json --output-dir run-1 --json
tiangong-lca calculation result --dir run-1 --kind lci --json
tiangong-lca calculation result --dir run-1 --kind lcia --json
```

Use a new Run directory for each experiment. Set request `amount` to 3 and prepare again: both scores should be 42. Set the conversion Process's direct emission to 0: the baseline becomes 10. Also set its B input to 1: the baseline becomes 7. Each change is an explicit input edit; no new command or hash is needed.

Negative checks: change the background Process's selected reference Flow or reverse its direction; calculation must reject that input before normalization. Change a connection's Flow version or remove a required edge; calculation must fail rather than infer a provider. Do not relabel the published inventory to make an invalid connection pass.
