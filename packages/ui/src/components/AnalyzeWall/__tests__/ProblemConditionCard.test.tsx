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

  describe('scope-as-anchor (IM-4a)', () => {
    it('renders the compound condition text when provided', () => {
      render(
        <svg>
          <ProblemConditionCard
            ctsColumn="lead_time"
            cpk={0.82}
            eventsPerWeek={12}
            conditionText="Machine = B ∩ Product = X"
            x={600}
            y={40}
          />
        </svg>
      );
      expect(screen.getByText(/Machine = B/)).toBeInTheDocument();
      expect(screen.getByText(/Product = X/)).toBeInTheDocument();
    });

    it('renders HOLDS N/M from holds + total props', () => {
      render(
        <svg>
          <ProblemConditionCard
            ctsColumn="lead_time"
            cpk={0.82}
            eventsPerWeek={12}
            holds={38}
            total={42}
            x={600}
            y={40}
          />
        </svg>
      );
      expect(screen.getByText(/38\/42/)).toBeInTheDocument();
    });

    it('renders the What-If projected Cpk when provided', () => {
      render(
        <svg>
          <ProblemConditionCard
            ctsColumn="lead_time"
            cpk={0.82}
            eventsPerWeek={12}
            whatIfCpk={1.45}
            x={600}
            y={40}
          />
        </svg>
      );
      expect(screen.getByText(/1\.45/)).toBeInTheDocument();
    });

    it('renders the coverage percentage when provided', () => {
      render(
        <svg>
          <ProblemConditionCard
            ctsColumn="lead_time"
            cpk={0.82}
            eventsPerWeek={12}
            coveragePct={27}
            x={600}
            y={40}
          />
        </svg>
      );
      expect(screen.getByText(/27%/)).toBeInTheDocument();
    });

    it('omits the scope rows entirely when no scope props are passed (back-compat)', () => {
      const { container } = render(
        <svg>
          <ProblemConditionCard ctsColumn="Fill" cpk={1.0} eventsPerWeek={10} x={0} y={0} />
        </svg>
      );
      // No HOLDS / coverage / what-if text leaks into the default render.
      expect(screen.queryByText(/HOLDS/)).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="problem-scope-holds"]')).toBeNull();
    });
  });
});
