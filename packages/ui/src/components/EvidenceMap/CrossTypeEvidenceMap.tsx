/**
 * CrossTypeEvidenceMap — Radial SVG visualization showing which factors
 * drive multiple defect types ("systemic causes").
 *
 * Factors are arranged in a circle. Distance from center is inversely
 * proportional to the number of defect types a factor drives.
 * Node radius scales with type count. Colored badges below each node
 * identify which defect types the factor influences.
 *
 * Pure SVG — no visx dependency.
 */

import type { CrossTypeEntry } from '@variscout/hooks';
import { operatorColors } from '@variscout/charts';

// ============================================================================
// Types
// ============================================================================

export interface CrossTypeEvidenceMapProps {
  crossTypeMatrix: Map<string, CrossTypeEntry>;
  analyzedCount: number;
  totalCount: number;
  containerWidth: number;
  containerHeight: number;
  /** Color for each defect type badge (keyed by type name) */
  typeColors?: Map<string, string>;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_NODE_RADIUS = 20;
const MAX_NODE_RADIUS = 40;
const BADGE_WIDTH = 28;
const BADGE_HEIGHT = 14;
const BADGE_GAP = 3;
const MAX_VISIBLE_BADGES = 4;
const SUBTITLE_HEIGHT = 32;
const INSIGHT_HEIGHT = 28;
const PADDING = 60;

// Default palette (falls back to operatorColors from charts package)
const DEFAULT_PALETTE = [...operatorColors];

// ============================================================================
// Helpers
// ============================================================================

function getDefaultTypeColor(index: number): string {
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

function abbreviate(name: string, maxLen: number = 3): string {
  return name.length > maxLen ? name.slice(0, maxLen) : name;
}

/**
 * Build a stable color map for all defect types observed in the matrix.
 */
function buildTypeColorMap(
  matrix: Map<string, CrossTypeEntry>,
  provided?: Map<string, string>
): Map<string, string> {
  const allTypes = new Set<string>();
  for (const entry of matrix.values()) {
    for (const t of entry.types) {
      allTypes.add(t);
    }
  }
  const sorted = Array.from(allTypes).sort();
  const map = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i], provided?.get(sorted[i]) ?? getDefaultTypeColor(i));
  }
  return map;
}

// ============================================================================
// Sub-components
// ============================================================================

interface FactorNodeProps {
  name: string;
  entry: CrossTypeEntry;
  cx: number;
  cy: number;
  radius: number;
  colorMap: Map<string, string>;
}

