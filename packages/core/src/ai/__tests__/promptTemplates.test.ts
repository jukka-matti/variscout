import { describe, it, expect } from 'vitest';
import {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
  buildCoScoutInput,
  buildCoScoutTools,
  formatKnowledgeContext,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
} from '../promptTemplates';
import { narrationResponseSchema, chartInsightResponseSchema } from '../schemas';
import type { AIContext, CoScoutMessage } from '../types';
import type { Finding, Hypothesis } from '../../findings';

describe('buildNarrationSystemPrompt', () => {
  it('returns a system prompt string', () => {
    const prompt = buildNarrationSystemPrompt();
    expect(prompt).toContain('quality');
    expect(prompt).toContain('VariScout');
    expect(typeof prompt).toBe('string');
  });

  it('includes glossary fragment when provided', () => {
    const prompt = buildNarrationSystemPrompt(
      '## Terminology\n\n- **Cpk**: Process capability index'
    );
    expect(prompt).toContain('## Terminology');
    expect(prompt).toContain('Cpk');
  });

  it('includes locale hint when locale is not English', () => {
    const prompt = buildNarrationSystemPrompt(undefined, 'de');
    expect(prompt).toContain('LANGUAGE: Respond in Deutsch');
  });

  it('does not include locale hint for English', () => {
    const prompt = buildNarrationSystemPrompt(undefined, 'en');
    expect(prompt).not.toContain('LANGUAGE:');
  });

  it('does not include locale hint when locale is undefined', () => {
    const prompt = buildNarrationSystemPrompt();
    expect(prompt).not.toContain('LANGUAGE:');
  });
});

describe('buildSummaryPrompt', () => {
  it('builds prompt with stats', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      stats: { mean: 10.5, stdDev: 0.5, samples: 100, cpk: 1.1, cp: 1.33, passRate: 98.5 },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Mean=10.50');
    expect(prompt).toContain('Cpk=1.10');
    expect(prompt).toContain('PassRate=98.5%');
  });

  it('includes process description', () => {
    const ctx: AIContext = {
      process: { description: 'Fill weight on Line 3' },
      filters: [],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Fill weight on Line 3');
  });

  it('includes filters', () => {
    const ctx: AIContext = {
      process: {},
      filters: [{ factor: 'Machine', values: ['A', 'B'], category: 'Equipment' }],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Machine=A,B');
    expect(prompt).toContain('Equipment');
  });

  it('includes violations', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      violations: { outOfControl: 5, aboveUSL: 2, belowLSL: 0 },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('5 out-of-control');
    expect(prompt).toContain('2 above USL');
  });

  it('includes Nelson Rule 2 and 3 counts in violations', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      violations: {
        outOfControl: 1,
        aboveUSL: 0,
        belowLSL: 0,
        nelsonRule2Count: 2,
        nelsonRule3Count: 1,
      },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('2 Nelson Rule 2 (process shift)');
    expect(prompt).toContain('1 Nelson Rule 3 (trend/drift)');
  });

  it('omits Nelson counts when zero', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      violations: {
        outOfControl: 3,
        aboveUSL: 0,
        belowLSL: 0,
        nelsonRule2Count: 0,
        nelsonRule3Count: 0,
      },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).not.toContain('Nelson Rule 2');
    expect(prompt).not.toContain('Nelson Rule 3');
  });

  it('includes findings summary', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      findings: { total: 3, byStatus: { observed: 1, analyzed: 2 }, keyDrivers: ['Head 3'] },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('3 total');
    expect(prompt).toContain('Head 3');
  });

  it('includes factor roles when present', () => {
    const ctx: AIContext = {
      process: { factorRoles: { Machine: 'Equipment', Shift: 'Temporal' } },
      filters: [],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Factor roles:');
    expect(prompt).toContain('Machine (Equipment)');
    expect(prompt).toContain('Shift (Temporal)');
  });

  it('includes variation contributions with category annotations', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      variationContributions: [
        { factor: 'Machine', etaSquared: 0.45, category: 'Equipment' },
        { factor: 'Batch', etaSquared: 0.12 },
      ],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Variation contributions:');
    expect(prompt).toContain('Machine (Equipment): η²=45.0%');
    expect(prompt).toContain('Batch: η²=12.0%');
  });

  it('includes team contributors when present', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      teamContributors: { count: 3, hypothesisAreas: ['Machine', 'Shift'] },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Team: 3 contributors');
    expect(prompt).toContain('investigating Machine, Shift');
  });

  it('includes team contributors without areas', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      teamContributors: { count: 2, hypothesisAreas: [] },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Team: 2 contributors');
    expect(prompt).not.toContain('investigating');
  });

  it('handles minimal context', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Summarize');
  });

  it('includes staged comparison section when present', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      stagedComparison: {
        stageNames: ['Before', 'After'],
        deltas: {
          meanShift: 0.2,
          variationRatio: 0.6,
          cpkDelta: 0.43,
          passRateDelta: 5.0,
          outOfSpecReduction: 3.2,
        },
        colorCoding: {},
        cpkBefore: 0.89,
        cpkAfter: 1.32,
      },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Staged comparison (Before → After)');
    expect(prompt).toContain('Mean shift +0.20');
    expect(prompt).toContain('Variation ratio 0.60');
    expect(prompt).toContain('Cpk delta +0.43');
    expect(prompt).toContain('(0.89 → 1.32)');
    expect(prompt).toContain('Out-of-spec reduction +3.2%');
    expect(prompt).toContain('verification analysis');
    expect(prompt).not.toContain('Summarize this analysis state');
  });

  it('uses default instruction when no staged comparison', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Summarize this analysis state');
    expect(prompt).not.toContain('verification analysis');
  });

  it('includes problem statement when present', () => {
    const ctx: AIContext = {
      process: { problemStatement: 'Yield dropping in Q1' },
      filters: [],
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Yield dropping in Q1');
  });
});

describe('buildChartInsightSystemPrompt', () => {
  it('returns a system prompt for chart insights', () => {
    const prompt = buildChartInsightSystemPrompt();
    expect(prompt).toContain('120 characters');
    expect(prompt).toContain('one sentence');
  });
});

