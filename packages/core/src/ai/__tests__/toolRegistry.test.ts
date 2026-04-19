import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY, getToolsForPhase } from '../prompts/coScout/tools';
import type { SuspectedCause } from '../../findings/types';

// ── Helpers ────────────────────────────────────────────────────────────

const READ_TOOLS = [
  'get_chart_data',
  'get_statistical_summary',
  'search_knowledge_base',
  'get_available_factors',
  'compare_categories',
  'get_finding_attachment',
  'search_project',
];

const SCOUT_ACTION_TOOLS = [
  'apply_filter',
  'switch_factor',
  'clear_filters',
  'create_finding',
  'navigate_to',
];

const INVESTIGATE_ACTION_TOOLS = [
  'create_question',
  'answer_question',
  'suggest_suspected_cause',
  'connect_hub_evidence',
  'suggest_improvement_idea',
  'suggest_action',
  'spark_brainstorm_ideas',
  'suggest_save_finding',
  'suggest_causal_link',
  'highlight_map_pattern',
];

const TEAM_TOOLS = ['share_finding', 'publish_report', 'notify_action_owners'];

function toolNames(tools: { name: string }[]): string[] {
  return tools.map(t => t.name);
}

// ── Registry structure ─────────────────────────────────────────────────

describe('TOOL_REGISTRY', () => {
  it('contains all expected read tools classified as read', () => {
    // search_project is SCOUT+ read tool
    const alwaysRead = READ_TOOLS.filter(n => n !== 'search_project');
    for (const name of alwaysRead) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].classification).toBe('read');
      expect(TOOL_REGISTRY[name].phases).toContain('frame');
    }
  });

  it('classifies search_project as read with scout+ phases', () => {
    const entry = TOOL_REGISTRY['search_project'];
    expect(entry.classification).toBe('read');
    expect(entry.phases).toContain('scout');
    expect(entry.phases).not.toContain('frame');
  });

  it('contains all SCOUT+ action tools classified as action', () => {
    for (const name of SCOUT_ACTION_TOOLS) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].classification).toBe('action');
      expect(TOOL_REGISTRY[name].phases).toContain('scout');
    }
  });

  it('contains all INVESTIGATE+ action tools with investigate in phases', () => {
    for (const name of INVESTIGATE_ACTION_TOOLS) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].phases).toContain('investigate');
    }
  });

  it('marks team tools with tier: team', () => {
    for (const name of TEAM_TOOLS) {
      expect(TOOL_REGISTRY[name]).toBeDefined();
      expect(TOOL_REGISTRY[name].tier).toBe('team');
    }
  });

  it('notify_action_owners is IMPROVE-only', () => {
    const entry = TOOL_REGISTRY['notify_action_owners'];
    expect(entry.phases).toEqual(['improve']);
  });

  it('every entry has a valid ToolDefinition with type function', () => {
    for (const [key, entry] of Object.entries(TOOL_REGISTRY)) {
      expect(entry.definition.type).toBe('function');
      expect(entry.definition.name).toBe(key);
      expect(entry.definition.parameters).toBeDefined();
    }
  });
});

// ── getToolsForPhase ───────────────────────────────────────────────────

