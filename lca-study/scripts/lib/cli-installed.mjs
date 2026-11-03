import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Use the selected CLI's public API. Skills does not interpret its inventory,
// TIDAS schemas, build layout, task state or compatibility rules.
const inspectProgram = `
const api = await import('@tiangong-lca/cli/runtime');
let input = '';
for await (const chunk of process.stdin) input += chunk;
const runtime = api.assertCliRuntimeMatches(JSON.parse(input));
process.stdout.write(JSON.stringify(runtime));
`;

export function installedInvocation(args, options) {
  const installation = options.cliInstallation;
  const file = options.cliRuntimeExpectationFile;
  const sha256 = options.cliRuntimeExpectationSha256;
  if (!path.isAbsolute(installation ?? '') || !path.isAbsolute(file ?? '') ||
      !/^[a-f0-9]{64}$/u.test(sha256 ?? '')) {
    throw new Error('Installed CLI requires an absolute installation and expectation file, plus its independently trusted SHA-256. Configure the environment once; no source checkout is required.');
  }
  const bytes = readFileSync(file);
  if (createHash('sha256').update(bytes).digest('hex') !== sha256) {
    throw new Error('Installed CLI runtime expectation changed; restore the approved evidence or explicitly configure newly qualified evidence. No fallback was attempted.');
  }
  const inspect = (options.runtimeSpawnImpl ?? spawnSync)(process.execPath,
    ['--input-type=module', '--eval', inspectProgram], {
      cwd: installation,
      input: bytes, encoding: 'utf8', shell: false, stdio: 'pipe',
      env: options.spawnOptions?.env ?? process.env,
      maxBuffer: 32 * 1024 * 1024,
    });
  if (inspect.error || inspect.status !== 0) {
    throw new Error(`Installed CLI identity verification failed; no installation, build or fallback was attempted: ${inspect.error?.message ?? inspect.stderr?.trim() ?? inspect.status}`);
  }
  const runtime = JSON.parse(inspect.stdout);
  if (runtime?.schema !== 'tiangong-lca.cli-runtime-descriptor.v1' ||
      runtime.package?.name !== '@tiangong-lca/cli' ||
      realpathSync(runtime.package.root) !== realpathSync(installation) ||
      !path.isAbsolute(runtime.command?.executable ?? '') ||
      !Array.isArray(runtime.command?.argv) ||
      !runtime.command.argv.every((arg) => typeof arg === 'string')) {
    throw new Error('Installed CLI returned an unsupported public runtime descriptor.');
  }
  return {
    mode: 'installed', command: runtime.command.executable,
    args: [...runtime.command.argv, ...args], runtime,
    selectionSource: options.cliSelectionSource ?? 'explicit',
    expectationSha256: sha256,
  };
}
