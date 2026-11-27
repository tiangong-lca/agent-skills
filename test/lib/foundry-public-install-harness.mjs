import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const entry = fileURLToPath(new URL("../../foundry-tidas-import/", import.meta.url));
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const stableJson = (value) => Array.isArray(value) ? value.map(stableJson)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort()
    .map((key) => [key, stableJson(value[key])])) : value;
export const rowHash = (row) => hash(Buffer.from(JSON.stringify(stableJson(row))));
export const version = "0.1.15";
export const source = "0ab6b54513acccfe3253ea583b4f6b2e678c0485";

export function createFoundryPublicInstallHarness(t) {
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
  const application = manifest.components.find((component) => component.id === "foundry" && component.platform === platform);
  assert.ok(application);
  const matches = componentKeys.filter((key) => {
    const receipt = JSON.parse(fs.readFileSync(path.join(cache, "components", key, "receipt.json"), "utf8"));
    return receipt.archive_sha256 === application.archive.sha256 && receipt.content_sha256 === application.content_sha256;
  });
  assert.equal(matches.length, 1);

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

  const writeProof = (filename, extra = {}) => {
    const report = {
      schema: "tiangong-skills.foundry-public-install.v1",
      status: "passed",
      platform,
      version,
      source,
      manifest_sha256: lock.manifest_sha256,
      initial_cache: "empty",
      credential_scope: "none",
      ...extra,
      checks,
    };
    const proofDirectory = process.env.FOUNDRY_INSTALL_PROOF_DIR;
    if (proofDirectory) {
      assert.ok(path.isAbsolute(proofDirectory));
      fs.mkdirSync(proofDirectory, { recursive: true });
      fs.writeFileSync(path.join(proofDirectory, filename), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
    }
    t.diagnostic(JSON.stringify({ platform, version, manifest_sha256: lock.manifest_sha256, checks }));
  };

  return {
    lock, platform, root, copy, workspace, windows, script, cache, checks,
    manifestFile, manifestBytes, manifest, componentKeys, application, matches,
    run, operation, writeJson, artifact, indexedJson, diagnoseNativeAssessment, writeProof,
  };
}
