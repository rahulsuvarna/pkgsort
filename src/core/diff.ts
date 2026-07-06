/**
 * Minimal unified-diff generator for the CLI's `--check --diff` mode.
 *
 * pkgsort ships with no runtime dependencies, so this implements just enough of
 * the unified diff format to render a human-readable patch: a longest-common-
 * subsequence line diff grouped into hunks with a few lines of surrounding
 * context. It is not a general-purpose diff library — it only needs to describe
 * the small, in-place reorderings pkgsort produces for a single `package.json`.
 */

/** Lines of unchanged context kept around each change when building a hunk. */
const CONTEXT_LINES = 3;

type Tag = 'eq' | 'del' | 'ins';

interface LineOp {
  tag: Tag;
  text: string;
  /** 1-based line number in the "before" text; `0` for inserted lines. */
  aLine: number;
  /** 1-based line number in the "after" text; `0` for deleted lines. */
  bLine: number;
}

/** Split text into lines, treating a single trailing newline as a terminator. */
function toLines(text: string): string[] {
  return text.endsWith('\n') ? text.slice(0, -1).split('\n') : text.split('\n');
}

/** The unified-diff line prefix for an op's tag. */
function markerFor(tag: Tag): string {
  if (tag === 'del') return '-';
  if (tag === 'ins') return '+';
  return ' ';
}

/** Diff two line arrays into a sequence of equal / deleted / inserted ops. */
function diffLineOps(a: readonly string[], b: readonly string[]): LineOp[] {
  const n = a.length;
  const m = b.length;

  // Read helpers keep `noUncheckedIndexedAccess` honest: every index below is
  // in bounds, so the `??` fallbacks are never taken at runtime.
  const line = (arr: readonly string[], k: number): string => arr[k] ?? '';

  // lcs is an (n+1)×(m+1) table stored flat; cell(i, j) is the length of the
  // longest common subsequence of a[i..] and b[j..].
  const width = m + 1;
  const lcs = new Array<number>((n + 1) * width).fill(0);
  const cell = (i: number, j: number): number => lcs[i * width + j] ?? 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const same = line(a, i) === line(b, j);
      lcs[i * width + j] = same ? cell(i + 1, j + 1) + 1 : Math.max(cell(i + 1, j), cell(i, j + 1));
    }
  }

  const ops: LineOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (line(a, i) === line(b, j)) {
      ops.push({ tag: 'eq', text: line(a, i), aLine: i + 1, bLine: j + 1 });
      i++;
      j++;
    } else if (cell(i + 1, j) >= cell(i, j + 1)) {
      ops.push({ tag: 'del', text: line(a, i), aLine: i + 1, bLine: 0 });
      i++;
    } else {
      ops.push({ tag: 'ins', text: line(b, j), aLine: 0, bLine: j + 1 });
      j++;
    }
  }
  while (i < n) {
    ops.push({ tag: 'del', text: line(a, i), aLine: i + 1, bLine: 0 });
    i++;
  }
  while (j < m) {
    ops.push({ tag: 'ins', text: line(b, j), aLine: 0, bLine: j + 1 });
    j++;
  }
  return ops;
}

/**
 * Produce a unified diff between `before` and `after`, labelled with `path`.
 * Returns an empty string when the two texts are line-for-line identical.
 */
export function unifiedDiff(before: string, after: string, path: string): string {
  if (before === after) return '';

  const ops = diffLineOps(toLines(before), toLines(after));

  // Indices of changed ops, used to grow hunks with surrounding context.
  const changedIndices = ops.reduce<number[]>((acc, op, index) => {
    if (op.tag !== 'eq') acc.push(index);
    return acc;
  }, []);
  if (changedIndices.length === 0) return '';

  // Grow each change into a range of ±context lines, merging adjacent ranges.
  const hunks: { start: number; end: number }[] = [];
  for (const index of changedIndices) {
    const start = Math.max(0, index - CONTEXT_LINES);
    const end = Math.min(ops.length - 1, index + CONTEXT_LINES);
    const last = hunks[hunks.length - 1];
    if (last && start <= last.end + 1) {
      last.end = Math.max(last.end, end);
    } else {
      hunks.push({ start, end });
    }
  }

  const out: string[] = [`--- a/${path}`, `+++ b/${path}`];
  for (const { start, end } of hunks) {
    const seg = ops.slice(start, end + 1);
    // Line numbers are sequential, so a hunk's start line is the count of
    // preceding lines on that side plus one — computed without index reads.
    const prefix = ops.slice(0, start);
    const aStart = prefix.filter((op) => op.tag !== 'ins').length + 1;
    const bStart = prefix.filter((op) => op.tag !== 'del').length + 1;
    const aCount = seg.filter((op) => op.tag !== 'ins').length;
    const bCount = seg.filter((op) => op.tag !== 'del').length;
    out.push(`@@ -${String(aStart)},${String(aCount)} +${String(bStart)},${String(bCount)} @@`);
    for (const op of seg) {
      out.push(`${markerFor(op.tag)}${op.text}`);
    }
  }
  return `${out.join('\n')}\n`;
}
