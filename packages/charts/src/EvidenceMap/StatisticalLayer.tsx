/**
 * StatisticalLayer — Layer 1 of the Evidence Map
 *
 * Renders factor nodes, outcome node, relationship edges, and equation bar.
 * Always present (PWA + Azure). Pure statistical view from best subsets regression.
 */

import React from 'react';
import { Group } from '@visx/group';
import { chartColors, getChromeColors } from '../colors';
import FactorNode from './FactorNode';
import RelationshipEdge from './RelationshipEdge';
import type { FactorNodeData, RelationshipEdgeData, OutcomeNodeData, EquationData } from './types';

interface StatisticalLayerProps {
  outcomeNode: OutcomeNodeData | null;
  factorNodes: FactorNodeData[];
  relationshipEdges: RelationshipEdgeData[];
  equation: EquationData | null;
  highlightedFactor: string | null;
  highlightedEdge: string | null;
  isDark: boolean;
  compact: boolean;
  showEquation: boolean;
  width: number;
  zoomScale?: number;
  onFactorClick?: (factor: string) => void;
  onFactorHover?: (factor: string | null) => void;
  onFactorContextMenu?: (factor: string, clientX: number, clientY: number) => void;
  onEdgeClick?: (factorA: string, factorB: string) => void;
  onNodeTap?: (factor: string) => void;
  onEdgeTap?: (factorA: string, factorB: string) => void;
}

const StatisticalLayer: React.FC<StatisticalLayerProps> = ({
  outcomeNode,
  factorNodes,
  relationshipEdges,
  equation,
  highlightedFactor,
  highlightedEdge,
  isDark,
  compact,
  showEquation,
  width,
  zoomScale = 1,
  onFactorClick,
  onFactorHover,
  onFactorContextMenu,
  onEdgeClick,
  onNodeTap,
  onEdgeTap,
}) => {
  const chrome = getChromeColors(isDark);
  const textColor = chrome.labelPrimary;
  const bgColor = chrome.gridLine;

  /** Progressive label disclosure: hide labels at low zoom in compact mode */
  const hideLabels = compact && zoomScale < 1.5;

  return (
    <Group>
      {/* Equation bar (top) — hidden when labels are hidden */}
      {showEquation && equation && !compact && !hideLabels && (
        <Group>
          <rect
            x={width * 0.15}
            y={8}
            width={width * 0.7}
            height={44}
            rx={8}
            fill={bgColor}
            stroke={chrome.tooltipBorder}
            strokeWidth={1}
          />
          <text
            x={width / 2}
            y={26}
            textAnchor="middle"
            fill={isDark ? '#93c5fd' : '#2563eb'}
            fontSize={10}
            fontWeight="bold"
          >
            Best Model: {equation.factors.join(' + ')} → R²adj ={' '}
            {(equation.rSquaredAdj * 100).toFixed(0)}%
          </text>
          <text
            x={width / 2}
            y={42}
            textAnchor="middle"
            fill={textColor}
            fontSize={11}
            fontFamily="monospace"
          >
            {equation.formula}
          </text>
        </Group>
      )}

      {/* Relationship edges (render behind nodes) */}
      {relationshipEdges.map(edge => {
        const edgeKey = `${edge.factorA}-${edge.factorB}`;
        return (
          <RelationshipEdge
            key={edgeKey}
            edge={edge}
            isHighlighted={
              highlightedEdge === edgeKey ||
              highlightedFactor === edge.factorA ||
              highlightedFactor === edge.factorB
            }
            isDark={isDark}
            hideLabels={hideLabels}
            onClick={onEdgeTap ?? onEdgeClick}
          />
        );
      })}

      {/* Factor → Outcome edges (simple lines) */}
      {outcomeNode &&
        factorNodes.map(node => (
          <line
            key={`edge-${node.factor}-outcome`}
            x1={node.x}
            y1={node.y}
            x2={outcomeNode.x}
            y2={outcomeNode.y}
            stroke={chrome.tooltipBorder}
            strokeWidth={Math.max(1, node.rSquaredAdj * 8)}
            opacity={highlightedFactor === node.factor ? 0.5 : 0.15}
          />
        ))}

      {/* Outcome node (center) */}
      {outcomeNode && (
        <Group top={outcomeNode.y} left={outcomeNode.x}>
          <circle r={outcomeNode.radius} fill={chartColors.mean} opacity={0.85} />
          <text
            textAnchor="middle"
            dy={compact ? 0 : -6}
            fill="white"
            fontSize={compact ? 8 : 11}
            fontWeight="bold"
          >
            {outcomeNode.label.length > 14
              ? outcomeNode.label.slice(0, 12) + '...'
              : outcomeNode.label}
          </text>
          {!compact && (
            <text textAnchor="middle" dy={8} fill="#bfdbfe" fontSize={10}>
              ȳ = {outcomeNode.mean.toFixed(1)}
            </text>
          )}
        </Group>
      )}

      {/* Factor nodes */}
      {factorNodes.map(node => (
        <FactorNode
          key={node.factor}
          node={node}
          isHighlighted={highlightedFactor === node.factor}
          isDark={isDark}
          compact={compact}
          hideLabels={hideLabels}
          onClick={onFactorClick}
          onHover={onFactorHover}
          onTap={onNodeTap}
          onContextMenu={onFactorContextMenu}
        />
      ))}
    </Group>
  );
};

export default StatisticalLayer;
