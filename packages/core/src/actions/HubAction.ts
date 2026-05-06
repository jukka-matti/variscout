import type { OutcomeAction } from './outcomeActions';
import type { EvidenceAction } from './evidenceActions';
import type { EvidenceSourceAction } from './evidenceSourceActions';
import type { InvestigationAction } from './investigationActions';
import type { FindingAction } from './findingActions';
import type { QuestionAction } from './questionActions';
import type { CausalLinkAction } from './causalLinkActions';
import type { SuspectedCauseAction } from './suspectedCauseActions';
import type { HubMetaAction } from './hubMetaActions';
import type { CanvasAction } from './canvasActions';

/**
 * Top-level discriminated union for all hub write operations.
 * Discriminator: `kind` (SCREAMING_SNAKE_CASE), per plan R2.
 * Every persistence call goes through `HubRepository.dispatch(action: HubAction)`.
 */
export type HubAction =
  | OutcomeAction
  | EvidenceAction
  | EvidenceSourceAction
  | InvestigationAction
  | FindingAction
  | QuestionAction
  | CausalLinkAction
  | SuspectedCauseAction
  | HubMetaAction
  | CanvasAction;
