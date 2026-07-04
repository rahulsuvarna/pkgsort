import type { FormatResult } from '../types.js';
import { sortTopLevelKeys } from '../sorters/top-level-keys.js';
import { parse } from './parse.js';
import { serialize } from './serialize.js';

/**
 * The pure formatting pipeline: **parse → sort → serialize**.
 *
 * Given the text of a `package.json`, return the formatted text and whether it
 * differs from the input. Throws {@link ParseError} on invalid input. This
 * function performs no I/O and is fully deterministic.
 */
export function format(input: string): FormatResult {
  const { data, style } = parse(input);
  const sorted = sortTopLevelKeys(data);
  const output = serialize(sorted, style);
  return { output, changed: output !== input };
}
