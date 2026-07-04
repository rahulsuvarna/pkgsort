import { describe, expect, it } from 'vitest';

import { serialize } from '../../src/core/serialize.js';

describe('serialize', () => {
  it('emits two-space indentation with a trailing newline', () => {
    const output = serialize({ name: 'demo' }, { indent: '  ', trailingNewline: true });
    expect(output).toBe('{\n  "name": "demo"\n}\n');
  });

  it('emits four-space indentation', () => {
    const output = serialize({ name: 'demo' }, { indent: '    ', trailingNewline: true });
    expect(output).toBe('{\n    "name": "demo"\n}\n');
  });

  it('emits tab indentation', () => {
    const output = serialize({ name: 'demo' }, { indent: '\t', trailingNewline: true });
    expect(output).toBe('{\n\t"name": "demo"\n}\n');
  });

  it('omits the trailing newline when the style says so', () => {
    const output = serialize({ name: 'demo' }, { indent: '  ', trailingNewline: false });
    expect(output).toBe('{\n  "name": "demo"\n}');
  });
});
