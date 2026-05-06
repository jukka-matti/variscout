import type { CausalLink } from '../findings/types';
import type { ProcessHubInvestigation } from '../processHub';

export type CausalLinkAction =
  | {
      kind: 'CAUSAL_LINK_ADD';
      investigationId: ProcessHubInvestigation['id'];
      link: CausalLink;
    }
  | { kind: 'CAUSAL_LINK_UPDATE'; linkId: CausalLink['id']; patch: Partial<CausalLink> }
  | { kind: 'CAUSAL_LINK_ARCHIVE'; linkId: CausalLink['id'] };
