import { describe, it, expect } from 'vitest';
import {
  isCharterReady,
  isSustainmentReady,
  isHandoffReady,
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

describe('isSustainmentReady', () => {
  it('returns false when no intervention and not demo', () => {
    expect(isSustainmentReady(empty)).toBe(false);
  });
  it('returns true when an intervention exists', () => {
    expect(isSustainmentReady({ ...empty, hasIntervention: true })).toBe(true);
  });
  it('returns true in demo mode regardless of intervention state', () => {
    expect(isSustainmentReady({ ...empty, isDemo: true })).toBe(true);
  });
  it('isDemo: false is equivalent to omitting it', () => {
    expect(isSustainmentReady({ ...empty, isDemo: false })).toBe(false);
    expect(isSustainmentReady({ ...empty, hasIntervention: true, isDemo: false })).toBe(true);
  });
});

describe('isHandoffReady', () => {
  it('returns false when sustainment not confirmed and not demo', () => {
    expect(isHandoffReady(empty)).toBe(false);
  });
  it('returns false even with intervention if sustainment not confirmed', () => {
    expect(isHandoffReady({ ...empty, hasIntervention: true })).toBe(false);
  });
  it('returns true when sustainment is confirmed', () => {
    expect(isHandoffReady({ ...empty, sustainmentConfirmed: true })).toBe(true);
  });
  it('returns true in demo mode regardless of sustainment state', () => {
    expect(isHandoffReady({ ...empty, isDemo: true })).toBe(true);
  });
});
