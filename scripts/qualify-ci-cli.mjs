// CI test qualification only: reviewed source pin plus preceding frozen install/build.
// This record is not a production runtime approval or data authorization.
import { appendFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { inspectLocalCliCandidate } from './lib/cli-launcher.mjs';
if (!process.env.GITHUB_ENV || !process.env.RUNNER_TEMP) throw new Error('CI environment required');
const cliDir = path.resolve('.ci/tiangong-lca-cli');
const record = inspectLocalCliCandidate(cliDir, {
  expectedCommit: '955642482771a270fd49a199d1d7c86fcccc9ce2', expectedVersion: '0.2.0',
});
const file = path.join(process.env.RUNNER_TEMP, 'skills-cli-test-candidate.json');
const bytes = `${JSON.stringify(record, null, 2)}\n`;
writeFileSync(file, bytes, { flag: 'wx' });
appendFileSync(process.env.GITHUB_ENV, `TIANGONG_LCA_CLI_CANDIDATE_FILE=${file}\nTIANGONG_LCA_CLI_CANDIDATE_SHA256=${createHash('sha256').update(bytes).digest('hex')}\n`);
