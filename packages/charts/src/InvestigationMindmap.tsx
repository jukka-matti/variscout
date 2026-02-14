import React, { useMemo, useState, useCallback } from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { chartColors, chromeColors } from './colors';
import { useChartTheme } from './useChartTheme';

// ============================================================================
// Types
// ============================================================================

/**
 * Data for a single category value within a factor popover
 */
export interface CategoryData {
  value: string | number;
  count: number;
  meanValue: number;
  contributionPct: number;
}

/**
 * A factor node in the investigation mindmap
 */
export interface MindmapNode {
  /** Factor/column name */
  factor: string;
  /** η² (0–1), drives node size */
  etaSquared: number;
  /** Node state: active = drilled, available = can drill, exhausted = too few rows */
  state: 'active' | 'available' | 'exhausted';
  /** Value shown below label when active (already filtered) */
  filteredValue?: string;
  /** Whether this is the suggested next drill target */
  isSuggested: boolean;
  /** Category breakdown for click-to-filter popover */
  categoryData?: CategoryData[];
}

export interface InvestigationMindmapProps {
  /** Factor nodes to display */
  nodes: MindmapNode[];
  /** Factor names in drill order (the trail connecting active nodes) */
  drillTrail: string[];
  /** Cumulative variation % isolated so far (0–100) */
  cumulativeVariationPct: number | null;
  /** Target variation % for the progress bar (default 70) */
  targetPct?: number;
  /** Called when a node is clicked */
  onNodeClick?: (factor: string) => void;
  /** Called when a category value is selected from the popover */
  onCategorySelect?: (factor: string, value: string | number) => void;
  /** Container width from withParentSize */
  parentWidth?: number;
  /** Container height from withParentSize */
  parentHeight?: number;
  /** Explicit width (overrides parentWidth) */
  width?: number;
  /** Explicit height (overrides parentHeight) */
  height?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_NODE_RADIUS = 20;
const MAX_NODE_RADIUS = 40;
const CENTER_NODE_RADIUS = 16;
const PROGRESS_BAR_HEIGHT = 32;
const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

// ============================================================================
// Helpers
// ============================================================================

/**
 * Compute node radius from η² (area encodes effect size)
 */
function getNodeRadius(etaSquared: number): number {
  // Clamp to [0, 1] and scale area proportionally
  const clamped = Math.max(0, Math.min(1, etaSquared));
  const minArea = Math.PI * MIN_NODE_RADIUS * MIN_NODE_RADIUS;
  const maxArea = Math.PI * MAX_NODE_RADIUS * MAX_NODE_RADIUS;
  const area = minArea + clamped * (maxArea - minArea);
  return Math.sqrt(area / Math.PI);
}

/**
 * Get node fill color based on state
 */
function getNodeFill(state: MindmapNode['state'], isDark: boolean): string {
  switch (state) {
    case 'active':
      return chartColors.mean; // blue — already drilled
    case 'available':
      return isDark ? '#334155' : '#e2e8f0'; // slate-700 / slate-200
    case 'exhausted':
      return isDark ? '#1e293b' : '#f1f5f9'; // slate-800 / slate-100
  }
}

/**
 * Get node stroke color based on state
 */
function getNodeStroke(node: MindmapNode, isDark: boolean): string {
  if (node.isSuggested) return chartColors.pass; // green pulse
  if (node.state === 'active') return chartColors.mean;
  return isDark ? '#475569' : '#94a3b8'; // slate-600 / slate-400
}

/**
 * Arrange nodes in a radial layout around center
 * For 8+ nodes, uses two concentric rings
 */
function computeLayout(
  nodes: MindmapNode[],
  centerX: number,
  centerY: number,
  availableRadius: number
): { factor: string; x: number; y: number }[] {
  if (nodes.length === 0) return [];

  const outerRingMax = 7;
  const positions: { factor: string; x: number; y: number }[] = [];

  if (nodes.length <= outerRingMax) {
    // Single ring
    const radius = availableRadius * 0.65;
    const startAngle = -Math.PI / 2; // start at top
    nodes.forEach((node, i) => {
      const angle = startAngle + (2 * Math.PI * i) / nodes.length;
      positions.push({
        factor: node.factor,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  } else {
    // Two concentric rings: first 6 in outer, rest in inner
    const outerCount = Math.min(6, nodes.length);
    const innerCount = nodes.length - outerCount;
    const outerRadius = availableRadius * 0.7;
    const innerRadius = availableRadius * 0.38;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < outerCount; i++) {
      const angle = startAngle + (2 * Math.PI * i) / outerCount;
      positions.push({
        factor: nodes[i].factor,
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      });
    }
    for (let i = 0; i < innerCount; i++) {
      const angle = startAngle + (2 * Math.PI * i) / innerCount;
      positions.push({
        factor: nodes[outerCount + i].factor,
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle),
      });
    }
  }

  return positions;
}

// ============================================================================
// Sub-components
// ============================================================================

interface CategoryPopoverProps {
  node: MindmapNode;
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
  onSelect: (factor: string, value: string | number) => void;
  onClose: () => void;
}

const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  node,
  x,
  y,
  svgWidth,
  svgHeight,
  onSelect,
  onClose,
}) => {
  const categories = node.categoryData ?? [];
  if (categories.length === 0) return null;

  // Position: prefer right side, flip if too close to edge
  const popoverWidth = 180;
  const popoverMaxHeight = 200;
  const offsetX = 50;
  const flipX = x + offsetX + popoverWidth > svgWidth;
  const flipY = y + popoverMaxHeight > svgHeight;

  const left = flipX ? x - offsetX - popoverWidth : x + offsetX;
  const top = flipY ? Math.max(4, y - popoverMaxHeight / 2) : y - 10;

  return (
    <foreignObject x={0} y={0} width={svgWidth} height={svgHeight}>
      {/* Click-away backdrop */}
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: popoverWidth,
          maxHeight: popoverMaxHeight,
          overflow: 'auto',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: '1px solid #334155',
          }}
        >
          {node.factor}
        </div>
        {categories.map(cat => (
          <button
            key={String(cat.value)}
            onClick={() => onSelect(node.factor, cat.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '4px 6px',
              fontSize: 11,
              color: '#e2e8f0',
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.background = '#334155')}
            onMouseLeave={e => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 110,
              }}
            >
              {String(cat.value)}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 10, flexShrink: 0, marginLeft: 4 }}>
              {cat.contributionPct.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </foreignObject>
  );
};

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressFooterProps {
  width: number;
  y: number;
  cumulativeVariationPct: number | null;
  targetPct: number;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
}

