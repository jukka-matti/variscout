import type { CharacteristicType } from '../types';

export interface StepCapabilityStamp {
  stepId: string;
  n: number;
  mean?: number;
  sigma?: number;
  cpk?: number;
}

export interface DriftResult {
  direction: 'up' | 'down' | 'flat';
  magnitude: number;
  threshold: number;
  metric: 'cpk' | 'mean';
}

export const STEP_DRIFT_DEFAULT_THRESHOLD = 0.05;

export interface ComputeStepDriftArgs {
  current: StepCapabilityStamp;
  prior: StepCapabilityStamp;
  characteristicType: CharacteristicType;
  target?: number;
  threshold?: number;
}

export function computeStepDrift(args: ComputeStepDriftArgs): DriftResult | null {
  const threshold = args.threshold ?? STEP_DRIFT_DEFAULT_THRESHOLD;

  if (isFiniteNumber(args.current.cpk) && isFiniteNumber(args.prior.cpk)) {
    return cpkDrift(args.current.cpk, args.prior.cpk, threshold);
  }

  if (isFiniteNumber(args.current.mean) && isFiniteNumber(args.prior.mean)) {
    return meanDrift({
      currentMean: args.current.mean,
      priorMean: args.prior.mean,
      characteristicType: args.characteristicType,
      target: args.target,
      threshold,
    });
  }

  return null;
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function cpkDrift(currentCpk: number, priorCpk: number, threshold: number): DriftResult {
  if (priorCpk === 0) {
    return { direction: 'flat', magnitude: 0, threshold, metric: 'cpk' };
  }

  const relativeChange = (currentCpk - priorCpk) / priorCpk;
  const magnitude = Math.abs(relativeChange);
  if (magnitude < threshold) {
    return { direction: 'flat', magnitude, threshold, metric: 'cpk' };
  }

  return {
    direction: relativeChange > 0 ? 'up' : 'down',
    magnitude,
    threshold,
    metric: 'cpk',
  };
}

function meanDrift({
  currentMean,
  priorMean,
  characteristicType,
  target,
  threshold,
}: {
  currentMean: number;
  priorMean: number;
  characteristicType: CharacteristicType;
  target?: number;
  threshold: number;
}): DriftResult | null {
  if (characteristicType === 'nominal') {
    if (!isFiniteNumber(target)) return null;
    return nominalMeanDrift(currentMean, priorMean, target, threshold);
  }

  if (priorMean === 0) {
    return { direction: 'flat', magnitude: 0, threshold, metric: 'mean' };
  }

  const relativeChange = (currentMean - priorMean) / priorMean;
  const magnitude = Math.abs(relativeChange);
  if (magnitude < threshold) {
    return { direction: 'flat', magnitude, threshold, metric: 'mean' };
  }

  const improving = characteristicType === 'larger' ? relativeChange > 0 : relativeChange < 0;
  return {
    direction: improving ? 'up' : 'down',
    magnitude,
    threshold,
    metric: 'mean',
  };
}

function nominalMeanDrift(
  currentMean: number,
  priorMean: number,
  target: number,
  threshold: number
): DriftResult {
  const priorDistance = Math.abs(priorMean - target);
  const currentDistance = Math.abs(currentMean - target);

  if (priorDistance === 0) {
    return { direction: 'flat', magnitude: 0, threshold, metric: 'mean' };
  }

  const relativeChange = (currentDistance - priorDistance) / priorDistance;
  const magnitude = Math.abs(relativeChange);
  if (magnitude < threshold) {
    return { direction: 'flat', magnitude, threshold, metric: 'mean' };
  }

  return {
    direction: relativeChange < 0 ? 'up' : 'down',
    magnitude,
    threshold,
    metric: 'mean',
  };
}
