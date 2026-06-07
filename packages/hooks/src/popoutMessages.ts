/**
 * Typed popout message contracts for cross-window sync.
 *
 * Defines typed messages for each popout window (Findings, Improvement,
 * Evidence Map) along with canonical hydration keys. Consumers use these
 * types with the generic usePopoutChannel<T> hook for type-safe messaging.
 */

import type { PopoutMessage } from './usePopoutChannel';
import type {
  Finding,
  FindingStatus,
  FindingTag,
  ProcessContext,
  AnalyzePhase,
  IdeaTimeframe,
  IdeaDirection,
  IdeaCostCategory,
  ImprovementIdea,
} from '@variscout/core';
import type { FindingEvidenceType } from '@variscout/core/findings';
import type { DrillStep } from './useDrillPath';
import type {
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
  CausalEdgeData,
  ConvergencePointData,
} from '@variscout/core/evidenceMap';

// ============================================================================
// Hydration keys (canonical, replace scattered constants)
// ============================================================================

export const HYDRATION_KEYS = {
  findings: 'variscout_findings_hydration',
  improvement: 'variscout_improvement_hydration',
  evidenceMap: 'variscout_evidence_map_hydration',
} as const;

// ============================================================================
// Findings messages
// ============================================================================

export interface FindingsSyncData {
  findings: Finding[];
  columnAliases?: Record<string, string>;
  drillPath: DrillStep[];
  processContext?: ProcessContext;
  currentValue?: number;
  projectedValue?: number;
  analyzePhase?: AnalyzePhase;
  suggestedQuestions?: string[];
  factorRoles?: Record<string, string>;
  aiAvailable?: boolean;
  issueStatement?: string;
  suggestedIssueStatement?: string;
  problemStatement?: string;
  isProblemStatementComplete?: boolean;
}

export interface FindingsSyncMessage extends PopoutMessage {
  type: 'findings-sync';
  payload: FindingsSyncData;
}

export interface FindingsActionMessage extends PopoutMessage {
  type: 'findings-action';
  payload: FindingsAction;
}

export interface FindingsAction {
  action:
    | 'edit'
    | 'delete'
    | 'set-status'
    | 'set-tag'
    | 'set-evidence-type'
    | 'add-comment'
    | 'edit-comment'
    | 'delete-comment';
  id: string;
  text?: string;
  status?: FindingStatus;
  tag?: FindingTag | null;
  evidenceType?: FindingEvidenceType;
  commentId?: string;
}

// ============================================================================
// Improvement messages
// ============================================================================

export interface ImprovementSyncData {
  synthesis?: string;
  hypotheses: Array<{
    id: string;
    name: string;
    status: string;
    factor?: string;
    ideas: ImprovementIdea[];
    linkedFindingName?: string;
  }>;
  linkedFindings?: Array<{ id: string; text: string }>;
  selectedIdeaIds: string[];
  convertedIdeaIds: string[];
  targetCpk?: number;
}

export interface ImprovementSyncMessage extends PopoutMessage {
  type: 'improvement-sync';
  payload: ImprovementSyncData;
}

export interface ImprovementActionMessage extends PopoutMessage {
  type: 'improvement-action';
  payload: ImprovementAction;
}

export type ImprovementAction =
  | { action: 'synthesis-change'; text: string }
  | { action: 'toggle-select'; hypothesisId: string; ideaId: string; selected: boolean }
  | {
      action: 'update-timeframe';
      hypothesisId: string;
      ideaId: string;
      timeframe: IdeaTimeframe | undefined;
    }
  | {
      action: 'update-direction';
      hypothesisId: string;
      ideaId: string;
      direction: IdeaDirection | undefined;
    }
  | {
      action: 'update-cost';
      hypothesisId: string;
      ideaId: string;
      cost: { category: IdeaCostCategory } | undefined;
    }
  | { action: 'remove-idea'; hypothesisId: string; ideaId: string }
  | { action: 'add-idea'; hypothesisId: string; text: string }
  | { action: 'convert-to-actions' };

// ============================================================================
// Evidence Map messages
// ============================================================================

export interface EvidenceMapSyncData {
  outcomeNode: OutcomeNodeData | null;
  factorNodes: FactorNodeData[];
  relationshipEdges: RelationshipEdgeData[];
  equation: EquationData | null;
  causalEdges?: CausalEdgeData[];
  convergencePoints?: ConvergencePointData[];
}

export interface EvidenceMapSyncMessage extends PopoutMessage {
  type: 'evidence-map-update';
  payload: EvidenceMapSyncData;
}

export interface FactorSelectedMessage extends PopoutMessage {
  type: 'factor-selected';
  payload: { factor: string };
}

// ============================================================================
// Lifecycle messages (auto-sent by usePopoutChannel)
// ============================================================================

export interface WindowLifecycleMessage extends PopoutMessage {
  type: 'window-opened' | 'window-closing' | 'heartbeat';
}

// ============================================================================
// Union type for all messages
// ============================================================================

export type PopoutMessageType =
  | FindingsSyncMessage
  | FindingsActionMessage
  | ImprovementSyncMessage
  | ImprovementActionMessage
  | EvidenceMapSyncMessage
  | FactorSelectedMessage
  | WindowLifecycleMessage;
