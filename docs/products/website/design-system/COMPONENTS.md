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

### Component: HeroWithCTA

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         Find what's driving variation.                          │
│               In minutes.                                       │
│                                                                 │
│    Simple enough for anyone. Rigorous enough for experts.       │
│                                                                 │
│           [Try Free]    [Watch Demo]                            │
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
