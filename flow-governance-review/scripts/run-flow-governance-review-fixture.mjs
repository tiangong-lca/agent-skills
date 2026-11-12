#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { normalizeCliRuntimeArgs, withCliRuntimeEnv } from '../../scripts/lib/cli-launcher.mjs';

const { args, ...runtime } = normalizeCliRuntimeArgs(process.argv.slice(2));
if (args.includes('--help') || args.includes('-h')) {
  console.log('Verify current atomic Flow validation/diff with local synthetic content. No network or dataset writes.');
} else {
  assert.equal(args.length, 0, 'Unexpected fixture arguments');
  const dir = mkdtempSync(path.join(os.tmpdir(), 'flow-atomic-fixture-'));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const wrapper = path.join(scriptDir, 'run-flow-governance-review.mjs');
  const env = withCliRuntimeEnv(process.env, runtime.cliDir, runtime);
  try {
    const input = path.join(dir, 'flow.json');
    const original = readFileSync(path.join(scriptDir, '../assets/example-flow.json'), 'utf8');
    writeFileSync(input, original);
    const run = (argv) => {
      const r = spawnSync(process.execPath, [wrapper, ...argv, '--json'], { cwd: dir, env, shell: false, encoding: 'utf8', timeout: 60000 });
      assert.ifError(r.error);
      assert.equal(r.status, 0, r.stderr || r.stdout);
      return JSON.parse(r.stdout);
    };
    const validated = run(['validate', '--input', input]);
    assert.equal(validated.outcome, 'validation_passed');
    assert.equal(validated.data.validation.status, 'passed');
    const before = JSON.parse(original), after = structuredClone(before);
    after.flowDataSet.flowInformation.dataSetInformation.name.baseName['#text'] = 'Reviewed test flow';
    const comparison = path.join(dir, 'diff.json');
    writeFileSync(comparison, JSON.stringify({ before, after }));
    const diff = run(['diff', '--input', comparison]);
    assert.equal(diff.operation, 'dataset flow diff');
    assert.equal(diff.data.changes.length, 1);
    assert.equal(diff.data.changes[0].after, 'Reviewed test flow');
    assert.match(diff.data.changes[0].path, /baseName\/#text$/u);
    assert.equal(readFileSync(input, 'utf8'), original);
    console.log(JSON.stringify({ status: 'passed', operations: [validated.operation, diff.operation], remoteWrites: false }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
