/**
 * ScopeBarBase component test (ER-4, spec §7.2; wireframe :234-240).
 *
 * The conditional "Viewing condition" row that sits directly under the context
 * line whenever a condition is applied. Props-based, no store reads. Pins:
 *   - the full copy line: ⌖ Viewing condition: <label> · <nIn> of <nTotal> rows
 *   - both actions fire (clear + take-to-Analyze)
 *   - n formatting goes through formatInteger (thousands separators, locale-aware)
 *
 * Locale defaults to 'en'.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScopeBarBase } from '../ScopeBarBase';

describe('ScopeBarBase', () => {
  const baseProps = {
    conditionLabel: 'Weight_g > 12.1 ∧ Cavity = Cav1',
    nIn: 418,
    nTotal: 2400,
    onClear: vi.fn(),
    onTakeToAnalyze: vi.fn(),
  };

  it('renders the full copy line', () => {
    render(<ScopeBarBase {...baseProps} />);
    const bar = screen.getByTestId('scope-bar');
    expect(bar.textContent).toContain('Viewing condition:');
    expect(bar.textContent).toContain('Weight_g > 12.1 ∧ Cavity = Cav1');
    expect(bar.textContent).toContain('418 of 2,400 rows');
    expect(bar.textContent).toContain('back to all data');
    expect(bar.textContent).toContain('Take it to Analyze');
  });

  it('formats both counts via formatInteger (thousands separators)', () => {
    render(<ScopeBarBase {...baseProps} nIn={1234} nTotal={56789} />);
    const bar = screen.getByTestId('scope-bar');
    expect(bar.textContent).toContain('1,234 of 56,789 rows');
  });

  it('fires onClear when "back to all data" is clicked', () => {
    const onClear = vi.fn();
    render(<ScopeBarBase {...baseProps} onClear={onClear} />);
    fireEvent.click(screen.getByTestId('scope-bar-clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('fires onTakeToAnalyze when the Analyze button is clicked', () => {
    const onTakeToAnalyze = vi.fn();
    render(<ScopeBarBase {...baseProps} onTakeToAnalyze={onTakeToAnalyze} />);
    fireEvent.click(screen.getByTestId('scope-bar-analyze'));
    expect(onTakeToAnalyze).toHaveBeenCalledTimes(1);
  });

  it('exposes both action testids', () => {
    render(<ScopeBarBase {...baseProps} />);
    expect(screen.getByTestId('scope-bar-clear')).toBeTruthy();
    expect(screen.getByTestId('scope-bar-analyze')).toBeTruthy();
  });
});
