#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { commandInvocation } from './lib/cli-command.mjs';

if (process.argv.length === 3 && ['--help', '-h'].includes(process.argv[2])) {
  process.stdout.write('Usage: node scripts/run-foundry.mjs <public Foundry arguments>\nUses tiangong-foundry on PATH or TIANGONG_FOUNDRY_COMMAND.\nCLI-only managed deployments may explicitly select TIANGONG_FOUNDRY_RUNTIME_CLI.\nInstallation, discovery and absolute-path guidance: references/runtime-setup.md\nExisting tasks continue through their original returned commands.\n');
  process.exit(0);
}

try {
  const args = process.argv.slice(2);
  const env = process.env;
  let selected = env.TIANGONG_FOUNDRY_COMMAND ?? 'tiangong-foundry';
  let forwarded = args;
  if (env.TIANGONG_FOUNDRY_RUNTIME_CLI !== undefined) {
    if (env.TIANGONG_FOUNDRY_COMMAND !== undefined) {
      throw new Error('Select TIANGONG_FOUNDRY_COMMAND or TIANGONG_FOUNDRY_RUNTIME_CLI explicitly; both are configured.');
    }
    selected = env.TIANGONG_FOUNDRY_RUNTIME_CLI;
    if (!selected.trim()) throw new Error('TIANGONG_FOUNDRY_RUNTIME_CLI requires an executable name or path.');
    if (!env.TIANGONG_FOUNDRY_MANIFEST || !path.isAbsolute(env.TIANGONG_FOUNDRY_MANIFEST) ||
      !/^[a-f0-9]{64}$/u.test(env.TIANGONG_FOUNDRY_MANIFEST_SHA256 ?? '')) {
      throw new Error('CLI-managed Foundry requires an absolute TIANGONG_FOUNDRY_MANIFEST and its independently verified TIANGONG_FOUNDRY_MANIFEST_SHA256.');
    }
    const cache = env.TIANGONG_FOUNDRY_CACHE_DIR;
    if (cache !== undefined && (!cache || !path.isAbsolute(cache))) {
      throw new Error('TIANGONG_FOUNDRY_CACHE_DIR must be an absolute directory.');
    }
    const entry = env.TIANGONG_FOUNDRY_ENTRY ?? 'foundry';
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/u.test(entry)) {
      throw new Error('TIANGONG_FOUNDRY_ENTRY must name a declared launch.');
    }
    if (args[0] === 'runtime') {
      throw new Error('runtime describe requires the public Foundry installed entry. CLI runtime exec only forwards application commands. Use the deployment owner\'s verified release/protocol evidence and managed doctor --workspace <absolute-workspace> --json, or configure TIANGONG_FOUNDRY_COMMAND with a discovery-capable entry. See references/runtime-setup.md.');
    }
    forwarded = ['runtime', 'exec', '--manifest', env.TIANGONG_FOUNDRY_MANIFEST,
      '--manifest-sha256', env.TIANGONG_FOUNDRY_MANIFEST_SHA256,
      ...(cache === undefined ? [] : ['--cache-dir', cache]), '--entry', entry,
      '--cwd', process.cwd(), '--', ...args];
  }
  if (!selected.trim()) throw new Error('TIANGONG_FOUNDRY_COMMAND requires an executable name or path.');
  const invocation = commandInvocation(forwarded, { cliCommand: selected });
  const result = spawnSync(invocation.command, invocation.args, { shell: false, stdio: 'inherit' });
  if (result.error) {
    throw new Error('Cannot launch the configured Foundry entry. Install the Foundry public package or configure the verified CLI-managed entry with TIANGONG_FOUNDRY_RUNTIME_CLI as described in references/runtime-setup.md.', { cause: result.error });
  }
  if (result.signal) process.kill(process.pid, result.signal);
  else process.exitCode = result.status ?? 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
