import type { Meta, StoryObj } from '@storybook/react';
import { AxisEditor, axisEditorDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/AxisEditor',
  component: AxisEditor,
  tags: ['autodocs'],
} satisfies Meta<typeof AxisEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    axis: 'y',
    currentLabel: 'Weight (g)',
    onLabelChange: () => {},
    onClose: () => {},
    colorScheme: axisEditorDefaultColorScheme,
  },
};

export const XAxis: Story = {
  args: {
    isOpen: true,
    axis: 'x',
    currentLabel: 'Machine',
    onLabelChange: () => {},
    onClose: () => {},
    colorScheme: axisEditorDefaultColorScheme,
  },
};
