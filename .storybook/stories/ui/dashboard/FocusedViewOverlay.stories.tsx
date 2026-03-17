import type { Meta, StoryObj } from '@storybook/react';
import { FocusedViewOverlay } from '../../../../packages/ui/src/index';

const meta = {
  title: 'UI/Dashboard/FocusedViewOverlay',
  component: FocusedViewOverlay,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FocusedViewOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    children: (
      <div
        style={{
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 18,
        }}
      >
        Focused chart view content
      </div>
    ),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    children: <div>Hidden content</div>,
  },
};
