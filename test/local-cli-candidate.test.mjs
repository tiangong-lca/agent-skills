import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import {
  buildTiangongInvocation,
  expectedNodeVersion,
  expectedPnpmVersion,
  expectedTidasSpecSource,
  inspectLocalCliCandidate,
  runTiangongCommand,
} from '../scripts/lib/cli-launcher.mjs';

// The gzip stores the original UTF-8 schema bytes from tiangong-lca/cli assets,
// copied read-only from CLI #413 commit 54c0aec1612c67cc756f63143b6bf9eb7d139455.
// The bundled source is
// tiangong-lca/tidas-spec f118660dbcbfbf736be74837cce0bf26cd177245 (0.2.3),
// manifest SHA-256 5b69ab859e26a253dc51c6aeee68c971d727b1f8db44128143795113fe3eee6a.
// gzip SHA-256 eb482b22869ff594e26b6a0e2974496f2295b895a2cad570bfef53baa370a00d.
// This test-only fixture is outside all distributed skill directories.
const schemaArchive = readFileSync(new URL('./fixtures/local-cli-candidate-schemas.json.gz', import.meta.url));
const schemaFiles = JSON.parse(gunzipSync(schemaArchive).toString('utf8'));
const candidateVersion = '0.1.27';
const candidateSchema = 'tiangong-lca.skills-local-cli-candidate.v1';
const fixedSourceTime = new Date('2020-01-01T00:00:00Z');
const fixedBuildTime = new Date('2020-01-02T00:00:00Z');
const repoRoot = path.resolve(import.meta.dirname, '..');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sanitizedEnv() {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.toUpperCase().startsWith('GIT_')));
}

function git(cliDir, args) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=', ...args], {
    cwd: cliDir,
    env: sanitizedEnv(),
    encoding: 'utf8',
    shell: false,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function write(root, relativePath, bytes) {
  const filePath = path.join(root, ...relativePath.split('/'));
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, bytes);
  return filePath;
}

function setTreeTime(root, time) {
  for (const name of readdirSync(root)) {
    const filePath = path.join(root, name);
    if (statSync(filePath).isDirectory()) setTreeTime(filePath, time);
    utimesSync(filePath, time, time);
  }
  utimesSync(root, time, time);
}

function supportedToolchain(overrides = {}) {
  return {
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl: (command, args, options) => {
      assert.equal(command, process.platform === 'win32' ? 'pnpm.exe' : 'pnpm');
      assert.deepEqual(args, ['--version']);
      assert.equal(options.shell, false);
      return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
    },
    spawnOptions: { env: sanitizedEnv() },
    ...overrides,
  };
}

