import React from 'react';
import { chartColors } from '../colors';
import type { useChartTheme } from '../useChartTheme';
import type { NarrativeStep } from './types';

export interface ConclusionPanelProps {
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
  const cumPct = lastStep.cumulativeScope * 100;
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
          Focused on {cumPct.toFixed(0)}% of variation
        </div>
        <div
          style={{
            color: reachedTarget ? chartColors.pass : chrome.labelSecondary,
            marginTop: 2,
          }}
        >
          {reachedTarget
            ? 'Investigation target reached'
            : `${(100 - cumPct).toFixed(0)}% outside scope \u2014 consider additional factors`}
        </div>
      </div>
    </foreignObject>
  );
};

export default ConclusionPanel;
