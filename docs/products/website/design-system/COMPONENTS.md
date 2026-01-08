# UI Components

## Overview

Component library for the VaRiScout website. Each component references design tokens from `TOKENS.md`.

---

## Buttons

### Primary Button

```
┌─────────────────────┐
│   Try Free          │
└─────────────────────┘
```

| Property         | Value                                        |
| ---------------- | -------------------------------------------- |
| Background       | `--color-brand-primary`                      |
| Background Hover | `--color-brand-primary-dark`                 |
| Text Color       | `--color-white`                              |
| Font Size        | `--text-sm`                                  |
| Font Weight      | `--font-medium`                              |
| Padding          | `--space-3` vertical, `--space-6` horizontal |
| Border Radius    | `--radius-md`                                |
| Transition       | `--transition-fast`                          |

### Secondary Button

```
┌─────────────────────┐
│   Watch Demo        │
└─────────────────────┘
```

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Background       | `--color-white`                 |
| Border           | 1px solid `--color-neutral-300` |
| Text Color       | `--color-neutral-700`           |
| Hover Background | `--color-neutral-100`           |

### Ghost Button

```
Learn More →
```

| Property    | Value                        |
| ----------- | ---------------------------- |
| Background  | transparent                  |
| Text Color  | `--color-brand-primary`      |
| Hover Text  | `--color-brand-primary-dark` |
| Font Weight | `--font-medium`              |

### Button Sizes

| Size   | Padding                   | Font Size     |
| ------ | ------------------------- | ------------- |
| Small  | `--space-2` / `--space-4` | `--text-sm`   |
| Medium | `--space-3` / `--space-6` | `--text-sm`   |
| Large  | `--space-4` / `--space-8` | `--text-base` |

---

## Navigation

