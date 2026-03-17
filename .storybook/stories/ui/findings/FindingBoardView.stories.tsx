import type { Meta, StoryObj } from '@storybook/react';
import { FindingBoardView } from '../../../../packages/ui/src/index';
import type { Finding } from '../../../../packages/core/src/findings';

const now = Date.now();

const mockFindings: Finding[] = [
  {
    id: '1',
    text: 'Line B runs above target',
    createdAt: now - 7200000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: now - 7200000,
  },
  {
    id: '2',
    text: 'Night shift variability is higher',
    createdAt: now - 5000000,
    context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: 0.35 },
    status: 'observed',
    comments: [],
    statusChangedAt: now - 5000000,
  },
  {
    id: '3',
    text: 'Investigating temperature correlation',
    createdAt: now - 3600000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'investigating',
    comments: [{ id: 'c1', text: 'Running regression', createdAt: now - 1800000 }],
    statusChangedAt: now - 3000000,
  },
  {
    id: '4',
    text: 'Confirmed: temperature is the key driver',
    createdAt: now - 1200000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'analyzed',
    tag: 'key-driver',
    comments: [],
    statusChangedAt: now - 600000,
  },
];

const meta = {
  title: 'UI/Findings/FindingBoardView',
  component: FindingBoardView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FindingBoardView>;

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
