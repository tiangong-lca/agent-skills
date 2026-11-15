#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { commandInvocation } from './lib/cli-command.mjs';

if (process.argv.length === 3 && ['--help', '-h'].includes(process.argv[2])) {
  process.stdout.write('Usage: node scripts/run-foundry.mjs <public Foundry arguments>\nUses tiangong-foundry on PATH or TIANGONG_FOUNDRY_COMMAND.\nInspect the selected runtime with runtime describe --json.\nInstallation and upgrade guidance: references/runtime-setup.md\nExisting tasks continue through their original returned commands.\n');
  process.exit(0);
}

try {
  const selected = process.env.TIANGONG_FOUNDRY_COMMAND ?? 'tiangong-foundry';
  if (!selected.trim()) throw new Error('TIANGONG_FOUNDRY_COMMAND requires an executable name or path.');
  const invocation = commandInvocation(process.argv.slice(2), { cliCommand: selected });
  const result = spawnSync(invocation.command, invocation.args, { shell: false, stdio: 'inherit' });
  if (result.error) {
    throw new Error('Cannot launch the configured Foundry entry. Install the Foundry public package and configure its managed runtime as described in references/runtime-setup.md.', { cause: result.error });
  }
  if (result.signal) process.kill(process.pid, result.signal);
  else process.exitCode = result.status ?? 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
