import type { Style } from '../types.js';

/**
 * Serialize `data` to JSON text using the given whitespace {@link Style}.
 *
 * This is the "write" stage and the *only* place whitespace decisions are made,
 * so output is a pure function of the object plus its style. Line endings are
 * always `\n`; the trailing newline is reproduced from the detected style.
 */
export function serialize(data: Record<string, unknown>, style: Style): string {
  const json = JSON.stringify(data, null, style.indent);
  return style.trailingNewline ? `${json}\n` : json;
}
