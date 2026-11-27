import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  createFoundryPublicInstallHarness,
  hash,
  source,
  version,
} from "./lib/foundry-public-install-harness.mjs";

test("copied Foundry skill runs the public locked runtime and rejects changed installation inputs", {
  timeout: 1_800_000,
}, async (t) => {
  const {
    lock, platform, root, copy, workspace, script, cache,
    manifestFile, manifestBytes, componentKeys, application, matches,
    run, operation, writeProof,
  } = createFoundryPublicInstallHarness(t);

  const doctor = operation("warm-start", ["doctor", "--workspace", workspace, "--json"]);
  assert.equal(doctor.status, "ready");
  assert.equal(doctor.runtime_identity.foundry.package_version, version);
  const qualification = doctor.runtime_identity.qualification;
  assert.equal(qualification.status, "ready");
  assert.equal(qualification.identity.cli.package_version, "0.1.24");
  assert.equal(qualification.identity.cli.node_version, "24.19.0");
  assert.equal(qualification.identity.tidas.binary_version, "0.3.3");
  assert.deepEqual(fs.readdirSync(path.join(cache, "components")).sort(), componentKeys);

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
  writeProof(`${platform}.json`, {
    source: provenance.source.commit,
    runtime_identity: doctor.runtime_identity,
  });
});