### Header

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 VaRiScout    Product ▼   Use Cases ▼   Pricing   [Try Free] │
└─────────────────────────────────────────────────────────────────┘
```

| Property      | Value                           |
| ------------- | ------------------------------- |
| Height        | 64px                            |
| Background    | `--color-white`                 |
| Border Bottom | 1px solid `--color-neutral-100` |
| Position      | Sticky top                      |
| Z-Index       | `--z-sticky`                    |
| Max Width     | 1280px (centered)               |
| Padding       | `--space-4` horizontal          |

### Nav Link

| State   | Text Color              | Background            |
| ------- | ----------------------- | --------------------- |
| Default | `--color-neutral-700`   | transparent           |
| Hover   | `--color-neutral-900`   | `--color-neutral-100` |
| Active  | `--color-brand-primary` | transparent           |

### Dropdown Menu

```
┌─────────────────┐
│ Web App         │
│ Excel           │
│ Power BI        │
│ Azure           │
│ ─────────────── │
│ Compare →       │
└─────────────────┘
```

| Property      | Value                           |
| ------------- | ------------------------------- |
| Background    | `--color-white`                 |
| Border        | 1px solid `--color-neutral-200` |
| Border Radius | `--radius-lg`                   |
| Shadow        | `--shadow-lg`                   |
| Padding       | `--space-2`                     |
| Min Width     | 200px                           |

---

## Cards

### Feature Card

```
┌─────────────────────────────┐
│  📊                         │
│                             │
│  See Variation              │
│                             │
│  I-Chart, Boxplot, Pareto   │
│  — all visible at once      │
└─────────────────────────────┘
```

| Property      | Value                           |
| ------------- | ------------------------------- |
| Background    | `--color-white`                 |
| Border        | 1px solid `--color-neutral-100` |
| Border Radius | `--radius-lg`                   |
| Padding       | `--space-6`                     |
| Shadow        | `--shadow-sm`                   |
| Hover Shadow  | `--shadow-md`                   |

### Product Card (Clickable)

```
┌─────────────────────────────────┐
│                                 │
│  VaRiScout Web                  │
│                                 │
│  Browser-based, install as app  │
│  No download required           │
│                                 │
│  From €0          [Learn More]  │
│                                 │
└─────────────────────────────────┘
```

| Property      | Value                           |
| ------------- | ------------------------------- |
| Background    | `--color-white`                 |
| Border        | 1px solid `--color-neutral-200` |
| Hover Border  | `--color-brand-primary`         |
| Border Radius | `--radius-xl`                   |
| Padding       | `--space-6`                     |

### Pricing Card

```
┌─────────────────────────────────┐
│           TEAM                  │
│                                 │
│         €399/year               │
│                                 │
│  • Up to 10 users               │
│  • Power BI visuals             │
│  • Microsoft certified          │
│                                 │
│        [Get Started]            │
└─────────────────────────────────┘
```

| Property   | Default                         | Highlighted             |
| ---------- | ------------------------------- | ----------------------- |
| Background | `--color-white`                 | `--color-brand-primary` |
| Border     | 1px solid `--color-neutral-200` | none                    |
| Text Color | `--color-neutral-900`           | `--color-white`         |

---

## Hero Section

### Component: Hero

Basic hero with optional AVERAGES visual hook.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         See Beyond Averages. Find your 46%.                     │
│                                                                 │
│    46% of your improvement potential may be hiding...           │
│                                                                 │
│           [Try Free]    [Take the Journey]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Element         | Style                                                 |
| --------------- | ----------------------------------------------------- |
| Headline        | `--text-5xl` / `--font-bold` / `--color-neutral-900`  |
| Subhead         | `--text-xl` / `--font-normal` / `--color-neutral-600` |
| CTA Gap         | `--space-4`                                           |
| Section Padding | `--space-20` vertical                                 |
| Max Width       | 800px (text), centered                                |

### Component: Hero with AVERAGES Hook

When `showAveragesHook={true}`, displays the AVERAGES visual:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         See Beyond Averages. Find your 46%.                     │
│                                                                 │
│           [Try Free]    [Take the Journey]                      │
│                                                                 │
│     ┌─────────────────────────────────────────────────┐        │
│     │  YOUR DASHBOARD SAYS:                           │        │
│     │                                                 │        │
│     │   [████ 96%] [████ 94%] [████ 95%]             │        │
│     │   Factor A   Factor B   Factor C               │        │
│     │                                                 │        │
│     │   "Everything looks fine. 95% pass rate."      │        │
│     └─────────────────────────────────────────────────┘        │
│                                                                 │
│                      But is it?                                 │
│                                                                 │
│              [↓ See what's hiding]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Element        | Style                                         |
| -------------- | --------------------------------------------- |
| Dashboard Card | `--color-neutral-900` background              |
| Bar Chart      | `--color-green-500` bars, height varies       |
| "But is it?"   | `--text-2xl` / `--font-bold`                  |
| Arrow Link     | `--color-brand-primary` with bounce animation |

---

## MiniJourney Section

### Component: MiniJourney

Before/after transformation showing the "aha moment" in one scroll.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE TRANSFORMATION                           │
│                                                                 │
│   ┌───────────────────────┐   ┌───────────────────────┐        │
│   │  ALL DATA MIXED       │   │  FILTERED BY FACTOR   │        │
│   │                       │   │                       │        │
│   │  [Chaotic I-Chart]    │   │  [Clean I-Chart]      │        │
│   │  UCL ─────────────    │   │  UCL ─────────────    │        │
│   │      ●  ●             │   │                       │        │
│   │   ●       ●  ●        │   │    ● ● ● ● ● ● ●     │        │
│   │  ─────────────── x̄    │   │  ─────────────── x̄    │        │
│   │     ●  ●    ●         │   │                       │        │
│   │  LCL ─────────────    │   │  LCL ─────────────    │        │
│   │                       │   │                       │        │
│   │  "Looks unstable"     │   │  "Factor A stable"    │        │
│   └───────────────────────┘   └───────────────────────┘        │
│                                                                 │
│          Same data. Different questions.                        │
│          46% of variation in one place.                         │
│                                                                 │
│              [Take the Full Journey →]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Property        | Value                               |
| --------------- | ----------------------------------- |
| Background      | `--color-neutral-900`               |
| Text Color      | `--color-white`                     |
| Section Padding | `--space-24` vertical               |
| Card Background | `--color-neutral-800` (50% opacity) |
| Before Badge    | `--color-red-500` (Chaotic)         |
| After Badge     | `--color-green-500` (Clear)         |
| Discovery Box   | `--color-purple-500` accent         |

---

## Four Pillars Section

### Component: FourPillars

Color-coded cards representing the VaRiScout methodology pillars.

```
┌─────────────────────────────────────────────────────────────────┐
│              Four Questions. Four Tools.                        │
│                                                                 │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐│
│   │   CHANGE    │ │    FLOW     │ │   FAILURE   │ │   VALUE   ││
│   │   (blue)    │ │  (orange)   │ │    (red)    │ │  (green)  ││
│   │             │ │             │ │             │ │           ││
│   │ Is it       │ │ Which       │ │ Where do    │ │ Does it   ││
│   │ stable?     │ │ factor?     │ │ problems    │ │ meet      ││
│   │             │ │             │ │ cluster?    │ │ specs?    ││
│   │             │ │             │ │             │ │           ││
│   │ I-Chart     │ │ Boxplot     │ │ Pareto      │ │Capability ││
│   │             │ │             │ │             │ │           ││
│   │ Learn more →│ │ Learn more →│ │ Learn more →│ │Learn more→││
│   └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘│
│                                                                 │
│              [Experience the full journey →]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Property        | Value                                 |
| --------------- | ------------------------------------- |
| Background      | `--color-neutral-50`                  |
| Section Padding | `--space-24` vertical                 |
| Grid            | 4 columns desktop, 2 tablet, 1 mobile |
| Gap             | `--space-6`                           |

