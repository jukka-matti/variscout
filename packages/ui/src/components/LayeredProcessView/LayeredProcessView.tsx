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

export const LayeredProcessView: React.FC<LayeredProcessViewProps> = ({ target, usl, lsl }) => {
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
      </section>
      <section data-testid="band-operations" className="px-4 py-3 bg-surface-secondary">
        <h3 className="text-sm font-semibold text-content">Operations</h3>
      </section>
    </div>
  );
};
