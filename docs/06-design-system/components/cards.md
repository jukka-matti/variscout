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

### Conditional Visibility

Spec-dependent metrics (Pass Rate, Cp, Cpk) are hidden when no specification limits are configured. Only basic statistics (Mean, Std Dev, Samples) are shown until USL or LSL is set.

---

## See Also

- [Layout Patterns](../patterns/layout.md)