describe('buildChartInsightPrompt', () => {
  it('includes deterministic insight text', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'ichart',
      deterministicInsight: 'Process shift detected',
      ichart: { nelsonRule2Count: 1, nelsonRule3Count: 0, outOfControlCount: 3, totalPoints: 50 },
    });
    expect(prompt).toContain('Process shift detected');
    expect(prompt).toContain('ichart');
    expect(prompt).toContain('50 points');
  });

  it('includes process description', () => {
    const ctx: AIContext = { process: { description: 'Fill weight on Line 3' }, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'stats',
      deterministicInsight: 'Cpk 0.85',
      stats: { cpk: 0.85, cpkTarget: 1.33 },
    });
    expect(prompt).toContain('Fill weight on Line 3');
    expect(prompt).toContain('Cpk');
  });

  it('includes boxplot data with category', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'boxplot',
      deterministicInsight: 'Drill Machine A',
      boxplot: {
        currentFactor: 'Machine',
        category: 'Equipment',
        topCategories: [{ name: 'A', variationPct: 47 }],
        nextDrillFactor: 'Shift',
      },
    });
    expect(prompt).toContain('Machine');
    expect(prompt).toContain('Equipment');
    expect(prompt).toContain('Shift');
  });

  it('includes pareto data', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'pareto',
      deterministicInsight: 'Top 2 explain 73%',
      pareto: {
        topCategories: [
          { name: 'Head 3', variationPct: 45 },
          { name: 'Head 1', variationPct: 28 },
        ],
        cumulativeTop2Pct: 73,
      },
    });
    expect(prompt).toContain('73%');
    expect(prompt).toContain('Head 3');
  });

  it('includes active filters', () => {
    const ctx: AIContext = {
      process: {},
      filters: [{ factor: 'Machine', values: ['A'] }],
    };
    const prompt = buildChartInsightPrompt(ctx, {
      chartType: 'ichart',
      deterministicInsight: 'Stable process',
    });
    expect(prompt).toContain('Machine=A');
  });
});

