import { describe, expect, it } from 'vitest';

import { DEFAULT_KEY_ORDER, sortTopLevelKeys } from '../../src/sorters/top-level-keys.js';

describe('DEFAULT_KEY_ORDER', () => {
  it('contains no duplicate keys', () => {
    const seen = new Set<string>();
    const duplicates = DEFAULT_KEY_ORDER.filter((key) => {
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
    // A duplicate would give a key two ranks and make ordering ambiguous.
    expect(duplicates).toEqual([]);
    expect(seen.size).toBe(DEFAULT_KEY_ORDER.length);
  });
});

describe('sortTopLevelKeys', () => {
  it('orders known keys into the canonical order', () => {
    const input = {
      dependencies: { left: '1.0.0' },
      name: 'demo',
      scripts: { build: 'tsc' },
      version: '1.0.0',
    };
    expect(Object.keys(sortTopLevelKeys(input))).toEqual([
      'name',
      'version',
      'scripts',
      'dependencies',
    ]);
  });

  it('leaves nested objects untouched (same reference, unsorted)', () => {
    const nested = { z: 1, a: 2 };
    const result = sortTopLevelKeys({ dependencies: nested, name: 'demo' });
    // The nested object is carried over by reference, and its own key order is
    // not changed.
    expect(result.dependencies).toBe(nested);
    expect(Object.keys(result.dependencies as object)).toEqual(['z', 'a']);
  });

  it('preserves all values', () => {
    const input = { version: '1.0.0', name: 'demo', private: true };
    expect(sortTopLevelKeys(input)).toEqual(input);
  });

  it('does not mutate its input', () => {
    const input = { version: '1.0.0', name: 'demo' };
    sortTopLevelKeys(input);
    expect(Object.keys(input)).toEqual(['version', 'name']);
  });

  // --- Alignment with sort-package-json -----------------------------------
  // The canonical order mirrors sort-package-json's default field order. These
  // cases pin the specific placements that make the two agree, so a regression
  // in DEFAULT_KEY_ORDER is caught.
  describe('alignment with sort-package-json', () => {
    it('matches sort-package-json ordering for the fields that once differed', () => {
      const input = {
        contributors: [],
        maintainers: [],
        dependencies: {},
        overrides: {},
        resolutions: {},
        dependenciesMeta: {},
        peerDependencies: {},
        exports: {},
        imports: {},
        type: 'module',
        sideEffects: false,
      };
      expect(Object.keys(sortTopLevelKeys(input))).toEqual([
        // metadata: maintainers before contributors
        'maintainers',
        'contributors',
        // module block: sideEffects before type, imports before exports
        'sideEffects',
        'type',
        'imports',
        'exports',
        // dependency block: resolutions & overrides before dependencies,
        // dependenciesMeta between dependencies and peerDependencies
        'resolutions',
        'overrides',
        'dependencies',
        'dependenciesMeta',
        'peerDependencies',
      ]);
    });

    it('places well-known tool-config keys ahead of dependency maps', () => {
      const input = { dependencies: {}, prettier: {}, husky: {}, scripts: {} };
      expect(Object.keys(sortTopLevelKeys(input))).toEqual([
        'scripts',
        'husky',
        'prettier',
        'dependencies',
      ]);
    });
  });

  // --- Intentional divergence from sort-package-json ----------------------
  describe('intentional divergence: unknown-key handling', () => {
    it('preserves the relative order of unknown keys instead of alphabetizing them', () => {
      // sort-package-json would alphabetize these to [apple, mango, zebra];
      // pkgsort keeps them in their original order, appended after known keys.
      const input = { zebra: 1, version: '1.0.0', mango: 2, name: 'demo', apple: 3 };
      const keys = Object.keys(sortTopLevelKeys(input));
      expect(keys).toEqual(['name', 'version', 'zebra', 'mango', 'apple']);
      expect(keys).not.toEqual(['name', 'version', 'apple', 'mango', 'zebra']);
    });

    it('appends every unknown key after all known keys', () => {
      const input = { customB: 1, dependencies: {}, customA: 2, name: 'demo' };
      expect(Object.keys(sortTopLevelKeys(input))).toEqual([
        'name',
        'dependencies',
        'customB',
        'customA',
      ]);
    });
  });
});
