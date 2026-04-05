import { describe, it, expect } from 'vitest';
import { assembleCoScoutPrompt } from '../prompts/coScout';

describe('assembleCoScoutPrompt', () => {
  it('returns all 4 tier fields', () => {
    const result = assembleCoScoutPrompt();
    expect(result).toHaveProperty('tier1Static');
    expect(result).toHaveProperty('tier2SemiStatic');
    expect(result).toHaveProperty('tier3Dynamic');
    expect(result).toHaveProperty('tools');
  });

  it('tier1Static is non-empty', () => {
    const result = assembleCoScoutPrompt();
    expect(result.tier1Static.length).toBeGreaterThan(0);
    expect(result.tier1Static).toContain('CoScout');
  });

  it('returns no action tools in frame phase', () => {
    const result = assembleCoScoutPrompt({ phase: 'frame' });
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

  it('returns action tools in scout phase', () => {
    const result = assembleCoScoutPrompt({ phase: 'scout' });
    const toolNames = result.tools.map(t => t.name);
    // Scout phase should include at least apply_filter and create_finding
    expect(toolNames).toContain('apply_filter');
    expect(toolNames).toContain('create_finding');
  });

  it('tier2SemiStatic and tier3Dynamic are empty strings (legacy delegation)', () => {
    const result = assembleCoScoutPrompt({ phase: 'investigate' });
    expect(result.tier2SemiStatic).toBe('');
    expect(result.tier3Dynamic).toBe('');
  });
});
