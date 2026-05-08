export type HistogramBinningRule = 'sturges' | 'scott';

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

/**
 * Compute equal-width histogram bins for a numeric sample.
 *
 * Bin count rule:
 * - 'sturges' (default): k = ceil(log2(n) + 1)
 * - 'scott':             binWidth = 3.49 · σ · n^(-1/3), then k = ceil((max - min) / binWidth)
 *
 * Returns bins sorted by x0; bins are contiguous (bin[i].x1 === bin[i+1].x0).
 * The last bin is closed on both ends (right edge is inclusive of max). All
 * other bins are half-open [x0, x1). Every input value lands in exactly one
 * bin; the sum of counts equals values.length.
 *
 * Edge cases:
 * - empty input → []
 * - all-equal input → single zero-width bin (x0 === x1) with count = n
 *
 * Returns finite numbers only per ADR-069 B2.
 */
export function computeHistogramBins(
  values: readonly number[],
  rule: HistogramBinningRule = 'sturges'
): HistogramBin[] {
  if (values.length === 0) return [];

  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const min = sorted[0] as number;
  const max = sorted[sorted.length - 1] as number;

  if (min === max) {
    return [{ x0: min, x1: max, count: sorted.length }];
  }

  const k = binCount(sorted, min, max, rule);
  const width = (max - min) / k;

  const bins: HistogramBin[] = [];
  for (let i = 0; i < k; i++) {
    bins.push({ x0: min + i * width, x1: min + (i + 1) * width, count: 0 });
  }

  for (const value of sorted) {
    let idx = Math.floor((value - min) / width);
    if (idx >= k) idx = k - 1; // includes max in last bin
    (bins[idx] as HistogramBin).count += 1;
  }

  return bins;
}

function binCount(sorted: number[], min: number, max: number, rule: HistogramBinningRule): number {
  const n = sorted.length;
  if (rule === 'sturges') {
    return Math.max(1, Math.ceil(Math.log2(n) + 1));
  }

  const sigma = stdDev(sorted);
  if (!Number.isFinite(sigma) || sigma === 0) {
    return Math.max(1, Math.ceil(Math.log2(n) + 1));
  }
  const binWidth = 3.49 * sigma * Math.pow(n, -1 / 3);
  if (!Number.isFinite(binWidth) || binWidth <= 0) {
    return Math.max(1, Math.ceil(Math.log2(n) + 1));
  }
  return Math.max(1, Math.ceil((max - min) / binWidth));
}

function stdDev(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / (n - 1);
  return Math.sqrt(variance);
}
