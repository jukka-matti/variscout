import { useMemo } from 'react';
import { normalPDF } from '@variscout/core';

interface DistributionPreviewProps {
  currentMean: number;
  currentStdDev: number;
  projectedMean: number;
  projectedStdDev: number;
  specs?: { usl?: number; lsl?: number };
  height?: number;
}

const NUM_POINTS = 80;
const PADDING_X = 8;
const PADDING_Y = 4;

function buildCurvePath(
  points: { x: number; y: number }[],
  xScale: (v: number) => number,
  yScale: (v: number) => number
): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`)
    .join(' ');
  // Close to baseline for fill
  return `${line} L${xScale(last.x).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(first.x).toFixed(1)},${yScale(0).toFixed(1)} Z`;
}

export default function DistributionPreview({
  currentMean,
  currentStdDev,
  projectedMean,
  projectedStdDev,
  specs,
  height = 120,
}: DistributionPreviewProps) {
  const { currentPath, projectedPath, specLines, meanLines, viewBox } = useMemo(() => {
    const width = 320;
    const plotW = width - 2 * PADDING_X;
    const plotH = height - 2 * PADDING_Y;

    // Compute x-domain: span both curves (+-4sigma from means), extended to spec limits
    const currentLo = currentMean - 4 * currentStdDev;
    const currentHi = currentMean + 4 * currentStdDev;
    const projectedLo = projectedMean - 4 * projectedStdDev;
    const projectedHi = projectedMean + 4 * projectedStdDev;
    let xMin = Math.min(currentLo, projectedLo);
    let xMax = Math.max(currentHi, projectedHi);
    if (specs?.lsl !== undefined) xMin = Math.min(xMin, specs.lsl - (xMax - xMin) * 0.05);
    if (specs?.usl !== undefined) xMax = Math.max(xMax, specs.usl + (xMax - xMin) * 0.05);

    // Guard against zero range
    if (xMax - xMin < 1e-10) {
      xMin -= 1;
      xMax += 1;
    }

    // Generate curve points
    const step = (xMax - xMin) / (NUM_POINTS - 1);
    const currentPoints: { x: number; y: number }[] = [];
    const projectedPoints: { x: number; y: number }[] = [];
    let yMax = 0;

    for (let i = 0; i < NUM_POINTS; i++) {
      const x = xMin + i * step;
      const cy = currentStdDev > 0 ? normalPDF(x, currentMean, currentStdDev) : 0;
      const py = projectedStdDev > 0 ? normalPDF(x, projectedMean, projectedStdDev) : 0;
      currentPoints.push({ x, y: cy });
      projectedPoints.push({ x, y: py });
      yMax = Math.max(yMax, cy, py);
    }

    if (yMax < 1e-10) yMax = 1;

    const xScale = (v: number) => PADDING_X + ((v - xMin) / (xMax - xMin)) * plotW;
    const yScale = (v: number) => PADDING_Y + plotH - (v / yMax) * plotH;

    const cPath = buildCurvePath(currentPoints, xScale, yScale);
    const pPath = buildCurvePath(projectedPoints, xScale, yScale);

    // Spec limit lines
    const sLines: { x: number; label: string }[] = [];
    if (specs?.lsl !== undefined) sLines.push({ x: xScale(specs.lsl), label: 'LSL' });
    if (specs?.usl !== undefined) sLines.push({ x: xScale(specs.usl), label: 'USL' });

    // Mean indicator lines
    const mLines = [
      { x: xScale(currentMean), color: '#94a3b8' },
      { x: xScale(projectedMean), color: '#60a5fa' },
    ];

    return {
      currentPath: cPath,
      projectedPath: pPath,
      specLines: sLines,
      meanLines: mLines,
      viewBox: `0 0 ${width} ${height}`,
    };
  }, [currentMean, currentStdDev, projectedMean, projectedStdDev, specs, height]);

  return (
    <div data-testid="distribution-preview">
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Distribution preview showing current and projected normal curves"
      >
        {/* Current curve (gray) */}
        <path d={currentPath} fill="rgba(148,163,184,0.25)" stroke="#94a3b8" strokeWidth={1.5} />
        {/* Projected curve (blue) */}
        <path d={projectedPath} fill="rgba(96,165,250,0.25)" stroke="#60a5fa" strokeWidth={1.5} />
        {/* Spec limit lines */}
        {specLines.map(sl => (
          <line
            key={sl.label}
            x1={sl.x}
            y1={PADDING_Y}
            x2={sl.x}
            y2={height - PADDING_Y}
            stroke="#f87171"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        ))}
        {/* Mean indicator lines */}
        {meanLines.map((ml, i) => (
          <line
            key={i}
            x1={ml.x}
            y1={PADDING_Y}
            x2={ml.x}
            y2={height - PADDING_Y}
            stroke={ml.color}
            strokeWidth={0.75}
            opacity={0.6}
          />
        ))}
      </svg>
    </div>
  );
}
