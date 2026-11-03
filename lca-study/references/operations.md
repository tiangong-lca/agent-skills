# Operation recipes

These recipes describe the P2 core v2 and reporting v3 interfaces. Run commands through this package's `scripts/run-cli.mjs`; the following table omits that common prefix. Operation/schema/request IDs are filled by the CLI when absent. Mutations use `--input <file> --state-dir <private-retained-directory> --json`; reads use `--input <file> --json`. Preserve returned envelopes and use their `data` resource, not an invented success value.

| Command | Request fields and source |
| --- | --- |
| `study create` | `title`, `scope: {kind: "personal"}` or an authorized `{kind: "team", teamId}` |
| `study get` | `studyId` |
| `study list` | `limit`, `cursor` (initially null) |
| `study resources` | `studyId`, `kind`, `limit`, `cursor`; reporting kinds select `--api-version 3` |
| `study model source resolve` | `studyId`, `originRef: {type: "datasetRevision", datasetType: "lifecyclemodel", id, version}` from the selected dataset |
| `study model source get` | `acquisitionId` from the source-resolution response |
| `study model prepare` | `studyId`, `source`, exact admitted `profileId` and `calculationContractRef`; base snapshot preparation also takes exact ordered `methodRefs` and declared `cutoffs` |
| `study model get` | `preparationId` |
| `study revision create` | `studyId`, `parentRevisionId` (null for first revision), `definition`, `modelPreparationId`, issued `modelRef` |
| `study revision get` | `revisionId` |
| `study revision freeze` | `target: {type: "studyRevision", id, expectedRevision}`, `expectedContentHash` from the current draft |
| `study scenario create` | `studyRevisionId`, `parentScenarioRevisionId` (null initially), `overrides` |
| `study scenario get` | `scenarioRevisionId` |
| `study scenario freeze` | `target: {type: "scenarioRevision", id, expectedRevision}`, current `expectedContentHash`, completed `modelPreparationId` |
| `study run submit` | Frozen `studyRevisionId`, `scenarioRevisionId`, issued `expectedInputHash`, exact `calculationContractRef`, admitted `profileId` |
| `study run get` | `runId` |
| `study task get/wait/cancel` | `studyId`, `resource: {type, id}` selecting `modelSourceAcquisition`, `modelPreparation` or `run`; cancellation also needs `reason` |
| `study analysis request` | `studyId`, `profileId: "lca.study-analysis-explicit-v1"`, `config: {schemaVersion: "lca.study-analysis-config.v1", kind, runIds}`; kind is contribution (one Run) or comparison (two ordered distinct Runs); CLI derives the config hash |
| `study analysis get` | `analysisId` |
| `study analysis task get/wait/cancel` | `studyId`, `resource: {type: "analysis", id: analysisId}`; cancellation also needs `reason` |
| `study artifact download` | `studyId`, exact issued `artifactRef`; add `--output <new-file>`, and `--api-version 3` for analysis/report artifacts |
| `study report create` | `studyId`, `parentReportRevisionId` (null initially), ordered `runIds`, `analysisIds`, `templateId: "lca.study-report.v1"`, `content` |
| `study report get` | `reportRevisionId` |
| `study report save` | `target: {type: "reportRevision", id, expectedRevision}`, complete replacement `content` |
| `study report freeze` | The same typed target and current `expectedContentHash` |
| `study export request` | `reportRevisionId`, current `expectedContentHash`, `rendererVersion: "1.0.0"`, `viewModelVersion: "lca.study-report-view.v1"` |
| `study export get` | `exportId` |

Snapshot preparation source is `{type: "modelSourceSnapshot", snapshotId, contentHash, digestScope: "artifact_bytes_sha256"}` from the issued snapshot artifact. Scenario preparation source is `{type: "scenarioRevision", scenarioRevisionId, expectedRevision, contentHash}` from the current Scenario draft; omit both `methodRefs` and `cutoffs` because the frozen base supplies them. Wait for completion before adopting its references.

The Study definition is `{goal, functionalUnit: {amount, unit, referenceFlowId}, systemBoundary, methodRefs, assumptions}`. Functional-unit amount is a positive decimal string. Each method is an exact `{type: "datasetRevision", datasetType: "lciamethod", id, version}`. Assumptions carry `{id, statement, evidenceRef}`. Cutoffs carry `{port: {instanceId, exchangeId}, reason}`. These are scientific choices supported by evidence, not arbitrary values to satisfy a schema.

The initial Scenario override is `{path: "/instances/<instance>/exchanges/<exchange>/amount", value: <finite-number>}`; an empty array is a baseline. Overrides replace the complete current layer relative to the StudyRevision, rather than merging a parent Scenario layer. A draft can be saved using its fresh typed target; branching uses a frozen parent. Do not submit unsupported provider or parameter mutations.

## Claims and export

`content` has schemaVersion `lca.study-report-draft.v1`, `title`, nonempty `claims`, `sections`, `tables`, `charts` and `additionalLimitations`. Each claim is `{claimId, bundleRef, factId, canonicalValue, unit, display: {style: "exact"}}`: copy the complete analysis facts reference, exact fact ID, canonical decimal string or null, and unit from the producer. Do not recalculate or round the claim. Sections use `{sectionId, title, paragraphs, claimIds}`; tables and charts use their respective `tableId`/`chartId`, `title`, `claimIds`. Empty presentation arrays are allowed. Narrative text is not automatically evidence-validated.

Download with `study export download --input <artifact-request.json> --output-dir <new-directory> --anchors <trusted-anchors.json> --expected <selected-export.json> --json`. The input is `{studyId, artifactRef: <issued bundleRef>}`. Expected selection is `{issuerId, exportId, studyId, reportRevisionId, reportContentHash}` from the independently selected service export and trusted issuer. The environment owner supplies trust anchors; do not manufacture them from the downloaded bundle.

Use `study export verify --directory <directory> --anchors <trusted-anchors.json> --expected <selected-export.json> --json` without network access. Opening HTML does not itself verify authenticity. Do not discard detached evidence or claim present-day validity from an offline copy.

## Recovery and conflicts

Retain every mutation's intent file before proceeding. For interrupted or lost replies use the original `study request recover --intent-file <file>`, with the same configured environment and actor/client. Do not edit intent bytes, mint a replacement key, replay a different request or substitute another account. A denied replay still preserves the original outcome for authorized investigation.

For a revision conflict, fetch the selected resource and review the concurrent change. If the user's requested edit remains applicable, submit a newly reviewed edit with its current revision; do not silently increment an expected revision or overwrite the other edit. For a bounded wait returning `waiting: true`, continue reading the same typed resource. Authentication, permission, unsupported profile and invalid scientific input failures need their actual cause resolved, not repeated mutation attempts.
