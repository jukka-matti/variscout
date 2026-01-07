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
│   └── PWAEmbed.astro          (iframe + skeleton)
├── Act 3: Solution
│   ├── CaseStudyController.tsx (React island)
│   └── RelatedTools.astro
└── CTA Section
    └── WhatsNext.astro
```

---

## React Islands

### CaseStudyController.tsx

**Location**: `apps/website/src/components/CaseStudyController.tsx`

**Hydration**: `client:load` (needed immediately for iframe communication)

**Purpose**: Coordinates iframe messaging and step visibility tracking.

#### Props

```typescript
interface CaseStudyControllerProps {
  iframeId: string; // ID of PWAEmbed iframe
  steps: CaseStep[]; // Step content with targetChart
  defaultIntensity?: HighlightIntensity; // Default: 'pulse'
  onReady?: () => void; // Callback when iframe ready
  onChartClicked?: (chartId: ChartId) => void;
}

interface CaseStep {
  title: string;
  content: string;
  interactive: boolean;
  targetChart?: ChartId;
}
```

#### Features

- Intersection Observer tracks which step is in viewport
- Sends `highlight-chart` messages when step with `targetChart` enters view
- Debounced (150ms) to prevent rapid switching
- "Show me the X" buttons for manual chart focus

#### Usage

```astro
<CaseStudyController
  client:load
  iframeId="pwa-embed-bottleneck"
  steps={steps}
  defaultIntensity="pulse"
/>
```

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

### PWAEmbed.astro (Updated)

**Location**: `apps/website/src/components/PWAEmbed.astro`

**Purpose**: Embeds PWA in iframe with loading states.

#### New Props

| Prop       | Type     | Default                 | Description             |
| ---------- | -------- | ----------------------- | ----------------------- |
| `iframeId` | `string` | `pwa-embed-{sampleKey}` | ID for iframe targeting |

#### New Features

- **Skeleton loader**: Chart-shaped placeholders with pulse animation
- **Ready detection**: Listens for `ready` message from PWA
- **Fallback timeout**: Shows iframe after 5s even without ready message
- **Smooth transition**: Fades in iframe when ready

#### Usage

```astro
<PWAEmbed
  sampleKey="bottleneck"
  title="Interactive Analysis"
  height="650px"
  iframeId="pwa-embed-bottleneck"
/>
```

---

## Case Data Structure

Each case includes metadata for these components:

```typescript
interface CaseProps {
  // Existing
  title: string;
  subtitle: string;
  sampleKey: string;
  steps: CaseStep[];
  nextCase: string | null;

  // New for components
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  time: string;
  tools: ChartId[];
}
```

## Related Documentation

- [Embed Messaging Protocol](../../technical/EMBED_MESSAGING.md)
- [PWA Embed Mode](../pwa/EMBED-MODE.md)
- [Animation System](../../design-system/ANIMATIONS.md)
