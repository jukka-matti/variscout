---
title: 'Typography'
audience: [designer, developer]
category: patterns
status: stable
---

# Typography

## Font Stack

VariScout uses system fonts for optimal performance and native appearance.

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  sans-serif;
```

For numeric/data values:

```css
font-family: ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

## Size Scale

| Token   | Size | PWA (Tailwind) | Usage                  |
| ------- | ---- | -------------- | ---------------------- |
| caption | 10px | `text-[10px]`  | Chart labels, branding |
| small   | 12px | `text-xs`      | Helper text, badges    |
| body    | 14px | `text-sm`      | Default body text      |
| medium  | 16px | `text-base`    | Emphasized text        |
| large   | 18px | `text-lg`      | Section headings       |
| title   | 20px | `text-xl`      | Page titles            |

## Weight Scale

| Token    | Weight | PWA (Tailwind)  | Usage           |
| -------- | ------ | --------------- | --------------- |
| regular  | 400    | `font-normal`   | Body text       |
| medium   | 500    | `font-medium`   | Labels, buttons |
| semibold | 600    | `font-semibold` | Emphasis        |
| bold     | 700    | `font-bold`     | Headings        |

## Line Height

| Context | Value | PWA (Tailwind)    |
| ------- | ----- | ----------------- |
| Tight   | 1.25  | `leading-tight`   |
| Normal  | 1.5   | `leading-normal`  |
| Relaxed | 1.75  | `leading-relaxed` |

## Text Styles

### Headings

```jsx
// Page title
<h1 className="text-lg font-bold text-white">Dashboard</h1>

// Section heading
<h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
  Analysis Summary
</h2>

// Card title
<h3 className="text-base font-semibold text-white">I-Chart</h3>
```

### Body Text

```jsx
// Primary text
<p className="text-sm text-slate-100">Main content</p>

// Secondary text
<p className="text-xs text-slate-400">Description or helper</p>

// Muted text
<span className="text-xs text-slate-500">Timestamp</span>
```

### Data Values

```jsx
// Numeric values (monospace)
<span className="font-mono text-white">{value.toFixed(2)}</span>

// Stat labels (uppercase)
<span className="text-[10px] text-slate-400 uppercase tracking-wider">
  Mean
</span>

// Large stats
<span className="text-2xl font-bold text-white">{stats.cpk.toFixed(2)}</span>
```

## Special Treatments

### Gradient Text (Logo)

```jsx
<h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
  VariScout
</h1>
```

### Truncation

```jsx
<span className="truncate max-w-[200px]">{longText}</span>
```

## Chart Typography

| Element       | Size | Weight | Color     |
| ------------- | ---- | ------ | --------- |
| Axis labels   | 11px | 400    | `#94a3b8` |
| Tick labels   | 10px | 400    | `#94a3b8` |
| Stat overlays | 12px | 600    | `#f1f5f9` |
| Branding      | 10px | 500    | `#94a3b8` |

### Responsive Scaling

| Breakpoint         | Tick | Axis | Stat |
| ------------------ | ---- | ---- | ---- |
| Mobile (<400px)    | 8px  | 9px  | 10px |
| Tablet (400-768px) | 9px  | 10px | 11px |
| Desktop (>768px)   | 11px | 13px | 12px |
