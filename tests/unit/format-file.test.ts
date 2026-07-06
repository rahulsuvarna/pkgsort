import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ParseError } from '../../src/core/parse.js';
import { checkFile, diffFile, formatFile } from '../../src/format-file.js';

describe('formatFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pkgsort-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const writeFixture = (contents: string): string => {
    const file = join(dir, 'package.json');
    writeFileSync(file, contents, 'utf8');
    return file;
  };

  it('sorts a file in place and reports the change', () => {
    const file = writeFixture('{\n  "version": "1.0.0",\n  "name": "demo"\n}\n');
    const { changed } = formatFile(file);
    expect(changed).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe('{\n  "name": "demo",\n  "version": "1.0.0"\n}\n');
  });

  it('leaves an already-sorted file byte-for-byte unchanged', () => {
    const sorted = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
    const file = writeFixture(sorted);
    const { changed } = formatFile(file);
    expect(changed).toBe(false);
    expect(readFileSync(file, 'utf8')).toBe(sorted);
  });

  it('preserves four-space indentation on disk', () => {
    const file = writeFixture('{\n    "version": "1.0.0",\n    "name": "demo"\n}\n');
    formatFile(file);
    expect(readFileSync(file, 'utf8')).toBe('{\n    "name": "demo",\n    "version": "1.0.0"\n}\n');
  });

  it('throws when the file does not exist', () => {
    const missing = join(dir, 'does-not-exist.json');
    expect(() => formatFile(missing)).toThrow();
    try {
      formatFile(missing);
    } catch (error) {
      expect((error as NodeJS.ErrnoException).code).toBe('ENOENT');
    }
  });

  it('throws ParseError when the file is not valid JSON', () => {
    const file = writeFixture('{ not valid json');
    expect(() => formatFile(file)).toThrow(ParseError);
  });

  describe('checkFile', () => {
    it('reports no change for an already-sorted file', () => {
      const sorted = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
      const file = writeFixture(sorted);
      expect(checkFile(file)).toEqual({ changed: false });
    });

    it('reports a change for an unsorted file', () => {
      const file = writeFixture('{\n  "version": "1.0.0",\n  "name": "demo"\n}\n');
      expect(checkFile(file)).toEqual({ changed: true });
    });

    it('never modifies the file, sorted or not', () => {
      const unsorted = '{\n  "version": "1.0.0",\n  "name": "demo"\n}\n';
      const file = writeFixture(unsorted);
      checkFile(file);
      expect(readFileSync(file, 'utf8')).toBe(unsorted);
    });

    it('throws when the file does not exist', () => {
      const missing = join(dir, 'does-not-exist.json');
      try {
        checkFile(missing);
        expect.unreachable('checkFile should have thrown');
      } catch (error) {
        expect((error as NodeJS.ErrnoException).code).toBe('ENOENT');
      }
    });

    it('throws ParseError when the file is not valid JSON', () => {
      const file = writeFixture('{ not valid json');
      expect(() => checkFile(file)).toThrow(ParseError);
    });
  });

  describe('diffFile', () => {
    it('returns changed=true and a unified diff for an unsorted file', () => {
      const file = writeFixture('{\n  "version": "1.0.0",\n  "name": "demo"\n}\n');
      const { changed, diff } = diffFile(file);
      expect(changed).toBe(true);
      expect(diff).toContain('--- a/');
      expect(diff).toContain('+++ b/');
      expect(diff).toContain('@@');
    });

    it('returns changed=false and an empty diff for a sorted file', () => {
      const sorted = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
      const file = writeFixture(sorted);
      expect(diffFile(file)).toEqual({ changed: false, diff: '' });
    });

    it('never modifies the file', () => {
      const unsorted = '{\n  "version": "1.0.0",\n  "name": "demo"\n}\n';
      const file = writeFixture(unsorted);
      diffFile(file);
      expect(readFileSync(file, 'utf8')).toBe(unsorted);
    });

    it('throws ParseError when the file is not valid JSON', () => {
      const file = writeFixture('{ not valid json');
      expect(() => diffFile(file)).toThrow(ParseError);
    });
  });
});
