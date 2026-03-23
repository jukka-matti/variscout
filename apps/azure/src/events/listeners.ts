import type { DomainEventBus, DomainEventMap } from '@variscout/core/events';
import { usePanelsStore } from '../features/panels/panelsStore';
import { useFindingsStore } from '../features/findings/findingsStore';
import { useInvestigationStore } from '../features/investigation/investigationStore';

// ── Typed on() helper ────────────────────────────────────────────────────────

type EventKey = keyof DomainEventMap;
type Handler<K extends EventKey> = (payload: DomainEventMap[K]) => void;

interface RegisteredHandler<K extends EventKey = EventKey> {
  event: K;
  handler: Handler<K>;
}

// ── registerListeners ────────────────────────────────────────────────────────

/**
 * Register all domain event listeners on the provided bus.
 * Accepts a bus parameter for testability (tests pass a fresh bus instance).
 * Returns a cleanup function that unregisters all listeners.
 */
export function registerListeners(bus: DomainEventBus): () => void {
  const registered: RegisteredHandler[] = [];

  function on<K extends EventKey>(event: K, handler: Handler<K>): void {
    bus.on(event, handler as Handler<EventKey>);
    registered.push({ event, handler: handler as Handler<EventKey> });
  }

  // ── finding:created ───────────────────────────────────────────────────────
  on('finding:created', ({ finding }) => {
    usePanelsStore.getState().setFindingsOpen(true);
    useFindingsStore.getState().setHighlightedFindingId(finding.id);
  });

  // ── highlight:finding ─────────────────────────────────────────────────────
  on('highlight:finding', ({ findingId }) => {
    useFindingsStore.getState().setHighlightedFindingId(findingId);
  });

  // ── navigate:to ──────────────────────────────────────────────────────────
  on('navigate:to', ({ target, targetId, chartType }) => {
    const panels = usePanelsStore.getState();

    switch (target) {
      case 'dashboard':
        panels.showDashboard();
        break;

      case 'finding':
        panels.showEditor();
        panels.setFindingsOpen(true);
        if (targetId) {
          useFindingsStore.getState().setHighlightedFindingId(targetId);
        }
        break;

      case 'hypothesis':
        panels.showEditor();
        panels.setFindingsOpen(true);
        if (targetId) {
          useInvestigationStore.getState().expandToHypothesis(targetId);
        }
        break;

      case 'chart':
        panels.showEditor();
        if (chartType) {
          panels.setPendingChartFocus(chartType);
        }
        break;

      case 'improvement_workspace':
        panels.showEditor();
        panels.setImprovementOpen(true);
        break;

      case 'report':
        panels.showEditor();
        panels.openReport();
        break;
    }
  });

  // ── panel:visibility-changed ──────────────────────────────────────────────
  on('panel:visibility-changed', ({ panel, visible }) => {
    const panels = usePanelsStore.getState();
    switch (panel) {
      case 'whatIf':
        panels.setWhatIfOpen(visible);
        break;
      case 'findings':
        panels.setFindingsOpen(visible);
        break;
      case 'improvement':
        panels.setImprovementOpen(visible);
        break;
    }
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    for (const { event, handler } of registered) {
      bus.off(event, handler as Handler<EventKey>);
    }
  };
}
