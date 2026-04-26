import { detectDefectFormat } from '../defect';
import { detectGaps, inferMode } from '../frame';
import type { ColumnKind } from '../frame';
import { projectMechanismBranches } from '../findings';
import { detectColumns, detectWideFormat } from '../parser';
import type { DetectedColumns } from '../parser';
import type { DataRow } from '../types';
import { detectYamazumiFormat } from '../yamazumi';
import type { DefectDetection } from '../defect';
import type { YamazumiDetection } from '../yamazumi';
import type {
  SurveyDiagnostics,
  SurveyEvaluation,
  SurveyEvaluationInput,
  SurveyPossibilityItem,
  SurveyPowerItem,
  SurveyRecommendation,
  SurveyStatus,
  SurveyTrustItem,
} from './types';

const EMPTY_DETECTED_COLUMNS: DetectedColumns = {
  outcome: null,
  factors: [],
  timeColumn: null,
  confidence: 'low',
  columnAnalysis: [],
};

const EMPTY_WIDE_FORMAT = {
  isWideFormat: false,
  channels: [],
  metadataColumns: [],
  confidence: 'low' as const,
  reason: 'No data provided',
};

const EMPTY_YAMAZUMI: YamazumiDetection = {
  isYamazumiFormat: false,
  confidence: 'low',
  suggestedMapping: {},
  reason: 'No data or columns to analyze',
};

const EMPTY_DEFECT: DefectDetection = {
  isDefectFormat: false,
  confidence: 'low',
  dataShape: 'event-log',
  suggestedMapping: {},
};

