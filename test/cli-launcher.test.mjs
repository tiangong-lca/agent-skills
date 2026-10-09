import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildTiangongInvocation,
  expectedNodeVersion,
  expectedPnpmVersion,
  expectedTidasSpecSource,
  normalizeCliRuntimeArgs,
  publishedCliCommand,
  publishedCliPackageSpec,
  runTiangongCommand,
  withCliRuntimeEnv,
} from '../scripts/lib/cli-launcher.mjs';

const supportedCliPackage = {
  name: '@tiangong-lca/cli',
  version: '0.1.24',
  packageManager: 'pnpm@11.24.0',
  engines: {
    node: '>=24.19.0 <25',
    pnpm: '11.24.0',
  },
};

const supportedLockfile = "lockfileVersion: '9.0'\nimporters:\n  .:\n";
const fixtureRoot = path.resolve('test-fixtures', 'cli-launcher');

function fixturePath(...segments) {
  return path.join(fixtureRoot, ...segments);
}

function localCliFixture(cliDir, overrides = {}) {
  const packageJson = {
    ...supportedCliPackage,
    ...overrides.packageJson,
  };
  const paths = new Set([
    cliDir,
    path.join(cliDir, 'bin'),
    path.join(cliDir, 'bin', 'tiangong-lca.js'),
    path.join(cliDir, 'package.json'),
    path.join(cliDir, 'pnpm-lock.yaml'),
    path.join(cliDir, 'assets'),
    path.join(cliDir, 'assets', 'tidas-spec-source.json'),
    path.join(cliDir, 'assets', 'tidas-schemas'),
  ]);
  for (const schema of expectedTidasSpecSource.schemas) {
    paths.add(path.join(cliDir, 'assets', 'tidas-schemas', schema.name));
  }

  return {
    pathExists: (candidate) => paths.has(candidate),
    readText: (candidate) => {
      if (candidate === path.join(cliDir, 'package.json')) {
        return JSON.stringify(packageJson);
      }
      if (candidate === path.join(cliDir, 'pnpm-lock.yaml')) {
        return overrides.lockfile ?? supportedLockfile;
      }
      if (candidate === path.join(cliDir, 'assets', 'tidas-spec-source.json')) {
        return JSON.stringify(overrides.sourceManifest ?? expectedTidasSpecSource);
      }
      throw new Error(`Unexpected read: ${candidate}`);
    },
    paths,
  };
}

function passingToolchain() {
  return {
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl: (command, args, options) => {
      assert.equal(command, process.platform === 'win32' ? 'pnpm.exe' : 'pnpm');
      assert.deepEqual(args, ['--version']);
      assert.equal(options.shell, false);
      return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
    },
  };
}

