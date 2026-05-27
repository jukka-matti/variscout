import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GateBadge } from '../GateBadge';

describe('GateBadge', () => {
  it('renders AND with HOLDS badge', () => {
    render(
      <svg>
        <GateBadge kind="and" gatePath="root" holds={38} total={42} x={0} y={0} />
      </svg>
    );
    expect(screen.getByText('AND')).toBeInTheDocument();
    expect(screen.getByText(/38/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
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
