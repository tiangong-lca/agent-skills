import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  createFoundryPublicInstallHarness,
  hash,
  rowHash,
} from "./lib/foundry-public-install-harness.mjs";

test("copied Foundry skill keeps dual-Process object-scope decisions separate in one task", {
  timeout: 1_800_000,
}, async (t) => {
  const {
    platform, workspace, windows,
    operation, writeJson, artifact, indexedJson, diagnoseNativeAssessment, writeProof,
  } = createFoundryPublicInstallHarness(t);

  const actor = "copied-skill-object-scope";
  const p1 = "66666666-6666-4666-8666-666666666667";
  const p2 = "77777777-7777-4777-8777-777777777778";
  const versionValue = "00.00.001";
  const rows = [p1, p2].map((id) => ({ id, version: versionValue, json: {
    processDataSet: {
      processInformation: {
        dataSetInformation: {
          "common:UUID": id,
          name: { baseName: { "@xml:lang": "en", "#text": `Synthetic heat ${id === p1 ? "P1" : "P2"}` } },
          classificationInformation: { "common:classification": { "common:class": [
            { "@level": "0", "@classId": "INVALID",
              "#text": "Electricity, gas, steam and air conditioning supply" },
          ] } },
        },
        geography: { locationOfOperationSupplyOrProduction: { "@location": "Invalid region" } },
      },
      administrativeInformation: { publicationAndOwnership: { "common:dataSetVersion": versionValue } },
    },
  } }));
  const seed = writeJson("synthetic-two-processes.json", { rows });
  const specFile = writeJson("synthetic-two-process-task.json", {
    schema: "tiangong-foundry.task-start.v1", request_id: "copied-skill-object-scope",
    actor_id: actor, lane: "source-evidence-dataset-development", profile_id: "generic",
    target_entities: ["process"], sources: [{ path: seed }], seed: { path: seed },
    account_intent: null, preparation: null,
  });
  const started = operation("object-task-start", ["task", "start", "--workspace", workspace,
    "--spec", specFile, "--json"]);
  const args = ["--workspace", workspace, "--task", started.task_id, "--actor", actor];
  operation("object-context", ["task", "resume", ...args, "--json"]);
  const materialized = operation("object-rows", ["task", "resume", ...args, "--json"]);
  const currentRows = (result) => {
    const manifest = indexedJson(result, "foundry-rows.json").value;
    const set = manifest.sets.find((item) => item.type === "process");
    assert.ok(set);
    const content = fs.readFileSync(set.file, "utf8").trim();
    return content.startsWith("[") ? JSON.parse(content) : content.split(/\r?\n/u).map(JSON.parse);
  };
  const registeredRows = currentRows(materialized);
  assert.deepEqual(registeredRows.map((row) => row.id), [p1, p2]);
  const scope = { entity_id: p1, version: versionValue, row_sha256: rowHash(registeredRows[0]) };
  const interact = (phase, stateSha, event, expectedExit = [0, 2]) => operation(phase,
    ["task", "resume", ...args, "--interaction-input", writeJson(`${phase}.json`, {
      schema: "tiangong-foundry.interaction-input.v1", task_id: started.task_id,
      actor_id: actor, expected_state_sha256: stateSha, events: [event],
    }), "--json"], expectedExit);
  const question = interact("object-p1-question", null, {
    kind: "question", id: "p1-category", dataset_type: "process", object_scope: scope,
    missing: "P1 has no reviewed classification source.",
    impact: "Only P1's category cannot be accepted yet.",
    recommendation: "Inspect the controlled category source for P1.",
    ask: "Which evidenced category applies to P1?",
    choices: ["Investigate the source first", "Use the reviewed category"],
    evidence_sha256: [hash(fs.readFileSync(seed))], supersedes: null,
  }, 2);
  assert.equal(question.status, "needs_input");
  assert.ok(question.next_actions.some((action) => action.kind === "human"
    && action.instructions.includes(p1) && action.instructions.includes("P1")
    && action.instructions.includes("Which evidenced category applies to P1?")
    && !action.instructions.includes(scope.row_sha256)));
  const initialState = indexedJson(question, "current_interaction_state");
  const assess = async (phase, prior) => {
    const result = operation(phase, ["task", "resume", ...args, "--json"], [0, 1, 2]);
    if (result.status === "failed") {
      const diagnostic = windows ? await diagnoseNativeAssessment(prior, started.task_id) : null;
      assert.fail(`${phase}: ${JSON.stringify({ blockers: result.blockers, diagnostic })}`);
    }
    assert.equal(result.status, "needs_input", `${phase}: P1 still awaits its answer`);
    return result;
  };
  const assessed = await assess("object-independent-assessment", question);
  assert.ok(assessed.artifacts.some((item) => item.role === "object_interaction_context"
    && item.value?.object_scope?.entity_id === p2 && item.value.pending_questions.length === 0));
  assert.ok(assessed.next_actions.some((action) => action.kind === "human"
    && action.code === "review_semantic_work" && action.instructions.includes(p2)));
  const assessment = indexedJson(assessed, "foundry-assessment.json");
  const processSet = assessment.value.sets.find((set) => set.type === "process");
  assert.ok(processSet);
  const manifest = JSON.parse(fs.readFileSync(processSet.authoring_manifest, "utf8"));
  const p2Work = manifest.tasks.find((item) => item.entity.entity_id === p2);
  assert.ok(p2Work);
  const patchOperation = (work, label) => ({
    op: "add", path: "/json/processDataSet/processInformation/dataSetInformation/common:generalComment",
    value: { "@xml:lang": "en", "#text": `Controlled ${label} synthetic boundary.` },
    basis: `Synthetic ${label} fixture identifies the controlled boundary.`,
    evidence: { source: seed,
      field_path: "/processDataSet/processInformation/dataSetInformation/name/baseName",
      quote_or_trace: `Synthetic heat ${label}` },
    resolution: { mode: "evidence_backed_completion",
      used_context_kinds: ["schema", "methodology_yaml", "ruleset",
        "classification_schema", "location_schema"] },
    closes_action_items: work.action_items.map((item) => ({ code: item.code, path: item.path })),
  });
  const p2Patch = writeJson("synthetic-p2-patch.json", {
    schema_version: 1, patch_status: "completed", patch_sets: [{
      dataset_id: p2, version: versionValue,
      authoring_package: path.basename(p2Work.files.authoring_package),
      operations: [patchOperation(p2Work, "P2")],
    }],
  });
  const semanticInput = (phase, ownerBase, assessedSha, stateSha, work, file, decisionIds) => writeJson(
    `${phase}.json`, {
      schema: "tiangong-foundry.semantic-input.v1", task_id: started.task_id,
      actor_id: actor, assessment_sha256: assessedSha, interaction_sha256: stateSha,
      submissions: [{ kind: "patch", authoring_task_sha256: hash(fs.readFileSync(
        path.resolve(ownerBase, work.files.task_json))),
      file, sha256: hash(fs.readFileSync(file)), decision_ids: decisionIds }],
    });
  const p2Applied = operation("object-p2-independent-patch", ["task", "resume", ...args,
    "--semantic-input", semanticInput("p2-semantic", assessment.value.owner_base,
      assessment.item.sha256,
      initialState.item.sha256, p2Work, p2Patch, []), "--json"], 2);
  assert.equal(p2Applied.status, "needs_input");
  const p2Adoption = indexedJson(p2Applied, "semantic-result.json").value;
  assert.deepEqual(p2Adoption.adopted_decisions[0].decision_ids, []);
  assert.equal(p2Adoption.row_adoptions[0].object_scope.entity_id, p2);
  const afterP2Rows = currentRows(p2Applied);
  assert.deepEqual(afterP2Rows[0], registeredRows[0]);
  assert.notDeepEqual(afterP2Rows[1], registeredRows[1]);
  const reassessed = await assess("object-after-p2-reassessment", p2Applied);
  const baseline = indexedJson(reassessed, "foundry-assessment.json");
  const p2BaselineSet = baseline.value.sets.find((item) => item.type === "process");
  const p2BaselineManifest = JSON.parse(fs.readFileSync(p2BaselineSet.authoring_manifest, "utf8"));
  const p2BaselineWork = p2BaselineManifest.tasks.find((item) => item.entity.entity_id === p2);
  const p2BaselineTaskSha = hash(fs.readFileSync(path.resolve(baseline.value.owner_base,
    p2BaselineWork.files.task_json)));
  const answered = interact("object-p1-answer", initialState.item.sha256, {
    kind: "answer", question_id: "p1-category", decision_id: "p1-reviewed-category",
    supersedes_decision_id: null, raw_answer: "Use the reviewed category for P1 only.",
    adopted_decision: "Classify P1 from the reviewed controlled source; leave P2 unchanged.",
    disposition: "decided", evidence_sha256: [hash(fs.readFileSync(seed))],
  });
  const answeredState = indexedJson(answered, "current_interaction_state");
  assert.deepEqual(artifact(answered, "decision_recap").value.user_decisions[0].applied_to, []);
  assert.ok(answered.artifacts.some((item) => item.role === "object_interaction_context"
    && item.value?.object_scope?.entity_id === p2 && item.value.decisions.length === 0));
  const corrected = interact("object-p1-correction", answeredState.item.sha256, {
    kind: "answer", question_id: "p1-category", decision_id: "p1-corrected-category",
    supersedes_decision_id: "p1-reviewed-category",
    raw_answer: "Correction: P1 should use the evidenced electricity and heat category D.",
    adopted_decision: "Classify only P1 as controlled category D.",
    disposition: "decided", evidence_sha256: [hash(fs.readFileSync(seed))],
  });
  const correctedState = indexedJson(corrected, "current_interaction_state");
  const correctedAssessment = indexedJson(corrected, "foundry-assessment.json");
  assert.equal(correctedAssessment.item.sha256, baseline.item.sha256);
  const correctedSet = correctedAssessment.value.sets
    .find((item) => item.type === "process");
  const correctedManifest = JSON.parse(fs.readFileSync(correctedSet.authoring_manifest, "utf8"));
  const p1Work = correctedManifest.tasks.find((item) => item.entity.entity_id === p1);
  const stillP2 = correctedManifest.tasks.find((item) => item.entity.entity_id === p2);
  assert.equal(hash(fs.readFileSync(path.resolve(baseline.value.owner_base,
    stillP2.files.task_json))), p2BaselineTaskSha);
  const p1Patch = writeJson("synthetic-p1-patch.json", {
    schema_version: 1, patch_status: "completed", patch_sets: [{
      dataset_id: p1, version: versionValue,
      authoring_package: path.basename(p1Work.files.authoring_package),
      operations: [patchOperation(p1Work, "P1"), {
        op: "replace",
        path: "/json/processDataSet/processInformation/dataSetInformation/classificationInformation/common:classification/common:class/0/@classId",
        value: "D", basis: "The corrected P1 choice selects controlled category D.",
        evidence: { source: seed,
          field_path: "/processDataSet/processInformation/dataSetInformation/classificationInformation/common:classification/common:class/0",
          quote_or_trace: "Electricity, gas, steam and air conditioning supply" },
        resolution: { mode: "evidence_backed_completion",
          used_context_kinds: ["schema", "methodology_yaml", "ruleset",
            "classification_schema", "location_schema"] },
        closes_action_items: [],
      }],
    }],
  });
  const missingDecision = { schema: "tiangong-foundry.semantic-input.v1", task_id: started.task_id,
    actor_id: actor, assessment_sha256: baseline.item.sha256,
    interaction_sha256: correctedState.item.sha256,
    submissions: [{ kind: "patch", authoring_task_sha256: hash(fs.readFileSync(path.resolve(
      baseline.value.owner_base, p1Work.files.task_json))), file: p1Patch,
    sha256: hash(fs.readFileSync(p1Patch)), decision_ids: [] }] };
  const refused = operation("object-p1-missing-decision-refused", ["task", "resume", ...args,
    "--semantic-input", writeJson("p1-missing-decision.json", missingDecision), "--json"], 4);
  assert.ok(refused.blockers.some((item) => item.code === "semantic_interaction_invalid"));
  const applied = operation("object-p1-decision-adopted", ["task", "resume", ...args,
    "--semantic-input", semanticInput("p1-semantic", baseline.value.owner_base,
      baseline.item.sha256,
      correctedState.item.sha256, p1Work, p1Patch, ["p1-corrected-category"]), "--json"], [0, 2]);
  const p1Adoption = indexedJson(applied, "semantic-result.json").value;
  assert.deepEqual(p1Adoption.adopted_decisions[0].decision_ids, ["p1-corrected-category"]);
  assert.equal(p1Adoption.row_adoptions[0].object_scope.entity_id, p1);
  const afterP1Rows = currentRows(applied);
  assert.deepEqual(afterP1Rows[1], afterP2Rows[1]);
  assert.notEqual(rowHash(afterP1Rows[0]), scope.row_sha256);
  const successor = operation("object-adopted-successor-review", ["task", "resume", ...args,
    "--json"], [0, 1, 2]);
  if (successor.status === "failed") {
    const diagnostic = windows ? await diagnoseNativeAssessment(applied, started.task_id) : null;
    assert.fail(`object-adopted-successor-review: ${JSON.stringify({
      blockers: successor.blockers, diagnostic })}`);
  }
  assert.ok(artifact(successor, "foundry-assessment.json"));
  assert.deepEqual(artifact(successor, "decision_recap").value.user_decisions[0].applied_to
    .map((item) => item.after_row_sha256), [rowHash(afterP1Rows[0])]);
  const revised = interact("object-p1-after-adoption-correction", correctedState.item.sha256, {
    kind: "answer", question_id: "p1-category", decision_id: "p1-review-again",
    supersedes_decision_id: "p1-corrected-category",
    raw_answer: "Please recheck P1 against the source once more; P2's choice is unchanged.",
    adopted_decision: "Reassess only P1's current row before using this revision.",
    disposition: "decided", evidence_sha256: [hash(fs.readFileSync(seed))],
  }, 2);
  assert.ok(revised.blockers.some((item) => item.code === "interaction_object_decision_changed"));
  const contexts = revised.artifacts.filter((item) => item.role === "object_interaction_context")
    .map((item) => item.value);
  assert.equal(contexts.find((item) => item.object_scope.entity_id === p1).decision_current, false);
  assert.equal(contexts.find((item) => item.object_scope.entity_id === p2).decision_current, true);
  assert.deepEqual(currentRows(revised)[1], afterP2Rows[1]);
  const p2Final = operation("object-fresh-status", ["task", "status", ...args, "--json"], 2);
  assert.equal(artifact(p2Final, "decision_recap").value.completion_proven, false);
  assert.equal(p2Final.permissions.state, "not_required");

  writeProof(`${platform}-object-scope.json`, { scenario: "dual-process-object-scope" });
});
