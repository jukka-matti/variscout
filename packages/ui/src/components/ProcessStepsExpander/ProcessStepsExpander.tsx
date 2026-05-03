/**
 * ProcessStepsExpander — FRAME b0 disclosure widget.
 *
 * Small collapsible section that lets the b0 user opt into authoring a
 * process map. Collapsed by default; clicking the header reveals the
 * children inline (typically the full <LayeredProcessView /> /
 * <ProcessMapBase /> canvas).
 *
 * Adding the first process step is what flips scope b0→b1 in the data
 * layer — this widget itself is purely presentational and just renders
 * its children when expanded.
 *
 * Hard rules:
 * - Presentational primitive — props-based, no Zustand access.
 * - i18n via useTranslation hook — no hardcoded English strings.
 * - Semantic Tailwind only (no color-scheme props).
 * - Single header <button>; the panel is a <div> (children may contain
 *   their own buttons — no nested <button> in <button>).
 */

import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from '@variscout/hooks';

export interface ProcessStepsExpanderProps {
  /** Controlled open state. If undefined, the component manages local state (uncontrolled). */
  open?: boolean;
  /** Default open state for uncontrolled mode. Defaults to false. */
  defaultOpen?: boolean;
  /** Fired when the user clicks the header to toggle. Required for controlled mode. */
  onOpenChange?: (open: boolean) => void;
  /** Children rendered inside the expanded panel — typically the full process-map canvas. */
  children: ReactNode;
  /** Optional className for layout. */
  className?: string;
}

export function ProcessStepsExpander({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: ProcessStepsExpanderProps) {
  const { t } = useTranslation();

  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  // Stable a11y id pair — header labels panel; panel is controlled-by header.
  const reactId = useId();
  const headerId = `process-steps-expander-header-${reactId}`;
  const panelId = `process-steps-expander-panel-${reactId}`;

  const label = t('frame.b0.addProcessSteps.label');
  const helper = t('frame.b0.addProcessSteps.helper');

  const handleToggle = () => {
    const next = !open;
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  // Chevron glyph: ▾ when open, ▸ when collapsed (matches spec visual).
  const chevron = open ? '▾' : '▸';

  const containerClass = ['flex flex-col gap-2', className].filter(Boolean).join(' ');

  return (
    <section className={containerClass} data-testid="process-steps-expander">
      <button
        id={headerId}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-baseline gap-2 text-left text-sm text-content-secondary hover:text-content transition-colors"
        data-testid="process-steps-expander-header"
      >
        <span aria-hidden="true" className="text-content-muted">
          {chevron}
        </span>
        <span className="font-medium">{label}</span>
        <span className="text-xs text-content-muted">{helper}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-t border-edge pt-3"
          data-testid="process-steps-expander-panel"
        >
          {children}
        </div>
      )}
    </section>
  );
}
