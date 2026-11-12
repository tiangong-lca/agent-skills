---
name: source-evidence-dataset-development
description: Orchestrate evidence-driven TianGong TIDAS data creation or update from PDFs, Word files, web pages, URLs, APIs, databases, reports, or scientific literature.
---

# Source Evidence Dataset Development

Use this top-level skill when there is no import-ready LCA package and the task must develop or update TIDAS rows from evidence.

## Managed Foundry tasks

When the caller supplies a registered public Foundry task and its current result, use this skill as a domain helper. Retrieve and assess source evidence, or prepare the current requested evidence-backed decision or patch input. Keep the supplied workspace, task, actor and account intent. Return newly authored input files through the current public semantic/action contract and let Foundry register and validate them.

Use the current task brief and only the applicable registered decisions supplied by the caller. Keep a user's requirement, an AI assumption and each source fact distinct; a user choice does not fill a scientific evidence gap or grant a write. Return a material conflict or missing fact to the ordinary Foundry entry with its effect, supporting evidence and precise question or next investigation. This managed-task guidance does not change the independent evidence and atomic CLI procedure below.

Advance the task only through its supplied structured `next_actions`, preserving executable, argv, CWD and binding. Do not run the standalone CLI procedure below inside that task, overwrite registered rows or reports, write `checkpoint.json` yourself, or recreate a task after an uncertain write. Follow the original task's readback/recovery action. Task and account permission remain bound to the existing scope.

`foundry-tidas-import` is the ordinary entry for starting and continuing managed Foundry work. This helper can consume a supplied task result without requiring another skill directory to be installed. The remaining procedure applies to an independent CLI workflow whose state is outside the managed public task protocol.

## Boundaries

- This skill coordinates seed intake, evidence retrieval, entity planning, and child skill routing.
- Do not treat search results as final field evidence. Capture field-level evidence, limitations, and conflicts first.
- Do not copy external research skills into this repository. Resolve fast-moving evidence skills with `npx skills`.
- Do not write database rows. Remote write remains a later CLI/Foundry handoff after deterministic gates pass.

## Required Inputs

- Caller-selected working directory, or the supplied workspace for an existing managed Foundry task.
- Execution seed or a clarification request if the seed is not executable.
- Target profile/account guard and intended use.
- Source starting points: files, URLs, reports, APIs, database ids, citations, or a bounded source-discovery request.

## Seed Gate

Before retrieval, record the working brief in ordinary editable notes with:

- object/process/product name;
- target entity plan;
- functional intent or declared unknown;
- geography and time scope or declared unknown;
- source starting points or source-discovery scope;
- intended use and quality target;
- profile/account guard.

If source starting points and source-discovery scope are both absent, stop and ask for clarification.

## Runtime Evidence Skills

For SCI paper or academic journal evidence, resolve the latest external skill:

```bash
npx skills use https://github.com/tiangong-ai/skills \
  --skill tiangong-kb-sci-search \
  --full-depth
```

`tiangong-kb-sci-search` searches only the `sci` channel. Keep report, patent, standard, official, web, and database evidence as separate channels.

Before using the skill, record its resolved source and outputs in the caller working directory:

```text
<working-directory>/runtime-skills/runtime-skill-resolution.json
```

Include the command, source repo, resolved `refs/heads/main` commit, skill name, evidence channel, timestamp, and output artifact paths.

## Workflow

1. Record the brief and source starting points.
2. Build goal/scope and evidence questions by field.
3. Retrieve and capture evidence by channel.
4. Build an evidence dossier:
   - `evidence/sources.jsonl`
   - `evidence/chunks.jsonl`
   - `evidence/field-evidence.jsonl`
   - `evidence/conflicts.jsonl`
5. Inspect `dataset <type> contract` for the selected object schema, methodology and ruleset.
6. Author candidate support, flow, process, and lifecyclemodel rows only from captured evidence or explicit proxy/waiver records.
7. Validate each canonical document with `dataset <type> validate --input content.json`; read actual layers and perform evidence-led semantic review.
8. Use caller notes to track evidence gaps and candidate files; exact search/get/list-references support reuse decisions.
9. Route semantic blockers to child skills such as `flow-governance-review`, `process-automated-builder`, or Foundry authoring tasks.
10. Hand off each reviewed candidate for explicit create/save, then separate review submission when authorized. Confirm exact readback; unknown writes use original-intent recovery.

Before any remote account read or write in steps 8-10, run `tiangong-lca auth status --json`; before commit, require `tiangong-lca auth doctor-auth --json`. A `login-required` result is a human handoff to `auth login` in a trusted terminal. Never request a username, password, credential, authorization code, token, or legacy API key. Keep a separate private session per account/project/client; headless tokens may come only from an approved orchestrator and never enter argv or artifacts.

## Stop Rules

Stop when:

- seed is not executable;
- critical field evidence is absent or conflicting and no scoped proxy/waiver is allowed;
- runtime evidence skill resolution is missing for SCI retrieval;
- a row would require invented units, amounts, locations, years, sources, or classifications;
- required validation or evidence review fails with no supported correction;
- a remote write lacks explicit authorization, native preconditions or original-intent recovery.

## Done Criteria

- The requested brief, evidence dossier, candidate content, actual validation and semantic review are complete; any authorized write has confirmed readback or an explicit unresolved recovery state.
- Every authored field points to evidence, profile policy, remote reuse decision, or explicit waiver.
