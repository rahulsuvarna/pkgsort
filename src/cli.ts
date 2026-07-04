#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ParseError } from './core/parse.js';
import { formatFile } from './format-file.js';

/** Exit codes, per `docs/ARCHITECTURE.md` §7. */
const EXIT_OK = 0;
const EXIT_USAGE = 2;
const EXIT_PARSE = 3;

const HELP_TEXT = `Usage: pkgsort <path-to-package.json>

Sort the top-level keys of a package.json into a canonical order, in place.

Options:
  -h, --help     Print this help and exit.
  -v, --version  Print the version number and exit.`;

/** Read this package's version from its own package.json at runtime. */
function readVersion(): string {
  const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
  return pkg.version;
}

/**
 * The CLI shell: parse argv, format the target file, and translate the outcome
 * into a process exit code. All formatting logic lives in the pure core; this
 * layer only handles process concerns.
 */
function main(argv: readonly string[]): number {
  const arg = argv[2];

  if (arg === '-h' || arg === '--help') {
    process.stdout.write(`${HELP_TEXT}\n`);
    return EXIT_OK;
  }
  if (arg === '-v' || arg === '--version') {
    process.stdout.write(`${readVersion()}\n`);
    return EXIT_OK;
  }

  if (arg === undefined || arg === '') {
    process.stderr.write(`${HELP_TEXT}\n`);
    return EXIT_USAGE;
  }

  const filePath = arg;
  try {
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

process.exit(main(process.argv));
