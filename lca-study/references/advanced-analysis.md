# Advanced sensitivity and uncertainty

Use this reference only for requested OAT sensitivity or bounded uncertainty through an owner-qualified installed CLI and admitted V5 service. Run commands through this copied package’s `node scripts/run-cli.mjs`. The selected installation, actor, origin and client remain fixed. A missing V5 command needs a compatible qualified installation; an unavailable profile needs its owner. Do not install a different CLI, enable admission or silently change environments.

## Select the frozen baseline and declared design

Read `study --help`, then `study capabilities --api-version 5 --json`. V5 uses separate OAT and uncertainty profiles. `runtimeEnabled:false` can coexist with explicitly offered historical reads or owned-task cancellation after new admission is disabled; it does not permit new analysis or report authoring. Use the actual offered operation/profile and current server checks. Review/export admission is separate.

Select one actual completed Run whose StudyRevision and Scenario are frozen. Retain its issued Study/Run/preparation/input/model/calculation and source/method references. Fetch its current authorized parameter catalog:

```sh
tiangong-lca study analysis parameters --api-version 5 --input baseline-selector.json --json
```

`baseline-selector.json` contains `{studyId,baselineRunId}`. The result identifies exact non-reference exchange amount paths, baseline amounts, Flow/direction, unit and support identities from that frozen input. Copy those issued selectors and canonical baseline strings. Do not choose paths from a newer model, alter a reference exchange, infer a parameter by a display name or supply raw source documents. Catalog visibility is not permission for later execution or redistribution.

Prepare the analysis request from the user’s intended question and evidence. Keep scientific quantities as exact canonical strings, including `baselineAmount`, `low`, `high` and empirical values. Do not round, convert through a local number formatter, derive factors, sample inputs or calculate results in this skill. The CLI’s contained owner codec derives `configHash`; a caller-supplied hash must agree. Hash validity does not establish source rights or scientific applicability.

| Design | Explicit request fields |
| --- | --- |
| OAT sensitivity | `studyId`, `profileId:"lca.study-sensitivity-oat.v1"`, `config:{schemaVersion:"lca.study-analysis-config.v2",kind:"sensitivityOat",baselineRunId,parameters}`. Each parameter supplies the issued `path`, `unit`, `baselineAmount` and evidence-supported `low`/`high`. |
| Bounded uncertainty | `studyId`, `profileId:"lca.study-uncertainty-bounded.v1"`, the same config schema/baseline/parameters with `kind:"uncertainty"`; that config additionally contains `design`, explicit `sampleCount`, `seedHex` and required `generator:"study.uncertainty.hmac-drbg-sha256.v1"`. |
| Independent uniform design | `design:{kind:"independentUniform",independenceDeclared:true}`. The declaration is a scientific assumption, never a default inferred from missing correlation data. |
| Joint empirical design | `design:{kind:"jointEmpirical",rows:[...]}`. Every complete row follows parameter order and stays inside the declared supports. Preserve the supplied rows, their dependence and repeated-row weights; do not synthesize a correlation matrix or combine independently selected columns. |

Ranges, distributions, dependence and sample budgets require the intended scientific meaning and the service’s actual admitted limits. Record unresolved evidence or applicability instead of inventing values to satisfy a schema. Preserve the selected generator and seed for reproducibility; never choose a replacement seed or increase a budget to replay an unknown mutation. A fixed budget, mean MCSE or empirical quantiles do not prove convergence, tail precision, a confidence interval or superiority. A declared range is not acquired source uncertainty.

## Run and recover the exact analysis

```sh
tiangong-lca study analysis request --api-version 5 --input advanced-request.json --state-dir private-original-state --json
tiangong-lca study analysis get --api-version 5 --input analysis-selector.json --json
tiangong-lca study analysis task wait --api-version 5 --input analysis-task.json --json
```

Read input is `{analysisId}`. Task input is `{studyId,resource:{type:"analysis",id:analysisId}}`; get/wait/cancel select that same typed resource, and cancellation also carries the authorized reason. A submit or bounded `waiting:true` result is not completion. Do not create Scenario revisions or fake Run IDs for analysis-local evaluations.

Preserve the original mutation intent before continuing. On a lost reply, retain `UNKNOWN` and run `study request recover --intent-file <original-file>` with the original installation, environment and actor/client. The saved schema remains V5; do not rewrite an older V2/V3/V4 journal into it. Do not create another key, resample, redraw invalid evaluations, silently discard failed samples or repair a private queue. Use the server’s exact terminal task/analysis result and supported recovery path. A failed analysis does not supply a successful conditional subset.

