#!/usr/bin/env node
import process from 'node:process';
import { normalizeCliRuntimeArgs, runTiangongCommand } from '../../scripts/lib/cli-launcher.mjs';

// Canonical --input content and current validation flags are forwarded unchanged.
try {
  const { args, ...runtime } = normalizeCliRuntimeArgs(process.argv.slice(2));
  let profile = 'process';
  let selected = false;
  const forwarded = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' || args[i].startsWith('--profile=')) {
      if (selected) throw new Error('Repeated --profile');
      selected = true;
      profile = args[i] === '--profile' ? args[++i] : args[i].slice('--profile='.length);
    } else forwarded.push(args[i]);
  }
  if (!['flow', 'process', 'model'].includes(profile)) throw new Error('--profile must be flow, process or model');
  process.exitCode = runTiangongCommand(['dataset', profile, 'validate', ...(forwarded.length ? forwarded : ['--help'])], runtime);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 2;
}
