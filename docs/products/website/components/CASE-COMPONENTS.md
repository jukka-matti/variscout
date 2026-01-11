# Case Study Components

Components used in the interactive case study pages (`/[lang]/cases/[slug]`).

## Architecture Overview

```
Case Study Page
├── CaseProgress.astro          (desktop progress indicator)
├── StickyMobileCTA.astro       (mobile CTA)
├── Act 1: Problem
│   ├── ScrollReveal.astro      (animations)
│   └── CaseMeta.astro          (difficulty/time)
├── Act 2: Interactive
│   └── CaseStudyChartsIsland   (React Island - multiple charts)
├── Act 3: Solution
│   ├── CaseStepsDisplay.tsx    (React Island - step content)
│   └── RelatedTools.astro
└── CTA Section
    └── WhatsNext.astro
```

---

## React Islands

The website uses React Islands (Astro's partial hydration) to render interactive chart components. Charts are rendered client-side only using `client:only="react"` to avoid SSR issues with visx hooks.

### Data Source

All sample data comes from the `@variscout/data` package, which provides pre-computed chart data:

```typescript
import { getSample } from '@variscout/data';

const sample = getSample('coffee');
// Returns: { rawData, stats, specs, ichartData, boxplotData, paretoData }
```

---

### IChartIsland.tsx

**Location**: `apps/website/src/components/islands/IChartIsland.tsx`

**Purpose**: Renders an I-Chart (Individuals Control Chart) with sample data.

#### Props

```typescript
interface Props {
  sampleKey: string; // Key from @variscout/data (e.g., 'coffee', 'journey')
  height?: number; // Chart height in pixels (default: 400)
}
```

#### Usage

```astro
---
import IChartIsland from '../../components/islands/IChartIsland';
---

<IChartIsland client:only="react" sampleKey="journey" height={450} />
```

---

### BoxplotIsland.tsx

**Location**: `apps/website/src/components/islands/BoxplotIsland.tsx`

**Purpose**: Renders a Boxplot chart for factor comparison.

#### Props

```typescript
interface Props {
  sampleKey: string;
  height?: number;
}
```

#### Usage

```astro
<BoxplotIsland client:only="react" sampleKey="journey" height={450} />
```

---

### ParetoIsland.tsx

**Location**: `apps/website/src/components/islands/ParetoIsland.tsx`

**Purpose**: Renders a Pareto chart for frequency analysis.

#### Props

```typescript
interface Props {
  sampleKey: string;
  height?: number;
}
```

#### Usage

```astro
<ParetoIsland client:only="react" sampleKey="journey" height={450} />
```

---

### ToolChartIsland.tsx

**Location**: `apps/website/src/components/islands/ToolChartIsland.tsx`

**Purpose**: Renders the appropriate chart type based on tool slug. Used on tool pages.

#### Props

```typescript
interface Props {
  toolSlug: string; // Tool identifier (e.g., 'i-chart', 'boxplot', 'pareto')
  sampleKey: string;
  height?: number;
}
```

#### Tool to Chart Mapping

| Tool Slug    | Chart Type          |
| ------------ | ------------------- |
| `i-chart`    | IChartBase          |
| `boxplot`    | BoxplotBase         |
| `pareto`     | ParetoChartBase     |
| `capability` | CapabilityHistogram |
| `regression` | ScatterPlotBase     |
| `gage-rr`    | GageRRChartBase     |

#### Usage

```astro
<ToolChartIsland client:only="react" toolSlug="i-chart" sampleKey="journey" height={450} />
```

---

### CaseStudyChartsIsland.tsx

**Location**: `apps/website/src/components/islands/CaseStudyChartsIsland.tsx`

**Purpose**: Renders multiple charts in a grid layout for case study pages. Supports different chart type combinations per case.

#### Props

```typescript
interface Props {
  sampleKey: string;
  chartTypes?: ('ichart' | 'boxplot' | 'pareto' | 'capability')[];
  height?: number;
}
```

#### Features

- Renders 1-4 charts in responsive grid
- Automatically adjusts layout based on chart count
- Uses pre-computed data from `@variscout/data`

#### Usage

```astro
<CaseStudyChartsIsland
  client:only="react"
  sampleKey="coffee"
  chartTypes={['ichart', 'boxplot', 'pareto']}
  height={400}
/>
```

---

### CaseStepsDisplay.tsx

**Location**: `apps/website/src/components/CaseStepsDisplay.tsx`

**Purpose**: Displays case study steps with titles and content. Replaced the old CaseStudyController that used iframe messaging.

#### Props

```typescript
interface CaseStep {
  title: string;
  content: string;
  interactive?: boolean;
}

interface Props {
  steps: CaseStep[];
}
```

#### Features

- Simple step-by-step display
- No iframe communication needed (charts render directly)
- Scroll-based visibility tracking (optional)

#### Usage

```astro
<CaseStepsDisplay
  client:only="react"
  steps={[
    { title: 'Step 1', content: 'Examine the I-Chart...', interactive: true },
    { title: 'Step 2', content: 'Look at the Boxplot...', interactive: true },
  ]}
/>
```

---

### ChartContainer.tsx

**Location**: `apps/website/src/components/islands/ChartContainer.tsx`

**Purpose**: Responsive wrapper that provides width/height to child chart components via ResizeObserver.

#### Props

```typescript
interface Props {
  height: number;
  children: (dimensions: { width: number; height: number }) => React.ReactNode;
}
```

#### Features

- Uses ResizeObserver for responsive width
- Provides render prop pattern for flexible chart rendering
- Handles container sizing edge cases

---

## Astro Components

### ScrollReveal.astro

**Location**: `apps/website/src/components/ScrollReveal.astro`

**Purpose**: Intersection Observer-based scroll animations.

#### Props

| Prop        | Type                                                                 | Default     | Description                |
| ----------- | -------------------------------------------------------------------- | ----------- | -------------------------- |
| `animation` | `'fade-up' \| 'fade-in' \| 'slide-left' \| 'slide-right' \| 'scale'` | `'fade-up'` | Animation type             |
| `delay`     | `number`                                                             | `0`         | Delay in ms                |
| `duration`  | `number`                                                             | `600`       | Duration in ms             |
| `threshold` | `number`                                                             | `0.1`       | Visibility threshold (0-1) |
| `once`      | `boolean`                                                            | `true`      | Only animate once          |
| `class`     | `string`                                                             | -           | Additional CSS classes     |

#### Usage

```astro
<ScrollReveal animation="fade-up" delay={100}>
  <div>Content appears on scroll</div>
</ScrollReveal>
```

---

### CaseProgress.astro

**Location**: `apps/website/src/components/CaseProgress.astro`

**Purpose**: Progress indicator showing current case and act.

**Visibility**: Desktop only (hidden on mobile to save space)

#### Props

| Prop          | Type          | Description                                |
| ------------- | ------------- | ------------------------------------------ |
| `currentCase` | `string`      | Slug of current case                       |
| `currentAct`  | `1 \| 2 \| 3` | Current act (Problem/Interactive/Solution) |
| `lang`        | `string`      | Language for links                         |

#### Features

- Case dots (1-5) with links to other cases
- Act buttons that smooth-scroll to sections
- Updates automatically based on scroll position

#### Usage

```astro
<CaseProgress currentCase="bottleneck" currentAct={1} lang="en" />
```

---

### StickyMobileCTA.astro

**Location**: `apps/website/src/components/StickyMobileCTA.astro`

**Purpose**: Fixed bottom CTA button for mobile devices.

**Visibility**: Mobile only (<768px)

#### Props

| Prop              | Type     | Default         | Description               |
| ----------------- | -------- | --------------- | ------------------------- |
| `href`            | `string` | `/app`          | Link destination          |
| `text`            | `string` | `'Try Free'`    | Button text               |
| `hideWhenVisible` | `string` | `'cta-section'` | Element ID that hides CTA |

#### Features

- Appears after scrolling 300px
- Hides when main CTA section is visible
- Safe area insets for iOS notch/home indicator

#### Usage

```astro
<StickyMobileCTA href="/app" text="Try Free" hideWhenVisible="cta-section" />
```

---

### CaseMeta.astro

**Location**: `apps/website/src/components/CaseMeta.astro`

**Purpose**: Displays difficulty badge and time estimate.

#### Props

| Prop         | Type                                         | Description                   |
| ------------ | -------------------------------------------- | ----------------------------- |
| `difficulty` | `'beginner' \| 'intermediate' \| 'advanced'` | Skill level                   |
| `time`       | `string`                                     | Time estimate (e.g., "5 min") |
| `tools`      | `string[]`                                   | Optional tool names           |

#### Difficulty Colors

| Level        | Color |
| ------------ | ----- |
| Beginner     | Green |
| Intermediate | Amber |
| Advanced     | Red   |

#### Usage

```astro
<CaseMeta difficulty="beginner" time="5 min" />
```

---

### RelatedTools.astro

**Location**: `apps/website/src/components/RelatedTools.astro`

**Purpose**: Links to tool pages used in the case study.

#### Props

| Prop    | Type        | Description        |
| ------- | ----------- | ------------------ |
| `tools` | `ChartId[]` | Array of tool IDs  |
| `lang`  | `string`    | Language for links |

#### Supported Tools

| ID           | Name             | Icon |
| ------------ | ---------------- | ---- |
| `ichart`     | I-Chart          | 📈   |
| `boxplot`    | Boxplot          | 📊   |
| `pareto`     | Pareto Chart     | 📉   |
| `stats`      | Statistics Panel | 🔢   |
| `regression` | Regression       | 📐   |
| `gagerr`     | Gage R&R         | 🎯   |

#### Usage

```astro
<RelatedTools tools={['ichart', 'boxplot']} lang="en" />
```

---

### WhatsNext.astro

**Location**: `apps/website/src/components/WhatsNext.astro`

**Purpose**: Next case preview and related cases navigation.

#### Props

| Prop          | Type             | Description                       |
| ------------- | ---------------- | --------------------------------- |
| `nextCase`    | `string \| null` | Slug of next case (null for last) |
| `currentCase` | `string`         | Current case slug                 |
| `lang`        | `string`         | Language for links                |

#### Features

- "Up Next" card for next case
- Completion celebration for last case (emoji + message)
- "More Case Studies" grid (2 related cases)
- Progress dots showing position

#### Usage

```astro
<WhatsNext nextCase="hospital-ward" currentCase="bottleneck" lang="en" />
```

---

## Case Data Structure

Each case includes metadata for these components:

```typescript
interface CaseProps {
  title: string;
  subtitle: string;
  sampleKey: string; // Key for @variscout/data
  chartTypes: ChartType[]; // Charts to display
  steps: CaseStep[];
  nextCase: string | null;

  // Component metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  time: string;
  tools: ChartId[];
}
```

## Related Documentation

- [PWA Embed Mode](../pwa/EMBED-MODE.md) - URL parameters for external embedding
- [Animation System](../../design-system/ANIMATIONS.md)
- [@variscout/data Package](../../../MONOREPO_ARCHITECTURE.md) - Sample data source
