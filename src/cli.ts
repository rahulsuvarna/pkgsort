#!/usr/bin/env node
import { ParseError } from './core/parse.js';
import { formatFile } from './format-file.js';

/** Exit codes, per `docs/ARCHITECTURE.md` §7. */
const EXIT_OK = 0;
const EXIT_USAGE = 2;
const EXIT_PARSE = 3;

/**
 * The CLI shell: parse argv, format the target file, and translate the outcome
 * into a process exit code. All formatting logic lives in the pure core; this
 * layer only handles process concerns.
 */
function main(argv: readonly string[]): number {
  const filePath = argv[2];
  if (filePath === undefined || filePath === '') {
    process.stderr.write('Usage: pkgsort <path-to-package.json>\n');
    return EXIT_USAGE;
  }

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
