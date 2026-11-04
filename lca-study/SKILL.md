---
name: lca-study
description: Conduct or continue a TianGong LCA Study, compare scenarios, evaluate admitted sensitivity, uncertainty or method profiles, and prepare, review or share revision-bound reports through the qualified installed CLI. Use for research workflows; dataset authoring and publication remain separate.
---

# LCA Study

Use the configured installed TianGong CLI to create or continue the user's research. Keep the scientific question, functional unit, system boundary, method versions, assumptions and evidence gaps explicit. A successful calculation is engineering evidence, not a scientific review or certification.

## Start or resume

Run this package's `node scripts/run-cli.mjs --runtime-info`, then `auth status --json`. The shared launcher requires the installation and independently approved runtime expectation supplied by the environment owner; it does not install, choose a version, discover a sibling checkout or read credentials. If login is required, hand `auth login` to the user in a trusted terminal. Never collect passwords, codes, tokens or keys. Run `auth doctor-auth --json` before account-sensitive mutations and preserve the intended actor/project/client. For an explicitly configured local environment, the CLI may return `tiangong.cli-loopback-auth-doctor.v1`: require `scope: explicit-loopback`, `status: passed`, and the intended current origin, actor, client and configured callback. That diagnostic is local identity evidence, not a Production project receipt or proof of a historical login callback.

Read `study --help` and both `study capabilities --json` and `study capabilities --api-version 3 --json`. Use only currently admitted operations and exact profiles. For review, finalization or named sharing, also read `study capabilities --api-version 4 --json` and `study actions --input <typed-resource.json> --json`. Display current server actions and role choices; do not infer permissions from another role, an old receipt or a successful calculation. Missing commands require a compatible qualified CLI installation; missing runtime capabilities require the service owner. Do not enable a service or silently change environments to make an operation succeed.

For requested sensitivity or uncertainty, read [advanced analysis](references/advanced-analysis.md), then use the selected installation’s V5 help and `study capabilities --api-version 5 --json`. Existing core/P2/P3 defaults remain unchanged; do not infer V5 admission from a command name or upgrade a saved request.

For requested method evidence, assessment or a method-bound report, read [method assessment](references/method-assessment.md). Select explicit V6 through a qualified installation and current capabilities; preserve recorded-unverified evidence, complete assessment gaps and unavailable N/W without inferring scientific approval.

For an existing Study, use its exact ID and `study get/resources` to recover state. Preserve the original private state directory and pending intent files. A lost response is an unknown outcome: use `study request recover --intent-file <original-file>`, never recreate the mutation with a new key. Read [the operation recipes](references/operations.md) when preparing request files or continuing after a conflict.

## Research workflow

1. Establish the intended comparison and the evidence needed to interpret it. Ask only for material missing choices. Reuse an existing authorized exact LifecycleModel revision; source acquisition does not invent missing datasets or make licensing decisions.
2. Create the personal/team Study, resolve the selected model source, and wait for its actual acquisition. Prepare a model with exact method references and declared cutoffs. Keep missing factors, excluded upstream inputs and source contradictions visible.
3. Create a StudyRevision with the agreed definition and the issued model preparation/reference. Read its current revision/hash and freeze it only after validation. Do not calculate or fabricate owner hashes.
4. Create baseline and alternative ScenarioRevisions from that frozen StudyRevision. The initial supported override changes an identified instance/exchange amount. Explain why the alternative is relevant and evidence-supported; an illustrative perturbation must remain labelled as such. Prepare each Scenario and freeze its exact current revision before submitting a Run.
5. Poll the typed Study task and read the completed Run. A successful submit or `waiting: true` is not a completed computation. On failed/blocked/stale/cancelled tasks, preserve diagnostics and follow the owner recovery path; do not repair private queues or callback results.
6. Request contribution analysis for one Run and comparison for two ordered Runs. Inspect comparability, coverage, scenario differences and quality findings before interpreting deltas. Never rank incomparable or partially characterized scores as complete product performance; unknown factors remain unknown.
   For requested OAT sensitivity or bounded uncertainty, continue from one completed frozen baseline through the separate V5 recipe. Keep user-declared ranges, dependence assumptions, sampling settings and actual limits explicit; derived evaluations are analysis evidence, not extra Runs.
7. Author a report whose structured numerical claims select exact immutable analysis facts, canonical values and units. Separate sourced numerical claims from narrative interpretation. Include scope, assumptions, missing factors, cutoffs, limitations and provenance. Save/freeze using fresh CAS revision/hash evidence; frozen content requires a new revision for changes.
8. For a P2 unreviewed copy, follow the original v3 export recipe. For requested review, finalization or named sharing, read [review and sharing](references/review-sharing.md) first; existing member/export commands require explicit `--api-version 4` for P3. Download the authorized export with independently configured issuer/renderer trust anchors and the exact selected export identity. Verify the detached package, then inspect the HTML offline. Preserve the HTML, projection, manifest and receipt together. Never accept a public key supplied by the report as its own trust anchor.

## Review and sharing

Perform the decisions, grants and disclosures the user has authorized; existing task authorization need not be requested again. Bind every comment/decision to its exact report revision and content hash. Comments are annotations. A first-party actor decision does not prove human or independent scientific judgment. An OAuth decision needs the actual separately issued, exact one-use delegation; missing or denied authority is a boundary, not a reason to mint evidence or change sessions.

Read current report state and action availability before finalization or sharing. A recovered mutation can return its original immutable `value` alongside a different latest `state`; retain both. Never treat the old result as current approval. Changed frozen content needs a new ReportRevision and fresh review/delegation; approvals and old grants do not transfer. Follow [the P3 recipes](references/review-sharing.md) for current-state selection, pending outcomes and named-recipient access.

Named sharing exposes only the authorized report projection. It does not grant Study, model, raw source or facts drilldown. Keep actor/origin/client and the selected installation fixed; an explicitly authorized recipient test needs its own owner-configured context, never borrowed owner credentials. Handle denial, revocation, expiry and source withdrawal through current public commands. Do not repair SQL, call an API directly, expand roles, or edit a signed package to make it work.

## Report and handoff

P2 exports remain unreviewed and not finalized; P3 exports retain their exact historical review/finalization snapshot. Offline verification proves signed historical bytes and renderer consistency; it does not check current permissions, withdrawals, review status or scientific validity. Downloaded copies cannot be recalled. Current online acceptance is separate from either signed snapshot. Sensitivity and uncertainty use only separately admitted V5 profiles and retain their full settings, coverage and producer reason codes. Method assessment uses the separately admitted V6 workflow; profile applicability, professional evidence and industry qualification remain explicit and are never inferred from a command or report approval.

Report the exact Study/Revision/Scenario/Run/Analysis/Report/Export identities, relevant source/method identities, numerical findings with units and fact references, comparability and limitations, saved recovery locations and any unfinished steps. Keep private state and authorization data out of public reports. Finish only the requested scope; dataset publication, report approval and external sharing need their own supported action and authorization.
