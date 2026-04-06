import { useMemo } from 'react';
import { ACTIVITY_TYPE_COLORS } from '@variscout/core';
import type { LeanActivity } from './LeanWhatIfSimulator';

export interface LeanDistributionPreviewProps {
  activities: LeanActivity[];
  selectedActivityId: string;
  reduction: number;
  taktTime?: number;
  width?: number;
  height?: number;
}

const BAR_HEIGHT = 28;
const GAP = 8;
const LABEL_W = 64;
const TIME_W = 48;
const RADIUS = 4;
const PAD_Y = 8;

/**
 * SVG stacked bars showing current vs projected time composition.
 * Two horizontal bars: current (top) and projected (bottom).
 */
export default function LeanDistributionPreview({
  activities,
  selectedActivityId,
  reduction,
  taktTime,
  width = 320,
  height = BAR_HEIGHT * 2 + GAP + PAD_Y * 2,
}: LeanDistributionPreviewProps) {
  const { currentSegments, projectedSegments, taktX, totalCurrent, totalProjected } =
    useMemo(() => {
      const barW = width - LABEL_W - TIME_W;
      const total = activities.reduce((s, a) => s + a.time, 0);
      if (total <= 0)
        return { currentSegments: [], projectedSegments: [], totalCurrent: 0, totalProjected: 0 };

      // Build projected activities
      const projected = activities.map(a => ({
        ...a,
        time: a.id === selectedActivityId ? a.time * (1 - reduction) : a.time,
      }));
      const projTotal = projected.reduce((s, a) => s + a.time, 0);

      // Max time for consistent scale
      const maxTime = Math.max(total, taktTime ?? 0);
      const scale = maxTime > 0 ? barW / maxTime : 0;

      const buildSegments = (items: LeanActivity[]) => {
        let x = LABEL_W;
        return items.map(a => {
          const w = a.time * scale;
          const seg = { x, w, color: ACTIVITY_TYPE_COLORS[a.type], id: a.id };
          x += w;
          return seg;
        });
      };

      return {
        currentSegments: buildSegments(activities),
        projectedSegments: buildSegments(projected),
        taktX: taktTime != null && maxTime > 0 ? LABEL_W + taktTime * scale : undefined,
        totalCurrent: total,
        totalProjected: projTotal,
      };
    }, [activities, selectedActivityId, reduction, taktTime, width]);

  const y1 = PAD_Y;
  const y2 = PAD_Y + BAR_HEIGHT + GAP;

  const formatTime = (s: number) =>
    !Number.isFinite(s) ? '—' : s >= 60 ? `${(s / 60).toFixed(1)}m` : `${s.toFixed(1)}s`;

  return (
    <div data-testid="lean-distribution-preview">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Stacked bar comparison showing current and projected cycle time composition"
      >
        {/* Labels */}
        <text x={4} y={y1 + BAR_HEIGHT / 2 + 4} className="text-[10px] fill-content-secondary">
          Current
        </text>
        <text x={4} y={y2 + BAR_HEIGHT / 2 + 4} className="text-[10px] fill-content-secondary">
          Projected
        </text>

        {/* Current bar */}
        {currentSegments.map((seg, i) => (
          <rect
            key={`c-${seg.id}`}
            x={seg.x}
            y={y1}
            width={Math.max(seg.w, 0)}
            height={BAR_HEIGHT}
            fill={seg.color}
            opacity={seg.id === selectedActivityId ? 1 : 0.7}
            rx={i === 0 ? RADIUS : 0}
            ry={i === 0 ? RADIUS : 0}
          />
        ))}

        {/* Projected bar */}
        {projectedSegments.map((seg, i) => (
          <rect
            key={`p-${seg.id}`}
            x={seg.x}
            y={y2}
            width={Math.max(seg.w, 0)}
            height={BAR_HEIGHT}
            fill={seg.color}
            opacity={seg.id === selectedActivityId ? 1 : 0.7}
            rx={i === 0 ? RADIUS : 0}
            ry={i === 0 ? RADIUS : 0}
          />
        ))}

        {/* Takt time line */}
        {taktX != null && (
          <line
            x1={taktX}
            y1={PAD_Y - 2}
            x2={taktX}
            y2={y2 + BAR_HEIGHT + 2}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Time totals */}
        <text
          x={width - 4}
          y={y1 + BAR_HEIGHT / 2 + 4}
          textAnchor="end"
          className="text-[10px] fill-content-muted font-mono"
        >
          {formatTime(totalCurrent)}
        </text>
        <text
          x={width - 4}
          y={y2 + BAR_HEIGHT / 2 + 4}
          textAnchor="end"
          className="text-[10px] fill-content-muted font-mono"
        >
          {formatTime(totalProjected)}
        </text>
      </svg>
    </div>
  );
}
