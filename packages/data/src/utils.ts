/**
 * Mulberry32 seeded PRNG — deterministic random number generator.
 * Returns a function that produces [0, 1) values from a 32-bit seed.
 *
 * @param seed - 32-bit integer seed
 * @returns A function that returns the next pseudo-random number in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Default seed for deterministic sample generation */
const DEFAULT_SEED = 42;

/** Module-level PRNG instance — seeded for deterministic output */
let rng = mulberry32(DEFAULT_SEED);

/**
 * Reset the module PRNG to a specific seed.
 * Call this before generating a dataset to get reproducible results.
 *
 * @param seed - 32-bit integer seed (default: 42)
 */
export function seedRandom(seed: number = DEFAULT_SEED): void {
  rng = mulberry32(seed);
}

/**
 * Generate a random value from a normal distribution.
 * Uses the Box-Muller transform with the seeded PRNG.
 *
 * @param mean - Distribution mean
 * @param std - Distribution standard deviation
 * @returns A normally-distributed random value
 */
export const generateNormal = (mean: number, std: number): number => {
  const u = 1 - rng();
  const v = rng();
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
