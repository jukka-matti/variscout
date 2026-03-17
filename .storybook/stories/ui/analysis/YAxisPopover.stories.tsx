import type { Meta, StoryObj } from '@storybook/react';
import { YAxisPopover, yAxisPopoverDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/YAxisPopover',
  component: YAxisPopover,
  tags: ['autodocs'],
} satisfies Meta<typeof YAxisPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    currentMin: 8.0,
    currentMax: 12.0,
    onApply: () => {},
    onReset: () => {},
    onClose: () => {},
    colorScheme: yAxisPopoverDefaultColorScheme,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    currentMin: 8.0,
    currentMax: 12.0,
    onApply: () => {},
    onReset: () => {},
    onClose: () => {},
    colorScheme: yAxisPopoverDefaultColorScheme,
  },
};
