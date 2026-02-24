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
  /** Optional callback to navigate to What-If Simulator */
  onNavigateToWhatIf?: () => void;
  /** Optional callback to navigate to Regression with investigated factors */
  onNavigateToRegression?: (factors: string[]) => void;
}

const ConclusionPanel: React.FC<ConclusionPanelProps> = ({
  steps,
  x,
  y,
  svgWidth,
  targetPct,
  chrome,
  onNavigateToWhatIf,
  onNavigateToRegression,
}) => {
  if (steps.length === 0) return null;

  const lastStep = steps[steps.length - 1];
  const cumPct = lastStep.cumulativeScope * 100;
  const reachedTarget = cumPct >= targetPct;
  const panelWidth = 160;
  const hasButtons = onNavigateToWhatIf || (onNavigateToRegression && steps.length >= 2);
  const buttonCount =
    (onNavigateToWhatIf ? 1 : 0) + (onNavigateToRegression && steps.length >= 2 ? 1 : 0);
  const panelHeight = hasButtons ? 80 + buttonCount * 24 : 80;
  const left = Math.max(4, Math.min(x - panelWidth / 2, svgWidth - panelWidth - 4));

  return (
    <foreignObject x={left} y={y} width={panelWidth} height={panelHeight}>
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
        <div style={{ color: chrome.labelPrimary, fontWeight: 600 }}>
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
        {onNavigateToRegression && steps.length >= 2 && (
          <button
            onClick={() => onNavigateToRegression(steps.map(s => s.factor))}
            style={{
              marginTop: 6,
              background: `${chartColors.warning}18`,
              border: `1px solid ${chartColors.warning}40`,
              borderRadius: 4,
              color: chartColors.warning,
              fontSize: 10,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '3px 8px',
              outline: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${chartColors.warning}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${chartColors.warning}18`;
            }}
            onFocus={e => {
              e.currentTarget.style.outline = `2px solid ${chartColors.warning}`;
              e.currentTarget.style.outlineOffset = '1px';
            }}
            onBlur={e => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            {'Refine in Regression \u2192'}
          </button>
        )}
        {onNavigateToWhatIf && (
          <button
            onClick={onNavigateToWhatIf}
            style={{
              marginTop: 6,
              background: `${chartColors.mean}18`,
              border: `1px solid ${chartColors.mean}40`,
              borderRadius: 4,
              color: chartColors.mean,
              fontSize: 10,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '3px 8px',
              outline: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${chartColors.mean}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${chartColors.mean}18`;
            }}
            onFocus={e => {
              e.currentTarget.style.outline = `2px solid ${chartColors.mean}`;
              e.currentTarget.style.outlineOffset = '1px';
            }}
            onBlur={e => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            {'Model improvements \u2192'}
          </button>
        )}
      </div>
    </foreignObject>
  );
};

export default ConclusionPanel;
