import type { Meta, StoryObj } from '@storybook/react';
import { HelpTooltip } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Utilities/HelpTooltip',
  component: HelpTooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof HelpTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    term: 'Cpk',
    content:
      'Process Capability Index (Cpk) measures how well a process meets specification limits, accounting for both spread and centering.',
  },
};

export const WithLearnMore: Story = {
  args: {
    term: 'Control Limits',
    content:
      'Control limits (UCL/LCL) are calculated from the data as mean plus/minus 3 sigma. They represent the natural voice of the process.',
    learnMoreUrl: '#',
  },
};

export const LongContent: Story = {
  args: {
    term: 'ANOVA',
    content:
      'Analysis of Variance (ANOVA) tests whether the means of different groups are statistically different. A significant result (p < 0.05) indicates that at least one group mean differs. The eta-squared value shows what percentage of total variation is explained by the factor.',
  },
};
