import type { EvidenceSource, EvidenceSourceCursor } from '../evidenceSources';
import type { ProcessHub } from '../processHub';

export type EvidenceSourceAction =
  | { kind: 'EVIDENCE_SOURCE_ADD'; hubId: ProcessHub['id']; source: EvidenceSource }
  | {
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR';
      sourceId: EvidenceSource['id'];
      cursor: EvidenceSourceCursor;
    }
  | { kind: 'EVIDENCE_SOURCE_REMOVE'; sourceId: EvidenceSource['id'] };
