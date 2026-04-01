import { describe, it, expect } from 'vitest';
import { parseRefMarkers, stripRefMarkers } from '../refMarkers';

describe('parseRefMarkers', () => {
  it('returns original text when no markers present', () => {
    const result = parseRefMarkers('Hello world');
    expect(result.cleanText).toBe('Hello world');
    expect(result.refs).toEqual([]);
  });

  it('parses single marker with type and id', () => {
    const result = parseRefMarkers(
      'The [REF:boxplot:Machine A]Machine A[/REF] shows high variation'
    );
    expect(result.cleanText).toBe('The Machine A shows high variation');
    expect(result.refs).toHaveLength(1);
    expect(result.refs[0]).toEqual({
      targetType: 'boxplot',
      targetId: 'Machine A',
      displayText: 'Machine A',
      startIndex: 4,
      endIndex: 13,
    });
  });

  it('parses marker without id', () => {
    const result = parseRefMarkers('Check the [REF:dashboard]dashboard[/REF]');
    expect(result.cleanText).toBe('Check the dashboard');
    expect(result.refs[0].targetType).toBe('dashboard');
    expect(result.refs[0].targetId).toBeUndefined();
  });

  it('parses multiple markers', () => {
    const text = '[REF:boxplot:A]A[/REF] and [REF:pareto:B]B[/REF] are significant';
    const result = parseRefMarkers(text);
    expect(result.cleanText).toBe('A and B are significant');
    expect(result.refs).toHaveLength(2);
    expect(result.refs[0].targetType).toBe('boxplot');
    expect(result.refs[1].targetType).toBe('pareto');
  });

  it('handles empty id gracefully', () => {
    const result = parseRefMarkers('[REF:stats:]Cpk[/REF]');
    expect(result.refs[0].targetId).toBeUndefined();
  });

  it('handles all supported target types', () => {
    const types = [
      'boxplot',
      'ichart',
      'pareto',
      'stats',
      'yamazumi',
      'finding',
      'hypothesis',
      'dashboard',
      'improvement',
    ];
    for (const type of types) {
      const result = parseRefMarkers(`[REF:${type}:x]text[/REF]`);
      expect(result.refs[0].targetType).toBe(type);
    }
  });

  it('preserves text around markers', () => {
    const result = parseRefMarkers('Before [REF:stats:cpk]Cpk[/REF] after');
    expect(result.cleanText).toBe('Before Cpk after');
  });

  it('handles consecutive markers', () => {
    const result = parseRefMarkers('[REF:boxplot:A]A[/REF][REF:boxplot:B]B[/REF]');
    expect(result.cleanText).toBe('AB');
    expect(result.refs).toHaveLength(2);
  });
});

describe('stripRefMarkers', () => {
  it('removes markers keeping display text', () => {
    expect(stripRefMarkers('[REF:boxplot:A]Machine A[/REF] is bad')).toBe('Machine A is bad');
  });

  it('handles text without markers', () => {
    expect(stripRefMarkers('No markers here')).toBe('No markers here');
  });
});
