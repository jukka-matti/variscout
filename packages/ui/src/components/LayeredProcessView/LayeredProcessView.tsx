/**
 * LayeredProcessView — three-band Makigami-style process visual.
 *
 * Stacks Outcome / Process Flow / Operations bands vertically. The Process
 * Flow band wraps the existing `ProcessMapBase` river-SIPOC; the Outcome and
 * Operations bands surround it. See spec at
 * `docs/superpowers/specs/2026-04-27-layered-process-view-design.md` (V1).
 */

import React from 'react';
import type { ProcessMap, Gap } from '@variscout/core/frame';
import { ProcessMapBase } from '../ProcessMap/ProcessMapBase';

export interface LayeredProcessViewProps {
  map: ProcessMap;
  availableColumns: string[];
  onChange: (next: ProcessMap) => void;
  gaps?: Gap[];
  disabled?: boolean;
  target?: number;
  usl?: number;
  lsl?: number;
  onSpecsChange?: (next: { target?: number; usl?: number; lsl?: number }) => void;
}

export const LayeredProcessView: React.FC<LayeredProcessViewProps> = ({
  map,
  availableColumns,
  onChange,
  gaps,
  disabled,
  target,
  usl,
  lsl,
  onSpecsChange,
}) => {
  const hasOutcomeData = target !== undefined || usl !== undefined || lsl !== undefined;

  return (
    <div data-testid="layered-process-view" className="flex flex-col">
      <section
        data-testid="band-outcome"
        className="border-b border-edge px-4 py-3 bg-surface-secondary"
      >
        <h3 className="text-sm font-semibold text-content">Outcome</h3>
        {hasOutcomeData ? (
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-secondary">
            {target !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">Target:</dt>
                <dd>{target}</dd>
              </div>
            )}
            {usl !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">USL:</dt>
                <dd>{usl}</dd>
              </div>
            )}
            {lsl !== undefined && (
              <div className="flex gap-1">
                <dt className="font-medium">LSL:</dt>
                <dd>{lsl}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-content-secondary italic">No outcome target set</p>
        )}
      </section>
      <section data-testid="band-process-flow" className="border-b border-edge px-4 py-3">
        <h3 className="text-sm font-semibold text-content">Process Flow</h3>
        <div className="mt-2">
          <ProcessMapBase
            map={map}
            availableColumns={availableColumns}
            onChange={onChange}
            gaps={gaps}
            disabled={disabled}
            target={target}
            usl={usl}
            lsl={lsl}
            onSpecsChange={onSpecsChange}
          />
        </div>
      </section>
      <section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
        <h3 className="text-sm font-semibold text-content">Operations</h3>
        {map.tributaries.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {map.tributaries.map(trib => {
              const parentStep = map.nodes.find(n => n.id === trib.stepId);
              const stepLabel = parentStep?.name ?? 'Unmapped';
              return (
                <li
                  key={trib.id}
                  data-testid={`factor-chip-${trib.id}`}
                  className="rounded-md border border-edge bg-surface px-2 py-1 text-xs"
                >
                  <span className="font-medium text-content">{trib.column}</span>
                  <span className="ml-1 text-content-secondary">at {stepLabel}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-content-secondary italic">No factors mapped yet</p>
        )}
      </section>
    </div>
  );
};
