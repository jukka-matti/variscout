/**
 * Tests for the FindingCard window-context footer (multi-level SCOUT V1).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FindingCard from '../FindingCard';
import type { Finding } from '@variscout/core';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-window-1',
    text: 'Drift suspected on Line 2',
    createdAt: Date.now(),
    context: {
      activeFilters: { Machine: ['B'] },
      cumulativeScope: 30,
      stats: { mean: 10, samples: 50 },
    },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

const noopHandlers = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRestore: vi.fn(),
};

describe('FindingCard window-context footer', () => {
  it('renders window + stats snapshot when windowContext is present', () => {
    const finding = makeFinding({
      windowContext: {
        windowAtCreation: {
          kind: 'fixed',
          startISO: '2026-04-01T00:00:00.000Z',
          endISO: '2026-04-15T00:00:00.000Z',
        },
        statsAtCreation: { cpk: 0.62, mean: 10.1, sigma: 0.3, n: 200 },
      },
    });

    render(<FindingCard finding={finding} {...noopHandlers} />);

    const footer = screen.getByTestId('finding-window-footer');
    expect(footer).toBeDefined();
    // Captured-window line uses the fixed-window date range
    expect(footer.textContent).toMatch(/Captured:/);
    // Cpk @ creation rendered via formatStat (locale-aware), not toFixed
    expect(footer.textContent).toMatch(/Cpk @ creation/);
    expect(footer.textContent).toMatch(/0\.62/);
    // Sample count
    expect(footer.textContent).toMatch(/n=200/);
  });

  it('does not render footer when windowContext is absent', () => {
    const finding = makeFinding({ windowContext: undefined });

    render(<FindingCard finding={finding} {...noopHandlers} />);

    expect(screen.queryByTestId('finding-window-footer')).toBeNull();
  });
});
