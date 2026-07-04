# `tests/` — test layout

The suite mirrors the testing strategy in
[`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md):

| Directory      | Scope                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `unit/`        | A single pipeline stage, rule, or util in isolation.                                                                 |
| `integration/` | `format()` end-to-end over fixture pairs.                                                                            |
| `invariants/`  | Determinism: idempotency (`format(format(x)) === format(x)`) and round-trip safety (no data loss). These are gating. |
| `e2e/`         | The built CLI, spawned as a subprocess — flags, exit codes, stdout/stderr.                                           |
| `fixtures/`    | Input/expected `package.json` pairs and a real-world corpus.                                                         |

Coverage thresholds are enforced by `vitest.config.ts`. See
[`CONTRIBUTING.md`](../CONTRIBUTING.md#testing-expectations) for what each kind
of change must include.
