#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  normalizeCliRuntimeArgs,
  publishedCliCommand,
  withCliRuntimeEnv,
} from "../../scripts/lib/cli-launcher.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(skillDir, "..", "..");
const wrapperScript = path.join(scriptDir, "run-flow-governance-review.mjs");

function renderHelp() {
  return `Usage:
  node scripts/run-flow-governance-review-fixture.mjs [--cli-dir <dir>]

What this verifies:
  - skills wrapper delegates materialize-db-flows to the CLI
  - the emitted qa-input rows are consumable by qa-flows
  - approved decisions materialize into canonical / rewrite / seed artifacts
  - the whole chain runs against a local Supabase-shaped fixture server, not a real remote

Runtime:
  default                  ${publishedCliCommand}
  local override           --cli-dir /path/to/tiangong-lca-cli or TIANGONG_LCA_CLI_DIR
`.trim();
}

function normalizeArgs(rawArgs) {
  const { args, ...runtime } = normalizeCliRuntimeArgs(rawArgs);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") {
      console.log(renderHelp());
      process.exit(0);
    }
  }

  return runtime;
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

async function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "pipe",
    ...options,
  });

  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    stderr += String(chunk);
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });

  if (exitCode !== 0) {
    const message = stderr.trim() || stdout.trim() || `exit code ${exitCode}`;
    throw new Error(`${command} ${args.join(" ")} failed: ${message}`);
  }

  return {
    stdout,
    stderr,
  };
}

function makeFlowDataset({ id, version = "01.00.000", name, classId, classText }) {
  return {
    flowDataSet: {
      flowInformation: {
        dataSetInformation: {
          "common:UUID": id,
          name: {
            baseName: [
              {
                "@xml:lang": "en",
                "#text": name,
              },
            ],
          },
          classificationInformation: {
            "common:classification": {
              "common:class": [
                {
                  "@level": "0",
                  "@classId": classId,
                  "#text": classText,
                },
              ],
            },
          },
        },
        quantitativeReference: {
          referenceToReferenceFlowProperty: "0",
        },
      },
      modellingAndValidation: {
        LCIMethodAndAllocation: {
          typeOfDataSet: "Product flow",
        },
      },
      flowProperties: {
        flowProperty: [
          {
            "@dataSetInternalID": "0",
            referenceToFlowPropertyDataSet: {
              "@refObjectId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "@version": "01.00.000",
              "common:shortDescription": [
                {
                  "@xml:lang": "en",
                  "#text": "Mass",
                },
              ],
            },
          },
        ],
      },
      administrativeInformation: {
        publicationAndOwnership: {
          "common:dataSetVersion": version,
        },
      },
    },
  };
}

