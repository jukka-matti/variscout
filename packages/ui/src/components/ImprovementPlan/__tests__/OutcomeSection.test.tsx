import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutcomeSection } from '../OutcomeSection';

describe('OutcomeSection', () => {
  it('renders dimmed when hasVerification is false', () => {
    render(<OutcomeSection hasVerification={false} />);
    const section = screen.getByTestId('outcome-section');
    expect(section.className).toContain('opacity-40');
    expect(section.className).toContain('pointer-events-none');
  });

  it('shows unavailable message when hasVerification is false', () => {
    render(<OutcomeSection hasVerification={false} />);
    expect(screen.getByTestId('outcome-dimmed-message')).toBeTruthy();
    expect(screen.getByTestId('outcome-dimmed-message').textContent).toContain(
      'Available after verification data is uploaded'
    );
  });

  it('renders active (no opacity class) when hasVerification is true', () => {
    render(<OutcomeSection hasVerification={true} />);
    const section = screen.getByTestId('outcome-section');
    expect(section.className).not.toContain('opacity-40');
  });

  it('shows three outcome buttons when hasVerification is true', () => {
    render(<OutcomeSection hasVerification={true} />);
    expect(screen.getByTestId('outcome-button-effective')).toBeTruthy();
    expect(screen.getByTestId('outcome-button-partial')).toBeTruthy();
    expect(screen.getByTestId('outcome-button-not-effective')).toBeTruthy();
  });

  it('highlights the selected outcome button', () => {
    render(<OutcomeSection hasVerification={true} selectedOutcome="effective" />);
    const effectiveBtn = screen.getByTestId('outcome-button-effective');
    expect(effectiveBtn.getAttribute('aria-pressed')).toBe('true');
    const partialBtn = screen.getByTestId('outcome-button-partial');
    expect(partialBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onOutcomeChange when a button is clicked', () => {
    const onOutcomeChange = vi.fn();
    render(<OutcomeSection hasVerification={true} onOutcomeChange={onOutcomeChange} />);
    fireEvent.click(screen.getByTestId('outcome-button-partial'));
    expect(onOutcomeChange).toHaveBeenCalledWith('partial');
  });

  it('calls onOutcomeChange with not-effective when that button is clicked', () => {
    const onOutcomeChange = vi.fn();
    render(<OutcomeSection hasVerification={true} onOutcomeChange={onOutcomeChange} />);
    fireEvent.click(screen.getByTestId('outcome-button-not-effective'));
    expect(onOutcomeChange).toHaveBeenCalledWith('not-effective');
  });

  it('shows notes textarea when hasVerification is true', () => {
    render(<OutcomeSection hasVerification={true} />);
    expect(screen.getByTestId('outcome-notes')).toBeTruthy();
  });

  it('displays notes value in textarea', () => {
    render(<OutcomeSection hasVerification={true} notes="Process improved significantly." />);
    const textarea = screen.getByTestId('outcome-notes') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Process improved significantly.');
  });

  it('calls onNotesChange when notes are typed', () => {
    const onNotesChange = vi.fn();
    render(<OutcomeSection hasVerification={true} onNotesChange={onNotesChange} />);
    const textarea = screen.getByTestId('outcome-notes');
    fireEvent.change(textarea, { target: { value: 'New note' } });
    expect(onNotesChange).toHaveBeenCalledWith('New note');
  });
});
