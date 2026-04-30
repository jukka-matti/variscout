import { describe, it, expect } from 'vitest';
import { resolveCpkTarget, DEFAULT_CPK_TARGET } from '../resolve';
import type { SpecLimits } from '../../types';

describe('resolveCpkTarget', () => {
  it('per-column spec wins over hub + project + default', () => {
    const measureSpecs: Record<string, SpecLimits> = {
      Weight: { cpkTarget: 2.0 },
    };
    expect(
      resolveCpkTarget('Weight', {
        measureSpecs,
        hubCpkTarget: 1.5,
        projectCpkTarget: 1.4,
      })
    ).toBe(2.0);
  });

  it('hub default wins when no per-column spec', () => {
    const measureSpecs: Record<string, SpecLimits> = {
      Weight: { usl: 100 }, // no cpkTarget on this column
    };
    expect(
      resolveCpkTarget('Weight', {
        measureSpecs,
        hubCpkTarget: 1.5,
        projectCpkTarget: 1.4,
      })
    ).toBe(1.5);
  });

  it('project default wins when no per-column or hub', () => {
    expect(
      resolveCpkTarget('Weight', {
        projectCpkTarget: 1.4,
      })
    ).toBe(1.4);
  });

  it('falls back to DEFAULT_CPK_TARGET (1.33) when nothing is set', () => {
    expect(resolveCpkTarget('Weight', {})).toBe(DEFAULT_CPK_TARGET);
    expect(resolveCpkTarget('Weight', {})).toBe(1.33);
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
    ).toBe(1.5);
  });
});
