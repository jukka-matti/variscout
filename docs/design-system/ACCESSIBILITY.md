# Accessibility Guidelines

VariScout Lite targets WCAG 2.1 AA compliance to ensure quality professionals with disabilities can effectively analyze variation data.

## Color Contrast Requirements

### Text Contrast (4.5:1 minimum)

| Element        | Dark Theme             | Light Theme            | Ratio  |
| -------------- | ---------------------- | ---------------------- | ------ |
| Body text      | `#f1f5f9` on `#0f172a` | `#1e293b` on `#ffffff` | >7:1   |
| Secondary text | `#94a3b8` on `#0f172a` | `#64748b` on `#ffffff` | >4.5:1 |
| Error text     | `#ef4444` on `#0f172a` | `#dc2626` on `#ffffff` | >4.5:1 |

### UI Component Contrast (3:1 minimum)

| Element     | Dark Theme             | Light Theme            | Ratio |
| ----------- | ---------------------- | ---------------------- | ----- |
| Buttons     | `#3b82f6` on `#0f172a` | `#2563eb` on `#ffffff` | >3:1  |
| Borders     | `#334155` on `#0f172a` | `#e2e8f0` on `#ffffff` | >3:1  |
| Focus rings | `#60a5fa` on `#0f172a` | `#3b82f6` on `#ffffff` | >3:1  |

### Chart Colors

Grade colors maintain contrast against chart backgrounds:

```typescript
// packages/ui/src/colors.ts
gradeColors.world_class; // #22c55e - Green for excellent Cpk
gradeColors.good; // #84cc16 - Lime for good Cpk
gradeColors.marginal; // #f59e0b - Amber for marginal Cpk
gradeColors.poor; // #ef4444 - Red for poor Cpk
```

All chart colors are tested against both dark (`#1e293b`) and light (`#f8fafc`) chart backgrounds.

## Keyboard Navigation

### Existing Implementation

The `useKeyboardNavigation` hook (`packages/hooks/src/useKeyboardNavigation.ts`) provides:

- Arrow key navigation between interactive elements
- Focus management for chart drill-down interactions
- Tab order preservation

### Navigation Patterns

| Key                | Action                                             |
| ------------------ | -------------------------------------------------- |
| `Tab`              | Move between major sections                        |
| `Arrow Left/Right` | Navigate between items in a list                   |
| `Arrow Up/Down`    | Navigate between rows in tables                    |
| `Enter`            | Activate selected element (e.g., drill into chart) |
| `Escape`           | Close modals, cancel operations                    |
| `Space`            | Toggle checkboxes, activate buttons                |

### Focus Management

```typescript
// Example: Managing focus on drill-down
const { handleKeyDown, setFocusedIndex } = useKeyboardNavigation({
  items: chartPoints,
  onSelect: index => onDrillDown(chartPoints[index]),
  orientation: 'horizontal',
});
```

## Screen Reader Support

### ARIA Labels

All interactive elements require descriptive labels:

```tsx
// Chart container
<div
  role="img"
  aria-label="I-Chart showing measurement values over time with control limits"
>

// Interactive chart points
<circle
  role="button"
  aria-label={`Point ${index}: value ${value.toFixed(2)}, ${status}`}
  tabIndex={0}
/>
```

### Live Regions

Announce dynamic content changes:

```tsx
// Data validation feedback
<div role="alert" aria-live="polite">
  {validationErrors.length} issues found in uploaded data
</div>

// Chart update announcements
<div aria-live="polite" className="sr-only">
  Chart updated: now showing {selectedMeasure} data
</div>
```

### Chart Accessibility Patterns

1. **Summary First**: Announce chart type and key insight before details
2. **Data Table Fallback**: Provide tabular data alternative for complex charts
3. **Pattern Descriptions**: Describe visual patterns (trends, outliers) in text

```tsx
// Example: IChart with accessible summary
<figure>
  <figcaption className="sr-only">
    I-Chart for {measureName}. Mean: {mean.toFixed(2)}. Cpk: {cpk.toFixed(2)} (
    {getGradeDescription(cpk)}).
    {outOfSpec} of {total} points outside specification limits.
  </figcaption>
  <IChart data={data} specs={specs} />
</figure>
```

## Focus Indicators

### Visible Focus Rings

All interactive elements show visible focus:

```css
/* PWA Tailwind classes */
.focus-visible:ring-2
.focus-visible:ring-blue-400
.focus-visible:ring-offset-2
.focus-visible:ring-offset-slate-900 /* dark */
.focus-visible:ring-offset-white /* light */
```

### Custom Focus Styles

For chart elements that can't use Tailwind:

```typescript
// packages/charts/src/colors.ts
chromeColors.focus = '#60a5fa'; // Visible on both themes
```

## Skip Links

Provide skip navigation for keyboard users:

```tsx
// apps/pwa/src/App.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-slate-800 focus:px-4 focus:py-2 focus:text-white"
>
  Skip to main content
</a>
```

## Semantic Structure

### Landmarks

```tsx
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main" id="main-content">...</main>
<aside role="complementary" aria-label="Statistics">...</aside>
<footer role="contentinfo">...</footer>
```

### Heading Hierarchy

Maintain proper heading order:

```
h1: App name / Page title
  h2: Major section (Dashboard, Analysis Setup)
    h3: Subsection (Chart title, Panel title)
      h4: Detail section (Statistics, Options)
```

## Form Accessibility

### Input Labels

All form inputs have associated labels:

```tsx
<label htmlFor="lsl-input" className="block text-sm font-medium">
  Lower Spec Limit (LSL)
</label>
<input
  id="lsl-input"
  type="number"
  aria-describedby="lsl-help"
/>
<span id="lsl-help" className="text-xs text-slate-400">
  Enter the minimum acceptable value
</span>
```

### Error States

Announce validation errors:

```tsx
<input aria-invalid={!!error} aria-describedby={error ? 'input-error' : undefined} />;
{
  error && (
    <span id="input-error" role="alert" className="text-red-400">
      {error}
    </span>
  );
}
```

## Motion and Animation

### Reduced Motion Support

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Safe Animations

- Avoid flashing content (max 3 flashes/second)
- Keep animations subtle and functional
- Ensure animations don't convey essential information

## Testing Checklist

### Automated Testing

- [ ] Run axe-core on all pages
- [ ] Check color contrast ratios
- [ ] Validate HTML semantics

### Manual Testing

- [ ] Navigate entire app using only keyboard
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify focus visibility in all states
- [ ] Test at 200% zoom level

### Screen Reader Testing

| Reader    | Browser | Platform |
| --------- | ------- | -------- |
| VoiceOver | Safari  | macOS    |
| NVDA      | Chrome  | Windows  |
| JAWS      | Chrome  | Windows  |

## Implementation Priority

### Phase 1 (Required)

- Keyboard navigation for all interactive elements
- Proper heading structure
- Form labels and error announcements
- Color contrast compliance

### Phase 2 (Important)

- Screen reader announcements for chart updates
- Skip links
- ARIA landmarks

### Phase 3 (Enhanced)

- Data table alternatives for charts
- Detailed chart descriptions
- Reduced motion support

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessible SVG Charts](https://www.smashingmagazine.com/2021/06/accessible-svg-patterns-comparison/)
- [Data Visualization Accessibility](https://accessibility.digital.gov/visual-design/data-visualizations/)
