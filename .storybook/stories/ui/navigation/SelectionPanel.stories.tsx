import type { Meta, StoryObj } from '@storybook/react';
import { SelectionPanel } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Navigation/SelectionPanel',
  component: SelectionPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SelectionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    measureColumn: 'Weight',
    factorColumns: ['Machine', 'Operator'],
    specs: { usl: 11.0, lsl: 9.0, target: 10.0 },
    sampleCount: 150,
    onEditMapping: () => {},
  },
};

export const NoSpecs: Story = {
  args: {
    measureColumn: 'Temperature',
    factorColumns: ['Zone'],
    specs: {},
    sampleCount: 80,
    onEditMapping: () => {},
  },
};
