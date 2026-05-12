import type { EvidenceSnapshot } from '../evidenceSources';
import type { ProcessHub } from '../processHub';
import type { SustainmentRecord, SustainmentReview } from '../sustainment';

export type SustainmentAction =
  | {
      kind: 'SUSTAINMENT_RECORD_CREATE';
      hubId: ProcessHub['id'];
      record: SustainmentRecord;
    }
  | {
      kind: 'SUSTAINMENT_RECORD_UPDATE';
      recordId: SustainmentRecord['id'];
      patch: Partial<
        Omit<
          SustainmentRecord,
          'id' | 'createdAt' | 'hubId' | 'investigationId' | 'updatedAt' | 'deletedAt'
        >
      >;
    }
  | {
      kind: 'SUSTAINMENT_RECORD_ARCHIVE';
      recordId: SustainmentRecord['id'];
    }
  | {
      kind: 'SUSTAINMENT_CONFIRM';
      recordId: SustainmentRecord['id'];
    }
  | {
      kind: 'SUSTAINMENT_MARK_DRIFTED';
      recordId: SustainmentRecord['id'];
    }
  | {
      kind: 'SUSTAINMENT_TICK_EVALUATED';
      record: SustainmentRecord;
      review: SustainmentReview;
      snapshotId?: EvidenceSnapshot['id'];
    };
