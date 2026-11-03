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

test('copied skills and direct entry consume real installed CLI 0.1.28 from one environment', {timeout:240_000}, () => {
  const dir=mkdtempSync(path.join(tmpdir(),'skills-public-installed-'));
  try {
    const env=cleanEnv();
    writeFileSync(path.join(dir,'package.json'),'{"private":true}');
    const installed=spawnSync(process.platform==='win32'?'pnpm.exe':'pnpm',['add','--ignore-scripts','--save-exact','@tiangong-lca/cli@0.1.28'],{cwd:dir,env,shell:false,encoding:'utf8',timeout:180_000});
    assert.ifError(installed.error);assert.equal(installed.status,0,installed.stderr);
    const installation=realpathSync(path.join(dir,'node_modules','@tiangong-lca','cli'));
    assert.equal(existsSync(path.join(installation,'.git')),false);assert.equal(existsSync(path.join(installation,'src')),false);
    // Exact published package identity fixed by this regression, separate from the consumer observation.
    // The Node identity is supplied by the test host, not copied from the CLI descriptor.
    const file=path.join(dir,'test-release-expectation.json');
    writeFileSync(file,JSON.stringify({schema:'tiangong-lca.cli-runtime-expectation.v1',package_version:'0.1.28',platform:`${process.platform}-${process.arch}`,content_sha256:'b2bfbe2b34b9db305dcd881a2a13d761a4ecddea2cc88113e6c54b4a940f66be',node_version:process.versions.node,node_sha256:hash(readFileSync(process.execPath))}));
    Object.assign(env,fields(installation,file,hash(readFileSync(file))));
    // Empty PATH proves ordinary dispatch cannot install/build or look up Git/pnpm.
    for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
    env.PATH='';
    cpSync(path.join(root,'scripts'),path.join(dir,'scripts'),{recursive:true});
    cpSync(path.join(root,'lifecycleinventory-review'),path.join(dir,'lifecycleinventory-review'),{recursive:true});
    const direct=path.join(dir,'scripts','run-cli.mjs');
    const info=run(direct,['--runtime-info'],env,dir);
    assert.equal(info.status,0,info.stderr);const observed=JSON.parse(info.stdout);
    assert.equal(observed.runtime.package.version,'0.1.28');assert.equal(observed.selection.source,'environment');
    const qa=path.join(dir,'lifecycleinventory-review','scripts','run-review.mjs');
    const wrappedHelp=run(qa,['--profile','process','--help'],env,dir);
    const directHelp=run(direct,['qa','process','--help'],env,dir);
    assert.equal(wrappedHelp.status,0,wrappedHelp.stderr);assert.equal(wrappedHelp.stdout,directHelp.stdout);assert.equal(wrappedHelp.stderr,directHelp.stderr);
    const input=path.join(dir,'frozen-rows.json');
    const frozen=JSON.stringify({rows:[{id:'test-process',version:'01.00.000',process:{processDataSet:{
      processInformation:{dataSetInformation:{name:{baseName:[{'@xml:lang':'en','#text':'Synthetic water treatment'}]}},quantitativeReference:{functionalUnitOrOther:'1 kg treated water'},geography:{mixAndLocationTypes:'CN'},time:'2025'},
      modellingAndValidation:{LCIMethodAndAllocation:{typeOfDataSet:'Unit process, single operation'}},
      administrativeInformation:{publicationAndOwnership:{'common:dataSetVersion':'01.00.000'}},
      exchanges:{exchange:[{exchangeDirection:'Input',meanAmount:1,commonComment:'[tg_io_kind_tag=product] [tg_io_uom_tag=kg] water',referenceToFlowDataSet:{'@refObjectId':'synthetic-in'}},{exchangeDirection:'Output',meanAmount:1,commonComment:'[tg_io_kind_tag=product] [tg_io_uom_tag=kg] water',referenceToFlowDataSet:{'@refObjectId':'synthetic-out'}}]}
    }}}]});
    writeFileSync(input,frozen);
    const args=['--rows-file',input,'--out-dir',path.join(dir,'qa-output'),'--json'];
    const wrapped=run(qa,args,env,dir);const native=run(direct,['qa','process',...args],env,dir);
    assert.equal(wrapped.status,0,wrapped.stderr);assert.equal(wrapped.status,native.status);assert.equal(wrapped.stderr,native.stderr);
    const normalize=(text)=>{const report=JSON.parse(text);delete report.generated_at_utc;return report;};
    assert.equal(JSON.parse(wrapped.stdout).process_count,1);
    assert.deepEqual(normalize(wrapped.stdout),normalize(native.stdout));
    assert.equal(readFileSync(input,'utf8'),frozen);
    for(const entity of ['flow','process','lifecyclemodel']) {
      const name=`${entity}-hybrid-search`;cpSync(path.join(root,name),path.join(dir,name),{recursive:true});
      for(const lib of ['cli-launcher.mjs','cli-development.mjs','cli-installed.mjs'])assert.equal(readFileSync(path.join(dir,name,'scripts','lib',lib),'utf8'),readFileSync(path.join(root,'scripts','lib',lib),'utf8'));
      const wrapper=path.join(dir,name,'scripts',`run-${name}.mjs`);
      const result=run(wrapper,['--dry-run','--json'],env,dir);
      assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).dryRun,true);
      const planned=JSON.parse(result.stdout).request;
      assert.equal(planned.url,`https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/${entity}_hybrid_search`);
      assert.equal(planned.headers['x-region'],'us-east-1');
      const custom=run(wrapper,['--dry-run','--json','--base-url','https://custom.supabase.co'],env,dir);
      assert.equal(custom.status,2,custom.stderr || custom.stdout);
      const localInfo=run(path.join(dir,name,'scripts','run-cli.mjs'),['--runtime-info'],env,dir);
      assert.equal(localInfo.status,0,localInfo.stderr);assert.equal(JSON.parse(localInfo.stdout).runtime.package.version,'0.1.28');
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
    writeFileSync(f.file, '{}');
    const changed = run(entry, args, f.env, f.dir);
    assert.notEqual(changed.status, 0);
    assert.equal(readFileSync(f.env.CALL_LOG, 'utf8'), 'called\n');
    const empty = {...cleanEnv(), PATH: ''};
    const missing = run(entry, ['study', 'capabilities', '--json'], empty, f.dir);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /No CLI installation configured/);
    const help = run(entry, ['--help'], empty, f.dir);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /TIANGONG_LCA_CLI_INSTALLATION/);
  } finally { rmSync(f.dir, {recursive:true, force:true}); }
});
