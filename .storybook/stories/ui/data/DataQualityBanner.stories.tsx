import type { Meta, StoryObj } from '@storybook/react';
import { DataQualityBanner } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Data/DataQualityBanner',
  component: DataQualityBanner,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DataQualityBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    totalRows: 150,
    validRows: 142,
    invalidRows: 8,
    warnings: ['8 rows had non-numeric values in the Weight column'],
  },
};

export const AllValid: Story = {
  args: {
    totalRows: 100,
    validRows: 100,
    invalidRows: 0,
    warnings: [],
  },
};

export const MultipleWarnings: Story = {
  args: {
    totalRows: 200,
    validRows: 175,
    invalidRows: 25,
    warnings: [
      '15 rows had non-numeric values in the Weight column',
      '10 rows had empty Machine values',
      '3 duplicate timestamps detected',
    ],
  },
};
