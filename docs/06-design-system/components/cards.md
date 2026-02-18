# Cards

Card components for grouping related content.

---

## Panel Card

Used for dashboard panels and chart containers.

### PWA (Tailwind)

```tsx
<div className="bg-surface border border-edge rounded-lg p-4">
  <h3 className="text-content font-semibold mb-2">Panel Title</h3>
  <div className="text-content-secondary">Panel content here</div>
</div>
```

### Variants

| Variant     | Use Case        | Border                  |
| ----------- | --------------- | ----------------------- |
| Default     | Standard panels | `border-edge`           |
| Interactive | Clickable cards | `hover:border-blue-500` |
| Selected    | Active state    | `border-blue-500`       |

---

## Stats Card

Compact card for displaying statistics.

```tsx
<div className="bg-surface-secondary rounded p-3">
  <div className="text-content-secondary text-xs">Label</div>
  <div className="text-content text-lg font-mono">1.45</div>
</div>
```

### Always-Visible Stats

The following metrics are always shown in the Stats Panel regardless of whether specification limits are configured:

- **Mean** — arithmetic average
- **Median** — midpoint value (always shown alongside Mean)
- **Std Dev** — standard deviation
- **Samples** — row count (n)

### Spec-Dependent Metrics and Inline Entry (`onSaveSpecs`)

Spec-dependent metrics (Pass Rate, Cp, Cpk) require USL or LSL to be set. When no specs are configured, `StatsPanelBase` renders an **inline spec entry area** in place of those cards — rather than silently omitting them.

The inline entry area uses **Target-first progressive disclosure**:

1. A Target input is shown first (lowest commitment).
2. An expand toggle ("+ LSL/USL") reveals the full specification range.
3. Values are applied on blur — no button press required.
4. Once any value is saved, the inline area transforms into the normal Cp/Cpk/Pass Rate stat cards.

`StatsPanelBase` accepts an `onSaveSpecs` callback for this purpose:

```tsx
<StatsPanelBase
  stats={stats}
  specs={specs}
  onSaveSpecs={newSpecs => updateSpecs(newSpecs)}
  // ...other props
/>
```

When `onSaveSpecs` is provided and `specs` has no USL/LSL/Target, the inline entry area is rendered. When `onSaveSpecs` is omitted, the component falls back to the previous behaviour (silent omission of spec-dependent cards).

### ColumnMapping Spec Section

`ColumnMapping` also exposes an optional collapsible spec entry section. It is collapsed by default and controlled via an `onSaveSpecs` prop of the same shape:

```tsx
<ColumnMapping
  // ...column props
  onSaveSpecs={specs => setInitialSpecs(specs)}
/>
```

This allows users to enter Target, LSL, and USL before reaching the dashboard, removing the need for the inline Stats Panel entry in that session.

---

## See Also

- [Layout Patterns](../patterns/layout.md)
- [Specification Management](../../03-features/specifications.md)
