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

export type RandomSource = () => number;

/**
 * Create a deterministic normal-distribution generator from a seed or local PRNG.
 */
export function createNormalGenerator(seedOrRandom: number | RandomSource) {
  const random = typeof seedOrRandom === 'number' ? mulberry32(seedOrRandom) : seedOrRandom;
  return (mean: number, std: number): number => {
    const u = 1 - random();
    const v = random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * std + mean;
  };
}

export function randomChoice<T>(items: readonly T[], random: RandomSource): T {
  if (items.length === 0) {
    throw new Error('randomChoice requires at least one item');
  }
  return items[Math.floor(random() * items.length)]!;
}

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
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : value;
};

/**
 * Generate a date string offset from a start date
 */
export const dateOffset = (start: Date, days: number): string => {
  const date = new Date(start);
  date.setDate(start.getDate() + days);
  return date.toISOString().split('T')[0];
};
