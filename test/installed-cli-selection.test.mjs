import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildTiangongInvocation, executeTiangongCommand, normalizeCliRuntimeArgs, withCliRuntimeEnv } from '../scripts/lib/cli-launcher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const cleanEnv = () => Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(?:TIANGONG_|GIT_)/iu.test(key)));
const fields = (installation, file, digest) => ({
  TIANGONG_LCA_CLI_INSTALLATION: installation,
  TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE: file,
  TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256: digest,
});
const run = (script, args, env, cwd) => spawnSync(process.execPath, [script, ...args], {
  env, cwd, shell: false, encoding: 'utf8', timeout: 60_000,
});

function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'skills-installed-contract-'));
  const installation = path.join(dir, 'installed');
  mkdirSync(installation);
  writeFileSync(path.join(installation, 'package.json'), JSON.stringify({name:'@tiangong-lca/cli',type:'module',exports:{'./runtime':{import:'./public-api.mjs'}}}));
  // Deliberately unlike the source/candidate layout. Only the public API is a contract.
  writeFileSync(path.join(installation, 'business.mjs'), `import fs from 'node:fs';
fs.appendFileSync(process.env.CALL_LOG, 'called\\n');
console.log(JSON.stringify({args:process.argv.slice(2),status:'UNKNOWN',originalAttempt:'keep-me'}));
console.error('owner diagnostic'); process.exitCode=17;`);
  writeFileSync(path.join(installation, 'method-assets.json'), '{"revision":"new-schema-layout"}');
  writeFileSync(path.join(installation, 'public-api.mjs'), `import {createHash} from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function assertCliRuntimeMatches(expected){
 const root=path.dirname(fileURLToPath(import.meta.url));
 const content=createHash('sha256').update(fs.readFileSync(path.join(root,'method-assets.json'))).digest('hex');
 if(expected.content_sha256!==content)throw new Error('owner: runtime changed');
 return {schema:'tiangong-lca.cli-runtime-descriptor.v1',package:{name:'@tiangong-lca/cli',version:expected.package_version,root},command:{executable:process.execPath,argv:[path.join(root,'business.mjs')]},content_sha256:content};
}`);
  const file = path.join(dir, 'approved.json');
  // A test oracle for a synthetic owner, not production qualification.
  writeFileSync(file, JSON.stringify({schema:'tiangong-lca.cli-runtime-expectation.v1',package_version:'0.1.28',content_sha256:hash(readFileSync(path.join(installation,'method-assets.json')))}));
  const env = {...cleanEnv(), ...fields(installation,file,hash(readFileSync(file))), PATH:'', CALL_LOG:path.join(dir,'calls')};
  return {dir,installation,file,env};
}

