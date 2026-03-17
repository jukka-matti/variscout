import type { Meta, StoryObj } from '@storybook/react';
import { CapabilityHistogramBase } from '../../../packages/charts/src/index';

const mockValues = Array.from({ length: 100 }, () => 10.0 + (Math.random() - 0.5) * 2);

const meta = {
  title: 'Charts/CapabilityHistogram',
  component: CapabilityHistogramBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CapabilityHistogramBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockValues,
    specs: { usl: 11.5, lsl: 8.5, target: 10.0 },
    mean: 10.0,
    parentWidth: 600,
    parentHeight: 400,
  },
};

export const OffCenter: Story = {
  args: {
    data: mockValues.map(v => v + 0.8),
    specs: { usl: 11.5, lsl: 8.5, target: 10.0 },
    mean: 10.8,
    parentWidth: 600,
    parentHeight: 400,
  },
};

export const NoSpecs: Story = {
  args: {
    data: mockValues,
    specs: {},
    mean: 10.0,
    parentWidth: 600,
    parentHeight: 400,
  },
};

export const WithBranding: Story = {
  args: {
    ...Default.args,
    showBranding: true,
  },
};
