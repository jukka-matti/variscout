import type { EvidenceSnapshot } from '../evidenceSources';
import type { ProcessHub } from '../processHub';
import type { ControlRecord, ControlReview } from '../control';

export type ControlAction =
  | {
      kind: 'SUSTAINMENT_RECORD_CREATE';
      hubId: ProcessHub['id'];
      record: ControlRecord;
    }
  | {
      kind: 'SUSTAINMENT_RECORD_UPDATE';
      recordId: ControlRecord['id'];
      patch: Partial<
        Omit<ControlRecord, 'id' | 'createdAt' | 'hubId' | 'projectId' | 'updatedAt' | 'deletedAt'>
      >;
    }
  | {
      kind: 'SUSTAINMENT_RECORD_ARCHIVE';
      recordId: ControlRecord['id'];
    }
  | {
      kind: 'SUSTAINMENT_CONFIRM';
      recordId: ControlRecord['id'];
    }
  | {
      kind: 'SUSTAINMENT_MARK_DRIFTED';
      recordId: ControlRecord['id'];
    }
  | {
      kind: 'SUSTAINMENT_TICK_EVALUATED';
      record: ControlRecord;
      review: ControlReview;
      snapshotId?: EvidenceSnapshot['id'];
    };
