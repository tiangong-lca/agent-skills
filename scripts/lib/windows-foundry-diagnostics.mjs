// Manual, observation-only Windows controls for Skills #144. This is not a
// replacement for the unchanged four-platform qualification suite.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

assert.equal(process.platform, "win32");
const repository = fileURLToPath(new URL("../../", import.meta.url));
const proof = process.env.FOUNDRY_INSTALL_PROOF_DIR;
assert.ok(proof && path.isAbsolute(proof));
fs.mkdirSync(proof, { recursive: true });
const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT;
assert.ok(systemRoot);
const shell = path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
const original = path.join(repository, "foundry-tidas-import", "scripts", "tiangong-runtime-bootstrap.ps1");
const scriptSha256 = createHash("sha256").update(fs.readFileSync(original)).digest("hex");
assert.equal(scriptSha256, "a797bc5269386a0f45fbc5bebb7d634b37fc8a164500aaaa4905be5e61bf8f65");
const report = { schema: "tiangong-skills.windows-foundry-controls.v1", source: process.env.GITHUB_SHA,
  script_sha256: scriptSha256, platform: `${process.platform}-${process.arch}`,
  node: process.version, concurrency: 1, failure_only_instrumentation: true, controls: [], cleanup: [] };
const save = () => fs.writeFileSync(path.join(proof, "windows-controls.json"), JSON.stringify(report, null, 2) + "\n");
const summarize = (result, started) => ({ status: result.status, signal: result.signal,
  error: result.error?.code ?? null, milliseconds: Date.now() - started,
  stdout: result.stdout?.slice(0, 4096), stderr: result.stderr?.slice(0, 4096) });

// Each probe gets a fresh private tree. Each single-variable group is compared
// with the original environment, not with the preceding probe's environment.
for (const mode of ["original", "private-profile", "os", "modules", "complete", "original-order-control"]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skills144-host-"));
  const copy = path.join(root, "copied skill"), user = path.join(root, "user");
  const temporary = path.join(root, "temp"), local = path.join(user, "AppData", "Local");
  const roaming = path.join(user, "AppData", "Roaming");
  for (const directory of [copy, temporary, local, roaming]) fs.mkdirSync(directory, { recursive: true });
  const script = path.join(copy, path.basename(original));
  fs.copyFileSync(original, script);
  const baseline = { SystemRoot: systemRoot, USERPROFILE: user, LOCALAPPDATA: local,
    PATH: path.join(systemRoot, "System32") };
  const privateProfile = { HOME: user, APPDATA: roaming, TEMP: temporary, TMP: temporary, TMPDIR: temporary };
  const operatingSystem = {};
  for (const key of ["WINDIR", "ComSpec", "PATHEXT", "ProgramFiles", "ProgramFiles(x86)", "ProgramW6432"])
    if (process.env[key] !== undefined) operatingSystem[key] = process.env[key];
  const modules = { PSModulePath: path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "Modules") };
  const env = { ...baseline,
    ...(["private-profile", "complete"].includes(mode) ? privateProfile : {}),
    ...(["os", "complete"].includes(mode) ? operatingSystem : {}),
    ...(["modules", "complete"].includes(mode) ? modules : {}) };
  const control = { mode, environment_keys: Object.keys(env).sort(), owned_root: root };
  report.controls.push(control);
  try {
    let started = Date.now();
    const startup = spawnSync(shell, ["-NoProfile", "-NonInteractive", "-Command", "Write-Output 'bootstrap-host-ready'"], {
      cwd: copy, env, encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"], timeout: 90_000,
    });
    control.startup = summarize(startup, started);
    if (!startup.error && startup.status === 0 && startup.stdout.trim() === "bootstrap-host-ready") {
      started = Date.now();
      const refusal = spawnSync(shell, ["-NoProfile", "-NonInteractive", "-File", script, "doctor", "--json"], {
        cwd: copy, env, encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"], timeout: 90_000,
      });
      control.refusal = summarize(refusal, started);
      control.refusal_contract = !refusal.error && refusal.status !== 0
        && /bootstrap_error:missing_adjacent_lock/u.test(refusal.stdout + refusal.stderr)
        && !fs.existsSync(path.join(local, "tiangong-lca", "runtimes"))
        && JSON.stringify(fs.readdirSync(copy)) === JSON.stringify([path.basename(script)]);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    report.cleanup.push({ owned_root: root, absent: !fs.existsSync(root) });
    save();
  }
}

// Run the original public entry once, outside concurrent repository test files.
// Its own 30-minute timeout, bootstrap, semantic and cleanup assertions remain.
const log = path.join(proof, "windows-public-install.log");
const descriptor = fs.openSync(log, "w");
const started = Date.now();
try {
  const child = spawn(process.execPath, ["--test", "test/foundry-public-install.test.mjs"], {
    cwd: repository, env: { ...process.env, FOUNDRY_WINDOWS_DIAGNOSTIC: "1" },
    shell: false, stdio: ["ignore", descriptor, descriptor],
  });
  const result = await new Promise((resolve) => {
    const deadline = setTimeout(() => {
      // This is the exact child still owned by this invocation, not a process
      // search by executable name. No runner-wide process termination occurs.
      const killed = spawnSync(path.join(systemRoot, "System32", "taskkill.exe"),
        ["/PID", String(child.pid), "/T", "/F"], { encoding: "utf8", shell: false, timeout: 30_000 });
      report.termination = { owned_pid: child.pid, ...summarize(killed, Date.now()) };
    }, 1_920_000);
    child.once("error", (error) => { clearTimeout(deadline); resolve({ error, status: null, signal: null }); });
    child.once("close", (status, signal) => { clearTimeout(deadline); resolve({ status, signal }); });
  });
  report.public_install = summarize(result, started);
  report.public_install.cleanup = result.status === 0 ? "original-test-after-hook-completed" : "inspect-original-test-log";
  report.public_install.original_test_sha256 = createHash("sha256").update(fs.readFileSync(path.join(repository,
    "test", "foundry-public-install.test.mjs"))).digest("hex");
  if (result.error || result.status !== 0) process.exitCode = 1;
} finally {
  fs.closeSync(descriptor);
  save();
}
console.log(JSON.stringify(report, null, 2));
