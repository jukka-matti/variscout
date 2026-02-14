import React, { useMemo, useState, useCallback } from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { chartColors } from './colors';
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

/**
 * An interaction edge between two factor nodes
 */
export interface MindmapEdge {
  factorA: string;
  factorB: string;
  deltaRSquared: number;
  pValue: number;
  standardizedBeta: number;
}

/**
 * Mindmap display mode
 */
export type MindmapMode = 'drilldown' | 'interactions' | 'narrative';

/**
 * Data for a single step in the narrative timeline
 */
export interface NarrativeStep {
  factor: string;
  values: (string | number)[];
  etaSquared: number;
  cumulativeEtaSquared: number;
  meanBefore: number;
  meanAfter: number;
  cpkBefore: number | undefined;
  cpkAfter: number | undefined;
  countBefore: number;
  countAfter: number;
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
  /** Display mode: 'drilldown' shows trail, 'interactions' shows edges */
  mode?: MindmapMode;
  /** Interaction edges (rendered in 'interactions' mode) */
  edges?: MindmapEdge[];
  /** Called when an interaction edge is clicked */
  onEdgeClick?: (factorA: string, factorB: string) => void;
  /** Drill step data for narrative mode annotations */
  narrativeSteps?: NarrativeStep[];
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

const EDGE_MIN_WIDTH = 1.5;
const EDGE_MAX_WIDTH = 6;

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
 * Map ΔR² to edge stroke width (linear interpolation)
 */
function getEdgeWidth(deltaRSquared: number, maxDelta: number): number {
  if (maxDelta <= 0) return EDGE_MIN_WIDTH;
  const t = Math.min(1, deltaRSquared / maxDelta);
  return EDGE_MIN_WIDTH + t * (EDGE_MAX_WIDTH - EDGE_MIN_WIDTH);
}

/**
 * Get edge opacity based on p-value significance
 */
function getEdgeOpacity(pValue: number): number {
  if (pValue < 0.05) return 1.0;
  if (pValue < 0.1) return 0.4;
  return 0; // not rendered
}

/**
 * Filter edges to only those significant enough to render (p < 0.10)
 */
function getVisibleEdges(edges: MindmapEdge[]): MindmapEdge[] {
  return edges.filter(e => e.pValue < 0.1);
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

/**
 * Arrange drilled factor nodes in a horizontal timeline (left → right)
 * Only includes active drill steps — available/exhausted nodes are hidden.
 */
function computeTimelineLayout(
  steps: NarrativeStep[],
  width: number,
  height: number,
  margin: typeof MARGIN
): { factor: string; x: number; y: number }[] {
  if (steps.length === 0) return [];

  const usableWidth = width - margin.left - margin.right;
  const centerY = margin.top + (height - margin.top - margin.bottom - PROGRESS_BAR_HEIGHT - 20) / 2;

  // Evenly space nodes across the horizontal axis
  const positions: { factor: string; x: number; y: number }[] = [];
  const count = steps.length;
  const padding = Math.min(60, usableWidth / (count + 2));

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = margin.left + padding + t * (usableWidth - 2 * padding);
    positions.push({ factor: steps[i].factor, x, y: centerY });
  }

  return positions;
}

// ============================================================================
// Narrative Sub-components
// ============================================================================

const ANNOTATION_BOX_WIDTH = 140;

interface StepAnnotationProps {
  step: NarrativeStep;
  stepIndex: number;
  x: number;
  y: number;
  nodeRadius: number;
  svgWidth: number;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
}

const StepAnnotation: React.FC<StepAnnotationProps> = ({
  step,
  stepIndex,
  x,
  y,
  nodeRadius,
  svgWidth,
  chrome,
}) => {
  const boxLeft = Math.max(
    4,
    Math.min(x - ANNOTATION_BOX_WIDTH / 2, svgWidth - ANNOTATION_BOX_WIDTH - 4)
  );
  const boxTop = y + nodeRadius + 20;

  const meanImproved =
    step.meanAfter !== step.meanBefore
      ? Math.abs(step.meanAfter) < Math.abs(step.meanBefore)
      : false;
  const cpkImproved =
    step.cpkAfter !== undefined && step.cpkBefore !== undefined
      ? step.cpkAfter > step.cpkBefore
      : false;

  const valuesLabel =
    step.values.length <= 2
      ? step.values.map(String).join(', ')
      : `${step.values[0]} +${step.values.length - 1}`;

  return (
    <>
      {/* Step number label above node */}
      <text
        x={x}
        y={y - nodeRadius - 18}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill={chrome.labelSecondary}
        style={{ pointerEvents: 'none' }}
      >
        Step {stepIndex + 1}
      </text>

      {/* Annotation card below node */}
      <foreignObject x={boxLeft} y={boxTop} width={ANNOTATION_BOX_WIDTH} height={120}>
        <div
          style={{
            background: 'rgba(30,41,59,0.85)',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: 10,
            lineHeight: 1.5,
          }}
        >
          <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}>
            {step.factor} = {valuesLabel}
          </div>
          <div style={{ color: '#94a3b8' }}>
            Explains {(step.etaSquared * 100).toFixed(0)}% of variation
          </div>
          <div style={{ color: meanImproved ? chartColors.pass : '#e2e8f0', marginTop: 2 }}>
            Mean: {step.meanBefore.toFixed(1)} &rarr; {step.meanAfter.toFixed(1)}
          </div>
          {step.cpkBefore !== undefined && step.cpkAfter !== undefined && (
            <div style={{ color: cpkImproved ? chartColors.pass : chartColors.fail }}>
              Cpk: {step.cpkBefore.toFixed(2)} &rarr; {step.cpkAfter.toFixed(2)}
            </div>
          )}
          <div style={{ color: '#94a3b8' }}>
            n: {step.countBefore} &rarr; {step.countAfter}
          </div>
        </div>
      </foreignObject>
    </>
  );
};

