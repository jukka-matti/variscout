import { describe, it, expect } from 'vitest';
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
  it('returns false when VITE_AI_ENDPOINT is not set', () => {
    // In test env, VITE_AI_ENDPOINT is not set
    expect(isAIAvailable()).toBe(false);
  });
});

describe('fetchChartInsight', () => {
  it('throws when AI endpoint not configured', async () => {
    await expect(fetchChartInsight('test prompt')).rejects.toThrow('AI endpoint not configured');
  });
});