async function withFixtureServer(rowsByKey, runFixture) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    if (url.pathname.endsWith("/auth/v1/user")) {
      request.resume();
      response.writeHead(200, {
        "content-type": "application/json",
        connection: "close",
      });
      response.end(
        JSON.stringify({
          id: "11111111-1111-4111-8111-111111111111",
          aud: "authenticated",
          role: "authenticated",
          email: "fixture@example.com",
        }),
      );
      return;
    }

    if (url.pathname.endsWith("/rest/v1/flows")) {
      request.resume();
      const id = (url.searchParams.get("id") || "").replace(/^eq\./u, "");
      const version = (url.searchParams.get("version") || "").replace(/^eq\./u, "");
      const key = version ? `${id}@${version}` : null;
      const rows =
        key && rowsByKey[key]
          ? [rowsByKey[key]]
          : id
            ? Object.entries(rowsByKey)
                .filter(([rowKey]) => rowKey.startsWith(`${id}@`))
                .sort(([left], [right]) => right.localeCompare(left))
                .map(([, row]) => row)
            : [];
      response.writeHead(200, {
        "content-type": "application/json",
        connection: "close",
      });
      response.end(JSON.stringify(rows));
      return;
    }

    response.writeHead(404, {
      "content-type": "application/json",
    });
    response.end(JSON.stringify({ error: "not_found", path: url.pathname }));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    assert(address && typeof address === "object" && typeof address.port === "number");
    await runFixture(address.port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

async function main() {
  const runtime = normalizeArgs(process.argv.slice(2));

  const rowsByKey = {
    "flow-a@01.00.000": {
      id: "flow-a",
      version: "01.00.000",
      user_id: "11111111-1111-4111-8111-111111111111",
      state_code: 100,
      modified_at: "2026-04-06T00:00:00.000Z",
      json: makeFlowDataset({
        id: "flow-a",
        name: "Fixture Water",
        classId: "1000",
        classText: "Water",
      }),
    },
    "flow-b@01.00.000": {
      id: "flow-b",
      version: "01.00.000",
      user_id: "11111111-1111-4111-8111-111111111111",
      state_code: 100,
      modified_at: "2026-04-06T00:00:01.000Z",
      json: makeFlowDataset({
        id: "flow-b",
        name: "Fixture Water",
        classId: "1000",
        classText: "Water",
      }),
    },
  };

  const tempDir = mkdtempSync(path.join(os.tmpdir(), "tg-skills-flow-governance-fixture-"));

  try {
    await withFixtureServer(rowsByKey, async (port) => {
      const refsFile = path.join(tempDir, "flow-refs.json");
      const decisionsFile = path.join(tempDir, "approved-decisions.json");
      const materializedDir = path.join(tempDir, "materialized");
      const qaDir = path.join(tempDir, "qa");
      const decisionDir = path.join(tempDir, "decision-artifacts");

      writeJson(refsFile, [
        {
          id: "flow-a",
          version: "01.00.000",
          state_code: 100,
          cluster_id: "cluster-0001",
          source: "fixture",
        },
        {
          id: "flow-b",
          version: "01.00.000",
          state_code: 100,
          cluster_id: "cluster-0001",
          source: "fixture",
        },
      ]);
      writeJson(decisionsFile, [
        {
          cluster_id: "cluster-0001",
          decision: "merge_keep_one",
          canonical_flow: {
            id: "flow-a",
            version: "01.00.000",
          },
          flow_refs: [
            {
              id: "flow-a",
              version: "01.00.000",
            },
            {
              id: "flow-b",
              version: "01.00.000",
            },
          ],
          reason: "fixture_merge",
        },
      ]);

      const env = withCliRuntimeEnv({
        ...process.env,
        TIANGONG_LCA_API_BASE_URL: `http://127.0.0.1:${port}/functions/v1`,
        TIANGONG_LCA_AUTH_MODE: "access-token",
        TIANGONG_LCA_ACCESS_TOKEN: "fixture-short-lived-access-token",
        TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY: "fixture-publishable-key",
        TIANGONG_LCA_DISABLE_SESSION_CACHE: "1",
      }, runtime.cliDir, runtime);

      await run(process.execPath, [
        wrapperScript,
        "materialize-db-flows",
        "--refs-file",
        refsFile,
        "--out-dir",
        materializedDir,
        "--fail-on-missing",
      ], {
        cwd: repoRoot,
        env,
      });

      const fetchSummary = readJson(path.join(materializedDir, "fetch-summary.json"));
      assert.equal(fetchSummary.qa_input_row_count, 2);
      assert.equal(fetchSummary.missing_ref_count, 0);
      assert.equal(fetchSummary.ambiguous_ref_count, 0);

      await run(process.execPath, [
        wrapperScript,
        "qa-flows",
        "--rows-file",
        path.join(materializedDir, "qa-input-rows.jsonl"),
        "--out-dir",
        qaDir,
      ], {
        cwd: repoRoot,
        env,
      });

      const qaSummary = readJson(path.join(qaDir, "flow_qa_summary.json"));
      assert.equal(qaSummary.flow_count, 2);
      assert.ok(
        typeof qaSummary.rule_finding_count === "number",
        "QA summary should include rule_finding_count",
      );

      await run(process.execPath, [
        wrapperScript,
        "materialize-approved-decisions",
        "--decision-file",
        decisionsFile,
        "--flow-rows-file",
        path.join(materializedDir, "qa-input-rows.jsonl"),
        "--out-dir",
        decisionDir,
      ], {
        cwd: repoRoot,
        env,
      });

      const decisionSummary = readJson(path.join(decisionDir, "decision-summary.json"));
      assert.equal(decisionSummary.counts.materialized_clusters, 1);
      assert.equal(decisionSummary.counts.blocked_clusters, 0);

      const rewritePlan = readJson(path.join(decisionDir, "flow-dedup-rewrite-plan.json"));
      assert.equal(rewritePlan.actions.length, 1);
      assert.equal(rewritePlan.actions[0].source_flow_id, "flow-b");

      const seedMap = readJson(path.join(decisionDir, "manual-semantic-merge-seed.current.json"));
      assert.deepEqual(seedMap, {
        "flow-b@01.00.000": {
          id: "flow-a",
          version: "01.00.000",
          reason: "fixture_merge",
          cluster_id: "cluster-0001",
        },
      });
    });
  } finally {
    rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fixture failed: ${message}`);
  process.exit(1);
});
