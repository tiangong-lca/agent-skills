import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  createFoundryPublicInstallHarness,
  hash,
} from "./lib/foundry-public-install-harness.mjs";

test("copied Foundry skill proves type-wide Process human interaction and selective reassessment", {
  timeout: 1_800_000,
}, async (t) => {
  const {
    platform, workspace, windows,
    operation, writeJson, artifact, indexedJson, diagnoseNativeAssessment, writeProof,
  } = createFoundryPublicInstallHarness(t);

  const actor = "synthetic-skill-qualifier";
  const id = "66666666-6666-4666-8666-666666666666";
  const rawAnswer = "For this synthetic test, use a schema-valid category after review; this is my test choice.";
  const brief = {
    original_request: "Test-only: resolve one synthetic Process classification ambiguity.",
    goal: "Prove the installed runtime applies an explicit human choice to local semantic work.",
    intended_use: "Credential-free copied-entry qualification fixture.",
    scope: "One synthetic Process row; no scientific or platform claim.",
    deliverables: ["Indexed local semantic result and a partial decision recap."],
    user_constraints: ["Do not request credentials or write to the platform."],
    ai_assumptions: [],
  };
  const seed = writeJson("synthetic-process.json", { rows: [{ id, version: "00.00.001", json: {
    processDataSet: {
      processInformation: {
        dataSetInformation: {
          "common:UUID": id,
          name: { baseName: { "@xml:lang": "en", "#text": "Synthetic heat from natural gas" } },
          classificationInformation: { "common:classification": { "common:class": [
            { "@level": "0", "@classId": "INVALID", "#text": "Synthetic invalid class" },
          ] } },
        },
        geography: { locationOfOperationSupplyOrProduction: { "@location": "Invalid region" } },
      },
      administrativeInformation: { publicationAndOwnership: { "common:dataSetVersion": "00.00.001" } },
    },
  } }] });
  const specFile = writeJson("synthetic-task.json", {
    schema: "tiangong-foundry.task-start.v1", request_id: "copied-skill-human-interaction",
    actor_id: actor, lane: "source-evidence-dataset-development", profile_id: "generic",
    target_entities: ["process"], sources: [{ path: seed }], seed: { path: seed },
    account_intent: null, preparation: null, brief,
  });
  const started = operation("interaction-task-start", ["task", "start", "--workspace", workspace,
    "--spec", specFile, "--json"]);
  assert.equal(started.status, "ready");
  assert.deepEqual(artifact(started, "task_brief")?.value, brief);
  const args = ["--workspace", workspace, "--task", started.task_id, "--actor", actor];
  const interact = (phase, expectedStateSha, events, expectedExit = 0) => {
    const input = writeJson(`${phase}.json`, {
      schema: "tiangong-foundry.interaction-input.v1", task_id: started.task_id,
      actor_id: actor, expected_state_sha256: expectedStateSha, events,
    });
    return operation(phase, ["task", "resume", ...args, "--interaction-input", input, "--json"], expectedExit);
  };
  const asked = interact("interaction-question", null, [{
    kind: "question", id: "classification-choice", dataset_type: "process",
    missing: "This synthetic Process has an invalid category and needs a reviewed choice.",
    impact: "A category patch without the recorded choice could misrepresent this test row.",
    recommendation: "Check the installed controlled classification schema first.",
    ask: "For this test row, should the controlled category be selected after schema review?",
    choices: ["Investigate first", "Use the reviewed category"],
    evidence_sha256: [hash(fs.readFileSync(seed))], supersedes: null,
  }], 2);
  assert.equal(asked.status, "needs_input");
  assert.ok(asked.blockers.some((item) => item.code === "interaction_decision_pending"));
  const question = indexedJson(asked, "current_interaction_state");
  assert.equal(question.value.events[0].ask,
    "For this test row, should the controlled category be selected after schema review?");
  const investigated = interact("interaction-investigate", question.item.sha256, [{
    kind: "answer", question_id: "classification-choice", decision_id: "investigate-category",
    supersedes_decision_id: null, raw_answer: "I need the controlled category checked before deciding.",
    adopted_decision: null, disposition: "investigate", evidence_sha256: [],
  }], 2);
  assert.equal(investigated.status, "needs_input");
  assert.ok(investigated.blockers.some((item) => item.code === "interaction_investigation_pending"));
  const investigation = indexedJson(investigated, "current_interaction_state");
  assert.equal(investigation.value.events[1].disposition, "investigate");
  const decided = interact("interaction-decide", investigation.item.sha256, [{
    kind: "answer", question_id: "classification-choice", decision_id: "use-reviewed-category",
    supersedes_decision_id: "investigate-category", raw_answer: rawAnswer,
    adopted_decision: "Apply a schema-valid controlled category to this synthetic Process only.",
    disposition: "decided", evidence_sha256: [],
  }]);
  assert.equal(decided.status, "ready");
  const decisionState = indexedJson(decided, "current_interaction_state");
  assert.equal(decisionState.value.events[2].raw_answer, rawAnswer);
  assert.equal(decisionState.value.events[2].supersedes_decision_id, "investigate-category");
  const persisted = operation("interaction-fresh-status", ["task", "status", ...args, "--json"]);
  assert.equal(indexedJson(persisted, "current_interaction_state").item.sha256, decisionState.item.sha256);
  assert.equal(persisted.permissions.state, "not_required");
  const recap = artifact(persisted, "decision_recap")?.value;
  assert.equal(recap.completion_proven, false);
  assert.deepEqual(recap.brief, brief);
  assert.equal(recap.user_decisions[0].decision_id, "use-reviewed-category");
  assert.equal(recap.user_decisions[0].raw_answer_sha256, hash(Buffer.from(rawAnswer, "utf8")));
  assert.deepEqual(recap.unresolved_questions, []);

  let assessmentArtifact;
  let assessment;
  let lastGood = persisted;
  for (let step = 1; step <= 4; step += 1) {
    const progressed = operation(`interaction-assess-${step}`, ["task", "resume", ...args, "--json"], [0, 1, 2]);
    if (progressed.status === "failed") {
      const diagnostic = windows ? await diagnoseNativeAssessment(lastGood, started.task_id) : null;
      assert.fail(`interaction-assess-${step}: ${JSON.stringify({ blockers: progressed.blockers,
        diagnostic })}`);
    }
    assert.ok(["ready", "needs_input"].includes(progressed.status),
      `interaction-assess-${step}: unexpected status ${progressed.status}`);
    const current = artifact(progressed, "foundry-assessment.json");
    if (current) {
      ({ item: assessmentArtifact, value: assessment } = indexedJson(progressed, "foundry-assessment.json"));
      if (assessment.sets.some((set) => set.type === "process"
        && set.decisions.some((item) => item.kind === "classification"))) break;
    }
    lastGood = progressed;
  }
  assert.ok(assessmentArtifact, "The installed runtime must register a Process assessment.");
  const processSet = assessment.sets.find((set) => set.type === "process");
  assert.ok(processSet);
  assert.deepEqual(processSet.decisions.map((item) => item.kind).sort(), ["classification", "location"]);
  assert.equal(assessment.interaction_sha256, decisionState.item.sha256);
  const classification = processSet.decisions.find((item) => item.kind === "classification");
  const ownerTask = JSON.parse(fs.readFileSync(classification.task, "utf8"));
  const template = path.resolve(assessment.owner_base, ownerTask.files.template);
  const templateRows = fs.readFileSync(template, "utf8").trim().split(/\r?\n/u).map(JSON.parse);
  assert.equal(templateRows.length, 1);
  const controlledSchema = JSON.parse(fs.readFileSync(path.resolve(assessment.owner_base,
    "../cli/assets/tidas-schemas/tidas_processes_category.json"), "utf8"));
  assert.ok(controlledSchema.oneOf.some((item) => item.properties?.["@classId"]?.const === "3530"));
  const authoredRows = templateRows.map((item) => ({
    ...item, code: "3530",
    basis: "Synthetic fixture: test-only user choice after review of installed controlled category 3530.",
    used_context_kinds: item.authoring_context.required_context_kinds,
    evidence: {
      ...item.evidence, source: seed,
      quote_or_trace: "Synthetic Process name and installed category 3530; no real scientific claim.",
    },
  }));
  const decisionFile = path.join(workspace, "synthetic-classification-decisions.jsonl");
  fs.writeFileSync(decisionFile, authoredRows.map((item) => JSON.stringify(item)).join("\n") + "\n");
  const descriptor = {
    schema: "tiangong-foundry.semantic-input.v1", task_id: started.task_id, actor_id: actor,
    assessment_sha256: assessmentArtifact.sha256, interaction_sha256: decisionState.item.sha256,
    submissions: [{ kind: "classification", authoring_task_sha256: hash(fs.readFileSync(classification.task)),
      file: decisionFile, sha256: hash(fs.readFileSync(decisionFile)), decision_ids: ["use-reviewed-category"] }],
  };
  const missingDecision = structuredClone(descriptor);
  delete missingDecision.submissions[0].decision_ids;
  const missingResult = operation("semantic-missing-decision-refused", ["task", "resume", ...args,
    "--semantic-input", writeJson("semantic-missing-decision.json", missingDecision), "--json"], 4);
  assert.equal(missingResult.status, "blocked");
  assert.ok(missingResult.blockers.some((item) => item.code === "semantic_interaction_invalid"));
  const staleState = { ...descriptor, interaction_sha256: "0".repeat(64) };
  const staleResult = operation("semantic-stale-interaction-refused", ["task", "resume", ...args,
    "--semantic-input", writeJson("semantic-stale-interaction.json", staleState), "--json"], 4);
  assert.equal(staleResult.status, "blocked");
  assert.ok(staleResult.blockers.some((item) => item.code === "semantic_interaction_changed"));
  const beforeApply = operation("semantic-before-apply-status", ["task", "status", ...args, "--json"], 2);
  assert.equal(artifact(beforeApply, "semantic-result.json"), undefined);
  const applied = operation("semantic-decision-applied", ["task", "resume", ...args,
    "--semantic-input", writeJson("synthetic-semantic-input.json", descriptor), "--json"]);
  assert.equal(applied.status, "ready");
  const semantic = indexedJson(applied, "semantic-result.json");
  assert.equal(semantic.value.status, "completed");
  assert.equal(semantic.value.assessment_sha256, assessmentArtifact.sha256);
  assert.equal(semantic.value.interaction_sha256, decisionState.item.sha256);
  assert.deepEqual(semantic.value.adopted_decisions.map((item) => ({
    dataset_type: item.dataset_type, decision_ids: item.decision_ids,
  })), [{ dataset_type: "process", decision_ids: ["use-reviewed-category"] }]);
  assert.equal(semantic.value.adopted_decisions[0].work_item_sha256,
    descriptor.submissions[0].authoring_task_sha256);
  const repaired = fs.readFileSync(semantic.value.results[0].repaired_rows, "utf8").trim()
    .split(/\r?\n/u).map(JSON.parse);
  assert.equal(repaired.length, 1);
  const processRow = repaired[0].processDataSet.processInformation;
  assert.equal(processRow.dataSetInformation.classificationInformation["common:classification"]
    ["common:class"].at(-1)["@classId"], "3530");
  assert.equal(processRow.geography.locationOfOperationSupplyOrProduction["@location"], "Invalid region");
  const afterApply = operation("semantic-fresh-status", ["task", "status", ...args, "--json"]);
  assert.equal(indexedJson(afterApply, "semantic-result.json").item.sha256, semantic.item.sha256);
  assert.equal(indexedJson(afterApply, "current_interaction_state").item.sha256,
    decisionState.item.sha256);
  assert.equal(afterApply.permissions.state, "not_required");
  assert.equal(artifact(afterApply, "decision_recap")?.value.completion_proven, false);
  const reassessed = operation("semantic-selective-reassessment", ["task", "resume", ...args, "--json"], 2);
  assert.equal(reassessed.status, "needs_input");
  const newer = indexedJson(reassessed, "foundry-assessment.json");
  assert.notEqual(newer.item.sha256, assessmentArtifact.sha256);
  assert.equal(newer.value.previous_assessment_sha256, assessmentArtifact.sha256);
  assert.equal(newer.value.assessed_type, "process");
  assert.deepEqual(newer.value.sets.find((set) => set.type === "process").decisions
    .map((item) => item.kind), ["location"]);
  assert.equal(artifact(reassessed, "decision_recap")?.value.completion_proven, false);
  assert.equal(reassessed.permissions.state, "not_required");

  writeProof(`${platform}-interaction.json`, { scenario: "type-wide-process-interaction" });
});
