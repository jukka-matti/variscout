/**
 * CapabilityBoxplot — per-canonical-node Cpk distribution.
 *
 * Each node renders as one boxplot category (or a jittered dot cluster when
 * the node has fewer than 7 per-context Cpks — BoxplotBase fallback). Adds
 * per-node target Cpk ticks and sample-confidence badges as an overlay SVG
 * that mirrors BoxplotBase's internal scales.
 *
 * Bottom-left slot of the production-line-glance 2×2 dashboard. See spec
 * docs/superpowers/specs/2026-04-28-production-line-glance-design.md.
 *
 * Watson "Cpks aren't additive across heterogeneous local processes" is
 * preserved structurally: the chart visualises the distribution of per-context
 * Cpks without ever collapsing them to a single aggregate.
 */
import React, { useMemo } from 'react';
import { withParentSize } from '@visx/responsive';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { calculateBoxplotStats } from '@variscout/core';
import { BoxplotBase, BOXPLOT_BAND_PADDING } from './Boxplot';
import { useChartTheme } from './useChartTheme';
import { useChartLayout } from './hooks';
import type { CapabilityBoxplotProps, CapabilityBoxplotNode, BoxplotGroupData } from './types';

// ── helpers ──────────────────────────────────────────────────────────────────

interface UsableNode {
  node: CapabilityBoxplotNode;
  cpks: number[];
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function extractUsableNodes(nodes: ReadonlyArray<CapabilityBoxplotNode>): UsableNode[] {
  return nodes
    .map(node => ({
      node,
      cpks: (node.result.perContextResults ?? []).map(r => r.cpk).filter(isFiniteNumber),
    }))
    .filter(u => u.cpks.length > 0);
}

function toBoxplotGroups(usable: UsableNode[]): BoxplotGroupData[] {
  return usable.map(({ node, cpks }) => calculateBoxplotStats({ group: node.label, values: cpks }));
}

function yDomainFor(usable: UsableNode[], targetCpks: number[]): [number, number] {
  const all: number[] = [];
  usable.forEach(u => all.push(...u.cpks));
  all.push(...targetCpks);
  if (all.length === 0) return [0, 2];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = Math.max((max - min) * 0.1, 0.1);
  return [Math.min(0, min - pad), max + pad];
}

// ── component ─────────────────────────────────────────────────────────────────

export const CapabilityBoxplotBase: React.FC<CapabilityBoxplotProps> = ({
  parentWidth,
  parentHeight,
  nodes,
  hideTargetTicks = false,
  yAxisLabel = 'Cpk',
  onNodeClick,
  showBranding,
  brandingText,
}) => {
  const theme = useChartTheme();

  // Mirror BoxplotBase's layout exactly so our overlay SVG aligns.
  const {
    margin,
    width: innerWidth,
    height: innerHeight,
  } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'boxplot',
    showBranding,
  });

  const usable = useMemo(() => extractUsableNodes(nodes), [nodes]);
  const groups = useMemo(() => toBoxplotGroups(usable), [usable]);

  const targetCpks = useMemo(
    () => usable.map(u => u.node.targetCpk).filter(isFiniteNumber),
    [usable]
  );
  const [yMin, yMax] = useMemo(() => yDomainFor(usable, targetCpks), [usable, targetCpks]);

  // Mirror BoxplotBase's scaleBand — use the exported constant to guarantee alignment.
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: usable.map(u => u.node.label),
        range: [0, innerWidth],
        padding: BOXPLOT_BAND_PADDING,
      }),
    [usable, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [yMin, yMax],
        range: [innerHeight, 0],
        nice: true,
      }),
    [yMin, yMax, innerHeight]
  );

  if (usable.length === 0) {
    return null;
  }

  const bandWidth = xScale.bandwidth();

  return (
    <div style={{ position: 'relative', width: parentWidth, height: parentHeight }}>
      {/* Base boxplot layer */}
      <BoxplotBase
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        data={groups}
        specs={{}}
        yAxisLabel={yAxisLabel}
        yDomainOverride={{ min: yMin, max: yMax }}
        onBoxClick={
          onNodeClick
            ? key => {
                const match = usable.find(u => u.node.label === key);
                if (match) onNodeClick(match.node.nodeId);
              }
            : undefined
        }
        showBranding={showBranding}
        brandingText={brandingText}
      />

      {/* Overlay layer: per-node target ticks + confidence badges */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={parentWidth}
        height={parentHeight}
        aria-hidden="true"
      >
        <Group left={margin.left} top={margin.top}>
          {usable.map(({ node }) => {
            const cx = (xScale(node.label) ?? 0) + bandWidth / 2;

            return (
              <Group key={node.nodeId}>
                {/* Per-node target Cpk tick */}
                {!hideTargetTicks && isFiniteNumber(node.targetCpk) ? (
                  <line
                    data-testid={`target-tick-${node.nodeId}`}
                    x1={cx - bandWidth * 0.45}
                    x2={cx + bandWidth * 0.45}
                    y1={yScale(node.targetCpk)}
                    y2={yScale(node.targetCpk)}
                    stroke={theme.colors.target}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                ) : null}

                {/* Sample-confidence badge (shown for 'review' and 'insufficient') */}
                {node.result.sampleConfidence !== 'trust' ? (
                  <g data-testid={`confidence-badge-${node.nodeId}`}>
                    <circle
                      cx={cx + bandWidth * 0.4}
                      cy={innerHeight + 4}
                      r={6}
                      fill={
                        node.result.sampleConfidence === 'insufficient'
                          ? theme.colors.fail
                          : theme.colors.warning
                      }
                    />
                    {/* pointStroke is white in light theme / slate-900 in dark — ideal
                        badge text fill against a coloured circle background. */}
                    <text
                      x={cx + bandWidth * 0.4}
                      y={innerHeight + 7}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill={theme.chrome.pointStroke}
                    >
                      n
                    </text>
                  </g>
                ) : null}
              </Group>
            );
          })}
        </Group>
      </svg>
    </div>
  );
};

const CapabilityBoxplot = withParentSize(CapabilityBoxplotBase);
export default CapabilityBoxplot;
export { CapabilityBoxplot };
