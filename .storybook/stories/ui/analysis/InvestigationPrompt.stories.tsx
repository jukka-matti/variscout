import type { Meta, StoryObj } from '@storybook/react';
import {
  InvestigationPrompt,
  investigationPromptDefaultColorScheme,
} from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/InvestigationPrompt',
  component: InvestigationPrompt,
  tags: ['autodocs'],
} satisfies Meta<typeof InvestigationPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    findingCount: 3,
    analyzedCount: 1,
    onOpenFindings: () => {},
    colorScheme: investigationPromptDefaultColorScheme,
  },
};

export const AllAnalyzed: Story = {
  args: {
    findingCount: 5,
    analyzedCount: 5,
    onOpenFindings: () => {},
    colorScheme: investigationPromptDefaultColorScheme,
  },
};

export const NoFindings: Story = {
  args: {
    findingCount: 0,
    analyzedCount: 0,
    onOpenFindings: () => {},
    colorScheme: investigationPromptDefaultColorScheme,
  },
};
