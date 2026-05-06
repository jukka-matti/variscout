import type { HubAction } from '../actions/HubAction';
import type { ProcessHub, OutcomeSpec, ProcessHubInvestigation } from '../processHub';
import type { EvidenceSource, EvidenceSnapshot, EvidenceSourceCursor } from '../evidenceSources';
import type { Finding, Question, CausalLink, SuspectedCause } from '../findings/types';
import type { ProcessMap } from '../frame/types';

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

export interface InvestigationReadAPI {
  get(id: ProcessHubInvestigation['id']): Promise<ProcessHubInvestigation | undefined>;
  listByHub(hubId: ProcessHub['id']): Promise<ProcessHubInvestigation[]>;
}

export interface FindingReadAPI {
  get(id: Finding['id']): Promise<Finding | undefined>;
  listByInvestigation(investigationId: ProcessHubInvestigation['id']): Promise<Finding[]>;
}

export interface QuestionReadAPI {
  get(id: Question['id']): Promise<Question | undefined>;
  listByInvestigation(investigationId: ProcessHubInvestigation['id']): Promise<Question[]>;
}

export interface CausalLinkReadAPI {
  get(id: CausalLink['id']): Promise<CausalLink | undefined>;
  listByInvestigation(investigationId: ProcessHubInvestigation['id']): Promise<CausalLink[]>;
}

export interface SuspectedCauseReadAPI {
  get(id: SuspectedCause['id']): Promise<SuspectedCause | undefined>;
  listByInvestigation(investigationId: ProcessHubInvestigation['id']): Promise<SuspectedCause[]>;
}

export interface CanvasStateReadAPI {
  getByHub(hubId: ProcessHub['id']): Promise<ProcessMap | undefined>;
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
  investigations: InvestigationReadAPI;
  findings: FindingReadAPI;
  questions: QuestionReadAPI;
  causalLinks: CausalLinkReadAPI;
  suspectedCauses: SuspectedCauseReadAPI;
  canvasState: CanvasStateReadAPI;
}
