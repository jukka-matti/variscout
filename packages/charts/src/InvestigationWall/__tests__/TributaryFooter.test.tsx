import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TributaryFooter } from '../TributaryFooter';
import type { ProcessMapTributary, SuspectedCause } from '@variscout/core';

const tributaries: ProcessMapTributary[] = [
  { id: 't1', stepId: 'n1', column: 'SHIFT' },
  { id: 't2', stepId: 'n2', column: 'SUPPLIER' },
];

describe('TributaryFooter', () => {
  it('renders a chip per tributary', () => {
    render(
      <svg>
        <TributaryFooter tributaries={tributaries} hubs={[]} y={0} canvasWidth={1000} />
      </svg>
    );
    expect(screen.getByText('SHIFT')).toBeInTheDocument();
    expect(screen.getByText('SUPPLIER')).toBeInTheDocument();
  });

  it('dims orphan tributaries (none referenced)', () => {
    const { container } = render(
      <svg>
        <TributaryFooter tributaries={tributaries} hubs={[]} y={0} canvasWidth={1000} />
      </svg>
    );
    expect(container.querySelector('[data-orphan="true"]')).toBeTruthy();
  });

  it('does NOT dim tributaries referenced by a hub', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: '',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      tributaryIds: ['t1'],
      createdAt: '',
      updatedAt: '',
    };
    const { container } = render(
      <svg>
        <TributaryFooter tributaries={tributaries} hubs={[hub]} y={0} canvasWidth={1000} />
      </svg>
    );
    expect(
      container.querySelector('[data-testid="tributary-chip-t1"][data-orphan="false"]')
    ).toBeTruthy();
    expect(
      container.querySelector('[data-testid="tributary-chip-t2"][data-orphan="true"]')
    ).toBeTruthy();
  });
});
