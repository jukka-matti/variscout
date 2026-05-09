import { useChartTheme } from '@variscout/charts';

export interface MiniIChartProps {
  values: number[];
  width: number;
  height: number;
}

export function MiniIChart({ values, width, height }: MiniIChartProps) {
  const theme = useChartTheme();
  if (values.length === 0) return null;

  const finiteValues = values.filter(v => Number.isFinite(v));
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

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="mini i-chart"
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
    </svg>
  );
}