Read authorized facts through the returned exact descriptor using `study artifact download --api-version 5 --input <descriptor-request.json> --output <new-file> --json`. Keep the registered facts.v2 identity and full configuration, effective limits, counts, evaluation/statistic contexts, coverage, quality findings and limitations. OAT secants are range-dependent, not local derivatives or interactions. Sampling baseline replay is not another stochastic sample. These are frozen numerical evaluations, not additional Study Runs, scientific certification or a technology ranking.

## Author, review and export the V5 report

V5 reports use `templateId:"lca.study-report.v2"` and `content.schemaVersion:"lca.study-report-draft.v2"`. Author with one real baseline `runIds` entry and the exact completed advanced `analysisIds` bound to it. Claims select the issued facts.v2 bundle and exact Worker catalog `factId`, canonical value or null, unit and `display:{style:"exact"}`. Keep parameter, endpoint, statistic and unit identities intact; do not reinterpret a dimensionless relative delta as the Method’s physical unit.

```sh
tiangong-lca study report create --api-version 5 --input advanced-report.json --state-dir private-original-state --json
tiangong-lca study report freeze --api-version 5 --input fresh-report-cas.json --state-dir private-original-state --json
tiangong-lca study actions --api-version 5 --input report-resource.json --json
tiangong-lca study report current --api-version 5 --input report-selector.json --json
```

Create/save/get/freeze/resources retain the installed command shapes from the P2 recipes, with explicit V5 fields and fresh server CAS/hash. The producer supplies complete settings, execution limits, counts, frozen provenance, coverage and limitations; author prose cannot suppress them. Undefined numeric values remain null with exact `reasonCodes`; complete or partial characterization coverage can coexist with an undefined zero-baseline ratio. Unknown factors are never a measured zero. Do not change coverage or erase a reason to make a table render.

Use explicit `--api-version 5` for report-scoped comments, review/delegation, current/view/finalize, shares and exports on this family. Retain the P3 authority and recovery rules: comments do not approve, OAuth review needs the real exact first-party-issued one-use delegation, and current eligibility/state comes from the service. Actions select the actual report/export/share. Study member management remains the existing V4 workflow; `member set --api-version 5` is unavailable. A changed frozen report needs a new report identity and fresh review; old approvals or grants cannot transfer.

A V5 export request supplies the exact frozen report/hash, currently eligible `finalizationId`, fresh `expectedReviewStateHash`, `rendererVersion:"2.0.0"` and `viewModelVersion:"lca.study-report-view.v2"`. It has no legacy unfinalized export shortcut. The detached package is manifest.v3/bundle.v3 and includes exact signed HTML, projection, finalization and renderer identity. Do not relabel a P2/P3 package or substitute its old renderer.

```sh
tiangong-lca study export request --api-version 5 --input finalized-export-request.json --state-dir private-original-state --json
tiangong-lca study export download --api-version 5 --input export-selector.json --output-dir new-export-directory --anchors trusted-anchors.json --expected selected-export.json --json
tiangong-lca study share download --api-version 5 --input share-selector.json --output-dir new-share-directory --anchors trusted-anchors.json --expected selected-export.json --json
tiangong-lca study export verify --api-version 5 --directory new-export-directory --anchors trusted-anchors.json --expected selected-export.json --json
```

Download selectors are `{exportId}` or `{shareId}`. The environment owner supplies independent issuer/renderer anchors and the independently selected `{issuerId,exportId,studyId,reportRevisionId,reportContentHash}` tuple. The installed CLI owns signature, complete file inventory, projection/finalization and exact renderer reproduction checks. Keep HTML, projection, manifest and receipt together. The report cannot supply its own trusted key, script or import path.

Named recipients receive only the authorized summary. Follow current denial, expiry, revocation and source withdrawal through public commands; do not grant Study/raw source/facts access or change sessions to overcome denial. A signature and `historicalFinalization` authenticate that historical snapshot. Offline `currentAccess/currentReview` stay `not-checked-offline`, and downloaded copies cannot be recalled. Report current acceptance separately from historical bytes.

## Handoff

Retain exact Study/baseline/Analysis/facts/report/export identities, declared design and evidence, actual execution settings/counts/limits, coverage/reasons/quality findings, scientific limitations, independent trust selection and original recovery locations. OAT/uncertainty, industry methodology, scientific review, source disclosure and publication are separate states. A copied wrapper or synthetic package test proves no installed paired runtime or scientific qualification; that proof belongs to the environment/task owner.
