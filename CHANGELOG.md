# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [0.1.2] - 2026-07-06

### Added

- CLI: when no path argument is given, pkgsort targets `package.json` in the
  current directory (for example, `pkgsort` and `pkgsort --check`). Passing an
  explicit path behaves exactly as before, and a missing default file returns
  the same read error and exit code (`2`) as a missing explicit path.

## [0.1.1] - 2026-07-06

### Added

- CLI: `pkgsort <file>` sorts the top-level keys of the given `package.json` and
  writes the result back in place, printing whether the file was changed.
- CLI: `--check` verifies that a file is already sorted without writing to disk.
  The flag may appear before or after the file path.
- CLI: `--help` / `-h` prints usage and `--version` / `-v` prints the version;
  both exit `0`.
- Exit codes: `0` success (already sorted, or sorted in place), `1` drift in
  `--check` mode, `2` usage error (no file given, or the file could not be
  read), `3` parse error (invalid JSON, or the top level is not a JSON object).
- Top-level key sorting only: keys are reordered into a fixed canonical order;
  all nested values, including the contents of `dependencies` and other maps,
  are preserved unchanged.
- Unknown top-level keys are preserved and kept in their original relative
  order, placed after the known keys.
- Whitespace handling: the existing indentation (spaces or tabs) is detected and
  reused, falling back to two spaces when the file has no indented lines; output
  always uses `\n` line endings; a trailing newline is reproduced only when the
  original file had one.

### Changed

- Documentation: the README was corrected to describe only shipped behavior — a
  CLI-only tool with top-level key sorting, `--check`, and unknown-key
  preservation. Removed claims of dependency-map sorting, configuration,
  monorepo support, a reporting/programmatic API, and other not-yet-implemented
  functionality.

[Unreleased]: https://github.com/rahulsuvarna/pkgsort/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/rahulsuvarna/pkgsort/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rahulsuvarna/pkgsort/releases/tag/v0.1.1
