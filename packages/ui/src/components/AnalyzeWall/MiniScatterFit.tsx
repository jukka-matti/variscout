// packages/ui/src/components/AnalyzeWall/MiniScatterFit.tsx
import { useChartTheme, chartColors } from '@variscout/charts';

export interface MiniScatterFitPoint {
  x: number;
  y: number;
}

export interface MiniScatterFitProps {
  points: MiniScatterFitPoint[];
  /** The OLS fitted line endpoints, or null when not fittable (no line drawn). */
  fittedLine: MiniScatterFitPoint[] | null;
  /** Significant → the fitted line uses the pass colour; else a muted stroke. */
  isSignificant: boolean;
  width: number;
  height: number;
}

/**
 * Fixed-dimension inline-SVG scatter + regression line for the test-plan triad
 * (PR-CS-9). Sibling of MiniIChart / MiniBoxplot — NOT a wrapper of the full-size
 * ScatterFit. Paints point markers + a data-driven fitted line.
 */
export function MiniScatterFit({
  points,
  fittedLine,
  isSignificant,
  width,
  height,
}: MiniScatterFitProps) {
  const theme = useChartTheme();

  const finite = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (finite.length === 0) return null;

  // Domain spans the points AND the fitted-line endpoints so the line never clips.
  const xs = [...finite.map(p => p.x), ...(fittedLine ?? []).map(p => p.x)];
  const ys = [...finite.map(p => p.y), ...(fittedLine ?? []).map(p => p.y)];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const xFor = (x: number) => Math.round(((x - xMin) / xRange) * width * 10) / 10;
  const yFor = (y: number) => Math.round((height - ((y - yMin) / yRange) * height) * 10) / 10;

  const lineColor = isSignificant ? chartColors.pass : theme.chrome.labelMuted;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="mini scatter fit"
      data-testid="mini-scatter-fit"
    >
      {finite.map((p, i) => (
        <circle
          key={i}
          data-testid="mini-scatter-fit-point"
          cx={xFor(p.x)}
          cy={yFor(p.y)}
          r={1.75}
          fill={theme.colors.control}
          opacity={0.7}
        />
      ))}
      {fittedLine && fittedLine.length > 1 && (
        <line
          data-testid="mini-scatter-fit-line"
          x1={xFor(fittedLine[0].x)}
          y1={yFor(fittedLine[0].y)}
          x2={xFor(fittedLine[fittedLine.length - 1].x)}
          y2={yFor(fittedLine[fittedLine.length - 1].y)}
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
