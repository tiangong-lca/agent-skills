import { spawnSync } from 'node:child_process';
import process from 'node:process';
import {
  normalizeCliRuntimeArgs as normalizeDevelopmentArgs,
  buildTiangongInvocation as buildDevelopmentInvocation,
  executeTiangongCommand as executeDevelopmentCommand,
  withCliRuntimeEnv as developmentRuntimeEnv,
  missingCliMessage,
} from './cli-development.mjs';
import { installedInvocation } from './cli-installed.mjs';
import { commandInvocation } from './cli-command.mjs';

// Retain the explicit source-development contract.
export {
  expectedNodeVersion, expectedPnpmVersion, expectedTidasSpecSource,
  localCliCandidateSchema,
  assertSupportedToolchain, assertTidasSpecSourceManifest, inspectLocalCliCandidate,
  renderShellCommand,
} from './cli-development.mjs';

const installedFlags = new Map([
  ['--cli-installation', ['cliInstallation', 'TIANGONG_LCA_CLI_INSTALLATION']],
  ['--cli-runtime-expectation-file', ['cliRuntimeExpectationFile', 'TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_FILE']],
  ['--cli-runtime-expectation-sha256', ['cliRuntimeExpectationSha256', 'TIANGONG_LCA_CLI_RUNTIME_EXPECTATION_SHA256']],
]);

