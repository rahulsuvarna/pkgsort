/**
 * The canonical order for top-level `package.json` keys.
 *
 * This list mirrors the default field order of the widely-used
 * [`sort-package-json`](https://github.com/keithamus/sort-package-json) project
 * (as of 2026-07-04), so pkgsort produces the ordering the ecosystem already
 * expects. Keys are grouped by purpose: identity, descriptive metadata, module
 * type & entry points, files, scripts & tool config, dependency maps,
 * environment constraints, and publishing.
 *
 * **Intentional divergence:** pkgsort deliberately does *not* copy
 * `sort-package-json`'s handling of keys that are absent from this list.
 * `sort-package-json` sorts unknown keys alphabetically; pkgsort preserves
 * their original relative order and appends them after all known keys (see
 * {@link sortTopLevelKeys} and `docs/CONFIG.md` §3.2, `unknownKeys: "end"`).
 */
export const DEFAULT_KEY_ORDER: readonly string[] = [
  // Identity
  '$schema',
  'name',
  'displayName',
  'version',
  'stableVersion',
  'private',
  // Descriptive metadata
  'description',
  'categories',
  'keywords',
  'homepage',
  'bugs',
  'repository',
  'funding',
  'license',
  'qna',
  'author',
  'maintainers',
  'contributors',
  'publisher',
  // Module type & entry points
  'sideEffects',
  'type',
  'imports',
  'exports',
  'main',
  'svelte',
  'umd:main',
  'jsdelivr',
  'unpkg',
  'module',
  'source',
  'jsnext:main',
  'browser',
  'react-native',
  'types',
  'typesVersions',
  'typings',
  'style',
  'example',
  'examplestyle',
  'assets',
  'bin',
  'man',
  'directories',
  'files',
  'workspaces',
  'binary',
  // Scripts & tool configuration
  'scripts',
  'betterScripts',
  'wireit',
  'l10n',
  'contributes',
  'activationEvents',
  'husky',
  'simple-git-hooks',
  'pre-commit',
  'commitlint',
  'lint-staged',
  'nano-staged',
  'config',
  'nodemonConfig',
  'browserify',
  'babel',
  'browserslist',
  'xo',
  'prettier',
  'eslintConfig',
  'eslintIgnore',
  'npmpkgjsonlint',
  'npmPackageJsonLintConfig',
  'npmpackagejsonlint',
  'release',
  'remarkConfig',
  'stylelint',
  'ava',
  'jest',
  'jest-junit',
  'jest-stare',
  'mocha',
  'nyc',
  'c8',
  'tap',
  'oclif',
  // Dependency maps
  'resolutions',
  'overrides',
  'dependencies',
  'devDependencies',
  'dependenciesMeta',
  'peerDependencies',
  'peerDependenciesMeta',
  'optionalDependencies',
  'bundledDependencies',
  'bundleDependencies',
  'extensionPack',
  'extensionDependencies',
  'flat',
  // Environment constraints
  'packageManager',
  'engines',
  'engineStrict',
  'devEngines',
  'volta',
  'languageName',
  'os',
  'cpu',
  'preferGlobal',
  // Publishing & presentation
  'publishConfig',
  'icon',
  'badges',
  'galleryBanner',
  'preview',
  'markdown',
  'pnpm',
];

const KEY_RANK: ReadonlyMap<string, number> = new Map(
  DEFAULT_KEY_ORDER.map((key, index) => [key, index]),
);

/**
 * Return a new object with the same entries as `data`, its top-level keys
 * reordered into {@link DEFAULT_KEY_ORDER}.
 *
 * Only the arrangement of top-level keys changes: values (including nested
 * objects) are carried over untouched, and unknown keys keep their original
 * relative order at the end. The comparison is purely index-based, so the
 * result is deterministic and independent of locale.
 */
export function sortTopLevelKeys(data: Record<string, unknown>): Record<string, unknown> {
  const rank = (key: string): number => KEY_RANK.get(key) ?? Number.MAX_SAFE_INTEGER;

  // Array.prototype.sort is stable, so two unknown keys (equal rank) retain
  // their original order.
  const orderedKeys = Object.keys(data).sort((a, b) => rank(a) - rank(b));

  const result: Record<string, unknown> = {};
  for (const key of orderedKeys) {
    result[key] = data[key];
  }
  return result;
}
