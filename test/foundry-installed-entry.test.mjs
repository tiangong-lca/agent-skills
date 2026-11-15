import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('copied Foundry skill follows environment upgrades and preserves one native dispatch', (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-skill-entry-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const copy = path.join(temporary, '复制 skill');
  fs.cpSync(path.join(root, 'foundry-tidas-import'), copy, { recursive: true });
  // Ordinary execution has no dependency on the retained historical installer.
  fs.rmSync(path.join(copy, 'scripts/bootstrap-lock.json'));
  const launcher = path.join(copy, 'scripts/run-foundry.mjs');
  const argv = ['task', 'resume', '--task', 'space ; $(touch surprise) 中文', '--json'];
  const journal = path.join(temporary, 'calls.jsonl');
  for (const version of ['current', 'successor']) {
    const command = path.join(temporary, `${version} entry.mjs`);
    fs.writeFileSync(command, `import fs from 'node:fs';\nfs.appendFileSync(${JSON.stringify(journal)}, JSON.stringify(process.argv.slice(2))+'\\n');\nprocess.stdout.write(JSON.stringify({version:${JSON.stringify(version)},args:process.argv.slice(2),status:'UNKNOWN'}));\nprocess.stderr.write('native stderr\\n');\nprocess.exitCode=7;\n`);
    const result = spawnSync(process.execPath, [launcher, ...argv], { env: { ...process.env, TIANGONG_FOUNDRY_COMMAND: command }, encoding: 'utf8', shell: false });
    assert.ifError(result.error);
    assert.equal(result.status, 7);
    assert.deepEqual(JSON.parse(result.stdout), { version, args: argv, status: 'UNKNOWN' });
    assert.equal(result.stderr, 'native stderr\n');
  }
  assert.equal(fs.readFileSync(journal, 'utf8').trim().split('\n').length, 2);
  const pathEntry = path.join(temporary, 'path-entry.mjs');
  fs.writeFileSync(pathEntry, `#!${process.execPath}\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));\n`, { mode: 0o755 });
  if (process.platform === 'win32') {
    fs.writeFileSync(path.join(temporary, 'tiangong-foundry.cmd'), '@"%~dp0node.exe" "%~dp0path-entry.mjs" %*\r\n');
  } else {
    fs.renameSync(pathEntry, path.join(temporary, 'tiangong-foundry'));
  }
  const pathEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'path' && key !== 'TIANGONG_FOUNDRY_COMMAND'));
  pathEnv.PATH = temporary;
  const fromPath = spawnSync(process.execPath, [launcher, ...argv], { env: pathEnv, encoding: 'utf8', shell: false });
  assert.ifError(fromPath.error);
  assert.equal(fromPath.status, 0, fromPath.stderr);
  assert.deepEqual(JSON.parse(fromPath.stdout), argv);
  const missing = spawnSync(process.execPath, [launcher, ...argv], { env: { ...process.env, TIANGONG_FOUNDRY_COMMAND: path.join(temporary, 'absent') }, encoding: 'utf8', shell: false });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Install the Foundry public package/u);
  assert.equal(missing.stdout, '');
  assert.equal(fs.readFileSync(journal, 'utf8').trim().split('\n').length, 2);
  assert.equal(fs.existsSync(path.join(temporary, 'surprise')), false);
  assert.deepEqual(fs.readFileSync(path.join(root, 'scripts/lib/cli-command.mjs')), fs.readFileSync(path.join(copy, 'scripts/lib/cli-command.mjs')));
});
