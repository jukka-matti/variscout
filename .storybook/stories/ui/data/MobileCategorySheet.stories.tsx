import type { Meta, StoryObj } from '@storybook/react';
import { MobileCategorySheet } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Data/MobileCategorySheet',
  component: MobileCategorySheet,
  tags: ['autodocs'],
} satisfies Meta<typeof MobileCategorySheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    data: {
      category: 'Machine A',
      stats: { n: 45, mean: 10.2, median: 10.1, stdDev: 0.35 },
    },
    onClose: () => {},
    onDrillDown: () => {},
    onHighlight: () => {},
    onPinAsFinding: () => {},
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    data: null,
    onClose: () => {},
    onDrillDown: () => {},
    onHighlight: () => {},
    onPinAsFinding: () => {},
  },
};
