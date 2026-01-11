/**
 * Generate a random value from a normal distribution
 * Uses the Box-Muller transform
 */
export const generateNormal = (mean: number, std: number): number => {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Round to specified decimal places
 */
export const round = (value: number, decimals: number = 1): number => {
  return Number(value.toFixed(decimals));
};

/**
 * Generate a date string offset from a start date
 */
export const dateOffset = (start: Date, days: number): string => {
  const date = new Date(start);
  date.setDate(start.getDate() + days);
  return date.toISOString().split('T')[0];
};
