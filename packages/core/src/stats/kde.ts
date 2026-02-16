import * as d3 from 'd3';

/**
 * Calculate Kernel Density Estimation using Gaussian kernel with Silverman's rule-of-thumb bandwidth.
 *
 * Returns density estimates compatible with @visx/stats `<ViolinPlot>` component.
 *
 * @param values - Array of numeric measurement values
 * @param numPoints - Number of evaluation points (default: 100)
 * @returns Array of { value, count } where count is the density estimate
 */
export function calculateKDE(
  values: number[],
  numPoints: number = 100
): Array<{ value: number; count: number }> {
  if (values.length < 2) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = d3.mean(sorted)!;
  const stdDev = d3.deviation(sorted) ?? 0;
  const q1 = d3.quantile(sorted, 0.25) ?? mean;
  const q3 = d3.quantile(sorted, 0.75) ?? mean;
  const iqr = q3 - q1;

  // Silverman's rule-of-thumb bandwidth
  // h = 0.9 * min(stdDev, IQR/1.34) * n^(-1/5)
  const spread =
    stdDev > 0 && iqr > 0
      ? Math.min(stdDev, iqr / 1.34)
      : stdDev > 0
        ? stdDev
        : iqr > 0
          ? iqr / 1.34
          : 1;
  const h = 0.9 * spread * Math.pow(n, -0.2);

  if (h <= 0) return [];

  // Extend evaluation range by 3 bandwidths (matches R/ggplot2 cut=3 default)
  const minVal = sorted[0] - 3 * h;
  const maxVal = sorted[n - 1] + 3 * h;
  const step = (maxVal - minVal) / (numPoints - 1);

  const result: Array<{ value: number; count: number }> = [];
  for (let i = 0; i < numPoints; i++) {
    const x = minVal + i * step;
    // Gaussian kernel: K(u) = (1/sqrt(2*pi)) * exp(-u^2/2)
    let density = 0;
    for (let j = 0; j < n; j++) {
      const u = (x - sorted[j]) / h;
      density += Math.exp(-0.5 * u * u);
    }
    density /= n * h * Math.sqrt(2 * Math.PI);
    result.push({ value: x, count: density });
  }

  return result;
}
