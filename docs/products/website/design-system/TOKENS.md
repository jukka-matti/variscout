# Design Tokens

## Overview

Design tokens are the foundation of the VaRiScout visual language. Use these values to generate CSS variables, Tailwind config, or any design system implementation.

---

## Colors

### Brand Colors

| Token                         | Hex     | RGB          | Usage                           |
| ----------------------------- | ------- | ------------ | ------------------------------- |
| `--color-brand-primary`       | #2563EB | 37, 99, 235  | Primary buttons, links, accents |
| `--color-brand-primary-dark`  | #1D4ED8 | 29, 78, 216  | Hover states, active            |
| `--color-brand-primary-light` | #3B82F6 | 59, 130, 246 | Backgrounds, highlights         |
| `--color-brand-secondary`     | #0F172A | 15, 23, 42   | Text, headers                   |

### Semantic Colors

| Token             | Hex     | Usage                            |
| ----------------- | ------- | -------------------------------- |
| `--color-success` | #10B981 | Positive verdicts, confirmations |
| `--color-warning` | #F59E0B | Marginal status, cautions        |
| `--color-error`   | #EF4444 | Negative verdicts, errors        |
| `--color-info`    | #3B82F6 | Informational highlights         |

### Neutral Colors

| Token                 | Hex     | Usage                       |
| --------------------- | ------- | --------------------------- |
| `--color-neutral-900` | #0F172A | Primary text                |
| `--color-neutral-700` | #334155 | Secondary text              |
| `--color-neutral-500` | #64748B | Tertiary text, placeholders |
| `--color-neutral-300` | #CBD5E1 | Borders, dividers           |
| `--color-neutral-100` | #F1F5F9 | Backgrounds, cards          |
| `--color-neutral-50`  | #F8FAFC | Page background             |
| `--color-white`       | #FFFFFF | Card backgrounds, contrast  |

### Chart Colors

For VaRiScout charts and visualizations:

| Token                         | Hex     | Usage               |
| ----------------------------- | ------- | ------------------- |
| `--color-chart-primary`       | #2563EB | Primary data series |
| `--color-chart-secondary`     | #8B5CF6 | Secondary series    |
| `--color-chart-tertiary`      | #EC4899 | Third series        |
| `--color-chart-quaternary`    | #F59E0B | Fourth series       |
| `--color-chart-control-limit` | #EF4444 | UCL/LCL lines       |
| `--color-chart-center-line`   | #10B981 | Center line         |
| `--color-chart-spec-limit`    | #6B7280 | USL/LSL lines       |

---

## Typography

### Font Family

| Token         | Value                          | Usage             |
| ------------- | ------------------------------ | ----------------- |
| `--font-sans` | 'Inter', system-ui, sans-serif | Body text, UI     |
| `--font-mono` | 'JetBrains Mono', monospace    | Code, data values |

### Font Sizes

| Token         | Size | Line Height | Usage                   |
| ------------- | ---- | ----------- | ----------------------- |
| `--text-xs`   | 12px | 16px        | Captions, labels        |
| `--text-sm`   | 14px | 20px        | Secondary text, buttons |
| `--text-base` | 16px | 24px        | Body text               |
| `--text-lg`   | 18px | 28px        | Lead paragraphs         |
| `--text-xl`   | 20px | 28px        | Section headers         |
| `--text-2xl`  | 24px | 32px        | Card headers            |
| `--text-3xl`  | 30px | 36px        | Page headers            |
| `--text-4xl`  | 36px | 40px        | Hero subheads           |
| `--text-5xl`  | 48px | 48px        | Hero headlines          |
| `--text-6xl`  | 60px | 60px        | Large hero (desktop)    |

### Font Weights

| Token             | Value | Usage                      |
| ----------------- | ----- | -------------------------- |
| `--font-normal`   | 400   | Body text                  |
| `--font-medium`   | 500   | Emphasized text, buttons   |
| `--font-semibold` | 600   | Subheadings                |
| `--font-bold`     | 700   | Headlines, strong emphasis |

---

## Spacing

Base unit: 4px

| Token        | Value | Usage                     |
| ------------ | ----- | ------------------------- |
| `--space-1`  | 4px   | Tight spacing             |
| `--space-2`  | 8px   | Icon gaps, tight padding  |
| `--space-3`  | 12px  | Button padding (vertical) |
| `--space-4`  | 16px  | Standard padding          |
| `--space-5`  | 20px  | Card padding              |
| `--space-6`  | 24px  | Section gaps              |
| `--space-8`  | 32px  | Component gaps            |
| `--space-10` | 40px  | Large gaps                |
| `--space-12` | 48px  | Section padding           |
| `--space-16` | 64px  | Large section padding     |
| `--space-20` | 80px  | Hero padding              |
| `--space-24` | 96px  | Major section breaks      |

---

## Border Radius

| Token           | Value  | Usage               |
| --------------- | ------ | ------------------- |
| `--radius-sm`   | 4px    | Small buttons, tags |
| `--radius-md`   | 6px    | Buttons, inputs     |
| `--radius-lg`   | 8px    | Cards               |
| `--radius-xl`   | 12px   | Large cards, modals |
| `--radius-2xl`  | 16px   | Hero cards          |
| `--radius-full` | 9999px | Pills, avatars      |

---

## Shadows

| Token         | Value                            | Usage               |
| ------------- | -------------------------------- | ------------------- |
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05)       | Subtle elevation    |
| `--shadow-md` | 0 4px 6px -1px rgba(0,0,0,0.1)   | Cards               |
| `--shadow-lg` | 0 10px 15px -3px rgba(0,0,0,0.1) | Dropdowns, popovers |
| `--shadow-xl` | 0 20px 25px -5px rgba(0,0,0,0.1) | Modals              |

---

## Breakpoints

| Token              | Value  | Description      |
| ------------------ | ------ | ---------------- |
| `--breakpoint-sm`  | 640px  | Mobile landscape |
| `--breakpoint-md`  | 768px  | Tablet           |
| `--breakpoint-lg`  | 1024px | Desktop          |
| `--breakpoint-xl`  | 1280px | Large desktop    |
| `--breakpoint-2xl` | 1536px | Extra large      |

---

## Z-Index

| Token          | Value | Usage               |
| -------------- | ----- | ------------------- |
| `--z-base`     | 0     | Default             |
| `--z-dropdown` | 10    | Dropdowns           |
| `--z-sticky`   | 20    | Sticky headers      |
| `--z-modal`    | 30    | Modals              |
| `--z-toast`    | 40    | Toast notifications |
| `--z-tooltip`  | 50    | Tooltips            |

---

## Transitions

| Token                 | Value      | Usage                |
| --------------------- | ---------- | -------------------- |
| `--transition-fast`   | 150ms ease | Hovers, toggles      |
| `--transition-base`   | 200ms ease | Standard transitions |
| `--transition-slow`   | 300ms ease | Page transitions     |
| `--transition-slower` | 500ms ease | Animations           |

---

## Implementation Example

### CSS Variables

```css
:root {
  --color-brand-primary: #2563eb;
  --color-brand-primary-dark: #1d4ed8;
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-base: 16px;
  --space-4: 16px;
  --radius-md: 6px;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          'primary-dark': '#1D4ED8',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```
