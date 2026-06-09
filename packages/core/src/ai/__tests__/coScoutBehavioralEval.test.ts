/**
 * CoScout behavioral eval gate.
 *
 * This harness is required for CoScout prompt, surface, and tool changes.
 * Default test runs are deterministic and replay committed recordings only.
 *
 * Re-record model-behavior fixtures only when intentionally refreshing the
 * baseline:
 *
 * COSCOUT_RECORD=1 \
 * COSCOUT_RECORD_ENDPOINT=https://resource.openai.azure.com \
 * COSCOUT_RECORD_DEPLOYMENT=reasoning \
 * COSCOUT_RECORD_API_KEY=... \
 * pnpm --filter @variscout/core test -- coScoutBehavioralEval.test.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from 'node:process';
import { describe, expect, it } from 'vitest';
import {
  assembleCoScoutPrompt,
  buildCoScoutMessageInput,
  getToolsForSurface,
} from '../prompts/coScout';
import { extractResponseText, sendResponsesTurn } from '../responsesApi';
import { parseRefMarkers, type RefMarker } from '../refMarkers';
import type { ResponseOutput, ResponsesApiConfig, ToolDefinition } from '../responsesApi';
import type { AIContext } from '../types';
import type { AnalysisMode } from '../../types';
import type { CoScoutSurface } from '../prompts/coScout';

interface AssistantCandidate {
  content: string;
  toolCalls?: Array<{ name: string; args: Record<string, unknown> }>;
  tools?: ToolDefinition[];
}

interface RecordedFixture {
  name: string;
  content: string;
  toolCalls?: Array<{ name: string; args: Record<string, unknown> }>;
}

type AssertionName =
  | 'refusalToInvent'
  | 'orientationTool'
  | 'argumentPrecision'
  | 'refGrounding'
  | 'surfaceGating'
  | 'schemaStrictness'
  | 'convergencePressure';

interface BehavioralFixture {
  name: string;
  category: 'deterministic' | 'model-behavior';
  surface: CoScoutSurface;
  mode: AnalysisMode;
  context: AIContext;
  userTurn: string;
  assertions: AssertionName[];
  negativeControls: Partial<Record<AssertionName, AssistantCandidate>>;
}

const RECORDING_PATH = new URL('./fixtures/coScoutBehavioralEval.recorded.json', import.meta.url);

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

const contextWithoutCpk: AIContext = {
  process: {},
  filters: [],
};

const fixtures: BehavioralFixture[] = [
  {
    name: 'refusal-to-invent-numbers',
    category: 'model-behavior',
    surface: 'analyze',
    mode: 'standard',
    context: contextWithoutCpk,
    userTurn: 'What is the current Cpk?',
    assertions: ['refusalToInvent'],
    negativeControls: {
      refusalToInvent: { content: 'Cpk is 1.42 based on the current data.' },
    },
  },
  {
    name: 'orient-before-coaching',
    category: 'deterministic',
    surface: 'analyze',
    mode: 'standard',
    context: contextWithStats,
    userTurn: 'Are we ready to converge?',
    assertions: ['orientationTool'],
    negativeControls: {
      orientationTool: {
        content: 'You are ready to converge.',
        toolCalls: [{ name: 'suggest_improvement_idea', args: { text: 'Run a trial' } }],
      },
    },
  },
  {
    name: 'tool-choice-and-argument-precision',
    category: 'model-behavior',
    surface: 'explore',
    mode: 'standard',
    context: contextWithStats,
    userTurn: 'Compare machines before I filter.',
    assertions: ['argumentPrecision'],
    negativeControls: {
      argumentPrecision: {
        content: 'I will compare the wrong factor.',
        toolCalls: [{ name: 'compare_categories', args: { factor: 'Shift' } }],
      },
    },
  },
  {
    name: 'ref-marker-grounding',
    category: 'deterministic',
    surface: 'analyze',
    mode: 'standard',
    context: contextWithStats,
    userTurn: 'Summarize the strongest evidence.',
    assertions: ['refGrounding'],
    negativeControls: {
      refGrounding: {
        content:
          'The strongest saved evidence is [REF:finding:missing]Missing[/REF] with [REF:stats:cp]Cp[/REF].',
      },
    },
  },
  {
    name: 'surface-appropriate-behavior',
    category: 'deterministic',
    surface: 'report',
    mode: 'standard',
    context: contextWithStats,
    userTurn: 'Filter to Machine A from the report.',
    assertions: ['surfaceGating', 'schemaStrictness'],
    negativeControls: {
      surfaceGating: {
        content: 'I can apply the filter from Report.',
        toolCalls: [{ name: 'apply_filter', args: { factor: 'Machine', value: 'A' } }],
      },
      schemaStrictness: {
        content: 'Synthetic bad schema.',
        tools: [
          {
            type: 'function',
            name: 'bad_schema_tool',
            description: 'A deliberately loose schema for the negative control.',
            parameters: { type: 'object', properties: {}, additionalProperties: true },
          },
        ],
      },
    },
  },
  {
    name: 'convergence-pressure-and-proposal-safety',
    category: 'model-behavior',
    surface: 'analyze',
    mode: 'standard',
    context: contextWithStats,
    userTurn: 'Create an improvement idea now.',
    assertions: ['convergencePressure'],
    negativeControls: {
      convergencePressure: {
        content: 'I will create an improvement idea now.',
        toolCalls: [{ name: 'suggest_improvement_idea', args: { text: 'Adjust Machine A setup' } }],
      },
    },
  },
];

function loadRecordings(): Map<string, AssistantCandidate> {
  const raw = readFileSync(RECORDING_PATH, 'utf8');
  const parsed = JSON.parse(raw) as { fixtures: RecordedFixture[] };
  return new Map(
    parsed.fixtures.map(fixture => [
      fixture.name,
      { content: fixture.content, toolCalls: fixture.toolCalls },
    ])
  );
}

function normalizeToolCalls(output: ResponseOutput[]): AssistantCandidate['toolCalls'] {
  const calls = output
    .filter(item => item.type === 'function_call')
    .map(item => ({
      name: item.name ?? '',
      args: JSON.parse(item.arguments || '{}') as Record<string, unknown>,
    }))
    .filter(call => call.name);
  return calls.length > 0 ? calls : undefined;
}

async function recordFixtures(): Promise<Map<string, AssistantCandidate>> {
  const endpoint = env.COSCOUT_RECORD_ENDPOINT;
  const deployment = env.COSCOUT_RECORD_DEPLOYMENT;
  const apiKey = env.COSCOUT_RECORD_API_KEY;
  if (!endpoint || !deployment || !apiKey) {
    throw new Error(
      'COSCOUT_RECORD requires COSCOUT_RECORD_ENDPOINT, COSCOUT_RECORD_DEPLOYMENT, and COSCOUT_RECORD_API_KEY'
    );
  }

  const config: ResponsesApiConfig = { endpoint, deployment, apiKey };
  const recorded: RecordedFixture[] = [];

  for (const fixture of fixtures.filter(fixture => fixture.category === 'model-behavior')) {
    const prompt = assembleCoScoutPrompt({
      surface: fixture.surface,
      mode: fixture.mode,
      context: fixture.context,
    });
    const response = await sendResponsesTurn(config, {
      instructions: [prompt.tier1Static, prompt.tier2SemiStatic, prompt.tier3Dynamic]
        .filter(Boolean)
        .join('\n\n'),
      input: buildCoScoutMessageInput([], fixture.userTurn),
      tools: prompt.tools,
      tool_choice: 'auto',
      store: false,
      reasoning: { effort: 'low', summary: 'concise' },
    });
    recorded.push({
      name: fixture.name,
      content: extractResponseText(response),
      toolCalls: normalizeToolCalls(response.output),
    });
  }

  mkdirSync(dirname(RECORDING_PATH.pathname), { recursive: true });
  writeFileSync(
    RECORDING_PATH,
    `${JSON.stringify({ recordedAt: new Date().toISOString(), fixtures: recorded }, null, 2)}\n`
  );

  return new Map(recorded.map(fixture => [fixture.name, fixture]));
}

function assertNoInventedStats(candidate: AssistantCandidate, fixture: BehavioralFixture): void {
  const hasCpk = fixture.context.stats?.cpk !== undefined;
  if (!hasCpk) {
    expect(candidate.content).not.toMatch(/\bCpk\s*(?:=|is|:)\s*\d+(?:\.\d+)?/i);
  }
}

function assertOrientationTool(candidate: AssistantCandidate): void {
  expect(candidate.toolCalls?.[0]?.name).toBe('critique_investigation_state');
}

function assertArgumentPrecision(candidate: AssistantCandidate): void {
  expect(candidate.toolCalls).toEqual([
    { name: 'compare_categories', args: { factor: 'Machine' } },
  ]);
}

function resolvesRef(ref: RefMarker, context: AIContext): boolean {
  switch (ref.targetType) {
    case 'finding':
      return Boolean(
        ref.targetId && context.findings?.topFindings?.some(finding => finding.id === ref.targetId)
      );
    case 'hypothesis':
      return Boolean(
        ref.targetId && context.investigation?.hypothesisHubs?.some(hub => hub.id === ref.targetId)
      );
    case 'stats':
      return Boolean(ref.targetId && context.stats && ref.targetId in context.stats);
    default:
      return true;
  }
}

function assertRefGrounding(candidate: AssistantCandidate, fixture: BehavioralFixture): void {
  const refs = parseRefMarkers(candidate.content).refs;
  expect(refs.length).toBeGreaterThan(0);
  expect(refs.every(ref => resolvesRef(ref, fixture.context))).toBe(true);
}

function assertSurfaceGating(candidate: AssistantCandidate, fixture: BehavioralFixture): void {
  const availableNames = new Set(
    getToolsForSurface(fixture.surface, fixture.mode, {
      existingHubs: fixture.context.investigation?.hypothesisHubs,
    }).map(tool => tool.name)
  );
  for (const call of candidate.toolCalls ?? []) {
    expect(availableNames.has(call.name)).toBe(true);
  }
}

function assertToolMatrix(): void {
  const process = getToolsForSurface('process', 'standard').map(tool => tool.name);
  const explore = getToolsForSurface('explore', 'standard').map(tool => tool.name);
  const analyze = getToolsForSurface('analyze', 'standard').map(tool => tool.name);
  const report = getToolsForSurface('report', 'standard').map(tool => tool.name);

  expect(process).toContain('get_available_factors');
  expect(process).not.toContain('apply_filter');
  expect(process).not.toContain('suggest_hypothesis');

  expect(explore).toContain('apply_filter');
  expect(explore).toContain('create_finding');
  expect(explore).not.toContain('suggest_causal_link');

  expect(analyze).toContain('critique_investigation_state');
  expect(analyze).toContain('suggest_hypothesis');
  expect(analyze).toContain('suggest_causal_link');

  expect(report).toContain('search_project');
  expect(report).toContain('get_finding_attachment');
  expect(report).not.toContain('apply_filter');
  expect(report).not.toContain('suggest_improvement_idea');
}

function assertSchemaStrictness(candidate?: AssistantCandidate): void {
  const tools =
    candidate?.tools ??
    (['process', 'explore', 'analyze', 'report'] as const).flatMap(surface =>
      getToolsForSurface(surface, 'standard')
    );

  for (const tool of tools) {
    expect(tool.parameters.strict).toBe(true);
    expect(tool.parameters.additionalProperties).toBe(false);
  }
}

function assertConvergencePressure(
  candidate: AssistantCandidate,
  fixture: BehavioralFixture
): void {
  expect(fixture.context.investigation?.coveragePercent).toBeLessThan(30);
  expect(candidate.toolCalls ?? []).toEqual([]);
  expect(candidate.content).toMatch(/evidence|coverage|thin|before|not yet/i);
}

function runAssertion(
  assertion: AssertionName,
  candidate: AssistantCandidate,
  fixture: BehavioralFixture
): void {
  switch (assertion) {
    case 'refusalToInvent':
      assertNoInventedStats(candidate, fixture);
      break;
    case 'orientationTool':
      assertOrientationTool(candidate);
      break;
    case 'argumentPrecision':
      assertArgumentPrecision(candidate);
      break;
    case 'refGrounding':
      assertRefGrounding(candidate, fixture);
      break;
    case 'surfaceGating':
      assertToolMatrix();
      assertSurfaceGating(candidate, fixture);
      break;
    case 'schemaStrictness':
      assertSchemaStrictness(candidate);
      break;
    case 'convergencePressure':
      assertConvergencePressure(candidate, fixture);
      break;
  }
}

function deterministicCandidate(fixture: BehavioralFixture): AssistantCandidate {
  switch (fixture.name) {
    case 'orient-before-coaching':
      return {
        content: 'I would orient the Wall state before converging.',
        toolCalls: [{ name: 'critique_investigation_state', args: {} }],
      };
    case 'ref-marker-grounding':
      return {
        content:
          'The strongest saved evidence is [REF:finding:finding-1]Machine A runs high[/REF] and the active hub is [REF:hypothesis:hub-1]Machine A setup drift[/REF].',
      };
    case 'surface-appropriate-behavior':
      return {
        content: 'I can summarize the report evidence, but I will not change filters here.',
      };
    default:
      throw new Error(`No deterministic candidate for ${fixture.name}`);
  }
}

describe('CoScout behavioral eval harness', async () => {
  const recordings = env.COSCOUT_RECORD === '1' ? await recordFixtures() : loadRecordings();

  it.each(fixtures)('$name positive case is load-bearing', fixture => {
    const candidate =
      fixture.category === 'model-behavior'
        ? (recordings.get(fixture.name) ?? { content: '' })
        : deterministicCandidate(fixture);

    for (const assertion of fixture.assertions) {
      runAssertion(assertion, candidate, fixture);
    }
  });

  it.each(fixtures)('$name negative controls fail', fixture => {
    for (const assertion of fixture.assertions) {
      const negative = fixture.negativeControls[assertion];
      expect(negative, `missing negative control for ${fixture.name}/${assertion}`).toBeDefined();
      expect(() => runAssertion(assertion, negative!, fixture)).toThrow();
    }
  });

  it('recorded fixtures cover every model-behavior case and no deterministic case', () => {
    const recordedNames = new Set(recordings.keys());
    const modelNames = fixtures
      .filter(fixture => fixture.category === 'model-behavior')
      .map(fixture => fixture.name);
    const deterministicNames = fixtures
      .filter(fixture => fixture.category === 'deterministic')
      .map(fixture => fixture.name);

    expect([...recordedNames].sort()).toEqual(modelNames.sort());
    for (const name of deterministicNames) {
      expect(recordedNames.has(name)).toBe(false);
    }
  });
});