**Pillar Card Colors:**

| Pillar  | Border Color    | Icon Color   | Background      |
| ------- | --------------- | ------------ | --------------- |
| CHANGE  | `blue-500/30`   | `blue-500`   | `blue-500/10`   |
| FLOW    | `orange-500/30` | `orange-500` | `orange-500/10` |
| FAILURE | `red-500/30`    | `red-500`    | `red-500/10`    |
| VALUE   | `green-500/30`  | `green-500`  | `green-500/10`  |

**Pillar Card Structure:**

| Element     | Style                                    |
| ----------- | ---------------------------------------- |
| Icon        | 56px container, pillar color background  |
| Pillar Name | `--text-xs` / uppercase / pillar color   |
| Question    | `--text-lg` / `--font-bold`              |
| Tool Name   | `--text-sm` / `--color-neutral-500`      |
| Description | `--text-sm` / `--color-neutral-600`      |
| Link        | Pillar color with arrow, hover translate |

---

## Section Layouts

### Three Column Features

```
┌─────────────────┬─────────────────┬─────────────────┐
│  📊             │  🔍             │  📋             │
│  See Variation  │  Find Factor    │  Present        │
│  Description    │  Description    │  Description    │
└─────────────────┴─────────────────┴─────────────────┘
```

| Property       | Value                             |
| -------------- | --------------------------------- |
| Grid           | 3 columns on desktop, 1 on mobile |
| Gap            | `--space-8`                       |
| Card Alignment | Center text                       |

### Two Column Split

```
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│  LSS Training           │  Quality & Operations   │
│  & Projects             │  Management             │
│                         │                         │
│  Description            │  Description            │
│                         │                         │
│  [Learn More]           │  [Learn More]           │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
```

| Property        | Value                             |
| --------------- | --------------------------------- |
| Grid            | 2 columns on desktop, 1 on mobile |
| Gap             | `--space-6`                       |
| Card Min Height | 300px                             |

### Steps (Horizontal)

```
   ①              ②              ③              ④
Upload         Select        Explore         Copy
  │               │              │              │
  ▼               ▼              ▼              ▼
Description    Description   Description   Description
```

