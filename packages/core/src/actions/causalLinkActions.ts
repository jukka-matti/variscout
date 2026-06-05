import type { CausalLink } from '../findings/types';

export type CausalLinkAction =
  | {
      kind: 'CAUSAL_LINK_ADD';
      link: CausalLink;
    }
  | { kind: 'CAUSAL_LINK_UPDATE'; linkId: CausalLink['id']; patch: Partial<CausalLink> }
  | { kind: 'CAUSAL_LINK_ARCHIVE'; linkId: CausalLink['id'] };
