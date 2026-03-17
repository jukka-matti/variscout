import type { Meta, StoryObj } from '@storybook/react';
import { EditableChartTitle } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Charts/EditableChartTitle',
  component: EditableChartTitle,
  tags: ['autodocs'],
} satisfies Meta<typeof EditableChartTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Fill Weight Analysis',
    onTitleChange: () => {},
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Monthly Production Line B Fill Weight Distribution Analysis',
    onTitleChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    title: '',
    onTitleChange: () => {},
    placeholder: 'Enter chart title...',
  },
};
