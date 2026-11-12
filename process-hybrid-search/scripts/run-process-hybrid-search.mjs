#!/usr/bin/env node
import process from 'node:process';
import { normalizeCliRuntimeArgs, runTiangongCommand } from "./lib/cli-launcher.mjs";

// Forward current atomic CLI arguments without translating inputs or retrying effects.
try {
  const { args, ...runtime } = normalizeCliRuntimeArgs(process.argv.slice(2));
  const command = ["dataset", "process", "search"];
  process.exitCode = runTiangongCommand([...command, ...(args.length ? args : ['--help'])], runtime);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 2;
}
