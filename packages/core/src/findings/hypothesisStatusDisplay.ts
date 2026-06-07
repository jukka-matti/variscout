import type { HypothesisStatus } from './types';

export type HypothesisDisplayStatus = 'suspected' | 'verified' | 'ruled-out';

export interface HypothesisStatusDisplay {
  status: HypothesisDisplayStatus;
  label: 'Suspected' | 'Verified' | 'Ruled out';
}

const DISPLAY_STATUS_BY_STORED_STATUS: Record<HypothesisStatus, HypothesisStatusDisplay> = {
  proposed: { status: 'suspected', label: 'Suspected' },
  evidenced: { status: 'suspected', label: 'Suspected' },
  'needs-disconfirmation': { status: 'suspected', label: 'Suspected' },
  'evidence-survived-test': { status: 'verified', label: 'Verified' },
  refuted: { status: 'ruled-out', label: 'Ruled out' },
};

export function displayHypothesisStatus(status: HypothesisStatus): HypothesisStatusDisplay {
  return DISPLAY_STATUS_BY_STORED_STATUS[status];
}

export function getHypothesisDisplayStatus(status: HypothesisStatus): HypothesisDisplayStatus {
  return displayHypothesisStatus(status).status;
}
