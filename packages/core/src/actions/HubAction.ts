import type { OutcomeAction } from './outcomeActions';
import type { EvidenceAction } from './evidenceActions';
import type { EvidenceSourceAction } from './evidenceSourceActions';
import type { AnalyzeAction } from './analyzeActions';
import type { FindingAction } from './findingActions';
import type { QuestionAction } from './questionActions';
import type { CausalLinkAction } from './causalLinkActions';
import type { HypothesisAction } from './hypothesisActions';
import type { HubMetaAction } from './hubMetaActions';
import type { CanvasAction } from './canvasActions';
import type { ImprovementProjectAction } from './improvementProjectActions';
import type { ActionItemAction } from './actionItemActions';
import type { SustainmentAction } from './sustainmentActions';
import type { ControlHandoffAction } from './controlHandoffActions';
import type { MeasurementPlanAction } from '../measurementPlan/actions';

/**
 * Top-level discriminated union for all hub write operations.
 * Discriminator: `kind` (SCREAMING_SNAKE_CASE), per plan R2.
 * Every persistence call goes through `HubRepository.dispatch(action: HubAction)`.
 */
export type HubAction =
  | OutcomeAction
  | EvidenceAction
  | EvidenceSourceAction
  | AnalyzeAction
  | FindingAction
  | QuestionAction
  | CausalLinkAction
  | HypothesisAction
  | HubMetaAction
  | CanvasAction
  | ImprovementProjectAction
  | ActionItemAction
  | SustainmentAction
  | ControlHandoffAction
  | MeasurementPlanAction;
