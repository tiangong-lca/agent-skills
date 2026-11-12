#!/usr/bin/env node
import process from 'node:process';
import { normalizeCliRuntimeArgs, runTiangongCommand } from '../../scripts/lib/cli-launcher.mjs';
import { resolveFlowGovernanceCliArgv, flowGovernanceCliCommandEntries } from './lib/cli-command-manifest.mjs';
try {
  const { args, ...runtime } = normalizeCliRuntimeArgs(process.argv.slice(2));
  if (!args.length || ['--help', '-h'].includes(args[0])) {
    console.log('Flow operations: ' + flowGovernanceCliCommandEntries.map(v => v.wrapperCommand).join(', '));
    console.log('Each operation delegates to dataset flow <action>. Use <action> --help for current inputs. Review decisions and repair sequencing belong to the caller.');
  } else {
    const command = resolveFlowGovernanceCliArgv(args[0]);
    if (!command) throw new Error('Unsupported action. Use a current atomic action; specialized repair workflows are not provided.');
    process.exitCode = runTiangongCommand([...command, ...args.slice(1)], runtime);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 2;
}
