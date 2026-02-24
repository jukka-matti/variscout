import React from 'react';
import { chartColors } from '../colors';
import type { useChartTheme } from '../useChartTheme';
import type { MindmapEdge } from './types';

export interface EdgeTooltipProps {
  edge: MindmapEdge;
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
  onClose: () => void;
  columnAliases?: Record<string, string>;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
  /** Optional callback to model this interaction pair in Regression */
  onModelInteraction?: (factors: string[]) => void;
}

const EdgeTooltip: React.FC<EdgeTooltipProps> = ({
  edge,
  x,
  y,
  svgWidth,
  svgHeight,
  onClose,
  columnAliases,
  chrome,
  onModelInteraction,
}) => {
  const tooltipWidth = 170;
  const tooltipHeight = onModelInteraction ? 110 : 80;

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
          background: chrome.tooltipBg,
          border: `1px solid ${chrome.gridLine}`,
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
            color: chrome.labelPrimary,
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: `1px solid ${chrome.gridLine}`,
          }}
        >
          {columnAliases?.[edge.factorA] || edge.factorA} &times;{' '}
          {columnAliases?.[edge.factorB] || edge.factorB}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: chrome.labelSecondary }}>&Delta;R&sup2;</span>
            <span style={{ color: chrome.tooltipText, fontWeight: 500 }}>
              {(edge.deltaRSquared * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: chrome.labelSecondary }}>p</span>
            <span
              style={{
                color: edge.pValue < 0.05 ? chartColors.warning : chrome.tooltipText,
                fontWeight: 500,
              }}
            >
              {edge.pValue < 0.001 ? '< 0.001' : edge.pValue.toFixed(3)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: chrome.labelSecondary }}>&beta;</span>
            <span style={{ color: chrome.tooltipText, fontWeight: 500 }}>
              {edge.standardizedBeta.toFixed(2)}
            </span>
          </div>
        </div>
        {onModelInteraction && (
          <button
            onClick={e => {
              e.stopPropagation();
              onModelInteraction([edge.factorA, edge.factorB]);
              onClose();
            }}
            style={{
              marginTop: 6,
              width: '100%',
              background: `${chartColors.warning}18`,
              border: `1px solid ${chartColors.warning}40`,
              borderRadius: 4,
              color: chartColors.warning,
              fontSize: 10,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '3px 8px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${chartColors.warning}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${chartColors.warning}18`;
            }}
          >
            Model in Regression &rarr;
          </button>
        )}
      </div>
    </foreignObject>
  );
};

export default EdgeTooltip;
