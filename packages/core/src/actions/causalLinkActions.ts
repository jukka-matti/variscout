import type { CausalLink } from '../findings/types';
import type { ProcessHubAnalyze } from '../processHub';

export type CausalLinkAction =
  | {
      kind: 'CAUSAL_LINK_ADD';
      investigationId: ProcessHubAnalyze['id'];
      link: CausalLink;
    }
  | { kind: 'CAUSAL_LINK_UPDATE'; linkId: CausalLink['id']; patch: Partial<CausalLink> }
  | { kind: 'CAUSAL_LINK_ARCHIVE'; linkId: CausalLink['id'] };
