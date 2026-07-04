/**
 * Shared internal types.
 *
 * These describe the data that flows through the pure core; they are not a
 * published, stable API (see `docs/ARCHITECTURE.md` §8).
 */

/**
 * The whitespace style detected from — and re-applied to — a `package.json`.
 * We record the original detail so the serializer can reproduce it and so we
 * can report `changed` accurately.
 */
export interface Style {
  /** The literal indentation of one level, e.g. `"  "`, `"    "`, or `"\t"`. */
  indent: string;
  /** Whether the original file ended with a trailing newline. */
  trailingNewline: boolean;
}

/** The result of formatting a single `package.json` document. */
export interface FormatResult {
  /** The formatted text. */
  output: string;
  /** `true` when {@link FormatResult.output} differs from the input. */
  changed: boolean;
}
