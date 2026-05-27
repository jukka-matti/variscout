import type { HubAction } from '../actions/HubAction';
import type { ProcessHub, OutcomeSpec, ProcessHubAnalyze } from '../processHub';
import type { EvidenceSource, EvidenceSnapshot, EvidenceSourceCursor } from '../evidenceSources';
import type { Finding, Question, CausalLink, Hypothesis, ActionItem } from '../findings/types';
import type { ProcessMap } from '../frame/types';
import type { ControlHandoff, ControlRecord, ControlReview } from '../control';
import type { MeasurementPlan } from '../measurementPlan/types';

export interface HubReadAPI {
  get(id: ProcessHub['id']): Promise<ProcessHub | undefined>;
  list(): Promise<ProcessHub[]>;
}

export interface OutcomeReadAPI {
  get(id: OutcomeSpec['id']): Promise<OutcomeSpec | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<OutcomeSpec[]>;
}

export interface EvidenceSnapshotReadAPI {
  get(id: EvidenceSnapshot['id']): Promise<EvidenceSnapshot | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<EvidenceSnapshot[]>;
}

export interface EvidenceSourceReadAPI {
  get(id: EvidenceSource['id']): Promise<EvidenceSource | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<EvidenceSource[]>;
  getCursor(
    hubId: ProcessHub['id'],
    sourceId: EvidenceSource['id']
  ): Promise<EvidenceSourceCursor | undefined>;
}

export interface AnalyzeReadAPI {
  get(id: ProcessHubAnalyze['id']): Promise<ProcessHubAnalyze | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<ProcessHubAnalyze[]>;
}

export interface FindingReadAPI {
  get(id: Finding['id']): Promise<Finding | undefined>;
  listByInvestigation(investigationId: ProcessHubAnalyze['id']): Promise<Finding[]>;
}

export interface QuestionReadAPI {
  get(id: Question['id']): Promise<Question | undefined>;
  listByInvestigation(investigationId: ProcessHubAnalyze['id']): Promise<Question[]>;
}

export interface CausalLinkReadAPI {
  get(id: CausalLink['id']): Promise<CausalLink | undefined>;
  listByInvestigation(investigationId: ProcessHubAnalyze['id']): Promise<CausalLink[]>;
}

export interface HypothesisReadAPI {
  get(id: Hypothesis['id']): Promise<Hypothesis | undefined>;
  listByInvestigation(investigationId: ProcessHubAnalyze['id']): Promise<Hypothesis[]>;
}

export interface CanvasStateReadAPI {
  getByHub(hubId: ProcessHub['id']): Promise<ProcessMap | undefined>;
}

export interface ActionItemReadAPI {
  get(id: ActionItem['id']): Promise<ActionItem | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<ActionItem[]>;
  listByStep(hubId: ProcessHub['id'], stepId: string): Promise<ActionItem[]>;
}

export interface ControlRecordReadAPI {
  get(id: ControlRecord['id']): Promise<ControlRecord | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<ControlRecord[]>;
}

export interface ControlReviewReadAPI {
  get(id: ControlReview['id']): Promise<ControlReview | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<ControlReview[]>;
  listByRecord(hubId: ProcessHub['id'], recordId: ControlRecord['id']): Promise<ControlReview[]>;
}

export interface ControlHandoffReadAPI {
  get(id: ControlHandoff['id']): Promise<ControlHandoff | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<ControlHandoff[]>;
}

export interface MeasurementPlanReadAPI {
  get(id: MeasurementPlan['id']): Promise<MeasurementPlan | undefined>;
  listByHypothesis(hypothesisId: Hypothesis['id']): Promise<MeasurementPlan[]>;
}

/**
 * Single-interface repository for all hub domain writes + grouped reads.
 * Write path: one `dispatch(action)` entry point — all mutations flow through it.
 * Read path: grouped sub-APIs organized by entity kind (extension point; F3 fills these in).
 * Per locked decision D-P1.
 */
export interface HubRepository {
  // Single write path
  dispatch(action: HubAction): Promise<void>;

  // Grouped read APIs
  hubs: HubReadAPI;
  outcomes: OutcomeReadAPI;
  evidenceSnapshots: EvidenceSnapshotReadAPI;
  evidenceSources: EvidenceSourceReadAPI;
  investigations: AnalyzeReadAPI;
  findings: FindingReadAPI;
  questions: QuestionReadAPI;
  causalLinks: CausalLinkReadAPI;
  hypotheses: HypothesisReadAPI;
  canvasState: CanvasStateReadAPI;
  actionItems: ActionItemReadAPI;
  controlRecords: ControlRecordReadAPI;
  controlReviews: ControlReviewReadAPI;
  controlHandoffs: ControlHandoffReadAPI;
  measurementPlans: MeasurementPlanReadAPI;
}
