import React, { useMemo, useState, useCallback } from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';

// Re-export types for backward compatibility
export type {
  CategoryData,
  MindmapNode,
  MindmapMode,
  NarrativeStep,
  InvestigationMindmapProps,
} from './mindmap/types';

// Import extracted modules
import type { MindmapNode, InvestigationMindmapProps } from './mindmap/types';
import {
  MARGIN,
  PROGRESS_BAR_HEIGHT,
  CENTER_NODE_RADIUS,
  getNodeRadius,
  getNodeFill,
  getNodeStroke,
} from './mindmap/helpers';
import { computeLayout, computeTimelineLayout } from './mindmap/layout';
import StepAnnotation from './mindmap/StepAnnotation';
import ConclusionPanel from './mindmap/ConclusionPanel';
import CategoryPopover from './mindmap/CategoryPopover';
import ProgressFooter from './mindmap/ProgressFooter';

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
  narrativeSteps,
  onAnnotationChange,
  parentWidth,
  parentHeight,
  width: explicitWidth,
  height: explicitHeight,
  columnAliases,
  onNavigateToWhatIf,
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

  // ── Narrative timeline layout ──
  const steps = narrativeSteps ?? [];
  const timelinePositions = useMemo(
    () => (mode === 'narrative' ? computeTimelineLayout(steps, width, height) : []),
    [mode, steps, width, height]
  );

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
            const radius = getNodeRadius(step.scopeFraction);

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
                  {columnAliases?.[step.factor] || step.factor}
                </text>
                {/* Scope fraction inside */}
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
                  {(step.scopeFraction * 100).toFixed(0)}%
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
                nodeRadius={getNodeRadius(step.scopeFraction)}
                svgWidth={width}
                chrome={chrome}
                onAnnotationChange={onAnnotationChange}
                columnAliases={columnAliases}
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
                  onNavigateToWhatIf={onNavigateToWhatIf}
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

  // === DRILLDOWN MODE ===
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <Group>
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
                {node.displayName || node.factor}
              </text>

              {/* η² percentage inside node (available/exhausted only — active shows no %) */}
              {node.state !== 'active' && node.etaSquared > 0 && (
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={600}
                  fill={chrome.labelPrimary}
                  style={{ pointerEvents: 'none' }}
                >
                  {(node.etaSquared * 100).toFixed(0)}%
                </text>
              )}

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
};

const InvestigationMindmap = withParentSize(InvestigationMindmapBase);

export default InvestigationMindmap;
