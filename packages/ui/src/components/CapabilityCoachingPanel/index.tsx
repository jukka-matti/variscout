/**
 * CapabilityCoachingPanel - Static educational content explaining capability
 * view concepts (Cpk vs Cp, centering vs spread, rational subgroups).
 *
 * Content distilled from `packages/core/src/ai/prompts/coScout/modes/capability.ts:54-81`
 * so the methodology is visible in the UI without requiring a CoScout/AI call
 * (Constitution P8 — deterministic first, AI enhances).
 *
 * Aligns with ADR-038 (capability as control chart) and the FRAME workspace
 * plan (ADR-070) capability-storytelling leg.
 *
 * Props-based, no context. Pure presentational.
 */

import React from 'react';

export interface CapabilityCoachingPanelProps {
  /** Optional close handler. If provided, an X button renders in the header. */
  onClose?: () => void;
  /** Extra className for outer container. */
  className?: string;
}

export const CapabilityCoachingPanel: React.FC<CapabilityCoachingPanelProps> = ({
  onClose,
  className,
}) => {
  return (
    <aside
      className={`bg-surface-secondary border border-edge rounded-lg p-4 text-sm text-content ${className ?? ''}`}
      aria-label="Capability coaching panel"
      data-testid="capability-coaching-panel"
    >
      <header className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold">How to read this chart</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-content-secondary hover:text-content p-1 -m-1"
            aria-label="Close coaching panel"
          >
            ×
          </button>
        )}
      </header>

      <section className="mb-4">
        <h4 className="font-medium mb-1">The two capability numbers</h4>
        <ul className="space-y-1 text-content-secondary">
          <li>
            <span className="text-content font-medium">Cpk</span> — realized capability. Accounts
            for both centering and spread. Target ≥ 1.33.
          </li>
          <li>
            <span className="text-content font-medium">Cp</span> — potential capability. Measures
            spread only, assuming perfect centering.
          </li>
          <li>
            The gap between Cp and Cpk is <span className="text-content">centering loss</span> — the
            mean is off-target.
          </li>
        </ul>
      </section>

      <section className="mb-4">
        <h4 className="font-medium mb-1">Centering vs spread</h4>
        <ul className="space-y-1 text-content-secondary">
          <li>
            <span className="text-content">Cp high, Cpk low</span> — spread is fine, mean is
            off-center. Fix: recenter.
          </li>
          <li>
            <span className="text-content">Cp low, Cpk low</span> — too much variation. Fix: reduce
            spread first.
          </li>
          <li>
            <span className="text-content">Cpk varies across subgroups</span> — capability is
            unstable. Investigate <em>which</em> subgroups and <em>when</em>.
          </li>
        </ul>
      </section>

      <section>
        <h4 className="font-medium mb-1">Why rational subgroups?</h4>
        <p className="text-content-secondary">
          Subgroups should reflect the structure of your process (machine, shift, batch, lot) — not
          an arbitrary size. The chart plots one Cpk per subgroup so you can see <em>where</em> and{' '}
          <em>when</em> capability drifts, not just an overall number.
        </p>
      </section>
    </aside>
  );
};
