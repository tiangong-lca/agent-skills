---
name: process-automated-builder
description: Author evidence-supported canonical Process datasets using current CLI contracts, validation and explicit writes; preserve scientific meaning and existing managed Foundry task boundaries.
---

# Process authoring

The Agent owns source research, scientific interpretation, unit-of-analysis selection and candidate content. CLI owns atomic contracts, validation and authorized persistence. Use this Skill for evidence-supported Process authoring, not a hidden CLI production scheduler. Registered Foundry tasks continue through the returned work items/actions and retain the selected runtime.

1. Establish the functional unit, system boundary, reference Flow/property/unit and amount. Resolve whether the source describes a production operation, service, average or aggregate before writing exchanges.
2. Retrieve field-level evidence with bounded queries and authoritative sources. Record the source location, units, period, geography, conversion and limitations in ordinary caller-owned notes. Unknown facts remain explicit; there is no CLI evidence-search queue or author-plan format to manufacture.
3. Inspect `dataset process contract`, discover existing candidates with `search` and exact `get`, and decide whether an existing identity already fits. Create a new identity only for a distinct object; do not generate an identity merely because a task resumed.
4. Author canonical Process JSON from the evidence. Distinguish intended applications, scientific use advice and technological applicability; draft/review state is not the data's intended scientific purpose. Preserve real identifiers and boundary/proxy restrictions.
5. Run `dataset process validate --input process.json --json`, inspect its validation layers and not-checked scope, and inspect exact reference evidence. Edit or apply a deliberate `patch`, then compare with `diff` and validate again. No automatic default unit, emissions, annual volume or provider weights may substitute for evidence.
6. Use distinct `create`/`save` request envelopes and current preconditions for an authorized write. A local draft file is not a persisted dataset. Review submission and Release publication are separate. Read exact content after confirmed writes; unknown effects use original-intent recovery.

`run-process-automated-builder.mjs` forwards current `dataset process <action>` arguments. Native operations include contract, search/get, validate, diff, patch, create/save and statistics. It does not implement auto-build/resume/publish queues or supply missing authoring facts. Read the supported operation's help for current input, output and failure semantics.

Names, descriptions and comments state domain facts only; operational attempts and repair history belong in task records.

## Scientific evidence and managed-runtime boundaries

Use the installed CLI validation and the actual owner authoring/repair capability. `annualSupplyOrProductionVolume` must come from explicit annual source evidence: a real annualized quantity with its unit and period. Never derive it from the quantitative reference flow's `meanAmount`/`resultingAmount`, from a default unit, from a per-year assumption of an unstated basis, or from a sentinel such as `9999`. When the source does not prove an annual volume, keep it unknown: the CLI's supported unknown representation (`[]`) with the row-level evidence gap its report records, and the open evidence need stated where the task tracks gaps. Structural validity is not evidence quality — read the CLI report's `validation_layers` (schema, authoring_evidence, content, multilingual) and its evidence-gap entries instead of re-implementing validation in the skill, treat such a row as neither publication-ready nor provider-weight eligible, and never let an LLM choose fresh weights per run. The bounded existing-owner-draft metadata repair lane is released: qualified Foundry 0.1.10 provides it (Foundry #171, released by #185 as `1e4f48bf8359f5e9bacba5741d15b7ff78f2eb41`) and it consumes the bounded existing-Process metadata admission from CLI #283, published since CLI 0.1.19. Run that repair only through the bounded lane and the `next_actions` the installed runtime returns: fresh before-image and the exact owner/state authorization the lane requires, one consumed attempt, no replay, unknown outcomes read back, publication left false, and no scientific field touched — the owners' recorded repair changed only the row's ownership-reference text. Never write the repair contract or its report yourself, and never claim a lane the runtime does not return. Installed support stays separate from merged source behavior: the recorded CLI `0.1.24` release evidence and the Foundry entry's adjacent lock for independently qualified Foundry `0.1.15` (whose bundled CLI `0.1.24` is independently bound by Foundry provenance) carry the unknown-`[]` behavior, the validation-layer report and that repair entry in their released sources, but the runtime you actually invoke is the authority. If that runtime still emits a numeric sentinel such as `9999` for a missing annual volume, or its report carries no validation-layer/evidence-gap fields, stop and report that qualified adoption is incomplete. Never hand-write, overwrite or delete the empty array in the dataset. Never rewrite or drop the runtime's report. Never bypass its gate. Keep merged source behavior and published support separate in every handoff.

Keep authored rows source-language only for import/publish handoff unless a separate post-import language-completion task explicitly requests additional language fields.

Prepare publish handoff only after evidence retrieval, unit-of-analysis decision, local schema/business validation, semantic review, reference verification, and matrix/compute readiness gates pass.
Read `references/ilcd_method_guardrails.md` and the Process naming public-rule references when their scientific topic applies; use actual verified public rule definitions.

## Runtime and authorization

Call `tiangong-lca` directly and read the needed command’s `--help --json`; preserve its current input format. Local validation and content processing do not require login. Before remote reads run `tiangong-lca auth status --json`; when login is required, hand `auth login` to a human in a trusted terminal. Never request a password, code or token. Use `auth doctor-auth --json` before authorized account-sensitive writes. Separate accounts with the caller's private `TIANGONG_LCA_SESSION_FILE`; never read its credentials in a Skill.

Read the shared result envelope and actual `completeness`, validation layers and artifacts. A completed invocation may report invalid content. Missing/invisible records are not permission to create a replacement. `create` and `save` are distinct intentions; a failed save never becomes a create, and an unknown write uses its original request/intent recovery, never a new request or replay. Local files, queries, validation and candidate generation do not publish or submit review.

## CLI selection

Call `tiangong-lca` directly. Read the needed command’s `--help --json` before constructing inputs. Optional Node wrappers use the same PATH command; `--cli-command <executable>` selects a custom path. If unavailable, follow the official CLI installation guidance. Existing managed tasks continue through their owner-returned actions.

If `tiangong-lca` is unavailable, follow its official installation instructions. Source development and controlled runtime settings are optional environment choices; ordinary use requires no identity file or digest.
