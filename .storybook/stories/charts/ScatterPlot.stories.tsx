import type { Meta, StoryObj } from '@storybook/react';

/**
 * ScatterPlot is not a standalone export from @variscout/charts.
 * Scatter-like visualization is handled via PerformanceIChart (Cpk scatter)
 * or regression plots. This story serves as a placeholder for future
 * standalone scatter plot extraction.
 */

// Placeholder until ScatterPlot is extracted as a standalone component
const ScatterPlotPlaceholder = ({
  width = 600,
  height = 400,
}: {
  width?: number;
  height?: number;
}) => (
  <div
    style={{
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed #64748b',
      borderRadius: 8,
      color: '#94a3b8',
      fontFamily: 'system-ui',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontWeight: 600 }}>ScatterPlot</p>
      <p style={{ fontSize: 14 }}>
        Scatter visualization is provided by PerformanceIChart (Cpk scatter).
      </p>
      <p style={{ fontSize: 12 }}>See Charts/PerformanceIChart for the live component.</p>
    </div>
  </div>
);

const meta = {
  title: 'Charts/ScatterPlot',
  component: ScatterPlotPlaceholder,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ScatterPlotPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  args: {
    width: 600,
    height: 400,
  },
};
