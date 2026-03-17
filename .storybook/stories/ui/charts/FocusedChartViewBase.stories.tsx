import type { Meta, StoryObj } from '@storybook/react';
import { FocusedChartViewBase } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Charts/FocusedChartViewBase',
  component: FocusedChartViewBase,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FocusedChartViewBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activeChart: 'ichart',
    navigation: {
      onPrevious: () => {},
      onNext: () => {},
      hasPrevious: true,
      hasNext: true,
    },
    chartExport: {
      onCopy: () => {},
      onDownloadPNG: () => {},
      onDownloadSVG: () => {},
    },
    ichartSection: {
      chart: <div style={{ height: 400, background: '#1e293b', borderRadius: 8 }} />,
    },
    boxplotSection: {
      chart: <div style={{ height: 400, background: '#1e293b', borderRadius: 8 }} />,
    },
    paretoSection: {
      chart: <div style={{ height: 400, background: '#1e293b', borderRadius: 8 }} />,
    },
  },
};
