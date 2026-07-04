# Configuration Reference — pkgsort

> **Status:** Draft — describes the _intended_ configuration surface. Options are
> stabilized milestone by milestone (see [`ROADMAP.md`](./ROADMAP.md)).

pkgsort is designed to be run with **no configuration at all**. This reference
exists for the cases where a team needs to deviate from the defaults. Every
option here has a chosen default and a stated rationale.

---

## 1. Configuration sources & precedence

pkgsort resolves configuration by merging these sources, highest priority first:

1. **CLI flags** (e.g. `--indent 4`)
2. **`pkgsort.config.json` / `.jsonc` / `.js`** in the project (nearest to the
   target file wins)
3. **`"pkgsort"` key** inside a `package.json`
4. **Built-in defaults**

For monorepos, configuration is resolved _per target file_ by walking up the
directory tree, so individual packages can override the workspace default.

## 2. Authoring a config file

The initial product supports **JSON, JSONC, and JavaScript** config files only.
Pick whichever suits your project; all three describe the same options.

JSON (`pkgsort.config.json`) — no tooling required:

```json
{
  "indent": 2,
  "finalNewline": true,
  "sort": {
    "topLevelKeys": true,
    "dependencies": "alphabetical"
  }
}
```

JSONC (`pkgsort.config.jsonc`) — JSON with comments, when you want to explain a
choice:

```jsonc
{
  // Match the repo's Prettier width.
  "indent": 2,
  "finalNewline": true,
}
```

JavaScript (`pkgsort.config.js`) — for computed values:

```js
export default {
  indent: 2,
  finalNewline: true,
};
```

> **No typed `defineConfig()` helper yet.** Because `0.1` publishes a CLI only
> (no importable types), configuration is plain JSON/JSONC/JS. A typed config
> entry point may be introduced later if there is clear demand.

## 3. Options

> ⚠️ **Stability:** until `1.0`, option names and defaults may change between
> minor versions. Changes are always documented in the [changelog](../CHANGELOG.md).

### 3.1 Formatting

| Option         | Type             | Default | Description                                                                                       |
| -------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `indent`       | `number \| "\t"` | `2`     | Spaces per indent level, or a literal tab. Matches the ecosystem default and npm's own behaviour. |
| `finalNewline` | `boolean`        | `true`  | Ensure the file ends with exactly one `\n`. POSIX-friendly and diff-friendly.                     |

**Rationale:** two-space indent with a trailing newline is what the overwhelming
majority of tools emit; defaulting to it minimizes churn on first run.

### 3.2 Sorting (`sort`)

| Option                  | Type                           | Default                                                                           | Description                                            |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `sort.topLevelKeys`     | `boolean`                      | `true`                                                                            | Reorder top-level keys into the canonical order.       |
| `sort.dependencies`     | `"alphabetical" \| "preserve"` | `"alphabetical"`                                                                  | Sort dependency-style maps, or leave them as authored. |
| `sort.dependencyFields` | `string[]`                     | `["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]` | Which maps are treated as dependency maps for sorting. |
| `sort.unknownKeys`      | `"end" \| "alphabetical"`      | `"end"`                                                                           | Where keys not in the canonical order are placed.      |

**Rationale:** alphabetical dependency ordering is the single biggest source of
avoidable merge conflicts, so it is on by default. Sorting uses a
locale-independent comparator so results are identical on every machine.

> **Note:** pkgsort deliberately does **not** rewrite field _values_. There is
> no license/URL/`engines` "normalization" — the tool only reorders keys and
> reformats whitespace, so the meaning of your `package.json` is never changed.
> See [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.

### 3.3 Behaviour

| Option            | Type       | Default | Description                                                                           |
| ----------------- | ---------- | ------- | ------------------------------------------------------------------------------------- |
| `ignore`          | `string[]` | `[]`    | Globs of `package.json` files to skip (in addition to defaults like `node_modules`).  |
| `preserveUnknown` | `boolean`  | `true`  | Keep keys pkgsort does not recognize. **Turning this off is unsafe and discouraged.** |

## 4. CLI flags

CLI flags override file configuration. The canonical, machine-checkable list is
`pkgsort --help`; the common ones:

| Flag                       | Maps to / effect                                      |
| -------------------------- | ----------------------------------------------------- |
| `--check`                  | Do not write; exit non-zero if any file would change. |
| `--diff`                   | Print a unified diff of proposed changes.             |
| `--indent <n\|tab>`        | Override `indent`.                                    |
| `--reporter <human\|json>` | Choose the output reporter.                           |
| `--config <path>`          | Use an explicit config file.                          |
| `--ignore <glob>`          | Add an ignore glob (repeatable).                      |

## 5. Recommended setups

**CI gate (most common):**

```jsonc
// package.json scripts
{
  "scripts": {
    "format:pkg": "pkgsort",
    "lint:pkg": "pkgsort --check",
  },
}
```

Run `pkgsort --check` in CI and `pkgsort` locally / in a pre-commit hook.

**Monorepo root:** commit a single `pkgsort.config.json` at the root; per-package
overrides are only needed for genuine exceptions.

## 6. Validation & errors

Configuration is validated on load. Invalid options fail fast with a precise
message naming the offending key and the expected type, and the process exits
with code `2`. pkgsort never silently ignores an unknown or misspelled option.
