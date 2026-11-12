# Review, finalization and named sharing

Use this reference when the user requests P3 actions. Advanced P4 reports use the separate [V5 recipes](advanced-analysis.md); keep the explicit version, view2/renderer2 and manifest3 family rather than reusing these P3 wire fields. All commands below use this copied package's `node scripts/run-cli.mjs` prefix. Keep its configured qualified installation and independent runtime expectation unchanged. No source checkout, package download, direct API/SQL, credential parsing or local review/numerical engine belongs here.

## Select the exact object and available action

Run the usual runtime/auth preflight from `SKILL.md`, then `study capabilities --api-version 4 --json`. A missing command needs an owner-qualified compatible installation; an unavailable service action needs the service/permission owner, not an automatic upgrade or environment switch.

Use `study actions --input <resource.json> --json` with `{resource:{type,id}}`; type is `study`, `reportRevision`, `export` or `share`. IDs come from the selected service objects, never names or guessed UUIDs. Keep exact issued spelling and original request keys. Actions, `corePermissions` and `allowedMemberRoles` are Database projections, not permissions to be derived by the agent. Discovery does not authorize a later operation; the server checks again.

Continue from the same Study/Report identities in Platform and CLI. A report can have an earlier successful finalization and now have invalidated acceptance. Read `study report current --input <report.json> --json` where the input is `{reportRevisionId,expectedContentHash}`. Its `data.value` supplies fresh report revision/hash, review-state hash, current/accepted review IDs, acceptance and validity. Do not derive an eligible review set from vote counts or timestamps. Copy `reportRevision` to `target.expectedRevision` and `reviewStateHash` to `expectedReviewStateHash` for the new action; do not reuse those fields from an older receipt.

`study report view` uses the same selector and returns safe JSON; Platform owns preview rendering. A named recipient uses `study share view` with `{shareId}` and receives only its authorized report projection. Neither view is a newly signed HTML export.

## Public request recipes

Prepare JSON files from current issued records and authorized user choices. Use `--input <file> --json`; mutations additionally retain `--state-dir <private-original-directory>`. CLI fills absent operation/schema/request/key fields. A first use with generated keys still returns a retained intent: preserve that path before proceeding.

| Command | Input fields and source |
| --- | --- |
| `study member set --api-version 4` | `target:{type:"study",id,expectedRevision}` from current Study, `memberId`, requested `role` or null. Use only an authorized server-offered role; reviewer is not core edit/source permission. |
| `study comment append` | `reportRevisionId`, `expectedContentHash`, `text`. An annotation is not approval. |
| `study comment list` / `study review list` | Exact report/hash, `cursor:null` initially and bounded `limit`; preserve subsequent issued cursors. |
| `study review record` | Exact report/hash, `reviewClass` (currently `"internal"`), `decision` (approve, reject or withdraw), `comment`, current `predecessorReviewId` or null, actual `delegationId` where required. Copy the exact actor/class predecessor from current service evidence; withdraw requires a predecessor. |
| `study review delegation issue` | Exact report/hash, intended `clientId`, admitted `reviewClass`, `decision` (approve, reject or withdraw), current `predecessorReviewId` or null, approved `expiresAt`. Requires an authorized first-party context. |
| `study review delegation list` | Exact report/hash, `cursor`, `limit`. |
| `study review delegation revoke` | Issued `delegationId`. Revocation needs its current authorized context. |
| `study report current` / `study report view` | Exact `reportRevisionId`, `expectedContentHash`. |
| `study report finalize` | `target:{type:"reportRevision",id,expectedRevision}`, `expectedContentHash`, current issued `expectedReviewStateHash`, chosen admitted `profileId`, exact `acceptedReviewIds` selection. |
| `study export request --api-version 4` | Exact report/hash, currently eligible issued `finalizationId`, fresh `expectedReviewStateHash`, `rendererVersion:"1.0.0"`, `viewModelVersion:"lca.study-report-view.v1"`. |
| `study export get --api-version 4` | Issued `exportId`. |
| `study share create` | Exact report/hash and `exportId`, authorized named `recipientId`, admitted `disclosurePolicyId`, approved `expiresAt`. |
| `study share get` / `study share view` | Issued `shareId`. |
| `study share list` | Exact report/hash, `cursor`, `limit`. |
| `study share revoke` | Issued `shareId`, `reason`. |

