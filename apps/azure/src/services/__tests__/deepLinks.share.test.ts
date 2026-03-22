import { describe, it, expect } from 'vitest';
import { buildCurrentViewLink } from '../deepLinks';

describe('buildCurrentViewLink', () => {
  const base = 'https://variscout.example.com';

  it('builds link with project only', () => {
    const url = buildCurrentViewLink(base, 'Coffee', {});
    expect(url).toBe('https://variscout.example.com/?project=Coffee');
  });

  it('includes chart param when focused', () => {
    const url = buildCurrentViewLink(base, 'Coffee', { focusedChart: 'ichart' });
    expect(url).toContain('chart=ichart');
  });

  it('includes finding param when highlighted', () => {
    const url = buildCurrentViewLink(base, 'Coffee', { findingId: 'f-123' });
    expect(url).toContain('finding=f-123');
  });

  it('includes mode=report when in report view', () => {
    const url = buildCurrentViewLink(base, 'Coffee', { mode: 'report' });
    expect(url).toContain('mode=report');
  });

  it('combines multiple params', () => {
    const url = buildCurrentViewLink(base, 'Coffee', {
      focusedChart: 'boxplot',
      findingId: 'f-456',
    });
    expect(url).toContain('project=Coffee');
    expect(url).toContain('chart=boxplot');
    expect(url).toContain('finding=f-456');
  });

  it('encodes project names with spaces', () => {
    const url = buildCurrentViewLink(base, 'My Project', {});
    // URL.searchParams.set uses application/x-www-form-urlencoded: spaces become +
    expect(url).toContain('project=My+Project');
  });
});