export function normalizeCliRuntimeArgs(rawArgs, options = {}) {
  const env = options.env ?? process.env;
  if (env.TIANGONG_LCA_CLI_MODE === 'published' || rawArgs.some((arg) => arg.split('=', 1)[0] === '--published-cli')) {
    throw new Error('Published CLI selection has been removed. Remove --published-cli / TIANGONG_LCA_CLI_MODE=published and configure the installed CLI entry.');
  }
  const filtered = [];
  const explicit = {};
  let selected = null;
  let cliCommand = env.TIANGONG_LCA_CLI_COMMAND?.trim() || null;
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const flag = arg.split('=', 1)[0];
    if (flag === '--cli-command') {
      const value = arg === flag ? rawArgs[++index] : arg.slice(flag.length + 1);
      if (!value?.trim() || value.startsWith('--')) throw new Error('--cli-command requires an executable path or command name');
      cliCommand = value.trim();
      selected = 'command';
      continue;
    }
    const installed = installedFlags.get(flag);
    if (installed) {
      const value = arg === flag ? rawArgs[++index] : arg.slice(flag.length + 1);
      if (!value?.trim() || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      explicit[installed[0]] = value.trim();
      if (flag === '--cli-installation') selected = 'installed';
      continue;
    }
    if (['--cli-dir', '--cli-candidate-file', '--cli-candidate-sha256'].includes(flag)) {
      const value = arg === flag ? rawArgs[++index] : arg.slice(flag.length + 1);
      if (!value?.trim() || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      if (flag === '--cli-dir') selected = 'development';
      filtered.push(`${flag}=${value}`);
    } else filtered.push(arg);
  }
  const installed = {};
  for (const [key, variable] of installedFlags.values()) {
    installed[key] = explicit[key] ?? env[variable]?.trim() ?? null;
  }
  if (selected === 'command') {
    const args = filtered.filter((arg) => !['--cli-dir=', '--cli-candidate-file=', '--cli-candidate-sha256='].some((prefix) => arg.startsWith(prefix)));
    return { args, cliDir: null, cliCommand, cliSelectionSource: 'explicit' };
  }
  if (selected === null && cliCommand && (Object.values(installed).some(Boolean) || env.TIANGONG_LCA_CLI_DIR?.trim())) {
    throw new Error('Conflicting CLI selections. Select --cli-command, --cli-installation or --cli-dir explicitly.');
  }
  const inherited = selected === null &&
    Object.values(installed).some(Boolean);
  if (inherited && env.TIANGONG_LCA_CLI_DIR?.trim()) {
    throw new Error('Both installed and development CLI environments are configured. Select one explicitly; no implicit precedence or fallback is allowed.');
  }
  if (selected === 'installed' || inherited) {
    // An explicit installation cannot accidentally inherit another installation's qualification.
    if (explicit.cliInstallation && explicit.cliInstallation !== env.TIANGONG_LCA_CLI_INSTALLATION?.trim()) {
      installed.cliRuntimeExpectationFile = explicit.cliRuntimeExpectationFile ?? null;
      installed.cliRuntimeExpectationSha256 = explicit.cliRuntimeExpectationSha256 ?? null;
    }
    if (Object.values(installed).some((value) => !value)) {
      throw new Error('Installed CLI selection requires installation, runtime expectation file and independently trusted expectation SHA-256 together.');
    }
    // The installed path consumes source-selection flags without validating source evidence.
    const args = [];
    for (let index = 0; index < filtered.length; index += 1) {
      const flag = filtered[index].split('=', 1)[0];
      if (['--cli-dir', '--cli-candidate-file', '--cli-candidate-sha256'].includes(flag)) {
        if (filtered[index] === flag) index += 1;
      } else args.push(filtered[index]);
    }
    return { args, cliDir: null, cliCandidateFile: null, cliCandidateSha256: null,
      ...installed, cliSelectionSource: selected === 'installed' ? 'explicit' : 'environment' };
  }
  if (selected === null && Object.keys(explicit).length) {
    throw new Error('Runtime expectation flags require --cli-installation or an installed CLI environment.');
  }
  const runtime = normalizeDevelopmentArgs(filtered, options);
  return runtime.cliDir ? runtime : { ...runtime, cliCommand: cliCommand || 'tiangong-lca', cliSelectionSource: cliCommand ? 'environment' : 'path' };
}

export function buildTiangongInvocation(args, options = {}) {
  if (options.cliInstallation) return installedInvocation(args, options);
  if (options.cliDir) return buildDevelopmentInvocation(args, options);
  if (options.cliCandidateFile || options.cliCandidateSha256) throw new Error('Candidate qualification requires --cli-dir; no command was attempted.');
  return commandInvocation(args, options);
}

export function executeTiangongCommand(args, options = {}) {
  if (options.cliDir && !options.cliInstallation) return executeDevelopmentCommand(args, options);
  const invocation = buildTiangongInvocation(args, options);
  const result = (options.spawnImpl ?? spawnSync)(invocation.command, invocation.args, {
    ...options.spawnOptions, stdio: 'pipe', encoding: 'utf8', shell: false,
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') throw new Error(`${missingCliMessage} Selected command: ${invocation.command}`);
    throw new Error(`Failed to execute TianGong CLI: ${result.error.message}`);
  }
  return { invocation, status: result.status, signal: result.signal,
    stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

export function runTiangongCommand(args, options = {}) {
  const result = executeTiangongCommand(args, options);
  if (result.stdout) (options.stdoutWrite ?? ((text) => process.stdout.write(text)))(result.stdout);
  if (result.stderr) (options.stderrWrite ?? ((text) => process.stderr.write(text)))(result.stderr);
  if (typeof result.status === 'number') return result.status;
  if (result.signal) throw new Error(`TianGong CLI terminated with signal ${result.signal}.`);
  return 1;
}

export function withCliRuntimeEnv(baseEnv, cliDir, options = {}) {
  const env = developmentRuntimeEnv(baseEnv, cliDir, options);
  for (const [, variable] of installedFlags.values()) delete env[variable];
  delete env.TIANGONG_LCA_CLI_COMMAND;
  if (!options.cliInstallation && !cliDir && options.cliCommand && options.cliCommand !== 'tiangong-lca') env.TIANGONG_LCA_CLI_COMMAND = options.cliCommand;
  if (options.cliInstallation) {
    delete env.TIANGONG_LCA_CLI_MODE;
    delete env.TIANGONG_LCA_CLI_DIR;
    for (const [key, variable] of installedFlags.values()) env[variable] = options[key];
  }
  return env;
}

export function renderCliRuntimeHelp(rawArgs = process.argv.slice(2), options = {}) {
  const selected = normalizeCliRuntimeArgs(rawArgs, options);
  if (selected.cliInstallation) return `configured installation ${selected.cliInstallation} (${selected.cliSelectionSource}); inspect with scripts/run-cli.mjs --runtime-info`;
  if (selected.cliDir) return `explicit development checkout ${selected.cliDir}`;
  return `Uses ${selected.cliCommand || 'tiangong-lca'} from PATH by default. Optional --cli-command <executable> selects another command. If missing, follow https://github.com/tiangong-lca/cli#readme. Ordinary calls require no runtime expectation file or digest.`;
}
