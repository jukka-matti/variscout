import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyzeConclusion } from '../AnalyzeConclusion';
import { createHypothesis } from '@variscout/core';

describe('AnalyzeConclusion', () => {
  it('returns null when hasConclusions is false', () => {
    const { container } = render(<AnalyzeConclusion hasConclusions={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the investigation conclusions header when hasConclusions is true', () => {
    render(<AnalyzeConclusion hasConclusions hubs={[]} onCreateHub={vi.fn()} findings={[]} />);
    expect(screen.getByTestId('analyze-conclusion')).toBeDefined();
    expect(screen.getByText(/Investigation Conclusions/i)).toBeDefined();
  });

  it('shows problem statement when provided', () => {
    render(
      <AnalyzeConclusion
        hasConclusions
        problemStatement="Mean fill weight increased 3g since January"
      />
    );
    expect(screen.getByTestId('analyze-conclusion')).toBeDefined();
    expect(screen.getByText('Mean fill weight increased 3g since January')).toBeDefined();
  });

  it('renders hub cards when hubs provided', () => {
    const hub = createHypothesis('Shift changeover procedure', '');
    render(<AnalyzeConclusion hasConclusions hubs={[hub]} onCreateHub={vi.fn()} findings={[]} />);
    expect(screen.getByText('Shift changeover procedure')).toBeDefined();
  });
});
