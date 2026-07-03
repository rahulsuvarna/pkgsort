<div align="center">

# pkgsort

**The opinionated, deterministic `package.json` formatter for professional JavaScript & TypeScript teams.**

[![CI](https://github.com/pkgsort/pkgsort/actions/workflows/ci.yml/badge.svg)](https://github.com/pkgsort/pkgsort/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pkgsort.svg)](https://www.npmjs.com/package/pkgsort)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/pkgsort.svg)](https://nodejs.org)

</div>

> [!NOTE]
> **Status: pre-release.** The repository foundation is in place; the formatter
> itself is under active development. See the [Roadmap](./docs/ROADMAP.md).

---

## Why pkgsort?

Every JavaScript project has a `package.json`, and every team eventually argues
about it: what order should the keys go in? Should `dependencies` be sorted?
Why does this field have a trailing comma and that one doesn't? Why did the diff
touch 40 lines when someone ran `npm install`?

[`sort-package-json`](https://github.com/keithamus/sort-package-json) solved
**key ordering** and did it well. pkgsort is not trying to replace it.

**pkgsort solves a different problem: treating `package.json` as a first-class,
CI-enforced source artifact.** It reads, sorts, and writes with guarantees a
casual sorter does not make — byte-level determinism, monorepo-wide
enforcement, and CI-grade reporting — the way Prettier makes source formatting
boring and conflict-free.

| | `sort-package-json` | **pkgsort** |
| --- | --- | --- |
| Sort top-level keys | ✅ | ✅ |
| Sort dependency maps | ✅ | ✅ |
| Deterministic, idempotent output | Partial | ✅ (guaranteed & tested) |
| `--check` mode for CI | ✅ | ✅ (with actionable diffs) |
| Configurable sort behaviour | Limited | ✅ (opinionated defaults, fully overridable) |
| Monorepo / workspace awareness | ❌ | ✅ |
| Structured (JSON) reporter for tooling | ❌ | ✅ |

If all you need is key ordering, `sort-package-json` is a fine, lightweight
choice. If you manage many packages across many repos and want `package.json`
to be as boring and diff-free as your Prettier-formatted source, pkgsort is
built for you.

## Product philosophy

pkgsort is guided by seven principles. Every feature decision is measured
against them:

1. **Opinionated by default.** Install it, run it, get a good result with zero
   configuration.
2. **Configurable when needed.** Every default can be overridden through a
   documented, validated config file.
3. **Deterministic.** The same input always produces byte-identical output on
   every machine, OS, and Node version.
4. **Safe.** pkgsort never reorders semantically significant data or drops
   fields it doesn't recognize. Unknown keys are preserved.
5. **Fast.** Formatting a `package.json` is instant; formatting a 500-package
   monorepo is measured in milliseconds per file.
6. **CI friendly.** A first-class `--check` mode, meaningful exit codes, and a
   machine-readable reporter.
7. **Great DX.** Clear diffs, clear errors, clear docs.

## Installation

```sh
# npm
npm install --save-dev pkgsort

# Yarn
yarn add --dev pkgsort

# pnpm
pnpm add -D pkgsort

# Bun
bun add --dev pkgsort
```

Or run it once without installing:

```sh
npx pkgsort --check
```

> Requires **Node.js 22 LTS** or newer. pkgsort is package-manager agnostic and
> works the same under npm, Yarn, pnpm, and Bun.

## Usage

### CLI

```sh
# Format package.json in the current directory (writes in place).
pkgsort

# Verify formatting without writing — the command CI should run.
# Exits non-zero if any file would change.
pkgsort --check

# Format an explicit set of files or globs.
pkgsort "packages/**/package.json"

# Preview changes without touching disk.
pkgsort --check --diff
```

**Exit codes** (stable contract, safe to script against):

| Code | Meaning |
| ---- | ------- |
| `0`  | Success — all files already formatted (or were written). |
| `1`  | In `--check` mode, one or more files are not formatted. |
| `2`  | Usage error (bad flags, no files matched). |
| `3`  | A file could not be parsed or is invalid. |

> pkgsort `0.1` ships a **CLI only** — that is the entire public interface. A
> programmatic/TypeScript API is intentionally not offered yet and may be
> considered later based on demand (see the [Roadmap](./docs/ROADMAP.md)).

## Configuration

pkgsort works with **zero configuration**. When you need to adjust its
behaviour, add a `pkgsort.config.json` (JSON), `pkgsort.config.jsonc` (JSON with
comments), or `pkgsort.config.js` (JavaScript) to your project root — or a
`"pkgsort"` key in your `package.json`:

```json
{
  "indent": 2,
  "finalNewline": true,
  "sort": {
    "dependencies": "alphabetical"
  }
}
```

The complete, documented configuration reference lives in
[`docs/CONFIG.md`](./docs/CONFIG.md).

## Documentation

| Document | Purpose |
| --- | --- |
| [Product Requirements](./docs/PRD.md) | What we are building and for whom. |
| [Architecture](./docs/ARCHITECTURE.md) | How the pipeline is designed. |
| [Configuration](./docs/CONFIG.md) | Every option, its default, and rationale. |
| [Roadmap](./docs/ROADMAP.md) | Milestones from `0.x` to `1.0`. |
| [Contributing](./CONTRIBUTING.md) | How to set up, test, and submit changes. |
| [Changelog](./CHANGELOG.md) | Notable changes, per release. |

## Contributing

We welcome issues and pull requests. Please read the
[Contributing Guide](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md) before you start.

## License

[MIT](./LICENSE) © pkgsort contributors
