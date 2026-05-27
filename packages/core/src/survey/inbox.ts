import { surveyHandoffRules } from './handoff';
import { surveySustainmentRules } from './control';
import type { SurveyContext, SurveyHint } from './types';

export interface SurveyInboxPrompt {
  id: string;
  message: string;
  severity: SurveyHint['severity'];
  action?: SurveyHint['action'];
  sourceHint: SurveyHint;
}

const SEVERITY_RANK: Record<SurveyHint['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function toInboxPrompt(hint: SurveyHint): SurveyInboxPrompt {
  const sourceHint: SurveyHint = { ...hint, surface: 'inbox' };
  return {
    id: `inbox:${sourceHint.kind}:${sourceHint.targetEntityId}`,
    message: sourceHint.message,
    severity: sourceHint.severity,
    action: sourceHint.action,
    sourceHint,
  };
}

export function surveyInboxRules(ctx: SurveyContext): SurveyInboxPrompt[] {
  return [...surveySustainmentRules(ctx), ...surveyHandoffRules(ctx)]
    .map(toInboxPrompt)
    .sort((a, b) => {
      const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (severity !== 0) return severity;

      const message = a.message.localeCompare(b.message);
      if (message !== 0) return message;

      return a.id.localeCompare(b.id);
    });
}
