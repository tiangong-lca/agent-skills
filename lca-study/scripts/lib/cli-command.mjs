import { accessSync, constants, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function isFile(file) {
  try { return statSync(file).isFile(); } catch { return false; }
}

// Windows cannot spawn a package-manager .cmd shim without a shell. Resolve its
// Node entry instead, keeping user argv out of cmd.exe. No package identity lock.
function windowsNodeShim(file) {
  const source = readFileSync(file, 'utf8');
  const targets = [...source.matchAll(/"(?:%~dp0|%dp0%)[\\/]([^"\r\n]+\.(?:mjs|cjs|js))"\s+%\*/giu)]
    .map((match) => path.resolve(path.dirname(file), match[1]));
  const unique = [...new Set(targets)];
  if (unique.length !== 1 || !isFile(unique[0])) {
    throw new Error(`Cannot resolve the Node entry for ${file}. Use --cli-command with the CLI .exe or JavaScript entry path.`);
  }
  const adjacentNode = path.join(path.dirname(file), 'node.exe');
  return { command: isFile(adjacentNode) ? adjacentNode : process.execPath, prefix: [unique[0]] };
}

export function commandInvocation(args, options = {}) {
  const selected = options.cliCommand || 'tiangong-lca';
  const env = options.spawnOptions?.env ?? process.env;
  const platform = options.platform ?? process.platform;
  let command = selected;
  let prefix = [];
  if (platform === 'win32') {
    const pathValue = Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
    const explicitPath = path.isAbsolute(selected) || /[\\/]/u.test(selected);
    const directories = explicitPath ? [''] : pathValue.split(';').filter(Boolean);
    const extensions = path.extname(selected) ? [''] : ['.exe', '.com', '.cmd', '.bat'];
    const found = directories.flatMap((dir) => extensions.map((extension) =>
      path.resolve(dir.replace(/^"|"$/gu, ''), selected + extension))).find(isFile);
    if (found) {
      command = found;
      if (/\.(cmd|bat)$/iu.test(found)) ({ command, prefix } = windowsNodeShim(found));
      else if (/\.(mjs|cjs|js)$/iu.test(found)) { command = process.execPath; prefix = [found]; }
    }
  } else if (/\.(mjs|cjs|js)$/iu.test(selected) && /[\/]/u.test(selected)) {
    // Explicit public Node entry is useful when a package-manager shim is absent.
    accessSync(selected, constants.R_OK);
    command = process.execPath;
    prefix = [path.resolve(selected)];
  }
  return { mode: 'command', command, args: [...prefix, ...args],
    selectionSource: options.cliSelectionSource ?? (options.cliCommand ? 'explicit' : 'path') };
}
