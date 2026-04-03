import { describe, it, expect } from 'vitest';
import { generateHMWPrompts } from '../hmwPrompts';

describe('generateHMWPrompts', () => {
  it('generates 4 HMW prompts from cause name and problem statement', () => {
    const prompts = generateHMWPrompts('Shift (Night)', 'fill weight variation');
    expect(Object.keys(prompts)).toEqual(['prevent', 'detect', 'simplify', 'eliminate']);
    expect(prompts.prevent).toContain('prevent');
    expect(prompts.prevent).toContain('Shift (Night)');
    expect(prompts.prevent).toContain('fill weight variation');
  });

  it('generates generic prompts when no problem statement', () => {
    const prompts = generateHMWPrompts('Machine B');
    expect(prompts.prevent).toContain('prevent');
    expect(prompts.prevent).toContain('Machine B');
    expect(prompts.prevent).not.toContain('undefined');
  });

  it('returns all four IdeaDirection keys', () => {
    const prompts = generateHMWPrompts('Operator');
    expect(prompts).toHaveProperty('prevent');
    expect(prompts).toHaveProperty('detect');
    expect(prompts).toHaveProperty('simplify');
    expect(prompts).toHaveProperty('eliminate');
  });
});
