import type { Meta, StoryObj } from '@storybook/react';
import { FindingComments } from '../../../../packages/ui/src/index';
import type { FindingComment } from '../../../../packages/core/src/findings';

const now = Date.now();

const mockComments: FindingComment[] = [
  {
    id: 'c1',
    text: 'Checked calibration logs - last calibration was 3 weeks ago',
    createdAt: now - 7200000,
  },
  {
    id: 'c2',
    text: 'Operator reports nozzle pressure variance during morning startup',
    createdAt: now - 3600000,
  },
  { id: 'c3', text: 'Maintenance scheduled for next Tuesday', createdAt: now - 1200000 },
];

const meta = {
  title: 'UI/Findings/FindingComments',
  component: FindingComments,
  tags: ['autodocs'],
} satisfies Meta<typeof FindingComments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    comments: mockComments,
    onAddComment: () => {},
  },
};

export const Empty: Story = {
  args: {
    comments: [],
    onAddComment: () => {},
  },
};

export const SingleComment: Story = {
  args: {
    comments: [mockComments[0]],
    onAddComment: () => {},
  },
};
