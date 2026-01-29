/**
 * Chart color constants - centralized color definitions
 * Based on Tailwind palette with semantic naming
 */

// Semantic colors for data visualization
export const chartColors = {
  // Status colors - used for data points based on spec/control limits
  pass: '#22c55e', // green-500 - within spec
  fail: '#ef4444', // red-500 - above USL
  warning: '#f59e0b', // amber-500 - below LSL
  violation: '#f97316', // orange-500 - outside control limits

  // Reference lines
  mean: '#3b82f6', // blue-500 - center line
  meanAlt: '#60a5fa', // blue-400 - alternative mean indicator
  target: '#22c55e', // green-500 - target line
  spec: '#f97316', // orange-500 - specification limits (Voice of Customer)
  control: '#94a3b8', // slate-400 - control limits (UCL/LCL)

  // Selection/interaction states
  selected: '#0ea5e9', // sky-500 - selected items
  selectedBorder: '#0284c7', // sky-600 - selected item border

  // Regression/fit lines
  linear: '#3b82f6', // blue-500 - linear fit
  quadratic: '#8b5cf6', // violet-500 - quadratic fit

  // Pareto chart
  cumulative: '#f97316', // orange-500 - cumulative line
  threshold80: '#f97316', // orange-500 - 80% threshold line

  // Special
  star: '#fbbf24', // yellow-400 - rating stars
} as const;

// Chrome/UI colors for chart decorations
export const chromeColors = {
  // Backgrounds
  tooltipBg: '#1e293b', // slate-800
  gridLine: '#1e293b', // slate-800
  barBackground: '#334155', // slate-700

  // Borders
  tooltipBorder: '#334155', // slate-700

  // Text/labels
  labelPrimary: '#cbd5e1', // slate-300 - axis labels, tick labels
  labelSecondary: '#94a3b8', // slate-400 - secondary text
  labelMuted: '#64748b', // slate-500 - muted text
  tooltipText: '#f1f5f9', // slate-100 - tooltip text

  // Strokes/lines
  axisPrimary: '#94a3b8', // slate-400 - axis lines
  axisSecondary: '#64748b', // slate-500 - secondary axis
  whisker: '#94a3b8', // slate-400 - boxplot whiskers
  dataLine: '#94a3b8', // slate-400 - connecting lines
  stageDivider: '#475569', // slate-600 - stage separators
  pointStroke: '#0f172a', // slate-900 - data point outlines

  // Fills
  boxDefault: '#475569', // slate-600 - boxplot box fill
  boxBorder: '#64748b', // slate-500 - box border
  ciband: '#3b82f6', // blue-500 - confidence interval (with opacity)
} as const;

// Operator/series colors for multi-series charts
export const operatorColors = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
] as const;

// Type exports for type safety
export type ChartColor = keyof typeof chartColors;
export type ChromeColor = keyof typeof chromeColors;

// Light theme chrome colors
const chromeColorsLight = {
  // Backgrounds
  tooltipBg: '#ffffff', // white
  gridLine: '#f1f5f9', // slate-100
  barBackground: '#e2e8f0', // slate-200

  // Borders
  tooltipBorder: '#e2e8f0', // slate-200

  // Text/labels
  labelPrimary: '#334155', // slate-700 - axis labels, tick labels
  labelSecondary: '#64748b', // slate-500 - secondary text
  labelMuted: '#94a3b8', // slate-400 - muted text
  tooltipText: '#0f172a', // slate-900 - tooltip text

  // Strokes/lines
  axisPrimary: '#64748b', // slate-500 - axis lines
  axisSecondary: '#94a3b8', // slate-400 - secondary axis
  whisker: '#64748b', // slate-500 - boxplot whiskers
  dataLine: '#64748b', // slate-500 - connecting lines
  stageDivider: '#cbd5e1', // slate-300 - stage separators
  pointStroke: '#ffffff', // white - data point outlines

  // Fills
  boxDefault: '#cbd5e1', // slate-300 - boxplot box fill
  boxBorder: '#94a3b8', // slate-400 - box border
  ciband: '#3b82f6', // blue-500 - confidence interval (with opacity)
} as const;

/** Type for chrome colors (values can vary by theme) */
export type ChromeColorValues = {
  [K in keyof typeof chromeColors]: string;
};

/**
 * Get theme-aware chrome colors
 * @param isDark - Whether dark theme is active (default: true for backwards compatibility)
 */
export function getChromeColors(isDark: boolean = true): ChromeColorValues {
  return isDark ? chromeColors : chromeColorsLight;
}

/**
 * Get theme from document (checks data-theme attribute)
 * Returns 'dark' if unable to determine
 */
export function getDocumentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark';
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'light' ? 'light' : 'dark';
}
