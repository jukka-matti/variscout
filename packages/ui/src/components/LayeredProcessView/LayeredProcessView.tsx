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

export const LayeredProcessView: React.FC<LayeredProcessViewProps> = () => {
  return (
    <div data-testid="layered-process-view" className="flex flex-col">
      <section
        data-testid="band-outcome"
        className="border-b border-edge px-4 py-3 bg-surface-secondary"
      >
        <h3 className="text-sm font-semibold text-content">Outcome</h3>
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
