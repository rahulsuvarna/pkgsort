import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from '../../src/cli.js';

/** A canonically-sorted document and its unsorted counterpart. */
const SORTED = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
const UNSORTED = '{\n  "version": "1.0.0",\n  "name": "demo"\n}\n';

describe('cli main', () => {
  let dir: string;
  let stdout: string;
  let stderr: string;
  let originalCwd: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pkgsort-cli-'));
    originalCwd = process.cwd();
    stdout = '';
    stderr = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      stdout += String(chunk);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      stderr += String(chunk);
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore cwd before removing the temp dir (a process cannot sit in a
    // directory being deleted, and some tests chdir into `dir`).
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  });

  const writeFixture = (contents: string): string => {
    const file = join(dir, 'package.json');
    writeFileSync(file, contents, 'utf8');
    return file;
  };

  /** Invoke `main` as the shell would: argv is `[node, script, ...args]`. */
  const run = (...args: string[]): number => main(['node', 'cli.js', ...args]);

  describe('--check mode', () => {
    it('exits 0 and reports success for an already-sorted file', () => {
      const file = writeFixture(SORTED);
      const code = run('--check', file);
      expect(code).toBe(0);
      expect(stdout).toContain('already sorted');
      expect(stderr).toBe('');
    });

    it('exits 1 and reports drift for an unsorted file', () => {
      const file = writeFixture(UNSORTED);
      const code = run('--check', file);
      expect(code).toBe(1);
      expect(stderr).toContain('not sorted');
    });

    it('does not modify a sorted file', () => {
      const file = writeFixture(SORTED);
      run('--check', file);
      expect(readFileSync(file, 'utf8')).toBe(SORTED);
    });

    it('does not modify an unsorted file (never writes in check mode)', () => {
      const file = writeFixture(UNSORTED);
      run('--check', file);
      expect(readFileSync(file, 'utf8')).toBe(UNSORTED);
    });

    it('accepts the flag before the filename', () => {
      const file = writeFixture(SORTED);
      expect(run('--check', file)).toBe(0);
    });

    it('accepts the flag after the filename', () => {
      const file = writeFixture(SORTED);
      expect(run(file, '--check')).toBe(0);
    });

    it('reports drift regardless of flag position', () => {
      const file = writeFixture(UNSORTED);
      expect(run('--check', file)).toBe(1);
      expect(run(file, '--check')).toBe(1);
      expect(readFileSync(file, 'utf8')).toBe(UNSORTED);
    });

    it('exits 3 on invalid JSON and does not modify the file', () => {
      const invalid = '{ not valid json';
      const file = writeFixture(invalid);
      const code = run('--check', file);
      expect(code).toBe(3);
      expect(stderr).toContain('Invalid JSON');
      expect(readFileSync(file, 'utf8')).toBe(invalid);
    });

    it('exits 2 when the file is missing', () => {
      const missing = join(dir, 'does-not-exist.json');
      const code = run('--check', missing);
      expect(code).toBe(2);
      expect(stderr).toContain('File not found');
    });
  });

  describe('default file (no path argument)', () => {
    it('sorts package.json in the current directory when no path is given', () => {
      writeFixture(UNSORTED);
      process.chdir(dir);
      const code = run();
      expect(code).toBe(0);
      expect(stdout).toContain('Sorted');
      expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(SORTED);
    });

    it('checks package.json in the current directory when no path is given', () => {
      writeFixture(SORTED);
      process.chdir(dir);
      const code = run('--check');
      expect(code).toBe(0);
      expect(stdout).toContain('already sorted');
      expect(stderr).toBe('');
    });

    it('reports drift for an unsorted default file in --check mode', () => {
      writeFixture(UNSORTED);
      process.chdir(dir);
      const code = run('--check');
      expect(code).toBe(1);
      expect(stderr).toContain('not sorted');
      expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(UNSORTED);
    });
  });

  describe('existing behaviour is preserved', () => {
    it('sorts a file in place without --check', () => {
      const file = writeFixture(UNSORTED);
      const code = run(file);
      expect(code).toBe(0);
      expect(stdout).toContain('Sorted');
      expect(readFileSync(file, 'utf8')).toBe(SORTED);
    });

    it('exits 2 when the default package.json is missing', () => {
      process.chdir(dir); // empty temp dir — no package.json present
      const code = run();
      expect(code).toBe(2);
      expect(stderr).toContain('File not found');
    });

    it('prints help and exits 0', () => {
      expect(run('--help')).toBe(0);
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('--check');
    });

    it('prints the version and exits 0', () => {
      expect(run('--version')).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });
});