function createFixture() {
  const sandboxRoot = mkdtempSync(path.join(tmpdir(), 'skills-qualified-candidate-'));
  try {
    const cliDir = path.join(sandboxRoot, 'cli with spaces');
    mkdirSync(cliDir);
    git(cliDir, ['init', '--quiet']);
    git(cliDir, ['config', 'user.name', 'Local Candidate Fixture']);
    git(cliDir, ['config', 'user.email', 'fixture@example.invalid']);
    git(cliDir, ['config', 'commit.gpgsign', 'false']);
    git(cliDir, ['config', 'core.autocrlf', 'false']);
    git(cliDir, ['remote', 'add', 'origin', 'https://github.com/tiangong-lca/cli.git']);
    write(cliDir, '.gitignore', 'dist/\nnode_modules/\n');
    write(cliDir, 'package.json', `${JSON.stringify({
      name: '@tiangong-lca/cli',
      version: candidateVersion,
      type: 'module',
      repository: { type: 'git', url: 'git+https://github.com/tiangong-lca/cli.git' },
      packageManager: 'pnpm@11.24.0',
      engines: { node: '>=24.19.0 <25', pnpm: '11.24.0' },
      scripts: { build: 'node scripts/build.mjs' },
    }, null, 2)}\n`);
    const lockfile = "lockfileVersion: '9.0'\nsettings:\n  autoInstallPeers: true\n  excludeLinksFromLockfile: false\nimporters:\n  .: {}\n";
    write(cliDir, 'pnpm-lock.yaml', lockfile);
    write(cliDir, 'src/main.ts', 'export const fixtureVersion = "0.1.27";\n');
    write(cliDir, 'bin/tiangong-lca.js', 'import "../dist/src/main.js";\n');
    write(cliDir, 'scripts/build.mjs', 'process.exit(0);\n');
    write(cliDir, 'tsconfig.build.json', '{"compilerOptions":{"outDir":"dist"}}\n');
    write(cliDir, 'assets/tidas-spec-source.json', `${JSON.stringify(expectedTidasSpecSource, null, 2)}\n`);
    for (const [name, text] of Object.entries(schemaFiles)) {
      write(cliDir, `assets/tidas-schemas/${name}`, text);
    }
    git(cliDir, ['add', '--', '.gitignore', 'package.json', 'pnpm-lock.yaml', 'src', 'bin', 'scripts', 'tsconfig.build.json', 'assets']);
    git(cliDir, ['commit', '--quiet', '-m', 'Create isolated CLI candidate fixture']);
    const commit = git(cliDir, ['rev-parse', 'HEAD']);
    for (const relativePath of ['src', 'bin', 'scripts', 'assets']) {
      setTreeTime(path.join(cliDir, relativePath), fixedSourceTime);
    }
    for (const relativePath of ['package.json', 'pnpm-lock.yaml', 'tsconfig.build.json']) {
      utimesSync(path.join(cliDir, relativePath), fixedSourceTime, fixedSourceTime);
    }
    write(cliDir, 'dist/src/main.js', 'process.stdout.write(JSON.stringify(process.argv.slice(2)));\n');
    write(cliDir, 'node_modules/.modules.yaml', 'layoutVersion: 5\npackageManager: pnpm@11.24.0\n');
    write(cliDir, 'node_modules/.pnpm/lock.yaml', lockfile);
    write(cliDir, 'node_modules/fixture-dependency/index.js', 'export const value = "qualified dependency";\n');
    setTreeTime(path.join(cliDir, 'dist'), fixedBuildTime);
    setTreeTime(path.join(cliDir, 'node_modules'), fixedBuildTime);
    const candidate = inspectLocalCliCandidate(cliDir, {
      expectedCommit: commit,
      expectedVersion: candidateVersion,
      ...supportedToolchain(),
    });
    const cliCandidateFile = path.join(sandboxRoot, 'qualification with spaces', 'candidate.json');
    const fixture = { sandboxRoot, cliDir, commit, candidate, cliCandidateFile };
    rewriteCandidate(fixture, candidate);
    return fixture;
  } catch (error) {
    rmSync(sandboxRoot, { recursive: true, force: true });
    throw error;
  }
}

function rewriteCandidate(fixture, candidate, rawBytes = null) {
  const bytes = rawBytes ?? `${JSON.stringify(candidate, null, 2)}\n`;
  mkdirSync(path.dirname(fixture.cliCandidateFile), { recursive: true });
  writeFileSync(fixture.cliCandidateFile, bytes);
  fixture.cliCandidateSha256 = sha256(bytes);
}

function candidateOptions(fixture, overrides = {}) {
  return {
    cliDir: fixture.cliDir,
    cliCandidateFile: fixture.cliCandidateFile,
    cliCandidateSha256: fixture.cliCandidateSha256,
    ...supportedToolchain(),
    ...overrides,
  };
}

function withFixture(callback) {
  const fixture = createFixture();
  try {
    return callback(fixture);
  } finally {
    rmSync(fixture.sandboxRoot, { recursive: true, force: true });
  }
}

function invocation(fixture, overrides = {}) {
  return buildTiangongInvocation(['--help'], candidateOptions(fixture, overrides));
}

function subprocessEnv(fixture) {
  const env = sanitizedEnv();
  const existingPath = Object.entries(env).find(([name]) => name.toUpperCase() === 'PATH')?.[1] ?? '';
  for (const name of Object.keys(env)) {
    if (name.toUpperCase() === 'PATH' || /^TIANGONG_LCA_CLI_(?:DIR|MODE|CANDIDATE_FILE|CANDIDATE_SHA256)$/u.test(name)) delete env[name];
  }
  // Normal CI supplies the exact repository toolchain on PATH. A local caller
  // may explicitly supply its exact toolchain directory without committing it.
  env.PATH = [process.env.TIANGONG_LCA_TEST_TOOLCHAIN_BIN ?? path.dirname(process.execPath), existingPath].join(path.delimiter);
  env.TIANGONG_LCA_CLI_DIR = fixture.cliDir;
  env.TIANGONG_LCA_CLI_CANDIDATE_FILE = fixture.cliCandidateFile;
  env.TIANGONG_LCA_CLI_CANDIDATE_SHA256 = fixture.cliCandidateSha256;
  return env;
}

