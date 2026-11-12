# Method evidence and assessment

Read this reference for requested method assessment through an independently qualified installed CLI supporting V6. Run commands through this package’s `node scripts/run-cli.mjs`. Package version alone establishes neither this capability nor service admission, source rights or permission. Keep the configured installation, origin, actor and client fixed.

## Establish applicability and evidence

Read `study --help`, `study schema request --api-version 6 --json`, `study schema response --api-version 6 --json` and `study capabilities --api-version 6 --json`. These installed schemas supply exact owner fields and pinned module references; do not reproduce a private protocol or calculate hashes. Explicit V6 selects method evidence/assessment/report/review/share and export4. Core lifecycle stays V2, ordinary P2 reporting V3, P3 review V4 and advanced analysis V5. Retain saved requests in their original family. Missing installed commands require a qualified installation from its owner; unavailable operations/profiles require the service owner. Historical reads or cancellation may remain offered when new admission is disabled; they do not authorize new work.

The initial profile is `lca.study-method-pef-2021-ef31-cement-intermediate.v1`. Select one actual completed Run with frozen StudyRevision/Scenario in the same Study and its exact source/method/preparation/result references. Obtain the intended profile, product role, study phase, reference-unit basis and category-rule declarations from the user or authorized source. A matching schema does not establish applicability. Do not invent a `professionalRecord`, Commission-developed category rule or applicability evidence to satisfy input requirements.

Register only the authorized evidence:

```sh
tiangong-lca study method evidence register --api-version 6 --input method-evidence.json --state-dir private-original-state --json
tiangong-lca study method evidence get --api-version 6 --input evidence-selector.json --json
```

Registration input is `{studyId,content}`; content uses `schemaVersion:"lca.study-method-evidence.v1"`, `requirementId`, `declaredKind`, `title`, `statement` and typed `citations`. Preserve exact source identities, versions, hashes where supplied and locators; do not include credentials, private transport locators, raw source packets or invented citations. Reading uses `{evidenceId}`. The logical `evidenceId` differs from `artifactRef.id`. A receipt remains `recorded_unverified`, including a declared professional record; recording does not approve evidence, waive a requirement or grant factors/disclosure rights.

## Request and inspect the exact assessment

Assessment input is `{studyId,profileId,config}` with `config.schemaVersion:"lca.study-method-assessment-config.v1"`, `baselineRunId`, the installed schema’s exact `moduleRef`, explicit `declarations` and `evidenceRefs`. Copy the issued same-Study evidence refs, requirement IDs and declared kinds. A `commissionDeveloped` category rule selects its actual registered PEF-01 applicability record by logical `evidenceId`; an artifact ID/hash alone is insufficient. The CLI owner codec derives `configHash`; never manufacture one or alter a prior intent.

```sh
tiangong-lca study method assessment request --api-version 6 --input method-request.json --state-dir private-original-state --json
tiangong-lca study method assessment get --api-version 6 --input assessment-selector.json --json
tiangong-lca study method assessment task wait --api-version 6 --input assessment-task.json --json
```

Get uses `{assessmentId}`. Task get/wait/cancel use `{studyId,resource:{type:"methodAssessment",id:assessmentId}}`; cancellation also needs its authorized reason and retained mutation state. A submit or `waiting:true` does not prove completion. Preserve failed/blocked/cancelled/stale diagnostics and follow current owner actions. On a lost reply keep the original request, key, family, installation and private state, then run `study request recover --intent-file <original-file>`. Do not generate a new key, switch credentials/scope, duplicate the assessment or repair private queues.

After completion, fetch the exact returned facts descriptor with `study artifact download --api-version 6 --input facts-descriptor.json --output new-method-facts.json --json`. Preserve the full `lca.study-method-assessment-facts.v1` artifact, config/module/source identity, frozen evidence and source references. Read all twenty requirements, twenty-five categories and fifty-eight catalog facts, including machine/professional/source states, roles, values, units, coverage, reason codes and limitations. Claims must retain issued catalog selectors and canonical strings or null; this skill computes no facts or normalisation/weighting (N/W).

