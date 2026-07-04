# Product Requirements Document — pkgsort

> **Status:** Draft · **Owner:** Founding engineering · **Last updated:** 2026-07-03

This document defines _what_ pkgsort is, _who_ it serves, and _how we know it
succeeds_. It intentionally avoids implementation detail — see
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for that.

---

## 1. Problem statement

`package.json` is the most edited configuration file in the JavaScript
ecosystem and one of the least disciplined. In teams and monorepos this causes
recurring, low-value friction:

- **Merge conflicts** from inconsistent key ordering and dependency placement.
- **Noisy diffs** when a package manager rewrites the file on install.
- **Bikeshedding** in code review over ordering, indentation, and field style.
- **Drift** between packages in a monorepo that no single tool enforces.

Existing tools address key _ordering_ but stop short of treating `package.json`
as a deterministic, CI-enforced artifact across an entire workspace.

## 2. Vision

> `package.json` should be as boring, consistent, and conflict-free as a
> Prettier-formatted source file — automatically, everywhere, forever.

pkgsort is the tool that makes that true. Run it once and forget it exists.

## 3. Target users

| Persona                           | Need                                                        | How pkgsort helps                                  |
| --------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| **Team lead / platform engineer** | Enforce consistency across many repos without policing PRs. | `--check` in CI; shareable config.                 |
| **Monorepo maintainer**           | Keep dozens/hundreds of `package.json` files consistent.    | Workspace discovery; one command for all packages. |
| **Individual OSS author**         | Sensible defaults with no setup.                            | Zero-config opinionated formatting.                |
| **Tooling author**                | Integrate results into dashboards / bots.                   | Structured JSON reporter; typed API.               |

Explicit **non-users**: people who only want lightweight key sorting are well
served by `sort-package-json` and are not a persona we optimize for.

## 4. Goals

- **G1 — Zero-config quality.** A first run with no config produces a result a
  professional team would accept.
- **G2 — Determinism.** Byte-identical output across OS, Node version, locale,
  and repeated runs (idempotency).
- **G3 — Safety.** Never lose or semantically reorder data; preserve unknown
  fields.
- **G4 — CI ergonomics.** `--check` mode, stable exit codes, machine-readable
  output.
- **G5 — Monorepo awareness.** Discover and format workspace packages in one
  command.
- **G6 — Configurability.** Every default overridable via a validated config.
- **G7 — Performance.** Format a single file in <10 ms; a 1,000-package repo in
  well under a few seconds on commodity hardware.

## 5. Non-goals (for 1.0)

- **NG1** — Not a general JSON/JSON5 formatter; scope is `package.json` (and
  peers like `package-lock.json` are explicitly out of scope for 1.0).
- **NG2** — Not a dependency version manager, updater, or auditor.
- **NG3** — Not a linter that fails builds on _policy_ (e.g. "no caret ranges");
  pkgsort sorts and formats, it does not enforce business rules in 1.0.
- **NG4** — **No value normalization.** pkgsort never rewrites the _values_ of
  fields (repo URLs, license strings, version ranges). It only reorders keys and
  reformats whitespace; the meaning of the file is never changed.
- **NG5** — **No public programmatic / TypeScript API in `0.1`.** The CLI is the
  only public interface. A library API may be reconsidered later on demand.
- **NG6** — No plugin ecosystem. We will only revisit plugins if real user
  demand emerges after adoption.
- **NG7** — No editor extensions shipped by us in 1.0.

## 6. Functional requirements

### 6.1 Formatting

- **FR1** Sort top-level keys into a canonical, well-known order.
- **FR2** Sort dependency-style maps (`dependencies`, `devDependencies`,
  `peerDependencies`, `optionalDependencies`, and configurable others).
- **FR3** Apply consistent whitespace: configurable indentation and a trailing
  newline.
- **FR4** Preserve any key pkgsort does not recognize, in a deterministic
  position.

### 6.2 Modes

- **FR5** Write mode (default): format files in place.
- **FR6** Check mode (`--check`): report without writing; non-zero exit on drift.
- **FR7** Diff output (`--diff`): human-readable unified diff of proposed
  changes.

### 6.3 Input selection

- **FR8** Default to `./package.json`; accept explicit paths and globs.
- **FR9** Auto-discover workspace packages when run at a monorepo root.

### 6.4 Reporting

- **FR10** Human-readable summary by default.
- **FR11** `--reporter json` for machine consumption.

### 6.5 Configuration

- **FR12** Load config from `pkgsort.config.{json,jsonc,js}` or a `pkgsort` key
  in `package.json`.
- **FR13** Validate config and fail with a clear message on invalid options.

## 7. Non-functional requirements

- **NFR1 — Determinism** is a hard correctness property, verified by tests that
  run the formatter twice and assert byte-equality (idempotency).
- **NFR2 — Safety:** round-trip tests assert no data loss on a large corpus of
  real-world `package.json` files.
- **NFR3 — Performance budgets** as in G7, tracked by benchmarks in CI.
- **NFR4 — Portability:** identical behaviour on Linux, macOS, Windows; Node 22
  LTS and 24; under npm, Yarn, pnpm, and Bun.
- **NFR5 — Zero runtime dependencies** where practical; every dependency added
  is justified in review.
- **NFR6 — Supply-chain integrity:** published with npm provenance.

## 8. Success metrics

- **Adoption:** weekly npm downloads; number of repos with `pkgsort --check` in
  CI.
- **Trust:** zero reported data-loss bugs; zero determinism regressions.
- **DX:** median time-to-first-successful-run; issue resolution time.
- **Quality:** sustained >90% test coverage; green CI on all supported targets.

## 9. Competitive positioning

pkgsort **complements** `sort-package-json`. We recommend it explicitly for
lightweight sort-only use cases. Our wedge is teams that want `package.json` to
be a _deterministic, CI-enforced_ artifact across a whole workspace — sorting
plus guaranteed idempotent output, monorepo-wide enforcement, and CI-grade
reporting.

## 10. Risks & mitigations

| Risk                                      | Mitigation                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Perceived as "yet another sorter."        | Clear positioning; determinism, monorepo awareness, and CI enforcement as differentiators. |
| Breaking users' files (data loss).        | Safety as a tested invariant; conservative defaults; large real-world corpus in tests.     |
| Scope creep toward a policy linter.       | Explicit non-goals; roadmap discipline.                                                    |
| Determinism bugs from locale/JSON quirks. | Locale-independent collation; idempotency tests in CI matrix.                              |

## 11. Open questions

- Should `package.json`'s own `pkgsort` key be a supported config source, or
  config-file-only? (Leaning: support both, file wins.)
- What is the minimal monorepo config we can infer vs. require?

_These are tracked as issues and resolved before the relevant milestone._
