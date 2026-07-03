# Roadmap — pkgsort

> **Status:** Living document · **Last updated:** 2026-07-03

This roadmap describes the path from an empty repository to a trustworthy `1.0`.
It is intentionally conservative: we ship a small, correct core before breadth.
Milestones are outcome-based, not date-based.

Legend: ⬜ not started · 🟨 in progress · ✅ done

---

## Milestone 0 — Repository foundation ✅

*Goal: a project that feels mature on day one, before a line of app code.*

- ✅ Docs (PRD, Architecture, Roadmap, Config), README, community health files.
- ✅ Tooling: TypeScript (strict), ESLint (typed) + Prettier, Vitest.
- ✅ CI: lint, typecheck, format check, test matrix (Node 22/24 × 3 OSes),
  package-contents verification.
- ✅ Licensing, contributing, code of conduct, changelog scaffolding.

## Milestone 1 — CLI formatter (`0.1`) ⬜

*Goal: a working `pkgsort` command that reads, sorts, and writes a single
`package.json` deterministically. **The CLI is the only public surface** — no
programmatic/TypeScript API is exposed.*

- ⬜ Internal read → sort → write pipeline (pure core, effectful shell).
- ⬜ Canonical top-level key ordering.
- ⬜ Dependency-map sorting with a locale-independent comparator.
- ⬜ Configurable indentation + trailing newline.
- ⬜ Preserve unknown keys (safety invariant).
- ⬜ `pkgsort` CLI: default write mode; path/glob inputs.
- ⬜ `--check` mode with stable exit codes (`0`/`1`/`2`/`3`).
- ⬜ `--diff` unified-diff output.
- ⬜ Human-readable summary reporter.
- ⬜ **Idempotency and round-trip test suites** (gating).

**Exit criteria:** `pkgsort --check` can gate a real repository's CI;
`format(format(x)) === format(x)`; zero data loss on the initial fixture corpus.

## Milestone 2 — Configuration (`0.2`) ⬜

*Goal: opinionated defaults, fully overridable.*

- ⬜ Config discovery (`pkgsort.config.{json,jsonc,js}`, `package.json` key).
- ⬜ Schema validation with actionable errors.
- ⬜ Nearest-config-wins resolution (per-directory).

> A typed `defineConfig()` helper is intentionally **not** in scope; it may be
> added post-`1.0` if there is clear demand.

**Exit criteria:** every default documented in [`CONFIG.md`](./CONFIG.md) is
overridable and validated.

## Milestone 3 — Monorepo awareness (`0.3`) ⬜

*Goal: one command formats an entire workspace, under any package manager.*

- ⬜ Workspace root detection (npm / Yarn `workspaces`, `pnpm-workspace.yaml`,
  Bun workspaces).
- ⬜ Glob expansion + dedupe to concrete files.
- ⬜ Bounded-concurrency processing.
- ⬜ Aggregate + per-file reporting.

**Exit criteria:** formatting a large workspace is correct and fast (see perf
budgets in the PRD).

## Milestone 4 — Reporting & integrations (`0.4`) ⬜

- ⬜ `--reporter json` machine-readable output.
- ⬜ Documented exit-code and JSON contract for bots/dashboards.
- ⬜ Recipes: GitHub Actions, pre-commit (`lint-staged` / `husky`), Turborepo —
  written to be package-manager agnostic (npm / Yarn / pnpm / Bun).

## Milestone 5 — Hardening for `1.0` ⬜

*Goal: earn the trust implied by a `1.0`.*

- ⬜ Large real-world corpus regression suite.
- ⬜ Performance benchmarks tracked in CI.
- ⬜ Documented stability guarantees (semver policy for the CLI, config, output).
- ⬜ Security: provenance, dependency review, threat notes.
- ⬜ Documentation freeze review.

**Exit criteria:** no known data-loss or determinism bugs; stability policy
published; docs complete.

## Post-1.0 (candidate, not committed)

- Additional workspace tools (Nx, Lerna, Rush).
- Community-owned editor integrations.
- Optional policy checks (opt-in, clearly separated from formatting).

> **Explicitly not planned:** a plugin architecture. Plugins will only be
> reconsidered if real user demand emerges after adoption. A public
> programmatic/TypeScript API is likewise deferred until there is a demonstrated
> need.

---

### How milestones are tracked

Each milestone maps to a GitHub milestone; each bullet becomes an issue. A
milestone is "done" only when its exit criteria are met and CI is green across
the full matrix. We do not skip ahead: correctness and determinism gate every
step.
