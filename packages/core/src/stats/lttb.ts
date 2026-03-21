/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm.
 *
 * Reduces N data points to `threshold` visually representative points
 * while preserving the visual shape (peaks, valleys, trends).
 *
 * Reference: Steinarsson, S. (2013). "Downsampling Time Series for
 * Visual Representation." University of Iceland.
 *
 * @param data - Input points sorted by x
 * @param threshold - Target number of output points (minimum 2)
 * @param forceInclude - Set of originalIndex values that must appear in output
 *                       (e.g., control limit violations)
 */
export function lttb<T extends { x: number; y: number; originalIndex?: number }>(
  data: T[],
  threshold: number,
  forceInclude?: Set<number>
): T[] {
  const len = data.length;
  if (len === 0) return [];
  if (len <= threshold || threshold <= 2) {
    return len <= threshold ? [...data] : [data[0], data[len - 1]];
  }

  const sampled: T[] = [data[0]]; // Always keep first
  const bucketSize = (len - 2) / (threshold - 2);
  let prevSelected = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, len - 1);

    // Next bucket average (for triangle area calculation)
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len - 1);

    let avgX = 0;
    let avgY = 0;
    let count = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
      count++;
    }
    if (count > 0) {
      avgX /= count;
      avgY /= count;
    }

    // Find point in current bucket with max triangle area
    const prevX = data[prevSelected].x;
    const prevY = data[prevSelected].y;
    let maxArea = -1;
    let maxAreaIdx = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (prevX - avgX) * (data[j].y - prevY) - (prevX - data[j].x) * (avgY - prevY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIdx = j;
      }
    }

    sampled.push(data[maxAreaIdx]);
    prevSelected = maxAreaIdx;
  }

  sampled.push(data[len - 1]); // Always keep last

  // Force-include violation points
  if (forceInclude?.size) {
    const sampledOriginalIndices = new Set(sampled.map(p => p.originalIndex));
    for (const idx of forceInclude) {
      if (!sampledOriginalIndices.has(idx)) {
        const point = data.find(p => p.originalIndex === idx);
        if (point) sampled.push(point);
      }
    }
    sampled.sort((a, b) => a.x - b.x);
  }

  return sampled;
}
