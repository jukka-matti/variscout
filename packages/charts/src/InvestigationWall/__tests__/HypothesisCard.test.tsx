import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HypothesisCard } from '../HypothesisCard';
import type { SuspectedCause } from '@variscout/core';

const hub: SuspectedCause = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  questionIds: [],
  findingIds: ['f1', 'f2', 'f3'],
  status: 'confirmed',
  createdAt: '',
  updatedAt: '',
};

describe('HypothesisCard', () => {
  it('renders hub name and status', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it('shows findings count', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/3 findings/)).toBeInTheDocument();
  });

  it('fires onSelect on click', () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} onSelect={onSelect} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /hypothesis/i }));
    expect(onSelect).toHaveBeenCalledWith('h1');
  });

  it('shows warning badge when hasGap is true', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} hasGap />
      </svg>
    );
    expect(screen.getByLabelText(/evidence gap/i)).toBeInTheDocument();
  });

  it('renders status-tinted data attribute', () => {
    const { container } = render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="refuted" x={0} y={0} />
      </svg>
    );
    expect(container.querySelector('[data-status="refuted"]')).toBeTruthy();
  });

  it('does not render missing-column badge by default', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} />
      </svg>
    );
    expect(screen.queryByLabelText(/references missing column/i)).toBeNull();
  });

  it('renders missing-column badge when missingColumn prop is true', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} missingColumn />
      </svg>
    );
    expect(screen.getByLabelText(/references missing column/i)).toBeInTheDocument();
  });

  it('missing-column badge is distinct from evidence-gap badge', () => {
    render(
      <svg>
        <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} hasGap missingColumn />
      </svg>
    );
    expect(screen.getByLabelText(/evidence gap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/references missing column/i)).toBeInTheDocument();
  });

  // ── Level-of-detail rendering (Phase 13.1) ────────────────────────────────
  describe('LOD at low zoom', () => {
    it('renders glyph-only when zoomScale < 0.3', () => {
      const { container } = render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="evidenced" x={0} y={0} zoomScale={0.2} />
        </svg>
      );
      // Glyph marker is present...
      expect(container.querySelector('[data-wall-lod="glyph"]')).toBeTruthy();
      // ...but the hub name and findings label are not.
      expect(screen.queryByText(/Nozzle runs hot on night shift/)).toBeNull();
      expect(screen.queryByText(/3 findings/)).toBeNull();
    });

    it('renders glyph + hub name (no findings/chart) when zoomScale < 0.6', () => {
      const { container } = render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} zoomScale={0.5} />
        </svg>
      );
      expect(container.querySelector('[data-wall-lod="medium"]')).toBeTruthy();
      expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
      // Findings count hidden at medium LOD.
      expect(screen.queryByText(/3 findings/)).toBeNull();
    });

    it('renders full card when zoomScale >= 0.6', () => {
      render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} zoomScale={0.8} />
        </svg>
      );
      expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
      expect(screen.getByText(/3 findings/)).toBeInTheDocument();
    });

    it('renders full card when zoomScale is undefined (no LOD)', () => {
      render(
        <svg>
          <HypothesisCard hub={hub} displayStatus="confirmed" x={0} y={0} />
        </svg>
      );
      expect(screen.getByText(/Nozzle runs hot on night shift/)).toBeInTheDocument();
      expect(screen.getByText(/3 findings/)).toBeInTheDocument();
    });
  });
});
