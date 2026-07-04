# Releasing pkgsort (maintainers)

> Audience: repository maintainers. This describes how releases are performed
> **today**, based on [`.github/workflows/publish.yml`](../.github/workflows/publish.yml)
> and `package.json`.

Publishing is automated. Creating a **GitHub Release** triggers the publish
workflow, which validates, builds, and publishes `@rsuvarna/pkgsort` to npm using
**npm Trusted Publishing (OIDC)** with provenance. No npm token is stored, and no
one runs `npm publish` by hand.

## Versioning

- **Semantic Versioning.** The project is pre-1.0 (`0.x`); per project policy a
  minor version may still carry breaking changes (see [`docs/CONFIG.md`](./CONFIG.md) §3).
- The `version` field in `package.json` **at the released commit is the source of
  truth** — `npm publish` publishes exactly that version. It must be bumped and
  committed before you create the Release.
- [Changesets](https://github.com/changesets/changesets) is configured
  (`npm run changeset`) and may be used to record change entries and compute the
  next version. There is **no** automated Changesets publish; the release is
  driven by the GitHub Release event, not by merging a version PR.

## Prerequisites

One-time (already configured for this repo):

- A **Trusted Publisher** for `@rsuvarna/pkgsort` registered on npmjs.com,
  pointing at this repository and the `publish.yml` workflow. This is what lets
  CI authenticate to npm without a stored token.
- The package publishes under a public scope (`publishConfig.access: "public"`).

Per release:

- `main` is green on CI.
- `version` in `package.json` is bumped and committed on the commit you will tag.
- `CHANGELOG.md` is updated.
- You have permission to create a GitHub Release in this repository.

## Preparing a release

1. Confirm `main` is green.
2. Bump `version` in `package.json` (optionally via `npm run changeset`).
3. Update `CHANGELOG.md`.
4. Land those changes on `main` (via PR).

## Validating before releasing

- **Locally:** `npm run check` (typecheck + lint + format:check + test) and
  `npm run build`.
- **Enforced in CI:** the publish workflow re-runs `npm ci`, `npm run check`, and
  `npm run build` on a fresh checkout before publishing. In addition, `npm publish`
  runs the `prepublishOnly` hook (`clean` + `check` + `build`). An unvalidated or
  failing tree cannot be published.

## Cutting the release

1. Create and publish a **GitHub Release** whose tag matches the version (for
   example `v0.1.0`), targeting the commit that carries the bumped `version`.
2. Publishing the Release fires the `release: published` event, which starts the
   publish workflow. No further manual action is required.

## The publish workflow

Location: **[`.github/workflows/publish.yml`](../.github/workflows/publish.yml)**.

- **Trigger:** `release` → `published`.
- **Steps:** `checkout` (full history) → `setup-node` (Node 22, npm registry) →
  `npm ci` → `npm run check` → `npm run build` → `npm publish`.
- **Permissions:** `id-token: write` (OIDC) and `contents: read`.

### npm Trusted Publishing (OIDC)

Authentication uses GitHub's OIDC token exchanged with npm — there is **no**
`NPM_TOKEN` in the repository, environment, or CI secrets. The `id-token: write`
permission grants the workflow the short-lived identity npm verifies against the
Trusted Publisher configured above.

### Provenance

With `publishConfig.provenance: true` and the OIDC identity available in CI,
`npm publish` emits a **provenance attestation** linking the published tarball to
this repository, the release commit, and the workflow run. It is displayed on the
npm package page.

## Why manual `npm publish` is not the recommended method

- **No credentials on a laptop.** Publishing authority is scoped to the CI
  workflow via OIDC, not to a personal npm token.
- **Clean-room, validated build.** CI publishes from a fresh `npm ci` checkout
  that has passed the full `check` + `build`; a local publish can ship a dirty or
  unvalidated tree.
- **Provenance requires CI.** Trusted Publishing and provenance only work from
  the trusted workflow; a manual publish would lack provenance.
