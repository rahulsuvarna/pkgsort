# `src/` — source layout

This directory implements the **"pure core, effectful shell"** design described
in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). The concrete module map and
the responsibility of each file are documented in
[`CONTRIBUTING.md`](../CONTRIBUTING.md#repository-layout).

The single load-bearing rule: **`core/` and `sorters/` must stay pure** — no
filesystem, network, time, or randomness. Only the shell (`cli.ts`,
`monorepo/`, `utils/fs.ts`) is allowed to perform I/O.

Directories are populated milestone by milestone (see the
[Roadmap](../docs/ROADMAP.md)); the `.gitkeep` placeholders mark the intended
structure before code lands.
