import { describe, it, expect } from 'vitest';
import { assembleCoScoutPrompt } from '../prompts/coScout';
import type { AIContext } from '../types';

/** Minimal context that satisfies the assembler without blowing up */
const MINIMAL_CONTEXT = {
  stats: { samples: 100, mean: 50, stdDev: 5 },
  filters: [],
} as unknown as AIContext;

describe('assembleCoScoutPrompt', () => {
  it('returns all 4 tier fields', () => {
    const result = assembleCoScoutPrompt();
    expect(result).toHaveProperty('tier1Static');
    expect(result).toHaveProperty('tier2SemiStatic');
    expect(result).toHaveProperty('tier3Dynamic');
    expect(result).toHaveProperty('tools');
  });

  it('tier1Static is non-empty and contains role', () => {
    const result = assembleCoScoutPrompt();
    expect(result.tier1Static.length).toBeGreaterThan(0);
    expect(result.tier1Static).toContain('CoScout');
  });

  it('tier1Static contains terminology rules', () => {
    const result = assembleCoScoutPrompt();
    expect(result.tier1Static).toContain('Terminology rules');
  });

  it('returns no action tools on the Process surface', () => {
    const result = assembleCoScoutPrompt({ surface: 'process' });
    const actionToolNames = result.tools
      .map(t => t.name)
      .filter(
        name =>
          name.startsWith('apply_') ||
          name.startsWith('create_') ||
          name.startsWith('update_') ||
          name.startsWith('propose_') ||
          name.startsWith('connect_')
      );
    expect(actionToolNames).toEqual([]);
  });

  it('returns action tools on the Explore surface', () => {
    const result = assembleCoScoutPrompt({ surface: 'explore' });
    const toolNames = result.tools.map(t => t.name);
    // Explore should include at least apply_filter and create_finding
    expect(toolNames).toContain('apply_filter');
    expect(toolNames).toContain('create_finding');
  });

  it('tier2SemiStatic contains surface coaching and mode workflow', () => {
    const result = assembleCoScoutPrompt({
      mode: 'standard',
      surface: 'analyze',
      context: MINIMAL_CONTEXT,
    });
    // Should have substantial content from surface + mode coaching
    expect(result.tier2SemiStatic.length).toBeGreaterThan(100);
    expect(result.tier2SemiStatic).toContain('Surface: Analyze Wall');
  });

  it('tier1Static contains role but NOT investigation data', () => {
    const result = assembleCoScoutPrompt({
      mode: 'standard',
      surface: 'analyze',
      context: {
        ...MINIMAL_CONTEXT,
        investigation: { phase: 'diverging' } as unknown as AIContext['investigation'],
      },
    });
    expect(result.tier1Static).toContain('CoScout');
    // tier1 should NOT contain phase-specific coaching or investigation state
    expect(result.tier1Static).not.toContain('diverging');
  });

  it('tier1Static is identical regardless of context', () => {
    const rich = assembleCoScoutPrompt({
      mode: 'standard',
      surface: 'analyze',
      context: {
        ...MINIMAL_CONTEXT,
        investigation: { phase: 'converging' } as unknown as AIContext['investigation'],
      },
    });
    const minimal = assembleCoScoutPrompt({
      mode: 'standard',
      surface: 'process',
      context: MINIMAL_CONTEXT,
    });
    expect(rich.tier1Static).toBe(minimal.tier1Static);
  });

  it('tier1Static includes glossary when provided', () => {
    const result = assembleCoScoutPrompt({
      surface: 'process',
      mode: 'standard',
      context: {
        ...MINIMAL_CONTEXT,
        glossaryFragment: '## Glossary\n- SPC: Statistical Process Control',
      },
    });
    expect(result.tier1Static).toContain('Glossary');
    expect(result.tier1Static).toContain('Statistical Process Control');
  });

  it('tier3Dynamic is empty string (Phase 2 placeholder)', () => {
    const result = assembleCoScoutPrompt({ surface: 'analyze' });
    expect(result.tier3Dynamic).toBe('');
  });

  it('tier2SemiStatic includes investigation context when provided', () => {
    const result = assembleCoScoutPrompt({
      mode: 'standard',
      surface: 'analyze',
      context: {
        ...MINIMAL_CONTEXT,
        investigation: {
          phase: 'diverging',
          liveStatement: 'Coffee moisture exceeds 12% on Line B',
          problemStatementStage: 'what-where',
        } as unknown as AIContext['investigation'],
      },
    });
    expect(result.tier2SemiStatic).toContain('Coffee moisture');
  });

  it('tier2SemiStatic includes data context with stats', () => {
    const result = assembleCoScoutPrompt({
      mode: 'standard',
      surface: 'explore',
      context: {
        ...MINIMAL_CONTEXT,
        activeChart: 'boxplot',
      },
    });
    expect(result.tier2SemiStatic).toContain('n=100');
    expect(result.tier2SemiStatic).toContain('boxplot');
  });

  it('tier2SemiStatic includes Analysis Scope when provided', () => {
    const result = assembleCoScoutPrompt({
      surface: 'analyze',
      scope: {
        analysisMode: 'standard',
        activeScopeLabel: 'Machine = A',
        activeScope: {
          id: 'scope-1',
          projectId: 'project-1',
          outcome: 'Moisture',
          predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' }],
          hypothesisIds: ['hub-1'],
        },
      },
      context: {
        ...MINIMAL_CONTEXT,
        analysisScope: {
          id: 'scope-1',
          projectId: 'project-1',
          outcome: 'Moisture',
          factor: 'Machine',
          filters: ['Machine = A'],
          hypothesisIds: ['hub-1'],
        },
      },
    });

    expect(result.tier2SemiStatic).toContain('Current Analysis Scope: Machine = A');
    expect(result.tier2SemiStatic).toContain('Analysis Scope: outcome=Moisture');
  });
});
