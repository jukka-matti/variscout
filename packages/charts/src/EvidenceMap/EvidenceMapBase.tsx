/**
 * EvidenceMapBase — SVG canvas composing all three Evidence Map layers
 *
 * Props-based, no store access. Follows the same pattern as IChartBase, BoxplotBase, etc.
 * Three composited <g> layers:
 *   Layer 1 (Statistical): factor nodes, outcome, edges, equation — always rendered
 *   Layer 2 (Investigation): causal links, evidence badges — when causalEdges present
 *   Layer 3 (Synthesis): convergence zones, hub labels — when convergencePoints present
 */

import React, { useState } from 'react';
import { Group } from '@visx/group';
import StatisticalLayer from './StatisticalLayer';
import InvestigationLayer from './InvestigationLayer';
import SynthesisLayer from './SynthesisLayer';
import type { EvidenceMapBaseProps } from './types';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 160;

const EvidenceMapBase: React.FC<EvidenceMapBaseProps> = ({
  parentWidth,
  parentHeight,
  outcomeNode,
  factorNodes,
  relationshipEdges,
  equation,
  causalEdges = [],
  convergencePoints = [],
  onFactorClick,
  onFactorHover,
  onEdgeClick,
  onCausalEdgeClick,
  onConvergenceClick,
  highlightedFactor: externalHighlight,
  highlightedEdge,
  showEquation = true,
  isDark = false,
  compact = false,
}) => {
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);
  const highlightedFactor = externalHighlight ?? hoveredFactor;

  const width = Math.max(parentWidth, MIN_WIDTH);
  const height = Math.max(parentHeight, MIN_HEIGHT);

  if (factorNodes.length === 0) {
    return (
      <svg width={width} height={height} role="img" aria-label="Evidence Map — no data">
        <rect width={width} height={height} fill="transparent" />
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill={isDark ? '#64748b' : '#94a3b8'}
          fontSize={13}
        >
          Factor Intelligence not available
        </text>
        <text
          x={width / 2}
          y={height / 2 + 18}
          textAnchor="middle"
          fill={isDark ? '#475569' : '#cbd5e1'}
          fontSize={11}
        >
          Add 2+ factors and outcome to see relationships
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Evidence Map: ${factorNodes.length} factors, ${causalEdges.length} causal links`}
      data-testid="chart-evidence-map"
    >
      <rect width={width} height={height} fill="transparent" />

      <Group>
        {/* Layer 3: Synthesis (behind everything else for zone rendering) */}
        <SynthesisLayer
          convergencePoints={convergencePoints}
          isDark={isDark}
          onConvergenceClick={onConvergenceClick}
        />

        {/* Layer 1: Statistical (factor nodes, edges, equation) */}
        <StatisticalLayer
          outcomeNode={outcomeNode}
          factorNodes={factorNodes}
          relationshipEdges={relationshipEdges}
          equation={equation}
          highlightedFactor={highlightedFactor}
          highlightedEdge={highlightedEdge ?? null}
          isDark={isDark}
          compact={compact}
          showEquation={showEquation}
          width={width}
          onFactorClick={onFactorClick}
          onFactorHover={factor => {
            setHoveredFactor(factor);
            onFactorHover?.(factor);
          }}
          onEdgeClick={onEdgeClick}
        />

        {/* Layer 2: Investigation (causal links overlay) */}
        <InvestigationLayer
          causalEdges={causalEdges}
          highlightedEdge={highlightedEdge ?? null}
          isDark={isDark}
          onCausalEdgeClick={onCausalEdgeClick}
        />
      </Group>
    </svg>
  );
};

export default EvidenceMapBase;
