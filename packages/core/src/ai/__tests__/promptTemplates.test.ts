import { describe, it, expect } from 'vitest';
import {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  buildChartInsightPrompt,
  buildCoScoutSystemPrompt,
  buildCoScoutMessages,
} from '../promptTemplates';
import type { AIContext, CoScoutMessage } from '../types';

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

  it('handles minimal context', () => {
    const ctx: AIContext = { process: {}, filters: [] };
    const prompt = buildSummaryPrompt(ctx);
    expect(prompt).toContain('Summarize');
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
    const prompt = buildCoScoutSystemPrompt('## Terminology\n\n- **Cp**: Process potential');
    expect(prompt).toContain('## Terminology');
    expect(prompt).toContain('Cp');
  });

  it('includes problem statement when investigation context provided', () => {
    const prompt = buildCoScoutSystemPrompt(undefined, {
      problemStatement: 'Customer complaints up 30%',
    });
    expect(prompt).toContain('Customer complaints up 30%');
    expect(prompt).toContain('investigating');
  });

  it('includes hypotheses when investigation context has them', () => {
    const prompt = buildCoScoutSystemPrompt(undefined, {
      allHypotheses: [
        { text: 'Night shift training gap', status: 'supported' },
        { text: 'Material batch variation', status: 'untested' },
      ],
    });
    expect(prompt).toContain('Night shift training gap');
    expect(prompt).toContain('supported');
    expect(prompt).toContain('Material batch variation');
  });

  it('includes target and progress when investigation has them', () => {
    const prompt = buildCoScoutSystemPrompt(undefined, {
      targetMetric: 'cpk',
      targetValue: 1.33,
      currentValue: 0.95,
      progressPercent: 42,
    });
    expect(prompt).toContain('cpk');
    expect(prompt).toContain('1.33');
    expect(prompt).toContain('42%');
  });

  it('includes phase-specific instructions', () => {
    const prompt = buildCoScoutSystemPrompt(undefined, {
      phase: 'diverging',
    });
    expect(prompt).toContain('diverging');
    expect(prompt).toContain('multiple hypotheses');
  });

  it('does not add investigation section when no investigation context', () => {
    const prompt = buildCoScoutSystemPrompt();
    expect(prompt).not.toContain('Investigation context');
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
});
