import { useChartTheme, chartColors } from '@variscout/charts';
import { useIChartBrush } from '@variscout/hooks';

export interface MiniIChartProps {
  values: number[];
  width: number;
  height: number;
  onBrushEnd?: (range: { startIdx: number; endIdx: number }) => void;
}

export function MiniIChart({ values, width, height, onBrushEnd }: MiniIChartProps) {
  const theme = useChartTheme();
  const finiteValues = (values.length > 0 ? values : []).filter(v => Number.isFinite(v));

  const { handlers, currentBrush } = useIChartBrush({
    valuesLength: finiteValues.length,
    width,
    onCommit: onBrushEnd,
  });

  if (values.length === 0) return null;
  if (finiteValues.length === 0) return null;

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const range = max - min || 1;
  const mean = finiteValues.reduce((s, v) => s + v, 0) / finiteValues.length;
  const stepX = finiteValues.length > 1 ? width / (finiteValues.length - 1) : width / 2;
  const yFor = (v: number) => height - ((v - min) / range) * height;

  const path = finiteValues
    .map((v, i) => {
      const x = Math.round((finiteValues.length > 1 ? i * stepX : width / 2) * 10) / 10;
      const y = Math.round(yFor(v) * 10) / 10;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const meanY = yFor(mean);

  // Brush overlay x positions (only when interactive and in-flight)
  const n = finiteValues.length;
  const brushX1 = currentBrush !== null && n > 1 ? (currentBrush.startIdx / (n - 1)) * width : null;
  const brushX2 = currentBrush !== null && n > 1 ? (currentBrush.endIdx / (n - 1)) * width : null;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="mini i-chart"
      style={{ touchAction: onBrushEnd ? 'none' : undefined }}
      {...(onBrushEnd ? handlers : {})}
    >
      <line
        data-testid="mini-i-chart-mean"
        x1={0}
        x2={width}
        y1={meanY}
        y2={meanY}
        stroke={theme.chrome.labelMuted}
        strokeWidth={0.5}
        strokeDasharray="2 2"
        opacity={0.6}
      />
      <path
        data-testid="mini-i-chart-path"
        d={path}
        fill="none"
        stroke={theme.colors.mean}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      {currentBrush !== null && brushX1 !== null && brushX2 !== null && (
        <rect
          data-testid="mini-i-chart-brush"
          x={brushX1}
          y={0}
          width={Math.max(brushX2 - brushX1, 1)}
          height={height}
          fill={chartColors.warning}
          fillOpacity={0.18}
          stroke={chartColors.warning}
          strokeOpacity={0.5}
          strokeWidth={1}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  );
}
