# Hosted calculation projects

Read this reference only when the user explicitly requests an existing or new hosted calculation project, or a hosted analysis/report capability. Local Model research follows [Model calculation](model-calculation.md) and does not create a hosted Study automatically. Local normal sparse-factor applicability is distinct from the selected hosted producer's recorded coverage contract; preserve issued historical diagnostics and signed artifacts without applying that contract to local results.


Use the installed TianGong CLI to run the user's calculation. A calculation project holds the model, calculation definition, scenarios and runs. Existing installations still use the `lca-study` skill ID and the `study` CLI command; request and response fields retain their original names.

## Start or resume

Call the installed `tiangong-lca` command directly. Inspect the required command’s `--help --json`, then run `tiangong-lca auth status --json`. No runtime expectation variables are required for ordinary use. If login is required, hand `auth login` to the user in a trusted terminal. Never collect passwords, codes, tokens or keys. Run `auth doctor-auth --json` before account-sensitive mutations and preserve the intended actor/project/client. For an explicitly configured local environment, the CLI may return `tiangong.cli-loopback-auth-doctor.v1`: require `scope: explicit-loopback`, `status: passed`, and the intended current origin, actor, client and configured callback. That diagnostic is local identity evidence, not a Production project receipt or proof of a historical login callback.

Read `study --help` and `study capabilities --json` for the core V2 path. Use only currently admitted operations and exact profiles. If the requested operation is missing, distinguish an incompatible CLI installation from a capability the selected service does not offer. Keep the selected installation and service fixed; installation does not grant permission or enable a service.

For an existing calculation project, use its exact ID with `study get` and `study resources`. Preserve the original private state directory and pending intent files. A lost response is an unknown outcome: use `study request recover --intent-file <original-file>`, never recreate the mutation with a new key. Use [the operation recipes](operations.md) for request fields and conflict recovery.

## Run one calculation

Use these steps when a new run is needed. If the user wants to interpret an existing run or continue an existing report, reuse its exact identities and skip mutations that have already completed.

1. Establish the calculation purpose, functional unit, model boundary, exact LCIA methods and material assumptions. Ask only for choices that affect the requested calculation. Reuse an authorized exact LifecycleModel version and any matching existing frozen inputs; source acquisition does not invent missing datasets or make licensing decisions.
2. Use or create the personal or team calculation project. Resolve the selected model source and wait for its acquisition. Prepare the model with the exact method references and declared cutoffs; keep missing factors, excluded inputs and source contradictions visible.
3. Create the calculation definition revision (`study revision create`) with the completed base preparation and issued model reference. Take the exact functional-unit reference Flow and unit from the prepared input. Read the current revision and hash, then freeze after validation. For a new baseline, create one scenario with `overrides: []`, complete its preparation and freeze its exact revision.
4. Submit one run using the completed frozen Scenario preparation’s `inputHash` as `expectedInputHash`. Poll the typed task, then follow [the V2 result recipe](operations.md#read-one-v2-result) to verify and read the result with its bound prepared input. A successful submission or `waiting: true` is not a completed computation. Preserve diagnostics and follow the owner recovery path on failed, blocked, stale or cancelled tasks; do not repair private queues or callback results.
5. Return results with units, selected method versions, relevant assumptions and coverage. Report an impact as unavailable when all characterization factors for its nonempty inventory are missing, even if the raw score is zero. Label partial scores with their missing factors and report the run’s validity separately from completion. If the user asked for a calculation only, stop here.

## Add analysis or reports when needed

- For requested contribution analysis, comparison or ordinary report authoring, check `study capabilities --api-version 3 --json` and follow [the V3 recipes](operations.md). Contribution uses one completed run. For comparison use two distinct, ordered runs. If an alternative is needed, prepare and freeze its exact scenario before submitting that run. Explain the change and label illustrative perturbations. Keep units, coverage, scenario differences and comparability visible before interpreting differences. Do not rank incomparable or partially characterized scores as complete product performance.
- For requested sensitivity or uncertainty, use [advanced analysis](advanced-analysis.md) and `study capabilities --api-version 5 --json` with explicit V5 selection. Continue from one completed frozen baseline. Keep user-declared ranges, dependence assumptions, sampling settings and actual limits visible; derived evaluations are analysis evidence, not extra runs.
- For requested method evidence, assessment or a method-bound report, use [method assessment](method-assessment.md). Select explicit V6 through a qualified installation and current capabilities. Preserve recorded-unverified evidence, complete assessment gaps and unavailable normalization or weighting. Industry method applicability and professional approval apply to this separate assessment and are not prerequisites for the core calculation.
- For a requested report, bind each structured numerical claim to the exact immutable facts, canonical value and unit from its producer. Separate numerical claims from interpretation. Include scope, assumptions, missing factors, cutoffs, limitations and provenance. Save or freeze against the fresh revision and content hash; changing frozen content requires a new revision. For a requested unreviewed V3 export, use the original export recipe.

## Review and sharing

For requested review, finalization or named sharing, check capabilities for the selected family and read its current action availability. Ordinary review uses `study capabilities --api-version 4 --json` and `study actions --input <typed-resource.json> --json`; use [the V4 recipes](review-sharing.md), including explicit V4 for member and export upgrades. V5 and V6 report review or sharing follow their own references.

Perform the decisions, grants and disclosures the user has authorized; existing task authorization need not be requested again. Bind every comment or decision to its exact report revision and content hash. Comments are annotations. A first-party actor decision does not prove human or independent scientific judgment. An OAuth decision needs the actual separately issued, exact one-use delegation; missing or denied authority is a boundary, not a reason to mint evidence or change sessions.

A recovered mutation can return its original immutable `value` alongside a different latest `state`; retain both. Never treat the old result as current approval. Changed frozen content needs a new report revision and fresh review or delegation; approvals and old grants do not transfer.

Named sharing exposes only the authorized report projection. It does not grant access to the calculation project, model, raw source or underlying facts. Keep actor/origin/client and the selected installation fixed; an explicitly authorized recipient test needs its own owner-configured context, never borrowed owner credentials. Handle denial, revocation, expiry and source withdrawal through current public commands. Do not repair SQL, call an API directly, expand roles, or edit a signed package to make it work.

## Export and handoff

For an authorized export, use independently configured issuer and renderer trust anchors and the exact selected export identity. Verify the detached package before inspecting the HTML offline. Preserve the HTML, projection, manifest and receipt together; a public key supplied by the report is not its own trust anchor.

V3 exports are unreviewed and not finalized; finalized exports retain their exact historical review and finalization state. Offline verification proves signed historical bytes and renderer consistency. Current access, withdrawals and review require online readback; neither verification nor actor approval establishes scientific validity. Downloaded copies cannot be recalled.

Report exact calculation project, revision, scenario and run identities and the requested analysis, report and export identities where applicable. Include numerical findings with units and any applicable fact references, relevant source and method identities, coverage and limitations, saved recovery locations and unfinished steps. Keep private state and authorization data out of public reports. Dataset publication, report approval and external sharing need their own supported actions and authorization.
