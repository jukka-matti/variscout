import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GateBadge } from '../GateBadge';

describe('GateBadge', () => {
  it('renders AND with HOLDS badge', () => {
    const { container } = render(
      <svg>
        <GateBadge
          kind="and"
          gatePath="root"
          holds={38}
          total={42}
          expression="H1 ∧ H2"
          x={0}
          y={0}
        />
      </svg>
    );
    const badge = container.querySelector('[data-wall-gate-badge="root"]');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('HOLDS 38/42')).toBeInTheDocument();
    expect(screen.getByText('H1 ∧ H2')).toBeInTheDocument();
    expect(screen.getByText('AND')).toHaveAttribute('data-wall-gate-kind', 'and');
  });

  it('uses readable badge geometry instead of a tiny diamond-only glyph', () => {
    const { container } = render(
      <svg>
        <GateBadge
          kind="and"
          gatePath="root"
          holds={38}
          total={42}
          expression="H1 ∧ H2"
          x={0}
          y={0}
        />
      </svg>
    );
    const badge = container.querySelector('[data-wall-gate-badge="root"]');
    const rect = container.querySelector('[data-wall-gate-bg]');
    const primaryLabel = screen.getByText('HOLDS 38/42');
    expect(badge).toHaveAttribute('data-wall-gate-readable', 'true');
    expect(Number(rect?.getAttribute('width'))).toBeGreaterThanOrEqual(190);
    expect(Number(rect?.getAttribute('height'))).toBeGreaterThanOrEqual(42);
    expect(primaryLabel).toHaveAttribute('font-size', '14');
  });

  it('renders OR label', () => {
    render(
      <svg>
        <GateBadge kind="or" gatePath="root.0" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('renders NOT label', () => {
    render(
      <svg>
        <GateBadge kind="not" gatePath="root" x={0} y={0} />
      </svg>
    );
    expect(screen.getByText('NOT')).toBeInTheDocument();
  });

  it('fires onRun on click', () => {
    const onRun = vi.fn();
    render(
      <svg>
        <GateBadge kind="and" gatePath="root" x={0} y={0} onRun={onRun} />
      </svg>
    );
    fireEvent.click(screen.getByRole('button', { name: /gate/i }));
    expect(onRun).toHaveBeenCalledWith('root');
  });

  it('renders em-dash for empty data total', () => {
    render(
      <svg>
        <GateBadge kind="and" gatePath="root" holds={0} total={0} x={0} y={0} />
      </svg>
    );
    expect(screen.getByText(/—\/0/)).toBeInTheDocument();
  });
});
