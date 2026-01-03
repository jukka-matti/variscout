# Icons

## Overview

VaRiScout uses Lucide icons as the primary icon set. Supplement with custom icons where needed for product-specific concepts.

## Icon Library

**Primary:** [Lucide Icons](https://lucide.dev) (MIT License)

## Standard Icons

### Navigation

| Icon          | Lucide Name     | Usage                |
| ------------- | --------------- | -------------------- |
| Logo          | Custom          | VaRiScout brand mark |
| Menu          | `menu`          | Mobile hamburger     |
| Close         | `x`             | Close menu/modal     |
| Chevron Down  | `chevron-down`  | Dropdown indicator   |
| Chevron Right | `chevron-right` | Link arrow           |
| External Link | `external-link` | Opens new tab        |

### Actions

| Icon     | Lucide Name | Usage             |
| -------- | ----------- | ----------------- |
| Download | `download`  | Download files    |
| Copy     | `copy`      | Copy to clipboard |
| Check    | `check`     | Success, selected |
| Plus     | `plus`      | Add item          |
| Minus    | `minus`     | Remove item       |

### Products

| Icon     | Lucide Name   | Usage      |
| -------- | ------------- | ---------- |
| Globe    | `globe`       | Web App    |
| Table    | `table-2`     | Excel      |
| BarChart | `bar-chart-3` | Power BI   |
| Cloud    | `cloud`       | Azure      |
| Server   | `server`      | Enterprise |

### Features

| Icon            | Lucide Name           | Usage                 |
| --------------- | --------------------- | --------------------- |
| LineChart       | `line-chart`          | I-Chart / time series |
| BarChart        | `bar-chart-2`         | Boxplot / comparison  |
| PieChart        | `pie-chart`           | Pareto / distribution |
| Target          | `target`              | Capability            |
| Filter          | `filter`              | Filtering             |
| MousePointer    | `mouse-pointer-click` | Click to interact     |
| Upload          | `upload`              | Upload data           |
| FileSpreadsheet | `file-spreadsheet`    | CSV/Excel file        |

### Status

| Icon        | Lucide Name    | Color             | Usage         |
| ----------- | -------------- | ----------------- | ------------- |
| CheckCircle | `check-circle` | `--color-success` | Success state |
| AlertCircle | `alert-circle` | `--color-warning` | Warning state |
| XCircle     | `x-circle`     | `--color-error`   | Error state   |
| Info        | `info`         | `--color-info`    | Information   |

### Social / External

| Icon     | Lucide Name | Usage           |
| -------- | ----------- | --------------- |
| LinkedIn | `linkedin`  | Social link     |
| YouTube  | `youtube`   | Video link      |
| Github   | `github`    | Code repository |

---

## Custom Icons

### VaRiScout Logo

```
🔍 (magnifying glass on chart)
```

| Variant    | Usage               |
| ---------- | ------------------- |
| Full logo  | Header, footer      |
| Icon only  | Favicon, mobile     |
| Monochrome | On dark backgrounds |

**Colors:**

- Primary: `--color-brand-primary`
- Accent: `--color-success`

### Product Icons (Custom)

For product pages, use stylized versions:

| Product  | Concept                     |
| -------- | --------------------------- |
| Web App  | Browser window with chart   |
| Excel    | Spreadsheet grid with chart |
| Power BI | Dashboard tiles             |
| Azure    | Cloud with lock             |

---

## Icon Sizes

| Size Token   | Pixels | Usage                  |
| ------------ | ------ | ---------------------- |
| `--icon-xs`  | 12px   | Badges, tight spaces   |
| `--icon-sm`  | 16px   | Inline with text       |
| `--icon-md`  | 20px   | Buttons, navigation    |
| `--icon-lg`  | 24px   | Feature cards, headers |
| `--icon-xl`  | 32px   | Hero sections          |
| `--icon-2xl` | 48px   | Large feature icons    |

---

## Icon Colors

| Context             | Color                   |
| ------------------- | ----------------------- |
| Default             | `--color-neutral-500`   |
| Interactive (hover) | `--color-brand-primary` |
| On dark background  | `--color-white`         |
| Disabled            | `--color-neutral-300`   |
| Status              | Use semantic colors     |

---

## Icon + Text Patterns

### Inline Icon

```
📊 See Variation
```

- Icon size: `--icon-sm` (16px)
- Gap: `--space-2` (8px)
- Vertical align: middle

### Feature Icon (Above Text)

```
    📊
See Variation
```

- Icon size: `--icon-2xl` (48px)
- Gap: `--space-4` (16px)
- Icon color: `--color-brand-primary`

### Button with Icon

```
┌─────────────────────┐
│  ↓ Download CSV     │
└─────────────────────┘
```

- Icon size: `--icon-md` (20px)
- Gap: `--space-2` (8px)
- Icon on left (default) or right (for arrows)

---

## Implementation

### React (Lucide React)

```jsx
import { LineChart, Filter, Copy } from 'lucide-react';

<LineChart size={24} className="text-brand-primary" />;
```

### SVG Sprite

```html
<svg class="icon icon-md">
  <use href="/icons.svg#line-chart" />
</svg>
```

### CSS

```css
.icon {
  width: var(--icon-md);
  height: var(--icon-md);
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.icon-sm {
  width: var(--icon-sm);
  height: var(--icon-sm);
}
.icon-lg {
  width: var(--icon-lg);
  height: var(--icon-lg);
}
```

---

## Accessibility

| Requirement      | Implementation               |
| ---------------- | ---------------------------- |
| Decorative icons | `aria-hidden="true"`         |
| Meaningful icons | `aria-label="Description"`   |
| Icon buttons     | Include visually hidden text |
| Focus indicators | Use standard focus styles    |

### Example: Icon Button

```html
<button aria-label="Copy to clipboard">
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">Copy to clipboard</span>
</button>
```
