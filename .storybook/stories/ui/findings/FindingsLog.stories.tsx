import type { Meta, StoryObj } from '@storybook/react';
import { FindingsLog } from '../../../../packages/ui/src/index';
import type { Finding } from '../../../../packages/core/src/findings';

const now = Date.now();

const mockFindings: Finding[] = [
  {
    id: '1',
    text: 'Line B consistently runs 0.3g above target',
    createdAt: now - 7200000,
    context: {
      activeFilters: {},
      cumulativeScope: null,
      stats: { mean: 10.3, cpk: 0.92, samples: 30 },
    },
    status: 'observed',
    comments: [],
    statusChangedAt: now - 7200000,
  },
  {
    id: '2',
    text: 'Night shift shows higher variability than day shift',
    createdAt: now - 3600000,
    context: {
      activeFilters: { Shift: ['Night'] },
      cumulativeScope: 0.35,
      stats: { mean: 10.0, cpk: 1.1, samples: 45 },
    },
    status: 'investigating',
    comments: [{ id: 'c1', text: 'Checking operator training records', createdAt: now - 1800000 }],
    statusChangedAt: now - 3000000,
  },
  {
    id: '3',
    text: 'Temperature correlation confirmed with R-squared 0.78',
    createdAt: now - 1200000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'analyzed',
    tag: 'key-driver',
    comments: [],
    statusChangedAt: now - 600000,
  },
];

const meta = {
  title: 'UI/Findings/FindingsLog',
  component: FindingsLog,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FindingsLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    findings: mockFindings,
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
  },
};

export const Empty: Story = {
  args: {
    findings: [],
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
  },
};
