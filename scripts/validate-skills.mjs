#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  normalizeCliRuntimeArgs,
  publishedCliCommand,
  withCliRuntimeEnv,
} from "./lib/cli-launcher.mjs";
import { flowGovernanceCliCommandEntries } from "../flow-governance-review/scripts/lib/cli-command-manifest.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const gitRepositoryLocationEnvNames = new Set([
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_CEILING_DIRECTORIES",
  "GIT_PREFIX",
  "GIT_NAMESPACE",
  "GIT_QUARANTINE_PATH",
]);

const defaultSkillNames = [
  "process-hybrid-search",
  "flow-hybrid-search",
  "lifecyclemodel-hybrid-search",
  "embedding-ft",
  "process-automated-builder",
  "lifecyclemodel-automated-builder",
  "lifecyclemodel-resulting-process-builder",
  "lifecycleinventory-review",
  "flow-governance-review",
  "lifecyclemodel-recursive-orchestrator",
  "lca-publish-executor",
  "process-dedup-review",
  "process-scope-statistics",
  "tiangong-lca-remote-ops",
  "current-account-dataset-review",
  "tidas-bilingual-transcreation",
  "tidas-contract-context",
  "tidas-data-import",
  "external-dataset-curated-import",
  "source-evidence-dataset-development",
  "dataset-rls-maintenance",
  "foundry-tidas-authoring",
  "foundry-tidas-import",
];

const removedQuickValidatePattern = new RegExp(
  String.raw`quick_validate` + String.raw`\.py`,
  "u",
);
const removedLifecyclemodelReviewPattern = new RegExp(
  String.raw`run_lifecyclemodel_review` + String.raw`\.py`,
  "u",
);
const removedInitSkillPattern = new RegExp(
  String.raw`init_skill` + String.raw`\.py`,
  "u",
);
const undocumentedInterfaceFlagPattern = new RegExp(
  String.raw`--` + String.raw`interface`,
  "u",
);
const historicalValidatePyCurrentPathPattern = new RegExp(
  String.raw`validate` + String.raw`\.py` + String.raw` checks`,
  "iu",
);
const legacyPublishedCliInvocationPattern =
  /@tiangong-lca\/cli@latest|npm exec[^\n]*@tiangong-lca\/cli|npx[^\n]*@tiangong-lca\/cli/iu;
