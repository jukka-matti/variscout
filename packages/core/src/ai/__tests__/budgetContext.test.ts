import { describe, it, expect } from 'vitest';
import { budgetContext, type ContextComponent } from '../budgetContext';

describe('budgetContext', () => {
  it('assembles all components when within budget', () => {
    const components: ContextComponent[] = [
      { name: 'system', content: 'System instructions here', priority: 0 },
      { name: 'stats', content: 'Stats data here', priority: 6 },
    ];
    const result = budgetContext(components, 12000);
    expect(result.trimmedComponents).toEqual([]);
    expect(result.components).toHaveLength(2);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });

  it('trims lowest priority components when over budget', () => {
    const longContent = 'word '.repeat(5000); // ~6500 tokens
    const components: ContextComponent[] = [
      { name: 'system', content: 'System prompt', priority: 0 },
      { name: 'stats', content: longContent, priority: 6 },
      { name: 'history', content: longContent, priority: 8 },
    ];
    const result = budgetContext(components, 8000);
    expect(result.trimmedComponents).toContain('history');
    expect(result.components.find(c => c.name === 'system')).toBeDefined();
  });

  it('trims multiple components from lowest priority up', () => {
    const mediumContent = 'word '.repeat(3000); // ~3900 tokens
    const components: ContextComponent[] = [
      { name: 'system', content: 'Instructions', priority: 0 },
      { name: 'investigation', content: mediumContent, priority: 4 },
      { name: 'kb', content: mediumContent, priority: 5 },
      { name: 'history', content: mediumContent, priority: 8 },
    ];
    const result = budgetContext(components, 5000);
    expect(result.trimmedComponents).toContain('history');
    expect(result.trimmedComponents).toContain('kb');
  });

  it('never trims priority 0-2 components even if over budget', () => {
    const longContent = 'word '.repeat(10000);
    const components: ContextComponent[] = [
      { name: 'system', content: longContent, priority: 0 },
      { name: 'current-turn', content: longContent, priority: 2 },
    ];
    const result = budgetContext(components, 100);
    expect(result.trimmedComponents).toEqual([]);
    expect(result.components).toHaveLength(2);
  });

  it('returns components sorted by priority', () => {
    const components: ContextComponent[] = [
      { name: 'history', content: 'old turns', priority: 8 },
      { name: 'system', content: 'instructions', priority: 0 },
      { name: 'stats', content: 'numbers', priority: 6 },
    ];
    const result = budgetContext(components, 12000);
    expect(result.components.map(c => c.name)).toEqual(['system', 'stats', 'history']);
  });

  it('handles empty components array', () => {
    const result = budgetContext([], 12000);
    expect(result.components).toEqual([]);
    expect(result.trimmedComponents).toEqual([]);
    expect(result.estimatedTokens).toBe(0);
  });

  it('estimates tokens at approximately 1.3x word count', () => {
    const components: ContextComponent[] = [
      { name: 'test', content: 'one two three four five six seven eight nine ten', priority: 0 },
    ];
    const result = budgetContext(components, 12000);
    // 10 words * 1.3 = 13 tokens
    expect(result.estimatedTokens).toBe(13);
  });

  it('uses default 12000 token budget when not specified', () => {
    const components: ContextComponent[] = [
      { name: 'system', content: 'word '.repeat(8000), priority: 0 },
    ];
    // 8000 words * 1.3 = 10400 tokens — under 12000 default
    const result = budgetContext(components);
    expect(result.trimmedComponents).toEqual([]);
  });
});
