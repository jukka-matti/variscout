import type { Meta, StoryObj } from '@storybook/react';
import { FindingsPanelBase } from '../../../../packages/ui/src/index';
import type { Finding } from '../../../../packages/core/src/findings';

const now = Date.now();

const mockFindings: Finding[] = [
  {
    id: '1',
    text: 'Line B shows elevated mean',
    createdAt: now - 7200000,
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: now - 7200000,
  },
  {
    id: '2',
    text: 'Night shift variability is higher',
    createdAt: now - 3600000,
    context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: 0.35 },
    status: 'investigating',
    comments: [],
    statusChangedAt: now - 3000000,
  },
];

const meta = {
  title: 'UI/Findings/FindingsPanel',
  component: FindingsPanelBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FindingsPanelBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    findings: mockFindings,
    onClose: () => {},
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
    onAddFinding: () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    findings: mockFindings,
    onClose: () => {},
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
    onAddFinding: () => {},
  },
};

export const Empty: Story = {
  args: {
    isOpen: true,
    findings: [],
    onClose: () => {},
    onStatusChange: () => {},
    onDelete: () => {},
    onNavigateToContext: () => {},
    onAddFinding: () => {},
  },
};
