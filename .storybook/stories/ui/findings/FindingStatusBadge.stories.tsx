import type { Meta, StoryObj } from '@storybook/react';
import { FindingStatusBadge } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Findings/FindingStatusBadge',
  component: FindingStatusBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof FindingStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Observed: Story = {
  args: {
    status: 'observed',
  },
};

export const Investigating: Story = {
  args: {
    status: 'investigating',
  },
};

export const Analyzed: Story = {
  args: {
    status: 'analyzed',
  },
};
