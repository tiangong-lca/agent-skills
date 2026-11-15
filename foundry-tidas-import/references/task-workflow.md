# Public task workflow

The examples below show public Foundry arguments. Execute them through `node scripts/run-foundry.mjs`, using the environment-configured managed entry described in [runtime setup](runtime-setup.md). Inspect its selected identity and protocols with `runtime describe --json`. Keep returned executable/argv/cwd fields intact when continuing an action.

## Initialize or inspect

```text
tiangong-foundry workspace init --workspace <absolute-workspace> --json
tiangong-foundry doctor --workspace <absolute-workspace> --json
tiangong-foundry task status --workspace <absolute-workspace> --task <task-id> --actor <actor-id> --json
```

Initialization and doctor do not log in, grant writes or create business records. For an existing workspace that requires migration, use `workspace migrate --workspace <absolute-workspace> --dry-run --json`, review the resulting plan, and follow its separately explicit apply operation. Never delete the old workspace to bypass migration.

## Start with selected evidence

For a runtime supporting `tiangong-foundry.task-start.v1`, write a JSON spec in the user workspace with exactly these base fields:

| Field | Selection |
| --- | --- |
| `schema` | `tiangong-foundry.task-start.v1` |
| `request_id`, `actor_id` | Stable IDs for this user request and the independently selected actor. |
| `lane` | `external-dataset-curated-import` or `source-evidence-dataset-development`. |
| `profile_id` | The applicable profile from the selected runtime/task contract. |
| `target_entities` | Ordered unique dataset types: `contact`, `source`, `support`, `flow`, `flowproperty`, `unitgroup`, `process`, `lifecyclemodel`. |
| `sources` | Selected original evidence as objects containing only `path`. |
| `seed` | `null` for native package conversion, or a selected candidate JSON seed as `{ "path": "..." }`. Source-evidence tasks require the seed among `sources`. |
| `account_intent` | `null` for local preparation without an account, or the intended `project_ref`, `user_id`, `session_reference` (path or `null`) and optional `account_mode` (`ordinary` or `production-test`). No credential contents. |
| `preparation` | Normally `null`, so Foundry drives the full workflow. Use a selected cleanup preparation only when that is the intended local operation. |

The task-start contract accepts an optional inline `brief` in the same `tiangong-foundry.task-start.v1` spec. When present, supply all seven keys: `original_request` is bounded raw user wording or `null` when the request is represented only in external caller evidence; `goal` is a nonempty string; `intended_use` and `scope` are strings or `null`; `deliverables`, `user_constraints` and `ai_assumptions` are string arrays that may be empty. Omit the entire `brief` for legacy tasks. Derive it from the original request and selected material, retaining their provenance and marking inferences as AI assumptions. Never make the user restate information already present.

Select account intent before starting work that needs remote identity checks or writes; do not guess it from an unrelated logged-in session. Paths in the spec resolve against the explicit workspace. Foundry captures input bytes and binds revisions; editing files in a registered task is not how to select changed inputs.

```text
tiangong-foundry task start --workspace <absolute-workspace> --spec <spec-file> --json
tiangong-foundry task resume --workspace <absolute-workspace> --task <returned-task-id> --actor <actor-id> --json
```

One resume advances one registered stage. Conversion, context, rows, assessment, identity preflight, finalization, authorization and execution may require successive current actions. Preserve the returned task ID and status; unchanged blockers need the stated input, not repeated unchanged resumes. Changed selected input creates a retained revision, and earlier consumed attempts still require their original recovery.

## Human decisions and recovery

Read the whole current result and its registered question, brief, decision and assessment artifacts when supplied. A `human` action may need a missing source or a person's choice; technical errors require diagnosis through current actions. Surface a real human decision promptly, even when other assessment work remains. Say what is missing, which result is affected, the recommended next step, and the exact answer needed. Offer a small number of choices when useful and accept free text, supplied evidence, or “unknown; investigate first.” Name the affected object in familiar terms, with its exact ID and evidence available for inspection; do not make a person decode a row hash to answer. Keep the original answer and the interpreted decision separate, with provenance and object/evidence scope. An unanswered recommendation does not close a blocker. A partial assessment cannot authorize finalization, and independent current actions may still advance while a question is pending.

For example: “The source gives one electricity total for products A and B, so their separate electricity use cannot yet be calculated. Do you have separate meter readings for this period? You can provide them, describe another documented split, or say ‘I don't know; investigate first.’” Include any decision-critical limit on a proposed split in the default question, and leave the underlying row, report and citations available for inspection. Do not ask the person to infer a method from an internal error code.

When the current queue report names missing Flow or other references, translate the blocker into the affected data object and why it prevents the requested result. Retain the complete indexed missing-reference IDs and source paths in the followable evidence, even if the first sentence uses familiar names. Investigate whether the source package or an approved reference supplies them before asking a person to choose; a missing reference is not itself permission to invent or restore one. If a source record is used only as a read-only interaction test, describe that result as runtime qualification. A separate request to repair the record still needs its own source evidence, data-owner change and validation.

