// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Flat config (ESLint v9+). We lint with type information so that rules such as
 * `no-floating-promises` can catch real correctness bugs — important for a tool
 * that mutates files on disk. Prettier owns all stylistic concerns, so its
 * config is applied last to disable any formatting rules ESLint might enable.
 */
export default tseslint.config(
  {
    // Nothing under these paths is authored by us.
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '**/*.snap'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Tests may use non-null assertions and looser typing for fixtures.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    // JS config files (this file, prettier.config.js) are not part of the
    // TypeScript program, so type-aware linting cannot resolve them. Lint them
    // with syntactic rules only.
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