function subprocess(fixture, script, args, env = subprocessEnv(fixture)) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: fixture.sandboxRoot,
    env,
    encoding: 'utf8',
    shell: false,
  });
  assert.equal(result.error, undefined);
  return result;
}

function assertRejectedBeforeMutation(fixture, message, overrides = {}) {
  let prepared = false;
  let dispatched = false;
  assert.throws(() => runTiangongCommand(['--help'], candidateOptions(fixture, {
    ...overrides,
    buildSpawnImpl: () => { prepared = true; return { status: 0, stdout: '', stderr: '' }; },
    spawnImpl: () => { dispatched = true; return { status: 0, stdout: '', stderr: '' }; },
  })), message);
  assert.equal(prepared, false, 'invalid identity must fail before install or build');
  assert.equal(dispatched, false, 'invalid identity must fail before CLI execution');
}

test('candidate schema fixture has the pinned archive and individual original byte identities', () => {
  assert.equal(sha256(schemaArchive), 'eb482b22869ff594e26b6a0e2974496f2295b895a2cad570bfef53baa370a00d');
  assert.equal(Object.keys(schemaFiles).length, expectedTidasSpecSource.schemas.length);
  for (const schema of expectedTidasSpecSource.schemas) {
    assert.equal(sha256(schemaFiles[schema.name]), schema.sha256, schema.name);
  }
});

test('inspection observes a complete candidate but cannot authorize its invocation', () => withFixture((fixture) => {
  const candidate = fixture.candidate;
  assert.equal(candidate.schema, candidateSchema);
  assert.equal(candidate.cli.repository, 'tiangong-lca/cli');
  assert.equal(candidate.cli.commit, fixture.commit);
  assert.equal(candidate.cli.packageVersion, candidateVersion);
  for (const key of ['sourceSha256', 'packageSha256', 'lockSha256', 'tidasManifestSha256']) {
    assert.match(candidate.cli[key], /^[a-f0-9]{64}$/u, key);
  }
  assert.equal(candidate.cli.packageSha256, sha256(readFileSync(path.join(fixture.cliDir, 'package.json'))));
  assert.equal(candidate.cli.lockSha256, sha256(readFileSync(path.join(fixture.cliDir, 'pnpm-lock.yaml'))));
  assert.equal(candidate.cli.tidasManifestSha256, sha256(readFileSync(path.join(fixture.cliDir, 'assets', 'tidas-spec-source.json'))));
  const trackedFiles = git(fixture.cliDir, ['ls-files', '-z']).split('\0').filter(Boolean).sort();
  assert.equal(candidate.cli.sourceSha256, sha256(JSON.stringify(trackedFiles.map((relativePath) => [
    'file', relativePath, sha256(readFileSync(path.join(fixture.cliDir, ...relativePath.split('/')))),
  ]))));
  assert.deepEqual(candidate.toolchain, { node: expectedNodeVersion, pnpm: expectedPnpmVersion });
  assert.equal(candidate.build.distSha256, sha256(JSON.stringify([
    ['directory', 'src'],
    ['file', 'src/main.js', sha256(readFileSync(path.join(fixture.cliDir, 'dist', 'src', 'main.js')))],
  ])));
  assert.equal(candidate.build.nodeModulesSha256, sha256(JSON.stringify([
    ['file', '.modules.yaml', sha256(readFileSync(path.join(fixture.cliDir, 'node_modules', '.modules.yaml')))],
    ['directory', '.pnpm'],
    ['file', '.pnpm/lock.yaml', sha256(readFileSync(path.join(fixture.cliDir, 'node_modules', '.pnpm', 'lock.yaml')))],
    ['directory', 'fixture-dependency'],
    ['file', 'fixture-dependency/index.js', sha256(readFileSync(path.join(fixture.cliDir, 'node_modules', 'fixture-dependency', 'index.js')))],
  ])));
  assert.throws(() => buildTiangongInvocation(['--help'], { cliDir: fixture.cliDir }), /candidate|expected @tiangong-lca\/cli@0\.1\.24/u);
  assert.throws(() => inspectLocalCliCandidate(fixture.cliDir, supportedToolchain()), /expectedCommit|expected.*commit/u);
  assert.throws(() => inspectLocalCliCandidate(fixture.cliDir, {
    expectedCommit: fixture.commit,
    ...supportedToolchain(),
  }), /expectedVersion|expected.*version/u);
}));

