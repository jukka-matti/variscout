import { describe, expect, it } from 'vitest';
import { TOOL_REGISTRY, getToolsForSurface } from '../prompts/coScout/tools';
import type { CoScoutSurface } from '../prompts/coScout';
import type { Hypothesis } from '../../findings/types';

const READ_TOOLS = [
  'get_chart_data',
  'get_statistical_summary',
  'search_knowledge_base',
  'get_available_factors',
  'critique_investigation_state',
  'compare_categories',
  'get_finding_attachment',
  'search_project',
];

const DEAD_TOOLS = [
  'switch_factor',
  'propose_hypothesis_from_finding',
  'spark_brainstorm_ideas',
  'share_finding',
  'publish_report',
  'notify_action_owners',
];

function toolNames(tools: { name: string }[]): string[] {
  return tools.map(t => t.name);
}

function schemaText(value: unknown): string {
  return JSON.stringify(value);
}

describe('TOOL_REGISTRY', () => {
  it('advertises only executable tools', () => {
    for (const name of DEAD_TOOLS) {
      expect(TOOL_REGISTRY[name]).toBeUndefined();
    }
  });

  it('classifies read tools as read and declares surfaces', () => {
    for (const name of READ_TOOLS) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].classification).toBe('read');
      expect(TOOL_REGISTRY[name].surfaces.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a valid ToolDefinition with matching name', () => {
    for (const [key, entry] of Object.entries(TOOL_REGISTRY)) {
      expect(entry.definition.type).toBe('function');
      expect(entry.definition.name).toBe(key);
      expect(entry.definition.parameters).toBeDefined();
      expect(
        entry.surfaces.every(surface =>
          ['process', 'explore', 'analyze', 'report'].includes(surface)
        )
      ).toBe(true);
    }
  });

  it('purges retired Question vocabulary from tool schemas', () => {
    for (const entry of Object.values(TOOL_REGISTRY)) {
      const text = schemaText(entry.definition.parameters).toLowerCase();
      expect(text).not.toContain('question');
      expect(text).not.toContain('question_id');
      expect(text).not.toContain('question_status');
    }
  });
});

describe('getToolsForSurface', () => {
  it.each<CoScoutSurface>(['process', 'explore', 'analyze', 'report'])(
    'returns function definitions for %s',
    surface => {
      const tools = getToolsForSurface(surface, 'standard');
      expect(tools.length).toBeGreaterThan(0);
      for (const tool of tools) {
        expect(tool.type).toBe('function');
        expect(typeof tool.name).toBe('string');
      }
    }
  );

  it('Process is orientation/read-only', () => {
    const names = toolNames(getToolsForSurface('process', 'standard'));
    expect(names).toContain('get_statistical_summary');
    expect(names).toContain('get_available_factors');
    expect(names).not.toContain('apply_filter');
    expect(names).not.toContain('create_finding');
  });

  it('Explore can propose filters and findings', () => {
    const names = toolNames(getToolsForSurface('explore', 'standard'));
    expect(names).toContain('apply_filter');
    expect(names).toContain('create_finding');
    expect(names).toContain('search_project');
    expect(names).not.toContain('suggest_causal_link');
  });

  it('Analyze includes Wall orientation and convergence tools', () => {
    const names = toolNames(getToolsForSurface('analyze', 'standard'));
    expect(names).toContain('critique_investigation_state');
    expect(names).toContain('suggest_hypothesis');
    expect(names).toContain('suggest_causal_link');
    expect(names).toContain('highlight_map_pattern');
  });

  it('Report is communication/read-oriented', () => {
    const names = toolNames(getToolsForSurface('report', 'standard'));
    expect(names).toContain('search_project');
    expect(names).toContain('get_finding_attachment');
    expect(names).not.toContain('apply_filter');
    expect(names).not.toContain('suggest_improvement_idea');
  });

  it('connect_hub_evidence requires existing hubs', () => {
    const withoutHubs = getToolsForSurface('analyze', 'standard');
    expect(toolNames(withoutHubs)).not.toContain('connect_hub_evidence');

    const withHubs = getToolsForSurface('analyze', 'standard', {
      existingHubs: [
        {
          id: 'hub-1',
          name: 'Test Hub',
          synthesis: '',
          findingIds: [],
        } as unknown as Hypothesis,
      ],
    });
    expect(toolNames(withHubs)).toContain('connect_hub_evidence');
  });
});
