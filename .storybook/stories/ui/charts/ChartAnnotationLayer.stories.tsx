import type { Meta, StoryObj } from '@storybook/react';
import { ChartAnnotationLayer } from '../../../../packages/ui/src/index';
import type { Finding } from '../../../../packages/core/src/findings';

const mockFindings: Finding[] = [
  {
    id: '1',
    text: 'Line B shows elevated mean compared to others',
    createdAt: Date.now() - 3600000,
    context: {
      activeFilters: {},
      cumulativeScope: null,
      stats: { mean: 10.5, cpk: 0.92, samples: 30 },
    },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now() - 3600000,
    source: { chart: 'boxplot', category: 'Line B' },
  },
];

const meta = {
  title: 'UI/Charts/ChartAnnotationLayer',
  component: ChartAnnotationLayer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChartAnnotationLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    findings: mockFindings,
    chartType: 'boxplot',
    width: 600,
    height: 400,
  },
};

export const Empty: Story = {
  args: {
    findings: [],
    chartType: 'ichart',
    width: 600,
    height: 400,
  },
};
