/**
 * Stack-safe min/max for large arrays.
 *
 * Math.min(...arr) / Math.max(...arr) push every element onto the call stack.
 * V8 limits this to ~65K–125K arguments, causing RangeError on large datasets.
 * These iterative versions work with any array size.
 */

export function safeMin(values: number[]): number {
  let min = Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] < min) min = values[i];
  }
  return min;
}

export function safeMax(values: number[]): number {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > max) max = values[i];
  }
  return max;
}
