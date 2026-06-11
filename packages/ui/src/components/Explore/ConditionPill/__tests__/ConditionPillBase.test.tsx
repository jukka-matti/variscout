/**
 * ConditionPillBase component test (ER-4, spec §7.1).
 *
 * The pill is the ONE pattern that mints a condition from any chart gesture
 * (brush band OR group click). It's props-based (no store reads). These tests
 * pin:
 *   - copy assembly WITH and WITHOUT means
 *   - the optional `gestureLabel` prefix (only the brush gesture supplies it)
 *   - capture button hidden when `onCapture` is absent (never a dead control)
 *   - both actions fire their handlers
 *   - Esc + outside-click → onDismiss (the ModelDrawer/EvidenceMap convention)
 *   - anchored (absolute) vs inline (static) positioning
 *
 * Locale defaults to 'en' (no loader registered — English is always loaded);
 * numbers are formatted via `formatStatistic`, never `.toFixed()`.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionPillBase } from '../ConditionPillBase';

describe('ConditionPillBase', () => {
  const baseProps = {
    summary: 'Weight_g > 12.1',
    nIn: 42,
    onViewAsCondition: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders the summary, n, and the x̄ in-vs-out means', () => {
    render(<ConditionPillBase {...baseProps} meanIn={18.4} meanOut={11.2} />);
    const pill = screen.getByTestId('condition-pill');
    // formatStatistic(18.4, 'en', 1) → "18.4"; means default decimals=1
    expect(pill.textContent).toContain('Weight_g > 12.1');
    expect(pill.textContent).toContain('n=42');
    expect(pill.textContent).toContain('x̄ 18.4 vs 11.2');
  });

  it('omits the mean comparison when means are absent', () => {
    render(<ConditionPillBase {...baseProps} />);
    const pill = screen.getByTestId('condition-pill');
    expect(pill.textContent).toContain('Weight_g > 12.1');
    expect(pill.textContent).toContain('n=42');
    expect(pill.textContent).not.toContain('vs');
    expect(pill.textContent).not.toContain('x̄');
  });

  it('shows the means only when BOTH meanIn and meanOut are supplied', () => {
    // Only one mean → treated as no-means (the comparison needs both halves).
    render(<ConditionPillBase {...baseProps} meanIn={18.4} />);
    const pill = screen.getByTestId('condition-pill');
    expect(pill.textContent).not.toContain('vs');
  });

  it('prefixes the gesture label when supplied (brush reads "brushed: …")', () => {
    render(
      <ConditionPillBase {...baseProps} gestureLabel="brushed: " meanIn={18.4} meanOut={11.2} />
    );
    const pill = screen.getByTestId('condition-pill');
    expect(pill.textContent).toContain('brushed: Weight_g > 12.1');
  });

  it('reads cleanly without the gesture prefix (group-click pill)', () => {
    render(<ConditionPillBase {...baseProps} meanIn={18.4} meanOut={11.2} />);
    const pill = screen.getByTestId('condition-pill');
    expect(pill.textContent).not.toContain('brushed');
    expect(pill.textContent?.trimStart().startsWith('Weight_g > 12.1')).toBe(true);
  });

  it('honours a custom statLabel', () => {
    render(<ConditionPillBase {...baseProps} statLabel="median" meanIn={18.4} meanOut={11.2} />);
    expect(screen.getByTestId('condition-pill').textContent).toContain('median 18.4 vs 11.2');
  });

  it('hides the capture button when onCapture is absent (never a dead control)', () => {
    render(<ConditionPillBase {...baseProps} />);
    expect(screen.queryByTestId('condition-pill-capture')).toBeNull();
    // The apply button always renders.
    expect(screen.getByTestId('condition-pill-apply')).toBeTruthy();
  });

  it('shows the capture button when onCapture is provided and fires it', () => {
    const onCapture = vi.fn();
    render(<ConditionPillBase {...baseProps} onCapture={onCapture} />);
    fireEvent.click(screen.getByTestId('condition-pill-capture'));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it('fires onViewAsCondition when the apply button is clicked', () => {
    const onViewAsCondition = vi.fn();
    render(<ConditionPillBase {...baseProps} onViewAsCondition={onViewAsCondition} />);
    fireEvent.click(screen.getByTestId('condition-pill-apply'));
    expect(onViewAsCondition).toHaveBeenCalledTimes(1);
  });

  it('dismisses on Escape', () => {
    const onDismiss = vi.fn();
    render(<ConditionPillBase {...baseProps} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on outside click but not on inside click', () => {
    const onDismiss = vi.fn();
    render(
      <div>
        <button data-testid="outside">outside</button>
        <ConditionPillBase {...baseProps} onDismiss={onDismiss} />
      </div>
    );
    // Inside click (the apply button) does not dismiss.
    fireEvent.mouseDown(screen.getByTestId('condition-pill-apply'));
    expect(onDismiss).not.toHaveBeenCalled();
    // Outside click dismisses.
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('positions absolutely at the anchor when provided', () => {
    render(<ConditionPillBase {...baseProps} anchor={{ x: 120, y: 86 }} />);
    const pill = screen.getByTestId('condition-pill');
    expect(pill.style.position).toBe('absolute');
    expect(pill.style.left).toBe('120px');
    expect(pill.style.top).toBe('86px');
  });

  it('renders inline (no absolute positioning) when anchor is absent', () => {
    render(<ConditionPillBase {...baseProps} />);
    const pill = screen.getByTestId('condition-pill');
    expect(pill.style.position).not.toBe('absolute');
    expect(pill.style.left).toBe('');
  });

  it('formats means via formatStatistic (locale-aware, not toFixed)', () => {
    // 11 → "11.0" with decimals=1 (formatStatistic), proving it is not a raw integer.
    render(<ConditionPillBase {...baseProps} meanIn={11} meanOut={9} />);
    expect(screen.getByTestId('condition-pill').textContent).toContain('11.0 vs 9.0');
  });
});
