import type { Meta, StoryObj } from '@storybook/react';
import { FindingCard } from '../../../../packages/ui/src/index';
import type { Finding } from '../../../../packages/core/src/findings';

const now = Date.now();

const observedFinding: Finding = {
  id: '1',
  text: 'Line B consistently runs 0.3g above target',
  createdAt: now - 7200000,
  context: {
    activeFilters: { Machine: ['Line B'] },
    cumulativeScope: 0.45,
    stats: { mean: 10.3, cpk: 0.92, samples: 30 },
  },
  status: 'observed',
  comments: [],
  statusChangedAt: now - 7200000,
  source: { chart: 'boxplot', category: 'Line B' },
};

const investigatingFinding: Finding = {
  id: '2',
  text: 'Night shift variability exceeds day shift by 40%',
  createdAt: now - 3600000,
  context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: 0.35 },
  status: 'investigating',
  comments: [{ id: 'c1', text: 'Reviewing training records', createdAt: now - 1800000 }],
  statusChangedAt: now - 3000000,
};

const analyzedFinding: Finding = {
  id: '3',
  text: 'Temperature is the primary driver of variation',
  createdAt: now - 600000,
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'analyzed',
  tag: 'key-driver',
  comments: [],
  statusChangedAt: now - 300000,
};

const meta = {
  title: 'UI/Findings/FindingCard',
  component: FindingCard,
  tags: ['autodocs'],
} satisfies Meta<typeof FindingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Observed: Story = {
  args: {
    finding: observedFinding,
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
  },
};

export const Investigating: Story = {
  args: {
    finding: investigatingFinding,
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
  },
};

export const Analyzed: Story = {
  args: {
    finding: analyzedFinding,
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
  },
};
