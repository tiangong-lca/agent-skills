# Semantic work

Apply the current task's schema and template. The field names below explain their purpose; the supplied contract remains authoritative for the exact shape.

## Evidence and closure

For completed non-test work, provide a concrete basis and structured evidence identifying the source/context plus a quote, trace, file/field path or citation. List the context kinds actually reviewed. Full-context tasks require the supplied schema, methodology YAML, ruleset, classification/location schema, source row, entity payload and applicable profile/dependency context.

When present, read the current task brief and only the registered decisions applicable to this work item's entities and evidence. Keep user statements, the runtime's interpreted decision, AI assumptions and independent source facts distinct in reasoning and returned evidence. Return the applicable decision IDs and adoption or non-adoption reason with each produced file; the invoking entry lists exactly those IDs in the semantic submission's `decision_ids`. Do not invent extra fields in a decision/patch file. A changed principle or source may invalidate only some outputs, but use the runtime's dependency and reassessment actions to establish that scope. If the scope cannot be established, ask for broader review instead of silently reusing old work.

Preserve `authoring_package` and its hash, task-specific `authoring_context.context_bundle_sha256`, and each required `closes_action_items` association. A shared bundle saves repeated reading; it does not replace entity evidence or the task's own context digest. Do not mark an unreviewed context kind as used.

Use `decision_status: completed` or `patch_status: completed` only when the work is complete. Keep an unresolved item explicit instead of supplying a plausible placeholder.

When the supplied record leaves a material human choice open, return a question to the invoking entry in ordinary language: what is missing, the consequence for the specific result, a justified recommended next step, and the precise answer or evidence needed. Offer a small set of meaningful options if appropriate, allow free text and “investigate first,” and disclose decision-critical limitations. Do not claim that choosing a method supplies missing measurements. The entry presents and registers the answer; this authoring role does not invent a chat-only resolution or treat silence as agreement.

## Identity decisions

Read completed current-row and relevant dependency preflight evidence. Compare names, dataset type, unit/property, geography, classifications, exchange context and source evidence; lexical similarity alone does not prove identity.

