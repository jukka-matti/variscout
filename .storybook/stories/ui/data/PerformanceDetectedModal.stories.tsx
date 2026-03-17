import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceDetectedModal } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Data/PerformanceDetectedModal',
  component: PerformanceDetectedModal,
  tags: ['autodocs'],
} satisfies Meta<typeof PerformanceDetectedModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    channelCount: 12,
    sampleColumns: ['Valve 1', 'Valve 2', 'Valve 3', 'Valve 4'],
    onAccept: () => {},
    onDecline: () => {},
  },
};

export const FewChannels: Story = {
  args: {
    isOpen: true,
    channelCount: 3,
    sampleColumns: ['Head A', 'Head B', 'Head C'],
    onAccept: () => {},
    onDecline: () => {},
  },
};
