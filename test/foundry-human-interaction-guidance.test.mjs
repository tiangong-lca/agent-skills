import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalizeLineEndings = (content) => content.replace(/\r\n?/gu, '\n');
const read = (relative) => normalizeLineEndings(readFileSync(path.join(root, relative), 'utf8'));

const entry = read('foundry-tidas-import/SKILL.md');
const workflow = read('foundry-tidas-import/references/task-workflow.md');
const entryPrompt = read('foundry-tidas-import/agents/openai.yaml');
const authoring = read('foundry-tidas-authoring/SKILL.md');
const semantic = read('foundry-tidas-authoring/references/semantic-work.md');
const authoringPrompt = read('foundry-tidas-authoring/agents/openai.yaml');
const managedHelpers = [
  'external-dataset-curated-import',
  'source-evidence-dataset-development',
];

test('managed-task sections read identically from LF and Windows CRLF files', () => {
  for (const name of managedHelpers) {
    const lf = read(`${name}/SKILL.md`);
    const crlf = lf.replace(/\n/gu, '\r\n');
    assert.equal(normalizeLineEndings(crlf), lf);
    assert.ok(normalizeLineEndings(crlf).split('## Managed Foundry tasks\n')[1]?.split('## Boundaries\n')[0]);
  }
});

test('the entry derives scope and asks for current human decisions in a usable form', () => {
  assert.match(entry, /why the result is needed[\s\S]*objects and boundaries[\s\S]*deliverables/iu);
  assert.match(entry, /Reuse what is already clear; ask only for a gap that changes the work/iu);
  assert.match(workflow, /all seven keys: `original_request` is bounded raw user wording or `null`/iu);
  assert.match(workflow, /`goal` is a nonempty string; `intended_use` and `scope` are strings or `null`/iu);
  assert.match(workflow, /`deliverables`, `user_constraints` and `ai_assumptions` are string arrays that may be empty/iu);
  assert.match(entry, /what is missing, what it affects, the recommended next step and one precise question/iu);
  assert.match(entry, /a natural-language answer, additional evidence or “I don't know; investigate first/iu);
  assert.match(entry, /units, period and object scope/iu);
  assert.match(entry, /every limitation, uncertainty and source distinction that could change the choice/iu);
  assert.match(workflow, /questions already answered under unchanged evidence are not repeated/iu);
  assert.match(entryPrompt, /impact, recommendation and a precise, easy-to-answer question/iu);
});

test('answers are registered, adopted in scope and remain separate from scientific and write proof', () => {
  assert.match(entry, /original words, the interpreted decision, provenance and applicability/iu);
  assert.match(entry, /decision must reach the affected authoring context and its adoption evidence through Foundry/iu);
  assert.match(workflow, /task resume --interaction-input <descriptor-file>/iu);
  assert.match(workflow, /tiangong-foundry\.interaction-input\.v1/iu);
  assert.match(workflow, /expected_state_sha256: null[\s\S]*current indexed `interaction-state\.json` artifact/iu);
  assert.match(workflow, /`question`, `answer` or `assumption`/iu);
  assert.match(workflow, /`raw_answer`[\s\S]*`adopted_decision`[\s\S]*`disposition`/iu);
  assert.match(workflow, /`supersedes_decision_id`[\s\S]*first answer uses `null`[\s\S]*current prior `decision_id`/iu);
  assert.match(workflow, /only `investigate` may use `adopted_decision: null`/iu);
  assert.match(workflow, /inspect the new current result and confirm that the answer is active and reaches the affected work item/iu);
  assert.match(workflow, /Do not place a general answer in `--semantic-input`/iu);
  assert.match(authoring, /user requirements and raw answers from their interpreted decisions, AI assumptions and source facts/iu);
  assert.match(semantic, /Return the applicable decision IDs and adoption or non-adoption reason with each produced file/iu);
  assert.match(authoringPrompt, /never treat an answer as missing scientific evidence or write permission/iu);
});

test('semantic submissions bind current interaction state and exactly applicable decisions', () => {
  assert.match(workflow, /`interaction_sha256`[\s\S]*current indexed `interaction-state\.json` artifact/iu);
  assert.match(workflow, /`decision_ids`[\s\S]*exactly the currently applicable `decision_id`s/iu);
  assert.match(workflow, /`adopted_decisions` in `semantic-result`/iu);
  assert.match(authoring, /return the applicable decision IDs alongside each produced file/iu);
  assert.match(semantic, /semantic submission's `decision_ids`/iu);
  assert.match(entryPrompt, /bind semantic input to the current interaction-state SHA-256 and each work item's exact decision IDs/iu);
  assert.match(authoringPrompt, /return each file with its applicable decision IDs/iu);
  assert.doesNotMatch(workflow, /contains exactly `schema`, `task_id`, `actor_id`, `assessment_sha256` and `submissions`\./iu);
});

test('the shipped entry remains honest about capability, partial work and later corrections', () => {
  assert.match(workflow, /task-start contract accepts an optional inline `brief`/iu);
  assert.match(workflow, /Confirm type-wide and object-scoped event support from the selected runtime schema/iu);
  assert.doesNotMatch(workflow, /distributed 0\.1\.10/iu);
  assert.match(entry, /If the selected runtime lacks the required interaction contract, report the capability gap/iu);
  assert.match(workflow, /partial assessment cannot authorize finalization/iu);
  assert.match(entry, /reconsider the affected work and downstream checks/iu);
  assert.match(entry, /already consumed write/iu);
  assert.match(entry, /decision recap derived from the current registered task evidence/iu);
  assert.match(entry, /partial completion plainly/iu);
  assert.match(entry, /do not add a second completion-confirmation gate/iu);
  assert.match(semantic, /“investigate first,” and disclose decision-critical limitations/iu);
});

test('retained workflow helpers use registered decisions only inside managed Foundry tasks', () => {
  for (const name of managedHelpers) {
    const skill = read(`${name}/SKILL.md`);
    const prompt = read(`${name}/agents/openai.yaml`);
    const managed = skill.split('## Managed Foundry tasks\n')[1]?.split('## Boundaries\n')[0];
    assert.ok(managed, `${name} has an explicit managed-task section`);
    assert.match(managed, /current task brief and only the applicable registered decisions/iu);
    assert.match(managed, /ordinary Foundry entry/iu);
    assert.match(managed, /does not change the independent/iu);
    assert.match(prompt, /supplied brief, applicable decisions and structured actions/iu);
    assert.match(prompt, /Keep the standalone CLI procedure outside that managed task/iu);
  }
});
