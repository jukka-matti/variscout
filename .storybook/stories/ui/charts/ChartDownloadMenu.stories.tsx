import type { Meta, StoryObj } from '@storybook/react';
import {
  ChartDownloadMenu,
  chartDownloadMenuDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Charts/ChartDownloadMenu',
  component: ChartDownloadMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof ChartDownloadMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onDownloadPNG: () => {},
    onDownloadSVG: () => {},
    colorScheme: chartDownloadMenuDefaultColorScheme,
  },
};
