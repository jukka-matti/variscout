import React from 'react';
import FocusTrap from 'focus-trap-react';
import { formatStatistic } from '@variscout/core/i18n';
import type { ActionItem } from '@variscout/core/findings';
import type {
  CanvasAnalyzeFocus,
  CanvasStepCardModel,
  CanvasStepInvestigationOverlay,
} from '@variscout/hooks';
import { computeCtaState, type ResponsePathKind } from './responsePathCta';
import { ContextBadgesRow, type ContextLinkGroup, type ContextLinkItem } from '../../CrossSurface';
import { LogActionModal, RecentActivityPanel, type LogActionPayload } from '../../QuickAction';

export interface CanvasOverlayAnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface CanvasStepOverlayProps {
  card: CanvasStepCardModel;
  anchorRect?: CanvasOverlayAnchorRect | null;
  onClose: () => void;
  onQuickAction?: (stepId: string) => void;
  onLogQuickAction?: (stepId: string, payload: LogActionPayload) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  investigationOverlay?: CanvasStepInvestigationOverlay;
  onOpenInvestigationFocus?: (focus: CanvasAnalyzeFocus) => void;
  onRemoveCausalLink?: (linkId: string) => void;
  contextLinkGroups?: readonly ContextLinkGroup[];
  onNavigateContextLink?: (item: ContextLinkItem) => void;
  actionItems?: ActionItem[];
}

const DESKTOP_WIDTH = 440;
const DESKTOP_ESTIMATED_HEIGHT = 360;
const VIEWPORT_MARGIN = 16;
const MOBILE_BREAKPOINT = 768;

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function desktopOverlayStyle(anchorRect?: CanvasOverlayAnchorRect | null): React.CSSProperties {
  if (isMobileViewport()) return {};

  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - DESKTOP_WIDTH - VIEWPORT_MARGIN);
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    viewportHeight - DESKTOP_ESTIMATED_HEIGHT - VIEWPORT_MARGIN
  );

  if (!anchorRect) {
    return {
      top: clamp(96, VIEWPORT_MARGIN, maxTop),
      left: clamp((viewportWidth - DESKTOP_WIDTH) / 2, VIEWPORT_MARGIN, maxLeft),
      width: DESKTOP_WIDTH,
    };
  }

  const preferredRight = anchorRect.right + 12;
  const left =
    preferredRight + DESKTOP_WIDTH <= viewportWidth - VIEWPORT_MARGIN
      ? preferredRight
      : clamp(anchorRect.left, VIEWPORT_MARGIN, maxLeft);

  return {
    top: clamp(anchorRect.top, VIEWPORT_MARGIN, maxTop),
    left,
    width: DESKTOP_WIDTH,
  };
}

function capabilitySummary(card: CanvasStepCardModel): string {
  const c = card.capability;
  if (c.state === 'no-specs') return `No specs, n=${c.n}`;
  if (c.state === 'partial-specs') return `Partial specs, n=${c.n}`;
  if (c.state === 'suppressed') return `Cpk hidden, n=${c.n}`;
  if (c.state === 'review') return `Cpk ${formatStatistic(c.cpk ?? 0, 'en', 2)} trust pending`;
  if (c.state === 'graded') return `Cpk ${formatStatistic(c.cpk ?? 0, 'en', 2)} ${c.grade}`;
  return `Unavailable, n=${c.n}`;
}

const CTA_LABELS: Record<ResponsePathKind, string> = {
  'quick-action': 'Quick action',
  'focused-investigation': 'Focused investigation',
  charter: 'Improvement Project',
};

