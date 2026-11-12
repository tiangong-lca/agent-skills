import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const entity of ['flow', 'process', 'lifecyclemodel']) {
  test(`independently installed ${entity} skill requires configured CLI and offers offline help without a checkout`, () => {
    const sandbox = mkdtempSync(path.join(tmpdir(), 'skills-installed-bootstrap-'));
    const name = `${entity}-hybrid-search`;
    const installed = path.join(sandbox, name);
    const sessionFile = path.join(sandbox, 'private-session', 'session.json');
    try {
      // Model a copied, individually installed skill, not a repository symlink.
      cpSync(path.join(repoRoot, name), installed, { recursive: true });
      const env = Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => !/^(?:TIANGONG_|GIT_)/iu.test(key),
        ),
      );
      env.TIANGONG_LCA_SESSION_FILE = sessionFile;
      for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
      env.PATH = ''; // No package manager, Git, or external CLI can be discovered.
      const run = (extra = [], overrides = {}) => spawnSync(
        process.execPath,
        [path.join(installed, 'scripts', `run-${name}.mjs`), '--query', 'water', '--json', ...extra],
        { cwd: sandbox, env: { ...env, ...overrides }, encoding: 'utf8', shell: false, timeout: 60_000 },
      );
      const result = run();
      assert.ifError(result.error);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /No CLI installation configured/);
      const help = spawnSync(process.execPath, [path.join(installed, 'scripts', `run-${name}.mjs`), '--help'], {
        cwd: sandbox, env, encoding: 'utf8', shell: false, timeout: 10_000,
      });
      assert.equal(help.status, 0, help.stderr);
      assert.match(help.stdout, /TIANGONG_LCA_CLI_INSTALLATION/);
      const direct = path.join(installed, 'scripts', 'run-cli.mjs');
      for (const args of [['--runtime-info'], ['auth', 'status', '--json'], ['--published-cli']]) {
        const failed = spawnSync(process.execPath, [direct, ...args], { cwd: sandbox, env, encoding: 'utf8', shell: false });
        assert.notEqual(failed.status, 0);
        assert.match(failed.stderr, /No CLI installation configured|selection has been removed/);
      }
      const directHelp = spawnSync(process.execPath, [direct, '--help'], { cwd: sandbox, env, encoding: 'utf8', shell: false });
      assert.equal(directHelp.status, 0, directHelp.stderr);
      assert.match(directHelp.stdout, /TIANGONG_LCA_CLI_INSTALLATION/);
      assert.equal(existsSync(sessionFile), false, 'unconfigured search must not create an OAuth session');
      assert.equal(existsSync(path.join(sandbox, 'scripts')), false, 'no repository launcher is installed');
      assert.equal(
        readFileSync(path.join(installed, 'scripts', 'lib', 'cli-launcher.mjs'), 'utf8'),
        readFileSync(path.join(repoRoot, 'scripts', 'lib', 'cli-launcher.mjs'), 'utf8'),
        'bundled launcher must remain byte-identical to the one repository authority',
      );
      for (const library of ['cli-development.mjs', 'cli-installed.mjs']) {
        assert.equal(readFileSync(path.join(installed, 'scripts', 'lib', library), 'utf8'),
          readFileSync(path.join(repoRoot, 'scripts', 'lib', library), 'utf8'));
      }
      assert.equal(readFileSync(path.join(installed, 'scripts', 'run-cli.mjs'), 'utf8'),
        readFileSync(path.join(repoRoot, 'scripts', 'run-cli.mjs'), 'utf8'));
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
}