For a qualified runtime that exposes the new public contract, select a `tiangong-foundry.interaction-input.v1` JSON descriptor through `task resume --interaction-input <descriptor-file>`. It contains exactly `schema`, `task_id`, `actor_id`, `expected_state_sha256` and ordered `events`. Each event has a `kind` of `question`, `answer` or `assumption`, plus the fields below. Use `expected_state_sha256: null` for the first interaction, before a state artifact exists. Later use the SHA-256 of the current indexed `interaction-state.json` artifact; a stale digest is a conflict to inspect, not a reason to overwrite task state.

| Event | Required fields and selection |
| --- | --- |
| Question | `id`, `dataset_type`, `missing`, `impact`, `recommendation`, `ask`, `choices`, `evidence_sha256`, `supersedes`; a qualified object-scoped runtime also accepts `object_scope`. State the concrete missing fact/choice and its effect. Use `dataset_type: null` for task-wide scope, `choices: []` when free answer is enough, and `supersedes: null` for a new question. |
| Answer | `question_id`, `decision_id`, `raw_answer`, `adopted_decision`, `disposition`, `evidence_sha256`, `supersedes_decision_id`. Retain the person's actual words in `raw_answer`; state the executable interpretation separately. The first answer uses `null` for `supersedes_decision_id`; a later correction for the same question must name the current prior `decision_id`. `disposition` is `decided` or `investigate`; only `investigate` may use `adopted_decision: null` and it keeps the unresolved fact open. |
| Assumption | `id`, `dataset_type`, `statement`, `impact`, `evidence_sha256`, `supersedes`; a qualified object-scoped runtime also accepts `object_scope`. Mark the conclusion as AI-made, with affected scope and consequences; use null scope or predecessor only where appropriate. |

Every event's `evidence_sha256` is an array of current registered source/artifact hashes (or `[]` when none is relevant), never an invented citation. Keep event fields and optional/null values exactly as the selected runtime's public schema requires. Submit the descriptor as its own current action, not as a semantic decision file or a write grant. Confirm type-wide and object-scoped event support from the selected runtime schema. Do not place a general answer in `--semantic-input`, edit indexed artifacts, infer a private flag from source code, or rely on chat history for cross-process recovery. After a registered reply, inspect the new current result and confirm that the answer is active and reaches the affected work item before claiming the blocker resolved. “Investigate first” keeps the missing fact open.

When the selected public runtime supports it, use `object_scope: { "entity_id": "<current UUID>", "version": "<current version>", "row_sha256": "<canonical current row SHA-256>" }` for a question or assumption about one registered row. Take all three values from that row in the current indexed `foundry-rows.json` set and its verified file; a caller-supplied ID, an older row or a guessed hash is not enough. Hash the entire parsed registered row, including outer ID, version and `json` payload: recursively sort object keys in JavaScript `Object.keys(...).sort()` order, preserve array order, serialize with `JSON.stringify` without whitespace or newline, then SHA-256 the UTF-8 bytes. Keep `dataset_type` concrete. Omit `object_scope` only when the evidence or decision really applies to the whole task/type, or when an exact row cannot be established; explain the broader scope in the human-facing question.

The answer inherits its question's scope. While one Process waits for an answer, inspect the returned actions for independent Processes and continue their evidence-backed work. A batch submission covering both must still wait for the blocked Process; an independently selected work item may proceed with only its own applicable decision IDs. After an answer or correction, inspect the per-object context and indexed row-adoption proof before saying which Process changed. Reassess that Process and its actual downstream dependencies; do not apply its answer to a peer Process or reuse earlier approval for changed rows.

```text
tiangong-foundry task resume --workspace <absolute-workspace> --task <task-id> --actor <actor-id> --interaction-input <descriptor-file> --json
```

When a goal, principle or source changes, register the correction through the current public action, preserve the superseded decision and follow the returned reassessment scope. Recheck dependent outputs; broaden the review if the dependency boundary is uncertain. Keep original attempts and required readback for any prior write. Resume/status should show the current brief and active decisions, so questions already answered under unchanged evidence are not repeated.

## Submit current semantic work

The descriptor selected by `--semantic-input` contains `schema`, `task_id`, `actor_id`, `assessment_sha256` and `submissions`, plus optional `interaction_sha256` for the qualified interaction-aware runtime. Use schema `tiangong-foundry.semantic-input.v1`; take the assessment digest from the current registered artifact. When a current interaction state exists, `interaction_sha256` is required and must equal the SHA-256 of the current indexed `interaction-state.json` artifact. Omit it when no interaction state exists. Each submission contains the four base fields below and may also contain `decision_ids`:

- `kind`: `patch`, `classification`, `location` or `identity`;
- `authoring_task_sha256`: the current work-item digest;
- `file`: the selected decision/patch file, resolved against the workspace;
- `sha256`: the SHA-256 of that file's actual bytes.
- `decision_ids`: exactly the currently applicable `decision_id`s for this work item. Use `[]` or omit this field only when none apply; a decided answer from another scope or an obsolete decision is not applicable.