function FactorNode({ name, entry, cx, cy, radius, colorMap }: FactorNodeProps) {
  const typeCount = entry.types.length;

  // Node fill by type count
  const fill =
    typeCount >= 2
      ? 'rgba(34, 197, 94, 0.25)' // green for systemic
      : typeCount === 1
        ? 'rgba(59, 130, 246, 0.25)' // blue for single-type
        : 'transparent'; // gray dashed for 0 (shouldn't happen in matrix)
  const stroke = typeCount >= 2 ? '#22c55e' : typeCount === 1 ? '#3b82f6' : '#94a3b8';
  const strokeDasharray = typeCount === 0 ? '4 3' : undefined;

  // Badge layout
  const visibleTypes = entry.types.slice(0, MAX_VISIBLE_BADGES);
  const overflowCount = entry.types.length - MAX_VISIBLE_BADGES;
  const totalBadges = visibleTypes.length + (overflowCount > 0 ? 1 : 0);
  const badgesWidth = totalBadges * BADGE_WIDTH + (totalBadges - 1) * BADGE_GAP;
  const badgeStartX = cx - badgesWidth / 2;
  const badgeY = cy + radius + 24; // below the "N types" label

  return (
    <g>
      {/* Circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeDasharray={strokeDasharray}
      />

      {/* Factor name */}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-content, #cbd5e1)"
        fontSize={11}
        fontWeight={500}
      >
        {name.length > 14 ? `${name.slice(0, 12)}...` : name}
      </text>

      {/* "N types" label */}
      <text
        x={cx}
        y={cy + radius + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-content-secondary, #94a3b8)"
        fontSize={10}
      >
        {typeCount} {typeCount === 1 ? 'type' : 'types'}
      </text>

      {/* Type badges */}
      {visibleTypes.map((typeName, i) => {
        const bx = badgeStartX + i * (BADGE_WIDTH + BADGE_GAP);
        const color = colorMap.get(typeName) ?? '#94a3b8';
        return (
          <g key={typeName}>
            <rect
              x={bx}
              y={badgeY}
              width={BADGE_WIDTH}
              height={BADGE_HEIGHT}
              rx={3}
              fill={color}
              opacity={0.85}
            />
            <text
              x={bx + BADGE_WIDTH / 2}
              y={badgeY + BADGE_HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={9}
              fontWeight={600}
            >
              {abbreviate(typeName)}
            </text>
          </g>
        );
      })}

      {/* Overflow "+N" badge */}
      {overflowCount > 0 && (
        <g>
          <rect
            x={badgeStartX + visibleTypes.length * (BADGE_WIDTH + BADGE_GAP)}
            y={badgeY}
            width={BADGE_WIDTH}
            height={BADGE_HEIGHT}
            rx={3}
            fill="#475569"
            opacity={0.85}
          />
          <text
            x={badgeStartX + visibleTypes.length * (BADGE_WIDTH + BADGE_GAP) + BADGE_WIDTH / 2}
            y={badgeY + BADGE_HEIGHT / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#cbd5e1"
            fontSize={9}
            fontWeight={600}
          >
            +{overflowCount}
          </text>
        </g>
      )}
    </g>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function CrossTypeEvidenceMap({
  crossTypeMatrix,
  analyzedCount,
  totalCount,
  containerWidth,
  containerHeight,
  typeColors,
}: CrossTypeEvidenceMapProps) {
  // Empty state
  if (crossTypeMatrix.size === 0) {
    return (
      <svg width={containerWidth} height={containerHeight}>
        <text
          x={containerWidth / 2}
          y={containerHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-content-secondary, #94a3b8)"
          fontSize={13}
        >
          Analyze individual defect types first to see cross-type patterns
        </text>
      </svg>
    );
  }

  const colorMap = buildTypeColorMap(crossTypeMatrix, typeColors);

  // Sort factors: most types first, then by avgRSquaredAdj descending
  const entries = Array.from(crossTypeMatrix.entries()).sort((a, b) => {
    const diff = b[1].types.length - a[1].types.length;
    if (diff !== 0) return diff;
    return b[1].avgRSquaredAdj - a[1].avgRSquaredAdj;
  });

  const maxTypes = Math.max(...entries.map(([, e]) => e.types.length), 1);

  // Layout dimensions
  const usableTop = SUBTITLE_HEIGHT + PADDING / 2;
  const usableBottom = containerHeight - INSIGHT_HEIGHT - PADDING / 2;
  const cx = containerWidth / 2;
  const cy = (usableTop + usableBottom) / 2;
  const maxRadius = Math.min(cx - PADDING, (usableBottom - usableTop) / 2 - PADDING / 2);

  // Position each factor on a circle
  const nodes = entries.map(([name, entry], i) => {
    const angle = (2 * Math.PI * i) / entries.length - Math.PI / 2; // start from top

    // Distance from center: more types = closer
    const distanceFraction = 1 - entry.types.length / (maxTypes + 1);
    const distance = maxRadius * 0.3 + maxRadius * 0.7 * distanceFraction;

    // Node radius proportional to types / analyzedCount
    const sizeFraction = analyzedCount > 0 ? entry.types.length / analyzedCount : 0;
    const nodeRadius = MIN_NODE_RADIUS + sizeFraction * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);

    const nx = cx + distance * Math.cos(angle);
    const ny = cy + distance * Math.sin(angle);

    return { name, entry, x: nx, y: ny, radius: nodeRadius };
  });

  // Top systemic factor (for insight callout)
  const topSystemic = entries.find(([, e]) => e.types.length >= 2);

  // Subtitle text
  const subtitleExtra =
    analyzedCount < totalCount ? ' \u2014 explore more types to complete the picture' : '';

  return (
    <svg width={containerWidth} height={containerHeight} style={{ overflow: 'visible' }}>
      {/* Subtitle */}
      <text
        x={containerWidth / 2}
        y={SUBTITLE_HEIGHT / 2 + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-content-secondary, #94a3b8)"
        fontSize={12}
      >
        Analyzed {analyzedCount} of {totalCount} types{subtitleExtra}
      </text>

      {/* Factor nodes */}
      {nodes.map(node => (
        <FactorNode
          key={node.name}
          name={node.name}
          entry={node.entry}
          cx={node.x}
          cy={node.y}
          radius={node.radius}
          colorMap={colorMap}
        />
      ))}

      {/* Insight callout for top systemic factor */}
      {topSystemic && (
        <text
          x={containerWidth / 2}
          y={containerHeight - INSIGHT_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#22c55e"
          fontSize={12}
          fontWeight={500}
        >
          {topSystemic[0]} drives {topSystemic[1].types.slice(0, 2).join(' + ')}
          {topSystemic[1].types.length > 2 ? ` (+${topSystemic[1].types.length - 2})` : ''}
          {' \u2192 systemic cause'}
        </text>
      )}
    </svg>
  );
}
