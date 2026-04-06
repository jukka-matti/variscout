/**
 * Tests for CoScout context formatters (Tier 2 semi-static context).
 */
import { describe, it, expect } from 'vitest';
import { formatInvestigationContext } from '../prompts/coScout/context/investigation';
import { formatDataContext } from '../prompts/coScout/context/dataContext';
import { formatKnowledgeContext } from '../prompts/coScout/context/knowledgeContext';
import type { AIContext } from '../types';

describe('formatInvestigationContext', () => {
  it('returns empty string for undefined investigation', () => {
    expect(formatInvestigationContext(undefined)).toBe('');
  });

  it('returns empty string for empty investigation object', () => {
    expect(formatInvestigationContext({})).toBe('');
  });

  it('includes problem statement with stage', () => {
    const result = formatInvestigationContext({
      liveStatement: 'Moisture content is too high in batches from Line A',
      problemStatementStage: 'actionable',
    });
    expect(result).toContain('Problem:');
    expect(result).toContain('Moisture content is too high');
    expect(result).toContain('(actionable)');
  });

  it('falls back to problemStatement.fullText when liveStatement is missing', () => {
    const result = formatInvestigationContext({
      problemStatement: { fullText: 'Cpk below 1.0 on diameter' },
    });
    expect(result).toContain('Cpk below 1.0 on diameter');
  });

  it('includes question count summary with status breakdown', () => {
    const result = formatInvestigationContext({
      questionTree: [
        { id: 'q1', text: 'Is Roast Level significant?', status: 'answered', factor: 'Roast' },
        { id: 'q2', text: 'Is Grind significant?', status: 'open', factor: 'Grind' },
        {
          id: 'q3',
          text: 'Is Origin significant?',
          status: 'ruled-out',
          factor: 'Origin',
          children: [{ text: 'Sub question', status: 'open' }],
        },
      ],
    });
    expect(result).toContain('Questions: 4 total');
    expect(result).toContain('1 answered');
    expect(result).toContain('2 open');
    expect(result).toContain('1 ruled-out');
  });

  it('uses ONLY suspectedCauseHubs, not legacy suspectedCauses', () => {
    const result = formatInvestigationContext({
      // Legacy causeRole-based suspected causes — should be IGNORED
      suspectedCauses: [
        {
          id: 'sc1',
          text: 'Temperature drift',
          causeRole: 'suspected-cause',
          status: 'investigating',
        },
      ],
      // Hub-based suspected causes — should be INCLUDED
      suspectedCauseHubs: [
        {
          id: 'hub1',
          name: 'Raw material moisture',
          synthesis: 'Incoming moisture varies by supplier',
          status: 'active',
          questionCount: 3,
          findingCount: 2,
          evidence: { value: 0.45, label: 'Strong (R²adj=45%)', description: 'test' },
          selectedForImprovement: true,
        },
      ],
    });

    // Hub content should be present
    expect(result).toContain('Suspected cause hubs:');
    expect(result).toContain('Raw material moisture');
    expect(result).toContain('[active]');
    expect(result).toContain('3Q, 2F');
    expect(result).toContain('Strong (R²adj=45%)');
    expect(result).toContain('[selected for improvement]');

    // Legacy causeRole content should NOT appear
    expect(result).not.toContain('Temperature drift');
  });

  it('includes Evidence Map topology summary', () => {
    const result = formatInvestigationContext({
      evidenceMapTopology: {
        factorNodes: [
          { factor: 'Roast', rSquaredAdj: 0.35, explored: true, questionCount: 2, findingCount: 1 },
          {
            factor: 'Grind',
            rSquaredAdj: 0.12,
            explored: false,
            questionCount: 0,
            findingCount: 0,
          },
          {
            factor: 'Origin',
            rSquaredAdj: 0.08,
            explored: true,
            questionCount: 1,
            findingCount: 0,
          },
        ],
        relationships: [{ factorA: 'Roast', factorB: 'Grind', type: 'moderate', strength: 0.3 }],
        convergencePoints: [{ factor: 'Roast', incomingCount: 2, hubName: 'Heat treatment' }],
      },
    });
    expect(result).toContain('Evidence Map: 3 factor nodes');
    expect(result).toContain('2 explored');
    expect(result).toContain('1 relationships');
    expect(result).toContain('1 convergence points');
  });

  it('includes causal links', () => {
    const result = formatInvestigationContext({
      causalLinks: [
        {
          id: 'cl1',
          fromFactor: 'Temperature',
          toFactor: 'Viscosity',
          direction: 'drives',
          evidenceType: 'data',
        },
      ],
    });
    expect(result).toContain('Causal links:');
    expect(result).toContain('Temperature');
    expect(result).toContain('Viscosity');
    expect(result).toContain('[drives]');
    expect(result).toContain('(data)');
  });

  it('includes coverage percentage', () => {
    const result = formatInvestigationContext({
      coveragePercent: 68,
      questionsChecked: 5,
      questionsTotal: 8,
    });
    expect(result).toContain('Investigation coverage: 68%');
    expect(result).toContain('5/8 questions checked');
  });

  // Phase transition tests (Task 3)
  it('includes phase transition announcement when previousPhase differs from phase', () => {
    const result = formatInvestigationContext({
      phase: 'validating',
      previousPhase: 'diverging',
      transitionReason:
        "You answered 3 questions — evidence is accumulating. Let's assess which answers point to the same root cause.",
    });
    expect(result).toContain('⚡ Phase transition: diverging → validating');
    expect(result).toContain('You answered 3 questions');
  });

  it('omits phase transition when previousPhase equals phase', () => {
    const result = formatInvestigationContext({
      phase: 'validating',
      previousPhase: 'validating',
      transitionReason: 'Should not appear',
    });
    expect(result).not.toContain('⚡ Phase transition');
    expect(result).not.toContain('Should not appear');
  });

  it('omits phase transition when previousPhase is absent', () => {
    const result = formatInvestigationContext({
      phase: 'validating',
      transitionReason: 'Should not appear',
    });
    expect(result).not.toContain('⚡ Phase transition');
    expect(result).not.toContain('Should not appear');
  });

  it('includes transition announcement without reason when transitionReason is absent', () => {
    const result = formatInvestigationContext({
      phase: 'converging',
      previousPhase: 'validating',
    });
    expect(result).toContain('⚡ Phase transition: validating → converging');
  });

  // Evidence sufficiency tests (Task 4)
  it('includes evidence warning for hub when coveragePercent < 25', () => {
    const result = formatInvestigationContext({
      coveragePercent: 12,
      questionsChecked: 2,
      questionsTotal: 5,
      suspectedCauseHubs: [
        {
          id: 'hub1',
          name: 'Nozzle Wear',
          synthesis: 'Nozzle degradation varies by shift',
          status: 'active',
          questionCount: 2,
          findingCount: 1,
        },
      ],
    });
    expect(result).toContain('⚠ Evidence note:');
    expect(result).toContain('Nozzle Wear');
    expect(result).toContain('~12% of variation');
    expect(result).toContain('significant sources may remain unexplored');
    expect(result).toContain('3 remaining open questions');
  });

  it('omits evidence warning when coveragePercent >= 25', () => {
    const result = formatInvestigationContext({
      coveragePercent: 45,
      suspectedCauseHubs: [
        {
          id: 'hub1',
          name: 'Machine Setup',
          synthesis: 'Setup variation across shifts',
          status: 'active',
          questionCount: 3,
          findingCount: 2,
        },
      ],
    });
    expect(result).not.toContain('⚠ Evidence note:');
  });

  it('uses per-hub evidence.value when coveragePercent is absent and value < 0.25', () => {
    const result = formatInvestigationContext({
      suspectedCauseHubs: [
        {
          id: 'hub1',
          name: 'Nozzle Wear',
          synthesis: 'Nozzle degradation',
          status: 'active',
          questionCount: 1,
          findingCount: 0,
          evidence: { value: 0.12, label: 'Weak (R²adj=12%)', description: 'test' },
        },
      ],
    });
    expect(result).toContain('⚠ Evidence note:');
    expect(result).toContain('Nozzle Wear');
    expect(result).toContain('~12% of variation');
  });

  it('omits evidence warning when per-hub evidence.value >= 0.25 and coveragePercent absent', () => {
    const result = formatInvestigationContext({
      suspectedCauseHubs: [
        {
          id: 'hub1',
          name: 'Machine Setup',
          synthesis: 'Setup variation',
          status: 'active',
          questionCount: 3,
          findingCount: 2,
          evidence: { value: 0.38, label: 'Strong (R²adj=38%)', description: 'test' },
        },
      ],
    });
    expect(result).not.toContain('⚠ Evidence note:');
  });

  it('omits open question count suffix when questionsTotal and questionsChecked are absent', () => {
    const result = formatInvestigationContext({
      coveragePercent: 8,
      suspectedCauseHubs: [
        {
          id: 'hub1',
          name: 'Raw Material',
          synthesis: 'Incoming moisture varies',
          status: 'active',
          questionCount: 0,
          findingCount: 0,
        },
      ],
    });
    expect(result).toContain('⚠ Evidence note:');
    expect(result).not.toContain('remaining open question');
  });
});

