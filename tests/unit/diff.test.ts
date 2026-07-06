import { describe, expect, it } from 'vitest';

import { unifiedDiff } from '../../src/core/diff.js';

describe('unifiedDiff', () => {
  it('returns an empty string when the texts are identical', () => {
    const text = '{\n  "name": "demo"\n}\n';
    expect(unifiedDiff(text, text, 'package.json')).toBe('');
  });

  it('returns an empty string when only a trailing newline differs', () => {
    // toLines() treats a single trailing newline as a terminator, so these are
    // line-for-line identical and produce no diff.
    expect(unifiedDiff('{}', '{}\n', 'package.json')).toBe('');
  });

  it('emits file headers and a hunk for a reordering', () => {
    const before = '{\n  "version": "1.0.0",\n  "name": "demo"\n}\n';
    const after = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
    const diff = unifiedDiff(before, after, 'package.json');

    expect(diff).toBe(
      [
        '--- a/package.json',
        '+++ b/package.json',
        '@@ -1,4 +1,4 @@',
        ' {',
        '-  "version": "1.0.0",',
        '-  "name": "demo"',
        '+  "name": "demo",',
        '+  "version": "1.0.0"',
        ' }',
        '',
      ].join('\n'),
    );
  });

  it('keeps unchanged lines as context and marks additions', () => {
    const before = '{\n  "a": 1\n}\n';
    const after = '{\n  "a": 1,\n  "b": 2\n}\n';
    const diff = unifiedDiff(before, after, 'package.json');

    expect(diff).toContain(' {'); // context line
    expect(diff).toContain('+  "b": 2');
    expect(diff.endsWith('\n')).toBe(true);
  });

  it('marks removed trailing lines with a leading minus', () => {
    const before = '{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}\n';
    const after = '{\n  "a": 1\n}\n';
    const diff = unifiedDiff(before, after, 'package.json');

    expect(diff).toContain('-  "b": 2,');
    expect(diff).toContain('-  "c": 3');
    expect(diff).toContain('@@');
  });

  it('produces separate hunks for changes far apart', () => {
    const before = `a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk`;
    const after = `X\nb\nc\nd\ne\nf\ng\nh\ni\nj\nY`;
    const diff = unifiedDiff(before, after, 'file');
    const hunks = diff.split('\n').filter((line) => line.startsWith('@@'));
    expect(hunks).toHaveLength(2);
  });
});
