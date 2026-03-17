import type { Meta, StoryObj } from '@storybook/react';
import { ColumnMapping } from '../../../../packages/ui/src/index';

const mockColumns = ['Date', 'Weight', 'Machine', 'Operator', 'Shift'];

const meta = {
  title: 'UI/Input/ColumnMapping',
  component: ColumnMapping,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ColumnMapping>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns: mockColumns,
    measureColumn: 'Weight',
    factorColumns: ['Machine'],
    specs: { usl: 11.0, lsl: 9.0 },
    onMeasureChange: () => {},
    onFactorChange: () => {},
    onSpecsChange: () => {},
    onConfirm: () => {},
    maxFactors: 3,
  },
};

export const NoSelection: Story = {
  args: {
    columns: mockColumns,
    measureColumn: '',
    factorColumns: [],
    specs: {},
    onMeasureChange: () => {},
    onFactorChange: () => {},
    onSpecsChange: () => {},
    onConfirm: () => {},
    maxFactors: 3,
  },
};

export const AzureMode: Story = {
  args: {
    ...Default.args,
    maxFactors: 6,
    showBrief: true,
  },
};
