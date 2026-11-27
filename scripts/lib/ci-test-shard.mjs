import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const WINDOWS_SHARD_NAMES = Object.freeze([
  'foundry-core',
  'foundry-interaction',
  'foundry-object-scope',
  'contracts',
]);

const DEDICATED_SHARDS = Object.freeze({
  'foundry-core': ['test/foundry-public-install.test.mjs'],
  'foundry-interaction': ['test/foundry-public-install-interaction.test.mjs'],
  'foundry-object-scope': ['test/foundry-public-install-object-scope.test.mjs'],
});

export function discoverTestFiles(repoRoot) {
  const testDir = path.join(repoRoot, 'test');
  return fs
    .readdirSync(testDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
    .map((entry) => `test/${entry.name}`)
    .sort();
}

export function partitionWindowsTestShards(repoRoot) {
  const allFiles = discoverTestFiles(repoRoot);
  const allSet = new Set(allFiles);
  const dedicatedSet = new Set();
  const shards = {};
  for (const [name, files] of Object.entries(DEDICATED_SHARDS)) {
    for (const file of files) {
      if (!allSet.has(file)) {
        throw new Error(`Dedicated Windows shard ${name} references missing test file: ${file}`);
      }
      if (dedicatedSet.has(file)) {
        throw new Error(`Duplicate Windows shard assignment: ${file}`);
      }
      dedicatedSet.add(file);
    }
    shards[name] = Object.freeze([...files]);
  }
  shards.contracts = Object.freeze(allFiles.filter((file) => !dedicatedSet.has(file)));
  return Object.freeze(shards);
}

export function selectWindowsShardFiles(repoRoot, shardName) {
  if (!WINDOWS_SHARD_NAMES.includes(shardName)) {
    throw new Error(`Unknown Windows CI shard: ${shardName}`);
  }
  const shards = partitionWindowsTestShards(repoRoot);
  const files = shards[shardName];
  if (!files || files.length === 0) {
    throw new Error(`Windows CI shard has no test files: ${shardName}`);
  }
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, shardName] = process.argv.slice(2);
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  if (command !== 'run' || !shardName) {
    console.error('Usage: node scripts/lib/ci-test-shard.mjs run <foundry-core|foundry-interaction|foundry-object-scope|contracts>');
    process.exit(2);
  }
  const files = selectWindowsShardFiles(repoRoot, shardName);
  const result = spawnSync(
    process.execPath,
    ['--test', '--test-concurrency=1', ...files],
    { cwd: repoRoot, stdio: 'inherit', shell: false },
  );
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.signal) {
    process.kill(process.pid, result.signal);
  }
  process.exit(result.status ?? 1);
}
