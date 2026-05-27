import type { ProcessHub, ProcessParticipantRef } from '../processHub';
import type { ControlHandoff } from '../control';
import type { ImprovementProjectSignoff } from '../improvementProject';

export type ControlHandoffAction =
  | {
      kind: 'CONTROL_HANDOFF_CREATE';
      hubId: ProcessHub['id'];
      handoff: ControlHandoff;
    }
  | {
      kind: 'CONTROL_HANDOFF_UPDATE';
      handoffId: ControlHandoff['id'];
      patch: Partial<
        Omit<
          ControlHandoff,
          'id' | 'createdAt' | 'hubId' | 'investigationId' | 'updatedAt' | 'deletedAt' | 'signoff'
        >
      >;
    }
  | {
      kind: 'CONTROL_HANDOFF_ARCHIVE';
      handoffId: ControlHandoff['id'];
    }
  | {
      kind: 'CONTROL_HANDOFF_ACKNOWLEDGE';
      handoffId: ControlHandoff['id'];
      acknowledgedBy: ProcessParticipantRef;
      acknowledgedAt?: number;
      notes?: string;
    }
  | {
      kind: 'CONTROL_HANDOFF_MARK_OPERATIONAL';
      handoffId: ControlHandoff['id'];
      operationalAt?: number;
    }
  | {
      kind: 'CONTROL_HANDOFF_SIGNOFF';
      handoffId: ControlHandoff['id'];
      signoff: ImprovementProjectSignoff;
    };