describe('buildCoScoutSystemPrompt', () => {
  it('returns a non-empty system prompt', () => {
    const prompt = buildCoScoutSystemPrompt();
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('CoScout');
  });

  it('includes glossary fragment when provided', () => {
    const prompt = buildCoScoutSystemPrompt({
      glossaryFragment: '## Terminology\n\n- **Cp**: Process potential',
    });
    expect(prompt).toContain('## Terminology');
    expect(prompt).toContain('Cp');
  });

  it('includes problem statement when investigation context provided', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: { problemStatement: 'Customer complaints up 30%' },
    });
    expect(prompt).toContain('Customer complaints up 30%');
    expect(prompt).toContain('investigating');
  });

  it('includes hypotheses when investigation context has them', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        allHypotheses: [
          { id: 'h-1', text: 'Night shift training gap', status: 'supported' },
          { id: 'h-2', text: 'Material batch variation', status: 'untested' },
        ],
      },
    });
    expect(prompt).toContain('Night shift training gap');
    expect(prompt).toContain('supported');
    expect(prompt).toContain('Material batch variation');
  });

  it('includes target and progress when investigation has them', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        targetMetric: 'cpk',
        targetValue: 1.33,
        currentValue: 0.95,
        progressPercent: 42,
      },
    });
    expect(prompt).toContain('cpk');
    expect(prompt).toContain('1.33');
    expect(prompt).toContain('42%');
  });

  it('includes phase-specific instructions', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: { phase: 'diverging' },
    });
    expect(prompt).toContain('exploring possible causes');
    expect(prompt).toContain('cast a wide net');
  });

  it('does not add investigation section when no investigation context', () => {
    const prompt = buildCoScoutSystemPrompt();
    expect(prompt).not.toContain('Investigation context');
  });

  it('uses tool names and VariScout principles, not lens names', () => {
    const prompt = buildCoScoutSystemPrompt();
    expect(prompt).not.toContain('Use standard SPC');
    expect(prompt).toContain('I-Chart');
    expect(prompt).toContain('Boxplot');
    expect(prompt).toContain('Pareto');
    expect(prompt).toContain('Capability');
    expect(prompt).toContain('Two Voices');
    expect(prompt).toContain('Progressive stratification');
    expect(prompt).toContain('Iterative exploration');
    expect(prompt).not.toContain('Change Lens');
    expect(prompt).not.toContain('Flow Lens');
    expect(prompt).not.toContain('Failure Lens');
    expect(prompt).not.toContain('Value Lens');
    expect(prompt).not.toContain('Stability before capability');
  });

  it('includes improvement ideas when converging with supported hypotheses', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'converging',
        allHypotheses: [
          {
            id: 'h-1',
            text: 'Night shift training gap',
            status: 'supported',
            ideas: [
              {
                text: 'Simplify setup (visual guides)',
                selected: true,
                projection: { meanDelta: -0.5, sigmaDelta: -0.1 },
              },
              { text: 'Train night shift operators' },
            ],
          },
        ],
      },
    });
    expect(prompt).toContain('Simplify setup (visual guides)');
    expect(prompt).toContain('[selected]');
    expect(prompt).toContain('(projected)');
    expect(prompt).toContain('Train night shift operators');
    expect(prompt).toContain('Build on these');
  });

  it('does not include ideas section when no ideas exist', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'converging',
        allHypotheses: [{ id: 'h-1', text: 'Root cause', status: 'supported' }],
      },
    });
    expect(prompt).not.toContain('Existing improvement ideas');
  });

  it('includes selected finding in investigation context', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        selectedFinding: {
          text: 'Head 3 shows high variation',
          hypothesis: 'Nozzle wear',
          projection: { meanDelta: -0.5, sigmaDelta: -0.12 },
          actions: [
            { text: 'Replace nozzle', status: 'done' },
            { text: 'Verify Cpk', status: 'pending' },
          ],
        },
      },
    });
    expect(prompt).toContain('Currently focused finding: "Head 3 shows high variation"');
    expect(prompt).toContain('hypothesis: "Nozzle wear"');
    expect(prompt).toContain('mean -0.50');
    expect(prompt).toContain('sigma -0.12');
    expect(prompt).toContain('Actions (1/2 complete):');
    expect(prompt).toContain('[done] Replace nozzle');
    expect(prompt).toContain('[pending] Verify Cpk');
  });

  it('includes selected finding without optional fields', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: { selectedFinding: { text: 'Simple finding' } },
    });
    expect(prompt).toContain('Currently focused finding: "Simple finding"');
    expect(prompt).not.toContain('hypothesis');
    expect(prompt).not.toContain('Projected');
    expect(prompt).not.toContain('Actions');
  });

  it('includes team collaboration when count > 1', () => {
    const prompt = buildCoScoutSystemPrompt({
      teamContributors: { count: 3, hypothesisAreas: ['Machine', 'Shift'] },
    });
    expect(prompt).toContain('Team collaboration: 3 investigators');
    expect(prompt).toContain('Areas being investigated: Machine, Shift');
    expect(prompt).toContain('Avoid suggesting investigation steps already covered');
  });

  it('includes verification instructions when acting + staged data', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: { phase: 'improving' },
      stagedComparison: {
        stageNames: ['Before', 'After'],
        deltas: {
          meanShift: -0.3,
          variationRatio: 0.7,
          cpkDelta: 0.5,
          passRateDelta: null,
          outOfSpecReduction: 0,
        },
        colorCoding: {},
        cpkBefore: 0.85,
        cpkAfter: 1.35,
      },
    });
    expect(prompt).toContain('Improvement Phase with verification data');
    expect(prompt).toContain('mean shift -0.30');
    expect(prompt).toContain('Cpk delta +0.50');
    expect(prompt).toContain('Is the improvement real and sustained');
  });

  it('uses generic improving instructions when no staged data', () => {
    const prompt = buildCoScoutSystemPrompt({ investigation: { phase: 'improving' } });
    expect(prompt).toContain('PDCA: Plan');
    expect(prompt).not.toContain('verification data');
  });

  it('does not include team collaboration when count is 1', () => {
    const prompt = buildCoScoutSystemPrompt({
      teamContributors: { count: 1, hypothesisAreas: [] },
    });
    expect(prompt).not.toContain('Team collaboration');
  });

  // ADR-029: Tool routing tests
  it('includes tool routing instructions when hasActionTools is true', () => {
    const prompt = buildCoScoutSystemPrompt({ hasActionTools: true });
    expect(prompt).toContain('Tool usage guidance');
    expect(prompt).toContain('get_available_factors');
    expect(prompt).toContain('[ACTION:tool_name:params_json]');
  });

  it('does not include tool routing when hasActionTools is false', () => {
    const prompt = buildCoScoutSystemPrompt({});
    expect(prompt).not.toContain('Tool usage guidance');
  });

  it('includes entry scenario guidance for problem scenario', () => {
    const prompt = buildCoScoutSystemPrompt({
      hasActionTools: true,
      entryScenario: 'problem',
    });
    expect(prompt).toContain('Problem to solve');
    expect(prompt).toContain('compare_categories');
  });

  it('includes entry scenario guidance for hypothesis scenario', () => {
    const prompt = buildCoScoutSystemPrompt({
      hasActionTools: true,
      entryScenario: 'hypothesis',
    });
    expect(prompt).toContain('Hypothesis to check');
  });

  it('includes entry scenario guidance for routine scenario', () => {
    const prompt = buildCoScoutSystemPrompt({
      hasActionTools: true,
      entryScenario: 'routine',
    });
    expect(prompt).toContain('Routine check');
    expect(prompt).toContain('conservatively');
  });

  it('includes IMPROVE guidance in problem entry scenario', () => {
    const prompt = buildCoScoutSystemPrompt({
      hasActionTools: true,
      entryScenario: 'problem',
    });
    expect(prompt).toContain('IMPROVE:');
    expect(prompt).toContain('Cpk has reached the original target');
  });

  it('includes IMPROVE guidance in hypothesis entry scenario', () => {
    const prompt = buildCoScoutSystemPrompt({
      hasActionTools: true,
      entryScenario: 'hypothesis',
    });
    expect(prompt).toContain('IMPROVE:');
    expect(prompt).toContain('original hypothesis');
  });

  it('includes IMPROVE guidance in routine entry scenario', () => {
    const prompt = buildCoScoutSystemPrompt({
      hasActionTools: true,
      entryScenario: 'routine',
    });
    expect(prompt).toContain('IMPROVE:');
    expect(prompt).toContain('sustaining controls');
  });

  it('includes IMPROVE KB guidance in tool routing instructions', () => {
    const prompt = buildCoScoutSystemPrompt({ hasActionTools: true });
    expect(prompt).toContain('Knowledge Base in IMPROVE phase');
    expect(prompt).toContain('sustaining control procedures');
  });

  // Workstream B: Enriched AIContext in prompt
  it('includes hypothesis IDs in investigation context', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        allHypotheses: [
          { id: 'hyp-1', text: 'Night shift training gap', status: 'supported' },
          { id: 'hyp-2', text: 'Material batch', status: 'partial' },
        ],
      },
    });
    expect(prompt).toContain('[hyp-1]');
    expect(prompt).toContain('[hyp-2]');
  });

  it('includes finding status in selected finding context', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        selectedFinding: {
          text: 'Head 3 high variation',
          status: 'improving',
        },
      },
    });
    expect(prompt).toContain('[status: improving]');
  });

  it('includes action progress summary in selected finding', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        selectedFinding: {
          text: 'Test finding',
          actions: [
            { text: 'Replace nozzle', status: 'done' },
            { text: 'Verify Cpk', status: 'pending', overdue: true },
          ],
          actionProgress: { total: 2, done: 1, overdueCount: 1 },
        },
      },
    });
    expect(prompt).toContain('Action progress: 1/2 complete');
    expect(prompt).toContain('1 overdue');
    expect(prompt).toContain('OVERDUE');
  });

  it('includes idea category in converging phase', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'converging',
        allHypotheses: [
          {
            id: 'hyp-1',
            text: 'Root cause',
            status: 'supported',
            ideas: [
              { text: 'Fix nozzle', direction: 'prevent', selected: true },
              { text: 'Temporary shim', direction: 'detect' },
            ],
          },
        ],
      },
    });
    expect(prompt).toContain('[prevent]');
    expect(prompt).toContain('[detect]');
  });

  // Workstream A: PDCA sub-state awareness
  it('includes PDCA coaching section in tool routing instructions', () => {
    const prompt = buildCoScoutSystemPrompt({ hasActionTools: true });
    expect(prompt).toContain('PDCA coaching');
    expect(prompt).toContain('prevent');
    expect(prompt).toContain('detect');
    expect(prompt).toContain('simplify');
    expect(prompt).toContain('eliminate');
  });

  it('uses PDCA Plan instruction when improving with no actions', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'improving',
        selectedFinding: { text: 'Test finding' },
      },
    });
    expect(prompt).toContain('PDCA: Plan');
    expect(prompt).toContain('brainstorm improvement ideas');
  });

  it('uses PDCA Do instruction when improving with actions in progress', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'improving',
        selectedFinding: {
          text: 'Test finding',
          actions: [
            { text: 'Replace nozzle', status: 'done' },
            { text: 'Verify Cpk', status: 'pending' },
          ],
        },
      },
    });
    expect(prompt).toContain('PDCA: Do');
    expect(prompt).toContain('Track progress');
  });

  it('uses PDCA Act instruction when improving with all actions done', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'improving',
        selectedFinding: {
          text: 'Test finding',
          actions: [
            { text: 'Replace nozzle', status: 'done' },
            { text: 'Verify Cpk', status: 'done' },
          ],
        },
      },
    });
    expect(prompt).toContain('PDCA: Act');
    expect(prompt).toContain('outcome');
  });

  it('preserves staged comparison override (CHECK) over PDCA sub-state', () => {
    const prompt = buildCoScoutSystemPrompt({
      investigation: {
        phase: 'improving',
        selectedFinding: {
          text: 'Test finding',
          actions: [{ text: 'Replace nozzle', status: 'done' }],
        },
      },
      stagedComparison: {
        stageNames: ['Before', 'After'],
        deltas: {
          meanShift: -0.3,
          variationRatio: 0.7,
          cpkDelta: 0.5,
          passRateDelta: null,
          outOfSpecReduction: 0,
        },
        colorCoding: {},
        cpkBefore: 0.85,
        cpkAfter: 1.35,
      },
    });
    expect(prompt).toContain('verification data');
    expect(prompt).not.toContain('PDCA: Act');
  });

  // Workstream C: suggest_improvement_idea routing guidance
  it('includes improvement idea routing guidance when action tools enabled', () => {
    const prompt = buildCoScoutSystemPrompt({ hasActionTools: true });
    expect(prompt).toContain('suggest_improvement_idea');
    expect(prompt).toContain('Improvement idea guidance');
  });

  // Mode-specific terminology and coaching (ADR-047)
  it('includes yamazumi methodology when analysisMode is yamazumi', () => {
    const prompt = buildCoScoutSystemPrompt({ analysisMode: 'yamazumi' });
    expect(prompt).toContain('Time Study (Yamazumi)');
    expect(prompt).toContain('cycle time');
    expect(prompt).toContain('VA ratio');
    expect(prompt).toContain('takt time');
    expect(prompt).toContain('takt compliance');
    expect(prompt).toContain('Coaching workflow');
    expect(prompt).toContain('Activity types');
  });

  it('includes performance methodology when analysisMode is performance', () => {
    const prompt = buildCoScoutSystemPrompt({ analysisMode: 'performance' });
    expect(prompt).toContain('Multi-Channel Performance');
    expect(prompt).toContain('channels');
    expect(prompt).toContain('worst-channel Cpk');
    expect(prompt).toContain('channel health');
    expect(prompt).toContain('Coaching workflow');
  });

  it('does not include mode-specific blocks for standard mode', () => {
    const prompt = buildCoScoutSystemPrompt({});
    expect(prompt).not.toContain('Time Study (Yamazumi)');
    expect(prompt).not.toContain('Multi-Channel Performance');
  });

  it('does not include mode-specific blocks when analysisMode is standard', () => {
    const prompt = buildCoScoutSystemPrompt({ analysisMode: 'standard' });
    expect(prompt).not.toContain('Time Study (Yamazumi)');
    expect(prompt).not.toContain('Multi-Channel Performance');
  });

  // Insight capture guidance (ADR-049)
  it('includes insight capture guidance in system prompt for INVESTIGATE phase', () => {
    const prompt = buildCoScoutSystemPrompt({
      phase: 'investigate',
      hasActionTools: true,
    });
    expect(prompt).toContain('suggest_save_finding');
    expect(prompt).toContain('negative learning');
  });

  it('includes insight capture guidance for IMPROVE phase', () => {
    const prompt = buildCoScoutSystemPrompt({
      phase: 'improve',
      hasActionTools: true,
    });
    expect(prompt).toContain('suggest_save_finding');
  });

  it('excludes insight capture guidance for SCOUT phase', () => {
    const prompt = buildCoScoutSystemPrompt({
      phase: 'scout',
      hasActionTools: true,
    });
    expect(prompt).not.toContain('Insight capture guidance');
  });

  it('excludes insight capture guidance when hasActionTools is false', () => {
    const prompt = buildCoScoutSystemPrompt({
      phase: 'investigate',
      hasActionTools: false,
    });
    expect(prompt).not.toContain('Insight capture guidance');
  });
});

