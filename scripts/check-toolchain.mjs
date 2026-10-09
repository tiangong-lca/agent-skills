#!/usr/bin/env node
import {
  assertSupportedToolchain,
  buildTiangongInvocation,
  expectedNodeVersion,
  expectedPnpmVersion,
  normalizeCliRuntimeArgs,
} from './lib/cli-launcher.mjs';
import process from 'node:process';

const { args, ...runtime } = normalizeCliRuntimeArgs(process.argv.slice(2));
if (args.length > 0) {
  throw new Error(`Unknown toolchain check option: ${args[0]}`);
}

assertSupportedToolchain();
console.log(`Validated Node ${expectedNodeVersion} and pnpm ${expectedPnpmVersion}.`);

if (runtime.cliDir !== null) {
  const invocation = buildTiangongInvocation([], runtime);
  if (invocation.mode !== 'local') {
    throw new Error('--cli-dir must identify a non-empty local TianGong CLI path.');
  }
  console.log(
    `Validated explicit local ${invocation.packageVersion} package, frozen lock, and source-bound TIDAS manifest evidence${runtime.cliCandidateFile ? ' with qualification-bound source and build evidence' : ''} at ${invocation.cliDir}.`,
  );
}