| Property       | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Grid           | 4 columns on desktop, 2 on tablet, 1 on mobile         |
| Step Number    | `--text-2xl` / `--font-bold` / `--color-brand-primary` |
| Step Title     | `--text-lg` / `--font-semibold`                        |
| Connector Line | 2px / `--color-neutral-200`                            |

---

## Forms

### Input Field

```
┌─────────────────────────────────┐
│ Email address                   │
└─────────────────────────────────┘
```

| Property      | Value                           |
| ------------- | ------------------------------- |
| Background    | `--color-white`                 |
| Border        | 1px solid `--color-neutral-300` |
| Focus Border  | `--color-brand-primary`         |
| Border Radius | `--radius-md`                   |
| Padding       | `--space-3`                     |
| Font Size     | `--text-base`                   |

### Checkbox

```
☑ I agree to the terms
```

| Property           | Value                   |
| ------------------ | ----------------------- |
| Size               | 16px                    |
| Border Radius      | `--radius-sm`           |
| Checked Background | `--color-brand-primary` |

---

## Tables

### Comparison Table

```
┌─────────────────┬────────┬────────┬──────────┬────────┐
│                 │ Web    │ Excel  │ Power BI │ Azure  │
├─────────────────┼────────┼────────┼──────────┼────────┤
│ Try instantly   │   ✓    │   –    │    –     │   –    │
│ Works offline   │   ✓    │   ✓    │    –     │   ✓    │
└─────────────────┴────────┴────────┴──────────┴────────┘
```

| Property          | Value                           |
| ----------------- | ------------------------------- |
| Header Background | `--color-neutral-100`           |
| Cell Padding      | `--space-4`                     |
| Border            | 1px solid `--color-neutral-200` |
| Check Color       | `--color-success`               |

---

## Icons

See `ICONS.md` for icon specifications.

Common icon sizes:
| Size | Value | Usage |
|------|-------|-------|
| Small | 16px | Inline with text |
| Medium | 20px | Buttons, nav |
| Large | 24px | Feature cards |
| XL | 32px | Hero icons |

---

## Footer

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔍 VaRiScout                                                   │
│                                                                 │
│  Product          Use Cases       Resources       Company       │
│  Web App          LSS Training    Tutorials       About         │
│  Excel            Operations      Sample Data     Contact       │
│  Power BI                         Blog                          │
│  Azure                                                          │
│  Pricing                                                        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  © 2026 RDMAIC Oy          AppSource  │  Azure Marketplace      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Property   | Value                 |
| ---------- | --------------------- |
| Background | `--color-neutral-900` |
| Text Color | `--color-neutral-300` |
| Link Hover | `--color-white`       |
| Padding    | `--space-16` vertical |

---

## Responsive Behavior

### Breakpoint Adjustments

| Component      | Mobile (<768px) | Desktop (≥1024px) |
| -------------- | --------------- | ----------------- |
| Hero headline  | `--text-3xl`    | `--text-5xl`      |
| Nav            | Hamburger menu  | Full nav          |
| Three columns  | Stack to 1      | 3 columns         |
| Two columns    | Stack to 1      | 2 columns         |
| Footer columns | Stack to 2      | 4 columns         |

### Mobile Navigation

```
┌─────────────────────────────────┐
│  🔍 VaRiScout            ☰     │
└─────────────────────────────────┘

(Expanded)
┌─────────────────────────────────┐
│  Product                    ▼   │
│  Use Cases                  ▼   │
│  Pricing                        │
│  ─────────────────────────────  │
│  [Try Free]                     │
└─────────────────────────────────┘
```

---

## Journey Components

Components for threading the VaRiScout Journey across all pages.

### JourneyToolBadge

Shows journey position on pillar tool pages (I-Chart, Boxplot, Pareto, Capability).

```
┌─────────────────────────────────────────────────────────────────┐
│  CHANGE                                                         │
│  Step 3 of the VaRiScout Journey                               │
│  ○───○───●───○───○───○───○───○───○                             │
│                    [See full journey →]                         │
└─────────────────────────────────────────────────────────────────┘
```