test('environment selection survives nested wrappers; explicit source/task selection remains separate', () => {
  const f=fixture();
  try {
    const selected=normalizeCliRuntimeArgs(['qa','process'],{env:f.env});
    assert.equal(selected.cliSelectionSource,'environment');
    assert.deepEqual(normalizeCliRuntimeArgs(['qa','process'],{env:withCliRuntimeEnv(f.env,selected.cliDir,selected)}),selected);
    const explicit=['--cli-installation',f.installation,'--cli-runtime-expectation-file',f.file,'--cli-runtime-expectation-sha256',f.env.TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256];
    assert.equal(normalizeCliRuntimeArgs(explicit,{env:{}}).cliSelectionSource,'explicit');
    assert.throws(()=>normalizeCliRuntimeArgs(['--cli-candidate-file','--help',...explicit],{env:{}}),/requires a value/);
    assert.equal(normalizeCliRuntimeArgs(['--cli-dir',f.dir,'--cli-candidate-file','old','--cli-candidate-sha256','stale',...explicit],{env:{}}).cliInstallation,f.installation);
    assert.throws(()=>normalizeCliRuntimeArgs([...explicit,'--published-cli'],{env:{}}),/selection has been removed/);
    const legacy=normalizeCliRuntimeArgs(['--cli-dir',f.dir,'original-task','resume'],{env:f.env});
    assert.equal(legacy.cliDir,f.dir);assert.equal(legacy.cliInstallation,undefined);
    const inherited=withCliRuntimeEnv(f.env,legacy.cliDir,legacy);
    assert.equal(inherited.TIANGONG_LCA_CLI_INSTALLATION,undefined);
    assert.throws(()=>normalizeCliRuntimeArgs(['--published-cli'],{env:f.env}),/selection has been removed/);
    assert.throws(()=>normalizeCliRuntimeArgs([],{env:{...f.env,TIANGONG_LCA_CLI_MODE:'published'}}),/selection has been removed/);
    assert.throws(()=>normalizeCliRuntimeArgs([],{env:{...f.env,TIANGONG_LCA_CLI_DIR:f.dir}}),/Both installed and development/);
    assert.throws(()=>normalizeCliRuntimeArgs([],{env:{TIANGONG_LCA_CLI_INSTALLATION:f.installation}}),/together/);
    assert.throws(()=>normalizeCliRuntimeArgs(['--cli-installation',path.join(f.dir,'other')],{env:f.env}),/together/);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('installed owner runs without Git, pnpm, source or build; stdout/exit/UNKNOWN are unchanged and never replayed', () => {
  const f=fixture();
  try {
    const {args,...runtime}=normalizeCliRuntimeArgs(['task','resume','original-task'],{env:f.env});
    const result=executeTiangongCommand(args,{...runtime,spawnOptions:{env:f.env,cwd:f.dir}});
    assert.equal(result.status,17);assert.equal(result.stderr,'owner diagnostic\n');
    assert.deepEqual(JSON.parse(result.stdout),{args,status:'UNKNOWN',originalAttempt:'keep-me'});
    assert.equal(readFileSync(f.env.CALL_LOG,'utf8'),'called\n');
    assert.equal(result.invocation.runtime.package.version,'0.1.28');
    assert.equal(result.invocation.selectionSource,'environment');
    for(const name of ['.git','src','dist','node_modules','pnpm-lock.yaml'])assert.equal(existsSync(path.join(f.installation,name)),false);
    // A new independently qualified owner asset identity needs no Skills edit.
    writeFileSync(path.join(f.installation,'method-assets.json'),'{"unrelated":"schema-v-next"}');
    const expected=JSON.parse(readFileSync(f.file));expected.package_version='1.2.3';expected.content_sha256=hash(readFileSync(path.join(f.installation,'method-assets.json')));
    writeFileSync(f.file,JSON.stringify(expected));
    const env={...f.env,...fields(f.installation,f.file,hash(readFileSync(f.file)))};
    const next=normalizeCliRuntimeArgs([],{env});
    assert.equal(buildTiangongInvocation([],{...next,spawnOptions:{env}}).runtime.package.version,'1.2.3');
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('changed qualification, owner drift, missing installation and invalid setup fail before business dispatch', () => {
  for(const failure of ['evidence','owner','missing','relative','node']) {
    const f=fixture();
    try {
      const selected=normalizeCliRuntimeArgs([],{env:f.env});
      if(failure==='evidence')writeFileSync(f.file,'{}');
      if(failure==='owner')writeFileSync(path.join(f.installation,'method-assets.json'),'changed');
      if(failure==='missing')selected.cliInstallation=path.join(f.dir,'missing');
      if(failure==='relative')selected.cliInstallation='relative';
      if(failure==='node')selected.runtimeSpawnImpl=()=>({status:1,stderr:'owner: node identity mismatch'});
      assert.throws(()=>executeTiangongCommand(['business'],{...selected,spawnOptions:{env:f.env}}));
      assert.equal(existsSync(f.env.CALL_LOG),false);
    } finally {rmSync(f.dir,{recursive:true,force:true});}
  }
});

test('migrated wrappers forward native atomic arguments once and preserve UNKNOWN', () => {
  const f=fixture();
  try {
    const cases = [
      ['flow-hybrid-search/scripts/run-flow-hybrid-search.mjs', ['--query','water use','--scope','public','--state','100'], ['dataset','flow','search']],
      ['process-hybrid-search/scripts/run-process-hybrid-search.mjs', ['--query','electricity','--scope','public','--state','100'], ['dataset','process','search']],
      ['lifecyclemodel-hybrid-search/scripts/run-lifecyclemodel-hybrid-search.mjs', ['--query','battery'], ['dataset','model','search']],
      ['current-account-dataset-review/scripts/run-current-account-dataset-review.mjs', ['process','get','--id','id','--version','01.00.000'], ['dataset']],
      ['flow-governance-review/scripts/run-flow-governance-review.mjs', ['patch','--input','explicit patch.json'], ['dataset','flow']],
      ['process-automated-builder/scripts/run-process-automated-builder.mjs', ['save','--input','save.json'], ['dataset','process']],
      ['lifecyclemodel-automated-builder/scripts/run-lifecyclemodel-automated-builder.mjs', ['graph','--input','model.json'], ['dataset','model']],
      ['lifecyclemodel-recursive-orchestrator/scripts/run-lifecyclemodel-recursive-orchestrator.mjs', ['validate','--input','model.json'], ['dataset','model']],
      ['lifecyclemodel-resulting-process-builder/scripts/run-lifecyclemodel-resulting-process-builder.mjs', ['--input','projection.json'], ['dataset','model','build-resulting-process']],
      ['process-scope-statistics/scripts/run-process-scope-statistics.mjs', ['--scope','current-user'], ['dataset','process','statistics']],
      ['process-dedup-review/scripts/run-process-dedup-review.mjs', ['--input','comparison.json'], ['dataset','process','diff']],
      ['lifecycleinventory-review/scripts/run-remote-process-review.mjs', ['get','--id','id','--version','01.00.000'], ['dataset','process']],
      ['tiangong-lca-remote-ops/scripts/update-process-references.mjs', ['--input','patch.json'], ['dataset','process','patch']],
      ['tiangong-lca-remote-ops/scripts/verify-process-rows.mjs', ['--input','canonical.json'], ['dataset','process','validate']],
      ['lca-publish-executor/scripts/run-lca-publish-executor.mjs', ['submit','--input','review.json'], ['review']],
    ];
    for(const [relative,args,prefix] of cases) {
      const result=run(path.join(root,relative),args,f.env,f.dir);
      assert.equal(result.status,17,relative+': '+result.stderr);
      assert.deepEqual(JSON.parse(result.stdout),{args:[...prefix,...args],status:'UNKNOWN',originalAttempt:'keep-me'},relative);
      assert.equal(result.stderr,'owner diagnostic\n');
    }
    assert.equal(readFileSync(f.env.CALL_LOG,'utf8'),'called\n'.repeat(cases.length));
    const bad=run(path.join(root,'lifecycleinventory-review/scripts/run-review.mjs'),['--profile','lifecyclemodel','--input','old.json'],f.env,f.dir);
    assert.notEqual(bad.status,0);
    const retired=run(path.join(root,'flow-governance-review/scripts/run-flow-governance-review.mjs'),['rewrite','--input','old.json'],f.env,f.dir);
    assert.notEqual(retired.status,0);
    assert.equal(readFileSync(f.env.CALL_LOG,'utf8'),'called\n'.repeat(cases.length));
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('copied skills and direct entry consume real installed CLI 0.2.0 from one environment', {timeout:240_000}, () => {
  const dir=mkdtempSync(path.join(tmpdir(),'skills-public-installed-'));
  try {
    const env=cleanEnv();
    writeFileSync(path.join(dir,'package.json'),'{"private":true}');
    const installed=spawnSync(process.platform==='win32'?'pnpm.exe':'pnpm',['add','--ignore-scripts','--save-exact','@tiangong-lca/cli@0.2.0'],{cwd:dir,env,shell:false,encoding:'utf8',timeout:180_000});
    assert.ifError(installed.error);assert.equal(installed.status,0,installed.stderr);
    const installation=realpathSync(path.join(dir,'node_modules','@tiangong-lca','cli'));
    assert.equal(existsSync(path.join(installation,'.git')),false);assert.equal(existsSync(path.join(installation,'src')),false);
    // Exact published package identity fixed by this regression, separate from the consumer observation.
    // The Node identity is supplied by the test host, not copied from the CLI descriptor.
    const file=path.join(dir,'test-release-expectation.json');
    writeFileSync(file,JSON.stringify({schema:'tiangong-lca.cli-runtime-expectation.v1',package_version:'0.2.0',platform:`${process.platform}-${process.arch}`,content_sha256:'ba9215ad29c6a3737035fbc92a8a074892be3c329f048d30285a88f9938d5188',node_version:process.versions.node,node_sha256:hash(readFileSync(process.execPath))}));
    Object.assign(env,fields(installation,file,hash(readFileSync(file))));
    // Empty PATH proves ordinary dispatch cannot install/build or look up Git/pnpm.
    for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
    env.PATH='';
    cpSync(path.join(root,'scripts'),path.join(dir,'scripts'),{recursive:true});
    cpSync(path.join(root,'lifecycleinventory-review'),path.join(dir,'lifecycleinventory-review'),{recursive:true});
    const direct=path.join(dir,'scripts','run-cli.mjs');
    const info=run(direct,['--runtime-info'],env,dir);
    assert.equal(info.status,0,info.stderr);const observed=JSON.parse(info.stdout);
    assert.equal(observed.runtime.package.version,'0.2.0');assert.equal(observed.selection.source,'environment');
    const qa=path.join(dir,'lifecycleinventory-review','scripts','run-review.mjs');
    const wrappedHelp=run(qa,['--profile','process','--help'],env,dir);
    const directHelp=run(direct,['dataset','process','validate','--help'],env,dir);
    assert.equal(wrappedHelp.status,0,wrappedHelp.stderr);assert.equal(wrappedHelp.stdout,directHelp.stdout);assert.equal(wrappedHelp.stderr,directHelp.stderr);
    const input=path.join(dir,'flow.json');
    const frozen=readFileSync(path.join(root,'flow-governance-review/assets/example-flow.json'),'utf8');
    writeFileSync(input,frozen);
    const args=['--input',input,'--json'];
    const wrapped=run(qa,['--profile','flow',...args],env,dir);
    const native=run(direct,['dataset','flow','validate',...args],env,dir);
    assert.equal(wrapped.status,0,wrapped.stderr);assert.equal(wrapped.status,native.status);assert.equal(wrapped.stderr,native.stderr);
    assert.equal(JSON.parse(wrapped.stdout).data.validation.status,'passed');
    const normalized=(text)=>{const value=JSON.parse(text); assert.ok(value.context.observation.time); delete value.context.observation.time; return value;};
    assert.deepEqual(normalized(wrapped.stdout),normalized(native.stdout));
    assert.equal(readFileSync(input,'utf8'),frozen);
    const projectionName='lifecyclemodel-resulting-process-builder';
    cpSync(path.join(root,projectionName),path.join(dir,projectionName),{recursive:true});
    const projection=run(path.join(dir,projectionName,'scripts/run-lifecyclemodel-resulting-process-builder.mjs'),
      ['--input',path.join(dir,projectionName,'assets/example-request.json'),'--json'],env,dir);
    assert.equal(projection.status,0,projection.stderr||projection.stdout);
    const generated=JSON.parse(projection.stdout);
    assert.equal(generated.data.qualification.status,'qualified');
    assert.equal(generated.data.projectedProcessCount,1);
    assert.equal(generated.data.bundle.projected_processes[0].json_ordered.processDataSet.processInformation.dataSetInformation['common:UUID'],'88888888-8888-4888-8888-888888888888');
    const graphRequest=path.join(dir,'graph-request.json');
    writeFileSync(graphRequest,JSON.stringify({content:JSON.parse(readFileSync(path.join(dir,projectionName,'assets/example-model.json')))}));
    const graph=run(direct,['dataset','model','graph','--input',graphRequest,'--json'],env,dir);
    assert.equal(graph.status,0,graph.stderr||graph.stdout);
    assert.equal(JSON.parse(graph.stdout).data.graphs.length,1);
    const translatedSource=JSON.parse(frozen);
    const names=translatedSource.flowDataSet.flowInformation.dataSetInformation.name;
    names.baseName=[names.baseName];
    const translationInput=path.join(dir,'translations.json');
    const common={content:translatedSource,sourceLanguage:'en',targetLanguage:'zh'};
    writeFileSync(translationInput,JSON.stringify(common));
    const extracted=run(direct,['dataset','flow','translations','extract','--input',translationInput,'--json'],env,dir);
    assert.equal(extracted.status,0,extracted.stderr);
    const extraction=JSON.parse(extracted.stdout).data;
    assert.equal(extraction.units.length,1);
    writeFileSync(translationInput,JSON.stringify({...common,sourceDigest:extraction.sourceDigest,translations:[{path:extraction.units[0].path,sourceText:extraction.units[0].sourceText,text:'测试流',basis:'Synthetic English test name translated to Chinese.'}]}));
    const translatedFile=path.join(dir,'applied.json');
    const applied=run(direct,['dataset','flow','translations','apply','--input',translationInput,'--output',translatedFile,'--json'],env,dir);
    assert.equal(applied.status,0,applied.stderr||applied.stdout);
    const translated=JSON.parse(readFileSync(translatedFile));
    assert.equal(translated.content.flowDataSet.flowInformation.dataSetInformation.name.baseName[1]['#text'],'测试流');
    assert.equal(translated.changes.length,1);
    assert.equal(readFileSync(input,'utf8'),frozen);
    for(const entity of ['flow','process','lifecyclemodel']) {
      const name=`${entity}-hybrid-search`;cpSync(path.join(root,name),path.join(dir,name),{recursive:true});
      for(const lib of ['cli-launcher.mjs','cli-development.mjs','cli-installed.mjs'])assert.equal(readFileSync(path.join(dir,name,'scripts','lib',lib),'utf8'),readFileSync(path.join(root,'scripts','lib',lib),'utf8'));
      const wrapper=path.join(dir,name,'scripts',`run-${name}.mjs`);
      const type=entity==='lifecyclemodel'?'model':entity;
      const result=run(wrapper,['--help'],env,dir);
      const nativeHelp=run(direct,['dataset',type,'search','--help'],env,dir);
      assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,nativeHelp.stdout);
      for(const legacy of [['--dry-run'],['--input','old.json'],['--base-url','https://custom.invalid']]) {
        const rejected=run(wrapper,['--query','water',...legacy,'--json'],env,dir);
        assert.notEqual(rejected.status,0);
        assert.match(rejected.stdout+rejected.stderr,/unknown|unexpected|unsupported/i);
      }
      const localInfo=run(path.join(dir,name,'scripts','run-cli.mjs'),['--runtime-info'],env,dir);
      assert.equal(localInfo.status,0,localInfo.stderr);assert.equal(JSON.parse(localInfo.stdout).runtime.package.version,'0.2.0');
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('copied Study package preserves configured owner commands and UNKNOWN without source or fallback', () => {
  const f = fixture();
  try {
    const copied = path.join(f.dir, 'lca-study');
    cpSync(path.join(root, 'lca-study'), copied, { recursive: true });
    const entry = path.join(copied, 'scripts', 'run-cli.mjs');
    for (const relative of ['scripts/run-cli.mjs', 'scripts/lib/cli-launcher.mjs', 'scripts/lib/cli-installed.mjs', 'scripts/lib/cli-development.mjs']) {
      assert.deepEqual(readFileSync(path.join(copied, relative)), readFileSync(path.join(root, relative)));
    }
    const args = ['study', 'request', 'recover', '--intent-file', path.join(f.dir, 'original-intent.json'), '--json'];
    const result = run(entry, args, f.env, f.dir);
    assert.equal(result.status, 17, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { args, status: 'UNKNOWN', originalAttempt: 'keep-me' });
    assert.equal(readFileSync(f.env.CALL_LOG, 'utf8'), 'called\n');
    assert.equal(existsSync(path.join(f.dir, 'scripts')), false);
    const requestFile=path.join(f.dir,'exact-report-request.json');
    const originalRequest=JSON.stringify({reportRevisionId:'issued-report',expectedContentHash:'a'.repeat(64),idempotencyKey:'original-key',delegationId:'issued-one-use-delegation'});
    writeFileSync(requestFile,originalRequest);
    const v4Commands=[
      ['setup','model-calculation','--check','--json'],
      ['dataset','model','prepare','--input',requestFile,'--output',path.join(f.dir,'input.json'),'--json'],
      ['dataset','model','calculate','--file',requestFile,'--output-dir',path.join(f.dir,'run-1'),'--json'],
      ['calculation','get','--dir',path.join(f.dir,'run-1'),'--json'],
      ['calculation','result','--dir',path.join(f.dir,'run-1'),'--kind','lcia','--json'],
      ['study','capabilities','--api-version','4','--json'],
      ['study','actions','--input',requestFile,'--json'],
      ['study','member','set','--api-version','4','--input',requestFile,'--json'],
      ['study','review','record','--input',requestFile,'--state-dir',path.join(f.dir,'original-state'),'--json'],
      ['study','report','current','--input',requestFile,'--json'],
      ['study','report','finalize','--input',requestFile,'--json'],
      ['study','export','download','--api-version','4','--input',requestFile,'--output-dir',path.join(f.dir,'new-export'),'--anchors','trusted-anchors.json','--expected','selected-export.json','--json'],
      ['study','share','download','--input',requestFile,'--output-dir',path.join(f.dir,'new-share'),'--anchors','trusted-anchors.json','--expected','selected-export.json','--json'],
      ['study','share','revoke','--input',requestFile,'--json'],
    ];
    for(const forwarded of v4Commands){
      const observed=run(entry,forwarded,f.env,f.dir);
      assert.equal(observed.status,17,observed.stderr);
      assert.equal(observed.stderr,'owner diagnostic\n');
      assert.deepEqual(JSON.parse(observed.stdout),{args:forwarded,status:'UNKNOWN',originalAttempt:'keep-me'});
      assert.equal(readFileSync(requestFile,'utf8'),originalRequest);
    }
    const calls='called\n'.repeat(v4Commands.length+1);
    assert.equal(readFileSync(f.env.CALL_LOG,'utf8'),calls);
    writeFileSync(f.file, '{}');
    const changed = run(entry, args, f.env, f.dir);
    assert.notEqual(changed.status, 0);
    assert.equal(readFileSync(f.env.CALL_LOG, 'utf8'), calls);
    const empty = {...cleanEnv(), PATH: ''};
    const missing = run(entry, ['study', 'capabilities', '--json'], empty, f.dir);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /No CLI installation configured/);
    const help = run(entry, ['--help'], empty, f.dir);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /TIANGONG_LCA_CLI_INSTALLATION/);
  } finally { rmSync(f.dir, {recursive:true, force:true}); }
});


test('copied Study delegation denial is returned once without changing authority or original input', () => {
 const f=fixture();
 try {
  const copied=path.join(f.dir,'copied-study');cpSync(path.join(root,'lca-study'),copied,{recursive:true});
  const file=path.join(f.dir,'original-review.json');const original=JSON.stringify({schemaVersion:'lca.study-api.v4',requestId:'original-request',idempotencyKey:'original-key',delegationId:null});writeFileSync(file,original);
  writeFileSync(path.join(f.installation,'business.mjs'),`import fs from 'node:fs';fs.appendFileSync(process.env.CALL_LOG,JSON.stringify(process.argv.slice(2))+'\\n');console.error(JSON.stringify({error:{code:'FORBIDDEN',message:'A bound delegation is unavailable.'}}));process.exitCode=1;`);
  const args=['study','review','record','--input',file,'--json'];const result=run(path.join(copied,'scripts/run-cli.mjs'),args,f.env,f.dir);
  assert.equal(result.status,1);assert.equal(result.stdout,'');assert.deepEqual(JSON.parse(result.stderr),{error:{code:'FORBIDDEN',message:'A bound delegation is unavailable.'}});
  assert.deepEqual(readFileSync(f.env.CALL_LOG,'utf8').trim().split('\n').map(line=>JSON.parse(line)),[args]);
  assert.equal(readFileSync(file,'utf8'),original);
  assert.equal(existsSync(path.join(f.installation,'src')),false);assert.equal(existsSync(path.join(f.dir,'scripts')),false);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
