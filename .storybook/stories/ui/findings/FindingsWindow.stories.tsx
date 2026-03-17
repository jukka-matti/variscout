import type { Meta, StoryObj } from '@storybook/react';
import { FindingsWindow } from '../../../../packages/ui/src/index';
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
    text: 'Temperature is the key driver',
    createdAt: now - 3600000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'analyzed',
    tag: 'key-driver',
    comments: [],
    statusChangedAt: now - 1800000,
  },
];

const meta = {
  title: 'UI/Findings/FindingsWindow',
  component: FindingsWindow,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FindingsWindow>;

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