| Property      | Value                             |
| ------------- | --------------------------------- |
| Background    | Pillar color (10% opacity)        |
| Border        | Pillar color (30% opacity)        |
| Progress dots | 9 dots for journey sections       |
| Highlighted   | Filled circle for current section |
| Pillar label  | Uppercase, pillar color           |

**File:** `apps/website/src/components/JourneyToolBadge.astro`

---

### JourneyToolNav

Navigation between tools in journey order at bottom of tool pages.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Continue the Journey                         │
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │  ← VALUE        │              │      FLOW →     │          │
│  │  Capability     │              │      Boxplot    │          │
│  └─────────────────┘              └─────────────────┘          │
│                                                                 │
│              [See this step in the full journey]                │
└─────────────────────────────────────────────────────────────────┘
```

| Property        | Value                          |
| --------------- | ------------------------------ |
| Cards           | Pillar-colored prev/next links |
| Card background | Pillar color (10% opacity)     |
| Card border     | Pillar color (30% opacity)     |
| Journey link    | Links to `/journey#pillar`     |

**File:** `apps/website/src/components/JourneyToolNav.astro`

---

### JourneyCaseBadge

Shows AVERAGES → EXPLORE → REVEAL flow on case study pages.

```
┌─────────────────────────────────────────────────────────────────┐
│  Practice the Journey:  AVERAGES → EXPLORE → REVEAL            │
│                                        ↑                        │
│                                    (highlighted)                │
│                                    [See full journey →]         │
└─────────────────────────────────────────────────────────────────┘
```

| Property      | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Background    | `neutral-50`                                                      |
| Flow          | 3 steps with arrows                                               |
| Active colors | AVERAGES: neutral-500, EXPLORE: brand-primary, REVEAL: purple-500 |
| Active style  | Background tint + colored text                                    |

**File:** `apps/website/src/components/JourneyCaseBadge.astro`

---

### JourneyProductBadge

Tagline banner on product pages showing the journey philosophy.

```
┌─────────────────────────────────────────────────────────────────┐
│  Find it. Fix it. Check it. Continue.    [See the journey →]   │
└─────────────────────────────────────────────────────────────────┘
```

| Property    | Value                                              |
| ----------- | -------------------------------------------------- |
| Background  | Gradient: `from-purple-50 via-amber-50 to-teal-50` |
| Text colors | purple-600, amber-500, teal-500, brand-primary     |
| Punctuation | neutral-400                                        |

**File:** `apps/website/src/components/JourneyProductBadge.astro`

---

### JourneyFeatures

Features organized by journey phase on product pages.

```
┌─────────────────────────────────────────────────────────────────┐
│                      What You Can Do                            │
│                                                                 │
│  🔍 FIND IT                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐                 │
│  │ CHANGE │ │  FLOW  │ │FAILURE │ │  VALUE   │                 │
│  │I-Chart │ │Boxplot │ │ Pareto │ │Capability│                 │
│  │   ✓    │ │   ✓    │ │   ✓    │ │    ✓     │                 │
│  └────────┘ └────────┘ └────────┘ └──────────┘                 │
│                                                                 │
│  🔧 FIX IT          ✅ CHECK IT         🔄 CONTINUE            │
│  • Feature 1        • Feature 1        • Feature 1             │
│  • Feature 2        • Feature 2        • Feature 2             │
└─────────────────────────────────────────────────────────────────┘
```

| Section  | Color         | Background       |
| -------- | ------------- | ---------------- |
| FIND IT  | purple-500    | purple-500/10    |
| FIX IT   | amber-500     | amber-500/10     |
| CHECK IT | teal-500      | teal-500/10      |
| CONTINUE | brand-primary | brand-primary/10 |

**Pillar Grid Colors:**

| Pillar  | Color      | Active Background |
| ------- | ---------- | ----------------- |
| CHANGE  | blue-500   | blue-500/10       |
| FLOW    | orange-500 | orange-500/10     |
| FAILURE | red-500    | red-500/10        |
| VALUE   | green-500  | green-500/10      |

**File:** `apps/website/src/components/JourneyFeatures.astro`
