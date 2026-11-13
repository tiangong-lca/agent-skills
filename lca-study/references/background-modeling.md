# Match the demand, then connect its provider

Choose foreground Flows and background candidates together. Start from the real input requirement: material or service, physical state/grade, geography, technology, time and reference quantity. Search candidate state-100 Processes early enough to reuse an appropriate existing Flow identity. Availability alone does not justify changing the requirement.

## Inspect the reference basis

For each selected exact Process version, read its quantitative reference and the selected exchange: Flow ID/version, direction, amount and unit. Read the complete published LCI through `dataset process results/get-result`. Check its source Process identity and published reference Flow/version/direction. Quantities may differ: a Process originally producing 10 kg may have a published inventory normalized to 1 kg. Scale from that published quantity; do not normalize it twice or expand its original upstream exchanges again.

Use matching ports for a direct connection. Resolve multiple exchanges of the same Flow with the supported explicit exchange selectors. A similar label is only a discovery hint. Different identity, physical meaning, unit or reference basis needs a modeling decision before connection. An unknown or contradictory reference basis needs clarification or another suitable candidate; a conversion coefficient cannot supply missing meaning.

## Use an ordinary Process for an explicit adaptation

When a justified relationship exists, insert an ordinary Process between the selected background and the foreground demand:

```text
Background output B → adaptation Process input B
Adaptation Process output A → foreground input A
```

Each edge still matches the exact Flow/version, direction and supported unit basis. A and B can be different because the relationship is expressed inside the intermediate Process's exchanges. No special proxy entity, automatic matching rule or solver mode is needed.

Distinguish three decisions in the Process description and research brief:

- **Equivalent representation:** evidence establishes the same physical requirement under two identities. State the basis and ratio, including unit/quantity conversion when needed.
- **Proxy substitution:** the available background approximates the actual requirement. Record why it is usable, the important differences and the adopted ratio; assess its influence where material.
- **Physical transformation:** an actual operation changes the material/service. Include yield, energy, auxiliaries, transport, emissions and waste as applicable. A unit conversion alone does not represent those burdens.

Set quantities on a clear output basis, for example 1 kg of A requiring 1.2 kg of B. A 1:1 ratio is an assumption unless supported; zero added burden is appropriate only for a representation mapping or a justified omission, not an unmeasured physical operation. Use known data or an explicitly adopted assumption, and request critical missing information before calculating a purported company result.

Keep original background documents and inventories intact. Record evidence and assumptions in ordinary Process descriptions and the research brief; use existing report node details and limitations to make adaptations visible. For a material proxy, compare an alternative or plausible ratio range in separate Runs when the evidence supports it. Do not add rigid proposal/revision/hash schemas for this reasoning.

The [synthetic calculation example](../assets/proxy-example/README.md) demonstrates scaling and added burdens. It does not establish that a specific real-world substitution is valid.
