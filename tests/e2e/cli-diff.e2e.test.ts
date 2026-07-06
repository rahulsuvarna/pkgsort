import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cliPath = join(repoRoot, 'dist', 'cli.js');

function runBuild(): void {
  if (process.platform === 'win32') {
    execFileSync('cmd.exe', ['/d', '/s', '/c', 'npm run build'], { cwd: repoRoot, stdio: 'ignore' });
    return;
  }
  execFileSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'ignore' });
}

const SORTED = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
const UNSORTED = '{\n  "version": "1.0.0",\n  "name": "demo"\n}\n';

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Spawn the built CLI as a subprocess and capture its output and exit code. */
function runCli(args: string[]): RunResult {
  try {
    const stdout = execFileSync('node', [cliPath, ...args], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status?: number | null; stdout?: string; stderr?: string };
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('e2e: built CLI --check --diff', () => {
  let dir: string;

  beforeAll(() => {
    // This suite exercises the compiled binary, so make sure dist/ is current.
    runBuild();
  }, 60_000);

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pkgsort-e2e-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const fixture = (contents: string): string => {
    const file = join(dir, 'package.json');
    writeFileSync(file, contents, 'utf8');
    return file;
  };

  it('prints a unified diff and exits 1 on drift, without writing', () => {
    const file = fixture(UNSORTED);
    const result = runCli(['--check', '--diff', file]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('--- a/');
    expect(result.stdout).toContain('@@');
    expect(result.stdout).toContain('-  "version": "1.0.0",');
    expect(result.stdout).toContain('+  "name": "demo",');
    expect(readFileSync(file, 'utf8')).toBe(UNSORTED);
  });

  it('prints no diff and exits 0 when already sorted, without writing', () => {
    const file = fixture(SORTED);
    const result = runCli(['--check', '--diff', file]);
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('@@');
    expect(readFileSync(file, 'utf8')).toBe(SORTED);
  });

  it('exits 3 on invalid JSON in --check --diff mode', () => {
    const file = fixture('{ not valid json');
    const result = runCli(['--check', '--diff', file]);
    expect(result.status).toBe(3);
    expect(result.stderr).toContain('Invalid JSON');
  });
});