const ProgressFooter: React.FC<ProgressFooterProps> = ({
  width,
  y,
  cumulativeVariationPct,
  targetPct,
  chrome,
}) => {
  const barWidth = width - MARGIN.left - MARGIN.right;
  const barHeight = 8;
  const barX = MARGIN.left;
  const barY = y + 8;
  const pct = cumulativeVariationPct ?? 0;
  const fillWidth = Math.max(0, Math.min(barWidth, (pct / 100) * barWidth));
  const targetX = barX + (targetPct / 100) * barWidth;

  return (
    <Group>
      {/* Label */}
      <text x={barX} y={barY - 2} fontSize={10} fill={chrome.labelSecondary} textAnchor="start">
        Variation isolated: {pct > 0 ? `${pct.toFixed(0)}%` : '—'}
      </text>

      {/* Background bar */}
      <rect
        x={barX}
        y={barY + 2}
        width={barWidth}
        height={barHeight}
        rx={4}
        fill={chrome.gridLine}
      />

      {/* Fill bar */}
      {fillWidth > 0 && (
        <rect
          x={barX}
          y={barY + 2}
          width={fillWidth}
          height={barHeight}
          rx={4}
          fill={pct >= targetPct ? chartColors.pass : chartColors.mean}
        />
      )}

      {/* Target marker */}
      <Line
        from={{ x: targetX, y: barY + 1 }}
        to={{ x: targetX, y: barY + barHeight + 3 }}
        stroke={chrome.labelSecondary}
        strokeWidth={1.5}
        strokeDasharray="3,2"
      />
      <text
        x={targetX}
        y={barY + barHeight + 14}
        fontSize={9}
        fill={chrome.labelSecondary}
        textAnchor="middle"
      >
        {targetPct}% target
      </text>
    </Group>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const InvestigationMindmapBase: React.FC<InvestigationMindmapProps> = ({
  nodes,
  drillTrail,
  cumulativeVariationPct,
  targetPct = 70,
  onNodeClick,
  onCategorySelect,
  parentWidth,
  parentHeight,
  width: explicitWidth,
  height: explicitHeight,
}) => {
  const width = explicitWidth ?? parentWidth ?? 360;
  const height = explicitHeight ?? parentHeight ?? 400;
  const { isDark, chrome } = useChartTheme();

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Handle node click — show popover for available nodes, no-op for exhausted
  const handleNodeClick = useCallback(
    (node: MindmapNode) => {
      if (node.state === 'exhausted') return;

      if (node.state === 'available' && node.categoryData && node.categoryData.length > 0) {
        setSelectedNode(prev => (prev === node.factor ? null : node.factor));
        onNodeClick?.(node.factor);
        return;
      }

      // Active or no category data — just notify
      onNodeClick?.(node.factor);
    },
    [onNodeClick]
  );

  const handleCategorySelect = useCallback(
    (factor: string, value: string | number) => {
      setSelectedNode(null);
      onCategorySelect?.(factor, value);
    },
    [onCategorySelect]
  );

  // Compute layout
  const chartArea = {
    width: width - MARGIN.left - MARGIN.right,
    height: height - MARGIN.top - MARGIN.bottom - PROGRESS_BAR_HEIGHT - 20,
  };
  const centerX = width / 2;
  const centerY = MARGIN.top + chartArea.height / 2;
  const availableRadius = Math.min(chartArea.width, chartArea.height) / 2;

  const positions = useMemo(
    () => computeLayout(nodes, centerX, centerY, availableRadius),
    [nodes, centerX, centerY, availableRadius]
  );

  // Build position lookup
  const posMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positions.forEach(p => map.set(p.factor, { x: p.x, y: p.y }));
    return map;
  }, [positions]);

  // Build node lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, MindmapNode>();
    nodes.forEach(n => map.set(n.factor, n));
    return map;
  }, [nodes]);

  // Drill trail line segments
  const trailSegments = useMemo(() => {
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    if (drillTrail.length === 0) return segments;

    // Start from center node
    let prevX = centerX;
    let prevY = centerY;

    for (const factor of drillTrail) {
      const pos = posMap.get(factor);
      if (!pos) continue;
      segments.push({ x1: prevX, y1: prevY, x2: pos.x, y2: pos.y });
      prevX = pos.x;
      prevY = pos.y;
    }

    return segments;
  }, [drillTrail, posMap, centerX, centerY]);

  if (width < 100 || height < 100) return null;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <Group>
        {/* Drill trail lines */}
        {trailSegments.map((seg, i) => (
          <Line
            key={`trail-${i}`}
            from={{ x: seg.x1, y: seg.y1 }}
            to={{ x: seg.x2, y: seg.y2 }}
            stroke={chartColors.mean}
            strokeWidth={2}
            strokeOpacity={0.6}
          />
        ))}

        {/* Center "Start" node */}
        <circle
          cx={centerX}
          cy={centerY}
          r={CENTER_NODE_RADIUS}
          fill={drillTrail.length > 0 ? chartColors.mean : isDark ? '#334155' : '#e2e8f0'}
          stroke={isDark ? '#475569' : '#94a3b8'}
          strokeWidth={1.5}
        />
        <text
          x={centerX}
          y={centerY + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={600}
          fill={drillTrail.length > 0 ? '#ffffff' : chrome.labelPrimary}
        >
          Start
        </text>

        {/* Factor nodes */}
        {positions.map(pos => {
          const node = nodeMap.get(pos.factor);
          if (!node) return null;

          const radius = getNodeRadius(node.etaSquared);
          const fill = getNodeFill(node.state, isDark);
          const stroke = getNodeStroke(node, isDark);
          const isClickable = node.state !== 'exhausted';
          const isSuggested = node.isSuggested;

          return (
            <Group key={pos.factor}>
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={node.state === 'active' ? 2.5 : 1.5}
                style={{
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'fill 0.2s, stroke 0.2s',
                }}
                className={isSuggested ? 'mindmap-pulse' : undefined}
                onClick={() => handleNodeClick(node)}
              />

              {/* Factor label */}
              <text
                x={pos.x}
                y={pos.y - radius - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={node.state === 'active' ? 600 : 400}
                fill={chrome.labelPrimary}
                style={{ pointerEvents: 'none' }}
              >
                {node.factor}
              </text>

              {/* η² percentage inside node */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={600}
                fill={node.state === 'active' ? '#ffffff' : chrome.labelPrimary}
                style={{ pointerEvents: 'none' }}
              >
                {(node.etaSquared * 100).toFixed(0)}%
              </text>

              {/* Filtered value label (when active) */}
              {node.filteredValue && (
                <text
                  x={pos.x}
                  y={pos.y + radius + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill={chartColors.mean}
                  style={{ pointerEvents: 'none' }}
                >
                  = {node.filteredValue}
                </text>
              )}
            </Group>
          );
        })}

        {/* Category popover */}
        {selectedNode &&
          (() => {
            const node = nodeMap.get(selectedNode);
            const pos = posMap.get(selectedNode);
            if (!node || !pos) return null;

            return (
              <CategoryPopover
                node={node}
                x={pos.x}
                y={pos.y}
                svgWidth={width}
                svgHeight={height}
                onSelect={handleCategorySelect}
                onClose={() => setSelectedNode(null)}
              />
            );
          })()}

        {/* Progress bar */}
        <ProgressFooter
          width={width}
          y={height - PROGRESS_BAR_HEIGHT - MARGIN.bottom}
          cumulativeVariationPct={cumulativeVariationPct}
          targetPct={targetPct}
          chrome={chrome}
        />
      </Group>
    </svg>
  );
};

const InvestigationMindmap = withParentSize(InvestigationMindmapBase);

export default InvestigationMindmap;
