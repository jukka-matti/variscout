import type { Meta, StoryObj } from '@storybook/react';
import { PIPanelBase } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Analysis/PIPanelBase',
  component: PIPanelBase,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PIPanelBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tabs: [
      {
        id: 'stats',
        label: 'Stats',
        content: <div className="p-4 text-content">Stats content here</div>,
      },
      {
        id: 'questions',
        label: 'Questions',
        badge: 3,
        content: <div className="p-4 text-content">Questions content here</div>,
      },
      {
        id: 'journal',
        label: 'Journal',
        content: <div className="p-4 text-content">Journal content here</div>,
      },
    ],
  },
};

export const WithOverflow: Story = {
  args: {
    tabs: [
      {
        id: 'stats',
        label: 'Stats',
        content: <div className="p-4 text-content">Stats content here</div>,
      },
    ],
    overflowItems: [
      {
        id: 'data',
        label: 'Data Table',
        content: <div className="p-4 text-content">Data table content</div>,
      },
      {
        id: 'whatif',
        label: 'What-If',
        content: <div className="p-4 text-content">What-If simulator content</div>,
      },
    ],
  },
};

export const Compact: Story = {
  args: {
    compact: true,
    tabs: [
      {
        id: 'stats',
        label: 'Stats',
        content: <div className="p-4 text-content">Stats content here</div>,
      },
      {
        id: 'questions',
        label: 'Questions',
        content: <div className="p-4 text-content">Questions content here</div>,
      },
    ],
  },
};