test('local CLI fixture declarations do not hard-code POSIX roots', () => {
  const source = readFileSync(import.meta.filename, 'utf8');
  assert.doesNotMatch(
    source,
    /(?:const cliDir = |'--cli-dir', )['"]\/(?:workspace|tmp)\//u,
  );
});

test('normalizeCliRuntimeArgs defaults to the published CLI even when a sibling exists', () => {
  const repoRoot = fixturePath('tiangong-lca-skills');
  const siblingCliDir = fixturePath('tiangong-cli');
  const { cliDir, args } = normalizeCliRuntimeArgs(['embedding-ft', '--help'], {
    env: {},
    repoRoot,
    pathExists: (candidate) => candidate === siblingCliDir,
  });

  assert.equal(cliDir, null);
  assert.deepEqual(args, ['embedding-ft', '--help']);

  const invocation = buildTiangongInvocation(args, {
    repoRoot,
    pathExists: (candidate) => candidate === siblingCliDir,
  });
  assert.equal(invocation.mode, 'published');
});

test('normalizeCliRuntimeArgs keeps explicit cli-dir overrides above the published default', () => {
  const manualCliDir = fixturePath('manual cli');
  const { cliDir, args } = normalizeCliRuntimeArgs(
    ['--cli-dir', manualCliDir, 'embedding-ft', '--help'],
    {
      repoRoot: fixturePath('tiangong-lca-skills'),
      pathExists: () => true,
    },
  );

  assert.equal(cliDir, manualCliDir);
  assert.deepEqual(args, ['embedding-ft', '--help']);
});

test('normalizeCliRuntimeArgs can explicitly select the published CLI', () => {
  const { cliDir, args } = normalizeCliRuntimeArgs(
    ['--published-cli', 'embedding-ft', '--help'],
    {
      repoRoot: fixturePath('tiangong-lca-skills'),
      pathExists: () => true,
    },
  );

  assert.equal(cliDir, null);
  assert.deepEqual(args, ['embedding-ft', '--help']);

  const invocation = buildTiangongInvocation(args, {
    cliDir,
    repoRoot: fixturePath('tiangong-lca-skills'),
    pathExists: () => true,
  });
  assert.equal(invocation.mode, 'published');
});

test('published CLI selection propagates through nested wrapper environments', () => {
  const oldCliDir = fixturePath('old-cli');
  const exactCliDir = fixturePath('exact-cli');
  const publishedEnv = withCliRuntimeEnv(
    {
      TIANGONG_LCA_CLI_DIR: oldCliDir,
    },
    null,
  );
  assert.equal(publishedEnv.TIANGONG_LCA_CLI_DIR, undefined);
  assert.equal(publishedEnv.TIANGONG_LCA_CLI_MODE, 'published');

  const publishedRuntime = normalizeCliRuntimeArgs(['qa', 'process'], {
    env: publishedEnv,
    repoRoot: fixturePath('skills'),
    pathExists: () => true,
  });
  assert.equal(publishedRuntime.cliDir, null);

  const localEnv = withCliRuntimeEnv(publishedEnv, exactCliDir);
  assert.equal(localEnv.TIANGONG_LCA_CLI_DIR, exactCliDir);
  assert.equal(localEnv.TIANGONG_LCA_CLI_MODE, undefined);
});

test('normalizeCliRuntimeArgs carries an explicit candidate file and external digest outside CLI argv', () => {
  const cliDir = fixturePath('candidate cli');
  const cliCandidateFile = fixturePath('qualification with spaces', 'candidate.json');
  const cliCandidateSha256 = 'a'.repeat(64);
  const runtime = normalizeCliRuntimeArgs([
    '--cli-dir', cliDir,
    '--cli-candidate-file', cliCandidateFile,
    `--cli-candidate-sha256=${cliCandidateSha256}`,
    'qa', 'process', '--input', 'case with spaces.json',
  ], { env: {} });

  assert.deepEqual(runtime, {
    cliDir,
    cliCandidateFile,
    cliCandidateSha256,
    args: ['qa', 'process', '--input', 'case with spaces.json'],
  });

  assert.deepEqual(normalizeCliRuntimeArgs([
    `--cli-dir=${cliDir}`,
    `--cli-candidate-file=${cliCandidateFile}`,
    '--cli-candidate-sha256', cliCandidateSha256,
    '--help',
  ], { env: {} }), {
    cliDir,
    cliCandidateFile,
    cliCandidateSha256,
    args: ['--help'],
  });
});

test('normalizeCliRuntimeArgs inherits candidate evidence only for the selected directory', () => {
  const oldCliDir = fixturePath('old candidate cli');
  const newCliDir = fixturePath('new candidate cli');
  const cliCandidateFile = fixturePath('qualified', 'candidate.json');
  const cliCandidateSha256 = 'b'.repeat(64);
  const env = {
    TIANGONG_LCA_CLI_DIR: oldCliDir,
    TIANGONG_LCA_CLI_CANDIDATE_FILE: cliCandidateFile,
    TIANGONG_LCA_CLI_CANDIDATE_SHA256: cliCandidateSha256,
  };

  assert.deepEqual(normalizeCliRuntimeArgs(['--help'], { env }), {
    cliDir: oldCliDir,
    cliCandidateFile,
    cliCandidateSha256,
    args: ['--help'],
  });
  assert.deepEqual(normalizeCliRuntimeArgs(['--cli-dir', newCliDir, '--help'], { env }), {
    cliDir: newCliDir,
    cliCandidateFile: null,
    cliCandidateSha256: null,
    args: ['--help'],
  });

  for (const rawArgs of [
    ['--cli-dir', newCliDir, '--cli-candidate-file', cliCandidateFile,
      '--cli-candidate-sha256', cliCandidateSha256, '--help'],
    ['--cli-candidate-file', cliCandidateFile, '--cli-candidate-sha256', cliCandidateSha256,
      '--cli-dir', newCliDir, '--help'],
  ]) {
    assert.deepEqual(normalizeCliRuntimeArgs(rawArgs, { env }), {
      cliDir: newCliDir,
      cliCandidateFile,
      cliCandidateSha256,
      args: ['--help'],
    });
  }
});

test('published selection clears inherited and explicit candidate evidence', () => {
  const cliDir = fixturePath('candidate cli');
  const cliCandidateFile = fixturePath('qualified', 'candidate.json');
  const cliCandidateSha256 = 'c'.repeat(64);
  const env = {
    TIANGONG_LCA_CLI_DIR: cliDir,
    TIANGONG_LCA_CLI_CANDIDATE_FILE: cliCandidateFile,
    TIANGONG_LCA_CLI_CANDIDATE_SHA256: cliCandidateSha256,
  };
  assert.deepEqual(normalizeCliRuntimeArgs(['--published-cli', '--help'], { env }), {
    cliDir: null,
    cliCandidateFile: null,
    cliCandidateSha256: null,
    args: ['--help'],
  });
  assert.deepEqual(normalizeCliRuntimeArgs([
    '--cli-candidate-file', cliCandidateFile,
    '--cli-candidate-sha256', cliCandidateSha256,
    '--published-cli', '--help',
  ], { env }), {
    cliDir: null,
    cliCandidateFile: null,
    cliCandidateSha256: null,
    args: ['--help'],
  });
  assert.deepEqual(normalizeCliRuntimeArgs(['--help'], {
    env: { ...env, TIANGONG_LCA_CLI_MODE: 'published' },
  }), {
    cliDir: null,
    cliCandidateFile: null,
    cliCandidateSha256: null,
    args: ['--help'],
  });
});

test('candidate runtime flags require a nonempty value', () => {
  for (const name of ['--cli-candidate-file', '--cli-candidate-sha256']) {
    assert.throws(() => normalizeCliRuntimeArgs([name], { env: {} }), /requires a value/u);
    assert.throws(() => normalizeCliRuntimeArgs([`${name}=`], { env: {} }), /requires a value/u);
    assert.throws(() => normalizeCliRuntimeArgs([name, '--help'], { env: {} }), /requires a value/u);
  }
});

test('candidate qualification propagates through a copied environment and is removed by published mode', () => {
  const cliDir = fixturePath('candidate cli');
  const cliCandidateFile = fixturePath('qualified', 'candidate.json');
  const cliCandidateSha256 = 'd'.repeat(64);
  const baseEnv = {
    PATH: fixturePath('toolchain'),
    TIANGONG_LCA_CLI_DIR: fixturePath('old cli'),
    TIANGONG_LCA_CLI_CANDIDATE_FILE: fixturePath('old candidate.json'),
    TIANGONG_LCA_CLI_CANDIDATE_SHA256: 'e'.repeat(64),
  };
  const original = { ...baseEnv };
  const localEnv = withCliRuntimeEnv(baseEnv, cliDir, {
    cliCandidateFile,
    cliCandidateSha256,
  });
  assert.deepEqual(baseEnv, original);
  assert.equal(localEnv.PATH, baseEnv.PATH);
  assert.equal(localEnv.TIANGONG_LCA_CLI_DIR, cliDir);
  assert.equal(localEnv.TIANGONG_LCA_CLI_CANDIDATE_FILE, cliCandidateFile);
  assert.equal(localEnv.TIANGONG_LCA_CLI_CANDIDATE_SHA256, cliCandidateSha256);
  assert.equal(localEnv.TIANGONG_LCA_CLI_MODE, undefined);
  const publishedEnv = withCliRuntimeEnv(localEnv, null, {
    cliCandidateFile,
    cliCandidateSha256,
  });
  assert.equal(publishedEnv.TIANGONG_LCA_CLI_DIR, undefined);
  assert.equal(publishedEnv.TIANGONG_LCA_CLI_CANDIDATE_FILE, undefined);
  assert.equal(publishedEnv.TIANGONG_LCA_CLI_CANDIDATE_SHA256, undefined);
  assert.equal(publishedEnv.TIANGONG_LCA_CLI_MODE, 'published');
  const unqualifiedEnv = withCliRuntimeEnv(localEnv, fixturePath('different cli'));
  assert.equal(unqualifiedEnv.TIANGONG_LCA_CLI_CANDIDATE_FILE, undefined);
  assert.equal(unqualifiedEnv.TIANGONG_LCA_CLI_CANDIDATE_SHA256, undefined);
  const sameDirWithoutQualification = withCliRuntimeEnv(localEnv, cliDir);
  assert.equal(sameDirWithoutQualification.TIANGONG_LCA_CLI_CANDIDATE_FILE, undefined);
  assert.equal(sameDirWithoutQualification.TIANGONG_LCA_CLI_CANDIDATE_SHA256, undefined);
});

test('buildTiangongInvocation uses exact pnpm dlx argv for the published CLI contract', () => {
  const invocation = buildTiangongInvocation(['qa', 'process', '--help'], {
    repoRoot: fixturePath('tiangong-lca-skills'),
    pathExists: () => false,
  });

  assert.equal(publishedCliPackageSpec, '@tiangong-lca/cli@0.1.24');
  assert.equal(invocation.mode, 'published');
  assert.equal(invocation.command, process.platform === 'win32' ? 'pnpm.exe' : 'pnpm');
  assert.deepEqual(invocation.args, [
    'dlx',
    '--package=@tiangong-lca/cli@0.1.24',
    'tiangong-lca',
    'qa',
    'process',
    '--help',
  ]);
  assert.equal(
    publishedCliCommand,
    'pnpm dlx --package=@tiangong-lca/cli@0.1.24 tiangong-lca',
  );
});

test('buildTiangongInvocation preserves spaces as one authoritative argv value', () => {
  const inputPath = fixturePath('case with spaces', 'rows.jsonl');
  const invocation = buildTiangongInvocation(
    ['dataset', 'validate', '--input', inputPath],
    {
      repoRoot: fixturePath('skills with spaces'),
      pathExists: () => false,
    },
  );

  assert.equal(invocation.args.at(-1), inputPath);
  assert.equal(invocation.args.filter((arg) => arg === inputPath).length, 1);
});

test('buildTiangongInvocation dispatches native pnpm.exe on Windows without changing argv', () => {
  const invocation = buildTiangongInvocation(['qa', 'process', '--help'], {
    platform: 'win32',
  });

  assert.equal(invocation.command, 'pnpm.exe');
  assert.deepEqual(invocation.args.slice(0, 3), [
    'dlx',
    '--package=@tiangong-lca/cli@0.1.24',
    'tiangong-lca',
  ]);
});

test('runTiangongCommand uses native Windows pnpm without a command shell', () => {
  const observed = [];
  const exitCode = runTiangongCommand(['qa', 'process', '--help'], {
    platform: 'win32',
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl: (command, args, options) => {
      observed.push({ phase: 'toolchain', command, args, shell: options.shell });
      return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
    },
    spawnImpl: (command, args, options) => {
      observed.push({ phase: 'run', command, args, shell: options.shell });
      return { status: 0, stdout: '', stderr: '' };
    },
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(observed, [
    {
      phase: 'toolchain',
      command: 'pnpm.exe',
      args: ['--version'],
      shell: false,
    },
    {
      phase: 'run',
      command: 'pnpm.exe',
      args: [
        'dlx',
        '--package=@tiangong-lca/cli@0.1.24',
        'tiangong-lca',
        'qa',
        'process',
        '--help',
      ],
      shell: false,
    },
  ]);
});

test('buildTiangongInvocation accepts an exact supported local CLI checkout', () => {
  const cliDir = fixturePath('tiangong cli');
  const fixture = localCliFixture(cliDir);
  const invocation = buildTiangongInvocation(['qa', 'process', '--help'], {
    cliDir,
    ...fixture,
  });

  assert.equal(invocation.mode, 'local');
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [
    path.join(cliDir, 'bin', 'tiangong-lca.js'),
    'qa',
    'process',
    '--help',
  ]);
  assert.equal(invocation.packageVersion, '0.1.24');
  assert.deepEqual(invocation.tidasSpecSource, expectedTidasSpecSource);
  assert.equal(invocation.packageManifestPath, path.join(cliDir, 'package.json'));
  assert.equal(invocation.lockfilePath, path.join(cliDir, 'pnpm-lock.yaml'));
  assert.equal(path.isAbsolute(invocation.cliDir), true);
  assert.equal(invocation.cliDir, path.resolve(cliDir));
  if (process.platform === 'win32') {
    assert.match(invocation.cliDir, /^[A-Za-z]:\\/u);
    assert.doesNotMatch(invocation.cliDir, /\//u);
  } else {
    assert.match(invocation.cliDir, /^\//u);
  }
});

test('buildTiangongInvocation fails closed when local CLI package evidence is missing', () => {
  const cliDir = fixturePath('tiangong-lca-cli-missing');
  const fixture = localCliFixture(cliDir);
  fixture.paths.delete(path.join(cliDir, 'pnpm-lock.yaml'));

  assert.throws(
    () =>
      buildTiangongInvocation(['--help'], {
        cliDir,
        ...fixture,
      }),
    /requires pnpm-lock\.yaml/u,
  );
});

test('buildTiangongInvocation fails closed on mismatched local CLI package state', () => {
  const cliDir = fixturePath('tiangong-lca-cli-mismatch');
  const fixture = localCliFixture(cliDir, {
    packageJson: {
      version: '0.1.2',
    },
  });

  assert.throws(
    () =>
      buildTiangongInvocation(['--help'], {
        cliDir,
        ...fixture,
      }),
    /expected @tiangong-lca\/cli@0\.1\.24/u,
  );
});

test('buildTiangongInvocation fails closed on stale TIDAS source identity', () => {
  const cliDir = fixturePath('tiangong-lca-cli-stale-source');
  const staleSource = {
    ...expectedTidasSpecSource,
    source_commit: '0000000000000000000000000000000000000000',
  };
  const fixture = localCliFixture(cliDir, { sourceManifest: staleSource });

  assert.throws(
    () => buildTiangongInvocation(['--help'], { cliDir, ...fixture }),
    /TIDAS source manifest mismatch/u,
  );
});

test('runTiangongCommand preserves exact exit, stdout, and stderr and forbids shell execution', () => {
  let stdout = '';
  let stderr = '';
  let observedOptions;
  const inputPath = fixturePath('case with spaces', 'rows.jsonl');
  const exitCode = runTiangongCommand(
    ['dataset', 'validate', '--input', inputPath],
    {
      repoRoot: fixturePath('skills'),
      pathExists: () => false,
      ...passingToolchain(),
      spawnOptions: { shell: true },
      spawnImpl: (_command, _args, options) => {
        observedOptions = options;
        return {
          status: 23,
          stdout: 'exact stdout\n',
          stderr: 'exact stderr\n',
        };
      },
      stdoutWrite: (text) => {
        stdout += text;
      },
      stderrWrite: (text) => {
        stderr += text;
      },
    },
  );

  assert.equal(exitCode, 23);
  assert.equal(stdout, 'exact stdout\n');
  assert.equal(stderr, 'exact stderr\n');
  assert.equal(observedOptions.shell, false);
});

test('runTiangongCommand preserves a successful no-output result', () => {
  let stderr = '';
  const exitCode = runTiangongCommand(['qa', 'process', '--help'], {
    repoRoot: fixturePath('tiangong-lca-skills'),
    pathExists: () => false,
    ...passingToolchain(),
    spawnImpl: () => ({ status: 0, stdout: '', stderr: '' }),
    stderrWrite: (text) => {
      stderr += text;
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr, '');
});

test('runTiangongCommand rejects a mismatched pnpm runtime before CLI dispatch', () => {
  let dispatched = false;

  assert.throws(
    () =>
      runTiangongCommand(['--help'], {
        repoRoot: fixturePath('skills'),
        pathExists: () => false,
        nodeVersion: expectedNodeVersion,
        toolchainSpawnImpl: () => ({ status: 0, stdout: '11.22.0\n', stderr: '' }),
        spawnImpl: () => {
          dispatched = true;
          return { status: 0, stdout: '', stderr: '' };
        },
      }),
    /pnpm 11\.24\.0 is required/u,
  );
  assert.equal(dispatched, false);
});

test('runTiangongCommand caches one successful toolchain verification per process', () => {
  let verificationCount = 0;
  let dispatchCount = 0;
  const toolchainSpawnImpl = () => {
    verificationCount += 1;
    return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
  };
  const options = {
    repoRoot: fixturePath('skills'),
    pathExists: () => false,
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl,
    spawnImpl: () => {
      dispatchCount += 1;
      return { status: 0, stdout: '', stderr: '' };
    },
  };

  assert.equal(runTiangongCommand(['--help'], options), 0);
  assert.equal(runTiangongCommand(['--help'], options), 0);
  assert.equal(verificationCount, 1);
  assert.equal(dispatchCount, 2);
});

test('runTiangongCommand revalidates pnpm when the execution PATH changes', () => {
  let verificationCount = 0;
  const toolchainOnePath = fixturePath('toolchain', 'one');
  const toolchainTwoPath = fixturePath('toolchain', 'two');
  const toolchainSpawnImpl = (_command, _args, options) => {
    verificationCount += 1;
    assert.equal(
      new Set([toolchainOnePath, toolchainTwoPath]).has(options.env.PATH),
      true,
    );
    return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
  };
  const shared = {
    repoRoot: fixturePath('skills'),
    pathExists: () => false,
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl,
    spawnImpl: () => ({ status: 0, stdout: '', stderr: '' }),
  };

  assert.equal(
    runTiangongCommand(['--help'], {
      ...shared,
      spawnOptions: { env: { PATH: toolchainOnePath } },
    }),
    0,
  );
  assert.equal(
    runTiangongCommand(['--help'], {
      ...shared,
      spawnOptions: { env: { PATH: toolchainTwoPath } },
    }),
    0,
  );
  assert.equal(verificationCount, 2);
});

test('runTiangongCommand installs from the frozen local lockfile before rebuilding a stale CLI', () => {
  const cliDir = fixturePath('tiangong-lca-cli-stale');
  const fixture = localCliFixture(cliDir);
  for (const entry of [
    path.join(cliDir, 'dist', 'src', 'main.js'),
    path.join(cliDir, 'src'),
    path.join(cliDir, 'src', 'cli.ts'),
    path.join(cliDir, 'tsconfig.build.json'),
    path.join(cliDir, 'node_modules', '.modules.yaml'),
  ]) {
    fixture.paths.add(entry);
  }
  const directories = new Set([
    cliDir,
    path.join(cliDir, 'bin'),
    path.join(cliDir, 'src'),
  ]);
  const mtimes = new Map([
    [path.join(cliDir, 'dist', 'src', 'main.js'), 10],
    [path.join(cliDir, 'src'), 20],
    [path.join(cliDir, 'src', 'cli.ts'), 20],
    [path.join(cliDir, 'bin', 'tiangong-lca.js'), 5],
    [path.join(cliDir, 'package.json'), 5],
    [path.join(cliDir, 'pnpm-lock.yaml'), 5],
    [path.join(cliDir, 'tsconfig.build.json'), 5],
    [path.join(cliDir, 'node_modules', '.modules.yaml'), 5],
  ]);
  const preparationCalls = [];
  const runCalls = [];

  const exitCode = runTiangongCommand(['process', 'save-draft', '--help'], {
    cliDir,
    ...fixture,
    ...passingToolchain(),
    readDir: (candidate) => (candidate === path.join(cliDir, 'src') ? ['cli.ts'] : []),
    statPath: (candidate) => ({
      mtimeMs: mtimes.get(candidate) ?? 1,
      isDirectory: () => directories.has(candidate),
    }),
    buildSpawnImpl: (command, args, options) => {
      preparationCalls.push({ command, args, cwd: options.cwd, shell: options.shell });
      return { status: 0, stdout: '', stderr: '' };
    },
    spawnImpl: (command, args, options) => {
      runCalls.push({ command, args, shell: options.shell });
      return { status: 0, stdout: 'process save-draft help', stderr: '' };
    },
    stdoutWrite: () => {},
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(preparationCalls, [
    {
      command: process.platform === 'win32' ? 'pnpm.exe' : 'pnpm',
      args: ['install', '--frozen-lockfile'],
      cwd: cliDir,
      shell: false,
    },
    {
      command: process.platform === 'win32' ? 'pnpm.exe' : 'pnpm',
      args: ['run', 'build'],
      cwd: cliDir,
      shell: false,
    },
  ]);
  assert.equal(runCalls.length, 1);
  assert.equal(runCalls[0].command, process.execPath);
  assert.deepEqual(runCalls[0].args, [
    path.join(cliDir, 'bin', 'tiangong-lca.js'),
    'process',
    'save-draft',
    '--help',
  ]);
  assert.equal(runCalls[0].shell, false);
});
