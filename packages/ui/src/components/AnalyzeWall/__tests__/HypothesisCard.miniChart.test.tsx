import React from 'react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: Object.assign(vi.fn(), {
    getState: () => ({ addFinding: vi.fn(() => ({ id: 'f-test' })), connectFindingToHub: vi.fn() }),
  }),
  usePreferencesStore: Object.assign(vi.fn(), {
    getState: () => ({ timeLens: { mode: 'rolling', windowSize: 50 } }),
  }),
}));

vi.mock('@variscout/charts', async () => {
  const actual = await vi.importActual<typeof import('@variscout/charts')>('@variscout/charts');
  return {
    ...actual,
    useChartTheme: () => ({
      colors: {
        mean: '#3b82f6',
        control: '#06b6d4',
        warning: '#f59e0b',
        pass: '#22c55e',
        fail: '#ef4444',
        violation: '#f97316',
      },
      chrome: { labelMuted: '#94a3b8' },
    }),
  };
});

import { render, screen } from '@testing-library/react';
import { HypothesisCard } from '../HypothesisCard';
import type { Hypothesis } from '@variscout/core/findings';

const wrapInSvg = (children: React.ReactNode) => (
  <svg>
    <g>{children}</g>
  </svg>
);

const baseHub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle hot on night shift',
  synthesis: '',
  questionIds: [],
  findingIds: [],
  status: 'evidenced',
  investigationId: 'inv-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  condition: { kind: 'leaf', column: 'TEMP', op: 'gt', value: 95 },
};

describe('HypothesisCard mini-chart slot', () => {
  it('renders MiniIChart for numeric factor at full LOD', () => {
    render(
      wrapInSvg(
        <HypothesisCard
          hub={baseHub}
          displayStatus="evidenced"
          x={0}
          y={0}
          rows={[{ TEMP: 90 }, { TEMP: 95 }, { TEMP: 100 }]}
          columnTypes={{ TEMP: 'numeric' }}
        />
      )
    );
    expect(screen.getByTestId('mini-i-chart-path')).toBeInTheDocument();
  });

  it('renders MiniBoxplot for categorical factor when outcome supplied', () => {
    const hub = {
      ...baseHub,
      condition: { kind: 'leaf' as const, column: 'SUPPLIER', op: 'eq' as const, value: 'B' },
    };
    const rows = [
      ...Array.from({ length: 7 }, () => ({ SUPPLIER: 'A', thickness: 1.0 })),
      ...Array.from({ length: 7 }, () => ({ SUPPLIER: 'B', thickness: 1.5 })),
    ];
    render(
      wrapInSvg(
        <HypothesisCard
          hub={hub}
          displayStatus="evidenced"
          x={0}
          y={0}
          rows={rows}
          columnTypes={{ SUPPLIER: 'categorical', thickness: 'numeric' }}
          outcomeColumn="thickness"
        />
      )
    );
    expect(screen.getByTestId('mini-boxplot-box-A')).toBeInTheDocument();
    expect(screen.getByTestId('mini-boxplot-box-B')).toBeInTheDocument();
  });

  it('renders no chart at medium LOD (zoomScale low)', () => {
    render(
      wrapInSvg(
        <HypothesisCard
          hub={baseHub}
          displayStatus="evidenced"
          x={0}
          y={0}
          zoomScale={0.4}
          rows={[{ TEMP: 90 }, { TEMP: 95 }]}
          columnTypes={{ TEMP: 'numeric' }}
        />
      )
    );
    expect(screen.queryByTestId('mini-i-chart-path')).toBeNull();
  });

  it('renders placeholder text for categorical factor without outcome', () => {
    const hub = {
      ...baseHub,
      condition: { kind: 'leaf' as const, column: 'SUPPLIER', op: 'eq' as const, value: 'B' },
    };
    render(
      wrapInSvg(
        <HypothesisCard
          hub={hub}
          displayStatus="evidenced"
          x={0}
          y={0}
          rows={[]}
          columnTypes={{ SUPPLIER: 'categorical' }}
        />
      )
    );
    expect(screen.getByTestId('mini-chart-placeholder')).toBeInTheDocument();
  });
});
