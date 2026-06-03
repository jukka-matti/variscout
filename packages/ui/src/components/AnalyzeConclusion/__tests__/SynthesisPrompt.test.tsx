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
    findingIds: ['f1', 'f2', 'f3'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SynthesisPrompt', () => {
  it('renders cluster info: factor names and finding count', () => {
    render(<SynthesisPrompt cluster={makeCluster()} onNameCause={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText(/Shift \+ Head/)).toBeInTheDocument();
    expect(screen.getByText(/3 findings/)).toBeInTheDocument();
  });

  it('never renders R\u00b2, combined, or percent text (analyst decides relevance)', () => {
    render(<SynthesisPrompt cluster={makeCluster()} onNameCause={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.queryByText(/R\u00b2|combined|%/)).toBeNull();
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
});
