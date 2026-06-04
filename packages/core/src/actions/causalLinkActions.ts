import type { CausalLink } from '../findings/types';
import type { ImprovementProject } from '../improvementProject';

export type CausalLinkAction =
  | {
      kind: 'CAUSAL_LINK_ADD';
      investigationId: ImprovementProject['id'];
      link: CausalLink;
    }
  | { kind: 'CAUSAL_LINK_UPDATE'; linkId: CausalLink['id']; patch: Partial<CausalLink> }
  | { kind: 'CAUSAL_LINK_ARCHIVE'; linkId: CausalLink['id'] };