test('a qualified explicit candidate is accepted without changing the published version', () => withFixture((fixture) => {
  const local = invocation(fixture);
  assert.equal(local.mode, 'local');
  assert.equal(local.packageVersion, candidateVersion);
  assert.equal(local.command, process.execPath);
  assert.deepEqual(local.args, [path.join(fixture.cliDir, 'bin', 'tiangong-lca.js'), '--help']);
  const published = buildTiangongInvocation(['--help'], {
    cliCandidateFile: fixture.cliCandidateFile,
    cliCandidateSha256: fixture.cliCandidateSha256,
  });
  assert.equal(published.mode, 'published');
  assert.deepEqual(published.args, ['dlx', '--package=@tiangong-lca/cli@0.1.24', 'tiangong-lca', '--help']);
  let prepared = false;
  const status = runTiangongCommand(['--help'], candidateOptions(fixture, {
    buildSpawnImpl: () => { prepared = true; return { status: 0, stdout: '', stderr: '' }; },
    stdoutWrite: () => {},
  }));
  assert.equal(status, 0);
  assert.equal(prepared, false, 'a built, qualified fixture must not reinstall');
}));

test('a candidate file must be paired with a separately supplied byte digest', () => withFixture((fixture) => {
  assertRejectedBeforeMutation(fixture, /candidate.*sha256|candidate.*digest|candidate.*together|requires.*candidate/iu, { cliCandidateSha256: null });
  assertRejectedBeforeMutation(fixture, /candidate.*file|candidate.*together|requires.*candidate/iu, { cliCandidateFile: null });
  assertRejectedBeforeMutation(fixture, /candidate.*sha256|candidate.*digest|64/iu, { cliCandidateSha256: 'not-a-hash' });
  assertRejectedBeforeMutation(fixture, /candidate.*sha-?256|candidate.*digest|hash.*mismatch/iu, { cliCandidateSha256: '0'.repeat(64) });
}));

test('candidate evidence is anchored to actual file bytes rather than parsed JSON alone', () => withFixture((fixture) => {
  const originalDigest = fixture.cliCandidateSha256;
  writeFileSync(fixture.cliCandidateFile, `${readFileSync(fixture.cliCandidateFile, 'utf8')} \n`);
  assertRejectedBeforeMutation(fixture, /candidate.*sha-?256|candidate.*digest|hash.*mismatch/iu, { cliCandidateSha256: originalDigest });
}));

test('missing or malformed candidate JSON fails closed before preparation', () => withFixture((fixture) => {
  assertRejectedBeforeMutation(fixture, /candidate.*file|candidate.*missing|ENOENT/iu, {
    cliCandidateFile: path.join(fixture.sandboxRoot, 'missing.json'),
  });
  rewriteCandidate(fixture, null, '{ malformed JSON\n');
  assertRejectedBeforeMutation(fixture, /candidate|JSON/iu);
}));

for (const [label, mutate] of [
  ['schema', (candidate) => { candidate.schema = 'unrecognized.v1'; }],
  ['repository', (candidate) => { candidate.cli.repository = 'example/cli'; }],
  ['commit', (candidate) => { candidate.cli.commit = '0'.repeat(40); }],
  ['package version', (candidate) => { candidate.cli.packageVersion = '0.1.26'; }],
  ['source digest', (candidate) => { candidate.cli.sourceSha256 = '0'.repeat(64); }],
  ['package digest', (candidate) => { candidate.cli.packageSha256 = '0'.repeat(64); }],
  ['lock digest', (candidate) => { candidate.cli.lockSha256 = '0'.repeat(64); }],
  ['TIDAS manifest digest', (candidate) => { candidate.cli.tidasManifestSha256 = '0'.repeat(64); }],
  ['dist digest', (candidate) => { candidate.build.distSha256 = '0'.repeat(64); }],
  ['dependency digest', (candidate) => { candidate.build.nodeModulesSha256 = '0'.repeat(64); }],
  ['Node toolchain', (candidate) => { candidate.toolchain.node = '24.18.0'; }],
  ['pnpm toolchain', (candidate) => { candidate.toolchain.pnpm = '11.22.0'; }],
  ['missing build evidence', (candidate) => { delete candidate.build; }],
]) {
  test(`candidate record rejects incorrect ${label} even with a matching external file digest`, () => withFixture((fixture) => {
    const changed = structuredClone(fixture.candidate);
    mutate(changed);
    rewriteCandidate(fixture, changed);
    assertRejectedBeforeMutation(fixture, /candidate|TianGong|toolchain/iu);
  }));
}