const passwordEquivalentAuthInvocationPattern =
  /TIANGONG_LCA_API_KEY\s*=|--api-key(?:\s|`)|Authorization:\s*Bearer\s*<TIANGONG_LCA_API_KEY>|Auth variable:\s*`TIANGONG_LCA_API_KEY`/iu;

const docGuards = [
  {
    file: "process-hybrid-search/references/env.md",
    pattern: /shell wrapper/iu,
    message:
      "Use Node `.mjs` wrapper wording in process-hybrid-search env docs.",
  },
  {
    file: "flow-hybrid-search/references/env.md",
    pattern: /shell wrapper/iu,
    message: "Use Node `.mjs` wrapper wording in flow-hybrid-search env docs.",
  },
  {
    file: "lifecyclemodel-hybrid-search/references/env.md",
    pattern: /shell wrapper/iu,
    message:
      "Use Node `.mjs` wrapper wording in lifecyclemodel-hybrid-search env docs.",
  },
  {
    file: "embedding-ft/references/env.md",
    pattern: /shell wrapper/iu,
    message: "Use Node `.mjs` wrapper wording in embedding-ft env docs.",
  },
  {
    file: "lifecycleinventory-review/SKILL.md",
    pattern: /not implemented yet/iu,
    message:
      "lifecycleinventory-review should not advertise lifecyclemodel as unimplemented.",
  },
  {
    file: "lifecycleinventory-review/scripts/run-review.mjs",
    pattern: /not implemented yet/iu,
    message: "run-review.mjs should delegate lifecyclemodel review to the CLI.",
  },
  {
    file: "lifecycleinventory-review/profiles/lifecyclemodel/README.md",
    pattern: removedLifecyclemodelReviewPattern,
    message:
      "lifecyclemodel profile docs should not reference a future Python review script filename.",
  },
  {
    file: "lifecycleinventory-review/profiles/lifecyclemodel/README.md",
    pattern: /not implemented yet/iu,
    message:
      "lifecyclemodel profile docs should describe the implemented CLI path.",
  },
  {
    file: "AGENTS.md",
    pattern: removedQuickValidatePattern,
    message:
      "AGENTS.md should point at node scripts/validate-skills.mjs instead of a removed Python validator.",
  },
  {
    file: "AGENTS.md",
    pattern: removedInitSkillPattern,
    message: "AGENTS.md should not require a missing Python bootstrap step.",
  },
  {
    file: "AGENTS.md",
    pattern: undocumentedInterfaceFlagPattern,
    message:
      "AGENTS.md should require a real agents/openai.yaml file, not an undocumented generator flag.",
  },
  {
    file: "README.md",
    pattern: /~\/<agent>\/skills\//u,
    message:
      "README.md should describe global install scope without assuming a Unix home-directory path.",
  },
  {
    file: "README.zh-CN.md",
    pattern: /~\/<agent>\/skills\//u,
    message:
      "README.zh-CN.md should describe global install scope without assuming a Unix home-directory path.",
  },
  {
    file: "lifecyclemodel-automated-builder/references/source-analysis.md",
    pattern: historicalValidatePyCurrentPathPattern,
    message:
      "source-analysis.md should treat the old Python validator as historical context, not as the current execution path.",
  },
  {
    file: "lca-publish-executor/assets/example-request.json",
    pattern: /"out_dir": "\/tmp\//u,
    message:
      "lca-publish-executor example request should use a platform-neutral temp directory placeholder.",
  },
  {
    file: "lifecyclemodel-resulting-process-builder/assets/example-request.json",
    pattern: /file:\/\/\/tmp\//u,
    message:
      "lifecyclemodel-resulting-process-builder example request should use a platform-neutral file URI placeholder.",
  },
  {
    file: "process-scope-statistics/SKILL.md",
    pattern: /--env-file/u,
    message:
      "process-scope-statistics should rely on the CLI env-loading path instead of a wrapper-owned --env-file flag.",
  },
  {
    file: "process-dedup-review/SKILL.md",
    pattern: /review_duplicate_processes\.py|--xlsx/u,
    message:
      "process-dedup-review should delegate to tiangong-lca process dedup-review with grouped JSON input, not a bundled Python workbook runtime.",
  },
  {
    file: "process-dedup-review/agents/openai.yaml",
    pattern: /workbook/u,
    message:
      "process-dedup-review prompt metadata should describe grouped JSON input, not a workbook runtime.",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /derive the value from the quantitative reference flow/iu,
    message:
      "process-automated-builder must not derive annual supply from the reference flow amount (Issue #104).",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /reference unit per year/iu,
    message:
      "process-automated-builder must not turn an unstated basis into a per-year annual volume (Issue #104).",
  },
  {
    file: "process-automated-builder/references/operations-playbook.md",
    pattern: /then reference-flow `?meanAmount/iu,
    message:
      "ops playbook must not keep a reference meanAmount/resultingAmount fallback for annual supply (Issue #104).",
  },
  {
    file: "foundry-tidas-authoring/references/semantic-work.md",
    pattern: /deterministic `?9999 missing-data-sentinel\/year`? policy/iu,
    message:
      "semantic work must describe the historical sentinel as a read-only marker, never as Foundry policy (Issue #104).",
  },
  {
    file: "tiangong-lca-remote-ops/references/process-write-routing.md",
    pattern: /increment `?version`?[^.]{0,60}(every|each) (draft )?edit/iu,
    message:
      "write routing must not inflate the draft version for each edit (Issue #104).",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /\b(hand-?(write|edit|fabricate)|manually (write|set|edit|patch))\b[^.]{0,60}\ban empty array/iu,
    message:
      "process-automated-builder must not instruct hand-fabricating the unknown empty array (Issue #104).",
  },
  {
    file: "foundry-tidas-import/SKILL.md",
    pattern: /\b(hand-?(write|edit|fabricate)|manually (write|set|edit|patch))\b[^.]{0,60}\ban empty array/iu,
    message:
      "the Foundry entry must not instruct hand-fabricating the unknown empty array (Issue #104).",
  },
  {
    file: "tiangong-lca-remote-ops/references/process-write-routing.md",
    pattern: /\b(bypass|ignore|skip|work around)\b[^.]{0,40}\b(and|then|to)\s+(continue|proceed|write|save|submit|dispatch)/iu,
    message:
      "write routing must not instruct bypassing the runtime gate to continue a write (Issue #104).",
  },
  {
    file: "foundry-tidas-authoring/references/semantic-work.md",
    pattern: /\b(bypass|ignore|skip|work around)\b[^.]{0,40}\b(and|then|to)\s+(continue|proceed|write|save|submit|dispatch)/iu,
    message:
      "semantic work must not instruct bypassing the runtime gate to continue a write (Issue #104).",
  },
];

