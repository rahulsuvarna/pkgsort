#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ParseError } from './core/parse.js';
import { checkFile, formatFile } from './format-file.js';

/** Exit codes, per `docs/ARCHITECTURE.md` §7. */
const EXIT_OK = 0;
const EXIT_DRIFT = 1;
const EXIT_USAGE = 2;
const EXIT_PARSE = 3;

const HELP_TEXT = `Usage: pkgsort [--check] <path-to-package.json>

Sort the top-level keys of a package.json into a canonical order, in place.

Options:
      --check    Verify the file is already sorted without modifying it.
                 Exits 0 if sorted, 1 if not.
  -h, --help     Print this help and exit.
  -v, --version  Print the version number and exit.`;

/** Read this package's version from its own package.json at runtime. */
function readVersion(): string {
  const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
  return pkg.version;
}

/** The result of separating recognized flags from positional arguments. */
interface ParsedArgs {
  help: boolean;
  version: boolean;
  check: boolean;
  positionals: string[];
}

/**
 * Split argv (excluding `node` and the script path) into recognized flags and
 * positional arguments. Flags may appear in any position, so `--check` before
 * or after the file path is equivalent. Unrecognized tokens are treated as
 * positionals, preserving the previous behaviour where a bad flag surfaces as a
 * file-not-found error.
 */
function parseArgs(args: readonly string[]): ParsedArgs {
  const parsed: ParsedArgs = { help: false, version: false, check: false, positionals: [] };
  for (const arg of args) {
    if (arg === '-h' || arg === '--help') parsed.help = true;
    else if (arg === '-v' || arg === '--version') parsed.version = true;
    else if (arg === '--check') parsed.check = true;
    else parsed.positionals.push(arg);
  }
  return parsed;
}

/**
 * The CLI shell: parse argv, format or check the target file, and translate the
 * outcome into a process exit code. All formatting logic lives in the pure
 * core; this layer only handles process concerns.
 */
export function main(argv: readonly string[]): number {
  const { help, version, check, positionals } = parseArgs(argv.slice(2));

  if (help) {
    process.stdout.write(`${HELP_TEXT}\n`);
    return EXIT_OK;
  }
  if (version) {
    process.stdout.write(`${readVersion()}\n`);
    return EXIT_OK;
  }

  const filePath = positionals[0];
  if (filePath === undefined || filePath === '') {
    process.stderr.write(`${HELP_TEXT}\n`);
    return EXIT_USAGE;
  }

  try {
    if (check) {
      const { changed } = checkFile(filePath);
      if (changed) {
        process.stderr.write(`${filePath} is not sorted. Run \`pkgsort ${filePath}\` to fix it.\n`);
        return EXIT_DRIFT;
      }
      process.stdout.write(`${filePath} is already sorted\n`);
      return EXIT_OK;
    }

    const { changed } = formatFile(filePath);
    process.stdout.write(changed ? `Sorted ${filePath}\n` : `${filePath} is already sorted\n`);
    return EXIT_OK;
  } catch (error) {
    if (error instanceof ParseError) {
      process.stderr.write(`${error.message}\n`);
      return EXIT_PARSE;
    }
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      process.stderr.write(`File not found: ${filePath}\n`);
      return EXIT_USAGE;
    }
    process.stderr.write(`pkgsort: ${err.message}\n`);
    return EXIT_USAGE;
  }
}

/* c8 ignore start -- process wiring, exercised via the built binary, not unit tests. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv));
}
/* c8 ignore stop */
