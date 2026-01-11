/**
 * Shared color constants for VariScout UI
 *
 * These semantic colors are used across PWA and Azure apps
 * for consistent styling of status indicators and grade systems.
 */

/**
 * Status colors for pass/fail/warning indicators
 */
export const statusColors = {
  pass: '#22c55e', // green-500 - within spec
  fail: '#ef4444', // red-500 - above USL
  warning: '#f59e0b', // amber-500 - below LSL
} as const;

/**
 * Grade tier colors for coffee grading and similar systems
 */
export const gradeColors = {
  specialty: '#22c55e', // green-500 - highest quality
  premium: '#eab308', // yellow-500 - good quality
  exchange: '#f97316', // orange-500 - acceptable
  offGrade: '#ef4444', // red-500 - below standard
  default: '#cccccc', // gray - new/unassigned grade
} as const;

export type StatusColor = (typeof statusColors)[keyof typeof statusColors];
export type GradeColor = (typeof gradeColors)[keyof typeof gradeColors];
