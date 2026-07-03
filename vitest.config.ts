import { defineConfig } from 'vitest/config';

/**
 * Test runner configuration.
 *
 * We deliberately keep unit, integration, and e2e tests in one Vitest project
 * so `npm test` runs the entire suite. Coverage thresholds are enforced in CI
 * to prevent silent erosion of test quality as the codebase grows.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
    // e2e tests spawn the built CLI and can be slower than unit tests.
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/types.ts', 'src/cli.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
