import { describe, it, expect } from 'vitest';
import { resolveCpkTarget, sourceLabelFor, DEFAULT_CPK_TARGET } from '../resolve';
import type { SpecLimits } from '../../types';

describe('resolveCpkTarget', () => {
  it('per-column spec wins over hub + project + default (source = spec)', () => {
    const measureSpecs: Record<string, SpecLimits> = {
      Weight: { cpkTarget: 2.0 },
    };
    expect(
      resolveCpkTarget('Weight', {
        measureSpecs,
        hubCpkTarget: 1.5,
        projectCpkTarget: 1.4,
      })
    ).toEqual({ value: 2.0, source: 'spec' });
  });

  it('hub default wins when no per-column spec (source = hub)', () => {
    const measureSpecs: Record<string, SpecLimits> = {
      Weight: { usl: 100 }, // no cpkTarget on this column
    };
    expect(
      resolveCpkTarget('Weight', {
        measureSpecs,
        hubCpkTarget: 1.5,
        projectCpkTarget: 1.4,
      })
    ).toEqual({ value: 1.5, source: 'hub' });
  });

  it('project default wins when no per-column or hub (source = investigation)', () => {
    expect(
      resolveCpkTarget('Weight', {
        projectCpkTarget: 1.4,
      })
    ).toEqual({ value: 1.4, source: 'investigation' });
  });

  it('falls back to DEFAULT_CPK_TARGET (1.33) when nothing is set (source = default)', () => {
    expect(resolveCpkTarget('Weight', {})).toEqual({
      value: DEFAULT_CPK_TARGET,
      source: 'default',
    });
    expect(resolveCpkTarget('Weight', {})).toEqual({ value: 1.33, source: 'default' });
  });

  it('column missing from measureSpecs falls through cascade correctly', () => {
    const measureSpecs: Record<string, SpecLimits> = {
      OtherColumn: { cpkTarget: 2.0 },
    };
    // 'Weight' is not in the map; should skip per-column and use hub
    expect(
      resolveCpkTarget('Weight', {
        measureSpecs,
        hubCpkTarget: 1.5,
        projectCpkTarget: 1.4,
      })
    ).toEqual({ value: 1.5, source: 'hub' });
  });

  it('non-finite per-column cpkTarget is skipped, falls through to hub', () => {
    const measureSpecs: Record<string, SpecLimits> = {
      Weight: { cpkTarget: Number.NaN as unknown as number },
    };
    expect(
      resolveCpkTarget('Weight', {
        measureSpecs,
        hubCpkTarget: 1.5,
      })
    ).toEqual({ value: 1.5, source: 'hub' });
  });
});

describe('sourceLabelFor', () => {
  it('returns the literal English label for each cascade source', () => {
    expect(sourceLabelFor('spec')).toBe('per-spec');
    expect(sourceLabelFor('hub')).toBe('hub default');
    expect(sourceLabelFor('investigation')).toBe('investigation default');
    expect(sourceLabelFor('default')).toBe('default');
  });
});