test('qualification cannot be transferred to a repository with a different canonical origin', () => withFixture((fixture) => {
  git(fixture.cliDir, ['remote', 'set-url', 'origin', 'https://github.com/example/cli.git']);
  assertRejectedBeforeMutation(fixture, /repository|canonical|origin/iu);
}));

test('a new HEAD invalidates the qualified commit even when all tracked bytes are unchanged', () => withFixture((fixture) => {
  git(fixture.cliDir, ['commit', '--allow-empty', '--quiet', '-m', 'Change candidate commit identity']);
  assert.notEqual(git(fixture.cliDir, ['rev-parse', 'HEAD']), fixture.commit);
  assertRejectedBeforeMutation(fixture, /commit|HEAD|candidate/iu);
}));

for (const relativePath of ['package.json', 'src/main.ts', 'pnpm-lock.yaml']) {
  test(`dirty tracked ${relativePath} invalidates qualification before any install or build`, () => withFixture((fixture) => {
    const filePath = path.join(fixture.cliDir, ...relativePath.split('/'));
    writeFileSync(filePath, `${readFileSync(filePath, 'utf8')}\n`);
    assertRejectedBeforeMutation(fixture, /clean|dirty|source|package|lock|candidate/iu);
  }));
}

test('a staged source mutation is rejected independently of the working-tree diff', () => withFixture((fixture) => {
  write(fixture.cliDir, 'src/main.ts', 'export const fixtureVersion = "unqualified";\n');
  git(fixture.cliDir, ['add', '--', 'src/main.ts']);
  assertRejectedBeforeMutation(fixture, /clean|dirty|source|candidate/iu);
}));

test('untracked source code invalidates the observed clean source identity', () => withFixture((fixture) => {
  write(fixture.cliDir, 'src/unreviewed.ts', 'export const unreviewed = true;\n');
  assertRejectedBeforeMutation(fixture, /clean|dirty|source|candidate/iu);
}));

test('TIDAS validation checks actual schema bytes even at the explicitly expected clean commit', () => withFixture((fixture) => {
  const schemaPath = `assets/tidas-schemas/${expectedTidasSpecSource.schemas[0].name}`;
  write(fixture.cliDir, schemaPath, `${schemaFiles[expectedTidasSpecSource.schemas[0].name]}\n`);
  git(fixture.cliDir, ['add', '--', schemaPath]);
  git(fixture.cliDir, ['commit', '--quiet', '-m', 'Alter schema bytes without changing declared manifest']);
  assert.equal(git(fixture.cliDir, ['status', '--porcelain']), '');
  assert.throws(() => inspectLocalCliCandidate(fixture.cliDir, {
    expectedCommit: git(fixture.cliDir, ['rev-parse', 'HEAD']),
    expectedVersion: candidateVersion,
    ...supportedToolchain(),
  }), /TIDAS schema.*(?:mismatch|differs)/u);
}));