describe('getToolsForPhase', () => {
  it('FRAME returns only read tools (no action tools)', () => {
    const tools = getToolsForPhase('frame', 'standard');
    const names = toolNames(tools);
    // Should have the 6 always-available read tools (not search_project)
    expect(names).toContain('get_chart_data');
    expect(names).toContain('get_statistical_summary');
    expect(names).toContain('get_available_factors');
    // Should NOT have action tools
    expect(names).not.toContain('apply_filter');
    expect(names).not.toContain('create_finding');
    expect(names).not.toContain('create_question');
    // Should NOT have SCOUT+ read tool
    expect(names).not.toContain('search_project');
  });

  it('SCOUT includes apply_filter and search_project', () => {
    const tools = getToolsForPhase('scout', 'standard');
    const names = toolNames(tools);
    expect(names).toContain('apply_filter');
    expect(names).toContain('search_project');
    expect(names).toContain('get_chart_data');
  });

  it('SCOUT does not include INVESTIGATE+ tools', () => {
    const tools = getToolsForPhase('scout', 'standard');
    const names = toolNames(tools);
    expect(names).not.toContain('create_question');
    expect(names).not.toContain('answer_question');
    expect(names).not.toContain('suggest_causal_link');
  });

  it('INVESTIGATE includes create_question and answer_question', () => {
    const tools = getToolsForPhase('investigate', 'standard');
    const names = toolNames(tools);
    expect(names).toContain('create_question');
    expect(names).toContain('answer_question');
    expect(names).toContain('suggest_causal_link');
    expect(names).toContain('highlight_map_pattern');
  });

  it('excludes team tools when isTeamPlan is false', () => {
    const tools = getToolsForPhase('investigate', 'standard', { isTeamPlan: false });
    const names = toolNames(tools);
    expect(names).not.toContain('share_finding');
    expect(names).not.toContain('publish_report');
    expect(names).not.toContain('notify_action_owners');
  });

  it('includes team tools when isTeamPlan is true', () => {
    const tools = getToolsForPhase('investigate', 'standard', { isTeamPlan: true });
    const names = toolNames(tools);
    expect(names).toContain('share_finding');
    expect(names).toContain('publish_report');
  });

  it('notify_action_owners only in IMPROVE phase with team plan', () => {
    const investigateTools = getToolsForPhase('investigate', 'standard', { isTeamPlan: true });
    expect(toolNames(investigateTools)).not.toContain('notify_action_owners');

    const improveTools = getToolsForPhase('improve', 'standard', { isTeamPlan: true });
    expect(toolNames(improveTools)).toContain('notify_action_owners');
  });

  it('suggest_suspected_cause requires validating or converging phase', () => {
    // Without investigation phase — excluded
    const tools1 = getToolsForPhase('investigate', 'standard');
    expect(toolNames(tools1)).not.toContain('suggest_suspected_cause');

    // With diverging phase — excluded
    const tools2 = getToolsForPhase('investigate', 'standard', {
      investigationPhase: 'diverging',
    });
    expect(toolNames(tools2)).not.toContain('suggest_suspected_cause');

    // With validating phase — included
    const tools3 = getToolsForPhase('investigate', 'standard', {
      investigationPhase: 'validating',
    });
    expect(toolNames(tools3)).toContain('suggest_suspected_cause');

    // With converging phase — included
    const tools4 = getToolsForPhase('investigate', 'standard', {
      investigationPhase: 'converging',
    });
    expect(toolNames(tools4)).toContain('suggest_suspected_cause');
  });

  it('connect_hub_evidence requires existing hubs', () => {
    // Without hubs — excluded
    const tools1 = getToolsForPhase('investigate', 'standard');
    expect(toolNames(tools1)).not.toContain('connect_hub_evidence');

    // With empty hubs — excluded
    const tools2 = getToolsForPhase('investigate', 'standard', { existingHubs: [] });
    expect(toolNames(tools2)).not.toContain('connect_hub_evidence');

    // With hubs — included
    const tools3 = getToolsForPhase('investigate', 'standard', {
      existingHubs: [
        {
          id: 'hub-1',
          name: 'Test Hub',
          synthesis: '',
          questionIds: [],
          findingIds: [],
        } as unknown as SuspectedCause,
      ],
    });
    expect(toolNames(tools3)).toContain('connect_hub_evidence');
  });

  it('IMPROVE includes both SCOUT+ and INVESTIGATE+ tools', () => {
    const tools = getToolsForPhase('improve', 'standard', {
      investigationPhase: 'improving',
    });
    const names = toolNames(tools);
    // SCOUT+ tools
    expect(names).toContain('apply_filter');
    expect(names).toContain('create_finding');
    // INVESTIGATE+ tools
    expect(names).toContain('create_question');
    expect(names).toContain('suggest_improvement_idea');
    expect(names).toContain('suggest_action');
  });

  it('returns ToolDefinition[] with correct shape', () => {
    const tools = getToolsForPhase('scout', 'standard');
    for (const tool of tools) {
      expect(tool.type).toBe('function');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.parameters).toBeDefined();
    }
  });
});

describe('Wall propose_hypothesis_from_finding tool', () => {
  it('registers as an action tool (requires user confirmation)', () => {
    expect(TOOL_REGISTRY.propose_hypothesis_from_finding).toBeDefined();
    expect(TOOL_REGISTRY.propose_hypothesis_from_finding.classification).toBe('action');
    expect(TOOL_REGISTRY.propose_hypothesis_from_finding.phases).toContain('investigate');
  });

  it('requires finding_id and hypothesis_name parameters', () => {
    const required = TOOL_REGISTRY.propose_hypothesis_from_finding.definition.parameters.required;
    expect(required).toContain('finding_id');
    expect(required).toContain('hypothesis_name');
  });
});

describe('Wall critique_investigation_state tool', () => {
  it('registers critique_investigation_state as read tool in investigate phase', () => {
    expect(TOOL_REGISTRY.critique_investigation_state).toBeDefined();
    expect(TOOL_REGISTRY.critique_investigation_state.classification).toBe('read');
    expect(TOOL_REGISTRY.critique_investigation_state.phases).toContain('investigate');
  });

  it('getToolsForPhase includes critique_investigation_state when phase is investigate', () => {
    const tools = getToolsForPhase('investigate', 'standard');
    expect(tools.some(t => t.name === 'critique_investigation_state')).toBe(true);
  });

  it('getToolsForPhase excludes critique_investigation_state in frame phase', () => {
    const tools = getToolsForPhase('frame', 'standard');
    expect(tools.some(t => t.name === 'critique_investigation_state')).toBe(false);
  });
});
