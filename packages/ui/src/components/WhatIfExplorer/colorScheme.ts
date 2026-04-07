/**
 * Color scheme for What-If simulator components (BasicEstimator, ModelInformedEstimator, etc.)
 */
export interface WhatIfSimulatorColorScheme {
  /** Container border */
  containerBorder: string;
  /** Container background */
  containerBg: string;
  /** Header hover background */
  headerHoverBg: string;
  /** Primary content text */
  contentText: string;
  /** Secondary text */
  secondaryText: string;
  /** Muted text */
  mutedText: string;
  /** Preset button border */
  presetBorder: string;
  /** Preset button background */
  presetBg: string;
  /** Preset button hover background */
  presetHoverBg: string;
  /** Preset button text */
  presetText: string;
  /** Preset button hover text */
  presetHoverText: string;
  /** Projection panel background */
  projectionBg: string;
  /** Projection panel border */
  projectionBorder: string;
  /** Reset hover text */
  resetHoverText: string;
  /** Cpk good color (>= cpkTarget) */
  cpkGood: string;
  /** Cpk marginal color (>= 75% of cpkTarget) */
  cpkOk: string;
  /** Cpk bad color (< 1.0) */
  cpkBad: string;
  /** Positive improvement color */
  improvementPositive: string;
  /** Negative improvement color (Cpk decline, yield decline) */
  improvementNegative: string;
  /** Slider track background */
  sliderTrackBg: string;
  /** Slider ring offset */
  sliderRingOffset: string;
  /** Slider Firefox track background */
  sliderMozTrackBg: string;
}

export const whatIfSimulatorDefaultColorScheme: WhatIfSimulatorColorScheme = {
  containerBorder: 'border-edge',
  containerBg: 'bg-surface/50',
  headerHoverBg: 'hover:bg-surface-tertiary/30',
  contentText: 'text-content',
  secondaryText: 'text-content-secondary',
  mutedText: 'text-content-muted',
  presetBorder: 'border-edge',
  presetBg: 'bg-surface',
  presetHoverBg: 'hover:bg-surface-tertiary',
  presetText: 'text-content-secondary',
  presetHoverText: 'hover:text-content',
  projectionBg: 'bg-surface-tertiary/50',
  projectionBorder: 'border-edge/50',
  resetHoverText: 'hover:text-content',
  cpkGood: 'text-green-400',
  cpkOk: 'text-amber-400',
  cpkBad: 'text-red-400',
  improvementPositive: 'text-green-400',
  improvementNegative: 'text-red-400',
  sliderTrackBg: 'bg-surface-tertiary',
  sliderRingOffset: 'focus:ring-offset-surface',
  sliderMozTrackBg: '[&::-moz-range-track]:bg-surface-tertiary',
};
