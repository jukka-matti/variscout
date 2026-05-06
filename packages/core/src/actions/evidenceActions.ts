import type { EvidenceSnapshot, RowProvenanceTag } from '../evidenceSources';
import type { ProcessHub } from '../processHub';

export type EvidenceAction =
  | {
      kind: 'EVIDENCE_ADD_SNAPSHOT';
      hubId: ProcessHub['id'];
      snapshot: EvidenceSnapshot;
      provenance: RowProvenanceTag[];
      replacedSnapshotId?: EvidenceSnapshot['id'];
    }
  | { kind: 'EVIDENCE_ARCHIVE_SNAPSHOT'; snapshotId: EvidenceSnapshot['id'] };
