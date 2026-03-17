import type { Meta, StoryObj } from '@storybook/react';
import { FindingEditor } from '../../../../packages/ui/src/index';
import type { Finding } from '../../../../packages/core/src/findings';

const now = Date.now();

const mockFinding: Finding = {
  id: '1',
  text: 'Line B consistently runs 0.3g above target',
  createdAt: now - 7200000,
  context: {
    activeFilters: { Machine: ['Line B'] },
    cumulativeScope: 0.45,
    stats: { mean: 10.3, cpk: 0.92, samples: 30 },
  },
  status: 'investigating',
  comments: [
    { id: 'c1', text: 'Checked calibration logs', createdAt: now - 3600000 },
    { id: 'c2', text: 'Operator reports nozzle pressure variance', createdAt: now - 1800000 },
  ],
  statusChangedAt: now - 5000000,
};

const meta = {
  title: 'UI/Findings/FindingEditor',
  component: FindingEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FindingEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    finding: mockFinding,
    onUpdate: () => {},
    onClose: () => {},
  },
};
