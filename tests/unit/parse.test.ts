import { describe, expect, it } from 'vitest';

import { ParseError, parse } from '../../src/core/parse.js';

describe('parse', () => {
  it('parses a valid package.json object', () => {
    const { data } = parse('{\n  "name": "demo",\n  "version": "1.0.0"\n}\n');
    expect(data).toEqual({ name: 'demo', version: '1.0.0' });
  });

  it('detects two-space indentation', () => {
    const { style } = parse('{\n  "name": "demo"\n}\n');
    expect(style.indent).toBe('  ');
  });

  it('detects four-space indentation', () => {
    const { style } = parse('{\n    "name": "demo"\n}\n');
    expect(style.indent).toBe('    ');
  });

  it('detects tab indentation', () => {
    const { style } = parse('{\n\t"name": "demo"\n}\n');
    expect(style.indent).toBe('\t');
  });

  it('falls back to two spaces when there are no indented lines', () => {
    const { style } = parse('{"name":"demo"}');
    expect(style.indent).toBe('  ');
  });

  it('records the presence of a trailing newline', () => {
    expect(parse('{\n  "name": "demo"\n}\n').style.trailingNewline).toBe(true);
    expect(parse('{\n  "name": "demo"\n}').style.trailingNewline).toBe(false);
  });

  it('throws ParseError on malformed JSON', () => {
    expect(() => parse('{ not json }')).toThrow(ParseError);
  });

  it('throws ParseError when the top level is not an object', () => {
    expect(() => parse('[1, 2, 3]')).toThrow(ParseError);
    expect(() => parse('"just a string"')).toThrow(ParseError);
    expect(() => parse('null')).toThrow(ParseError);
  });
});
