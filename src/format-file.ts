import { readFileSync, writeFileSync } from 'node:fs';

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
