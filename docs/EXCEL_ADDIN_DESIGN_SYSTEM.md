# Excel Add-in Design System

**Version:** 1.0
**Last Updated:** December 2024
**Status:** Active

This document defines the design system for the VariScout Excel Add-in, formalizing UI patterns, colors, typography, spacing, and component guidelines used across the Task Pane and Content Add-in.

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Theme Configuration](#2-theme-configuration)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing System](#5-spacing-system)
6. [Component Library](#6-component-library)
7. [Icon Guidelines](#7-icon-guidelines)
8. [Layout Patterns](#8-layout-patterns)
9. [Status & Feedback](#9-status--feedback)
10. [Accessibility](#10-accessibility)
11. [Code Examples](#11-code-examples)

---

## 1. Overview & Principles

### Design Philosophy

The Excel Add-in follows Microsoft's **Fluent UI** design language to provide a native Office experience while maintaining VariScout's identity in chart visualizations.

### Core Principles

| Principle                  | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| **Native Feel**            | Use Fluent UI components to match Office 365 experience           |
| **Two-Theme Architecture** | Light theme for Task Pane, dark theme for Content Add-in (charts) |
| **Token-Based Styling**    | Use Fluent UI design tokens for consistency                       |
| **Accessibility First**    | WCAG 2.1 AA compliance through Fluent UI                          |
| **Professional Data Viz**  | Charts match PWA quality using Visx                               |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Excel Add-in UI Architecture                               │
│                                                             │
│  ┌───────────────────────┐  ┌───────────────────────────┐  │
│  │  TASK PANE            │  │  CONTENT ADD-IN           │  │
│  │  (Light Theme)        │  │  (Dark Theme)             │  │
│  │                       │  │                           │  │
│  │  • Fluent UI v9       │  │  • Custom dark palette    │  │
│  │  • webLightTheme      │  │  • Visx charts            │  │
│  │  • Setup & config     │  │  • Embedded in worksheet  │  │
│  └───────────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Theme Configuration

### Task Pane Setup

The Task Pane uses Fluent UI's standard light theme:

```tsx
// apps/excel-addin/src/main.tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

root.render(
  <FluentProvider theme={webLightTheme}>
    <App />
  </FluentProvider>
);
```

### Styling Approach

All components use `makeStyles` with design tokens:

```tsx
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingVerticalL,
  },
});
```

**Important:** Never use hardcoded colors in Task Pane components. Always use Fluent UI tokens.

---

## 3. Color System

### 3.1 Light Theme (Task Pane)

#### Brand Colors

| Token                   | Usage                          | Example                 |
| ----------------------- | ------------------------------ | ----------------------- |
| `colorBrandForeground1` | Primary accent, headers, icons | Step icons, page titles |

#### Neutral Colors

| Token                     | Usage                | Example                       |
| ------------------------- | -------------------- | ----------------------------- |
| `colorNeutralBackground1` | Main background      | Root container                |
| `colorNeutralBackground3` | Secondary background | Data preview areas            |
| `colorNeutralForeground1` | Primary text         | Body content                  |
| `colorNeutralForeground2` | Secondary text       | Descriptions, hints, disabled |
| `colorNeutralStroke1`     | Borders, dividers    | Section separators            |

#### Status Colors

| Token                             | Meaning            | Usage                     |
| --------------------------------- | ------------------ | ------------------------- |
| `colorPaletteGreenBackground1`    | Success background | Config success banner     |
| `colorPaletteGreenForeground1`    | Success text       | Pass indicators, good Cpk |
| `colorPaletteMarigoldForeground1` | Warning text       | Medium Cpk (1.0-1.33)     |
| `colorPaletteYellowForeground2`   | Warning (alt)      | Warning messages          |
| `colorPaletteRedForeground1`      | Error text         | Errors, poor Cpk (<1.0)   |

### 3.2 Dark Theme (Content Add-in)

The Content Add-in uses a **token-based dark theme** system defined in `apps/excel-addin/src/lib/darkTheme.ts`. This matches the PWA's Tailwind slate palette while providing semantic token names.

**Important:** Always use `darkTheme` tokens instead of hardcoded hex values in Content Add-in components.

```tsx
import { darkTheme } from '../lib/darkTheme';

// ✅ Correct - use tokens
backgroundColor: darkTheme.colorNeutralBackground1,

// ❌ Incorrect - hardcoded hex
backgroundColor: '#1e293b',
```

#### Dark Theme Token Reference

| Token                          | Hex       | Usage                       |
| ------------------------------ | --------- | --------------------------- |
| `colorNeutralBackground1`      | `#1e293b` | Main container background   |
| `colorNeutralBackground2`      | `#334155` | Card/section backgrounds    |
| `colorNeutralBackground3`      | `#475569` | Interactive/hover states    |
| `colorNeutralForeground1`      | `#f1f5f9` | Primary text                |
| `colorNeutralForeground2`      | `#94a3b8` | Secondary text, labels      |
| `colorNeutralForeground3`      | `#64748b` | Tertiary text, empty state  |
| `colorNeutralForeground4`      | `#475569` | Disabled text               |
| `colorNeutralStroke1`          | `#475569` | Primary borders             |
| `colorNeutralStroke2`          | `#334155` | Subtle borders              |
| `colorBrandForeground1`        | `#3b82f6` | Accent, links, focus        |
| `colorBrandForeground2`        | `#60a5fa` | Secondary accent            |
| `colorStatusSuccessForeground` | `#22c55e` | Success, pass, good metrics |
| `colorStatusDangerForeground`  | `#ef4444` | Error, fail, poor metrics   |
| `colorStatusWarningForeground` | `#f59e0b` | Warning states              |

#### Spacing & Layout Tokens

| Token           | Value | Usage                     |
| --------------- | ----- | ------------------------- |
| `spacingXS`     | 4px   | Minimal gaps              |
| `spacingS`      | 8px   | Small spacing, list items |
| `spacingM`      | 12px  | Standard gaps             |
| `spacingL`      | 16px  | Card padding              |
| `spacingXL`     | 24px  | Section gaps              |
| `borderRadiusS` | 4px   | Small elements            |
| `borderRadiusM` | 8px   | Cards, containers         |
| `borderRadiusL` | 12px  | Large panels              |

#### Typography Tokens

| Token                | Value | Usage              |
| -------------------- | ----- | ------------------ |
| `fontSizeCaption`    | 10px  | Labels, small text |
| `fontSizeSmall`      | 12px  | Secondary text     |
| `fontSizeBody`       | 14px  | Body text          |
| `fontSizeTitle`      | 16px  | Stat values        |
| `fontSizeHeading`    | 18px  | Section headings   |
| `fontWeightSemibold` | 600   | Emphasis           |
| `fontWeightBold`     | 700   | Strong emphasis    |

### 3.3 Capability Metrics Color Coding

Use these colors for Cpk/Cp values:

```tsx
// Cpk color logic
const getCpkColor = (cpk: number, target: number = 1.33) => {
  if (cpk >= target) return tokens.colorPaletteGreenForeground1; // Good
  if (cpk >= 1.0) return tokens.colorPaletteMarigoldForeground1; // Medium
  return tokens.colorPaletteRedForeground1; // Poor
};
```

| Threshold  | Color    | Meaning                      |
| ---------- | -------- | ---------------------------- |
| ≥ 1.33     | Green    | Meets industry standard      |
| 1.0 - 1.33 | Marigold | Acceptable, needs monitoring |
| < 1.0      | Red      | Needs improvement            |

---

## 4. Typography

### 4.1 Semantic Components

Use Fluent UI typography components for consistent hierarchy:

| Component    | Purpose                          | Example                    |
| ------------ | -------------------------------- | -------------------------- |
| `<Title3>`   | Page headings                    | "VariScout Setup"          |
| `<Body1>`    | Primary content, section headers | Form labels, card titles   |
| `<Body2>`    | Secondary content                | Descriptions, instructions |
| `<Caption1>` | Small helper text                | "Step 1 of 5"              |
| `<Label>`    | Form field labels                | Input labels               |

### 4.2 Typography Tokens

| Token                | Size | Usage                     |
| -------------------- | ---- | ------------------------- |
| `fontSizeBase200`    | 12px | Small labels, stat labels |
| `fontSizeBase400`    | 14px | Body text (default)       |
| `fontSizeBase600`    | 20px | Large stat values         |
| `fontWeightSemibold` | 600  | Headers, titles           |
| `fontWeightBold`     | 700  | Stat values, emphasis     |

### 4.3 Special Typography

```tsx
// Monospace for numeric values
statValue: {
  fontFamily: 'monospace',
  fontWeight: tokens.fontWeightBold,
  fontSize: tokens.fontSizeBase600,
}

// Uppercase labels
statLabel: {
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontSize: tokens.fontSizeBase200,
}
```

---

## 5. Spacing System

### 5.1 Vertical Spacing

| Token               | Size | Usage                          |
| ------------------- | ---- | ------------------------------ |
| `spacingVerticalXS` | 4px  | Minimal gaps, within groups    |
| `spacingVerticalS`  | 8px  | Small spacing, list items      |
| `spacingVerticalM`  | 16px | Standard spacing, card padding |
| `spacingVerticalL`  | 32px | Large spacing, section gaps    |

### 5.2 Horizontal Spacing

| Token                | Size | Usage                            |
| -------------------- | ---- | -------------------------------- |
| `spacingHorizontalS` | 8px  | Icon-text gaps in rows           |
| `spacingHorizontalM` | 16px | Standard gaps, grid gutters      |
| `spacingHorizontalL` | 32px | Large padding, container margins |

### 5.3 Usage Guidelines

```tsx
// Container with standard gap
container: {
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingVerticalL,        // 32px between major sections
  padding: tokens.spacingHorizontalL,   // 32px container padding
}

// Card internal padding
card: {
  padding: tokens.spacingVerticalM,     // 16px
}

// Form field spacing
formGroup: {
  marginBottom: tokens.spacingVerticalM, // 16px between fields
}

// Icon with label
stepHeader: {
  gap: tokens.spacingHorizontalM,        // 16px icon-to-text
}
```

---

## 6. Component Library

### 6.1 Card

Use for grouping related content:

```tsx
<Card className={styles.card}>
  <CardHeader
    image={<TableSimple24Regular />}
    header={<Body1>Section Title</Body1>}
    description={<Caption1>Optional description</Caption1>}
  />
  {/* Content */}
</Card>
```

### 6.2 Button

Three appearance levels:

```tsx
// Primary - main CTA
<Button appearance="primary" icon={<ArrowRight24Regular />}>
  Next
</Button>

// Secondary - alternative action
<Button appearance="secondary">
  Submit
</Button>

// Subtle - tertiary actions
<Button appearance="subtle" size="small">
  Change Mode
</Button>
```

### 6.3 Form Controls

Always wrap inputs with `<Field>`:

```tsx
// Text input
<Field label="Upper Spec (USL)" required>
  <Input
    type="number"
    value={value}
    onChange={handleChange}
    placeholder="e.g., 15"
  />
</Field>

// Dropdown
<Field label="Outcome Column" required>
  <Dropdown
    value={selected}
    onOptionSelect={(_, data) => setSelected(data.optionValue)}
  >
    {options.map(opt => (
      <Option key={opt} value={opt}>{opt}</Option>
    ))}
  </Dropdown>
</Field>

// Checkbox group
<Field label="Factor Columns">
  <div className={styles.checkboxGroup}>
    {columns.map(col => (
      <Checkbox
        key={col}
        label={col}
        checked={selected.includes(col)}
        onChange={() => toggle(col)}
      />
    ))}
  </div>
</Field>
```

### 6.4 Badge

For status indicators:

```tsx
// Success
<Badge appearance="filled" color="success">
  94% Pass
</Badge>

// Warning
<Badge appearance="filled" color="warning">
  3 Below LSL
</Badge>

// Danger
<Badge appearance="filled" color="danger">
  2 Above USL
</Badge>

// Outline (neutral)
<Badge appearance="outline">
  5 active
</Badge>
```

### 6.5 Tabs

For section navigation:

```tsx
<TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
  <Tab value="data">Data</Tab>
  <Tab value="chart" disabled={!hasData}>
    Chart
  </Tab>
  <Tab value="stats" disabled={!hasData}>
    Stats
  </Tab>
</TabList>
```

### 6.6 Progress & Loading

```tsx
// Progress bar
<ProgressBar value={currentStep / totalSteps} />

// Loading spinner in button
<Button disabled={isLoading}>
  {isLoading ? <Spinner size="tiny" /> : <Icon />}
  {isLoading ? 'Loading...' : 'Action'}
</Button>
```

---

## 7. Icon Guidelines

### 7.1 Standard Configuration

| Property | Value                   |
| -------- | ----------------------- |
| Size     | 24px                    |
| Weight   | Regular                 |
| Source   | `@fluentui/react-icons` |
| Naming   | `{Name}24Regular`       |

### 7.2 Common Icons

| Icon             | Import                                      | Usage             |
| ---------------- | ------------------------------------------- | ----------------- |
| Table/Data       | `TableSimple24Regular`                      | Data selection    |
| Settings         | `Settings24Regular`                         | Configuration     |
| Filter           | `Filter24Regular`                           | Filtering         |
| Chart            | `ChartMultiple24Regular`                    | Analysis          |
| Success          | `Checkmark24Regular`                        | Completion        |
| Success (circle) | `CheckmarkCircle24Regular`                  | Pass status       |
| Error (circle)   | `DismissCircle24Regular`                    | Fail status       |
| Navigation       | `ArrowLeft24Regular`, `ArrowRight24Regular` | Wizard navigation |
| Refresh          | `ArrowSync24Regular`                        | Reload action     |
| Edit             | `Edit24Regular`                             | Edit mode         |
| Reset            | `ArrowReset24Regular`                       | Reset action      |
| Stats            | `DataBarVertical24Regular`                  | Statistics        |
| Trends           | `ArrowTrendingLines24Regular`               | Trend analysis    |

### 7.3 Icon Usage

```tsx
// In step header
<div className={styles.stepHeader}>
  <TableSimple24Regular className={styles.stepIcon} />
  <Body1>Select Data Range</Body1>
</div>

// With color
<CheckmarkCircle24Regular
  style={{ color: tokens.colorPaletteGreenForeground1 }}
/>

// In button
<Button icon={<ArrowSync24Regular />}>
  Refresh
</Button>
```

---

## 8. Layout Patterns

### 8.1 Page Container

```tsx
root: {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: tokens.colorNeutralBackground1,
}
```

### 8.2 Header Row

```tsx
headerRow: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}
```

### 8.3 Content Area

```tsx
content: {
  flex: 1,
  overflow: 'auto',
  padding: tokens.spacingHorizontalL,
}
```

### 8.4 Form Grids

```tsx
// 2-column input grid
specInputs: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: tokens.spacingHorizontalM,
}

// 3-column stats grid
statsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: tokens.spacingVerticalS,
}
```

### 8.5 Button Row (Footer)

```tsx
buttonRow: {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 'auto',  // Push to bottom
  paddingTop: tokens.spacingVerticalL,
  borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
}
```

### 8.6 Content Add-in Layout

```tsx
import { darkTheme } from '../lib/darkTheme';

// Main container
container: {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: darkTheme.colorNeutralBackground1,
  padding: darkTheme.spacingM,
  boxSizing: 'border-box',
}

// Charts row (side-by-side)
chartsRow: {
  flex: 1,
  display: 'flex',
  gap: darkTheme.spacingM,
  minHeight: 0,
}
```

---

## 9. Status & Feedback

### 9.1 Success State

```tsx
<div className={styles.successMessage}>
  <Checkmark24Regular />
  <Body1>Data loaded successfully</Body1>
</div>

successMessage: {
  display: 'flex',
  alignItems: 'center',
  gap: tokens.spacingHorizontalS,
  color: tokens.colorPaletteGreenForeground1,
}
```

### 9.2 Error State

```tsx
<Body2 role="alert" aria-live="polite" style={{ color: tokens.colorPaletteRedForeground1 }}>
  {errorMessage}
</Body2>
```

### 9.3 Loading State

```tsx
// Full page loading
<div className={styles.loading}>
  <Spinner />
  <Body1>Loading configuration...</Body1>
</div>

// Button loading
<Button disabled={isLoading}>
  {isLoading ? <Spinner size="tiny" /> : null}
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

### 9.4 Empty State

```tsx
import { darkTheme } from '../lib/darkTheme';

<div style={styles.empty}>
  <p>No data visible</p>
  <p style={{ fontSize: darkTheme.fontSizeSmall, marginTop: darkTheme.spacingS }}>
    Clear your slicer selections to see all data.
  </p>
</div>

empty: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: darkTheme.colorNeutralForeground3,
  textAlign: 'center',
  padding: darkTheme.spacingL,
}
```

### 9.5 Conformance Display

```tsx
// Pass/Fail row pattern
<div className={styles.conformanceRow}>
  <div className={styles.passRate}>
    <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
    <span>Pass</span>
  </div>
  <Badge appearance="filled" color="success">
    {conformance.pass} ({conformance.passRate.toFixed(1)}%)
  </Badge>
</div>
```

---

## 10. Accessibility

### 10.1 Built-in Compliance

Fluent UI components provide:

- ARIA attributes automatically
- Keyboard navigation
- Focus management
- Screen reader support

### 10.2 Required Practices

```tsx
// Always provide labels for inputs
<Field label="Spec Limit" required>
  <Input id="spec-input" />
</Field>

// Use semantic roles for alerts
<Body2 role="alert" aria-live="polite">
  {errorMessage}
</Body2>

// Provide button context
<Button aria-label="Navigate to next step">
  <ArrowRight24Regular />
</Button>
```

### 10.3 Color Contrast

- Light theme: Fluent UI tokens ensure WCAG AA compliance
- Dark theme: Custom palette tested for 4.5:1 contrast ratio
  - `#f1f5f9` on `#1e293b` = 12.6:1 (passes AAA)
  - `#94a3b8` on `#1e293b` = 5.1:1 (passes AA)

---

## 11. Code Examples

### 11.1 Complete Card Component

```tsx
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Body1,
  Caption1,
  Field,
  Input,
  Button,
} from '@fluentui/react-components';
import { DataBarVertical24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalM,
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  buttonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
});

export const SpecCard: React.FC = () => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<DataBarVertical24Regular />}
        header={<Body1>Specification Limits</Body1>}
        description={<Caption1>Set USL and LSL for capability analysis</Caption1>}
      />

      <div className={styles.inputRow}>
        <Field label="USL (Upper)">
          <Input type="number" placeholder="e.g., 15" />
        </Field>
        <Field label="LSL (Lower)">
          <Input type="number" placeholder="e.g., 10" />
        </Field>
      </div>

      <div className={styles.buttonRow}>
        <Button appearance="primary">Apply</Button>
        <Button appearance="subtle">Reset</Button>
      </div>
    </Card>
  );
};
```

### 11.2 Stats Display with Color Coding

```tsx
const StatItem: React.FC<{
  label: string;
  value: string;
  color?: 'green' | 'orange' | 'red';
}> = ({ label, value, color }) => {
  const colorMap = {
    green: tokens.colorPaletteGreenForeground1,
    orange: tokens.colorPaletteMarigoldForeground1,
    red: tokens.colorPaletteRedForeground1,
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: tokens.fontSizeBase200,
          color: tokens.colorNeutralForeground2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: tokens.fontSizeBase600,
          fontWeight: tokens.fontWeightBold,
          fontFamily: 'monospace',
          color: color ? colorMap[color] : tokens.colorNeutralForeground1,
        }}
      >
        {value}
      </div>
    </div>
  );
};

// Usage
<StatItem
  label="Cpk"
  value={stats.cpk.toFixed(2)}
  color={stats.cpk >= 1.33 ? 'green' : stats.cpk >= 1 ? 'orange' : 'red'}
/>;
```

### 11.3 Dark Theme Container (Content Add-in)

```tsx
import { darkTheme } from '../lib/darkTheme';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkTheme.colorNeutralBackground1,
    color: darkTheme.colorNeutralForeground1,
    padding: darkTheme.spacingM,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    gap: darkTheme.spacingXL,
    padding: `${darkTheme.spacingS}px ${darkTheme.spacingM}px`,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    marginBottom: darkTheme.spacingM,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: darkTheme.fontSizeCaption,
    color: darkTheme.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: darkTheme.fontSizeTitle,
    fontWeight: darkTheme.fontWeightSemibold,
    fontFamily: 'monospace',
  },
  chartsRow: {
    flex: 1,
    display: 'flex',
    gap: darkTheme.spacingM,
    minHeight: 0,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    padding: darkTheme.spacingS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
```

---

## Quick Reference

### Token Cheat Sheet

| Category           | Token                             | Value       |
| ------------------ | --------------------------------- | ----------- |
| **Background**     | `colorNeutralBackground1`         | White       |
| **Text Primary**   | `colorNeutralForeground1`         | Dark gray   |
| **Text Secondary** | `colorNeutralForeground2`         | Medium gray |
| **Border**         | `colorNeutralStroke1`             | Light gray  |
| **Brand**          | `colorBrandForeground1`           | Fluent blue |
| **Success**        | `colorPaletteGreenForeground1`    | Green       |
| **Warning**        | `colorPaletteMarigoldForeground1` | Orange      |
| **Error**          | `colorPaletteRedForeground1`      | Red         |
| **Spacing XS**     | `spacingVerticalXS`               | 4px         |
| **Spacing M**      | `spacingVerticalM`                | 16px        |
| **Spacing L**      | `spacingVerticalL`                | 32px        |

### Dark Theme Tokens

Use `darkTheme` from `apps/excel-addin/src/lib/darkTheme.ts` instead of hardcoded hex values:

| Element        | Token                                    | Hex Value |
| -------------- | ---------------------------------------- | --------- |
| Background     | `darkTheme.colorNeutralBackground1`      | `#1e293b` |
| Cards          | `darkTheme.colorNeutralBackground2`      | `#334155` |
| Primary Text   | `darkTheme.colorNeutralForeground1`      | `#f1f5f9` |
| Secondary Text | `darkTheme.colorNeutralForeground2`      | `#94a3b8` |
| Accent         | `darkTheme.colorBrandForeground1`        | `#3b82f6` |
| Success        | `darkTheme.colorStatusSuccessForeground` | `#22c55e` |
| Error          | `darkTheme.colorStatusDangerForeground`  | `#ef4444` |

---

## Related Documentation

- [Excel Add-in Strategy](concepts/EXCEL_ADDIN_STRATEGY.md) - Architecture decisions
- [Subscription Licensing](concepts/SUBSCRIPTION_LICENSING.md) - Licensing and pricing
- [Monorepo Architecture](MONOREPO_ARCHITECTURE.md) - Package structure
- [Fluent UI Documentation](https://react.fluentui.dev/) - Component reference
