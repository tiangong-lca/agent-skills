import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const entry = fileURLToPath(new URL("../foundry-tidas-import/", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stableJson = (value) => Array.isArray(value) ? value.map(stableJson)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort()
    .map((key) => [key, stableJson(value[key])])) : value;
const rowHash = (row) => hash(Buffer.from(JSON.stringify(stableJson(row))));
const version = "0.1.15";
const source = "0ab6b54513acccfe3253ea583b4f6b2e678c0485";

test("copied Foundry skill runs the public locked runtime and rejects changed installation inputs", {
  timeout: 1_800_000,
}, async (t) => {
  const lockPath = path.join(entry, "scripts", "bootstrap-lock.json");
  assert.ok(fs.existsSync(lockPath), "The final independently verified F1 bootstrap lock must be shipped.");
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  assert.equal(lock.schema, "tiangong-lca.runtime-bootstrap-lock.v1");
  assert.equal(lock.manifest_url,
    `https://github.com/tiangong-lca/foundry/releases/download/foundry-runtime-v${version}/runtime-manifest.json`);
  const platform = `${process.platform}-${process.arch}`;
  assert.ok(["linux-x64", "linux-arm64", "darwin-arm64", "win32-x64"].includes(platform));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "foundry-public-skill-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const copy = path.join(root, "copied skill");
  fs.cpSync(entry, copy, { recursive: true, dereference: false });
  const userRoot = path.join(root, "user");
  const temporary = path.join(root, "temp");
  const workspace = path.join(root, "项目 workspace");
  const localAppData = path.join(userRoot, "AppData", "Local");
  const appData = path.join(userRoot, "AppData", "Roaming");
  for (const directory of [userRoot, temporary, workspace, localAppData, appData])
    fs.mkdirSync(directory, { recursive: true });
  const windows = process.platform === "win32";
  const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT;
  if (windows) assert.ok(systemRoot);
  const systemPath = windows
    ? [path.join(systemRoot, "System32"), systemRoot].join(path.delimiter)
    : "/usr/bin:/bin:/usr/sbin:/sbin";
  const env = {
    HOME: userRoot, USERPROFILE: userRoot, LOCALAPPDATA: localAppData, APPDATA: appData,
    XDG_CACHE_HOME: path.join(userRoot, ".cache"), XDG_CONFIG_HOME: path.join(userRoot, ".config"),
    TEMP: temporary, TMP: temporary, TMPDIR: temporary,
    PATH: systemPath, Path: systemPath, LANG: "C", LC_ALL: "C", TZ: "UTC",
  };
  for (const key of ["SystemRoot", "SYSTEMROOT", "WINDIR", "windir", "ComSpec", "COMSPEC",
    "PATHEXT", "PROCESSOR_ARCHITECTURE", "PROCESSOR_ARCHITEW6432"])
    if (process.env[key] !== undefined) env[key] = process.env[key];
  let shell = "/bin/sh";
  if (windows) {
    const found = spawnSync(path.join(systemRoot, "System32", "where.exe"), ["pwsh"], {
      encoding: "utf8", timeout: 30_000, shell: false,
    });
    assert.equal(found.status, 0, "The native Windows qualification host requires PowerShell.");
    shell = found.stdout.trim().split(/\r?\n/u)[0];
    assert.ok(path.isAbsolute(shell) && fs.statSync(shell).isFile());
  }
  const script = path.join(copy, "scripts", `tiangong-runtime-bootstrap.${windows ? "ps1" : "sh"}`);
  const prefix = windows ? ["-NoProfile", "-NonInteractive", "-File", script] : [script];
  const cache = path.join(windows ? localAppData : process.platform === "darwin"
    ? path.join(userRoot, "Library", "Caches") : env.XDG_CACHE_HOME, "tiangong-lca", "runtimes", "v1");
  assert.equal(fs.existsSync(cache), false);
  const checks = [];
  const run = (phase, args, expectedExit = 0, action = null) => {
    const started = Date.now();
    const result = spawnSync(action?.executable ?? shell, action?.argv ?? [...prefix, ...args], {
      cwd: action?.cwd ?? workspace, env, shell: false, encoding: "utf8", timeout: 900_000,
      stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024,
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    assert.ok((Array.isArray(expectedExit) ? expectedExit : [expectedExit]).includes(result.status),
      `${phase}: exit ${result.status}; ${result.stderr.slice(0, 4096)} ${result.stdout.slice(0, 4096)}`);
    checks.push({ phase, exit: result.status, milliseconds: Date.now() - started });
    return result;
  };
  const operation = (phase, args, expectedExit = 0) => {
    const result = run(phase, args, expectedExit);
    const value = JSON.parse(result.stdout);
    assert.equal(value.schema, "tiangong-foundry.operation-result.v1");
    return value;
  };
  const writeJson = (name, value) => {
    const file = path.join(workspace, name);
    fs.writeFileSync(file, JSON.stringify(value) + "\n");
    return file;
  };
  const artifact = (result, role) => result.artifacts?.findLast((item) => item.role === role);
  const indexedJson = (result, role) => {
    const item = artifact(result, role);
    assert.ok(item?.path, `${role} must be indexed as a file artifact`);
    assert.equal(hash(fs.readFileSync(item.path)), item.sha256);
    return { item, value: JSON.parse(fs.readFileSync(item.path, "utf8")) };
  };
  const initial = operation("cold-install", ["workspace", "init", "--workspace", workspace, "--json"]);
  assert.equal(initial.status, "ready");
  const manifestFile = path.join(cache, "manifests", `${lock.manifest_sha256}.json`);
  const manifestBytes = fs.readFileSync(manifestFile);
  assert.equal(manifestBytes.length, lock.manifest_bytes);
  assert.equal(hash(manifestBytes), lock.manifest_sha256);
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.product.version, version);
  const componentKeys = fs.readdirSync(path.join(cache, "components")).sort();
  const doctor = operation("warm-start", ["doctor", "--workspace", workspace, "--json"]);
  assert.equal(doctor.status, "ready");
  assert.equal(doctor.runtime_identity.foundry.package_version, version);
  const qualification = doctor.runtime_identity.qualification;
  assert.equal(qualification.status, "ready");
  assert.equal(qualification.identity.cli.package_version, "0.1.24");
  assert.equal(qualification.identity.cli.node_version, "24.19.0");
  assert.equal(qualification.identity.tidas.binary_version, "0.3.3");
  assert.deepEqual(fs.readdirSync(path.join(cache, "components")).sort(), componentKeys);
  const application = manifest.components.find((component) => component.id === "foundry" && component.platform === platform);
  assert.ok(application);
  // Receipts locate an installation; the independently shipped manifest owns
  // the content proof and the source expectation is reviewed separately.
  const matches = componentKeys.filter((key) => {
    const receipt = JSON.parse(fs.readFileSync(path.join(cache, "components", key, "receipt.json"), "utf8"));
    return receipt.archive_sha256 === application.archive.sha256 && receipt.content_sha256 === application.content_sha256;
  });
  assert.equal(matches.length, 1);
  const provenancePath = "metadata/runtime-provenance.json";
  const provenanceFact = application.files.find((file) => file.path === provenancePath);
  assert.ok(provenanceFact);
  const provenanceBytes = fs.readFileSync(path.join(cache, "components", matches[0], "root", provenancePath));
  assert.equal(provenanceBytes.length, provenanceFact.bytes);
  assert.equal(hash(provenanceBytes), provenanceFact.sha256);
  const provenance = JSON.parse(provenanceBytes);
  assert.equal(provenance.scope, "published-release");
  assert.equal(provenance.source.commit, source);
  assert.equal(provenance.package.version, version);
  assert.equal(provenance.published_package.source.gitCommit, source);
  // The Foundry owner binds its own CLI 0.1.24 provenance independently, even
  // independently of the configured installation used by ordinary Skills.
  assert.equal(provenance.cli.package.version, "0.1.24");
  assert.equal(provenance.cli.source.ref, "refs/tags/cli-v0.1.24");
  assert.equal(provenance.cli.source.gitCommit, "89c71772ca1afcfc09705f8c27a9703c6bf8ccf6");

  const diagnoseNativeAssessment = async (prior, taskId) => {
    const rows = artifact(prior, "process.rows.json");
    if (!rows?.path) return { error: "no-indexed-process-rows" };
    const tidasComponent = manifest.components.find((component) =>
      component.id === "tidas" && component.platform === platform);
    const tidasMatches = componentKeys.filter((key) => {
      const receipt = JSON.parse(fs.readFileSync(path.join(cache, "components", key, "receipt.json"), "utf8"));
      return receipt.archive_sha256 === tidasComponent?.archive.sha256
        && receipt.content_sha256 === tidasComponent?.content_sha256;
    });
    if (tidasMatches.length !== 1) return { error: "no-unique-installed-tidas", matches: tidasMatches.length };
    const tidasBin = path.join(cache, "components", tidasMatches[0], "root", "bin",
      windows ? "tidas.exe" : "tidas");
    const foundryRoot = path.join(cache, "components", matches[0], "root", "node_modules",
      "@tiangong-lca", "foundry");
    const { runTidasRowsValidation } = await import(pathToFileURL(path.join(foundryRoot,
      "package-dist", "scripts", "lib", "tidas-adapter.js")).href);
    const shallowRoot = fs.mkdtempSync(path.join(temporary, "tidas-short-"));
    t.after(() => fs.rmSync(shallowRoot, { recursive: true, force: true }));
    const assessmentRoot = path.join(workspace, ".foundry", "workspaces", taskId,
      "outputs", "assessment");
    const runDirs = fs.readdirSync(assessmentRoot).flatMap((generation) => {
      const generationRoot = path.join(assessmentRoot, generation);
      return fs.statSync(generationRoot).isDirectory()
        ? fs.readdirSync(generationRoot).filter((name) => name.startsWith("run-"))
          .map((name) => path.join(generationRoot, name)) : [];
    });
    if (!runDirs.length) return { error: "no-assessment-run-directory" };
    const deepOutDir = path.join(runDirs.at(-1), "process", "schema-diagnostic");
    const { createFoundryIsolatedChildEnvironment } = await import(pathToFileURL(path.join(foundryRoot,
      "package-dist", "scripts", "lib", "foundry-runtime-environment.js")).href);
    const isolatedEnv = createFoundryIsolatedChildEnvironment({ tempRoot: path.join(
      workspace, ".foundry", "workspaces", taskId, "tmp", "assessment-diagnostic"),
      sourceEnv: env });
    const probe = (outDir, environment) => {
      try {
        const result = runTidasRowsValidation({ repoRoot: foundryRoot,
          options: { tidasBin, rowsFile: rows.path, type: "process", outDir }, environment });
        return { exit_code: result.exit_code, exit_class: result.report?.exit_class ?? null,
          status: result.report?.status ?? null, diagnostics: result.report?.diagnostics ?? null,
          stderr: String(result.stderr ?? "").slice(0, 4096), report_file: result.report_file ?? null };
      } catch (error) {
        return { error: `${error?.name ?? "Error"}: ${error?.message ?? String(error)}` };
      }
    };
    const diagnostic = { schema: "tiangong-skills.native-assessment-diagnostic.v1", platform,
      task_id: taskId, path_lengths: { rows: rows.path.length, shallow_output: shallowRoot.length,
        deep_output: deepOutDir.length, isolated_temp: isolatedEnv.TMPDIR.length },
      shallow: probe(path.join(shallowRoot, "schema"), env),
      deep: probe(deepOutDir, env),
      deep_with_isolated_env: probe(path.join(runDirs.at(-1), "process",
        "schema-isolated-diagnostic"), isolatedEnv) };
    if (windows && process.env.FOUNDRY_WINDOWS_DIAGNOSTIC === "1") {
      try {
      // Failure-only manual observation of the published owner's actual
      // copy -> execute -> immediate-remove lifecycle. Never retry the task.
      const componentRoot = path.join(cache, "components", matches[0], "root");
      const helperPath = path.join(foundryRoot, "package-dist", "scripts", "lib", "foundry-runtime-environment.js");
      const helperRelative = path.relative(componentRoot, helperPath).split(path.sep).join("/");
      const helperFact = application.files.find((file) => file.path === helperRelative);
      const nativeFact = tidasComponent.files.find((file) => file.path === "bin/tidas.exe");
      assert.ok(helperFact && nativeFact);
      assert.equal(hash(fs.readFileSync(helperPath)), helperFact.sha256);
      assert.equal(hash(fs.readFileSync(tidasBin)), nativeFact.sha256);
      const { copyFoundryIsolatedExecutable } = await import(pathToFileURL(helperPath).href);
      const lifecycleRoot = fs.mkdtempSync(path.join(workspace, ".foundry", "workspaces", taskId,
        "tmp", "assessment-lifecycle-diagnostic-"));
      const copiedBinary = path.join(lifecycleRoot, path.basename(tidasBin));
      const lifecycle = { source, helper_sha256: helperFact.sha256, native_sha256: nativeFact.sha256,
        owned_root: lifecycleRoot, observations: [] };
      diagnostic.isolated_executable_lifecycle = lifecycle;
      const observe = (phase, action) => {
        try { return action(); } catch (error) {
          const ownedPath = (value) => typeof value === "string"
            ? (value === lifecycleRoot || value.startsWith(lifecycleRoot + path.sep) ? value : "outside-owned-root-redacted") : null;
          lifecycle.observations.push({ phase, code: error?.code ?? null,
            syscall: error?.syscall ?? null, path: ownedPath(error?.path), dest: ownedPath(error?.dest) });
          return null;
        }
      };
      try {
        const prepared = observe("copy", () => {
          copyFoundryIsolatedExecutable(tidasBin, copiedBinary);
          assert.equal(hash(fs.readFileSync(copiedBinary)), nativeFact.sha256);
          return true;
        });
        if (prepared) {
          const environment = createFoundryIsolatedChildEnvironment({ tempRoot: lifecycleRoot, sourceEnv: env });
          const nativeResult = observe("execute", () => runTidasRowsValidation({ repoRoot: foundryRoot,
            options: { tidasBin: copiedBinary, rowsFile: rows.path, type: "process",
              outDir: path.join(lifecycleRoot, "schema") }, environment }));
          lifecycle.native_exit = nativeResult?.exit_code ?? null;
          lifecycle.native_status = nativeResult?.report?.status ?? null;
        }
      } finally {
        observe("immediate-remove", () => fs.rmSync(lifecycleRoot, { recursive: true, force: true }));
        lifecycle.cleanup_absent = !fs.existsSync(lifecycleRoot);
      }
      } catch (error) {
        // Instrumentation must not replace the original runtime failure.
        diagnostic.isolated_executable_lifecycle ??= {};
        diagnostic.isolated_executable_lifecycle.setup_error = {
          name: error?.name ?? "Error", code: error?.code ?? null };
      }
    }
    if (process.env.FOUNDRY_INSTALL_PROOF_DIR) {
      fs.mkdirSync(process.env.FOUNDRY_INSTALL_PROOF_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.FOUNDRY_INSTALL_PROOF_DIR,
        `${platform}-native-diagnostic.json`), JSON.stringify(diagnostic, null, 2) + "\n");
    }
    return diagnostic;
  };

  // The installed 0.1.15 copied entry must prove interaction and adoption.
  {
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
    const process = repaired[0].processDataSet.processInformation;
    assert.equal(process.dataSetInformation.classificationInformation["common:classification"]
      ["common:class"].at(-1)["@classId"], "3530");
    assert.equal(process.geography.locationOfOperationSupplyOrProduction["@location"], "Invalid region");
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
  }

  // The final public runtime must keep two Process decisions separate in one task.
  {
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
  }

  // This is a credential-free local cleanup task, not the live RC01–RC06 account case.
  const selected = path.join(workspace, "source.jsonl");
  fs.writeFileSync(selected, '{"flowDataSet":{}}\n');
  const spec = path.join(workspace, "task.json");
  fs.writeFileSync(spec, JSON.stringify({
    schema: "tiangong-foundry.task-start.v1", request_id: "copied-skill-install",
    actor_id: "skill-qualifier", lane: "external-dataset-curated-import", profile_id: "generic",
    target_entities: ["flow"], sources: [{ path: selected }], seed: null, account_intent: null,
    preparation: { operation: "dataset-curation-cleanup", type: "flow", input: selected,
      source_input: null, output_directory: "outputs/cleanup" },
  }, null, 2));
  const task = operation("task-start", ["task", "start", "--workspace", workspace, "--spec", spec, "--json"]);
  assert.equal(task.status, "ready");
  assert.ok(task.task_id);
  const taskArgs = ["--workspace", workspace, "--task", task.task_id, "--actor", "skill-qualifier", "--json"];
  const status = operation("task-status", ["task", "status", ...taskArgs]);
  assert.equal(status.task_id, task.task_id);
  const action = status.next_actions.find((item) => item.kind === "command");
  assert.ok(action);
  assert.equal(action.code, "resume_local_preparation");
  assert.equal(fs.realpathSync(action.cwd), fs.realpathSync(workspace));
  const resumed = JSON.parse(run("returned-task-resume", [], 0, action).stdout);
  assert.equal(resumed.schema, "tiangong-foundry.operation-result.v1");
  assert.equal(resumed.task_id, task.task_id);
  assert.ok(["ready", "completed"].includes(resumed.status));
  assert.equal(resumed.runtime_identity.qualification.status, "ready");
  const manifestIndex = action.argv.indexOf("--manifest");
  assert.ok(manifestIndex > 0);
  const actionManifest = action.argv[manifestIndex + 1];
  assert.ok(path.isAbsolute(actionManifest));
  const manifestRelative = path.relative(fs.realpathSync(root), fs.realpathSync(actionManifest));
  assert.ok(manifestRelative && manifestRelative !== ".."
    && !manifestRelative.startsWith(`..${path.sep}`) && !path.isAbsolute(manifestRelative));
  assert.equal(fs.lstatSync(actionManifest).isSymbolicLink(), false);
  const actionManifestBytes = fs.readFileSync(actionManifest);
  assert.equal(hash(actionManifestBytes), lock.manifest_sha256);
  fs.appendFileSync(actionManifest, "\n");
  try {
    // The public CLI runtime-error contract returns EX_UNAVAILABLE (69).
    assert.match(run("returned-manifest-tamper-refused", [], 69, action).stderr,
      /RUNTIME_MANIFEST_INTEGRITY/u);
  } finally { fs.writeFileSync(actionManifest, actionManifestBytes); }
  assert.equal(operation("developer-command-refused", ["profiles-list", "--workspace", workspace, "--json"], 2).status, "needs_input");

  const mustNotExist = path.join(root, "must-not-exist");
  const originalScript = fs.readFileSync(script);
  fs.appendFileSync(script, "\n");
  try {
    assert.match(run("script-tamper-refused", ["workspace", "init", "--workspace", mustNotExist, "--json"], 1).stderr,
      /bootstrap_script_changed/u);
    assert.equal(fs.existsSync(mustNotExist), false);
  } finally { fs.writeFileSync(script, originalScript); }
  const lockCopy = path.join(copy, "scripts", "bootstrap-lock.json");
  const originalLock = fs.readFileSync(lockCopy);
  fs.unlinkSync(lockCopy);
  try {
    assert.match(run("missing-lock-refused", ["workspace", "init", "--workspace", mustNotExist, "--json"], 1).stderr,
      /missing_adjacent_lock/u);
    assert.equal(fs.existsSync(mustNotExist), false);
  } finally { fs.writeFileSync(lockCopy, originalLock); }
  fs.appendFileSync(manifestFile, "\n");
  try {
    assert.match(run("manifest-tamper-refused", ["doctor", "--workspace", workspace, "--json"], 1).stderr,
      /file_size_mismatch|file_sha256_mismatch/u);
  } finally { fs.writeFileSync(manifestFile, manifestBytes); }
  const keyPrefix = platform.replaceAll("-", "_");
  const integrity = path.join(cache, "components", lock[`${keyPrefix}_component_key`], "root", lock[`${keyPrefix}_integrity_path`]);
  const originalIntegrity = fs.readFileSync(integrity);
  fs.writeFileSync(integrity, "changed\n");
  try {
    assert.match(run("base-index-tamper-refused", ["doctor", "--workspace", workspace, "--json"], 1).stderr,
      /integrity_file_changed/u);
  } finally { fs.writeFileSync(integrity, originalIntegrity); }
  assert.equal(operation("restored-installation", ["doctor", "--workspace", workspace, "--json"]).status, "ready");
  const report = { schema: "tiangong-skills.foundry-public-install.v1", status: "passed", platform,
    version, source: provenance.source.commit, manifest_sha256: lock.manifest_sha256,
    initial_cache: "empty", credential_scope: "none", runtime_identity: doctor.runtime_identity, checks };
  const proofDirectory = process.env.FOUNDRY_INSTALL_PROOF_DIR;
  if (proofDirectory) {
    assert.ok(path.isAbsolute(proofDirectory));
    fs.mkdirSync(proofDirectory, { recursive: true });
    fs.writeFileSync(path.join(proofDirectory, `${platform}.json`), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  }
  t.diagnostic(JSON.stringify({ platform, version, manifest_sha256: lock.manifest_sha256, checks }));
});
