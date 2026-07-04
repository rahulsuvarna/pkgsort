# Architecture — pkgsort

> **Status:** Draft · **Last updated:** 2026-07-03

This document describes the intended internal design. It is a contract for
contributors, not a description of shipped code (implementation has not yet
begun). Where a decision is still open it is marked **(open)**.

---

## 1. Design principles

1. **Pure core, effectful shell.** All formatting logic is pure functions:
   `string -> string`. File I/O, globbing, and process concerns live only in a
   thin shell (CLI + workspace layer). This makes the core trivially testable
   and deterministic.
2. **A pipeline of small, ordered transforms.** Formatting is a short sequence
   of independent stages — **read, sort, write**. Each stage is individually
   testable and can be toggled by config.
3. **Preserve by default.** Any data the pipeline does not understand passes
   through untouched, in a deterministic position.
4. **Determinism is enforced, not hoped for.** No `Date.now()`, no locale-
   dependent collation, no unordered iteration that reaches output.

## 2. High-level structure

```
                +-------------------+
   CLI args ->  |   CLI (shell)     |  argv parsing, exit codes, reporters
                +---------+---------+
                          |
                +---------v---------+
   file globs ->|  Workspace layer  |  discovery, fs read/write (shell)
                +---------+---------+
                          |  raw string per file
                +---------v---------+
                |   format() core   |  PURE: string -> FormatResult
                |                   |
                |   parse   (read)  |
                |     |             |
                |   sort            |
                |     |             |
                |   serialize (write)
                +-------------------+
```

The **core** never touches the filesystem. The **shell** never contains
formatting logic. This boundary is the single most important invariant.

## 3. The formatting pipeline

`format(input: string, config: ResolvedConfig): FormatResult`

The pipeline is deliberately minimal: **read → sort → write.** There is no
value-transformation ("normalize") stage. pkgsort changes the _arrangement_ of a
`package.json`, never the _meaning_ of its values.

### Stage 1 — Parse (read)

- Parse the input into a plain object plus _detected style_ (indentation, final
  newline). We record the original detail so we can report `changed` accurately.
- On invalid JSON, throw a typed `ParseError` carrying position info. The shell
  maps this to exit code `3`.

### Stage 2 — Sort

- Reorder top-level keys per the canonical key-order table (unknown keys retained
  in a deterministic bucket — **(open)**: end of file vs. alphabetical tail).
- Sort configured dependency-style maps using a stable, locale-independent
  comparator.
- Sorting only reorders keys; it never edits a key's value.

### Stage 3 — Serialize (write)

- Emit JSON with configured indentation and trailing newline.
- Serialization is the _only_ place whitespace decisions are made, so output is
  a pure function of the object + style config.

### Result

```ts
interface FormatResult {
  output: string; // formatted text
  changed: boolean; // output !== input
}
```

## 4. Determinism & idempotency

Two properties are enforced by tests, not convention:

- **Idempotency:** `format(format(x)) === format(x)` for all inputs.
- **Portability:** output is independent of OS, locale, and Node version.

To guarantee these:

- Use a fixed, codepoint-based comparator for sorting (never `localeCompare`
  with the default locale).
- Never introduce time, randomness, or environment into the core.
- Normalize line endings to `\n` internally; the serializer owns the final
  newline.

## 5. Configuration resolution

```
CLI flags  >  pkgsort.config.*  >  "pkgsort" key in package.json  >  defaults
```

- Config is discovered by walking up from each target file (nearest wins), so
  monorepos can have per-package overrides.
- Config is validated against a schema on load; invalid config → exit `2` with a
  precise message.
- Config files are **JSON, JSONC, or JavaScript** only. There is no typed
  `defineConfig()` helper in the initial product; one may be added later if
  there is clear demand.
- **(open)** caching resolved config per directory for large monorepos.

## 6. Workspace (monorepo) layer

- Detect the workspace root and read its package globs. pkgsort is
  package-manager agnostic and supports every common workspace mechanism: npm
  and Yarn `workspaces` fields, `pnpm-workspace.yaml`, and Bun workspaces.
  **(open)** Nx / Lerna / Rush.
- Expand globs to concrete `package.json` paths, deduplicate, and format each
  through the same pure core.
- Formatting of individual files is embarrassingly parallel; run with a bounded
  concurrency pool. Order of _processing_ never affects per-file _output_.

## 7. Error handling & exit codes

| Situation                         | Core behaviour          | CLI exit |
| --------------------------------- | ----------------------- | -------- |
| All good                          | returns results         | `0`      |
| `--check`, drift found            | returns `changed: true` | `1`      |
| Bad flags / no match / bad config | —                       | `2`      |
| Unparseable / invalid file        | throws `ParseError`     | `3`      |

Errors are typed classes so the shell can map them to exit codes without string
matching.

## 8. Public interface

For `0.1`, the **CLI is the entire public interface** — there is no exported,
supported TypeScript/programmatic API. Internally the core is a `format(input,
config)` function, but it is not published as a stable export and may change
freely.

This keeps the surface we must keep stable as small as possible while the tool
matures. A programmatic API may be reconsidered later based on real demand (see
the [Roadmap](./ROADMAP.md)); it is deliberately out of scope for now.

## 9. Module layout

See [`CONTRIBUTING.md`](../CONTRIBUTING.md#repository-layout) for the concrete
`src/` and `tests/` folder structure and the responsibility of each module. Note
that sorting strategies live in `src/sorters/`.

## 10. Technology choices & rationale

| Choice                        | Rationale                                                     |
| ----------------------------- | ------------------------------------------------------------- |
| **TypeScript, strict**        | Correctness for a tool that mutates users' files.             |
| **ESM-only**                  | Modern Node target (22 LTS+); simpler, tree-shakeable output. |
| **Package-manager agnostic**  | Works identically under npm, Yarn, pnpm, Bun.                 |
| **Vitest**                    | Fast, TS-native, first-class coverage.                        |
| **ESLint (typed) + Prettier** | Typed lint catches real bugs; Prettier owns style.            |
| **Zero/minimal runtime deps** | Smaller supply-chain surface; faster installs.                |
| **Changesets**                | Disciplined, reviewable versioning and changelogs.            |

## 11. Testing strategy (summary)

- **Unit** — each pipeline stage and each sorter in isolation.
- **Integration** — `format()` end-to-end on curated fixtures.
- **Property/invariant** — idempotency and round-trip safety on a large corpus.
- **E2E** — the built CLI, exercised as a subprocess (flags, exit codes,
  stdout/stderr).

Coverage thresholds are enforced in CI (see `vitest.config.ts`).
