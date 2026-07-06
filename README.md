<div align="center">

# pkgsort

**A CLI that sorts the top-level keys of a `package.json` into a fixed canonical order.**

[![CI](https://github.com/rahulsuvarna/pkgsort/actions/workflows/ci.yml/badge.svg)](https://github.com/rahulsuvarna/pkgsort/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40rsuvarna%2Fpkgsort.svg)](https://www.npmjs.com/package/@rsuvarna/pkgsort)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/%40rsuvarna%2Fpkgsort.svg)](https://nodejs.org)

</div>

Version 0.1.3 released.

---

## Why pkgsort?

Every JavaScript project has a `package.json`, and teams eventually disagree
about one thing: what order should the top-level keys go in? Hand-maintained
ordering drifts over time, and the resulting diffs are noise.

pkgsort reads a `package.json`, reorders its top-level keys into a fixed
canonical order, and writes it back — so the ordering is consistent across a
project and can be enforced in CI.

## Product philosophy

pkgsort is guided by these principles:

1. **Opinionated by default.** Install it, run it, get a good result with zero
   configuration.
2. **Deterministic.** The same input always produces the same output.
3. **Safe.** pkgsort never reorders nested values or drops fields it doesn't
   recognize. Unknown top-level keys are preserved.
4. **CI friendly.** A first-class `--check` mode and meaningful exit codes.

## Installation

```sh
# npm
npm install --save-dev @rsuvarna/pkgsort

# Yarn
yarn add --dev @rsuvarna/pkgsort

# pnpm
pnpm add -D @rsuvarna/pkgsort

# Bun
bun add --dev @rsuvarna/pkgsort
```

Or run it once without installing:

```sh
npx @rsuvarna/pkgsort --check package.json
```

> Requires **Node.js 22 LTS** or newer. The installed command is `pkgsort`.

## Usage

### CLI

```sh
# Sort package.json in the current directory in place.
pkgsort

# Sort an explicit file instead.
pkgsort path/to/package.json

# Verify the current directory's package.json without modifying it — the command
# CI should run. Exits 0 if sorted, 1 if not. The flag position is flexible:
# `pkgsort package.json --check` works identically.
pkgsort --check

# Print a unified diff of what --check would change (nothing is written).
pkgsort --check --diff
```

When no path is given, pkgsort targets `package.json` in the current directory.

### Check mode

`--check` verifies that a `package.json` is already in canonical order
**without writing anything to disk**. It runs the exact same sorting pipeline
as a normal format, then compares the result against the file on disk:

- **Already sorted** → prints a success message and exits `0`.
- **Not sorted** → prints a message telling you how to fix it and exits `1`.
- **Unreadable or invalid JSON** → reports the error and exits non-zero
  (`2` for a missing file, `3` for invalid JSON), exactly as a normal run does.

Because it never writes, it is safe to run in read-only or CI environments. The
flag works before or after the file path.

Add `--diff` to print a unified diff of the changes `--check` would make instead
of the drift message. It applies only together with `--check`: on a drifted file
it prints the diff and exits `1`, and on an already-sorted file it prints no diff
and exits `0`. Nothing is written in either case.

**Exit codes** (stable contract, safe to script against):

| Code | Meaning                                                            |
| ---- | ------------------------------------------------------------------ |
| `0`  | Success — the file is already sorted, or was sorted in place.      |
| `1`  | In `--check` mode, the file is not sorted.                         |
| `2`  | The file could not be read (for example, it does not exist).       |
| `3`  | The file could not be parsed (invalid JSON, or not a JSON object). |

### Continuous integration

Run `--check` in CI to fail the build whenever a committed `package.json` drifts
out of canonical order. A minimal GitHub Actions step:

```yaml
name: pkgsort

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx @rsuvarna/pkgsort --check package.json
```

The step exits non-zero (failing the job) if `package.json` is not sorted, and
never modifies the checked-out file.

> pkgsort ships a **CLI only** — that is the entire public interface. There is
> no programmatic/TypeScript API.

## Behavior

pkgsort has **no configuration**; it applies a single fixed transformation:

- **Top-level keys only.** It reorders the top-level keys of a `package.json`
  into a fixed canonical order defined in the source. Nested values, including
  the contents of `dependencies` and other maps, are left exactly as they are.
- **Unknown keys are preserved.** Any top-level key not in the canonical order
  is kept and placed after the known keys, in its original relative order.
- **Whitespace is detected, not imposed.** The existing indentation (two spaces,
  four spaces, or tabs) is detected and reused, falling back to two spaces when
  the file has no indented lines. Output always uses `\n` line endings; a
  trailing newline is written only if the original file had one.

## Documentation

| Document                               | Purpose                                   |
| -------------------------------------- | ----------------------------------------- |
| [Product Requirements](./docs/PRD.md)  | Product requirements and scope.           |
| [Architecture](./docs/ARCHITECTURE.md) | How the pipeline is designed.             |
| [Roadmap](./docs/ROADMAP.md)           | Planned work beyond the current release.  |
| [Contributing](./CONTRIBUTING.md)      | How to set up, test, and submit changes.  |
| [Releasing](./docs/RELEASING.md)       | How maintainers cut and publish releases. |
| [Changelog](./CHANGELOG.md)            | Notable changes, per release.             |

## Contributing

We welcome issues and pull requests. Please read the
[Contributing Guide](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md) before you start.

## License

[MIT](./LICENSE) © pkgsort contributors
