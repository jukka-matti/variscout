import { describe, it, expect } from 'vitest';
import type { WorkflowReadinessSignals } from '@variscout/core';
import { computeCtaState, type ResponsePathKind } from '../responsePathCta';

const empty: WorkflowReadinessSignals = {
  hasIntervention: false,
  sustainmentConfirmed: false,
};

const ALWAYS_AVAILABLE: ResponsePathKind[] = ['quick-action', 'focused-investigation', 'charter'];

describe('computeCtaState — paths with no prerequisite', () => {
  for (const path of ALWAYS_AVAILABLE) {
    it(`${path} is active when handler wired (regardless of signals)`, () => {
      expect(computeCtaState({ path, signals: empty, hasHandler: true })).toEqual({
        kind: 'active',
      });
      expect(
        computeCtaState({
          path,
          signals: { hasIntervention: true, sustainmentConfirmed: true },
          hasHandler: true,
        })
      ).toEqual({ kind: 'active' });
    });

    it(`${path} is hidden when no handler is wired`, () => {
      expect(computeCtaState({ path, signals: empty, hasHandler: false })).toEqual({
        kind: 'hidden',
      });
    });
  }
});

describe('computeCtaState — sustainment', () => {
  it('is prerequisite-locked (no-intervention) when no intervention recorded', () => {
    expect(computeCtaState({ path: 'sustainment', signals: empty, hasHandler: true })).toEqual({
      kind: 'prerequisite-locked',
      reason: 'no-intervention',
    });
  });

  it('is prerequisite-locked even when handler missing if intervention also missing', () => {
    expect(computeCtaState({ path: 'sustainment', signals: empty, hasHandler: false })).toEqual({
      kind: 'prerequisite-locked',
      reason: 'no-intervention',
    });
  });

  it('is active when intervention exists and handler wired', () => {
    expect(
      computeCtaState({
        path: 'sustainment',
        signals: { ...empty, hasIntervention: true },
        hasHandler: true,
      })
    ).toEqual({ kind: 'active' });
  });

  it('is hidden when intervention exists but handler missing', () => {
    expect(
      computeCtaState({
        path: 'sustainment',
        signals: { ...empty, hasIntervention: true },
        hasHandler: false,
      })
    ).toEqual({ kind: 'hidden' });
  });

  it('isDemo: true bypasses the intervention prerequisite', () => {
    expect(
      computeCtaState({
        path: 'sustainment',
        signals: { ...empty, isDemo: true },
        hasHandler: true,
      })
    ).toEqual({ kind: 'active' });
  });
});

describe('computeCtaState — handoff', () => {
  it('is prerequisite-locked (no-sustainment-confirmed) when sustainment not confirmed', () => {
    expect(computeCtaState({ path: 'handoff', signals: empty, hasHandler: true })).toEqual({
      kind: 'prerequisite-locked',
      reason: 'no-sustainment-confirmed',
    });
  });

  it('is prerequisite-locked even with intervention if sustainment not confirmed', () => {
    expect(
      computeCtaState({
        path: 'handoff',
        signals: { ...empty, hasIntervention: true },
        hasHandler: true,
      })
    ).toEqual({ kind: 'prerequisite-locked', reason: 'no-sustainment-confirmed' });
  });

  it('is active when sustainment confirmed and handler wired', () => {
    expect(
      computeCtaState({
        path: 'handoff',
        signals: { ...empty, sustainmentConfirmed: true },
        hasHandler: true,
      })
    ).toEqual({ kind: 'active' });
  });

  it('is hidden when sustainment confirmed but handler missing', () => {
    expect(
      computeCtaState({
        path: 'handoff',
        signals: { ...empty, sustainmentConfirmed: true },
        hasHandler: false,
      })
    ).toEqual({ kind: 'hidden' });
  });

  it('isDemo: true bypasses the sustainment-confirmed prerequisite', () => {
    expect(
      computeCtaState({
        path: 'handoff',
        signals: { ...empty, isDemo: true },
        hasHandler: true,
      })
    ).toEqual({ kind: 'active' });
  });
});