export const CanvasStepOverlay: React.FC<CanvasStepOverlayProps> = ({
  card,
  anchorRect,
  onClose,
  onQuickAction,
  onLogQuickAction,
  onFocusedInvestigation,
  onCharter,
  investigationOverlay,
  onOpenInvestigationFocus,
  onRemoveCausalLink,
  contextLinkGroups = [],
  onNavigateContextLink,
  actionItems = [],
}) => {
  const [showLogAction, setShowLogAction] = React.useState(false);
  const touchStartY = React.useRef<number | null>(null);
  const mobile = isMobileViewport();

  const handlerMap: Record<ResponsePathKind, ((stepId: string) => void) | undefined> = {
    'quick-action': onLogQuickAction ? () => setShowLogAction(true) : onQuickAction,
    'focused-investigation': onFocusedInvestigation,
    charter: onCharter,
  };

  const renderCta = (path: ResponsePathKind, extraClass?: string): React.ReactNode => {
    const handler = handlerMap[path];
    const state = computeCtaState({ path, hasHandler: handler !== undefined });
    const baseClass =
      'rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium';
    const cls = extraClass ? `${baseClass} ${extraClass}` : baseClass;

    if (state.kind === 'hidden') return null;

    return (
      <button
        key={path}
        type="button"
        data-testid={`canvas-cta-${path}`}
        data-cta-state="active"
        className={`${cls} text-content hover:bg-surface-tertiary`}
        onClick={() => handler!(card.stepId)}
      >
        {CTA_LABELS[path]}
      </button>
    );
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTouchStart = React.useCallback((event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchEnd = React.useCallback(
    (event: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
      const deltaY = endY - touchStartY.current;
      touchStartY.current = null;
      if (deltaY > 60) onClose();
    },
    [onClose]
  );

  const panelClassName = mobile
    ? 'absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-auto rounded-t-lg border border-edge bg-surface-primary p-4 shadow-xl'
    : 'absolute max-h-[82vh] overflow-auto rounded-lg border border-edge bg-surface-primary p-4 shadow-xl';

  return (
    <div className="fixed inset-0 z-50" data-testid="canvas-step-overlay-root">
      <button
        type="button"
        aria-label="Close step overlay"
        className="absolute inset-0 h-full w-full bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
          fallbackFocus: () => document.body,
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label={`${card.stepName} drill-down`}
          className={panelClassName}
          style={desktopOverlayStyle(anchorRect)}
          data-testid="canvas-step-overlay"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mobile ? (
            <div className="mb-3 flex justify-center" aria-hidden="true">
              <span
                className="h-1 w-10 rounded-full bg-content-muted/50"
                data-testid="canvas-step-overlay-handle"
              />
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-content">{card.stepName}</h3>
              <p className="text-sm text-content-secondary">
                {card.metricColumn ?? 'No metric selected'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded px-2 py-1 text-sm text-content-secondary hover:bg-surface-secondary hover:text-content"
              aria-label="Close"
            >
              x
            </button>
          </div>

          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md bg-surface-secondary p-3">
              <h4 className="text-xs font-semibold uppercase text-content-muted">Step analysis</h4>
              <p className="mt-1 text-content-secondary">
                {card.metricKind === 'numeric' && card.stats
                  ? `Mean ${formatStatistic(card.stats.mean, 'en', 2)}; sigma ${formatStatistic(card.stats.stdDev, 'en', 2)}; n=${card.capability.n}`
                  : card.metricKind === 'categorical'
                    ? `${card.distribution.length} observed categories`
                    : 'No metric is mapped to this step yet.'}
              </p>
            </div>

            <div className="rounded-md bg-surface-secondary p-3">
              <h4 className="text-xs font-semibold uppercase text-content-muted">
                Assigned columns
              </h4>
              <p className="mt-1 text-content-secondary">
                {card.assignedColumns.length > 0 ? card.assignedColumns.join(', ') : 'None'}
              </p>
            </div>

            <div className="rounded-md bg-surface-secondary p-3">
              <h4 className="text-xs font-semibold uppercase text-content-muted">Capability</h4>
              <p className="mt-1 text-content-secondary">{capabilitySummary(card)}</p>
              {card.defectCount !== undefined ? (
                <p className="mt-1 text-content-secondary">Defects: {card.defectCount}</p>
              ) : null}
            </div>

            <div className="rounded-md bg-surface-secondary p-3">
              <h4 className="text-xs font-semibold uppercase text-content-muted">
                Linked investigations
              </h4>
              {investigationOverlay &&
              (investigationOverlay.questions.length > 0 ||
                investigationOverlay.findings.length > 0 ||
                investigationOverlay.hypotheses.length > 0 ||
                investigationOverlay.causalLinks.length > 0) ? (
                <div className="mt-2 grid gap-2">
                  {investigationOverlay.hypotheses.map(cause => (
                    <button
                      key={`cause-${cause.id}`}
                      type="button"
                      className="rounded border border-edge bg-surface-primary px-2 py-1 text-left text-content-secondary hover:bg-surface-tertiary hover:text-content"
                      onClick={() => onOpenInvestigationFocus?.(cause.focus)}
                    >
                      Cause: {cause.name}
                    </button>
                  ))}
                  {investigationOverlay.findings.map(finding => (
                    <button
                      key={`finding-${finding.id}`}
                      type="button"
                      className="rounded border border-edge bg-surface-primary px-2 py-1 text-left text-content-secondary hover:bg-surface-tertiary hover:text-content"
                      onClick={() => onOpenInvestigationFocus?.(finding.focus)}
                    >
                      Finding: {finding.text}
                    </button>
                  ))}
                  {investigationOverlay.questions.map(question => (
                    <button
                      key={`question-${question.id}`}
                      type="button"
                      className="rounded border border-edge bg-surface-primary px-2 py-1 text-left text-content-secondary hover:bg-surface-tertiary hover:text-content"
                      onClick={() => onOpenInvestigationFocus?.(question.focus)}
                    >
                      Question: {question.text}
                    </button>
                  ))}
                  {investigationOverlay.causalLinks.map(link => (
                    <div key={`link-${link.id}`} className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex-1 rounded border border-edge bg-surface-primary px-2 py-1 text-left text-content-secondary hover:bg-surface-tertiary hover:text-content"
                        onClick={() => onOpenInvestigationFocus?.(link.focus)}
                      >
                        Link: {link.label}
                      </button>
                      {onRemoveCausalLink ? (
                        <button
                          type="button"
                          aria-label={`Remove hypothesis ${link.label}`}
                          title="Remove hypothesis"
                          className="rounded border border-edge bg-surface-primary px-2 py-1 text-content-secondary hover:bg-status-fail-soft hover:text-status-fail"
                          onClick={event => {
                            event.stopPropagation();
                            onRemoveCausalLink(link.id);
                          }}
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-content-secondary">No linked investigations yet.</p>
              )}
            </div>
          </div>

          {contextLinkGroups.length > 0 && onNavigateContextLink ? (
            <ContextBadgesRow
              groups={contextLinkGroups}
              onNavigate={onNavigateContextLink}
              className="mt-4"
            />
          ) : null}

          <div className="mt-4">
            <RecentActivityPanel stepId={card.stepId} actionItems={actionItems} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {renderCta('quick-action')}
            {renderCta('focused-investigation')}
            {renderCta('charter', 'sm:col-span-2')}
          </div>
        </section>
      </FocusTrap>
      {showLogAction ? (
        <LogActionModal
          cardTitle={card.stepName}
          onCancel={() => setShowLogAction(false)}
          onLog={payload => {
            onLogQuickAction?.(card.stepId, payload);
            setShowLogAction(false);
          }}
        />
      ) : null}
    </div>
  );
};
