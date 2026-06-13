/**
 * DefectDispatchBanner tests (Task 4 / ER-5b).
 *
 * The banner is props-based, store-free. Tests verify:
 *   - Renders the detection summary copy
 *   - "adjust columns" fires onAdjust
 *   - "use as standard data" fires onUseStandard
 *   - Dismiss (×) fires onDismiss
 *   - Never auto-dismisses — closing is explicit only
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { en } from '@variscout/core/i18n';
import { formatStatistic } from '@variscout/core/i18n';

// ---- Mock useTranslation BEFORE the component import -------------------------
vi.mock('@variscout/hooks', () => {
  const interpolate = (key: string, params?: Record<string, string | number>) => {
    let msg = (en as unknown as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replaceAll(`{${k}}`, String(v));
      }
    }
    return msg;
  };
  return {
    useTranslation: () => ({
      t: (key: string) => (en as unknown as Record<string, string>)[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => interpolate(key, params),
      locale: 'en',
      formatStat: (value: number, decimals = 2) => formatStatistic(value, 'en', decimals),
      formatNumber: (value: number, decimals = 2) => formatStatistic(value, 'en', decimals),
      formatPct: (value: number, decimals = 1) => formatStatistic(value, 'en', decimals),
    }),
  };
});

import { DefectDispatchBanner } from '../index';

const makeProps = (overrides = {}) => ({
  onAdjust: vi.fn(),
  onUseStandard: vi.fn(),
  onDismiss: vi.fn(),
  ...overrides,
});

describe('DefectDispatchBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the detection summary label', () => {
    render(<DefectDispatchBanner {...makeProps()} />);
    expect(screen.getByText(/Detected count data/)).toBeDefined();
    expect(screen.getByText(/analyzing defect rates/)).toBeDefined();
  });

  it('renders the adjust columns button', () => {
    render(<DefectDispatchBanner {...makeProps()} />);
    expect(screen.getByTestId('defect-dispatch-adjust')).toBeDefined();
    expect(screen.getByTestId('defect-dispatch-adjust').textContent).toContain('adjust columns');
  });

  it('renders the use as standard data button', () => {
    render(<DefectDispatchBanner {...makeProps()} />);
    expect(screen.getByTestId('defect-dispatch-use-standard')).toBeDefined();
    expect(screen.getByTestId('defect-dispatch-use-standard').textContent).toContain(
      'use as standard data'
    );
  });

  it('fires onAdjust when adjust button is clicked', () => {
    const onAdjust = vi.fn();
    render(<DefectDispatchBanner {...makeProps({ onAdjust })} />);
    fireEvent.click(screen.getByTestId('defect-dispatch-adjust'));
    expect(onAdjust).toHaveBeenCalledTimes(1);
  });

  it('fires onUseStandard when use standard button is clicked', () => {
    const onUseStandard = vi.fn();
    render(<DefectDispatchBanner {...makeProps({ onUseStandard })} />);
    fireEvent.click(screen.getByTestId('defect-dispatch-use-standard'));
    expect(onUseStandard).toHaveBeenCalledTimes(1);
  });

  it('fires onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<DefectDispatchBanner {...makeProps({ onDismiss })} />);
    fireEvent.click(screen.getByTestId('defect-dispatch-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does NOT auto-dismiss — banner stays until explicitly closed', () => {
    const onDismiss = vi.fn();
    render(<DefectDispatchBanner {...makeProps({ onDismiss })} />);
    // Banner is present without any interaction
    expect(screen.getByText(/Detected count data/)).toBeDefined();
    // onDismiss has NOT been called automatically
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
