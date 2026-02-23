import React, { useState } from 'react';
import { chartColors } from '../colors';
import type { useChartTheme } from '../useChartTheme';
import type { NarrativeStep } from './types';

const ANNOTATION_BOX_WIDTH = 140;

export interface StepAnnotationProps {
  step: NarrativeStep;
  stepIndex: number;
  x: number;
  y: number;
  nodeRadius: number;
  svgWidth: number;
  chrome: ReturnType<typeof useChartTheme>['chrome'];
  onAnnotationChange?: (stepIndex: number, text: string) => void;
  columnAliases?: Record<string, string>;
}

const StepAnnotation: React.FC<StepAnnotationProps> = ({
  step,
  stepIndex,
  x,
  y,
  nodeRadius,
  svgWidth,
  chrome,
  onAnnotationChange,
  columnAliases,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(step.annotation ?? '');

  const boxLeft = Math.max(
    4,
    Math.min(x - ANNOTATION_BOX_WIDTH / 2, svgWidth - ANNOTATION_BOX_WIDTH - 4)
  );
  const boxTop = y + nodeRadius + 20;
  const boxHeight = isEditing ? 190 : 120;

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

  const handleStartEdit = () => {
    setEditText(step.annotation ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onAnnotationChange?.(stepIndex, editText.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(step.annotation ?? '');
    setIsEditing(false);
  };

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
      <foreignObject x={boxLeft} y={boxTop} width={ANNOTATION_BOX_WIDTH} height={boxHeight}>
        <div
          style={{
            background: 'rgba(30,41,59,0.85)',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: 10,
            lineHeight: 1.5,
            cursor: onAnnotationChange && !isEditing ? 'pointer' : 'default',
          }}
          onClick={onAnnotationChange && !isEditing ? handleStartEdit : undefined}
        >
          <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}>
            {columnAliases?.[step.factor] || step.factor} = {valuesLabel}
          </div>
          <div style={{ color: '#94a3b8' }}>
            {(step.scopeFraction * 100).toFixed(0)}% of variation in scope
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

          {/* Annotation section */}
          {isEditing ? (
            <div style={{ marginTop: 4 }}>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                  }
                }}
                autoFocus
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 4,
                  padding: '3px 5px',
                  fontSize: 10,
                  lineHeight: 1.4,
                  color: '#e2e8f0',
                  resize: 'none',
                  outline: 'none',
                }}
                onClick={e => e.stopPropagation()}
                placeholder="Add a note..."
              />
              <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                Enter to save &middot; Esc to cancel
              </div>
            </div>
          ) : step.annotation ? (
            <div
              style={{
                marginTop: 4,
                padding: '3px 5px',
                background: 'rgba(59,130,246,0.1)',
                borderRadius: 4,
                color: '#93c5fd',
                fontSize: 10,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {step.annotation}
            </div>
          ) : onAnnotationChange ? (
            <div style={{ marginTop: 4, color: '#475569', fontSize: 9 }}>+ Add note</div>
          ) : null}
        </div>
      </foreignObject>
    </>
  );
};

export default StepAnnotation;
