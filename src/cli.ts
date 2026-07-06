#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ParseError } from './core/parse.js';
import { checkFile, diffFile, formatFile } from './format-file.js';

/** The file pkgsort operates on when no path is given on the command line. */
const DEFAULT_FILE = 'package.json';

/** Exit codes, per `docs/ARCHITECTURE.md` §7. */
const EXIT_OK = 0;
const EXIT_DRIFT = 1;
const EXIT_USAGE = 2;
const EXIT_PARSE = 3;

const HELP_TEXT = `Usage: pkgsort [--check [--diff]] [path]

Sort the top-level keys of a package.json into a canonical order, in place.
When no path is given, pkgsort targets package.json in the current directory.

Options:
      --check    Verify the file is already sorted without modifying it.
                 Exits 0 if sorted, 1 if not.
      --diff     With --check, print a unified diff of the changes that would
                 be made instead of a message. Has no effect without --check.
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
  diff: boolean;
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
  const parsed: ParsedArgs = {
    help: false,
    version: false,
    check: false,
    diff: false,
    positionals: [],
  };
  for (const arg of args) {
    if (arg === '-h' || arg === '--help') parsed.help = true;
    else if (arg === '-v' || arg === '--version') parsed.version = true;
    else if (arg === '--check') parsed.check = true;
    else if (arg === '--diff') parsed.diff = true;
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
  const { help, version, check, diff, positionals } = parseArgs(argv.slice(2));

  if (help) {
    process.stdout.write(`${HELP_TEXT}\n`);
    return EXIT_OK;
  }
  if (version) {
    process.stdout.write(`${readVersion()}\n`);
    return EXIT_OK;
  }

  // When no path is given, default to package.json in the current directory. A
  // missing default file then falls through to the same read-error path (and
  // exit code) as an explicit missing path.
  const filePath = positionals[0] ?? DEFAULT_FILE;

  try {
    if (check) {
      // `--diff` only refines check mode: it prints a unified patch of the
      // changes that would be made instead of the drift message. It never
      // writes, exactly like a plain `--check`.
      if (diff) {
        const { changed, diff: patch } = diffFile(filePath);
        if (changed) {
          process.stdout.write(patch);
          return EXIT_DRIFT;
        }
        process.stdout.write(`${filePath} is already sorted\n`);
        return EXIT_OK;
      }

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