const requiredDocPatterns = [
  {
    file: "lifecycleinventory-review/SKILL.md",
    pattern: /--rows-file/u,
    message:
      "lifecycleinventory-review should document the native --rows-file process QA path.",
  },
  {
    file: "lifecycleinventory-review/scripts/run-review.mjs",
    pattern: /--rows-file/u,
    message:
      "run-review.mjs help should include a rows-file process QA example.",
  },
  {
    file: "lifecycleinventory-review/SKILL.md",
    pattern: /run-remote-process-review\.mjs/u,
    message:
      "lifecycleinventory-review should document the canonical remote snapshot QA wrapper.",
  },
  {
    file: "README.md",
    pattern: /process list --json/u,
    message:
      "README.md should mention the native process list -> qa process rows-file path.",
  },
  {
    file: "README.zh-CN.md",
    pattern: /process list --json/u,
    message:
      "README.zh-CN.md should mention the native process list -> qa process rows-file path.",
  },
  {
    file: "process-scope-statistics/SKILL.md",
    pattern: /tiangong-lca process scope-statistics/u,
    message:
      "process-scope-statistics should document the canonical tiangong-lca process scope-statistics command.",
  },
  {
    file: "process-dedup-review/SKILL.md",
    pattern: /tiangong-lca process dedup-review/u,
    message:
      "process-dedup-review should document the canonical tiangong-lca process dedup-review command.",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /explicit annual source evidence/iu,
    message:
      "process-automated-builder should keep annual supply evidence-based (Issue #104).",
  },
  {
    file: "foundry-tidas-authoring/references/semantic-work.md",
    pattern: /unknown volume stays unknown/iu,
    message:
      "semantic work should keep an unknown annual volume unknown (Issue #104).",
  },
  {
    file: "tiangong-lca-remote-ops/references/process-write-routing.md",
    pattern: /never increments the version/iu,
    message:
      "write routing should keep one stable unpublished draft version across resumes (Issue #104).",
  },
  {
    file: "process-automated-builder/references/ilcd_method_guardrails.md",
    pattern: /CLI #318/u,
    message:
      "the secondary-property guardrail should record the unreleased conversion path as an explicit hold (Issue #104).",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /qualified adoption is incomplete/iu,
    message:
      "process-automated-builder should hold the pinned-runtime gap as an explicit stop condition (Issue #104).",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /pinned published CLI `?0\.1\.24/iu,
    message:
      "process-automated-builder should distinguish the pinned published CLI from the merged source behavior (Issue #104).",
  },
  {
    file: "foundry-tidas-import/SKILL.md",
    pattern: /bounded existing-owner-draft repair lane/iu,
    message:
      "the Foundry entry should state the released bounded existing-owner-draft repair lane (Issue #104).",
  },
  {
    file: "foundry-tidas-authoring/references/semantic-work.md",
    pattern: /existing-owner-draft metadata repair lane is released/iu,
    message:
      "semantic work should state the released bounded existing-owner-draft repair lane (Issue #104).",
  },
  {
    file: "process-automated-builder/SKILL.md",
    pattern: /existing-owner-draft metadata repair lane is released/iu,
    message:
      "process-automated-builder should state the released bounded existing-owner-draft repair lane (Issue #104).",
  },
  {
    file: "foundry-tidas-import/SKILL.md",
    pattern: /qualified adoption (as )?incomplete/iu,
    message:
      "the Foundry entry should hold the pinned-runtime gap as an explicit stop condition (Issue #104).",
  },
  {
    file: "foundry-tidas-authoring/references/semantic-work.md",
    pattern: /qualified adoption incomplete/iu,
    message:
      "semantic work should hold the pinned-runtime gap as an explicit stop condition (Issue #104).",
  },
  {
    file: "tiangong-lca-remote-ops/references/process-write-routing.md",
    pattern: /qualified adoption as incomplete/iu,
    message:
      "write routing should hold the pinned-runtime gap as an explicit stop condition (Issue #104).",
  },
];

const repoWideDocGuards = [
  {
    pattern: legacyPublishedCliInvocationPattern,
    message:
      "Skill docs should use the pinned pnpm CLI invocation from cli-launcher.mjs instead of a floating or npm-based TianGong CLI fallback.",
  },
  {
    pattern: passwordEquivalentAuthInvocationPattern,
    message:
      "Active skill docs must use CLI OAuth status/login/doctor handoff instead of password-equivalent API-key invocation examples.",
  },
];

const targetedSmokeChecks = [
  ...flowGovernanceCliCommandEntries.map(({ wrapperCommand }) => ({
    skill: "flow-governance-review",
    script: "flow-governance-review/scripts/run-flow-governance-review.mjs",
    args: [wrapperCommand, "--help"],
    description: `flow-governance-review ${wrapperCommand} manifest help`,
  })),
  {
    skill: "flow-governance-review",
    script:
      "flow-governance-review/scripts/run-flow-governance-review-fixture.mjs",
    args: [],
    description: "flow-governance-review end-to-end fixture",
  },
  {
    skill: "lifecycleinventory-review",
    script: "lifecycleinventory-review/scripts/run-review.mjs",
    args: ["--profile", "process", "--help"],
    description: "process QA profile help",
  },
  {
    skill: "lifecycleinventory-review",
    script: "lifecycleinventory-review/scripts/run-review.mjs",
    args: ["--profile", "lifecyclemodel", "--help"],
    description: "lifecyclemodel QA profile help",
  },
  {
    skill: "lifecycleinventory-review",
    script: "lifecycleinventory-review/scripts/run-remote-process-review.mjs",
    args: ["--help"],
    description: "remote process QA wrapper help",
  },
];

function fail(message) {
  throw new Error(message);
}

function parseArgs(rawArgs) {
  const { args, ...runtime } = normalizeCliRuntimeArgs(rawArgs, { repoRoot });

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  return {
    runtime,
    targets: args,
  };
}

function printHelp() {
  console.log(
    `Usage:
  pnpm validate [--cli-dir <dir> | --published-cli] [skill-path ...]

Examples:
  pnpm validate
  pnpm validate lifecycleinventory-qa process-hybrid-search
  pnpm validate --cli-dir ../cli lifecycleinventory-review

What this validates:
  - SKILL.md frontmatter presence
  - agents/openai.yaml interface keys
  - Node syntax for skill wrapper .mjs files
  - wrapper --help smoke checks through the TianGong CLI
  - targeted doc guards that prevent stale shell/Python migration wording

CLI runtime:
  - default validation uses ${publishedCliCommand}
  - local CLI execution is opt-in only through --cli-dir or TIANGONG_LCA_CLI_DIR
  - use --published-cli to override a local CLI environment and verify the exact published package
`.trim(),
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    ...options,
    stdio: "pipe",
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    const stderr =
      result.stderr?.trim() ||
      result.stdout?.trim() ||
      `exit code ${result.status}`;
    fail(`${command} ${args.join(" ")} failed: ${stderr}`);
  }
}

function normalizeSkillTarget(target) {
  const directPath = path.isAbsolute(target)
    ? target
    : path.join(repoRoot, target);
  if (existsSync(directPath) && statSync(directPath).isDirectory()) {
    return directPath;
  }

  const namedPath = path.join(repoRoot, target);
  if (existsSync(namedPath) && statSync(namedPath).isDirectory()) {
    return namedPath;
  }

  fail(`Skill path not found: ${target}`);
}

function collectWrapperScripts(skillDir) {
  const scriptsDir = path.join(skillDir, "scripts");
  if (!existsSync(scriptsDir)) {
    return [];
  }

  return readdirSync(scriptsDir)
    .filter((entry) => entry.endsWith(".mjs"))
    .sort()
    .map((entry) => path.join(scriptsDir, entry));
}

function assertSkillFrontmatter(skillDir) {
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!existsSync(skillFile)) {
    fail(`Missing SKILL.md in ${path.relative(repoRoot, skillDir)}`);
  }

  const text = readFileSync(skillFile, "utf8");
  const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!frontmatterMatch) {
    fail(
      `SKILL.md in ${path.relative(repoRoot, skillDir)} must start with YAML frontmatter.`,
    );
  }
  if (!/^\s*name:\s*.+$/mu.test(frontmatterMatch[1])) {
    fail(
      `SKILL.md in ${path.relative(repoRoot, skillDir)} is missing a frontmatter name.`,
    );
  }
  if (!/^\s*description:\s*.+$/mu.test(frontmatterMatch[1])) {
    fail(
      `SKILL.md in ${path.relative(repoRoot, skillDir)} is missing a frontmatter description.`,
    );
  }
}

function assertAgentMetadata(skillDir) {
  const agentFile = path.join(skillDir, "agents", "openai.yaml");
  if (!existsSync(agentFile)) {
    fail(`Missing agents/openai.yaml in ${path.relative(repoRoot, skillDir)}`);
  }

  const text = readFileSync(agentFile, "utf8");
  for (const key of [
    "interface:",
    "display_name:",
    "short_description:",
    "default_prompt:",
  ]) {
    if (!text.includes(key)) {
      fail(
        `${path.relative(repoRoot, agentFile)} is missing required key ${key}`,
      );
    }
  }
}

function runNodeChecks(scriptFiles) {
  scriptFiles.forEach((scriptFile) => {
    run(process.execPath, ["--check", scriptFile], {
      cwd: repoRoot,
    });
  });
}

function runHelpSmoke(scriptFiles, runtime) {
  scriptFiles.forEach((scriptFile) => {
    run(process.execPath, [scriptFile, "--help"], {
      cwd: repoRoot,
      env: withCliRuntimeEnv(process.env, runtime.cliDir, runtime),
    });
  });
}

function runTargetedSmokeChecks(skillDirs, runtime) {
  let count = 0;
  const selectedSkills = new Set(
    skillDirs.map((skillDir) => path.basename(skillDir)),
  );

  targetedSmokeChecks.forEach((check) => {
    if (!selectedSkills.has(check.skill)) {
      return;
    }

    const scriptFile = path.join(repoRoot, check.script);
    if (!existsSync(scriptFile)) {
      fail(
        `Targeted smoke script is missing for ${check.description}: ${check.script}`,
      );
    }

    run(process.execPath, [scriptFile, ...check.args], {
      cwd: repoRoot,
      env: withCliRuntimeEnv(process.env, runtime.cliDir, runtime),
    });
    count += 1;
  });

  return count;
}

function runDocGuards() {
  docGuards.forEach((guard) => {
    const filePath = path.join(repoRoot, guard.file);
    if (!existsSync(filePath)) {
      fail(`Guarded file is missing: ${guard.file}`);
    }
    const text = readFileSync(filePath, "utf8");
    if (guard.pattern.test(text)) {
      fail(`${guard.message} (${guard.file})`);
    }
  });
}

function runRequiredDocPatterns() {
  requiredDocPatterns.forEach((guard) => {
    const filePath = path.join(repoRoot, guard.file);
    if (!existsSync(filePath)) {
      fail(`Required-doc file is missing: ${guard.file}`);
    }
    const text = readFileSync(filePath, "utf8");
    if (!guard.pattern.test(text)) {
      fail(`${guard.message} (${guard.file})`);
    }
  });
}

function collectRepoDocFiles(rootDir) {
  const sanitizedEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !gitRepositoryLocationEnvNames.has(name.toUpperCase()),
    ),
  );
  const result = spawnSync("git", ["-C", rootDir, "ls-files", "-z", "--", "*.md"], {
    cwd: rootDir,
    env: sanitizedEnv,
    stdio: "pipe",
    encoding: "utf8",
    shell: false,
  });
  if (result.error) {
    fail(`Cannot inventory root Git-tracked Markdown: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || `exit code ${result.status}`;
    fail(`Cannot inventory root Git-tracked Markdown: ${detail}`);
  }

  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((relativePath) => path.join(rootDir, relativePath));
}

