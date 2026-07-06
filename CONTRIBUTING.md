# Contributing to pkgsort

Thank you for considering a contribution! pkgsort aims to feel like a mature,
trustworthy open-source product, and that starts with a welcoming, well-defined
contribution process. Please also read our
[Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Ways to contribute

- **Report a bug.** Especially anything touching **safety** (data loss) or
  **determinism** (different output on different machines) — these are our
  highest-severity categories.
- **Propose a feature.** Open an issue first so we can check it against the
  [PRD](./docs/PRD.md) and [Roadmap](./docs/ROADMAP.md) before you build.
- **Improve docs.** Clear docs are a core deliverable, not an afterthought.
- **Send a pull request.** See below.

## Prerequisites

- **Node.js 22 LTS** or newer
- Any package manager — pkgsort is package-manager agnostic. The examples below
  use **npm** (bundled with Node); substitute Yarn, pnpm, or Bun freely.

## Getting started

```sh
git clone https://github.com/pkgsort/pkgsort.git
cd pkgsort
npm install
npm run check   # typecheck + lint + format:check + test
```

## Everyday commands

| Command                           | What it does                  |
| --------------------------------- | ----------------------------- |
| `npm run build`                   | Compile `src/` to `dist/`.    |
| `npm run typecheck`               | Type-check without emitting.  |
| `npm run lint` / `lint:fix`       | Lint (typed) / autofix.       |
| `npm run format` / `format:check` | Prettier write / verify.      |
| `npm run test` / `test:watch`     | Run the suite / watch mode.   |
| `npm run test:coverage`           | Run with coverage thresholds. |
| `npm run check`                   | Everything CI runs, locally.  |

## Pre-commit hooks

This repository uses a git pre-commit hook (Husky + lint-staged).

- On commit, it runs `npm run test`, then auto-fixes staged files with
  `eslint --fix` and `prettier --write`, then runs `npm run lint` and
  `npm run format:check`.
- If any step fails, the commit is blocked.
- Auto-fixed staged files are re-staged automatically.

## Repository layout

The codebase follows the "pure core, effectful shell" design from
[`ARCHITECTURE.md`](./docs/ARCHITECTURE.md). This is the recommended structure;
directories are created as the corresponding milestone lands.

```
pkgsort/
├── src/
│   ├── cli.ts              # CLI entry & the public interface: argv, exit codes
│   ├── index.ts            # Internal barrel — NOT a published/public API
│   ├── types.ts            # Shared internal types
│   │
│   ├── config/             # Configuration subsystem
│   │   ├── defaults.ts     #   opinionated default config
│   │   ├── schema.ts       #   validation schema for config files
│   │   └── load.ts         #   discovery, precedence, resolution
│   │
│   ├── core/               # PURE formatting pipeline (no I/O)
│   │   ├── pipeline.ts     #   orchestrates parse → sort → serialize
│   │   ├── parse.ts        #   string -> object + detected style
│   │   ├── sort.ts         #   applies sorters (keys + dependency maps)
│   │   └── serialize.ts    #   object + style -> deterministic string
│   │
│   ├── sorters/            # Sorting strategies (pure fns)
│   │   ├── index.ts        #   sorter registry
│   │   ├── top-level-keys.ts   # canonical key-order table
│   │   └── dependencies.ts     # dependency-map comparator
│   │
│   ├── monorepo/           # Workspace layer (effectful shell)
│   │   ├── discover.ts     #   detect root + read workspace globs
│   │   └── expand.ts       #   globs -> concrete package.json paths
│   │
│   ├── reporters/          # Output formatting for the CLI
│   │   ├── human.ts
│   │   └── json.ts
│   │
│   └── utils/              # Small shared helpers
│       ├── compare.ts      #   locale-independent comparator (determinism!)
│       ├── json.ts
│       └── fs.ts           #   the only module allowed to touch disk
│
├── tests/
│   ├── unit/               # One stage / rule / util in isolation
│   ├── integration/        # format() end-to-end over fixtures
│   ├── invariants/         # idempotency + round-trip safety (property tests)
│   ├── e2e/                # spawn the built CLI as a subprocess
│   └── fixtures/           # input/expected package.json pairs & a real corpus
│
├── docs/                   # PRD, Architecture, Roadmap, Config
└── .github/workflows/      # CI
```

**The load-bearing rule:** nothing in `src/core/` or `src/sorters/` may import
`src/utils/fs.ts` or otherwise perform I/O. The core is pure so it is
deterministic and trivially testable. Reviewers will reject PRs that blur this
boundary.

## Testing expectations

Any behavioural change needs tests. In particular:

- New formatting or sorting behaviour needs an **integration fixture** (input
  - expected output).
- Anything affecting output must not break the **idempotency** and **round-trip
  safety** invariant suites.
- CLI changes need an **e2e** test asserting stdout/stderr and exit code.

Coverage thresholds are enforced (see `vitest.config.ts`); PRs that drop
coverage below threshold will fail CI.

## Coding standards

- TypeScript **strict**; no `any` that isn't justified in a comment.
- Prefer pure functions; keep I/O at the edges.
- Let Prettier handle formatting — don't hand-format.
- Keep dependencies minimal; adding a runtime dependency requires justification
  in the PR description.

## Commit & PR conventions

- We use [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Every user-facing change must include a changeset:** run `npx changeset`
  and commit the generated file. This drives versioning and the changelog.
- Keep PRs focused; one logical change per PR. Fill out the PR description:
  _what_, _why_, and _how it was tested_.
- CI (lint, typecheck, format, full test matrix) must be green before review.

## Releasing (maintainers)

Releases are automated through GitHub Actions. Publishing a **GitHub Release**
triggers [`.github/workflows/publish.yml`](./.github/workflows/publish.yml),
which validates, builds, and publishes the package to npm using **npm Trusted
Publishing (OIDC)** with provenance — no npm token is stored, and no one runs
`npm publish` by hand. Contributors never need to publish manually.

See [`docs/RELEASING.md`](./docs/RELEASING.md) for the full runbook: versioning
strategy, prerequisites, and the exact steps to cut a release.

## Questions

Open a [discussion or issue](https://github.com/pkgsort/pkgsort/issues). We're
happy to help you land your first contribution.