describe('formatKnowledgeContext', () => {
  it('returns empty string for empty array', () => {
    expect(formatKnowledgeContext([])).toBe('');
  });

  it('formats a single result with all fields', () => {
    const result = formatKnowledgeContext([
      {
        projectName: 'Coffee Line 3',
        factor: 'Machine',
        status: 'resolved',
        etaSquared: 0.42,
        cpkBefore: 0.85,
        cpkAfter: 1.45,
        suspectedCause: 'Nozzle blockage',
        actionsText: 'Replaced nozzle weekly',
        outcomeEffective: true,
      },
    ]);
    expect(result).toContain('Knowledge Base documents found');
    expect(result).toContain('1. [From: findings] "Nozzle blockage" — Coffee Line 3');
    expect(result).toContain('Factor: Machine, Status: resolved');
    expect(result).toContain('η²: 42.0%');
    expect(result).toContain('Cpk: 0.85 → 1.45');
    expect(result).toContain('Actions: Replaced nozzle weekly');
    expect(result).toContain('Outcome: effective');
  });

  it('handles null fields gracefully', () => {
    const result = formatKnowledgeContext([
      {
        projectName: 'Packaging',
        factor: 'Shift',
        status: 'investigating',
        etaSquared: null,
        cpkBefore: null,
        cpkAfter: null,
        suspectedCause: '',
        actionsText: '',
        outcomeEffective: null,
      },
    ]);
    expect(result).toContain('"Unknown cause" — Packaging');
    expect(result).toContain('Factor: Shift');
    expect(result).not.toContain('η²');
    expect(result).not.toContain('Cpk');
    expect(result).not.toContain('Actions');
    expect(result).not.toContain('Outcome');
  });

  it('formats multiple results with numbering', () => {
    const result = formatKnowledgeContext([
      {
        projectName: 'A',
        factor: 'X',
        status: 'resolved',
        etaSquared: 0.3,
        cpkBefore: null,
        cpkAfter: null,
        suspectedCause: 'Cause A',
        actionsText: '',
        outcomeEffective: null,
      },
      {
        projectName: 'B',
        factor: 'Y',
        status: 'analyzed',
        etaSquared: null,
        cpkBefore: null,
        cpkAfter: null,
        suspectedCause: 'Cause B',
        actionsText: '',
        outcomeEffective: false,
      },
    ]);
    expect(result).toContain('1. [From: findings] "Cause A" — A');
    expect(result).toContain('2. [From: findings] "Cause B" — B');
    expect(result).toContain('Outcome: not effective');
  });

  it('includes [From: findings] prefix on finding entries and [Source: <source>] on document entries', () => {
    const result = formatKnowledgeContext(
      [
        {
          projectName: 'Coffee Line 3',
          factor: 'Machine',
          status: 'resolved',
          etaSquared: 0.42,
          cpkBefore: 0.85,
          cpkAfter: 1.45,
          suspectedCause: 'Nozzle blockage',
          actionsText: 'Replaced nozzle',
          outcomeEffective: true,
        },
      ],
      [
        {
          title: 'SOP: Nozzle Cleaning',
          snippet: 'Clean nozzles every 8 hours to prevent blockage.',
          source: 'SOPs',
        },
      ]
    );
    expect(result).toContain('[From: findings]');
    expect(result).toContain('[Source: SOPs]');
    expect(result).toContain('Nozzle blockage');
    expect(result).toContain('SOP: Nozzle Cleaning');
  });

  it('includes document entries with source labels when results array is empty', () => {
    const result = formatKnowledgeContext(
      [],
      [
        {
          title: 'Work Instruction: Calibration',
          snippet: 'Calibrate every Monday morning.',
          source: 'SharePoint',
        },
      ]
    );
    expect(result).toContain('Knowledge Base');
    expect(result).toContain('[Source: SharePoint]');
    expect(result).toContain('Work Instruction: Calibration');
    expect(result).toContain('Calibrate every Monday morning.');
  });

  it('truncates document snippets to 400 chars', () => {
    const longSnippet = 'A'.repeat(500);
    const result = formatKnowledgeContext(
      [],
      [
        {
          title: 'Long Document',
          snippet: longSnippet,
          source: 'KB',
        },
      ]
    );
    // The snippet in the output should be at most 400 characters + ellipsis
    expect(result).toContain('A'.repeat(400));
    expect(result).not.toContain('A'.repeat(401));
  });
});