Use each owner's generated template and required full-context evidence. The authoring role returns applicable decision IDs with its file; the invoking workflow places them in that file's submission descriptor rather than adding unsupported fields to the data file. Foundry verifies the current interaction binding and exact decision set, then records actual adoption as `adopted_decisions` in `semantic-result`. Select one owner per row type, then reassess before another owner uses the changed rows. Do not insert illustrative or historical hashes. A rejected proposal leaves the current rows unchanged and retains diagnostics. Follow the selected runtime's verified schema for these semantic interaction fields.

```text
tiangong-foundry task resume --workspace <absolute-workspace> --task <task-id> --actor <actor-id> --semantic-input <descriptor-file> --json
```

Authorization is a separate selection through `--authorization-input`; it cannot be combined with `--semantic-input` or `--reference-input`. Use the runtime's current approval action and artifact contract, including its task/account/input/action/expiry bindings. A prior profile waiver or copied historical approval does not grant the current operation.

## Select explicit reference evidence

Use this selection only when supported by the verified descriptor schema shipped with the qualified runtime. It is a separate input stage, not an approval or a way to bypass a blocked dependency. An unsupported runtime needs the qualified successor distribution; do not invent a new lock or invoke a developer command.

The `tiangong-foundry.reference-input.v1` descriptor contains exactly:

| Field | Selection |
| --- | --- |
| `schema` | `tiangong-foundry.reference-input.v1` |
| `task_id`, `actor_id` | The current registered task and independently selected actor. |
| `rows_manifest_sha256` | Digest of the current indexed `foundry-rows.json` artifact. |
| `dataset_type` | The selected concrete row type: `process`, `flow`, `source`, `contact`, `lifecyclemodel`, `unitgroup` or `flowproperty`. |
| `qa_reference_rows` | Explicit `{ "file": "...", "sha256": "..." }` selections for Process QA, or `[]`. Other types cannot select QA reference rows. |
| `intent` | One selected `{ "file": "...", "sha256": "..." }` exact-reference intent, or `null`. |
| `review_files` | Every review file used by that intent, independently selected as file/SHA-256 pairs, or `[]` when no intent is selected. |

Select QA evidence and/or an intent. Each list allows at most 128 files; files must be regular, readable and at most 8 MiB each, within a 64 MiB aggregate selection. Descriptor file paths resolve against the explicit workspace; review locators inside the CLI intent follow that protocol and must resolve to the independently selected reviews. File digests refer to actual bytes, while consumer/selected-reference payload digests follow the qualified CLI's canonical protocol; do not substitute one for the other or hash a seed wrapper as a final consumer payload.

An exact-reference intent and its reviews use the CLI-owned `dataset-exact-reference-intent.v1` and `dataset-exact-reference-review.v1` contracts. Use the actual finalizer-selected consumer rows and reviewed reference observations for the intended account/project. Foundry verifies selection and transport; CLI decides reference eligibility. An unavailable, unrelated or foreign private reference cannot become usable merely by writing a review file.

```text
tiangong-foundry task resume --workspace <absolute-workspace> --task <task-id> --actor <actor-id> --reference-input <descriptor-file> --json
```

Do not combine this option with semantic input, authorization input or an explicit cleanup preparation. Empty paths are invalid, including through the JavaScript facade. Foundry snapshots selected QA/review bytes, retains the original intent, and derives only its review-file locators toward those snapshots. A changed selection invalidates prior finalization; changed rows require current evidence. Prepared, consumed and completed scopes retain their original selection. Let Foundry re-finalize and verify; do not modify indexed snapshots or proof reports.

## Select native execution intent with approval

For `input_kind=final_rows` and a Flow, Process or Source scope, the current `tiangong-foundry.authorization-input.v1` descriptor may include `execution_contract: { "file": "...", "sha256": "..." }`. The selected file must be the qualified CLI's `dataset-save-draft-execution-contract.v1` insert-only contract for the exact ordered final rows, desired payload digests, intended project/account and owner draft state `0`. Other types and prepared-row approval cannot use this field. Keep the raw file hash distinct from the CLI's canonical contract digest.

The contract accompanies a separately valid grant and its current evidence; it does not authorize a write itself. Foundry binds a task snapshot and returns a sealed execution action. Invalid selection cannot fall back to a different writer. After dispatch, use only the original task's readback/recovery action. A missing response or missing native receipt cannot justify another contract, task revision or mutation. Completion still requires the matching execution evidence and independent root/owner/state/payload verification, plus the same reference intent/reviews when selected.

## Interpret the result

The result schema is `tiangong-foundry.operation-result.v1`. `ready` and `running` describe progress; `needs_input` and `needs_auth` identify required intervention; `blocked` and `failed` retain reasons; `completed` requires current registered completion evidence. Inspect permission state separately (`not_required`, `required`, `granted`, `invalid`).

For missing qualification, repair/select the trusted runtime through its manager. For identity mismatch, preserve the registered destination and obtain the correct session. For stale context, return to the current assessment/work-item producer. For `mutation_readback_required` or predecessor-attempt blockers, keep the original scope and perform only its returned recovery. Do not downgrade these conditions into success or direct write retries.
