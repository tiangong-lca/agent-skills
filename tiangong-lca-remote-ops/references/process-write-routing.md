# Process Write Routing

Use this routing rule before any remote `processes` write.

## 0. Complete-dataset gate comes before routing

Do not write a `process` row unless the outgoing payload is a complete dataset under the current schema contract.

Minimum gate:

- pass current `ProcessSchema.safeParse(...)` or an equivalent strict validator
- retain all schema-required nodes, even when some fields are semantically empty
- contain no unresolved placeholder / missing reference objects that the current task is expected to fix

If the official CLI / MCP / RPC accepts a payload that fails this gate:

- treat that as a CLI / command-endpoint gap
- block the write in the skill or case-local bridge
- record the exact blocker and the rejected row set in friction

Only after the complete-dataset gate passes should you choose the state-driven write path below.

## 1. Decide by `state_code`, then choose the tool

Do not start from a preferred endpoint such as RPC, MCP, or raw PostgREST update. Start from the dataset state and required lineage semantics.

## 2. `state_code=0`

Treat `state_code=0` as an unpublished current-user draft under active editing.

Required write semantics:

- prefer reusing a semantically suitable existing row over creating anything new
- keep the same `id`
- keep the same `version`
- update the current row in place
- save only after the complete-dataset gate passes and the current evidence is bound to the exact row

Reason:

- avoid creating many pre-publication versions for the same draft
- keep unpublished editing history simple and reduce review noise
- one unpublished draft carries one stable `id` + `version`; resuming, retrying or re-running a task
  continues that same draft and never increments the version or mints a new UUID just because a run
  resumed

Tooling implication:

- use `dataset process save` with exact identity, current before-content and actor/environment preconditions
- a missing or conflicting target never becomes create
- if the available write path creates a new version for every draft edit, treat that as a tooling mismatch and record CLI friction

## 3. `state_code=100`

Treat `state_code=100` as a public dataset revision task.

Required write semantics:

- keep the same `id`
- create the next `version` only when the published content must genuinely change; editorial noise,
  a resumed run or an uncertain write never justifies a new version
- a scientific change or a necessary new version requires explicit complete reference/provider-impact
  evidence first: the affected references and consumers, the intended reference/provider selection and
  the exact source/property/unit basis. Missing or partial evidence stays an explicit gap and the
  change is held instead of published
- publish the revised content as the next version in the same lineage
- save only after the complete-dataset gate passes

Reason:

- avoid producing multiple UUIDs that represent the same process with only editorial differences
- preserve a clean public version chain for downstream reuse and traceability
- an unreleased consumer or repair path is never treated as support for the change; record it as an
  owner follow-up

Tooling implication:

- use an explicitly authorized `dataset process create` request for the justified new version under the same UUID; submit review separately
- do not use clone/new-UUID behavior as the default update path
- only create a new UUID when the user explicitly wants a fork, a new lineage, or a materially different dataset identity

## 4. When the platform cannot satisfy the target semantics

If the available tool cannot satisfy the required lineage behavior:

- stop treating that tool as the default write path for this state
- record CLI or auth friction with the exact response and blocker
- keep the artifact-first plan and verification flow unchanged
- when the runtime cannot yet express the reviewed unknown-value behavior — for example an installed CLI/Foundry pair that still emits a numeric missing-volume sentinel such as `9999`, or a report without the current validation-layer/evidence-gap fields — stop and report qualified adoption as incomplete. Do not hand-fabricate, overwrite or delete the empty array in the payload. Do not edit or discard the runtime report. Do not bypass the gate to make the row look complete
- keep the reviewed source behavior and the pinned published support separate: a behavior that is merged in source but absent from the pinned published packages is not available to this run, and never hand-edit it into the payload

## 5. Reporting

For every bulk write report, state explicitly:

- input `state_code`
- target lineage behavior (`in-place update` or `same UUID + version bump`)
- actual tool used
- whether the actual tool matched the intended lineage semantics

After a confirmed remote write, re-fetch the exact target with `dataset process get --id <id> --version <version> --output process.json --json`, compare the actual content and validate the canonical file. For an unknown write, use the original intent's recovery path first; do not retry with a new request ID. The validation wrapper is not remote readback and does not inspect every consumer automatically.
