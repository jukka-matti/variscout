import { assertNever, type ResponsePathAction } from '@variscout/core';

/**
 * Single URL source for ProcessHub state-item actions.
 * Exhaustive switch on action.kind. Returns null for 'unsupported' actions.
 */
export function actionToHref(action: ResponsePathAction): string | null {
  switch (action.kind) {
    case 'unsupported':
      return null;
    case 'open-investigation':
      return `/editor/${action.investigationId}?intent=${action.intent}`;
    case 'open-sustainment': {
      return `/editor/${action.investigationId}/sustainment`;
    }
    default:
      return assertNever(action);
  }
}
