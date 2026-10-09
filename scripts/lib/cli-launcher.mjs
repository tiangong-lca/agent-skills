import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const expectedNodeVersion = '24.19.0';
export const expectedPnpmVersion = '11.24.0';
export const publishedCliPackageSpec = '@tiangong-lca/cli@0.1.24';
export const publishedCliCommand = `pnpm dlx --package=${publishedCliPackageSpec} tiangong-lca`;

const expectedCliPackageName = '@tiangong-lca/cli';
const expectedCliPackageVersion = '0.1.24';
const expectedCliPackageManager = `pnpm@${expectedPnpmVersion}`;
const expectedCliNodeEngine = '>=24.19.0 <25';
export const expectedTidasSpecSource = Object.freeze({
  schema: 'tiangong-lca.cli-tidas-spec-source.v1',
  spec_repository: 'tiangong-lca/tidas-spec',
  spec_commit: 'f118660dbcbfbf736be74837cce0bf26cd177245',
  spec_version: '0.2.3',
  source_repository: 'https://github.com/tiangong-lca/tidas-toolkit',
  source_commit: '9c0d8b1c8ceb1841074f5bc6de5fbb7fcc9318f5',
  manifest_sha256: '5b69ab859e26a253dc51c6aeee68c971d727b1f8db44128143795113fe3eee6a',
  schemas: Object.freeze([
    ['tidas_contacts.json', 'f16868bcdb99b4785b03a9b36dfe103d8f3ec61a463be9274d22884e6b7d8bda'],
    ['tidas_contacts_category.json', '2d043a6686320b5fec5d4012dfd03bdb57897375002b25fc6a64df8ea10092b5'],
    ['tidas_data_types.json', 'd9e7fa47e2dd2a665332dc50b1d3b3fc03bba1ae2ab80b07bd52ed01471b1b81'],
    ['tidas_flowproperties.json', 'bfc56348c4be7d8e20faebf197680b6a38c9e9b91812382710c6ab205f218432'],
    ['tidas_flowproperties_category.json', '0fd7f4b2e350532ba5809019a079f8fadb90f91702358c1ff7deea19c956a846'],
    ['tidas_flows.json', 'e773b188271174f834dba5ab410644b9e246385c8005fb6d02e4c7a0a073d283'],
    ['tidas_flows_elementary_category.json', 'e817d6e40dfa7b21cb947548027f32b393d1b06ee2a7326f7c59686a2cd3552d'],
    ['tidas_flows_product_category.json', 'e62e1f676dedaeb6028b05f0c1cc84f53c1c47058ae6e17897f77b2cb17b7cb2'],
    ['tidas_lciamethods.json', 'ccaee6c3f1ee48712b6280df07e973c9b8225d95b78dd441566ffcc4a2f9561e'],
    ['tidas_lciamethods_category.json', '83b4bbfb53a2ad1cb1f9c97c261cc867ea6f509020a8ea9041ffba08601eaac9'],
    ['tidas_lifecyclemodels.json', 'd3355d3c7910efadbee87fe36dacd6ca515c8fe1c5671f6dee2ba63d43c5d108'],
    ['tidas_locations_category.json', '415fe8c7ba4991a88bc66d9cd55541ee27b74f731541c64a9bc354679d109a71'],
    ['tidas_processes.json', '5fc2870b2b50c652d9f43c88f2297aeab55f0cf4177fe924007d2bedacd846ab'],
    ['tidas_processes_category.json', 'cea1b97b46fd9faa2f7f4d7b911ff19f24a1655ff98b488ebaf5cc9ee6fdec64'],
    ['tidas_sources.json', '2f37df9004a05ed83f8c708b7edc5f482ec1f848c050fd9f54e1aad49687dd5d'],
    ['tidas_sources_category.json', 'dc22fa07e7a2b4742133ea642505b6a18011552459b84764908166d1994c985f'],
    ['tidas_unitgroups.json', 'd83ada361908ffc047d38ded3aa15be748c7d3421dc294f34c5afbcc6a58f127'],
    ['tidas_unitgroups_category.json', 'c490544c405ee6ef06e52e121f29994d112040a3f4888541fa69569c998d8b72'],
  ].map(([name, sha256]) => Object.freeze({ name, sha256 }))),
});
const verifiedToolchainsBySpawn = new WeakMap();
export const localCliCandidateSchema = 'tiangong-lca.skills-local-cli-candidate.v1';
const candidateFileEnv = 'TIANGONG_LCA_CLI_CANDIDATE_FILE';
const candidateHashEnv = 'TIANGONG_LCA_CLI_CANDIDATE_SHA256';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function candidateError(message) {
  throw new Error(`Local TianGong CLI candidate qualification: ${message}`);
}

