import { assertNever, type ResponsePathAction } from '@variscout/core';

/**
 * Single URL source for ProcessHub state-item actions.
 * Exhaustive switch on action.kind. Returns null for 'unsupported' actions.
 */
export function actionToHref(action: ResponsePathAction): string | null {
  switch (action.kind) {
    case 'unsupported':
      return null;
    case 'open-analyze':
      return `/editor/${action.analyzeId}?intent=${action.intent}`;
    case 'open-control': {
      return `/editor/${action.analyzeId}/sustainment`;
    }
    default:
      return assertNever(action);
  }
}
