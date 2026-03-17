import type { Meta, StoryObj } from '@storybook/react';
import { SpecsPopover, specsPopoverDefaultColorScheme } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Input/SpecsPopover',
  component: SpecsPopover,
  tags: ['autodocs'],
} satisfies Meta<typeof SpecsPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    onSpecsChange: () => {},
    onClose: () => {},
    colorScheme: specsPopoverDefaultColorScheme,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    specs: { usl: 11.0, lsl: 9.0 },
    onSpecsChange: () => {},
    onClose: () => {},
    colorScheme: specsPopoverDefaultColorScheme,
  },
};
