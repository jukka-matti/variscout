import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FactorGlyph } from '../FactorGlyph';

const baseProps = {
  factorKey: 'Vessel',
  x: 100,
  y: 50,
  opacity: 1,
  doi: 1,
  focused: false,
  ariaLabel: 'Focus factor Vessel',
  onFocus: vi.fn(),
};

describe('FactorGlyph', () => {
  it('renders the factor label', () => {
    render(
      <svg>
        <FactorGlyph {...baseProps} />
      </svg>
    );
    expect(screen.getByText('Vessel')).toBeInTheDocument();
  });

  it('fires onFocus with the factor:-namespaced nodeId when clicked', () => {
    const onFocus = vi.fn();
    render(
      <svg>
        <FactorGlyph {...baseProps} onFocus={onFocus} />
      </svg>
    );
    fireEvent.click(screen.getByTestId('factor-glyph-Vessel'));
    expect(onFocus).toHaveBeenCalledWith('factor:Vessel');
  });
});

describe('CS-13 explore affordance', () => {
  it('renders the → button only when focused AND onExplore is provided', () => {
    const { rerender } = render(
      <svg>
        <FactorGlyph
          {...baseProps}
          focused
          onExplore={vi.fn()}
          exploreAriaLabel="Open Vessel in Explore"
        />
      </svg>
    );
    expect(screen.getByTestId('factor-glyph-explore-Vessel')).toBeInTheDocument();
    rerender(
      <svg>
        <FactorGlyph
          {...baseProps}
          focused={false}
          onExplore={vi.fn()}
          exploreAriaLabel="Open Vessel in Explore"
        />
      </svg>
    );
    expect(screen.queryByTestId('factor-glyph-explore-Vessel')).toBeNull();
  });

  it('fires onExplore with the RAW factorKey — not the factor:-namespaced node id — and does NOT fire onFocus', () => {
    const onExplore = vi.fn();
    const onFocus = vi.fn();
    render(
      <svg>
        <FactorGlyph
          {...baseProps}
          focused
          onFocus={onFocus}
          onExplore={onExplore}
          exploreAriaLabel="Open Vessel in Explore"
        />
      </svg>
    );
    fireEvent.click(screen.getByTestId('factor-glyph-explore-Vessel'));
    expect(onExplore).toHaveBeenCalledWith('Vessel');
    expect(onExplore).not.toHaveBeenCalledWith('factor:Vessel');
    expect(onFocus).not.toHaveBeenCalled();
  });

  it('renders no → button when onExplore is omitted (legacy callers unchanged)', () => {
    render(
      <svg>
        <FactorGlyph {...baseProps} focused />
      </svg>
    );
    expect(screen.queryByTestId('factor-glyph-explore-Vessel')).toBeNull();
  });
});