interface ConclusionPanelProps {
  steps: NarrativeStep[];
  x: number;
  y: number;
  svgWidth: number;
  targetPct: number;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
}

const ConclusionPanel: React.FC<ConclusionPanelProps> = ({
  steps,
  x,
  y,
  svgWidth,
  targetPct,
  chrome,
}) => {
  if (steps.length === 0) return null;

  const lastStep = steps[steps.length - 1];
  const cumPct = lastStep.cumulativeEtaSquared * 100;
  const reachedTarget = cumPct >= targetPct;
  const panelWidth = 160;
  const left = Math.max(4, Math.min(x - panelWidth / 2, svgWidth - panelWidth - 4));

  return (
    <foreignObject x={left} y={y} width={panelWidth} height={80}>
      <div
        style={{
          background: reachedTarget ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
          border: `1px solid ${reachedTarget ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 10,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
          {steps.length} factor{steps.length !== 1 ? 's' : ''} explain {cumPct.toFixed(0)}%
        </div>
        <div
          style={{
            color: reachedTarget ? chartColors.pass : chrome.labelSecondary,
            marginTop: 2,
          }}
        >
          {reachedTarget
            ? 'Investigation target reached'
            : `${(100 - cumPct).toFixed(0)}% unexplained \u2014 consider additional factors`}
        </div>
      </div>
    </foreignObject>
  );
};

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
// Edge Tooltip
// ============================================================================

interface EdgeTooltipProps {
  edge: MindmapEdge;
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
  onClose: () => void;
}

const EdgeTooltip: React.FC<EdgeTooltipProps> = ({ edge, x, y, svgWidth, svgHeight, onClose }) => {
  const tooltipWidth = 170;
  const tooltipHeight = 80;

  // Position near midpoint, flip if too close to edge
  const flipX = x + tooltipWidth / 2 > svgWidth;
  const flipY = y + tooltipHeight > svgHeight;

  const left = flipX ? Math.max(4, x - tooltipWidth) : Math.max(4, x - tooltipWidth / 2);
  const top = flipY ? Math.max(4, y - tooltipHeight - 8) : y + 8;

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
          width: tooltipWidth,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '8px 10px',
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
          {edge.factorA} &times; {edge.factorB}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>&Delta;R&sup2;</span>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
              {(edge.deltaRSquared * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>p</span>
            <span
              style={{
                color: edge.pValue < 0.05 ? chartColors.warning : '#e2e8f0',
                fontWeight: 500,
              }}
            >
              {edge.pValue < 0.001 ? '< 0.001' : edge.pValue.toFixed(3)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>&beta;</span>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
              {edge.standardizedBeta.toFixed(2)}
            </span>
          </div>
        </div>
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
  mode = 'drilldown',
  edges,
  onEdgeClick,
  narrativeSteps,
  parentWidth,
  parentHeight,
  width: explicitWidth,
  height: explicitHeight,
}) => {
  const width = explicitWidth ?? parentWidth ?? 360;
  const height = explicitHeight ?? parentHeight ?? 400;
  const { isDark, chrome } = useChartTheme();

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null); // "factorA|factorB"

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

  // Drill trail line segments (only used in drilldown mode)
  const trailSegments = useMemo(() => {
    if (mode !== 'drilldown') return [];
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
  }, [mode, drillTrail, posMap, centerX, centerY]);

  // Visible interaction edges (used in interactions mode AND narrative cross-connections)
  const visibleEdges = useMemo(() => {
    if ((mode !== 'interactions' && mode !== 'narrative') || !edges) return [];
    return getVisibleEdges(edges);
  }, [mode, edges]);

  const maxDeltaR2 = useMemo(() => {
    if (visibleEdges.length === 0) return 0;
    return Math.max(...visibleEdges.map(e => e.deltaRSquared));
  }, [visibleEdges]);

  // Edge lookup for tooltip
  const edgeLookup = useMemo(() => {
    const map = new Map<string, MindmapEdge>();
    visibleEdges.forEach(e => {
      map.set(`${e.factorA}|${e.factorB}`, e);
    });
    return map;
  }, [visibleEdges]);

  // ── Narrative timeline layout ──
  const steps = narrativeSteps ?? [];
  const timelinePositions = useMemo(
    () => (mode === 'narrative' ? computeTimelineLayout(steps, width, height, MARGIN) : []),
    [mode, steps, width, height]
  );

  const timelinePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    timelinePositions.forEach(p => map.set(p.factor, { x: p.x, y: p.y }));
    return map;
  }, [timelinePositions]);

  // Cross-connection arcs: edges where both factors are in the timeline
  const narrativeCrossEdges = useMemo(() => {
    if (mode !== 'narrative' || steps.length < 2) return [];
    const timelineFactors = new Set(steps.map(s => s.factor));
    return visibleEdges.filter(
      e => timelineFactors.has(e.factorA) && timelineFactors.has(e.factorB)
    );
  }, [mode, steps, visibleEdges]);

  if (width < 100 || height < 100) return null;

  // === NARRATIVE MODE ===
  if (mode === 'narrative') {
    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <Group>
          {/* Empty state */}
          {steps.length === 0 && (
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fill={chrome.labelSecondary}
            >
              Drill into factors to build the investigation timeline
            </text>
          )}

          {/* Cross-connection arcs (dashed bezier above nodes) */}
          {narrativeCrossEdges.map(edge => {
            const pA = timelinePosMap.get(edge.factorA);
            const pB = timelinePosMap.get(edge.factorB);
            if (!pA || !pB) return null;

            const midX = (pA.x + pB.x) / 2;
            const dist = Math.abs(pB.x - pA.x);
            const arcHeight = Math.max(30, dist * 0.3);
            const cpY = Math.min(pA.y, pB.y) - arcHeight;

            return (
              <path
                key={`narc-${edge.factorA}-${edge.factorB}`}
                d={`M ${pA.x},${
                  pA.y - getNodeRadius(steps.find(s => s.factor === edge.factorA)?.etaSquared ?? 0)
                } Q ${midX},${cpY} ${pB.x},${
                  pB.y - getNodeRadius(steps.find(s => s.factor === edge.factorB)?.etaSquared ?? 0)
                }`}
                fill="none"
                stroke={chartColors.warning}
                strokeWidth={1.5}
                strokeOpacity={0.4}
                strokeDasharray="4,3"
              />
            );
          })}

          {/* Arc labels */}
          {narrativeCrossEdges.map(edge => {
            const pA = timelinePosMap.get(edge.factorA);
            const pB = timelinePosMap.get(edge.factorB);
            if (!pA || !pB) return null;

            const midX = (pA.x + pB.x) / 2;
            const dist = Math.abs(pB.x - pA.x);
            const arcHeight = Math.max(30, dist * 0.3);
            const labelY = Math.min(pA.y, pB.y) - arcHeight + 4;

            return (
              <text
                key={`narclbl-${edge.factorA}-${edge.factorB}`}
                x={midX}
                y={labelY}
                textAnchor="middle"
                fontSize={8}
                fill={chartColors.warning}
                fillOpacity={0.7}
              >
                &Delta;R&sup2; = {(edge.deltaRSquared * 100).toFixed(1)}%
              </text>
            );
          })}

          {/* Timeline connector line */}
          {timelinePositions.length >= 2 && (
            <line
              x1={timelinePositions[0].x}
              y1={timelinePositions[0].y}
              x2={timelinePositions[timelinePositions.length - 1].x}
              y2={timelinePositions[timelinePositions.length - 1].y}
              stroke={chartColors.mean}
              strokeWidth={2}
              strokeOpacity={0.4}
            />
          )}

          {/* Timeline nodes */}
          {timelinePositions.map(pos => {
            const step = steps.find(s => s.factor === pos.factor);
            if (!step) return null;
            const radius = getNodeRadius(step.etaSquared);

            return (
              <Group key={`tl-${pos.factor}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={chartColors.mean}
                  stroke={chartColors.mean}
                  strokeWidth={2.5}
                  style={{ transition: 'fill 0.2s' }}
                />
                {/* Factor label above */}
                <text
                  x={pos.x}
                  y={pos.y - radius - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={chrome.labelPrimary}
                  style={{ pointerEvents: 'none' }}
                >
                  {step.factor}
                </text>
                {/* η² inside */}
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={600}
                  fill="#ffffff"
                  style={{ pointerEvents: 'none' }}
                >
                  {(step.etaSquared * 100).toFixed(0)}%
                </text>
              </Group>
            );
          })}

          {/* Step annotations */}
          {timelinePositions.map((pos, i) => {
            const step = steps[i];
            if (!step) return null;
            return (
              <StepAnnotation
                key={`ann-${pos.factor}`}
                step={step}
                stepIndex={i}
                x={pos.x}
                y={pos.y}
                nodeRadius={getNodeRadius(step.etaSquared)}
                svgWidth={width}
                chrome={chrome}
              />
            );
          })}

          {/* Conclusion panel (right of last node, or below center if only 1 step) */}
          {steps.length > 0 &&
            (() => {
              const last = timelinePositions[timelinePositions.length - 1];
              if (!last) return null;
              const conclusionX = steps.length === 1 ? last.x : Math.min(last.x + 60, width - 90);
              const conclusionY = MARGIN.top + 4;
              return (
                <ConclusionPanel
                  steps={steps}
                  x={conclusionX}
                  y={conclusionY}
                  svgWidth={width}
                  targetPct={targetPct}
                  chrome={chrome}
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
  }

  // === DRILLDOWN / INTERACTIONS MODE (existing) ===
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <Group>
        {/* === INTERACTION EDGES (rendered before nodes for z-order) === */}
        {mode === 'interactions' &&
          visibleEdges.map(edge => {
            const posA = posMap.get(edge.factorA);
            const posB = posMap.get(edge.factorB);
            if (!posA || !posB) return null;

            const edgeKey = `${edge.factorA}|${edge.factorB}`;
            const opacity = getEdgeOpacity(edge.pValue);
            const strokeWidth = getEdgeWidth(edge.deltaRSquared, maxDeltaR2);

            return (
              <line
                key={`edge-${edgeKey}`}
                x1={posA.x}
                y1={posA.y}
                x2={posB.x}
                y2={posB.y}
                stroke={chartColors.warning}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeLinecap="round"
                style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
                onClick={() => onEdgeClick?.(edge.factorA, edge.factorB)}
                onMouseEnter={() => setHoveredEdge(edgeKey)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
            );
          })}

        {/* === "No interactions" message === */}
        {mode === 'interactions' && edges && visibleEdges.length === 0 && (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fill={chrome.labelSecondary}
          >
            No significant interactions found
          </text>
        )}

        {/* === DRILL TRAIL LINES (drilldown mode only) === */}
        {mode === 'drilldown' &&
          trailSegments.map((seg, i) => (
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
          // Only show pulse in drilldown mode
          const showPulse = mode === 'drilldown' && node.isSuggested;

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
                className={showPulse ? 'mindmap-pulse' : undefined}
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

        {/* Edge tooltip on hover */}
        {hoveredEdge &&
          (() => {
            const edge = edgeLookup.get(hoveredEdge);
            if (!edge) return null;
            const posA = posMap.get(edge.factorA);
            const posB = posMap.get(edge.factorB);
            if (!posA || !posB) return null;
            // Position tooltip at midpoint of edge
            const midX = (posA.x + posB.x) / 2;
            const midY = (posA.y + posB.y) / 2;

            return (
              <EdgeTooltip
                edge={edge}
                x={midX}
                y={midY}
                svgWidth={width}
                svgHeight={height}
                onClose={() => setHoveredEdge(null)}
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
