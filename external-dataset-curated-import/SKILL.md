---
name: external-dataset-curated-import
description: Guide external LCA packages through supported CLI conversion, evidence-led candidate review and separate atomic persistence, or assist an existing managed Foundry task without changing its owner protocol.
---

# External dataset import

## Managed Foundry tasks

When the caller supplies a registered public Foundry task and its current result, use this skill as a domain helper. Review the selected package, profile and conversion evidence, or prepare the current requested semantic input. Keep the supplied workspace, task, actor and account intent. Return newly authored input files through the current public semantic/action contract and let Foundry register and validate them.

Use the current task brief and only the applicable registered decisions supplied by the caller. Distinguish a user's instruction from an AI assumption and the package's source facts; neither a choice nor a recommendation supplies missing measurements or write authority. Return a material unresolved gap to the ordinary Foundry entry with its affected result, evidence and precise question or next investigation. This managed-task guidance does not change the independent CLI workflow below.

Advance the task only through its supplied structured `next_actions`, preserving executable, argv, CWD and binding. Do not run the standalone atomic sequence below inside that task, overwrite registered rows or reports, write `checkpoint.json` yourself, or recreate a task after an uncertain write. Follow the original task's readback/recovery action. Task and account permission remain bound to the existing scope.

`foundry-tidas-import` is the ordinary entry for starting and continuing managed Foundry work. This helper can consume a supplied task result without requiring another skill directory to be installed. The remaining procedure applies to an independent CLI workflow whose state is outside the managed public task protocol.

## Boundaries

Independent conversion and validation do not authorize persistence. Keep managed and independent execution contexts separate.

## Independent import sequence

1. Establish input format, source/license, scope, intended use and actor/account constraints. Preserve original files. Source facts and conversion assumptions remain distinct.
2. Read `dataset <type> contract` for actual target schema, methodology and ruleset. Use `dataset import-lca convert --help` and only its supported format options for deterministic conversion; inspect conversion completeness and artifact paths.
3. Extract each canonical target document from the conversion output, keeping exact source/identity mappings. Do not treat row collections or command envelopes as single-object validation inputs.
4. Validate each selected document with `dataset <type> validate --input content.json`. Read issue paths, evidence gaps, actual check coverage and source-language semantics. Repair only from evidence, then inspect diff and validate again. Ordinary editable notes track unfinished work; no CLI curation queue/checkpoint protocol is required or provided.
5. Search/read existing candidates before deciding to create a distinct object. Preserve one stable draft identity/version while editing. Choose explicit create versus save, with the native request envelope and preconditions; reference-only objects do not gain public write authority because their schemas exist.
6. After an authorized write, inspect its actual receipt and exact readback. Submission uses review submit/resubmit separately. Release publication is another explicitly authorized workflow. Unknown effects recover the original intent without replay.

For field-level evidence or scientific judgment use the relevant domain Skill and public rules. Source-language imports do not require bilingual completion; apply translations only when requested. Keep unknown quantities unknown and never fabricate inventory to pass a gate.

Run `tiangong-lca auth status --json` before remote work; hand `auth login` to the human in a trusted terminal when required. Never collect a password or token. `auth doctor-auth --json` precedes account-sensitive writes. Call the installed `tiangong-lca` command directly; inspect command help and use official installation guidance if missing. In managed Foundry tasks, return selected input files through the owner's actual actions instead of independently advancing task state.
