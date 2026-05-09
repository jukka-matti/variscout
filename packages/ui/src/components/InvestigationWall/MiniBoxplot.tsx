import { useChartTheme } from '@variscout/charts';

const MIN_BOXPLOT_VALUES = 7;

export interface MiniBoxplotGroup {
  category: string;
  values: number[];
}

export interface MiniBoxplotProps {
  groups: MiniBoxplotGroup[];
  width: number;
  height: number;
}

// Inline seeded PRNG — deterministic jitter for dots fallback.
// mulberry32 (https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a 32-bit hash for string seeding
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function MiniBoxplot({ groups, width, height }: MiniBoxplotProps) {
  const theme = useChartTheme();
  if (groups.length === 0) return null;

  const allValues = groups.flatMap(g => g.values).filter(v => Number.isFinite(v));
  if (allValues.length === 0) return null;

  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yRange = yMax - yMin || 1;
  const yFor = (v: number) => height - ((v - yMin) / yRange) * height;

  const groupW = width / groups.length;
  const boxW = Math.min(groupW * 0.6, 24);

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="mini boxplot"
    >
      {groups.map((g, i) => {
        const cx = i * groupW + groupW / 2;
        const finite = g.values
          .filter(v => Number.isFinite(v))
          .slice()
          .sort((a, b) => a - b);

        if (finite.length < MIN_BOXPLOT_VALUES) {
          // Deterministic jitter: PRNG seeded by category hash — never Math.random
          const rng = mulberry32(hashStr(g.category));
          return (
            <g key={g.category} data-testid={`mini-boxplot-dots-${g.category}`}>
              {finite.map((v, j) => {
                const jitter = (rng() - 0.5) * boxW * 0.5;
                return (
                  <circle
                    key={j}
                    cx={Math.round((cx + jitter) * 10) / 10}
                    cy={Math.round(yFor(v) * 10) / 10}
                    r={1.5}
                    fill={theme.colors.control}
                    opacity={0.7}
                  />
                );
              })}
            </g>
          );
        }

        const q1 = quantile(finite, 0.25);
        const med = quantile(finite, 0.5);
        const q3 = quantile(finite, 0.75);
        const lo = finite[0];
        const hi = finite[finite.length - 1];

        return (
          <g key={g.category} data-testid={`mini-boxplot-box-${g.category}`}>
            {/* whisker */}
            <line
              x1={cx}
              x2={cx}
              y1={Math.round(yFor(lo) * 10) / 10}
              y2={Math.round(yFor(hi) * 10) / 10}
              stroke={theme.colors.control}
              strokeWidth={0.5}
            />
            {/* IQR box */}
            <rect
              x={Math.round((cx - boxW / 2) * 10) / 10}
              y={Math.round(yFor(q3) * 10) / 10}
              width={Math.round(boxW * 10) / 10}
              height={Math.max(Math.round((yFor(q1) - yFor(q3)) * 10) / 10, 1)}
              fill={theme.colors.control}
              fillOpacity={0.18}
              stroke={theme.colors.control}
              strokeWidth={0.75}
            />
            {/* median line */}
            <line
              x1={Math.round((cx - boxW / 2) * 10) / 10}
              x2={Math.round((cx + boxW / 2) * 10) / 10}
              y1={Math.round(yFor(med) * 10) / 10}
              y2={Math.round(yFor(med) * 10) / 10}
              stroke={theme.colors.control}
              strokeWidth={1.25}
            />
          </g>
        );
      })}
    </svg>
  );
}
