import type {
  CurrentUnderstanding,
  CurrentUnderstandingMechanism,
  ProblemCondition,
  ProblemConditionStatus,
  TargetMetric,
} from './ai/types';

export interface BuildProblemConditionInput {
  targetMetric?: TargetMetric;
  currentValue?: number;
  targetValue?: number;
  targetDirection?: 'minimize' | 'maximize' | 'target';
}

export interface BuildCurrentUnderstandingInput {
  issueStatement?: string | null;
  problemCondition?: ProblemCondition;
  scopedPattern?: string | null;
  liveStatement?: string | null;
  approvedProblemStatement?: string | null;
  activeSuspectedMechanisms?: Array<{
    id?: string;
    name?: string | null;
    factor?: string | null;
    synthesis?: string | null;
    evidenceLabel?: string | null;
  }>;
}

const METRIC_LABELS: Record<TargetMetric, string> = {
  mean: 'Mean',
  sigma: 'Sigma',
  cpk: 'Cpk',
  yield: 'Yield',
  passRate: 'Pass rate',
};

const DEFAULT_DIRECTIONS: Record<TargetMetric, 'minimize' | 'maximize' | 'target'> = {
  mean: 'target',
  sigma: 'minimize',
  cpk: 'maximize',
  yield: 'maximize',
  passRate: 'maximize',
};

function cleanText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function finiteNumber(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
    useGrouping: false,
  }).format(value);
}

function compareToTarget(
  currentValue: number | undefined,
  targetValue: number | undefined,
  targetDirection: 'minimize' | 'maximize' | 'target'
): ProblemConditionStatus | undefined {
  if (currentValue === undefined || targetValue === undefined) return undefined;

  if (targetDirection === 'minimize') {
    return currentValue <= targetValue ? 'at-or-better-than-target' : 'above-target';
  }
  if (targetDirection === 'maximize') {
    return currentValue >= targetValue ? 'at-or-better-than-target' : 'below-target';
  }
  return currentValue === targetValue ? 'at-or-better-than-target' : 'off-target';
}

function summarizeProblemCondition(input: {
  metric: TargetMetric;
  currentValue?: number;
  targetValue?: number;
}): string {
  const label = METRIC_LABELS[input.metric];
  if (input.currentValue !== undefined && input.targetValue !== undefined) {
    return `${label} is ${formatNumber(input.currentValue)} against target ${formatNumber(
      input.targetValue
    )}.`;
  }
  if (input.currentValue !== undefined) {
    return `${label} is currently ${formatNumber(input.currentValue)}.`;
  }
  if (input.targetValue !== undefined) {
    return `${label} target is ${formatNumber(input.targetValue)}.`;
  }
  return `${label} target condition is defined.`;
}

function normalizeMechanisms(
  mechanisms: BuildCurrentUnderstandingInput['activeSuspectedMechanisms']
): CurrentUnderstandingMechanism[] | undefined {
  const normalized =
    mechanisms
      ?.map(mechanism => {
        const name = cleanText(mechanism.name) ?? cleanText(mechanism.factor);
        if (!name) return null;

        const result: CurrentUnderstandingMechanism = { name };
        if (cleanText(mechanism.id)) result.id = cleanText(mechanism.id);
        if (cleanText(mechanism.synthesis)) result.synthesis = cleanText(mechanism.synthesis);
        if (cleanText(mechanism.evidenceLabel)) {
          result.evidenceLabel = cleanText(mechanism.evidenceLabel);
        }
        return result;
      })
      .filter((mechanism): mechanism is CurrentUnderstandingMechanism => mechanism !== null) ?? [];

  return normalized.length > 0 ? normalized : undefined;
}

function formatMechanism(mechanism: CurrentUnderstandingMechanism): string {
  const evidence = mechanism.evidenceLabel ? ` (${mechanism.evidenceLabel})` : '';
  const synthesis = mechanism.synthesis ? ` - ${mechanism.synthesis}` : '';
  return `${mechanism.name}${evidence}${synthesis}`;
}

/**
 * Build a deterministic, timestamp-free problem condition from target metadata.
 */
export function buildProblemCondition({
  targetMetric,
  currentValue: rawCurrentValue,
  targetValue: rawTargetValue,
  targetDirection,
}: BuildProblemConditionInput): ProblemCondition | undefined {
  if (!targetMetric) return undefined;

  const currentValue = finiteNumber(rawCurrentValue);
  const targetValue = finiteNumber(rawTargetValue);
  const direction = targetDirection ?? DEFAULT_DIRECTIONS[targetMetric];
  const status = compareToTarget(currentValue, targetValue, direction);
  const condition: ProblemCondition = {
    metric: targetMetric,
    summary: summarizeProblemCondition({ metric: targetMetric, currentValue, targetValue }),
  };

  if (currentValue !== undefined) condition.currentValue = currentValue;
  if (targetValue !== undefined) condition.targetValue = targetValue;
  condition.targetDirection = direction;
  if (status) condition.status = status;

  return condition;
}

/**
 * Build a deterministic current-understanding summary from the investigation vocabulary.
 */
export function buildCurrentUnderstanding({
  issueStatement,
  problemCondition,
  scopedPattern,
  liveStatement,
  approvedProblemStatement,
  activeSuspectedMechanisms,
}: BuildCurrentUnderstandingInput): CurrentUnderstanding | undefined {
  const issueConcern = cleanText(issueStatement);
  const scopedPatternText = cleanText(scopedPattern);
  const liveProblemStatementDraft = cleanText(liveStatement);
  const approvedProblemStatementText = cleanText(approvedProblemStatement);
  const mechanisms = normalizeMechanisms(activeSuspectedMechanisms);

  const lines: string[] = [];
  if (issueConcern) lines.push(`Issue / concern: ${issueConcern}`);
  if (problemCondition?.summary) lines.push(`Problem condition: ${problemCondition.summary}`);
  if (scopedPatternText) lines.push(`Scoped pattern: ${scopedPatternText}`);
  if (liveProblemStatementDraft) {
    lines.push(`Live problem statement draft: ${liveProblemStatementDraft}`);
  }
  if (approvedProblemStatementText) {
    lines.push(`Approved problem statement: ${approvedProblemStatementText}`);
  }
  if (mechanisms) {
    lines.push(`Active suspected mechanisms: ${mechanisms.map(formatMechanism).join('; ')}`);
  }

  if (lines.length === 0) return undefined;

  const understanding: CurrentUnderstanding = { summary: lines.join('\n') };
  if (issueConcern) understanding.issueConcern = issueConcern;
  if (problemCondition) understanding.problemCondition = problemCondition;
  if (scopedPatternText) understanding.scopedPattern = scopedPatternText;
  if (liveProblemStatementDraft)
    understanding.liveProblemStatementDraft = liveProblemStatementDraft;
  if (approvedProblemStatementText) {
    understanding.approvedProblemStatement = approvedProblemStatementText;
  }
  if (mechanisms) understanding.activeSuspectedMechanisms = mechanisms;

  return understanding;
}