test('dependency links are content-bound inside node_modules and cannot escape it', (t) => withFixture((fixture) => {
  const linkPath = path.join(fixture.cliDir, 'node_modules', 'fixture-alias');
  try {
    symlinkSync(path.join(fixture.cliDir, 'node_modules', 'fixture-dependency'), linkPath, 'junction');
  } catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) {
      // This optional link-specific case is unavailable on restricted Windows
      // hosts; all source, build and dependency byte mutations still run.
      t.skip('Windows host does not permit a dependency directory link');
      return;
    }
    throw error;
  }
  const withLink = inspectLocalCliCandidate(fixture.cliDir, {
    expectedCommit: fixture.commit,
    expectedVersion: candidateVersion,
    ...supportedToolchain(),
  });
  assert.notEqual(withLink.build.nodeModulesSha256, fixture.candidate.build.nodeModulesSha256);
  rewriteCandidate(fixture, withLink);
  assert.equal(invocation(fixture).mode, 'local');
  rmSync(linkPath);
  const external = path.join(fixture.sandboxRoot, 'external dependency');
  mkdirSync(external);
  write(external, 'index.js', 'export const external = true;\n');
  symlinkSync(external, linkPath, 'junction');
  assertRejectedBeforeMutation(fixture, /link escapes|unsupported/u);
}));

test('inspection rejects an installed virtual-store lock from a different source lock', () => withFixture((fixture) => {
  write(fixture.cliDir, 'node_modules/.pnpm/lock.yaml', `${readFileSync(path.join(fixture.cliDir, 'pnpm-lock.yaml'), 'utf8')}\n`);
  assert.throws(() => inspectLocalCliCandidate(fixture.cliDir, {
    expectedCommit: fixture.commit,
    expectedVersion: candidateVersion,
    ...supportedToolchain(),
  }), /lock.*(?:mismatch|differ)|(?:mismatch|differ).*lock/iu);
}));

test('inspection rejects pnpm install-state evidence from a different package manager', () => withFixture((fixture) => {
  write(fixture.cliDir, 'node_modules/.modules.yaml', 'layoutVersion: 5\npackageManager: pnpm@11.22.0\n');
  assert.throws(() => inspectLocalCliCandidate(fixture.cliDir, {
    expectedCommit: fixture.commit,
    expectedVersion: candidateVersion,
    ...supportedToolchain(),
  }), /pnpm|packageManager|modules/iu);
}));

test('the toolchain checker accepts candidate flags and environment evidence and clears them in published mode', () => withFixture((fixture) => {
  const checker = path.join(repoRoot, 'scripts', 'check-toolchain.mjs');
  const fromEnv = subprocess(fixture, checker, []);
  assert.equal(fromEnv.status, 0, fromEnv.stderr);
  assert.match(fromEnv.stdout, /qualification-bound source and build evidence/u);
  const env = subprocessEnv(fixture);
  delete env.TIANGONG_LCA_CLI_DIR;
  delete env.TIANGONG_LCA_CLI_CANDIDATE_FILE;
  delete env.TIANGONG_LCA_CLI_CANDIDATE_SHA256;
  const fromFlags = subprocess(fixture, checker, [
    `--cli-dir=${fixture.cliDir}`,
    '--cli-candidate-file', fixture.cliCandidateFile,
    `--cli-candidate-sha256=${fixture.cliCandidateSha256}`,
  ], env);
  assert.equal(fromFlags.status, 0, fromFlags.stderr);
  const invalidEnv = { ...subprocessEnv(fixture), TIANGONG_LCA_CLI_CANDIDATE_SHA256: '0'.repeat(64) };
  const invalid = subprocess(fixture, checker, [], invalidEnv);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /candidate.*(?:SHA-?256|digest)/iu);
  const published = subprocess(fixture, checker, ['--published-cli'], invalidEnv);
  assert.equal(published.status, 0, published.stderr);
  assert.doesNotMatch(published.stdout, /Validated explicit local/u);
}));

test('the observation command writes new evidence without overwriting independently reviewed files', () => withFixture((fixture) => {
  const observer = path.join(repoRoot, 'scripts', 'inspect-local-cli.mjs');
  const outputFile = path.join(fixture.sandboxRoot, 'observation.json');
  const args = ['--cli-dir', fixture.cliDir, '--expected-commit', fixture.commit,
    '--expected-version', candidateVersion, '--out', outputFile];
  const observed = subprocess(fixture, observer, args);
  assert.equal(observed.status, 0, observed.stderr);
  const summary = JSON.parse(observed.stdout);
  assert.equal(summary.sha256, sha256(readFileSync(outputFile)));
  assert.equal(summary.authorization, 'observation_only_requires_independent_caller_approval');
  assert.deepEqual(JSON.parse(readFileSync(outputFile, 'utf8')), fixture.candidate);
  const before = readFileSync(outputFile);
  const overwrite = subprocess(fixture, observer, args);
  assert.notEqual(overwrite.status, 0);
  assert.deepEqual(readFileSync(outputFile), before);
}));

