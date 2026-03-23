/**
 * Shared phase badge configuration for portfolio and project-status components.
 * Centralizes colors and labels for the four journey phases.
 */

export interface PhaseConfig {
  label: string;
  /** Text color for phase label (used in badges and status labels) */
  textColor: string;
  /** Solid background color (used for progress bar segments) */
  solidBgColor: string;
  /** Transparent background color (used for badge fills) */
  bgColor: string;
  /** Border color for badges */
  borderColor: string;
}

export const PHASE_CONFIG: Record<string, PhaseConfig> = {
  frame: {
    label: 'FRAME',
    textColor: 'text-blue-500',
    solidBgColor: 'bg-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  scout: {
    label: 'SCOUT',
    textColor: 'text-green-500',
    solidBgColor: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  investigate: {
    label: 'INVESTIGATE',
    textColor: 'text-amber-500',
    solidBgColor: 'bg-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  improve: {
    label: 'IMPROVE',
    textColor: 'text-purple-500',
    solidBgColor: 'bg-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
};
