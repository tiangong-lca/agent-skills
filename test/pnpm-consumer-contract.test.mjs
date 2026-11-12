import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const gitRepositoryLocationEnvNames = new Set([
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_CEILING_DIRECTORIES',
  'GIT_PREFIX',
  'GIT_NAMESPACE',
  'GIT_QUARANTINE_PATH',
]);

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function collectMarkdown(rootDir) {
  const result = runGit(rootDir, ['ls-files', '-z', '--', '*.md']);
  return result.stdout
    .split('\0')
    .filter(Boolean)
    .map((relativePath) => path.join(rootDir, relativePath));
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    env: sanitizedGitEnv(),
    encoding: 'utf8',
    stdio: 'pipe',
    shell: false,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function sanitizedGitEnv(baseEnv = process.env) {
  return Object.fromEntries(
    Object.entries(baseEnv).filter(
      ([name]) => !gitRepositoryLocationEnvNames.has(name.toUpperCase()),
    ),
  );
}

function runBootstrapGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    env: sanitizedGitEnv(),
    encoding: 'utf8',
    stdio: 'pipe',
    shell: false,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

test('hook-like Git environment cannot redirect fixture operations into the parent index', () => {
  const sandboxRoot = mkdtempSync(path.join(tmpdir(), 'skills-git-env-isolation-'));
  const parentRoot = path.join(sandboxRoot, 'parent');
  const fixtureRoot = path.join(sandboxRoot, 'fixture');
  const alternateObjects = path.join(sandboxRoot, 'alternate-objects');
  const inheritedValues = new Map();

  try {
    mkdirSync(parentRoot, { recursive: true });
    mkdirSync(fixtureRoot, { recursive: true });
    mkdirSync(alternateObjects, { recursive: true });
    runBootstrapGit(parentRoot, ['init', '--quiet']);
    writeFileSync(path.join(parentRoot, 'README.md'), '# parent original\n', 'utf8');
    runBootstrapGit(parentRoot, ['add', '--', 'README.md']);
    const parentTreeBefore = runBootstrapGit(parentRoot, ['write-tree']).stdout.trim();
    const parentWorktreeBefore = readFileSync(path.join(parentRoot, 'README.md'), 'utf8');

    runBootstrapGit(fixtureRoot, ['init', '--quiet']);
    writeFileSync(path.join(fixtureRoot, 'README.md'), '# isolated fixture\n', 'utf8');

    const inheritedGitEnvironment = {
      GIT_DIR: path.join(parentRoot, '.git'),
      GIT_WORK_TREE: fixtureRoot,
      GIT_INDEX_FILE: path.join(parentRoot, '.git', 'index'),
      GIT_OBJECT_DIRECTORY: path.join(parentRoot, '.git', 'objects'),
      GIT_ALTERNATE_OBJECT_DIRECTORIES: alternateObjects,
      GIT_COMMON_DIR: path.join(parentRoot, '.git'),
      GIT_CEILING_DIRECTORIES: sandboxRoot,
    };
    for (const [name, value] of Object.entries(inheritedGitEnvironment)) {
      inheritedValues.set(name, {
        existed: Object.prototype.hasOwnProperty.call(process.env, name),
        value: process.env[name],
      });
      process.env[name] = value;
    }

    runGit(fixtureRoot, ['add', '--', 'README.md']);

    for (const [name, previous] of inheritedValues) {
      if (previous.existed) {
        process.env[name] = previous.value;
      } else {
        delete process.env[name];
      }
    }
    inheritedValues.clear();

    assert.equal(
      runBootstrapGit(parentRoot, ['write-tree']).stdout.trim(),
      parentTreeBefore,
    );
    assert.equal(readFileSync(path.join(parentRoot, 'README.md'), 'utf8'), parentWorktreeBefore);
  } finally {
    for (const [name, previous] of inheritedValues) {
      if (previous.existed) {
        process.env[name] = previous.value;
      } else {
        delete process.env[name];
      }
    }
    rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test('markdown inventory excludes untracked nested repositories under .ci', () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'skills-markdown-inventory-'));
  const nestedRoot = path.join(fixtureRoot, '.ci', 'tiangong-lca-cli');

  try {
    runGit(fixtureRoot, ['init', '--quiet']);
    writeFileSync(path.join(fixtureRoot, 'README.md'), '# tracked root\n', 'utf8');
    runGit(fixtureRoot, ['add', '--', 'README.md']);

    mkdirSync(nestedRoot, { recursive: true });
    runGit(nestedRoot, ['init', '--quiet']);
    writeFileSync(
      path.join(nestedRoot, 'README.md'),
      'npx -y @tiangong-lca/cli@latest --help\n',
      'utf8',
    );
    runGit(nestedRoot, ['add', '--', 'README.md']);

    const inventory = collectMarkdown(fixtureRoot)
      .map((filePath) => path.relative(fixtureRoot, filePath))
      .sort();
    assert.deepEqual(inventory, ['README.md']);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('repository package contract pins the workspace Node and pnpm versions', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.packageManager, 'pnpm@11.24.0');
  assert.deepEqual(manifest.engines, {
    node: '24.19.0',
    pnpm: '11.24.0',
  });
  assert.match(read('pnpm-lock.yaml'), /^lockfileVersion: '9\.0'$/mu);
});

test('validation CI installs the exact CLI checkout through frozen pnpm only', () => {
  const workflow = read('.github/workflows/validate-skills.yml');
  const diagnosticsStart = workflow.indexOf('\n  windows-diagnostics:');
  assert.ok(diagnosticsStart > workflow.indexOf('\n  validate:'));
  const qualification = workflow.slice(0, diagnosticsStart);
  const diagnostics = workflow.slice(diagnosticsStart);

  assert.match(workflow, /repository: tiangong-lca\/cli/u);
  assert.match(workflow, /ref: 955642482771a270fd49a199d1d7c86fcccc9ce2/u);
  assert.match(
    workflow,
    /uses: pnpm\/setup@a0881977cd8ea73b1ed212236c99ca10dcc80cf4/u,
  );
  assert.match(workflow, /runtime: node@24\.19\.0/u);
  assert.match(workflow, /version: 11\.24\.0/u);
  assert.match(workflow, /install: false/u);
  assert.match(workflow, /cache: true/u);
  assert.match(workflow, /pnpm install --frozen-lockfile/u);
  assert.match(workflow, /pnpm run build/u);
  assert.match(workflow, /node scripts\/qualify-ci-cli\.mjs/u);
  assert.match(read('scripts/qualify-ci-cli.mjs'), /expectedCommit: '955642482771a270fd49a199d1d7c86fcccc9ce2'/u);
  assert.doesNotMatch(workflow, /--published-cli/u);
  assert.equal(
    qualification.match(
      /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/gu,
    )?.length,
    2,
  );
  assert.equal(diagnostics.match(/uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/gu)?.length, 1);
  assert.match(qualification, /if: \$\{\{ !inputs\.windows_diagnostics \}\}/u);
  assert.match(qualification, /run: pnpm test \$\{\{ matrix\.os == 'windows-latest' && '--test-concurrency=1' \|\| '' \}\}/u);
  assert.doesNotMatch(qualification, /--test-(?:skip-pattern|name-pattern|timeout|isolation)/u);
  assert.match(diagnostics, /github\.event_name == 'workflow_dispatch' && inputs\.windows_diagnostics/u);
  assert.match(diagnostics, /run: node scripts\/lib\/windows-foundry-diagnostics\.mjs/u);
  assert.doesNotMatch(diagnostics, /repository: tiangong-lca\/cli|pnpm run build|pnpm validate/u);
  assert.doesNotMatch(
    workflow,
    /actions\/checkout@v|pnpm\/action-setup|actions\/setup-node|package-lock\.json|\bnpm (?:ci|exec|run)\b/u,
  );
});

test('local push gate requires a selected runtime and validates local evidence before mutation', () => {
  const hook = read('.githooks/pre-push');

  assert.match(hook, /pnpm install --frozen-lockfile/u);
  assert.match(hook, /pnpm run build/u);
  assert.match(hook, /pnpm prepush:gate/u);
  assert.doesNotMatch(hook, /TIANGONG_LCA_CLI_MODE=published/u);
  assert.doesNotMatch(hook, /\.\.\/tiangong-lca-cli|\.\.\/tiangong-cli/u);
  const evidenceIndex = hook.indexOf(
    'node "$repo_root/scripts/check-toolchain.mjs" --cli-dir "$cli_dir"',
  );
  const localInstallIndex = hook.indexOf(
    'cd "$cli_dir" && pnpm install --frozen-lockfile',
  );
  assert.ok(evidenceIndex >= 0);
  assert.ok(localInstallIndex > evidenceIndex);
  assert.doesNotMatch(hook, /package-lock\.json|\bnpm (?:ci|exec|run)\b/u);
});

test('qualified candidates reach the shared toolchain validator and avoid a second hook-owned rebuild', () => {
  const checker = read('scripts/check-toolchain.mjs');
  assert.match(checker, /normalizeCliRuntimeArgs\(process\.argv\.slice\(2\)\)/u);
  assert.match(checker, /buildTiangongInvocation\(\[\], runtime\)/u);
  assert.doesNotMatch(checker, /buildTiangongInvocation\(\[\], \{ cliDir \}\)/u);
  const hook = read('.githooks/pre-push');
  assert.match(hook, /TIANGONG_LCA_CLI_CANDIDATE_FILE/u);
  assert.match(hook, /TIANGONG_LCA_CLI_CANDIDATE_SHA256/u);
  const qualifiedBranch = hook.indexOf('if [ -n "${TIANGONG_LCA_CLI_CANDIDATE_FILE:-}" ]');
  const qualificationValidator = hook.indexOf('node "$repo_root/scripts/check-toolchain.mjs" --cli-dir "$cli_dir"');
  const ordinaryRebuild = hook.indexOf('cd "$cli_dir" && pnpm install --frozen-lockfile');
  assert.ok(qualificationValidator >= 0 && qualificationValidator < qualifiedBranch);
  assert.ok(qualifiedBranch >= 0 && qualifiedBranch < ordinaryRebuild);
  assert.match(hook.slice(qualifiedBranch, ordinaryRebuild), /\belse\b/u);
  assert.doesNotMatch(hook, /TIANGONG_LCA_CLI_MODE=published/u);
});

test('nested validation, QA and fixture wrappers propagate the complete normalized candidate runtime', () => {
  for (const relativePath of [
    'scripts/validate-skills.mjs',
    'flow-governance-review/scripts/run-flow-governance-review-fixture.mjs',
  ]) {
    const wrapper = read(relativePath);
    assert.match(wrapper, /\{ args, \.\.\.runtime \}.*normalizeCliRuntimeArgs/su, relativePath);
    assert.match(wrapper, /withCliRuntimeEnv\((?:process\.env|\{[\s\S]*?\}), runtime\.cliDir, runtime\)/u, relativePath);
    assert.doesNotMatch(wrapper, /withCliRuntimeEnv\(process\.env, (?:runtime\.)?cliDir\)/u, relativePath);
  }
});

test('checked-in docs use configured CLI execution while preserving external skills npx governance', () => {
  for (const filePath of collectMarkdown(repoRoot)) {
    const text = readFileSync(filePath, 'utf8');
    assert.doesNotMatch(
      text,
      /@tiangong-lca\/cli@latest|(?:pnpm dlx|npm exec|npx)[^\n]*@tiangong-lca\/cli/u,
      path.relative(repoRoot, filePath),
    );
  }

  assert.match(read('README.md'), /npx skills add https:\/\/github\.com\/tiangong-lca\/agent-skills/u);
  assert.match(read('README.zh-CN.md'), /npx skills add https:\/\/github\.com\/tiangong-lca\/agent-skills/u);
  assert.match(read('AGENTS.md'), /consumed through `npx skills`/u);
  assert.match(
    read('scripts/validate-skills.mjs'),
    /npx\[\^\\n\]\*@tiangong-lca\\\/cli/u,
  );
  assert.doesNotMatch(read('scripts/lib/cli-launcher.mjs'), /pnpm\.cmd/u);
});