test('a copied hybrid-search package uses qualification evidence without forwarding runtime flags to CLI argv', () => withFixture((fixture) => {
  const copiedSkill = path.join(fixture.sandboxRoot, 'installed process search');
  cpSync(path.join(repoRoot, 'process-hybrid-search'), copiedSkill, { recursive: true });
  const wrapper = path.join(copiedSkill, 'scripts', 'run-process-hybrid-search.mjs');
  const result = subprocess(fixture, wrapper, ['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['search', 'process', '--help']);
  const env = subprocessEnv(fixture);
  delete env.TIANGONG_LCA_CLI_DIR;
  delete env.TIANGONG_LCA_CLI_CANDIDATE_FILE;
  delete env.TIANGONG_LCA_CLI_CANDIDATE_SHA256;
  const fromFlags = subprocess(fixture, wrapper, [
    '--cli-dir', fixture.cliDir,
    `--cli-candidate-file=${fixture.cliCandidateFile}`,
    '--cli-candidate-sha256', fixture.cliCandidateSha256,
    '--help',
  ], env);
  assert.equal(fromFlags.status, 0, fromFlags.stderr);
  assert.deepEqual(JSON.parse(fromFlags.stdout), ['search', 'process', '--help']);
  const invalid = subprocess(fixture, wrapper, ['--help'], {
    ...subprocessEnv(fixture), TIANGONG_LCA_CLI_CANDIDATE_SHA256: '0'.repeat(64),
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /candidate.*(?:SHA-?256|digest)/iu);
  assert.equal(invalid.stdout, '');
}));

for (const [label, mutate] of [
  ['modified dist output', (fixture) => write(fixture.cliDir, 'dist/src/main.js', 'process.exit(91);\n')],
  ['additional dist output', (fixture) => write(fixture.cliDir, 'dist/src/unqualified.js', 'process.exit(91);\n')],
  ['missing dist entry', (fixture) => rmSync(path.join(fixture.cliDir, 'dist', 'src', 'main.js'))],
  ['modified dependency implementation', (fixture) => write(fixture.cliDir, 'node_modules/fixture-dependency/index.js', 'export const value = "altered";\n')],
  ['modified pnpm install state', (fixture) => write(fixture.cliDir, 'node_modules/.modules.yaml', 'layoutVersion: 999\n')],
  ['missing node_modules', (fixture) => rmSync(path.join(fixture.cliDir, 'node_modules'), { recursive: true })],
  ['missing virtual-store lock', (fixture) => rmSync(path.join(fixture.cliDir, 'node_modules', '.pnpm', 'lock.yaml'))],
]) {
  test(`${label} rejects a previously qualified candidate without trying to repair it`, () => withFixture((fixture) => {
    mutate(fixture);
    assertRejectedBeforeMutation(fixture, /candidate|dist|node_modules|dependency|build|missing|main\.js/iu);
  }));
}

test('candidate execution rejects mismatched Node and pnpm before preparation or dispatch', () => withFixture((fixture) => {
  assertRejectedBeforeMutation(fixture, /Node 24\.19\.0 is required/u, { nodeVersion: '24.18.0' });
  assertRejectedBeforeMutation(fixture, /pnpm 11\.24\.0 is required/u, {
    toolchainSpawnImpl: () => ({ status: 0, stdout: '11.22.0\n', stderr: '' }),
  });
}));

test('prepareLocalCli false does not bypass candidate identity verification', () => withFixture((fixture) => {
  write(fixture.cliDir, 'dist/src/main.js', 'process.exit(91);\n');
  assertRejectedBeforeMutation(fixture, /candidate|dist|build/iu, { prepareLocalCli: false });
}));

test('frozen install failure stops a qualified stale candidate before build and dispatch', () => withFixture((fixture) => {
  utimesSync(path.join(fixture.cliDir, 'src', 'main.ts'), fixedBuildTime, new Date('2020-01-03T00:00:00Z'));
  const calls = [];
  let dispatched = false;
  assert.throws(() => runTiangongCommand(['--help'], candidateOptions(fixture, {
    buildSpawnImpl: (command, args, options) => {
      calls.push({ command, args, cwd: options.cwd, shell: options.shell });
      return { status: 17, stdout: '', stderr: 'fixture frozen install failed' };
    },
    spawnImpl: () => { dispatched = true; return { status: 0, stdout: '', stderr: '' }; },
  })), /frozen install.*17[\s\S]*fixture frozen install failed/u);
  assert.deepEqual(calls, [{
    command: process.platform === 'win32' ? 'pnpm.exe' : 'pnpm',
    args: ['install', '--frozen-lockfile'],
    cwd: fixture.cliDir,
    shell: false,
  }]);
  assert.equal(dispatched, false);
}));

test('build failure stops a qualified stale candidate before dispatch', () => withFixture((fixture) => {
  utimesSync(path.join(fixture.cliDir, 'src', 'main.ts'), fixedBuildTime, new Date('2020-01-03T00:00:00Z'));
  const calls = [];
  let dispatched = false;
  assert.throws(() => runTiangongCommand(['--help'], candidateOptions(fixture, {
    buildSpawnImpl: (_command, args) => {
      calls.push(args);
      return args[0] === 'install'
        ? { status: 0, stdout: '', stderr: '' }
        : { status: 19, stdout: '', stderr: 'fixture build failed' };
    },
    spawnImpl: () => { dispatched = true; return { status: 0, stdout: '', stderr: '' }; },
  })), /build.*19[\s\S]*fixture build failed/u);
  assert.deepEqual(calls, [['install', '--frozen-lockfile'], ['run', 'build']]);
  assert.equal(dispatched, false);
}));

for (const [label, mutate] of [
  ['compiled output', (fixture) => write(fixture.cliDir, 'dist/src/main.js', 'process.exit(91);\n')],
  ['installed dependency', (fixture) => write(fixture.cliDir, 'node_modules/fixture-dependency/index.js', 'export const value = "replaced during install";\n')],
  ['source code', (fixture) => write(fixture.cliDir, 'src/main.ts', 'export const fixtureVersion = "changed during build";\n')],
]) {
  test(`identity drift in ${label} during successful preparation prevents dispatch`, () => withFixture((fixture) => {
    utimesSync(path.join(fixture.cliDir, 'src', 'main.ts'), fixedBuildTime, new Date('2020-01-03T00:00:00Z'));
    const calls = [];
    let dispatched = false;
    assert.throws(() => runTiangongCommand(['--help'], candidateOptions(fixture, {
      buildSpawnImpl: (_command, args) => {
        calls.push(args);
        if (args[0] === 'run') mutate(fixture);
        return { status: 0, stdout: '', stderr: '' };
      },
      spawnImpl: () => { dispatched = true; return { status: 0, stdout: '', stderr: '' }; },
    })), /candidate|clean|dirty|source|dist|dependency|build/iu);
    assert.deepEqual(calls, [['install', '--frozen-lockfile'], ['run', 'build']]);
    assert.equal(dispatched, false);
  }));
}

test('mtime-only preparation preserves the qualified content and dispatches authoritative argv', () => withFixture((fixture) => {
  utimesSync(path.join(fixture.cliDir, 'src', 'main.ts'), fixedBuildTime, new Date('2020-01-03T00:00:00Z'));
  const calls = [];
  let observed;
  const status = runTiangongCommand(['dataset', 'validate', '--input', 'case with spaces.json'], candidateOptions(fixture, {
    buildSpawnImpl: (_command, args, options) => {
      calls.push(args);
      assert.equal(options.shell, false);
      return { status: 0, stdout: '', stderr: '' };
    },
    spawnImpl: (command, args, options) => {
      observed = { command, args, shell: options.shell };
      return { status: 23, stdout: 'exact candidate output\n', stderr: '' };
    },
    stdoutWrite: () => {},
  }));
  assert.equal(status, 23);
  assert.deepEqual(calls, [['install', '--frozen-lockfile'], ['run', 'build']]);
  assert.deepEqual(observed, {
    command: process.execPath,
    args: [path.join(fixture.cliDir, 'bin', 'tiangong-lca.js'), 'dataset', 'validate', '--input', 'case with spaces.json'],
    shell: false,
  });
  assert.equal(existsSync(path.join(fixture.cliDir, 'dist', 'src', 'main.js')), true);
}));
