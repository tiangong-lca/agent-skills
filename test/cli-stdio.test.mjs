import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { executeTiangongCommand, runTiangongCommand } from '../scripts/lib/cli-launcher.mjs';

const root = path.resolve(import.meta.dirname, '..');
const options = { cliCommand: process.execPath };
const mib = 1024 * 1024;
const input = Buffer.concat([Buffer.from('echo 天工 🌱\n'), Buffer.from([0, 255])]);
const stdoutChunk = Buffer.from([11, 0, 255, 128]);
const stderrChunk = Buffer.from([137, 254, 0, 17]);
const stdout = Buffer.alloc(3 * mib, stdoutChunk);
const stderr = Buffer.alloc(2 * mib, stderrChunk);
const bothStreams = `
  const input = require('node:fs').readFileSync(0);
  process.stdout.write(Buffer.concat([input, Buffer.alloc(3 * 1024 * 1024, Buffer.from([11, 0, 255, 128]))]));
  process.stderr.write(Buffer.alloc(2 * 1024 * 1024, Buffer.from([137, 254, 0, 17])));
  process.exitCode = 7;
`;

const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^TIANGONG_/i.test(key)));
for (const skill of ['shared', 'flow-hybrid-search', 'process-hybrid-search', 'lifecyclemodel-hybrid-search', 'lca-study']) {
  test(`${skill} wrapper forwards large binary stdout and stderr, stdin and the child exit status`, (t) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'skills-cli-stdio-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    let wrapperRoot = root;
    if (skill !== 'shared') {
      wrapperRoot = path.join(dir, skill);
      cpSync(path.join(root, skill), wrapperRoot, { recursive: true });
    }
    const result = spawnSync(process.execPath, [
      path.join(wrapperRoot, 'scripts', 'run-cli.mjs'),
      '--cli-command', process.execPath,
      '--eval', bothStreams,
    ], { cwd: dir, env, input, maxBuffer: 8 * mib, timeout: 60_000 });
    assert.ifError(result.error);
    assert.equal(result.status, 7);
    assert.equal(result.signal, null);
    const expectedStdout = Buffer.concat([input, stdout]);
    assert.equal(result.stdout.length, expectedStdout.length);
    assert.ok(result.stdout.equals(expectedStdout), 'stdout bytes differ');
    assert.equal(result.stderr.length, stderr.length);
    assert.ok(result.stderr.equals(stderr), 'stderr bytes differ');
  });
}

test('explicit capture returns both text streams and the exit status without forwarding', () => {
  const child = `
    process.stdout.write(require('node:fs').readFileSync(0));
    process.stderr.write('diagnostic β');
    process.exitCode = 7;
  `;
  const text = 'explicit input 天工';
  const result = executeTiangongCommand(['--eval', child], { ...options, spawnOptions: { input: text } });
  assert.equal(result.status, 7);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, text);
  assert.equal(result.stderr, 'diagnostic β');
});

test('explicit capture retains the default buffer limit and honors an explicit override', () => {
  const args = ['--eval', "process.stdout.write('x'.repeat(3 * 1024 * 1024)); process.exitCode = 7;"];
  assert.throws(() => executeTiangongCommand(args, options), /ENOBUFS/);
  const result = executeTiangongCommand(args, { ...options, spawnOptions: { maxBuffer: 8 * mib } });
  assert.equal(result.status, 7);
  assert.ok(result.stdout === 'x'.repeat(3 * mib), 'captured stdout differs');
  assert.equal(result.stderr, '');
});

test('ordinary execution retains explicit stdin and output writers', () => {
  const args = ['--eval', `
    const input = require('node:fs').readFileSync(0);
    process.stdout.write(input);
    process.stderr.write('diagnostic');
    process.exitCode = 23;
  `];
  let output = '';
  let diagnostic = '';
  const status = runTiangongCommand(args, {
    ...options,
    spawnOptions: { input: 'explicit input' },
    stdoutWrite: (value) => { output += value; },
    stderrWrite: (value) => { diagnostic += value; },
  });
  assert.deepEqual([status, output, diagnostic], [23, 'explicit input', 'diagnostic']);
});

test('a terminated child retains its signal diagnostic', { skip: process.platform === 'win32' }, () => {
  const args = ['--eval', "process.kill(process.pid, 'SIGTERM');"];
  assert.throws(() => runTiangongCommand(args, options), /terminated with signal SIGTERM/);
  const result = executeTiangongCommand(args, options);
  assert.equal(result.status, null);
  assert.equal(result.signal, 'SIGTERM');
});
