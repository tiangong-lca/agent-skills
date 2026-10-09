#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { inspectLocalCliCandidate } from './lib/cli-launcher.mjs';

const options = {};
const flags = new Map([
  ['--cli-dir', 'cliDir'], ['--expected-commit', 'expectedCommit'],
  ['--expected-version', 'expectedVersion'], ['--out', 'out'],
]);
try {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Inspect a prepared local CLI against caller-supplied expectations. No installation or build.\nUsage: node scripts/inspect-local-cli.mjs --cli-dir <checkout> --expected-commit <sha> --expected-version <version> --out <new-json-file>\nReview the output and bind its SHA-256 before selecting it. An inventory does not grant authorization.');
  } else {
    for (let index = 0; index < args.length; index += 1) {
      const [flag, inline] = args[index].split(/=(.*)/su);
      const key = flags.get(flag);
      if (!key) throw new Error(`Unknown inspection option: ${flag}`);
      const value = inline ?? args[++index];
      if (!value?.trim() || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      if (options[key]) throw new Error(`Duplicate inspection option: ${flag}`);
      options[key] = value;
    }
    if (!options.out) throw new Error('--out requires a new qualification file path');
    const record = inspectLocalCliCandidate(options.cliDir, options);
    const bytes = `${JSON.stringify(record, null, 2)}\n`;
    const output = path.resolve(options.out);
    writeFileSync(output, bytes, { flag: 'wx' });
    console.log(JSON.stringify({ path: output, sha256: createHash('sha256').update(bytes).digest('hex'),
      commit: record.cli.commit, packageVersion: record.cli.packageVersion,
      authorization: 'observation_only_requires_independent_caller_approval' }));
  }
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
