#!/usr/bin/env node
import process from 'node:process';
import { buildTiangongInvocation, executeTiangongCommand, normalizeCliRuntimeArgs, renderCliRuntimeHelp, runTiangongCommand } from './lib/cli-launcher.mjs';

try {
  const { args, ...runtime } = normalizeCliRuntimeArgs(process.argv.slice(2));
  if (!runtime.cliInstallation && !runtime.cliDir && args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(`Usage: node scripts/run-cli.mjs <CLI arguments>\n       node scripts/run-cli.mjs --runtime-info\n\n${renderCliRuntimeHelp()}`);
  } else if (args.length === 1 && args[0] === '--runtime-info') {
    let invocation = buildTiangongInvocation([], runtime);
    let observed = invocation.runtime;
    if (!observed) {
      const result = executeTiangongCommand(['runtime', 'describe', '--json'], runtime);
      if (result.status !== 0) throw new Error(result.stderr || 'CLI runtime description failed');
      observed = JSON.parse(result.stdout);
      invocation = result.invocation;
    }
    console.log(JSON.stringify({ selection: { mode: invocation.mode,
      source: invocation.selectionSource ?? 'development',
      expectationSha256: invocation.expectationSha256 ?? null }, runtime: observed }));
  } else {
    process.exitCode = runTiangongCommand(args, runtime);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
