/**
 * Shared color constants for VariScout UI
 *
 * These semantic colors are used across PWA and Azure apps
 * for consistent styling of status indicators.
 */

/**
 * Status colors for pass/fail/warning indicators
 */
export const statusColors = {
  pass: '#22c55e', // green-500 - within spec
  fail: '#ef4444', // red-500 - above USL
  warning: '#f59e0b', // amber-500 - below LSL
} as const;

export type StatusColor = (typeof statusColors)[keyof typeof statusColors];
