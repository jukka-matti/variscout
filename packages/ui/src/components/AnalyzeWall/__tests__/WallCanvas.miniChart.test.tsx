import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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

import { WallCanvas } from '../WallCanvas';
import type { Hypothesis } from '@variscout/core/findings';

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle hot',
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

describe('WallCanvas mini-chart prop wiring', () => {
  it('passes rows + columnTypes through to HypothesisCard so charts render', () => {
    render(
      <WallCanvas
        hubs={[hub]}
        findings={[]}
        questions={[]}
        problemCpk={0}
        eventsPerWeek={0}
        rows={[{ TEMP: 90 }, { TEMP: 95 }, { TEMP: 100 }]}
        columnTypes={{ TEMP: 'numeric' }}
        outcomeColumn={null}
      />
    );
    expect(screen.getByTestId('mini-i-chart-path')).toBeInTheDocument();
  });
});
