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
    // npm's cmd-shim separates the directory variable from the relative bin path.
    fs.writeFileSync(path.join(temporary, 'tiangong-foundry.cmd'), 'SETLOCAL\r\nSET dp0=%~dp0\r\n@"node" "%dp0%\\path-entry.mjs" %*\r\n');
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

test('copied Foundry skill forwards a CLI-managed launch with the caller path base', (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-cli-managed-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const copy = path.join(temporary, '复制 skill');
  fs.cpSync(path.join(root, 'foundry-tidas-import'), copy, { recursive: true });
  fs.rmSync(path.join(copy, 'scripts/bootstrap-lock.json'));
  const launcher = path.join(copy, 'scripts/run-foundry.mjs');
  const caller = path.join(temporary, 'caller ; 中文');
  fs.mkdirSync(path.join(caller, 'materials'), { recursive: true });
  const spec = 'materials/payload ; $(touch surprise) 中文.json';
  fs.writeFileSync(path.join(caller, spec), '{"source":"caller"}');
  const command = path.join(temporary, 'managed cli.mjs');
  const journal = path.join(temporary, 'calls.jsonl');
  fs.writeFileSync(command, `import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(journal)}, JSON.stringify(args)+'\\n');
const application = args.slice(args.indexOf('--')+1);
const input = application[application.indexOf('--spec')+1];
process.stdout.write(JSON.stringify({args, cwd:process.cwd(), payload:JSON.parse(fs.readFileSync(input,'utf8')), status:'UNKNOWN'}));
process.stderr.write('native managed diagnostic\\n');
process.exitCode=7;
`);
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('TIANGONG_FOUNDRY_')));
  Object.assign(env, {
    PATH: '',
    TIANGONG_FOUNDRY_RUNTIME_CLI: command,
    TIANGONG_FOUNDRY_MANIFEST: path.join(temporary, 'verified manifest.json'),
    TIANGONG_FOUNDRY_MANIFEST_SHA256: 'a'.repeat(64),
    TIANGONG_FOUNDRY_CACHE_DIR: path.join(temporary, 'cache 中文'),
  });
  const argv = ['task', 'start', '--workspace', caller, '--spec', spec, '--json'];
  const expected = ['runtime', 'exec', '--manifest', env.TIANGONG_FOUNDRY_MANIFEST,
    '--manifest-sha256', env.TIANGONG_FOUNDRY_MANIFEST_SHA256,
    '--cache-dir', env.TIANGONG_FOUNDRY_CACHE_DIR, '--entry', 'foundry',
    '--cwd', fs.realpathSync(caller), '--', ...argv];
  const result = spawnSync(process.execPath, [launcher, ...argv], {
    cwd: caller, env, encoding: 'utf8', shell: false,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 7, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    args: expected, cwd: fs.realpathSync(caller), payload: { source: 'caller' }, status: 'UNKNOWN',
  });
  assert.equal(result.stderr, 'native managed diagnostic\n');
  assert.deepEqual(fs.readFileSync(journal, 'utf8').trim().split('\n').map(JSON.parse), [expected]);
  assert.equal(fs.existsSync(path.join(caller, 'surprise')), false);

  const invalid = [
    [{ TIANGONG_FOUNDRY_RUNTIME_CLI: '' }, /requires an executable/u],
    [{ TIANGONG_FOUNDRY_MANIFEST: 'relative.json' }, /absolute TIANGONG_FOUNDRY_MANIFEST/u],
    [{ TIANGONG_FOUNDRY_MANIFEST_SHA256: '' }, /independently verified/u],
    [{ TIANGONG_FOUNDRY_CACHE_DIR: 'relative-cache' }, /absolute directory/u],
    [{ TIANGONG_FOUNDRY_ENTRY: 'foundry --other' }, /declared launch/u],
    [{ TIANGONG_FOUNDRY_COMMAND: command }, /both are configured/u],
  ];
  for (const [override, message] of invalid) {
    const refused = spawnSync(process.execPath, [launcher, ...argv], {
      cwd: caller, env: { ...env, ...override }, encoding: 'utf8', shell: false,
    });
    assert.equal(refused.status, 1);
    assert.equal(refused.stdout, '');
    assert.match(refused.stderr, message);
  }
  const discovery = spawnSync(process.execPath, [launcher, 'runtime', 'describe', '--json'], {
    cwd: caller, env, encoding: 'utf8', shell: false,
  });
  assert.equal(discovery.status, 1);
  assert.equal(discovery.stdout, '');
  assert.match(discovery.stderr, /runtime describe requires the public Foundry installed entry/u);
  assert.equal(fs.readFileSync(journal, 'utf8').trim().split('\n').length, 1);
});
