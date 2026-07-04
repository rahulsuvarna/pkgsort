import { describe, expect, it } from 'vitest';

import { ParseError } from '../../src/core/parse.js';
import { format } from '../../src/core/pipeline.js';

describe('format', () => {
  it('sorts top-level keys and reports the change', () => {
    const input = '{\n  "version": "1.0.0",\n  "name": "demo"\n}\n';
    const { output, changed } = format(input);
    expect(output).toBe('{\n  "name": "demo",\n  "version": "1.0.0"\n}\n');
    expect(changed).toBe(true);
  });

  it('reports no change for already-sorted input', () => {
    const input = '{\n  "name": "demo",\n  "version": "1.0.0"\n}\n';
    const { output, changed } = format(input);
    expect(output).toBe(input);
    expect(changed).toBe(false);
  });

  it('preserves two-space indentation', () => {
    const { output } = format('{\n  "version": "1.0.0",\n  "name": "demo"\n}\n');
    expect(output).toBe('{\n  "name": "demo",\n  "version": "1.0.0"\n}\n');
  });

  it('preserves four-space indentation', () => {
    const { output } = format('{\n    "version": "1.0.0",\n    "name": "demo"\n}\n');
    expect(output).toBe('{\n    "name": "demo",\n    "version": "1.0.0"\n}\n');
  });

  it('leaves nested objects untouched', () => {
    const input = '{\n  "scripts": {\n    "b": "b",\n    "a": "a"\n  },\n  "name": "demo"\n}\n';
    const { output } = format(input);
    // "name" moves above "scripts", but the scripts map keeps its own order.
    expect(output).toBe(
      '{\n  "name": "demo",\n  "scripts": {\n    "b": "b",\n    "a": "a"\n  }\n}\n',
    );
  });

  it('is idempotent: formatting twice yields the same output', () => {
    const input = '{\n  "version": "1.0.0",\n  "private": true,\n  "name": "demo"\n}\n';
    const once = format(input).output;
    const twice = format(once).output;
    expect(twice).toBe(once);
    expect(format(once).changed).toBe(false);
  });

  it('throws ParseError on invalid JSON', () => {
    expect(() => format('{ invalid')).toThrow(ParseError);
  });
});
