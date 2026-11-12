import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeCliRuntimeArgs, withCliRuntimeEnv } from '../scripts/lib/cli-launcher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'skills command space '));
  const bin = path.join(dir, 'bin space'); mkdirSync(bin);
  const entry = path.join(bin, 'entry.mjs');
  writeFileSync(entry, `#!${process.execPath}\nimport{appendFileSync}from'node:fs';appendFileSync(process.env.CALL_LOG,'call\\n');console.log(JSON.stringify(process.argv.slice(2)));console.error('owner diagnostic');process.exitCode=Number(process.env.OWNER_EXIT||0);\n`);
  const command = path.join(bin, 'tiangong-lca');
  writeFileSync(command, readFileSync(entry)); chmodSync(command, 0o755);
  writeFileSync(command+'.cmd', '@ECHO off\r\n"%~dp0\\node.exe" "%~dp0\\entry.mjs" %*\r\n');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('TIANGONG_LCA_CLI_') && key.toLowerCase()!=='path'));
  env.PATH=bin; env.CALL_LOG=path.join(dir,'calls');
  return {dir,bin,entry,command,env};
}

test('copied ordinary packages call PATH CLI without runtime evidence and preserve one nonzero invocation', () => {
  const f=fixture();
  try {
    const args=['review','submit','--input','研究 file "quoted" & | < > ^ %PATH% !x! $(touch nope) `x`.json','--json'];
    for(const name of ['lca-study','flow-hybrid-search','process-hybrid-search','lifecyclemodel-hybrid-search']) {
      const copy=path.join(f.dir,name); cpSync(path.join(root,name),copy,{recursive:true});
      const result=spawnSync(process.execPath,[path.join(copy,'scripts/run-cli.mjs'),...args],{env:{...f.env,OWNER_EXIT:'23'},encoding:'utf8',shell:false});
      assert.equal(result.status,23,result.stderr);
      assert.deepEqual(JSON.parse(result.stdout),args);
      assert.equal(result.stderr,'owner diagnostic\n');
      assert.deepEqual(readFileSync(path.join(copy,'scripts/lib/cli-command.mjs')),readFileSync(path.join(root,'scripts/lib/cli-command.mjs')));
    }
    assert.equal(readFileSync(f.env.CALL_LOG,'utf8').trim().split('\n').length,4);
    assert.equal(existsSync(path.join(f.dir,'nope')),false);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('explicit public entry works with empty PATH and CLI updates need no requalification', () => {
 const f=fixture();
 try {
  const launcher=path.join(root,'scripts/run-cli.mjs');
  const args=['--cli-command',f.entry,'dataset','process','search','--query','steel'];
  for(const marker of ['first','updated']) {
    writeFileSync(f.entry,`console.log(JSON.stringify({marker:${JSON.stringify(marker)},args:process.argv.slice(2)}));`);
    const result=spawnSync(process.execPath,[launcher,...args],{env:{...f.env,PATH:''},encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.deepEqual(JSON.parse(result.stdout),{marker,args:args.slice(2)});
  }
 } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('missing PATH CLI gives actionable installation guidance without a successful help claim', () => {
 const f=fixture();
 try {
  const result=spawnSync(process.execPath,[path.join(root,'lca-study/scripts/run-cli.mjs'),'dataset','process','search','--help','--json'],{env:{...f.env,PATH:''},encoding:'utf8'});
  assert.equal(result.status,1);
  assert.equal(result.stdout,'');
  assert.match(result.stderr,/tiangong-lca was not found.*official|tiangong-lca was not found.*github.com/s);
  assert.equal(existsSync(f.env.CALL_LOG),false);
 } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('command override propagates to nested calls and replaces explicit inherited modes', () => {
 const env={TIANGONG_LCA_CLI_INSTALLATION:'/controlled',TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE:'/expected',TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256:'a'.repeat(64)};
 const selected=normalizeCliRuntimeArgs(['--cli-command','tiangong-lca','auth','status'],{env});
 assert.equal(selected.cliCommand,'tiangong-lca');
 const nested=withCliRuntimeEnv(env,selected.cliDir,selected);
 assert.equal(nested.TIANGONG_LCA_CLI_INSTALLATION,undefined);
 assert.equal(normalizeCliRuntimeArgs([],{env:nested}).cliCommand,'tiangong-lca');
 assert.throws(()=>normalizeCliRuntimeArgs([],{env:{...env,TIANGONG_LCA_CLI_COMMAND:'other'}}),/Conflicting/);
 const custom=normalizeCliRuntimeArgs(['--cli-command','/custom path/cli'],{env:{}});
 assert.equal(withCliRuntimeEnv({},null,custom).TIANGONG_LCA_CLI_COMMAND,'/custom path/cli');
});

test('Windows npm and pnpm Node shims preserve metacharacters without cmd interpolation', {skip:process.platform!=='win32'}, () => {
 const f=fixture();
 try {
  const launcher=path.join(root,'scripts/run-cli.mjs');
  const args=['--json','a " b & c | d <e> ^f %PATH% !g!','中文'];
  for(const variable of ['%dp0%','%~dp0']) {
   writeFileSync(f.command+'.cmd',`@ECHO off\r\n"node" "${variable}\\entry.mjs" %*\r\n`);
   const result=spawnSync(process.execPath,[launcher,...args],{env:f.env,encoding:'utf8'});
   assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),args);
  }
 } finally {rmSync(f.dir,{recursive:true,force:true});}
});