The twenty-five categories distinguish sixteen primary N/W roles from nine decompositions; decompositions never enter the candidate single score. Current all-pairs factor coverage makes complete sixteen-category N/W unreachable for legal nonempty inventories under this initial profile. Report the actual unavailable candidate score, null values and producer reasons. Do not invent a positive case, convert missing characterization factors to zero or non-applicable, suppress gaps, or imply that adding declarations fixes that structural limit. Source fidelity, machine checks, professional judgment, PEF conformity, scientific ranking and business-pilot qualification are separate; the initial profile’s three qualification flags remain false.

## Author and share the bound method report

Create with one `runIds:[baselineRunId]`, one `methodAssessmentIds:[assessmentId]`, `templateId:"lca.study-method-report.v1"` and `content.schemaVersion:"lca.study-method-report-draft.v1"`; do not substitute `analysisIds` or a V5 template. Claims select the exact `methodAssessmentFacts` bundle ref, Worker `factId`, canonical value or null, unit and `display:{style:"exact"}`. Use the installed schema for sections/tables/charts and limitations. Author prose cannot override the complete mandatory assessment summary.

```sh
tiangong-lca study report create --api-version 6 --input method-report.json --state-dir private-original-state --json
tiangong-lca study report save --api-version 6 --input fresh-method-draft-cas.json --state-dir private-original-state --json
tiangong-lca study report freeze --api-version 6 --input fresh-method-freeze-cas.json --state-dir private-original-state --json
tiangong-lca study report view --api-version 6 --input exact-report-selector.json --json
tiangong-lca study actions --api-version 6 --input report-resource.json --json
tiangong-lca study report current --api-version 6 --input exact-report-selector.json --json
```

Use fresh server revision/content-hash CAS for save/freeze. Review, delegation, finalization, comments and named sharing follow [the existing authority and recovery rules](review-sharing.md), using explicit `--api-version 6` for this report family. Current actions/state govern permission; the original recovered value can differ from latest state. OAuth review needs a real exact one-use first-party delegation. Comments, author declarations and internal report approval are not independent scientific approval. Study member administration remains V4; V6 does not provide member management. Changed frozen content requires a new report revision and fresh review/grants.

The method view retains all twenty requirements, twenty-five categories, fifty-eight facts, limitations and false qualification flags independently of authored claims. Its selected-factor summary points to complete selected records in the exact facts artifact; it does not embed the complete original source catalog or grant facts access. Keep full source bindings in authorized evidence and state the projection’s disclosure limits.

An export requires exact frozen report/hash, currently eligible `finalizationId`, fresh `expectedReviewStateHash`, `rendererVersion:"3.0.0"` and `viewModelVersion:"lca.study-report-view.v3"`. Use the actual admitted finalization profile; do not infer a legacy unfinalized shortcut.

```sh
tiangong-lca study export request --api-version 6 --input finalized-method-export.json --state-dir private-original-state --json
tiangong-lca study export download --api-version 6 --input export-selector.json --output-dir new-export-directory --anchors trusted-anchors.json --expected selected-export.json --json
tiangong-lca study share download --api-version 6 --input share-selector.json --output-dir new-share-directory --anchors trusted-anchors.json --expected selected-export.json --json
tiangong-lca study export verify --api-version 6 --directory new-export-directory --anchors trusted-anchors.json --expected selected-export.json --json
```

Export/share selectors use `{exportId}`/`{shareId}`. The environment owner supplies independent issuer/renderer anchors and the selected `{issuerId,exportId,studyId,reportRevisionId,reportContentHash}`. The CLI verifies manifest.v4/bundle.v4, exact renderer3 bytes and the complete detached package; retain HTML, projection, manifest and receipt together. Do not relabel historical packages or trust a key supplied by a report. Named grants expose only the authorized projection; use current denial/revocation/expiry/withdrawal actions without credential or role fallback. Offline verification authenticates historical signed bytes, not current access/review or scientific validity, and cannot recall downloaded copies.

Hand off exact Study/baseline/evidence/assessment/facts/report/export identities, source refs, declarations, gaps/null reasons, current versus historical state, trust selection and original recovery locations. Synthetic/copied/offline checks do not prove actual installed paired-runtime execution, a real complete industry case, professional review or production activation.
