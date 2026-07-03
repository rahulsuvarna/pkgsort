/**
 * Prettier configuration.
 *
 * pkgsort formats *package.json*; Prettier formats *our own source*. Keeping a
 * single, explicit style here means every contribution looks identical
 * regardless of editor settings, which keeps diffs small and reviews focused on
 * behaviour rather than whitespace.
 *
 * @type {import('prettier').Config}
 */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};