describe('formatDataContext', () => {
  const emptyContext: AIContext = {
    process: {},
    filters: [],
  };

  it('returns empty string for empty context', () => {
    expect(formatDataContext(emptyContext)).toBe('');
  });

  it('does NOT include problem statement (owned by investigation.ts)', () => {
    const result = formatDataContext({
      ...emptyContext,
      investigation: {
        liveStatement: 'Moisture too high in Line A',
        problemStatementStage: 'with-causes',
      },
    });
    expect(result).not.toContain('Problem:');
  });

  it('includes variation contributions with factor names and percentages', () => {
    const result = formatDataContext({
      ...emptyContext,
      variationContributions: [
        { factor: 'Machine', etaSquared: 0.42 },
        { factor: 'Operator', etaSquared: 0.18 },
        { factor: 'Shift', etaSquared: 0.05 },
      ],
    });
    expect(result).toContain('Top factors:');
    expect(result).toContain('Machine');
    expect(result).toContain('42%');
    expect(result).toContain('Operator');
    expect(result).toContain('18%');
  });

  it('includes factor type and optimum in variation contributions line', () => {
    const result = formatDataContext({
      ...emptyContext,
      variationContributions: [
        {
          factor: 'Temperature',
          etaSquared: 0.45,
          factorType: 'continuous',
          relationship: 'quadratic',
          optimum: 72.3,
        },
        { factor: 'Machine', etaSquared: 0.12, factorType: 'categorical' },
        { factor: 'Shift', etaSquared: 0.05 },
      ],
    });
    expect(result).toContain('Temperature η²=45% [continuous, sweet spot 72.3]');
    expect(result).toContain('Machine η²=12% [categorical]');
    expect(result).toContain('Shift η²=5%');
    expect(result).not.toContain('Shift η²=5% [');
  });

  it('includes best model equation with R-squared adj and worst/best cases', () => {
    const result = formatDataContext({
      ...emptyContext,
      bestModelEquation: {
        factors: ['Machine', 'Shift'],
        rSquaredAdj: 0.61,
        levelEffects: {},
        worstCase: { levels: { Machine: 'B', Shift: 'Night' }, predicted: 53.4 },
        bestCase: { levels: { Machine: 'A', Shift: 'Day' }, predicted: 47.9 },
      },
    });
    expect(result).toContain('Best model: {Machine, Shift}');
    expect(result).toContain('R\u00b2adj=0.61');
    expect(result).toContain('Worst case: Machine=B + Shift=Night');
    expect(result).toContain('53.4');
    expect(result).toContain('Best case: Machine=A + Shift=Day');
    expect(result).toContain('47.9');
  });

  it('omits worst/best case lines when levels are empty', () => {
    const result = formatDataContext({
      ...emptyContext,
      bestModelEquation: {
        factors: ['Machine', 'Operator'],
        rSquaredAdj: 0.56,
        levelEffects: {},
        worstCase: { levels: {}, predicted: 10 },
        bestCase: { levels: {}, predicted: 5 },
      },
    });
    expect(result).toContain('Best model:');
    expect(result).not.toContain('Worst case:');
    expect(result).not.toContain('Best case:');
  });

  it('omits best model equation when absent', () => {
    const result = formatDataContext({
      ...emptyContext,
      stats: { mean: 10, stdDev: 1, samples: 50 },
    });
    expect(result).not.toContain('Best model:');
  });

  it('includes focusContext with chartType and category stats', () => {
    const result = formatDataContext({
      ...emptyContext,
      focusContext: {
        chartType: 'boxplot',
        category: { name: 'Machine=B', mean: 53.4, etaSquaredPct: 42 },
      },
    });
    expect(result).toContain('Focus:');
    expect(result).toContain('boxplot');
    expect(result).toContain('Machine=B');
    expect(result).toContain('mean=53.40');
    expect(result).toContain('\u03b7\u00b2=42%');
  });

  it('includes focusContext with finding text', () => {
    const result = formatDataContext({
      ...emptyContext,
      focusContext: {
        chartType: 'pareto',
        finding: {
          text: 'Machine B shows elevated variation vs other machines',
          status: 'investigating',
        },
      },
    });
    expect(result).toContain('Focus:');
    expect(result).toContain('pareto');
    expect(result).toContain('finding: "Machine B shows elevated variation');
  });

  it('omits Focus line when focusContext is absent', () => {
    const result = formatDataContext({
      ...emptyContext,
      variationContributions: [{ factor: 'Machine', etaSquared: 0.3 }],
    });
    expect(result).not.toContain('Focus:');
  });

  it('includes drill path and scope', () => {
    const result = formatDataContext({
      ...emptyContext,
      drillPath: ['Machine', 'Shift'],
      cumulativeScope: 0.65,
    });
    expect(result).toContain('Drill scope: 65% of total variation');
    expect(result).toContain('Machine > Shift');
  });

  it('includes stats summary', () => {
    const result = formatDataContext({
      ...emptyContext,
      stats: {
        mean: 12.45,
        stdDev: 1.23,
        samples: 150,
        cpk: 1.42,
        passRate: 0.985,
      },
    });
    expect(result).toContain('n=150');
    expect(result).toContain('mean=12.45');
    expect(result).toContain('Cpk=1.42');
    expect(result).toContain('pass=99%');
  });

  it('does NOT include question progress (owned by investigation.ts)', () => {
    const result = formatDataContext({
      ...emptyContext,
      investigation: {
        questionTree: [
          { id: 'q1', text: 'First priority question', status: 'open' },
          { id: 'q2', text: 'Answered one', status: 'answered' },
        ],
      },
    });
    expect(result).not.toContain('Questions:');
  });

  it('produces no raw JSON in output', () => {
    const result = formatDataContext({
      ...emptyContext,
      variationContributions: [{ factor: 'Machine', etaSquared: 0.3 }],
      stats: { mean: 10, stdDev: 1, samples: 100 },
    });
    expect(result).not.toContain('{');
    expect(result).not.toContain('}');
    expect(result).not.toContain('[object');
  });
});