function runRepoWideDocGuards() {
  const docFiles = collectRepoDocFiles(repoRoot);

  repoWideDocGuards.forEach((guard) => {
    docFiles.forEach((filePath) => {
      const text = readFileSync(filePath, "utf8");
      if (guard.pattern.test(text)) {
        fail(`${guard.message} (${path.relative(repoRoot, filePath)})`);
      }
    });
  });
}

function main() {
  const { runtime, targets } = parseArgs(process.argv.slice(2));
  runDocGuards();
  runRepoWideDocGuards();
  runRequiredDocPatterns();

  const skillDirs = (targets.length ? targets : defaultSkillNames)
    .map((target) => normalizeSkillTarget(target))
    .sort((left, right) => left.localeCompare(right));
  const skillPlans = skillDirs.map((skillDir) => ({
    skillDir,
    scriptFiles: collectWrapperScripts(skillDir),
  }));
  let scriptCount = 0;
  skillPlans.forEach(({ skillDir, scriptFiles }) => {
    assertSkillFrontmatter(skillDir);
    assertAgentMetadata(skillDir);
    scriptCount += scriptFiles.length;
    runNodeChecks(scriptFiles);
    runHelpSmoke(scriptFiles, runtime);
  });
  const targetedSmokeCount = runTargetedSmokeChecks(skillDirs, runtime);

  console.log(
    `Validated ${skillDirs.length} skill directories, ${scriptCount} wrapper scripts, ${targetedSmokeCount} targeted smokes, ${docGuards.length} negative doc guards, ${repoWideDocGuards.length} repo-wide doc guards, and ${requiredDocPatterns.length} required doc patterns.`,
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}