- `reuse_existing_reference` identifies the exact canonical table, ID and version supported by the selected candidate evidence.
- `create_new` requires evidence that candidates are not identity-equivalent and that the current workflow permits this decision. A historical profile never permits elementary-flow creation or account-local support writes. Routine authoring keeps Elementary Flow and LCIA Method identities immutable: never create, rename, reclassify or re-version them outside the dedicated owner gates (CLI #292/#307), and never treat a review skill's proximity as permission. Prefer canonical reuse; retain a blocker when current permission or evidence is missing.
- `block_unresolved` records what was searched, the remaining conflict or absence of evidence, and the next evidence needed.

Preserve dataset type, ID/version, package/context hashes, evidence and action-item closure from the template. The runtime owns partitioning writes/reference-only/unresolved rows and rewriting dependent references.

## Classification and location decisions

Use valid codes from the supplied category/location schema, selecting the justified leaf where required. Preserve `category_type`, completion status, dataset identity and the decision task's context hash. Location decisions also retain the exact `target_path`.

Use all relevant source geography: operation/supply location, exchange locations, referenced flow, name mix/location information and provenance. Resolve conflicting evidence explicitly. Formal location fields use codes; natural-language restrictions belong in their supported description fields. Do not encode classification/location decisions as generic patches when a dedicated task is supplied.

## Field patches

Fill the supplied patch template and only its supported operations. Paths address the current row shape: a canonical row may put the domain payload under `json`, so preserve a supplied `/json/...` pointer instead of assuming the payload is the root object.

Each operation needs its basis, structured evidence, `resolution.mode`, reviewed context kinds and the exact action items it closes. Supporting cleanup should close the same item it is needed to resolve. Do not hand-edit rows or create deterministic apply/validation reports.

Populate formal fields when the source proves a value; do not hide provable information in a general comment. Separate source name fragments into the appropriate name fields and use evidence-backed descriptions rather than generated placeholders. True source rows describe traceable reports, publications or datasets; format/compliance metadata must not become a fabricated publication identity. Keep dataset prose plain and scientific: descriptions, names and comments state domain facts, never workflow requests, approval counters, revision/resume histories, queue or action-item chatter. That operational history belongs in the task's evidence artifacts, not in the dataset.

For Process purpose or use-text work, read the supplied schema, methodology and any applicable examples in the source-bound context pack. Paths below are relative to `processDataSet`:

- `administrativeInformation.common:commissionerAndGoal.common:intendedApplications` records why the data were collected or developed, the supported study or decision, and declared detail, specificity or quality objectives. Base this on source evidence or the applicable task brief; do not substitute the next task action or invent a missing purpose.
- `modellingAndValidation.dataSourcesTreatmentAndRepresentativeness.useAdviceForDataSet` records scientific use instructions and limitations, including source-backed proxy, boundary and comparability restrictions.
- `processInformation.technology.technologicalApplicability` records the real-world applicability of the represented technology, product or service.

Return the exact affected path, offending text, evidence-backed replacement or move, and limits preserved by the repair in the supplied patch/evidence fields. If the purpose cannot be established, retain an explicit evidence gap. A schema pass does not prove this semantic check. Use only context actually supplied; report unavailable guidance instead of claiming that unreleased Spec examples were reviewed. Preserve scientifically meaningful identifiers, applicable EF supporting-dataset notices, and legitimate review/publication metadata in their designated fields. Do not apply a blanket UUID, draft or review keyword ban.

When evidence is insufficient, use only the work item's allowed resolution modes. `deferred_to_common_other` requires a structured unresolved trace with the blocked field, reason, evidence and next action; it cannot replace a mandatory schema value. Source-faithful exchange-completeness acceptance requires the explicit source evidence and permitted `source_trace_verified` mode. Missing annual supply is not a fabricated volume, a reference-amount derivative, a default unit per year or an arbitrary deferral: a genuinely unknown volume stays unknown. Deterministic cleanup normalizes it to the supported empty array and reports a row-level evidence gap, and the historical `9999 missing-data-sentinel/year` text is only a read-only recognition marker for rows written by earlier rounds — never write it and never derive an annual value from `meanAmount`/`resultingAmount`. Read the supplied CLI/Foundry report's validation layers and evidence gaps; do not re-implement the validator here, and do not treat a structurally valid unknown value as authoring evidence or provider-weight eligibility. The bounded existing-owner-draft metadata repair lane is released in qualified Foundry 0.1.10 (Foundry #171, released by #185 as `1e4f48bf8359f5e9bacba5741d15b7ff78f2eb41`) and consumes the bounded existing-Process metadata admission from CLI #283 published since CLI 0.1.19, so an existing draft's ownership-reference metadata can be repaired through the bounded lane and the `next_actions` the installed runtime returns — never by constructing the contract or the report here. Its limits are the lane's: fresh before-image and exact owner/state authorization, one consumed attempt, no replay, unknown outcomes read back, publication left false, scientific fields untouched. Installed support stays separate from the merged source: the wrapper's pinned published CLI 0.1.24 and the qualified Foundry 0.1.15 lock (its bundled CLI 0.1.24 is independently bound by Foundry provenance) carry the unknown-`[]` normalization, the validation-layer/evidence-gap report and the bounded repair admission in their released sources, but the runtime you actually invoke is the authority — an installed runtime that still emits the `9999`-style sentinel or returns a report without those layers is a stop-and-report condition (qualified adoption incomplete). Never hand-fabricate, overwrite or delete the empty array. Never edit or discard the report. Never bypass the runtime gate.

After files are returned, Foundry owns validation, deterministic application, current-row preflight refresh, dependency evidence preservation, finalize and any later authorized write/readback. Do not shortcut those stages or infer completion from a filename.
