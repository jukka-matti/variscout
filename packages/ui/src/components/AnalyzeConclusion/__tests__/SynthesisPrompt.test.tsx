import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SynthesisPrompt } from '../SynthesisPrompt';
import type { EvidenceCluster } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCluster(overrides: Partial<EvidenceCluster> = {}): EvidenceCluster {
  return {
    factors: ['Shift', 'Head'],
    questionIds: ['q1', 'q2', 'q3'],
    findingIds: ['f1'],
    rSquaredAdj: 0.42,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SynthesisPrompt', () => {
  it('renders cluster info: factor names, question count, R\u00b2adj', () => {
    render(<SynthesisPrompt cluster={makeCluster()} onNameCause={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText(/Shift \+ Head/)).toBeInTheDocument();
    expect(screen.getByText(/3 answered questions/)).toBeInTheDocument();
    expect(screen.getByText(/R\u00b2adj 42%/)).toBeInTheDocument();
  });

  it('"Name this cause" button calls onNameCause', () => {
    const onNameCause = vi.fn();
    render(
      <SynthesisPrompt cluster={makeCluster()} onNameCause={onNameCause} onDismiss={vi.fn()} />
    );

    fireEvent.click(screen.getByTestId('synthesis-prompt-name'));
    expect(onNameCause).toHaveBeenCalled();
  });

  it('"Not yet" button calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(<SynthesisPrompt cluster={makeCluster()} onNameCause={vi.fn()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByTestId('synthesis-prompt-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('hides R\u00b2adj when zero', () => {
    render(
      <SynthesisPrompt
        cluster={makeCluster({ rSquaredAdj: 0 })}
        onNameCause={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.queryByText(/R\u00b2adj/)).not.toBeInTheDocument();
  });
});