All newly named P3 commands select v4. Existing `member set` defaults to v2, and existing export request/get/download defaults to v3: keep the explicit `--api-version 4` shown above. Do not infer an upgrade from a body field or reuse a v2/v3 request under a v4 key. P2 authoring, Scenario editing, analysis and historical export recipes remain in [operations](operations.md).

## Decision authority and pending outcomes

OAuth review requires a real first-party-issued one-use delegation bound to the exact actor, OAuth client, report revision/hash, class, decision and predecessor. Obtain it through the authorized first-party UI/service workflow. The CLI exposes equivalent issue/list/revoke commands, but calling issue under a denied OAuth context does not create first-party authority. Do not generate a grant identifier, set an authority field, borrow another session, widen membership, or replace a denied context. An approval recorded by an actor or automation is not proof of human/independent judgment.

Use only the requested profile advertised by the service. For internal review, take the current server-qualified accepted review identities; do not rebuild eligibility locally. An unreviewed profile and empty accepted set do not satisfy a request for reviewed acceptance. If authority, a current predecessor or the intended profile's evidence is absent, retain the work and identify the missing authorization/evidence. Do not silently select an easier profile.

On timeout/lost reply, keep the original intent and run `study request recover --intent-file <original-file>` under the same qualified installation and actor/origin/client. Do not edit the intent, request a new grant/key to retry the same unknown decision, or assume expiry means nothing committed. First consumption and historical receipt recovery differ; let the owner reconcile the original outcome under current authorization. If recovery is denied, preserve the original state for authorized investigation.

A successful `review record` may return its original review with newer `data.state`. Likewise `report finalize` returns the original immutable `data.value` and fresh `data.state`, whose latest finalization can be different or invalidated. Preserve both identities. Before a new export/share, reread current state/actions and select currently eligible evidence; the old successful receipt alone is insufficient. A current unreviewed finalization does not fulfill a request for reviewed acceptance.

If content changes, create a new ReportRevision through the P2 `study report create` recipe, with the frozen parent and exact new content/facts; freeze using its fresh CAS/hash. Its new identity requires fresh review/delegation and finalization. Never attach old approvals/grants to it or relabel an old signed package. On CAS/head conflicts, inspect the concurrent change and reconcile the original intent before proposing a distinct newly authorized action.

## Download and current access

For a finalized owner export, prepare `{exportId}` and run:

```sh
tiangong-lca study export download --api-version 4 --input export-request.json --output-dir new-export-directory --anchors trusted-anchors.json --expected selected-export.json --json
```

For a named share, prepare `{shareId}` and run:

```sh
tiangong-lca study share download --input share-request.json --output-dir new-share-directory --anchors trusted-anchors.json --expected selected-export.json --json
```

The environment owner supplies independent issuer/renderer trust anchors. The independently selected expected tuple is `{issuerId,exportId,studyId,reportRevisionId,reportContentHash}`; do not take the report's own key as trust. CLI checks the authorized resource descriptor, signature, exact report/finalization/projection binding and same pinned renderer before publishing HTML/projection/manifest/receipt together. Do not bypass failure with raw URLs, source/model/facts downloads or hand-rendered HTML. Keep each verified package in its own new directory.

Use the existing offline `study export verify --directory ... --anchors ... --expected ... --json` for either P2 or P3 packages. P2 remains unreviewed/not finalized. P3 `historicalFinalization` describes that signed snapshot; offline `currentAccess/currentReview` remain `not-checked-offline`. Online `authorizationAtDownload` describes only the authorized operation at download time.

Check current share/report state and honor live denial, revocation, expiry and source withdrawal. An earlier active record or valid signature cannot override a denied view/download; ask the actual owner to resolve the cause within the authorized scope, without expanding recipient access to the Study or source. A revoked/expired share blocks future authorized access, but cannot recall copies already downloaded. Offline verification can still authenticate old bytes; it neither restores access nor establishes current approval. Report historical and current outcomes separately.
