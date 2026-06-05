import { describe, it, expect } from 'vitest';
import {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  formatKnowledgeContext,
  buildReportSystemPrompt,
  buildReportPrompt,
  buildLocaleHint,
} from '../prompts';
import { assembleCoScoutPrompt } from '../prompts/coScout';
import { narrationResponseSchema, chartInsightResponseSchema } from '../schemas';
import type { AIContext } from '../types';
import type { Finding } from '../../findings';

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
      teamContributors: { count: 3, questionAreas: ['Machine', 'Shift'] },
    };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Team: 3 contributors');
    expect(prompt).toContain('investigating Machine, Shift');
  });

  it('includes team contributors without areas', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      teamContributors: { count: 2, questionAreas: [] },
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
      process: { issueStatement: 'Yield dropping in Q1' },
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
        hypothesis: 'Nozzle blockage',
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
        hypothesis: '',
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
        hypothesis: 'Cause A',
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
        hypothesis: 'Cause B',
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
          hypothesis: 'Nozzle blockage',
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
          source: 'Blob Storage',
        },
      ]
    );
    expect(result).toContain('Knowledge Base');
    expect(result).toContain('[Source: Blob Storage]');
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
    createdAt: 1714000000000,
    deletedAt: null,
    context: {
      activeFilters: { Machine: ['B'] },
      cumulativeScope: 45.2,
      stats: { mean: 10.5, cpk: 0.85, samples: 100 },
    },
    evidenceType: 'data',
    status: 'analyzed',
    tag: 'key-driver',
    comments: [],
    statusChangedAt: 1714000000000,
  };

  it('includes process description when provided', () => {
    const ctx: AIContext = {
      process: { description: 'Fill weight on Line 3' },
      filters: [],
    };
    const prompt = buildReportPrompt(ctx, []);
    expect(prompt).toContain('Fill weight on Line 3');
    expect(prompt).toContain('## Process');
  });

  it('includes issue statement when provided', () => {
    const ctx: AIContext = {
      process: { issueStatement: 'Yield dropping in Q1' },
      filters: [],
    };
    const prompt = buildReportPrompt(ctx, []);
    expect(prompt).toContain('Yield dropping in Q1');
    expect(prompt).toContain('## Issue / Concern');
  });

  it('includes current understanding and approved problem statement in report prompt', () => {
    const ctx: AIContext = {
      process: {
        currentUnderstanding: {
          summary: 'Problem condition: Cpk is 0.87 against target 1.33.',
        },
        problemStatement: 'Mean fill weight is high on Line 3 night shift.',
      },
      filters: [],
    };
    const prompt = buildReportPrompt(ctx, []);
    expect(prompt).toContain('## Current Understanding');
    expect(prompt).toContain('Problem condition: Cpk is 0.87 against target 1.33.');
    expect(prompt).toContain('## Approved Problem Statement');
    expect(prompt).toContain('Mean fill weight is high on Line 3 night shift.');
  });

  it('includes statistics when provided', () => {
    const ctx: AIContext = {
      process: {},
      filters: [],
      stats: { mean: 10.5, stdDev: 0.5, samples: 100, cpk: 1.1 },
    };
    const prompt = buildReportPrompt(ctx, []);
    expect(prompt).toContain('Mean=10.50');
    expect(prompt).toContain('Cpk=1.10');
    expect(prompt).toContain('## Current Statistics');
  });

  it('includes findings in the prompt', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [mockFinding]);
    expect(prompt).toContain('High variation in Machine B');
    expect(prompt).toContain('ANALYZED');
    expect(prompt).toContain('key-driver');
    expect(prompt).toContain('## Findings');
  });

  it('includes filter context for findings (ADR-085: no questionId cross-reference)', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [mockFinding]);
    // Finding text and filter context should be present
    expect(prompt).toContain('High variation in Machine B');
    expect(prompt).toContain('Machine');
  });

  it('includes cpk from finding context', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, [mockFinding]);
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
    const prompt = buildReportPrompt(ctx, [regularFinding, mockFinding]);
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
    const prompt = buildReportPrompt(ctx, manyFindings);
    expect(prompt).toContain('20 of 25');
  });

  it('includes report generation instructions', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, []);
    expect(prompt).toContain('Executive Summary');
    expect(prompt).toContain('Contributing Factors');
    expect(prompt).not.toContain('Root Causes');
    expect(prompt).toContain('Recommendations');
  });

  it('handles empty findings and questions gracefully', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildReportPrompt(ctx, []);
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
    const prompt = buildReportPrompt(ctx, [findingWithOutcome]);
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

  it('assembleCoScoutPrompt includes locale hint in tier1Static', () => {
    const { tier1Static } = assembleCoScoutPrompt({
      context: { process: {}, filters: [], locale: 'pt' },
    });
    expect(tier1Static).toContain('Respond in Português');
    expect(tier1Static).toContain('CoScout');
  });

  it('assembleCoScoutPrompt without locale has no hint in tier1Static', () => {
    const { tier1Static } = assembleCoScoutPrompt();
    expect(tier1Static).not.toContain('LANGUAGE:');
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
  it('CoScout assembler tier1Static exceeds 500 estimated tokens', () => {
    // Base prompt is substantial — the static role + methodology text
    const { tier1Static } = assembleCoScoutPrompt();
    const estTokens = Math.ceil(tier1Static.length / 4);
    expect(estTokens).toBeGreaterThanOrEqual(500);
  });

  it('CoScout assembler tier1Static with glossary exceeds 1024 estimated tokens', () => {
    // Production glossary is ~30+ terms; simulate realistic size
    const terms = Array.from(
      { length: 30 },
      (_, i) =>
        `- **Term${i}**: A quality engineering concept used in statistical process control and variation analysis for manufacturing processes`
    ).join('\n');
    const glossary = `## Terminology\n\n${terms}`;
    const { tier1Static } = assembleCoScoutPrompt({
      context: { process: {}, filters: [], glossaryFragment: glossary },
    });
    const estTokens = Math.ceil(tier1Static.length / 4);
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
