import { describe, it, expect, beforeEach } from 'vitest';
import { configurePlan } from '@variscout/core';
import { classifyError, isAIAvailable, fetchChartInsight } from '../aiService';

describe('classifyError', () => {
  it('classifies 401 as auth', () => {
    expect(classifyError(401)).toBe('auth');
  });

  it('classifies 403 as auth', () => {
    expect(classifyError(403)).toBe('auth');
  });

  it('classifies 429 as rate-limit', () => {
    expect(classifyError(429)).toBe('rate-limit');
  });

  it('classifies 500 as server', () => {
    expect(classifyError(500)).toBe('server');
  });

  it('classifies 0 as network', () => {
    expect(classifyError(0)).toBe('network');
  });

  it('classifies fetch error as network', () => {
    expect(classifyError(0, 'fetch failed')).toBe('network');
  });

  it('classifies unknown status as unknown', () => {
    expect(classifyError(418)).toBe('unknown');
  });
});

describe('isAIAvailable', () => {
  beforeEach(() => {
    configurePlan(null);
  });

  it('returns false when VITE_AI_ENDPOINT is not set', () => {
    // In test env, VITE_AI_ENDPOINT is not set
    expect(isAIAvailable()).toBe(false);
  });

  it('returns false for standard plan even if endpoint were set', () => {
    configurePlan('standard');
    expect(isAIAvailable()).toBe(false);
  });

  it('returns false for team plan (AI requires team-ai)', () => {
    configurePlan('team');
    expect(isAIAvailable()).toBe(false);
  });

  it('returns false for team-ai plan when endpoint not set', () => {
    configurePlan('team-ai');
    // Still false because VITE_AI_ENDPOINT is not set in test env
    expect(isAIAvailable()).toBe(false);
  });
});

describe('fetchChartInsight', () => {
  it('throws when AI endpoint not configured', async () => {
    await expect(fetchChartInsight('test prompt')).rejects.toThrow('AI endpoint not configured');
  });
});