describe('buildCoScoutMessages', () => {
  const baseCtx: AIContext = {
    process: { description: 'Fill weight analysis' },
    filters: [],
    stats: { mean: 10.5, stdDev: 0.5, samples: 100 },
  };

  it('includes system prompt, context, and user message', () => {
    const messages = buildCoScoutMessages(baseCtx, [], 'What does this Cpk mean?');
    expect(messages.length).toBe(3); // system + context + user
    expect(messages[0].role).toBe('system');
    expect(messages[2].role).toBe('user');
    expect(messages[2].content).toBe('What does this Cpk mean?');
  });

  it('includes context summary with stats', () => {
    const messages = buildCoScoutMessages(baseCtx, [], 'question');
    const contextMsg = messages[1];
    expect(contextMsg.content).toContain('Mean=10.50');
  });

  it('includes conversation history', () => {
    const history: CoScoutMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: 1 },
      { id: '2', role: 'assistant', content: 'Hi there', timestamp: 2 },
    ];
    const messages = buildCoScoutMessages(baseCtx, history, 'Follow-up');
    // system + context + 2 history + user = 5
    expect(messages.length).toBe(5);
    expect(messages[2].content).toBe('Hello');
    expect(messages[3].content).toBe('Hi there');
  });

  it('truncates history to last 10 messages', () => {
    const history: CoScoutMessage[] = Array.from({ length: 14 }, (_, i) => ({
      id: String(i),
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Message ${i}`,
      timestamp: i,
    }));
    const messages = buildCoScoutMessages(baseCtx, history, 'Latest');
    // system + context + 10 history + user = 13
    expect(messages.length).toBe(13);
    // First history message should be #4 (14 - 10 = 4)
    expect(messages[2].content).toBe('Message 4');
  });

  it('skips error messages from history', () => {
    const history: CoScoutMessage[] = [
      { id: '1', role: 'user', content: 'Question', timestamp: 1 },
      {
        id: '2',
        role: 'assistant',
        content: 'Error',
        timestamp: 2,
        error: { type: 'network', message: 'Failed', retryable: true },
      },
    ];
    const messages = buildCoScoutMessages(baseCtx, history, 'Retry');
    // system + context + 1 valid history (error skipped) + user = 4
    expect(messages.length).toBe(4);
  });

  it('includes knowledge context when knowledgeResults is populated', () => {
    const ctx: AIContext = {
      ...baseCtx,
      knowledgeResults: [
        {
          projectName: 'Coffee Line 3',
          factor: 'Machine',
          status: 'resolved',
          etaSquared: 0.42,
          cpkBefore: 0.85,
          cpkAfter: 1.45,
          suspectedCause: 'Nozzle blockage',
          actionsText: 'Replaced nozzle weekly',
          outcomeEffective: true,
        },
      ],
    };
    const messages = buildCoScoutMessages(ctx, [], 'Why is variation high?');
    // system + context + knowledge + user = 4
    expect(messages.length).toBe(4);
    const knowledgeMsg = messages[2];
    expect(knowledgeMsg.role).toBe('system');
    expect(knowledgeMsg.content).toContain('Knowledge Base');
    expect(knowledgeMsg.content).toContain('Nozzle blockage');
  });

  it('omits knowledge message when knowledgeResults is undefined', () => {
    const messages = buildCoScoutMessages(baseCtx, [], 'Question');
    // system + context + user = 3
    expect(messages.length).toBe(3);
  });

  it('omits knowledge message when knowledgeResults is empty', () => {
    const ctx: AIContext = { ...baseCtx, knowledgeResults: [] };
    const messages = buildCoScoutMessages(ctx, [], 'Question');
    expect(messages.length).toBe(3);
  });

  it('includes knowledgeDocuments in knowledge message alongside knowledgeResults', () => {
    const ctx: AIContext = {
      ...baseCtx,
      knowledgeResults: [
        {
          projectName: 'Coffee Line 3',
          factor: 'Machine',
          status: 'resolved',
          etaSquared: 0.42,
          cpkBefore: 0.85,
          cpkAfter: 1.45,
          suspectedCause: 'Nozzle blockage',
          actionsText: 'Replaced nozzle weekly',
          outcomeEffective: true,
        },
      ],
      knowledgeDocuments: [
        {
          title: 'SOP: Nozzle Cleaning',
          snippet: 'Clean nozzles every 8 hours.',
          source: 'SOPs',
        },
      ],
    };
    const messages = buildCoScoutMessages(ctx, [], 'Why is variation high?');
    // system + context + knowledge + user = 4
    expect(messages.length).toBe(4);
    const knowledgeMsg = messages[2];
    expect(knowledgeMsg.role).toBe('system');
    expect(knowledgeMsg.content).toContain('Nozzle blockage');
    expect(knowledgeMsg.content).toContain('[From: findings]');
    expect(knowledgeMsg.content).toContain('[Source: SOPs]');
    expect(knowledgeMsg.content).toContain('SOP: Nozzle Cleaning');
  });

  it('includes knowledge message when only knowledgeDocuments is present (no knowledgeResults)', () => {
    const ctx: AIContext = {
      ...baseCtx,
      knowledgeDocuments: [
        {
          title: 'Work Instruction: Calibration',
          snippet: 'Calibrate weekly.',
          source: 'SharePoint',
        },
      ],
    };
    const messages = buildCoScoutMessages(ctx, [], 'How to calibrate?');
    // system + context + knowledge + user = 4
    expect(messages.length).toBe(4);
    const knowledgeMsg = messages[2];
    expect(knowledgeMsg.role).toBe('system');
    expect(knowledgeMsg.content).toContain('[Source: SharePoint]');
    expect(knowledgeMsg.content).toContain('Work Instruction: Calibration');
  });
});

describe('buildReportSystemPrompt', () => {
  it('returns a non-empty system prompt string', () => {
    const prompt = buildReportSystemPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('instructs to write a Markdown report', () => {
    const prompt = buildReportSystemPrompt();
    expect(prompt).toContain('Markdown report');
  });

  it('instructs to never invent data', () => {
    const prompt = buildReportSystemPrompt();
    expect(prompt).toContain('Never invent data');
  });

  it('references quality engineering context', () => {
    const prompt = buildReportSystemPrompt();
    expect(prompt).toContain('quality engineering');
    expect(prompt).toContain('VariScout');
  });
});

describe('buildReportPrompt', () => {
  const mockFinding: Finding = {
    id: 'f1',
    text: 'High variation in Machine B',
    createdAt: Date.now(),
    context: {
      activeFilters: { Machine: ['B'] },
      cumulativeScope: 45.2,
      stats: { mean: 10.5, cpk: 0.85, samples: 100 },
    },
    status: 'analyzed',
    tag: 'key-driver',
    comments: [],
    statusChangedAt: Date.now(),
    hypothesisId: 'h1',
  };

  const mockHypothesis: Hypothesis = {
    id: 'h1',
    text: 'Machine B calibration drift',
    factor: 'Machine',
    status: 'supported',
    linkedFindingIds: ['f1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('includes process description when provided', () => {
    const ctx: AIContext = {
      process: { description: 'Fill weight on Line 3' },
      filters: [],
    };
    const prompt = buildReportPrompt(ctx, [], []);
    expect(prompt).toContain('Fill weight on Line 3');
    expect(prompt).toContain('## Process');
  });

  it('includes problem statement when provided', () => {
    const ctx: AIContext = {
      process: { problemStatement: 'Yield dropping in Q1' },
      filters: [],
    };
    const prompt = buildReportPrompt(ctx, [], []);
    expect(prompt).toContain('Yield dropping in Q1');
    expect(prompt).toContain('## Problem Statement');
  });

  it('includes statistics when provided', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      stats: { mean: 10.5, stdDev: 0.5, samples: 100, cpk: 1.1 },
    };
    const prompt = buildReportPrompt(ctx, [], []);
    expect(prompt).toContain('Mean=10.50');
    expect(prompt).toContain('Cpk=1.10');
    expect(prompt).toContain('## Current Statistics');
  });

  it('includes findings in the prompt', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [mockFinding], [mockHypothesis]);
    expect(prompt).toContain('High variation in Machine B');
    expect(prompt).toContain('ANALYZED');
    expect(prompt).toContain('key-driver');
    expect(prompt).toContain('## Findings');
  });

  it('resolves hypothesis text for findings', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [mockFinding], [mockHypothesis]);
    expect(prompt).toContain('Machine B calibration drift');
    expect(prompt).toContain('supported');
  });

  it('includes cpk from finding context', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [mockFinding], []);
    expect(prompt).toContain('Cpk: 0.85');
  });

  it('sorts key-drivers before other findings', () => {
    const regularFinding: Finding = {
      ...mockFinding,
      id: 'f2',
      text: 'Regular observation',
      tag: undefined,
      createdAt: mockFinding.createdAt + 1000,
    };
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [regularFinding, mockFinding], []);
    const keyDriverPos = prompt.indexOf('High variation in Machine B');
    const regularPos = prompt.indexOf('Regular observation');
    expect(keyDriverPos).toBeLessThan(regularPos);
  });

  it('caps at 20 findings', () => {
    const manyFindings: Finding[] = Array.from({ length: 25 }, (_, i) => ({
      ...mockFinding,
      id: `f${i}`,
      text: `Finding ${i}`,
      tag: undefined,
    }));
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, manyFindings, []);
    expect(prompt).toContain('20 of 25');
  });

  it('includes report generation instructions', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [], []);
    expect(prompt).toContain('Executive Summary');
    expect(prompt).toContain('Root Causes');
    expect(prompt).toContain('Recommendations');
  });

  it('handles empty findings and hypotheses gracefully', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [], []);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('## Findings (0 of 0)');
  });

  it('includes outcome information when present', () => {
    const findingWithOutcome: Finding = {
      ...mockFinding,
      outcome: {
        effective: 'yes',
        cpkAfter: 1.45,
        notes: 'Calibration fixed',
        verifiedAt: Date.now(),
      },
    };
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [findingWithOutcome], []);
    expect(prompt).toContain('Outcome: yes');
    expect(prompt).toContain('Cpk after: 1.45');
  });
});

describe('buildLocaleHint', () => {
  it('returns German hint for de locale', () => {
    const hint = buildLocaleHint('de');
    expect(hint).toContain('Respond in Deutsch');
    expect(hint).toContain('terminology definitions');
  });

  it('returns empty string for en locale', () => {
    expect(buildLocaleHint('en')).toBe('');
  });

  it('returns empty string for undefined locale', () => {
    expect(buildLocaleHint(undefined)).toBe('');
  });

  it('returns Spanish hint for es locale', () => {
    const hint = buildLocaleHint('es');
    expect(hint).toContain('Respond in Español');
  });
});

describe('locale wiring in system prompts', () => {
  it('buildChartInsightSystemPrompt includes locale hint', () => {
    const prompt = buildChartInsightSystemPrompt('fr');
    expect(prompt).toContain('Respond in Français');
    // TERMINOLOGY_INSTRUCTION still present
    expect(prompt).toContain('Terminology rules');
  });

  it('buildChartInsightSystemPrompt without locale has no hint', () => {
    const prompt = buildChartInsightSystemPrompt();
    expect(prompt).not.toContain('LANGUAGE:');
  });

  it('buildCoScoutSystemPrompt includes locale hint', () => {
    const prompt = buildCoScoutSystemPrompt({ locale: 'pt' });
    expect(prompt).toContain('Respond in Português');
    expect(prompt).toContain('CoScout');
  });

  it('buildReportSystemPrompt includes locale hint', () => {
    const prompt = buildReportSystemPrompt('de');
    expect(prompt).toContain('Respond in Deutsch');
    expect(prompt).toContain('Markdown report');
  });

  it('buildReportSystemPrompt without locale has no hint', () => {
    const prompt = buildReportSystemPrompt();
    expect(prompt).not.toContain('LANGUAGE:');
  });

  it('buildCoScoutMessages passes locale through to system prompt', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      locale: 'es',
    };
    const messages = buildCoScoutMessages(ctx, [], 'Hola');
    expect(messages[0].content).toContain('Respond in Español');
  });

  it('buildCoScoutMessages without locale has no hint in system prompt', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
    };
    const messages = buildCoScoutMessages(ctx, [], 'Hello');
    expect(messages[0].content).not.toContain('LANGUAGE:');
  });
});

describe('buildCoScoutTools', () => {
  it('returns base read tool definitions with strict schemas (no phase)', () => {
    const tools = buildCoScoutTools();
    expect(tools.length).toBe(5); // 3 original + get_available_factors + compare_categories
    expect(tools.every(t => t.type === 'function')).toBe(true);
    expect(tools.every(t => t.parameters.strict === true)).toBe(true);
    expect(tools.every(t => t.parameters.additionalProperties === false)).toBe(true);
  });

  it('includes get_chart_data tool', () => {
    const tools = buildCoScoutTools();
    const chartTool = tools.find(t => t.name === 'get_chart_data');
    expect(chartTool).toBeDefined();
    expect(chartTool!.parameters.required).toContain('chart');
  });

  it('includes get_statistical_summary tool', () => {
    const tools = buildCoScoutTools();
    const statsTool = tools.find(t => t.name === 'get_statistical_summary');
    expect(statsTool).toBeDefined();
  });

  it('includes suggest_knowledge_search tool', () => {
    const tools = buildCoScoutTools();
    const kbTool = tools.find(t => t.name === 'suggest_knowledge_search');
    expect(kbTool).toBeDefined();
    expect(kbTool!.description).toContain('Knowledge Base');
    expect(kbTool!.parameters.required).toContain('query');
  });

  // ADR-029: Phase-gating tests
  it('includes get_available_factors and compare_categories as read tools', () => {
    const tools = buildCoScoutTools();
    expect(tools.find(t => t.name === 'get_available_factors')).toBeDefined();
    expect(tools.find(t => t.name === 'compare_categories')).toBeDefined();
  });

  it('adds filter and finding tools in SCOUT phase', () => {
    const tools = buildCoScoutTools({ phase: 'scout' });
    expect(tools.find(t => t.name === 'apply_filter')).toBeDefined();
    expect(tools.find(t => t.name === 'clear_filters')).toBeDefined();
    expect(tools.find(t => t.name === 'create_finding')).toBeDefined();
    // Hypothesis tools should NOT be available in SCOUT
    expect(tools.find(t => t.name === 'create_hypothesis')).toBeUndefined();
  });

  it('adds hypothesis and action tools in INVESTIGATE phase', () => {
    const tools = buildCoScoutTools({ phase: 'investigate' });
    expect(tools.find(t => t.name === 'create_hypothesis')).toBeDefined();
    expect(tools.find(t => t.name === 'suggest_action')).toBeDefined();
    // Sharing tools should NOT be available without Team plan
    expect(tools.find(t => t.name === 'share_finding')).toBeUndefined();
  });

  it('adds sharing tools for Team plan in INVESTIGATE phase', () => {
    const tools = buildCoScoutTools({ phase: 'investigate', isTeamPlan: true });
    expect(tools.find(t => t.name === 'share_finding')).toBeDefined();
    expect(tools.find(t => t.name === 'publish_report')).toBeDefined();
    // notify_action_owners only in IMPROVE
    expect(tools.find(t => t.name === 'notify_action_owners')).toBeUndefined();
  });

  it('adds notify_action_owners in IMPROVE phase for Team plan', () => {
    const tools = buildCoScoutTools({ phase: 'improve', isTeamPlan: true });
    expect(tools.find(t => t.name === 'notify_action_owners')).toBeDefined();
  });

  it('has no action tools in FRAME phase', () => {
    const tools = buildCoScoutTools({ phase: 'frame' });
    expect(tools.find(t => t.name === 'apply_filter')).toBeUndefined();
    expect(tools.find(t => t.name === 'create_finding')).toBeUndefined();
    // Read tools should still be there
    expect(tools.find(t => t.name === 'get_available_factors')).toBeDefined();
    expect(tools.length).toBe(5);
  });

  it('all tools use strict mode and additionalProperties:false', () => {
    const tools = buildCoScoutTools({ phase: 'improve', isTeamPlan: true });
    expect(tools.every(t => t.parameters.strict === true)).toBe(true);
    expect(tools.every(t => t.parameters.additionalProperties === false)).toBe(true);
  });

  it('never exceeds 18 tools (IMPROVE + Team plan)', () => {
    const tools = buildCoScoutTools({ phase: 'improve', isTeamPlan: true });
    expect(tools.length).toBeLessThanOrEqual(18);
  });

  it('includes suggest_improvement_idea in INVESTIGATE phase tools', () => {
    const tools = buildCoScoutTools({ phase: 'investigate' });
    expect(tools.find(t => t.name === 'suggest_improvement_idea')).toBeDefined();
  });

  it('includes suggest_improvement_idea in IMPROVE phase tools', () => {
    const tools = buildCoScoutTools({ phase: 'improve' });
    expect(tools.find(t => t.name === 'suggest_improvement_idea')).toBeDefined();
  });

  it('does not include suggest_improvement_idea in SCOUT phase', () => {
    const tools = buildCoScoutTools({ phase: 'scout' });
    expect(tools.find(t => t.name === 'suggest_improvement_idea')).toBeUndefined();
  });

  it('does not include suggest_improvement_idea in FRAME phase', () => {
    const tools = buildCoScoutTools({ phase: 'frame' });
    expect(tools.find(t => t.name === 'suggest_improvement_idea')).toBeUndefined();
  });

  it('includes suggest_save_finding tool in INVESTIGATE phase', () => {
    const tools = buildCoScoutTools({ phase: 'investigate' });
    const tool = tools.find(t => t.name === 'suggest_save_finding');
    expect(tool).toBeDefined();
    expect(tool!.parameters.properties).toHaveProperty('insight_text');
    expect(tool!.parameters.properties).toHaveProperty('reasoning');
    expect(tool!.parameters.properties).toHaveProperty('suggested_hypothesis_id');
  });

  it('includes suggest_save_finding tool in IMPROVE phase', () => {
    const tools = buildCoScoutTools({ phase: 'improve' });
    expect(tools.find(t => t.name === 'suggest_save_finding')).toBeDefined();
  });

  it('excludes suggest_save_finding in SCOUT phase', () => {
    const tools = buildCoScoutTools({ phase: 'scout' });
    expect(tools.find(t => t.name === 'suggest_save_finding')).toBeUndefined();
  });

  it('excludes suggest_save_finding in FRAME phase', () => {
    const tools = buildCoScoutTools({ phase: 'frame' });
    expect(tools.find(t => t.name === 'suggest_save_finding')).toBeUndefined();
  });

  it('excludes suggest_save_finding when no phase specified', () => {
    const tools = buildCoScoutTools();
    expect(tools.find(t => t.name === 'suggest_save_finding')).toBeUndefined();
  });
});

describe('buildCoScoutInput', () => {
  const baseCtx: AIContext = {
    process: { description: 'Fill weight analysis' },
    filters: [],
    stats: { mean: 10.5, stdDev: 0.5, samples: 100 },
  };

  it('returns instructions and input array', () => {
    const result = buildCoScoutInput(baseCtx, [], 'What does this Cpk mean?');
    expect(result.instructions).toContain('CoScout');
    expect(result.input.length).toBeGreaterThanOrEqual(2); // context + user
    expect(result.input[result.input.length - 1].content).toBe('What does this Cpk mean?');
    expect(result.input[result.input.length - 1].role).toBe('user');
  });

  it('includes context summary in input', () => {
    const result = buildCoScoutInput(baseCtx, [], 'question');
    const contextMsg = result.input[0];
    expect(contextMsg.content).toContain('Mean=10.50');
  });

  it('includes conversation history in input', () => {
    const history: CoScoutMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: 1 },
      { id: '2', role: 'assistant', content: 'Hi there', timestamp: 2 },
    ];
    const result = buildCoScoutInput(baseCtx, history, 'Follow-up');
    // context + 2 history + user = 4
    expect(result.input.length).toBe(4);
  });

  it('includes knowledge context when available', () => {
    const ctx: AIContext = {
      ...baseCtx,
      knowledgeDocuments: [{ title: 'SOP', snippet: 'Clean nozzles.', source: 'SharePoint' }],
    };
    const result = buildCoScoutInput(ctx, [], 'Question');
    const kbMsg = result.input.find(m => m.content.includes('Knowledge Base'));
    expect(kbMsg).toBeDefined();
  });

  it('includes tool routing instructions when journeyPhase is provided', () => {
    const result = buildCoScoutInput(baseCtx, [], 'What should we do?', {
      journeyPhase: 'improve',
    });
    expect(result.instructions).toContain('Tool usage guidance');
    expect(result.instructions).toContain('Action suggestion guidance');
  });

  it('includes entry scenario guidance when journeyPhase and entryScenario are provided', () => {
    const ctx: AIContext = {
      ...baseCtx,
      entryScenario: 'problem',
    };
    const result = buildCoScoutInput(ctx, [], 'Check Cpk', { journeyPhase: 'scout' });
    expect(result.instructions).toContain('Entry scenario: Problem to solve');
  });

  it('does not include tool routing instructions when no journeyPhase', () => {
    const result = buildCoScoutInput(baseCtx, [], 'Hello');
    expect(result.instructions).not.toContain('Tool usage guidance');
  });
});

describe('structured output schemas', () => {
  it('narrationResponseSchema has required fields', () => {
    expect(narrationResponseSchema.required).toContain('text');
    expect(narrationResponseSchema.required).toContain('confidence');
    expect(narrationResponseSchema.additionalProperties).toBe(false);
    expect(narrationResponseSchema.properties.confidence.enum).toEqual(['low', 'moderate', 'high']);
  });

  it('chartInsightResponseSchema has required text field', () => {
    expect(chartInsightResponseSchema.required).toContain('text');
    expect(chartInsightResponseSchema.additionalProperties).toBe(false);
  });
});

describe('prompt caching threshold', () => {
  it('CoScout system prompt without glossary exceeds 500 estimated tokens', () => {
    // Base prompt is substantial — the static role + methodology text
    const prompt = buildCoScoutSystemPrompt();
    const estTokens = Math.ceil(prompt.length / 4);
    expect(estTokens).toBeGreaterThanOrEqual(500);
  });

  it('CoScout system prompt with glossary exceeds 1024 estimated tokens', () => {
    // Production glossary is ~30+ terms; simulate realistic size
    const terms = Array.from(
      { length: 30 },
      (_, i) =>
        `- **Term${i}**: A quality engineering concept used in statistical process control and variation analysis for manufacturing processes`
    ).join('\n');
    const glossary = `## Terminology\n\n${terms}`;
    const prompt = buildCoScoutSystemPrompt({ glossaryFragment: glossary });
    const estTokens = Math.ceil(prompt.length / 4);
    expect(estTokens).toBeGreaterThanOrEqual(1024);
  });

  it('Narration system prompt is compact without glossary', () => {
    // Narration without glossary is intentionally small — glossary pushes it over
    const prompt = buildNarrationSystemPrompt();
    const estTokens = Math.ceil(prompt.length / 4);
    // Narration system prompt is short by design; caching relies on `store: true`
    expect(estTokens).toBeGreaterThan(0);
  });
});