function fileDigest(filePath) {
  let stat;
  try { stat = lstatSync(filePath); } catch (error) {
    if (error.code === 'ENOENT') candidateError(`required prepared file is missing: ${filePath}; prepare an isolated candidate and review fresh qualification evidence`);
    throw error;
  }
  if (!stat.isFile()) {
    candidateError(`expected a regular file at ${filePath}`);
  }
  return sha256(readFileSync(filePath));
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function treeDigest(root, allowLinks = false) {
  if (!lstatSync(root).isDirectory()) {
    candidateError(`expected a prepared directory at ${root}`);
  }
  const canonicalRoot = realpathSync.native(root);
  const entries = [];
  function visit(directory, prefix) {
    for (const name of readdirSync(directory).sort()) {
      const entryPath = path.join(directory, name);
      const relative = prefix ? `${prefix}/${name}` : name;
      const stat = lstatSync(entryPath);
      if (stat.isSymbolicLink()) {
        if (!allowLinks || !inside(canonicalRoot, realpathSync.native(entryPath))) {
          candidateError(`link escapes the qualified tree or is unsupported: ${entryPath}`);
        }
        entries.push(['symlink', relative, readlinkSync(entryPath)]);
      } else if (stat.isDirectory()) {
        entries.push(['directory', relative]);
        visit(entryPath, relative);
      } else if (stat.isFile()) {
        entries.push(['file', relative, fileDigest(entryPath)]);
      } else {
        candidateError(`unsupported filesystem entry: ${entryPath}`);
      }
    }
  }
  visit(root, '');
  return sha256(JSON.stringify(entries));
}

function candidateGit(cliDir, args, options) {
  const env = Object.fromEntries(Object.entries(options.spawnOptions?.env ?? process.env)
    .filter(([key]) => !/^GIT_/iu.test(key)));
  const result = (options.sourceSpawnImpl ?? spawnSync)('git', ['-C', cliDir, ...args], {
    env, encoding: 'utf8', shell: false, stdio: 'pipe', maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    candidateError(`cannot inspect selected source with git ${args[0]}: ${result.error?.message ?? result.stderr?.trim()}`);
  }
  return result.stdout;
}

function inspectCandidateSource(cliDir, options) {
  // Git resolves filesystem aliases natively; the JS realpath can retain case
  // aliases on case-insensitive filesystems and falsely reject the same root.
  if (realpathSync.native(candidateGit(cliDir, ['rev-parse', '--show-toplevel'], options).trim()) !== realpathSync.native(cliDir)) {
    candidateError('--cli-dir must be the selected CLI checkout root');
  }
  const remote = candidateGit(cliDir, ['remote', 'get-url', 'origin'], options).trim();
  if (!['https://github.com/tiangong-lca/cli.git', 'https://github.com/tiangong-lca/cli',
    'git@github.com:tiangong-lca/cli.git', 'ssh://git@github.com/tiangong-lca/cli.git'].includes(remote)) {
    candidateError('selected source origin must identify canonical tiangong-lca/cli');
  }
  const commit = candidateGit(cliDir, ['rev-parse', 'HEAD'], options).trim();
  if (candidateGit(cliDir, ['status', '--porcelain=v1', '--untracked-files=all'], options).trim()) {
    candidateError('selected source must be clean; preserve edits and qualify a separate committed checkout');
  }
  const files = candidateGit(cliDir, ['ls-files', '-z'], options).split('\0').filter(Boolean).sort();
  const entries = files.map((relative) => {
    const filePath = path.resolve(cliDir, relative);
    if (!inside(cliDir, filePath)) candidateError('tracked source path escapes the checkout');
    return ['file', relative, fileDigest(filePath)];
  });
  return { commit, sourceSha256: sha256(JSON.stringify(entries)) };
}

function readCandidateQualification(options) {
  const file = options.cliCandidateFile;
  const digest = options.cliCandidateSha256;
  if (!file && !digest) return null;
  if (!file || !/^[a-f0-9]{64}$/u.test(digest ?? '')) {
    candidateError('provide both --cli-candidate-file and --cli-candidate-sha256 from the approved caller evidence');
  }
  const filePath = path.resolve(file);
  const bytes = readFileSync(filePath);
  if (sha256(bytes) !== digest) candidateError('qualification file SHA256 digest mismatch with the caller expectation');
  let record;
  try { record = JSON.parse(bytes.toString('utf8')); } catch {
    candidateError('qualification file must contain JSON');
  }
  if (record?.schema !== localCliCandidateSchema || record.cli?.repository !== 'tiangong-lca/cli' ||
    !/^[a-f0-9]{40}$/u.test(record.cli?.commit ?? '') ||
    !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/u.test(record.cli?.packageVersion ?? '') ||
    record.toolchain?.node !== expectedNodeVersion || record.toolchain?.pnpm !== expectedPnpmVersion) {
    candidateError('unsupported qualification schema, repository, commit, package or toolchain');
  }
  for (const value of [record.cli.sourceSha256, record.cli.packageSha256, record.cli.lockSha256,
    record.cli.tidasManifestSha256, record.build?.distSha256, record.build?.nodeModulesSha256]) {
    if (!/^[a-f0-9]{64}$/u.test(value ?? '')) candidateError('qualification requires exact source, lock, asset, dependency and build digests');
  }
  return { filePath, sha256: digest, record };
}

// Observation only: callers must independently approve the expected commit/version
// and bind the returned file digest. This helper grants no data or execution authority.
export function inspectLocalCliCandidate(cliDir, options = {}) {
  const directory = normalizeCliDir(cliDir);
  if (!directory || !/^[a-f0-9]{40}$/u.test(options.expectedCommit ?? '') || !options.expectedVersion) {
    candidateError('inspection requires --cli-dir and independently supplied expected commit and version');
  }
  assertSupportedToolchain(options);
  const evidence = readLocalCliPackageEvidence(directory, options, options.expectedVersion);
  const source = inspectCandidateSource(directory, options);
  if (source.commit !== options.expectedCommit) candidateError('source HEAD differs from the expected commit');
  const manifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
  if (manifest.repository?.url !== 'git+https://github.com/tiangong-lca/cli.git') {
    candidateError('package repository must identify canonical tiangong-lca/cli');
  }
  for (const schema of expectedTidasSpecSource.schemas) {
    if (fileDigest(path.join(directory, 'assets', 'tidas-schemas', schema.name)) !== schema.sha256) {
      candidateError(`TIDAS schema SHA256 content mismatch with the pinned source: ${schema.name}`);
    }
  }
  for (const relative of ['dist/src/main.js', 'node_modules/.modules.yaml', 'node_modules/.pnpm/lock.yaml']) {
    fileDigest(path.join(directory, ...relative.split('/')));
  }
  if (fileDigest(path.join(directory, 'node_modules', '.pnpm', 'lock.yaml')) !== fileDigest(evidence.lockfilePath)) {
    candidateError('installed pnpm lock digest differs from the source frozen lock');
  }
  const modulesState = readFileSync(path.join(directory, 'node_modules', '.modules.yaml'), 'utf8');
  const installedManager = /["']?packageManager["']?\s*:\s*["']?([^"'\s,]+)["']?/u.exec(modulesState)?.[1];
  if (installedManager !== expectedCliPackageManager) {
    candidateError(`installed dependency state must identify ${expectedCliPackageManager}`);
  }
  return {
    schema: localCliCandidateSchema,
    cli: { repository: 'tiangong-lca/cli', ...source, packageVersion: evidence.packageVersion,
      packageSha256: fileDigest(evidence.packageManifestPath), lockSha256: fileDigest(evidence.lockfilePath),
      tidasManifestSha256: fileDigest(evidence.sourceManifestPath) },
    toolchain: { node: expectedNodeVersion, pnpm: expectedPnpmVersion },
    build: { distSha256: treeDigest(path.join(directory, 'dist')),
      nodeModulesSha256: treeDigest(path.join(directory, 'node_modules'), true) },
  };
}

function assertLocalCliCandidate(cliDir, qualification, options) {
  const actual = inspectLocalCliCandidate(cliDir, { ...options,
    expectedCommit: qualification.record.cli.commit,
    expectedVersion: qualification.record.cli.packageVersion });
  for (const section of ['cli', 'toolchain', 'build']) {
    for (const [key, expected] of Object.entries(actual[section])) {
      if (qualification.record[section][key] !== expected) {
        candidateError(`${section}.${key} differs from approved evidence; restore the qualified candidate or review new evidence before selecting it`);
      }
    }
  }
}

function normalizeCliDir(cliDir) {
  const trimmed = cliDir?.trim();
  return trimmed ? path.resolve(trimmed) : null;
}

function sourceManifestShape(manifest) {
  return {
    schema: manifest?.schema,
    spec_repository: manifest?.spec_repository,
    spec_commit: manifest?.spec_commit,
    spec_version: manifest?.spec_version,
    source_repository: manifest?.source_repository,
    source_commit: manifest?.source_commit,
    manifest_sha256: manifest?.manifest_sha256,
    schemas: Array.isArray(manifest?.schemas)
      ? manifest.schemas.map((entry) => ({ name: entry?.name, sha256: entry?.sha256 }))
      : manifest?.schemas,
  };
}

export function assertTidasSpecSourceManifest(manifest) {
  if (JSON.stringify(sourceManifestShape(manifest)) !== JSON.stringify(expectedTidasSpecSource)) {
    throw new Error(
      'Local TianGong CLI TIDAS source manifest mismatch: expected the published 0.1.24 source-bound identity.',
    );
  }
  return manifest;
}

function readLocalTidasSpecSource(cliDir, options) {
  const pathExists = options.pathExists ?? existsSync;
  const readText = options.readText ?? ((filePath) => readFileSync(filePath, 'utf8'));
  const sourceManifestPath = path.join(cliDir, 'assets', 'tidas-spec-source.json');
  if (!pathExists(sourceManifestPath)) {
    throw new Error(`Local TianGong CLI requires source manifest: ${sourceManifestPath}`);
  }

  let sourceManifest;
  try {
    sourceManifest = JSON.parse(readText(sourceManifestPath));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot parse local TianGong CLI source manifest: ${detail}`);
  }
  assertTidasSpecSourceManifest(sourceManifest);
  const schemaRoot = path.join(cliDir, 'assets', 'tidas-schemas');
  for (const schema of expectedTidasSpecSource.schemas) {
    const schemaPath = path.join(schemaRoot, schema.name);
    if (!pathExists(schemaPath)) {
      throw new Error(`Local TianGong CLI source manifest schema is missing: ${schemaPath}`);
    }
  }
  return { sourceManifestPath, tidasSpecSource: sourceManifest };
}

function resolvePnpmCommand(platform = process.platform) {
  return platform === 'win32' ? 'pnpm.exe' : 'pnpm';
}

export function normalizeCliRuntimeArgs(rawArgs, options = {}) {
  const env = options.env ?? process.env;
  let cliDir =
    env.TIANGONG_LCA_CLI_MODE === 'published'
      ? null
      : normalizeCliDir(env.TIANGONG_LCA_CLI_DIR);
  const envCliDir = cliDir;
  let cliCandidateFile = cliDir ? normalizeCliDir(env[candidateFileEnv]) : null;
  let cliCandidateSha256 = cliDir ? env[candidateHashEnv]?.trim() || null : null;
  let explicitCandidateFile = false;
  let explicitCandidateHash = false;
  let explicitPublished = env.TIANGONG_LCA_CLI_MODE === 'published';
  const args = [];

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === '--cli-dir') {
      if (index + 1 >= rawArgs.length || !rawArgs[index + 1]?.trim() || rawArgs[index + 1].startsWith('--')) {
        throw new Error('--cli-dir requires a value');
      }
      cliDir = normalizeCliDir(rawArgs[index + 1]);
      explicitPublished = false;
      index += 1;
      continue;
    }

    if (arg.startsWith('--cli-dir=')) {
      cliDir = normalizeCliDir(arg.slice('--cli-dir='.length));
      if (!cliDir) throw new Error('--cli-dir requires a value');
      explicitPublished = false;
      continue;
    }

    if (arg === '--published-cli') {
      cliDir = null;
      cliCandidateFile = null;
      cliCandidateSha256 = null;
      explicitCandidateFile = false;
      explicitCandidateHash = false;
      explicitPublished = true;
      continue;
    }

    const candidateFlags = [
      ['--cli-candidate-file', 'file'],
      ['--cli-candidate-sha256', 'hash'],
    ];
    let handled = false;
    for (const [flag, kind] of candidateFlags) {
      if (arg !== flag && !arg.startsWith(`${flag}=`)) continue;
      const value = arg === flag ? rawArgs[++index] : arg.slice(flag.length + 1);
      if (!value?.trim() || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      if (kind === 'file') {
        cliCandidateFile = normalizeCliDir(value);
        explicitCandidateFile = true;
      } else {
        cliCandidateSha256 = value.trim();
        explicitCandidateHash = true;
      }
      handled = true;
      break;
    }
    if (handled) continue;

    args.push(arg);
  }

  if (cliDir !== envCliDir) {
    if (!explicitCandidateFile) cliCandidateFile = null;
    if (!explicitCandidateHash) cliCandidateSha256 = null;
  }
  if (!cliDir) {
    if (!explicitPublished && (explicitCandidateFile || explicitCandidateHash)) {
      candidateError('candidate qualification requires an explicit --cli-dir selection');
    }
    cliCandidateFile = null;
    cliCandidateSha256 = null;
  } else if ((cliCandidateFile || cliCandidateSha256) &&
    (!cliCandidateFile || !/^[a-f0-9]{64}$/u.test(cliCandidateSha256 ?? ''))) {
    candidateError('provide both --cli-candidate-file and --cli-candidate-sha256');
  }
  return {
    cliDir,
    args,
    cliCandidateFile,
    cliCandidateSha256,
  };
}

function readLocalCliPackageEvidence(cliDir, options, expectedVersion = expectedCliPackageVersion) {
  const pathExists = options.pathExists ?? existsSync;
  const readText = options.readText ?? ((filePath) => readFileSync(filePath, 'utf8'));
  const packageManifestPath = path.join(cliDir, 'package.json');
  const lockfilePath = path.join(cliDir, 'pnpm-lock.yaml');

  if (!pathExists(packageManifestPath)) {
    throw new Error(`Local TianGong CLI requires package.json: ${packageManifestPath}`);
  }
  if (!pathExists(lockfilePath)) {
    throw new Error(`Local TianGong CLI requires pnpm-lock.yaml: ${lockfilePath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readText(packageManifestPath));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot parse local TianGong CLI package.json: ${detail}`);
  }

  if (
    !manifest ||
    typeof manifest !== 'object' ||
    manifest.name !== expectedCliPackageName ||
    manifest.version !== expectedVersion
  ) {
    throw new Error(
      `Local TianGong CLI package mismatch: expected ${expectedCliPackageName}@${expectedVersion}. A different local candidate requires --cli-candidate-file and --cli-candidate-sha256 from approved caller evidence.`,
    );
  }
  if (manifest.packageManager !== expectedCliPackageManager) {
    throw new Error(
      `Local TianGong CLI packageManager mismatch: expected ${expectedCliPackageManager}.`,
    );
  }
  if (
    !manifest.engines ||
    manifest.engines.node !== expectedCliNodeEngine ||
    manifest.engines.pnpm !== expectedPnpmVersion
  ) {
    throw new Error(
      `Local TianGong CLI engine mismatch: expected Node ${expectedCliNodeEngine} and pnpm ${expectedPnpmVersion}.`,
    );
  }

  const lockfile = readText(lockfilePath);
  if (
    !/^lockfileVersion:\s*['"]?9\.0['"]?\s*$/mu.test(lockfile) ||
    !/^importers:\s*$/mu.test(lockfile)
  ) {
    throw new Error(`Local TianGong CLI pnpm lockfile is not a supported frozen v9 lock: ${lockfilePath}`);
  }

  const sourceEvidence = readLocalTidasSpecSource(cliDir, options);

  return {
    packageManifestPath,
    lockfilePath,
    packageVersion: manifest.version,
    ...sourceEvidence,
  };
}

export function buildTiangongInvocation(tiangongArgs, options = {}) {
  const pathExists = options.pathExists ?? existsSync;
  const cliDir = normalizeCliDir(options.cliDir);

  if (cliDir) {
    const candidateQualification = readCandidateQualification(options);
    const cliBin = path.join(cliDir, 'bin', 'tiangong-lca.js');
    if (!pathExists(cliBin)) {
      throw new Error(
        `Cannot find TianGong CLI at ${cliBin}. Set TIANGONG_LCA_CLI_DIR or pass --cli-dir.`,
      );
    }
    const packageEvidence = readLocalCliPackageEvidence(cliDir, options,
      candidateQualification?.record.cli.packageVersion);
    if (candidateQualification) assertLocalCliCandidate(cliDir, candidateQualification, options);

    return {
      mode: 'local',
      command: process.execPath,
      args: [cliBin, ...tiangongArgs],
      cliDir,
      cliBin,
      ...packageEvidence,
      candidateQualification,
    };
  }

  return {
    mode: 'published',
    command: resolvePnpmCommand(options.platform),
    args: ['dlx', `--package=${publishedCliPackageSpec}`, 'tiangong-lca', ...tiangongArgs],
    packageSpec: publishedCliPackageSpec,
  };
}

function newestMtimeMs(targetPath, options) {
  const pathExists = options.pathExists ?? existsSync;
  const readDir = options.readDir ?? readdirSync;
  const statPath = options.statPath ?? statSync;

  if (!pathExists(targetPath)) {
    return null;
  }

  const stat = statPath(targetPath);
  if (!stat.isDirectory()) {
    return stat.mtimeMs;
  }

  let newest = stat.mtimeMs;
  for (const child of readDir(targetPath)) {
    const childMtime = newestMtimeMs(path.join(targetPath, child), options);
    if (typeof childMtime === 'number' && childMtime > newest) {
      newest = childMtime;
    }
  }
  return newest;
}

function localCliNeedsBuild(invocation, options) {
  const pathExists = options.pathExists ?? existsSync;
  const statPath = options.statPath ?? statSync;
  const entryPath = path.join(invocation.cliDir, 'dist', 'src', 'main.js');
  const modulesStatePath = path.join(invocation.cliDir, 'node_modules', '.modules.yaml');
  if (!pathExists(entryPath) || !pathExists(modulesStatePath)) {
    return true;
  }

  const builtAt = statPath(entryPath).mtimeMs;
  const sourcePaths = [
    path.join(invocation.cliDir, 'src'),
    invocation.cliBin,
    invocation.packageManifestPath,
    invocation.lockfilePath,
    path.join(invocation.cliDir, 'tsconfig.build.json'),
  ];

  return sourcePaths.some((sourcePath) => {
    const sourceMtime = newestMtimeMs(sourcePath, options);
    return typeof sourceMtime === 'number' && sourceMtime > builtAt;
  });
}

export function assertSupportedToolchain(options = {}) {
  const nodeVersion = String(options.nodeVersion ?? process.versions.node).replace(/^v/u, '');
  if (nodeVersion !== expectedNodeVersion) {
    throw new Error(`Node ${expectedNodeVersion} is required; received ${nodeVersion}.`);
  }

  const pnpmCommand = resolvePnpmCommand(options.platform);
  const spawnImpl = options.toolchainSpawnImpl ?? spawnSync;
  const executionEnv = options.spawnOptions?.env ?? process.env;
  const envEntries = Object.entries(executionEnv);
  const readEnv = (name) =>
    envEntries.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? '';
  const verificationKey = [
    nodeVersion,
    options.platform ?? process.platform,
    pnpmCommand,
    readEnv('PATH'),
    readEnv('PATHEXT'),
  ].join('\0');
  const cacheEnabled = options.cacheToolchainVerification !== false;
  const cachedKeys = cacheEnabled ? verifiedToolchainsBySpawn.get(spawnImpl) : null;
  if (cachedKeys?.has(verificationKey)) {
    return pnpmCommand;
  }

  const result = spawnImpl(pnpmCommand, ['--version'], {
    env: executionEnv,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
  });
  if (result.error) {
    throw new Error(`Failed to verify pnpm ${expectedPnpmVersion}: ${result.error.message}`);
  }
  const actualPnpmVersion = result.stdout?.trim();
  if (result.status !== 0 || actualPnpmVersion !== expectedPnpmVersion) {
    throw new Error(
      `pnpm ${expectedPnpmVersion} is required; received ${actualPnpmVersion || 'unavailable'}.`,
    );
  }

  if (cacheEnabled) {
    const nextCachedKeys = cachedKeys ?? new Set();
    nextCachedKeys.add(verificationKey);
    verifiedToolchainsBySpawn.set(spawnImpl, nextCachedKeys);
  }

  return pnpmCommand;
}

function runLocalPreparationStep(invocation, args, label, options) {
  const spawnImpl = options.buildSpawnImpl ?? spawnSync;
  const result = spawnImpl(resolvePnpmCommand(options.platform), args, {
    cwd: invocation.cliDir,
    env: options.spawnOptions?.env ?? process.env,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
  });
  if (result.error) {
    throw new Error(`Failed to ${label} local TianGong CLI: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Local TianGong CLI ${label} failed with exit code ${result.status}.${detail ? `\n${detail}` : ''}`,
    );
  }
}

function ensureLocalCliBuild(invocation, options) {
  if (invocation.mode !== 'local' || options.prepareLocalCli === false) {
    return;
  }
  if (!localCliNeedsBuild(invocation, options)) {
    return;
  }

  runLocalPreparationStep(
    invocation,
    ['install', '--frozen-lockfile'],
    'frozen install',
    options,
  );
  runLocalPreparationStep(invocation, ['run', 'build'], 'build', options);
}

export function executeTiangongCommand(tiangongArgs, options = {}) {
  const invocation = buildTiangongInvocation(tiangongArgs, options);
  assertSupportedToolchain(options);
  ensureLocalCliBuild(invocation, options);
  if (invocation.candidateQualification) {
    assertLocalCliCandidate(invocation.cliDir, invocation.candidateQualification, options);
  }

  const spawnImpl = options.spawnImpl ?? spawnSync;
  const result = spawnImpl(invocation.command, invocation.args, {
    ...options.spawnOptions,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    throw new Error(`Failed to execute TianGong CLI: ${result.error.message}`);
  }

  return {
    invocation,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export function runTiangongCommand(tiangongArgs, options = {}) {
  const stdoutWrite = options.stdoutWrite ?? ((text) => process.stdout.write(text));
  const stderrWrite = options.stderrWrite ?? ((text) => process.stderr.write(text));
  const result = executeTiangongCommand(tiangongArgs, options);

  if (result.stdout) {
    stdoutWrite(result.stdout);
  }
  if (result.stderr) {
    stderrWrite(result.stderr);
  }
  if (typeof result.status === 'number') {
    return result.status;
  }
  if (result.signal) {
    throw new Error(`TianGong CLI terminated with signal ${result.signal}.`);
  }
  return 1;
}

export function withCliRuntimeEnv(baseEnv, cliDir, options = {}) {
  const env = { ...baseEnv };
  const normalizedCliDir = normalizeCliDir(cliDir);
  delete env[candidateFileEnv];
  delete env[candidateHashEnv];

  if (normalizedCliDir) {
    env.TIANGONG_LCA_CLI_DIR = normalizedCliDir;
    delete env.TIANGONG_LCA_CLI_MODE;
    if (options.cliCandidateFile) env[candidateFileEnv] = path.resolve(options.cliCandidateFile);
    if (options.cliCandidateSha256) env[candidateHashEnv] = options.cliCandidateSha256;
  } else {
    delete env.TIANGONG_LCA_CLI_DIR;
    env.TIANGONG_LCA_CLI_MODE = 'published';
  }

  return env;
}

export function renderShellCommand(command, args) {
  return [command, ...args]
    .map((value) =>
      /^[A-Za-z0-9_./:=+@-]+$/u.test(value) ? value : JSON.stringify(value),
    )
    .join(' ');
}
