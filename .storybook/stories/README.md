# VariScout Storybook Story Conventions

## File Naming

- `ComponentName.stories.tsx`
- One story file per component

## Title Convention

Stories are organized by category:

| Category               | Title prefix     | Example                          |
| ---------------------- | ---------------- | -------------------------------- |
| Chart primitives       | `Charts/`        | `Charts/IChart`                  |
| UI Input components    | `UI/Input/`      | `UI/Input/ColumnMapping`         |
| UI Data components     | `UI/Data/`       | `UI/Data/DataQualityBanner`      |
| UI Analysis components | `UI/Analysis/`   | `UI/Analysis/AnovaResults`       |
| UI Chart wrappers      | `UI/Charts/`     | `UI/Charts/ChartCard`            |
| UI Navigation          | `UI/Navigation/` | `UI/Navigation/FilterBreadcrumb` |
| UI Findings            | `UI/Findings/`   | `UI/Findings/FindingCard`        |
| UI Simulation          | `UI/Simulation/` | `UI/Simulation/WhatIfSimulator`  |
| UI Dashboard           | `UI/Dashboard/`  | `UI/Dashboard/DashboardGrid`     |
| UI Utilities           | `UI/Utilities/`  | `UI/Utilities/HelpTooltip`       |

## Story Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '../path/to/component';

const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    /* default props */
  },
};
```

## Auto-Generated Docs

Use `tags: ['autodocs']` on every story to enable automatic documentation pages.

## Sample Data

- Import sample datasets from `@variscout/data` (e.g., `SAMPLES`, `getSample`)
- Use `calculateStats` from `@variscout/core` for computed statistical data
- For simple demos, use inline mock data arrays

## Theme Integration

The Storybook toolbar provides:

- **Theme** toggle: Sets `data-theme` attribute (`dark` / `light`)
- **Chart Mode** toggle: Sets `data-chart-mode` attribute (`technical` / `executive`)

Components that read these attributes will respond automatically.

## Color Schemes

Many UI components accept a `colorScheme` prop. Use the exported `defaultScheme` for each component:

```tsx
import { AnovaResults, anovaDefaultColorScheme } from '@variscout/ui';
```
