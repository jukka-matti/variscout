import mitt, { type Emitter } from 'mitt';
import type { Finding, FindingSource, FindingStatus, FindingOutcome, ActionItem } from './findings';

// ── Navigation Types ──────────────────────────────────────────────────

export type NavigationTarget =
  | 'dashboard'
  | 'finding'
  | 'hypothesis'
  | 'chart'
  | 'improvement_workspace'
  | 'report';

export type PanelName = 'findings' | 'whatIf' | 'improvement' | 'coScout' | 'report';

// ── Event Payloads ────────────────────────────────────────────────────

export interface FindingCreatedEvent {
  finding: Finding;
  source?: FindingSource;
}

export interface FindingStatusChangedEvent {
  findingId: string;
  from: FindingStatus;
  to: FindingStatus;
}

export interface FindingResolvedEvent {
  findingId: string;
  outcome: FindingOutcome;
}

export interface HypothesisValidatedEvent {
  hypothesisId: string;
  status: 'supported' | 'contradicted' | 'partial';
  eta2: number;
}

export interface HypothesisCauseAssignedEvent {
  hypothesisId: string;
  role: 'primary' | 'contributing';
  findingId: string;
}

export interface IdeaProjectionAttachedEvent {
  ideaId: string;
  projected: { mean: number; sigma: number; cpk: number; yield?: number };
}

export interface IdeaConvertedToActionsEvent {
  ideaIds: string[];
  findingId: string;
  actions: ActionItem[];
}

export interface NavigateToEvent {
  target: NavigationTarget;
  targetId?: string;
  chartType?: string;
}

export interface PanelVisibilityChangedEvent {
  panel: PanelName;
  visible: boolean;
}

export interface HighlightFindingEvent {
  findingId: string;
  duration?: number;
}

export interface HighlightChartPointEvent {
  /** Row index in the dataset (matches panelsStore.highlightedChartPoint) */
  pointIndex: number;
  duration?: number;
}

// ── Event Map ─────────────────────────────────────────────────────────

export interface DomainEventMap {
  // Domain events
  'finding:created': FindingCreatedEvent;
  'finding:status-changed': FindingStatusChangedEvent;
  'finding:resolved': FindingResolvedEvent;
  'hypothesis:validated': HypothesisValidatedEvent;
  'hypothesis:cause-assigned': HypothesisCauseAssignedEvent;
  'idea:projection-attached': IdeaProjectionAttachedEvent;
  'idea:converted-to-actions': IdeaConvertedToActionsEvent;
  // UI choreography events
  'navigate:to': NavigateToEvent;
  'panel:visibility-changed': PanelVisibilityChangedEvent;
  'highlight:finding': HighlightFindingEvent;
  'highlight:chart-point': HighlightChartPointEvent;
}

// ── Factory ───────────────────────────────────────────────────────────

export type DomainEventBus = ReturnType<typeof createEventBus>;

// mitt's generic constraint requires `Record<EventType, unknown>`.
// We satisfy this by using a type-level workaround: call mitt() untyped
// and cast the result to a properly-typed Emitter.
type DomainEmitter = Emitter<Record<string, unknown>> & {
  on<K extends keyof DomainEventMap>(type: K, handler: (event: DomainEventMap[K]) => void): void;
  off<K extends keyof DomainEventMap>(type: K, handler?: (event: DomainEventMap[K]) => void): void;
  emit<K extends keyof DomainEventMap>(type: K, event: DomainEventMap[K]): void;
};

export function createEventBus(): DomainEmitter {
  return mitt() as DomainEmitter;
}
