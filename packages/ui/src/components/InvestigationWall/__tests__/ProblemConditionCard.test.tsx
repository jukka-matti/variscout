import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProblemConditionCard } from '../ProblemConditionCard';

describe('ProblemConditionCard', () => {
  it('renders CTS column, Cpk, and event rate', () => {
    render(
      <svg>
        <ProblemConditionCard
          ctsColumn="Fill < LSL on night shift"
          cpk={0.78}
          eventsPerWeek={42}
          x={600}
          y={40}
        />
      </svg>
    );
    expect(screen.getByText(/Fill < LSL/)).toBeInTheDocument();
    expect(screen.getByText(/0\.78/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('is focusable and has aria-label', () => {
    render(
      <svg>
        <ProblemConditionCard ctsColumn="Fill" cpk={1.0} eventsPerWeek={10} x={0} y={0} />
      </svg>
    );
    const g = screen.getByRole('button', { name: /problem condition/i });
    expect(g.tabIndex).toBe(0);
  });
});
