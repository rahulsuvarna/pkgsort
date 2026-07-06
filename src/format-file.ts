import { readFileSync, writeFileSync } from 'node:fs';

import { unifiedDiff } from './core/diff.js';
import { format } from './core/pipeline.js';

/**
 * Read a `package.json` from disk, format it, and write it back in place when
 * it changed.
 *
 * This is the thin effectful shell around the pure {@link format} core: it owns
 * the file I/O so the core stays deterministic and testable. Errors from
 * reading (e.g. a missing file) and parsing ({@link ParseError}) propagate to
 * the caller, which maps them to exit codes.
 */
export function formatFile(filePath: string): { changed: boolean } {
  const input = readFileSync(filePath, 'utf8');
  const { output, changed } = format(input);
  if (changed) {
    writeFileSync(filePath, output, 'utf8');
  }
  return { changed };
}

/**
 * Read a `package.json` from disk and report whether it is already in canonical
 * order, **without writing anything back**.
 *
 * This backs the CLI's `--check` mode. It runs the same pure {@link format}
 * pipeline as {@link formatFile} — so the two can never disagree about what
 * "sorted" means — but deliberately performs no write. `changed === false`
 * means the file is already correctly sorted. Read and parse errors propagate
 * exactly as they do for {@link formatFile}.
 */
export function checkFile(filePath: string): { changed: boolean } {
  const input = readFileSync(filePath, 'utf8');
  const { changed } = format(input);
  return { changed };
}

/**
 * Read a `package.json`, run the formatter, and report whether it would change
 * along with a unified diff of that change — **without writing anything back**.
 *
 * Backs the CLI's `--check --diff` mode. Like {@link checkFile} it never writes;
 * the returned `diff` is empty when the file is already sorted. Read and parse
 * errors propagate exactly as they do for {@link formatFile}.
 */
export function diffFile(filePath: string): { changed: boolean; diff: string } {
  const input = readFileSync(filePath, 'utf8');
  const { output, changed } = format(input);
  const diff = changed ? unifiedDiff(input, output, filePath) : '';
  return { changed, diff };
}
