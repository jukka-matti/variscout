import React, { useMemo } from 'react';

export type FactorDataType = 'categorical' | 'continuous';
export type MiniChartType = 'scatter' | 'boxplot';

export interface EdgeMiniChartProps {
  factorA: string;
  factorB: string;
  factorAType: FactorDataType;
  factorBType: FactorDataType;
  /** Array of data records; each record contains arbitrary column values */
  data: Record<string, unknown>[];
  outcomeColumn?: string;
  width?: number;
  height?: number;
  isDark?: boolean;
}

/** Determine which mini chart type to render based on factor data types */
export function getChartType(
  factorAType: FactorDataType,
  factorBType: FactorDataType
): MiniChartType {
  if (factorAType === 'continuous' && factorBType === 'continuous') {
    return 'scatter';
  }
  return 'boxplot';
}

// ---- Internal helpers ----

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

interface BoxStats {
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
}

function computeBoxStats(values: number[]): BoxStats | null {
  if (values.length < 2) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n / 4)];
  const q3 = sorted[Math.floor((3 * n) / 4)];
  return { q1, median, q3, min: sorted[0], max: sorted[n - 1] };
}

function scaleLinear(
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): number {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

// ---- Scatter sub-component ----

interface ScatterChartProps {
  data: Record<string, unknown>[];
  factorA: string;
  factorB: string;
  width: number;
  height: number;
  isDark: boolean;
}

const PADDING = { top: 6, right: 6, bottom: 6, left: 6 };

const ScatterChart: React.FC<ScatterChartProps> = ({
  data,
  factorA,
  factorB,
  width,
  height,
  isDark,
}) => {
  const points = useMemo(() => {
    const result: { x: number; y: number }[] = [];
    for (const row of data) {
      const xVal = toNumber(row[factorA]);
      const yVal = toNumber(row[factorB]);
      if (xVal !== null && yVal !== null) {
        result.push({ x: xVal, y: yVal });
      }
    }
    return result;
  }, [data, factorA, factorB]);

  if (points.length < 2) return null;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  const dotColor = isDark ? '#60a5fa' : '#3b82f6';
  const dotOpacity = Math.min(1, 0.8 - Math.max(0, points.length - 30) * 0.005);

  return (
    <svg width={width} height={height} aria-hidden="true">
      <g transform={`translate(${PADDING.left},${PADDING.top})`}>
        {points.map((p, i) => (
          <circle
            key={i}
            cx={scaleLinear(p.x, xMin, xMax, 0, innerW)}
            cy={scaleLinear(p.y, yMax, yMin, 0, innerH)}
            r={2.5}
            fill={dotColor}
            fillOpacity={dotOpacity}
          />
        ))}
      </g>
    </svg>
  );
};

// ---- Boxplot sub-component ----

interface BoxplotChartProps {
  data: Record<string, unknown>[];
  categoricalFactor: string;
  valueFactor: string;
  width: number;
  height: number;
  isDark: boolean;
}

const MAX_GROUPS = 8;

const BoxplotChart: React.FC<BoxplotChartProps> = ({
  data,
  categoricalFactor,
  valueFactor,
  width,
  height,
  isDark,
}) => {
  const groups = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const row of data) {
      const cat = String(row[categoricalFactor] ?? '');
      const val = toNumber(row[valueFactor]);
      if (cat && val !== null) {
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(val);
      }
    }
    // Slice to MAX_GROUPS, sorted by key for determinism
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.slice(0, MAX_GROUPS);
  }, [data, categoricalFactor, valueFactor]);

  if (groups.length === 0) return null;

  const allValues = groups.flatMap(([, vals]) => vals);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);

  const innerH = height - PADDING.top - PADDING.bottom;
  const innerW = width - PADDING.left - PADDING.right;

  const bandW = innerW / groups.length;
  const boxW = Math.max(6, bandW * 0.4);

  const strokeColor = isDark ? '#94a3b8' : '#64748b';
  const boxFill = isDark ? '#1e3a5f' : '#dbeafe';
  const medianColor = isDark ? '#60a5fa' : '#2563eb';

  return (
    <svg width={width} height={height} aria-hidden="true">
      <g transform={`translate(${PADDING.left},${PADDING.top})`}>
        {groups.map(([, vals], i) => {
          const stats = computeBoxStats(vals);
          if (!stats) return null;

          const cx = bandW * i + bandW / 2;
          const toY = (v: number) => scaleLinear(v, yMax, yMin, 0, innerH);

          const q1Y = toY(stats.q1);
          const q3Y = toY(stats.q3);
          const medY = toY(stats.median);
          const minY = toY(stats.min);
          const maxY = toY(stats.max);

          return (
            <g key={i}>
              {/* Whiskers */}
              <line x1={cx} y1={minY} x2={cx} y2={maxY} stroke={strokeColor} strokeWidth={1} />
              {/* Box */}
              <rect
                x={cx - boxW / 2}
                y={q3Y}
                width={boxW}
                height={Math.max(1, q1Y - q3Y)}
                fill={boxFill}
                stroke={strokeColor}
                strokeWidth={1}
              />
              {/* Median line */}
              <line
                x1={cx - boxW / 2}
                y1={medY}
                x2={cx + boxW / 2}
                y2={medY}
                stroke={medianColor}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---- Main component ----

export const EdgeMiniChart: React.FC<EdgeMiniChartProps> = ({
  factorA,
  factorB,
  factorAType,
  factorBType,
  data,
  outcomeColumn,
  width = 260,
  height = 150,
  isDark = false,
}) => {
  const chartType = getChartType(factorAType, factorBType);

  if (chartType === 'scatter') {
    return (
      <ScatterChart
        data={data}
        factorA={factorA}
        factorB={factorB}
        width={width}
        height={height}
        isDark={isDark}
      />
    );
  }

  // Boxplot: determine which factor is categorical and which provides the values
  const isCatA = factorAType === 'categorical';
  const categoricalFactor = isCatA ? factorA : factorB;
  // Value factor: prefer the other factor if continuous, else use outcomeColumn if provided
  const continuousFactor = isCatA ? factorB : factorA;
  const valueFactor =
    factorAType === 'continuous' || factorBType === 'continuous'
      ? continuousFactor
      : (outcomeColumn ?? continuousFactor);

  return (
    <BoxplotChart
      data={data}
      categoricalFactor={categoricalFactor}
      valueFactor={valueFactor}
      width={width}
      height={height}
      isDark={isDark}
    />
  );
};
