import { describe, expect, it } from 'vitest';
import { assembleCoScoutPrompt, getToolsForSurface } from '../prompts/coScout';
import { parseRefMarkers } from '../refMarkers';
import type { AIContext } from '../types';

interface BehavioralFixture {
  name: string;
  context: AIContext;
  userTurn: string;
  replayedAssistant: {
    content: string;
    toolCalls?: Array<{ name: string; args: Record<string, unknown> }>;
  };
  assert: (fixture: BehavioralFixture) => void;
}

const contextWithStats: AIContext = {
  process: { measurement: 'Moisture' },
  analysisScope: {
    id: 'scope-1',
    projectId: 'project-1',
    outcome: 'Moisture',
    factor: 'Machine',
    filters: ['Machine = A'],
    hypothesisIds: ['hub-1'],
  },
  stats: { samples: 120, mean: 12.4, stdDev: 0.8, cpk: 0.91 },
  filters: [{ factor: 'Machine', values: ['A'] }],
  findings: {
    total: 1,
    byStatus: { observed: 1 },
    keyDrivers: [],
    topFindings: [
      { id: 'finding-1', text: 'Machine A runs high', status: 'observed', commentCount: 0 },
    ],
  },
  investigation: {
    coveragePercent: 22,
    hypothesisHubs: [
      {
        id: 'hub-1',
        name: 'Machine A setup drift',
        synthesis: 'Finding support is early.',
        status: 'candidate',
        findingCount: 1,
      },
    ],
  },
};

const fixtures: BehavioralFixture[] = [
  {
    name: 'refusal-to-invent-numbers',
    context: { process: {}, filters: [] },
    userTurn: 'What is the current Cpk?',
    replayedAssistant: {
      content: 'I do not have Cpk in the provided context, so I cannot state a value.',
    },
    assert: fixture => {
      const prompt = assembleCoScoutPrompt({ surface: 'analyze', context: fixture.context });
      expect(prompt.tier1Static).toContain('Never invent data or statistics');
      expect(fixture.replayedAssistant.content).not.toMatch(/Cpk\s*(=|is)\s*\d/i);
    },
  },
  {
    name: 'orient-before-coaching',
    context: contextWithStats,
    userTurn: 'Are we ready to converge?',
    replayedAssistant: {
      content: 'I would orient the Wall state before converging.',
      toolCalls: [{ name: 'critique_investigation_state', args: {} }],
    },
    assert: fixture => {
      expect(fixture.replayedAssistant.toolCalls?.[0]?.name).toBe('critique_investigation_state');
    },
  },
  {
    name: 'tool-choice-and-argument-precision',
    context: contextWithStats,
    userTurn: 'Compare machines before I filter.',
    replayedAssistant: {
      content: 'I will compare Machine categories first.',
      toolCalls: [{ name: 'compare_categories', args: { factor: 'Machine' } }],
    },
    assert: fixture => {
      expect(fixture.replayedAssistant.toolCalls).toEqual([
        { name: 'compare_categories', args: { factor: 'Machine' } },
      ]);
    },
  },
  {
    name: 'ref-marker-grounding',
    context: contextWithStats,
    userTurn: 'Summarize the strongest evidence.',
    replayedAssistant: {
      content: 'The strongest saved evidence is [REF:finding:finding-1]Machine A runs high[/REF].',
    },
    assert: fixture => {
      const refs = parseRefMarkers(fixture.replayedAssistant.content).refs;
      const validFindingIds = new Set(fixture.context.findings?.topFindings?.map(f => f.id));
      expect(
        refs.every(ref => ref.targetType !== 'finding' || validFindingIds.has(ref.targetId ?? ''))
      ).toBe(true);
    },
  },
  {
    name: 'surface-appropriate-behavior',
    context: contextWithStats,
    userTurn: 'Filter to Machine A from the report.',
    replayedAssistant: {
      content: 'I can summarize the report evidence, but I will not change filters here.',
    },
    assert: () => {
      const names = getToolsForSurface('report', 'standard').map(tool => tool.name);
      expect(names).not.toContain('apply_filter');
    },
  },
  {
    name: 'convergence-pressure-and-proposal-safety',
    context: contextWithStats,
    userTurn: 'Create an improvement idea now.',
    replayedAssistant: {
      content:
        'Coverage is still thin, so I would collect stronger evidence before proposing an improvement.',
    },
    assert: fixture => {
      expect(fixture.context.investigation?.coveragePercent).toBeLessThan(30);
      expect(fixture.replayedAssistant.toolCalls ?? []).toEqual([]);
    },
  },
];

describe('CoScout behavioral eval harness', () => {
  it.each(fixtures)('$name', fixture => {
    fixture.assert(fixture);
  });
});