function normalizeColumn(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function hasSpecLimit(specs: SurveyEvaluationInput['specs']): boolean {
  return Number.isFinite(specs?.lsl) || Number.isFinite(specs?.usl);
}

function buildColumnKinds(detected: DetectedColumns): Record<string, ColumnKind> {
  const kinds: Record<string, ColumnKind> = {};
  for (const column of detected.columnAnalysis) {
    kinds[column.name] = column.type;
  }
  return kinds;
}

function summarizeStatus(statuses: SurveyStatus[]): SurveyStatus {
  if (statuses.length === 0) return 'cannot-do-yet';
  if (statuses.every(status => status === 'cannot-do-yet')) return 'cannot-do-yet';
  if (statuses.includes('can-do-now')) {
    return statuses.some(status => status === 'can-do-with-caution' || status === 'ask-for-next')
      ? 'can-do-with-caution'
      : 'can-do-now';
  }
  if (statuses.includes('can-do-with-caution')) return 'can-do-with-caution';
  if (statuses.includes('ask-for-next')) return 'ask-for-next';
  return 'cannot-do-yet';
}

function recommendationStore() {
  const byId = new Map<string, SurveyRecommendation>();
  return {
    add(recommendation: SurveyRecommendation) {
      if (!byId.has(recommendation.id)) byId.set(recommendation.id, recommendation);
    },
    list() {
      return [...byId.values()].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
    },
  };
}

function makeDiagnostics(input: SurveyEvaluationInput): SurveyDiagnostics {
  const data = input.data ?? [];
  const hasData = data.length > 0;
  const detectedColumns = hasData ? detectColumns(data) : EMPTY_DETECTED_COLUMNS;
  const wideFormat = hasData ? detectWideFormat(data) : EMPTY_WIDE_FORMAT;
  const yamazumi = hasData
    ? detectYamazumiFormat(data, detectedColumns.columnAnalysis)
    : EMPTY_YAMAZUMI;
  const defect = hasData ? detectDefectFormat(data, detectedColumns.columnAnalysis) : EMPTY_DEFECT;
  const columns = hasData ? Object.keys(data[0] as DataRow) : [];
  const columnKinds = buildColumnKinds(detectedColumns);

  const declaredOutcome = normalizeColumn(input.outcomeColumn);
  const outcomeColumn =
    declaredOutcome ??
    normalizeColumn(input.processMap?.ctsColumn) ??
    normalizeColumn(input.processContext?.processMap?.ctsColumn) ??
    normalizeColumn(detectedColumns.outcome);
  const factorColumns =
    input.factorColumns && input.factorColumns.length > 0
      ? input.factorColumns.filter(Boolean)
      : detectedColumns.factors;
  const timeColumn =
    normalizeColumn(input.timeColumn) ?? normalizeColumn(detectedColumns.timeColumn);
  const processMap = input.processMap ?? input.processContext?.processMap;
  const yamazumiMapping =
    input.yamazumiMapping ?? (yamazumi.isYamazumiFormat ? yamazumi.suggestedMapping : undefined);
  const defectMapping =
    input.defectMapping ?? (defect.isDefectFormat ? defect.suggestedMapping : undefined);

  const inferredMode = inferMode({
    processMap,
    columns,
    columnKinds,
    outcomeColumn,
    specs: input.specs,
    yamazumiMapping: yamazumiMapping ?? undefined,
    defectMapping: defectMapping ?? undefined,
    performanceChannels: wideFormat.isWideFormat
      ? wideFormat.channels.map(channel => channel.id)
      : [],
  });

  const gaps = hasData
    ? detectGaps({
        processMap,
        columns,
        columnKinds,
        outcomeColumn,
        timeColumn,
        specs: input.specs,
      })
    : [];

  return {
    rowCount: data.length,
    columns,
    selected: {
      outcomeColumn,
      factorColumns,
      timeColumn,
    },
    detectedColumns,
    wideFormat,
    yamazumi,
    defect,
    inferredMode,
    gaps,
  };
}

function buildPossibilityItems(
  input: SurveyEvaluationInput,
  diagnostics: SurveyDiagnostics
): SurveyPossibilityItem[] {
  const hasData = diagnostics.rowCount > 0;
  const declaredOutcome = Boolean(normalizeColumn(input.outcomeColumn));
  const declaredFactors = (input.factorColumns ?? []).filter(Boolean).length > 0;
  const outcomeColumn = diagnostics.selected.outcomeColumn;
  const factorColumns = diagnostics.selected.factorColumns;
  const hasSpecs = hasSpecLimit(input.specs);
  const processMap = input.processMap ?? input.processContext?.processMap;
  const subgroupAxes = processMap?.subgroupAxes ?? [];
  const hasSubgroupAxis = subgroupAxes.length > 0;
  const hasTime = Boolean(diagnostics.selected.timeColumn);
  const yamazumiMapping = input.yamazumiMapping ?? diagnostics.yamazumi.suggestedMapping;
  const hasYamazumiMapping = Boolean(
    yamazumiMapping?.activityTypeColumn &&
    yamazumiMapping?.cycleTimeColumn &&
    yamazumiMapping?.stepColumn
  );
  const defectMapping = input.defectMapping ?? diagnostics.defect.suggestedMapping;
  const hasDefectMapping = Boolean(
    (defectMapping?.defectTypeColumn && defectMapping?.countColumn) ||
    (defectMapping?.dataShape === 'pass-fail' && defectMapping?.resultColumn) ||
    diagnostics.defect.isDefectFormat
  );

  const standardStatus: SurveyStatus = !hasData
    ? 'cannot-do-yet'
    : declaredOutcome && declaredFactors
      ? 'can-do-now'
      : outcomeColumn && factorColumns.length > 0
        ? 'can-do-with-caution'
        : 'ask-for-next';

  const capabilityStatus: SurveyStatus = !hasData
    ? 'cannot-do-yet'
    : outcomeColumn && hasSpecs && hasSubgroupAxis && hasTime
      ? 'can-do-now'
      : outcomeColumn && hasSpecs
        ? 'can-do-with-caution'
        : 'ask-for-next';

  const performanceStatus: SurveyStatus = !hasData
    ? 'cannot-do-yet'
    : diagnostics.wideFormat.isWideFormat
      ? 'can-do-now'
      : diagnostics.wideFormat.channels.length > 0
        ? 'ask-for-next'
        : 'cannot-do-yet';

  const yamazumiStatus: SurveyStatus = !hasData
    ? 'cannot-do-yet'
    : hasYamazumiMapping
      ? 'can-do-now'
      : diagnostics.yamazumi.isYamazumiFormat
        ? 'can-do-with-caution'
        : 'ask-for-next';

  const defectStatus: SurveyStatus = !hasData
    ? 'cannot-do-yet'
    : hasDefectMapping
      ? 'can-do-now'
      : diagnostics.defect.confidence === 'low'
        ? 'ask-for-next'
        : 'can-do-with-caution';

  return [
    {
      id: 'standard-four-lenses',
      instrument: 'Standard / Four Lenses',
      status: standardStatus,
      requiredColumns: ['outcome', 'one or more factors'],
      nextUnlock:
        standardStatus === 'can-do-now'
          ? 'Use the mapped outcome and factors to compare variation across levels.'
          : 'Map one customer-felt outcome and at least one x/factor.',
      detail:
        standardStatus === 'can-do-now'
          ? 'Outcome and factors are mapped, so the standard investigation loop is available.'
          : 'The standard view needs a mapped Y and at least one mapped x.',
      mode: 'standard',
    },
    {
      id: 'capability',
      instrument: 'Capability',
      status: capabilityStatus,
      requiredColumns: ['outcome', 'LSL or USL', 'time or batch', 'rational subgroup'],
      nextUnlock:
        capabilityStatus === 'can-do-now'
          ? 'Capability can be read with declared specs, chronology, and subgroup context.'
          : capabilityStatus === 'can-do-with-caution'
            ? 'Add time/batch and rational subgroup context before treating Cpk stability as strong evidence.'
            : 'Set LSL or USL for the outcome.',
      detail:
        outcomeColumn && hasSpecs
          ? 'Specs and outcome are present; missing subgroup or time context weakens stability claims.'
          : 'Capability needs a mapped outcome and at least one specification limit.',
      mode: 'capability',
    },
    {
      id: 'performance',
      instrument: 'Performance channels',
      status: performanceStatus,
      requiredColumns: ['three or more comparable numeric channels'],
      nextUnlock: diagnostics.wideFormat.reason,
      detail:
        'Uses the existing wide-format detector to decide whether channel analysis is available.',
      mode: 'performance',
    },
    {
      id: 'yamazumi',
      instrument: 'Yamazumi',
      status: yamazumiStatus,
      requiredColumns: ['step', 'activity type', 'cycle time'],
      nextUnlock: hasYamazumiMapping
        ? 'Run lean activity composition and waste questions.'
        : 'Map step, activity type, and cycle time columns.',
      detail: diagnostics.yamazumi.reason,
      mode: 'yamazumi',
    },
    {
      id: 'defect',
      instrument: 'Defect analysis',
      status: defectStatus,
      requiredColumns: ['defect type with count or pass/fail result'],
      nextUnlock: hasDefectMapping
        ? 'Run defect Pareto and defect-specific questions.'
        : 'Map defect type plus count, or pass/fail result.',
      detail: diagnostics.defect.isDefectFormat
        ? `Detected ${diagnostics.defect.dataShape} defect data.`
        : 'No defect data structure is fully mapped yet.',
      mode: 'defect',
    },
  ];
}

function buildPowerItems(
  input: SurveyEvaluationInput,
  diagnostics: SurveyDiagnostics
): SurveyPowerItem[] {
  const hasData = diagnostics.rowCount > 0;
  const processMap = input.processMap ?? input.processContext?.processMap;
  const subgroupAxes = processMap?.subgroupAxes ?? [];
  const branches = input.branches ?? [];
  const questions = input.questions ?? [];
  const openBranchChecks = branches.reduce((count, branch) => {
    const explicitChecks = new Set(branch.checkQuestionIds ?? []);
    return (
      count +
      questions.filter(
        question =>
          (branch.questionIds.includes(question.id) || explicitChecks.has(question.id)) &&
          (question.status === 'open' || question.status === 'investigating')
      ).length
    );
  }, 0);

  return [
    {
      id: 'row-count',
      check: 'Dataset size',
      status: !hasData
        ? 'cannot-do-yet'
        : diagnostics.rowCount >= 30
          ? 'can-do-with-caution'
          : 'ask-for-next',
      currentPowerState: hasData
        ? `${diagnostics.rowCount} rows available; formal power math is not implemented in this slice.`
        : 'No rows loaded.',
      blindSpot: hasData
        ? 'Small or unbalanced effects may be invisible even when charts look quiet.'
        : 'We cannot distinguish "not seen" from "not detectable" without data.',
      nextLever:
        diagnostics.rowCount >= 30
          ? 'Use subgroup/time checks to make blind spots more explicit.'
          : 'Collect more rows across the suspected factor levels.',
    },
    {
      id: 'time-subgroup-coverage',
      check: 'Time and subgroup coverage',
      status:
        diagnostics.selected.timeColumn && subgroupAxes.length > 0
          ? 'can-do-with-caution'
          : hasData
            ? 'ask-for-next'
            : 'cannot-do-yet',
      currentPowerState:
        diagnostics.selected.timeColumn && subgroupAxes.length > 0
          ? 'Chronology and subgroup axes are available for stability checks.'
          : 'Time/batch or rational subgroup context is missing.',
      blindSpot:
        'A factor can look harmless overall while drifting by lot, shift, machine, or time window.',
      nextLever:
        'Add a time/batch axis and nominate a rational subgroup axis from the process map.',
    },
    {
      id: 'branch-counter-checks',
      check: 'Mechanism counter-check coverage',
      status:
        branches.length === 0
          ? 'ask-for-next'
          : openBranchChecks > 0
            ? 'can-do-with-caution'
            : 'ask-for-next',
      currentPowerState:
        branches.length === 0
          ? 'No Mechanism Branches exist yet.'
          : `${openBranchChecks} open branch check${openBranchChecks === 1 ? '' : 's'} found.`,
      blindSpot: 'A branch with only supporting clues can be overfit to the current data.',
      nextLever: 'Add a counter-check that could weaken the branch before acting.',
    },
  ];
}

function buildTrustItems(
  input: SurveyEvaluationInput,
  diagnostics: SurveyDiagnostics
): SurveyTrustItem[] {
  const outcome = diagnostics.selected.outcomeColumn;
  const factors = diagnostics.selected.factorColumns;
  const measurement = input.processContext?.measurement;

  return [
    {
      id: 'outcome-signal',
      signal: outcome ?? 'Outcome signal',
      status: outcome ? 'can-do-with-caution' : 'ask-for-next',
      archetype: 'unknown',
      trustLabel: 'Advisory',
      weakLink: outcome ? 'No persisted Signal Card exists yet.' : 'No outcome is mapped.',
      operationalDefinition:
        measurement ??
        'Define what this signal measures, where it comes from, and when it is valid.',
    },
    {
      id: 'factor-signals',
      signal: factors.length > 0 ? factors.join(', ') : 'Factor signals',
      status: factors.length > 0 ? 'can-do-with-caution' : 'ask-for-next',
      archetype: 'unknown',
      trustLabel: 'Advisory',
      weakLink:
        factors.length > 0
          ? 'Factor operational definitions are not captured yet.'
          : 'No factors are mapped.',
      operationalDefinition:
        'Define level meanings, collection source, and scope for each important x.',
    },
    {
      id: 'time-batch-signal',
      signal: diagnostics.selected.timeColumn ?? 'Time/batch axis',
      status: diagnostics.selected.timeColumn ? 'can-do-with-caution' : 'ask-for-next',
      archetype: diagnostics.selected.timeColumn ? 'procedural' : 'unknown',
      trustLabel: 'Advisory',
      weakLink: diagnostics.selected.timeColumn
        ? 'Ordering is available but not validated as a stable process clock.'
        : 'No chronology or batch axis is mapped.',
      operationalDefinition:
        'Define whether ordering means sample time, production time, lot sequence, or batch.',
    },
  ];
}

function addDataRecommendations(
  store: ReturnType<typeof recommendationStore>,
  input: SurveyEvaluationInput,
  diagnostics: SurveyDiagnostics
) {
  const hasData = diagnostics.rowCount > 0;
  const declaredOutcome = Boolean(normalizeColumn(input.outcomeColumn));
  const declaredFactors = (input.factorColumns ?? []).filter(Boolean).length > 0;

  if (!hasData) {
    store.add({
      id: 'data:collect-dataset',
      kind: 'collect-data',
      title: 'Collect a starter dataset',
      detail: 'Survey needs rows before it can assess possibility, power, or trust.',
      actionText: 'Collect or upload rows with one customer-felt outcome and candidate x factors.',
      status: 'cannot-do-yet',
      priority: 10,
      source: 'data-affordance',
      target: { type: 'dataset' },
    });
    store.add({
      id: 'mapping:complete-after-data',
      kind: 'complete-mapping',
      title: 'Map the analysis roles',
      detail: 'Outcome, factors, and time/batch roles are not known until data is loaded.',
      actionText: 'Map the outcome, factors, and time/batch axis after data is loaded.',
      status: 'ask-for-next',
      priority: 20,
      source: 'data-affordance',
      target: { type: 'dataset' },
    });
    return;
  }

  if (!declaredOutcome) {
    store.add({
      id: 'mapping:outcome',
      kind: 'complete-mapping',
      title: 'Confirm the customer-felt outcome',
      detail: diagnostics.detectedColumns.outcome
        ? `Detected "${diagnostics.detectedColumns.outcome}" as a likely outcome, but it is not selected.`
        : 'No selected outcome column is available.',
      actionText: 'Pick the column that captures what the customer experiences.',
      status: 'ask-for-next',
      priority: 30,
      source: 'data-affordance',
      target: { type: 'column', label: diagnostics.detectedColumns.outcome ?? undefined },
    });
  }

  if (!declaredFactors) {
    store.add({
      id: 'mapping:factors',
      kind: 'complete-mapping',
      title: 'Map at least one x/factor',
      detail: diagnostics.detectedColumns.factors.length
        ? `Detected candidate factors: ${diagnostics.detectedColumns.factors.join(', ')}.`
        : 'No selected factors are available.',
      actionText: 'Map one or more candidate x columns for comparison.',
      status: 'ask-for-next',
      priority: 40,
      source: 'data-affordance',
      target: { type: 'column' },
    });
  }

  if (!hasSpecLimit(input.specs)) {
    store.add({
      id: 'specs:set-limits',
      kind: 'set-specs',
      title: 'Set specification limits',
      detail: 'Capability and Cpk claims need at least LSL or USL.',
      actionText: 'Set LSL or USL for the mapped outcome.',
      status: 'ask-for-next',
      priority: 50,
      source: 'data-affordance',
      target: { type: 'signal', label: diagnostics.selected.outcomeColumn },
    });
  }

  if (!diagnostics.selected.timeColumn) {
    store.add({
      id: 'mapping:time-batch-axis',
      kind: 'add-time-batch-axis',
      title: 'Add a time or batch axis',
      detail: 'Chronology is missing, so trends and stability checks fall back to row order.',
      actionText: 'Add sample time, production time, lot, run, or batch sequence.',
      status: 'ask-for-next',
      priority: 60,
      source: 'data-affordance',
      target: { type: 'column' },
    });
  }

  if (diagnostics.selected.outcomeColumn) {
    store.add({
      id: `signal:define:${diagnostics.selected.outcomeColumn}`,
      kind: 'define-signal',
      title: 'Define the outcome signal',
      detail: 'Trust and power are advisory until the signal has an operational definition.',
      actionText: `Define how "${diagnostics.selected.outcomeColumn}" is measured and when it is valid.`,
      status: 'ask-for-next',
      priority: 90,
      source: 'signal-definition',
      target: { type: 'signal', label: diagnostics.selected.outcomeColumn },
    });
  }
}

function addGapRecommendations(
  store: ReturnType<typeof recommendationStore>,
  diagnostics: SurveyDiagnostics
) {
  diagnostics.gaps.forEach((gap, index) => {
    const stepSuffix = gap.stepId ? `:${gap.stepId}` : '';
    const id = `gap:${gap.kind}${stepSuffix}`;
    const basePriority = 100 + index;

    if (gap.kind === 'missing-cts') {
      store.add({
        id,
        kind: 'complete-mapping',
        title: 'Map the CTS outcome',
        detail: gap.message,
        actionText: 'Connect the customer-felt outcome to the Process Map.',
        status: 'ask-for-next',
        priority: basePriority,
        source: 'process-map-gap',
        target: { type: 'map-gap', id: gap.kind },
      });
      return;
    }

    if (gap.kind === 'missing-spec-limits') {
      store.add({
        id,
        kind: 'set-specs',
        title: 'Add spec limits to the map',
        detail: gap.message,
        actionText: 'Set LSL or USL for the CTS/outcome.',
        status: 'ask-for-next',
        priority: basePriority,
        source: 'process-map-gap',
        target: { type: 'map-gap', id: gap.kind },
      });
      return;
    }

    if (gap.kind === 'missing-time-axis') {
      store.add({
        id,
        kind: 'add-time-batch-axis',
        title: 'Add chronology to the data',
        detail: gap.message,
        actionText: 'Collect or map a time, run, lot, or batch sequence column.',
        status: 'ask-for-next',
        priority: basePriority,
        source: 'process-map-gap',
        target: { type: 'map-gap', id: gap.kind },
      });
      return;
    }

    if (gap.kind === 'missing-ctq-at-step') {
      store.add({
        id,
        kind: 'collect-data',
        title: 'Collect an in-process CTQ',
        detail: gap.message,
        actionText: 'Add a CTQ column for this process step.',
        status: 'ask-for-next',
        priority: basePriority,
        source: 'process-map-gap',
        target: { type: 'process-step', id: gap.stepId },
      });
      return;
    }

    store.add({
      id,
      kind: 'complete-mapping',
      title:
        gap.kind === 'missing-subgroup-axis'
          ? 'Pick a rational subgroup axis'
          : 'Add the step tributaries',
      detail: gap.message,
      actionText:
        gap.kind === 'missing-subgroup-axis'
          ? 'Choose the tributary that should act as the subgroup axis.'
          : 'Map the x factors that feed this process step.',
      status: 'ask-for-next',
      priority: basePriority,
      source: 'process-map-gap',
      target: { type: gap.stepId ? 'process-step' : 'map-gap', id: gap.stepId ?? gap.kind },
    });
  });
}

function addBranchRecommendations(
  store: ReturnType<typeof recommendationStore>,
  input: SurveyEvaluationInput
) {
  const branches = input.branches ?? [];
  if (branches.length === 0) return;

  const projected = projectMechanismBranches(branches, {
    questions: input.questions ?? [],
    findings: input.findings ?? [],
    processContext: {
      processMap: input.processMap ?? input.processContext?.processMap,
    },
  });

  projected.forEach((branchView, index) => {
    const priority = 200 + index * 2;
    if (
      branchView.branchStatus === 'active' &&
      branchView.supportingClues.length > 0 &&
      branchView.counterClues.length === 0
    ) {
      store.add({
        id: `branch:${branchView.id}:add-counter-check`,
        kind: 'add-counter-check',
        title: `Add a counter-check for ${branchView.suspectedMechanism}`,
        detail: 'This branch has supporting clues but no explicit counter-clue.',
        actionText: 'Add one check that could weaken or disconfirm the branch.',
        status: 'ask-for-next',
        priority,
        source: 'mechanism-branch',
        target: { type: 'branch', id: branchView.id, label: branchView.suspectedMechanism },
      });
    }

    if (branchView.openChecks.length > 0) {
      store.add({
        id: `branch:${branchView.id}:complete-open-checks`,
        kind: 'add-counter-check',
        title: `Complete open checks for ${branchView.suspectedMechanism}`,
        detail: `${branchView.openChecks.length} branch check${branchView.openChecks.length === 1 ? '' : 's'} still needs evidence.`,
        actionText: 'Complete or close the open branch checks before acting on this mechanism.',
        status: 'ask-for-next',
        priority: priority + 1,
        source: 'mechanism-branch',
        target: { type: 'branch', id: branchView.id, label: branchView.suspectedMechanism },
      });
    }
  });
}

export function evaluateSurvey(input: SurveyEvaluationInput = {}): SurveyEvaluation {
  const diagnostics = makeDiagnostics(input);
  const possibilityItems = buildPossibilityItems(input, diagnostics);
  const powerItems = buildPowerItems(input, diagnostics);
  const trustItems = buildTrustItems(input, diagnostics);
  const recommendations = recommendationStore();

  addDataRecommendations(recommendations, input, diagnostics);
  addGapRecommendations(recommendations, diagnostics);
  addBranchRecommendations(recommendations, input);

  return {
    possibility: {
      overallStatus: summarizeStatus(possibilityItems.map(item => item.status)),
      items: possibilityItems,
    },
    power: {
      overallStatus: summarizeStatus(powerItems.map(item => item.status)),
      items: powerItems,
    },
    trust: {
      overallStatus: summarizeStatus(trustItems.map(item => item.status)),
      items: trustItems,
    },
    recommendations: recommendations.list(),
    diagnostics,
  };
}
