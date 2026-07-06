import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cliPath = join(repoRoot, 'dist', 'cli.js');

/**
 * Whether this platform lets us create a file symlink without elevation.
 *
 * On POSIX, npm links a package's `bin` into `node_modules/.bin` as a symlink
 * to the real entry file, which is precisely the invocation this test covers.
 * On Windows npm instead writes shim scripts (`.cmd`/`.ps1`) that call node
 * with the real path, so the symlinked-bin failure mode cannot occur there and
 * a file symlink also needs Developer Mode / elevation. Where symlinks are
 * unavailable we skip rather than fail: the scenario is genuinely absent.
 */
function detectSymlinkSupport(): boolean {
  const probe = mkdtempSync(join(tmpdir(), 'pkgsort-symlink-probe-'));
  try {
    const target = join(probe, 'target');
    writeFileSync(target, '', 'utf8');
    symlinkSync(target, join(probe, 'link'), 'file');
    return true;
  } catch {
    return false;
  } finally {
    rmSync(probe, { recursive: true, force: true });
  }
}

const canSymlink = detectSymlinkSupport();

describe('e2e: CLI invoked through a symlinked bin path', () => {
  let dir: string;

  beforeAll(() => {
    // This suite exercises the compiled binary, so make sure dist/ is current.
    execFileSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'ignore' });
  }, 60_000);

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pkgsort-bin-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // Reproduces `./node_modules/.bin/pkgsort --help`: npm links the bin as a
  // symlink to dist/cli.js, so `process.argv[1]` is the symlink path while the
  // module's own URL is the real file. Before the realpath fix the entry guard
  // failed to match and main() never ran — the command exited 0 with no output
  // (reported on WSL). This asserts the installed binary actually runs.
  it.skipIf(!canSymlink)('runs main() when launched through a symlink to dist/cli.js', () => {
    const binLink = join(dir, 'pkgsort');
    symlinkSync(cliPath, binLink, 'file');

    const stdout = execFileSync('node', [binLink, '--help'], { encoding: 'utf8' });

    expect(stdout).toContain('Usage: pkgsort');
  });
});
