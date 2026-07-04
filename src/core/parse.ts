import type { Style } from '../types.js';

/**
 * Thrown when input cannot be parsed as a `package.json` object. The CLI shell
 * maps this to exit code `3` (see `docs/ARCHITECTURE.md` §7).
 */
export class ParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ParseError';
  }
}

/**
 * Parse `input` into a plain object plus its detected whitespace {@link Style}.
 *
 * This is the "read" stage of the pipeline: it is pure and never touches the
 * filesystem. On malformed JSON — or valid JSON that is not a top-level object
 * — it throws a {@link ParseError}.
 */
export function parse(input: string): { data: Record<string, unknown>; style: Style } {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ParseError(`Invalid JSON: ${detail}`, { cause: error });
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new ParseError('Expected a JSON object at the top level of package.json');
  }

  return {
    data: data as Record<string, unknown>,
    style: {
      indent: detectIndent(input),
      trailingNewline: input.endsWith('\n'),
    },
  };
}

/**
 * Detect the indentation of one level from the raw text by inspecting the
 * leading whitespace of the first indented line. Falls back to two spaces —
 * the ecosystem default — when the document has no indented lines (e.g. it is
 * written on a single line).
 */
function detectIndent(input: string): string {
  const match = /\r?\n([ \t]+)\S/.exec(input);
  return match?.[1] ?? '  ';
}
