import { describe, it, expect } from 'vitest';
import {
  isCharterReady,
  isControlReady,
  type WorkflowReadinessSignals,
} from '../responsePathReadiness';

const empty: WorkflowReadinessSignals = {
  hasIntervention: false,
  sustainmentConfirmed: false,
};

describe('isCharterReady', () => {
  it('returns true for an empty hub (DMAIC Define-phase artifact, no prerequisite)', () => {
    expect(isCharterReady(empty)).toBe(true);
  });
  it('returns true regardless of other signals', () => {
    expect(
      isCharterReady({ hasIntervention: true, sustainmentConfirmed: true, isDemo: true })
    ).toBe(true);
  });
});

describe('isControlReady', () => {
  it('returns false when no intervention and not demo', () => {
    expect(isControlReady(empty)).toBe(false);
  });
  it('returns true when an intervention exists', () => {
    expect(isControlReady({ ...empty, hasIntervention: true })).toBe(true);
  });
  it('returns true in demo mode regardless of intervention state', () => {
    expect(isControlReady({ ...empty, isDemo: true })).toBe(true);
  });
  it('isDemo: false is equivalent to omitting it', () => {
    expect(isControlReady({ ...empty, isDemo: false })).toBe(false);
    expect(isControlReady({ ...empty, hasIntervention: true, isDemo: false })).toBe(true);
  });
});