describe('formatKnowledgeContext', () => {
  it('returns empty string for no results and no documents', () => {
    expect(formatKnowledgeContext([])).toBe('');
  });

  it('formats knowledge results with factor and Cpk', () => {
    const result = formatKnowledgeContext([
      {
        projectName: 'Coffee Q1',
        factor: 'Roast Level',
        status: 'resolved',
        etaSquared: 0.35,
        cpkBefore: 0.8,
        cpkAfter: 1.5,
        suspectedCause: 'Dark roast moisture retention',
        actionsText: 'Reduced roast time by 15%',
        outcomeEffective: true,
      },
    ]);
    expect(result).toContain('Knowledge Base documents');
    expect(result).toContain('Dark roast moisture retention');
    expect(result).toContain('Coffee Q1');
    expect(result).toContain('Roast Level');
    expect(result).toContain('35.0%');
    expect(result).toContain('0.80');
    expect(result).toContain('1.50');
    expect(result).toContain('effective');
  });

  it('formats knowledge documents with source attribution', () => {
    const result = formatKnowledgeContext(
      [],
      [
        {
          title: 'SOP-042 Moisture Control',
          snippet: 'The moisture control procedure requires...',
          source: 'Quality/SOPs',
          url: 'https://example.com/sop-042',
        },
      ]
    );
    expect(result).toContain('SOP-042 Moisture Control');
    expect(result).toContain('[Source: Quality/SOPs]');
    expect(result).toContain('https://example.com/sop-042');
  });

  it('produces no raw JSON in output', () => {
    const result = formatKnowledgeContext([
      {
        projectName: 'Test',
        factor: 'X',
        status: 'open',
        etaSquared: null,
        cpkBefore: null,
        cpkAfter: null,
        suspectedCause: 'test',
        actionsText: '',
        outcomeEffective: null,
      },
    ]);
    expect(result).not.toContain('[object');
  });
});
