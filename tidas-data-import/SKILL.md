---
name: tidas-data-import
description: Select the appropriate path for importing structured LCA packages or authoring TIDAS data from source evidence through current typed CLI contracts and validation.
---

# TIDAS data intake

Distinguish deterministic format conversion from evidence interpretation. A PDF, spreadsheet or report is source evidence, not a canonical Process simply because text extraction succeeded.

For a supported structured LCA package, read `dataset import-lca convert --help`, convert with explicit inputs/options and inspect actual completeness and files. Read `dataset process contract --include schema,methodology,ruleset --output contract.json --json` (or the appropriate type) before repairing output. Validate selected canonical documents with `dataset <type> validate`; keep source mappings and report unsupported source elements honestly.

For source documents, use evidence intake and extraction guidance to preserve original values, locations, units, denominators, periods and assumptions. Author canonical candidate content only where evidence supports it. There is no CLI author command or implicit evidence-generation service. Reusable source evidence research may be resolved from external skills using `npx skills`; do not vendor those providers here or let retrieval output substitute for verified field evidence.

Use local patch/diff/validate to inspect corrections. Unknown amounts and unresolved references stay explicit. Source-language content can be import-ready without an automatic translation step. A candidate file is not a saved dataset; persistence uses a separate authorized create/save with exact preconditions, followed by readback. Review and data-product Release remain distinct.

When operating inside a registered Foundry task, keep its supplied context, account intent, current work items and returned structured actions. Return source or semantic input through those actions; do not call private Foundry commands, manufacture checkpoints, advance queues or replace the runtime. Use the ordinary Foundry entry for managed operations. Independent CLI work uses the environment owner's qualified launcher and current help, with no direct transport or credential parsing.
