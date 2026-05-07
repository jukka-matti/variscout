import { describe, expect, it } from 'vitest';
import {
  computeStepDrift,
  STEP_DRIFT_DEFAULT_THRESHOLD,
  type DriftResult,
  type StepCapabilityStamp,
} from '../stepDrift';

const stamp = (partial: Partial<StepCapabilityStamp>): StepCapabilityStamp => ({
  stepId: 's',
  n: 30,
  ...partial,
});

describe('computeStepDrift', () => {
  describe('threshold + flat detection', () => {
    it('exports default threshold of 0.05', () => {
      expect(STEP_DRIFT_DEFAULT_THRESHOLD).toBe(0.05);
    });

    it('returns flat when relative change is below default threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.3 }),
        prior: stamp({ cpk: 1.32 }),
        characteristicType: 'nominal',
      });

      expect(result?.direction).toBe('flat');
      expect(result?.metric).toBe('cpk');
    });

    it('respects a caller-supplied threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.3 }),
        prior: stamp({ cpk: 1.32 }),
        characteristicType: 'nominal',
        threshold: 0.001,
      });

      expect(result?.direction).toBe('down');
    });
  });

  describe('cpk metric', () => {
    it('returns up when cpk increases past threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5 }),
        prior: stamp({ cpk: 1.3 }),
        characteristicType: 'larger',
      });

      expect(result).toMatchObject<Partial<DriftResult>>({
        direction: 'up',
        metric: 'cpk',
      });
      expect(result?.magnitude).toBeCloseTo(0.1538, 3);
    });

    it('returns down when cpk decreases past threshold', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.1 }),
        prior: stamp({ cpk: 1.3 }),
        characteristicType: 'smaller',
      });

      expect(result?.direction).toBe('down');
      expect(result?.magnitude).toBeCloseTo(0.1538, 3);
    });
  });

  describe('mean metric with direction-of-improvement', () => {
    it('treats larger-is-better mean increases as up', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 110 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'larger',
      });

      expect(result?.direction).toBe('up');
      expect(result?.metric).toBe('mean');
    });

    it('treats larger-is-better mean decreases as down', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 90 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'larger',
      });

      expect(result?.direction).toBe('down');
    });

    it('treats smaller-is-better mean decreases as up', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 90 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'smaller',
      });

      expect(result?.direction).toBe('up');
    });

    it('treats smaller-is-better mean increases as down', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 110 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'smaller',
      });

      expect(result?.direction).toBe('down');
    });

    it('treats nominal mean movement toward target as up', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 102 }),
        prior: stamp({ mean: 110 }),
        characteristicType: 'nominal',
        target: 100,
      });

      expect(result?.direction).toBe('up');
      expect(result?.metric).toBe('mean');
      expect(result?.magnitude).toBeCloseTo(0.8, 5);
    });

    it('treats nominal mean movement away from target as down', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 120 }),
        prior: stamp({ mean: 110 }),
        characteristicType: 'nominal',
        target: 100,
      });

      expect(result?.direction).toBe('down');
    });

    it('returns null for nominal mean drift without a target', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 110 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'nominal',
      });

      expect(result).toBeNull();
    });

    it('returns flat when nominal prior mean is exactly on target', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 105 }),
        prior: stamp({ mean: 100 }),
        characteristicType: 'nominal',
        target: 100,
      });

      expect(result?.direction).toBe('flat');
      expect(result?.magnitude).toBe(0);
    });
  });

  describe('metric selection precedence', () => {
    it('prefers cpk over mean when both are available', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5, mean: 90 }),
        prior: stamp({ cpk: 1.3, mean: 100 }),
        characteristicType: 'smaller',
      });

      expect(result?.metric).toBe('cpk');
    });

    it('falls back to mean when cpk is missing on either side', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 90 }),
        prior: stamp({ cpk: 1.3, mean: 100 }),
        characteristicType: 'smaller',
      });

      expect(result?.metric).toBe('mean');
    });

    it('returns null when neither cpk nor mean is available on both sides', () => {
      const result = computeStepDrift({
        current: stamp({}),
        prior: stamp({ mean: 100 }),
        characteristicType: 'larger',
      });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns flat with magnitude 0 when prior cpk is 0', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5 }),
        prior: stamp({ cpk: 0 }),
        characteristicType: 'larger',
      });

      expect(result).toMatchObject({ direction: 'flat', magnitude: 0, metric: 'cpk' });
    });

    it('returns flat with magnitude 0 when prior mean is 0', () => {
      const result = computeStepDrift({
        current: stamp({ mean: 5 }),
        prior: stamp({ mean: 0 }),
        characteristicType: 'smaller',
      });

      expect(result?.direction).toBe('flat');
      expect(result?.magnitude).toBe(0);
    });

    it('returns the threshold actually used', () => {
      const result = computeStepDrift({
        current: stamp({ cpk: 1.5 }),
        prior: stamp({ cpk: 1.3 }),
        characteristicType: 'larger',
        threshold: 0.1,
      });

      expect(result?.threshold).toBe(0.1);
    });
  });
});
