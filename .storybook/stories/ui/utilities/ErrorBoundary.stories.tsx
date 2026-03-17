import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary, errorBoundaryDefaultColorScheme } from '../../../../packages/ui/src/index';

const ThrowError = () => {
  throw new Error('Example error for Storybook');
};

const meta = {
  title: 'UI/Utilities/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithError: Story = {
  args: {
    colorScheme: errorBoundaryDefaultColorScheme,
    children: <ThrowError />,
  },
};

export const NoError: Story = {
  args: {
    colorScheme: errorBoundaryDefaultColorScheme,
    children: (
      <div style={{ padding: 16, color: '#94a3b8' }}>
        This content renders normally when no error occurs.
      </div>
    ),
  },
};
