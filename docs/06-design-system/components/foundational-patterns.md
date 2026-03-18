---
title: 'Foundational UI Patterns'
---

# Foundational UI Patterns

Core building blocks shared across PWA and Azure App: buttons, form elements, cards, and modals.

---

## 1. Buttons

### PWA Buttons (Tailwind)

| Variant   | Classes                                                                                      |
| --------- | -------------------------------------------------------------------------------------------- |
| Primary   | `bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white` |
| Secondary | `bg-slate-700 hover:bg-slate-600 text-slate-300`                                             |
| Danger    | `bg-red-600 hover:bg-red-500 text-white`                                                     |
| Ghost     | `text-slate-400 hover:text-white hover:bg-slate-700`                                         |
| Icon      | `p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg`                          |
| Small     | `px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg`        |

All buttons share: `font-medium px-4 py-2 rounded-lg transition-colors`.

### Button States

```jsx
// Disabled
<button disabled className="... disabled:opacity-50 disabled:cursor-not-allowed">Saving...</button>

// Loading
<button disabled className="... flex items-center gap-2">
  <Loader2 className="animate-spin" size={16} />
  Saving...
</button>

// Active/Selected
<button className={`... ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
  Option
</button>
```

### Tab Buttons

```jsx
<div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
  <button
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      activeTab === 'summary'
        ? 'bg-slate-700 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-300'
    }`}
  >
    Summary
  </button>
</div>
```

### Touch Targets

For mobile, ensure minimum 44px touch targets:

```jsx
<button className="p-2 ..." style={{ minWidth: 44, minHeight: 44 }}>
  <Icon size={18} />
</button>
```

### Website Buttons (CSS Classes)

The website uses CSS component classes (defined in `apps/website/src/styles/global.css`):

| Variant       | Class                   | Use Case                          |
| ------------- | ----------------------- | --------------------------------- |
| Primary       | `btn btn-primary`       | Main CTAs                         |
| Secondary     | `btn btn-secondary`     | Alternative actions on light bg   |
| Outline       | `btn btn-outline`       | Subtle actions on light bg        |
| Outline Light | `btn btn-outline-light` | Actions on dark bg (hero, footer) |

Base `.btn` uses `py-2.5` (~40px). Override to `py-3` for primary CTAs (44px minimum).

### Copy Feedback Button

```jsx
const [copied, setCopied] = useState(false);

<button
  onClick={handleCopy}
  className={`p-1.5 rounded transition-all ${
    copied ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-white hover:bg-slate-700'
  }`}
>
  {copied ? <Check size={16} /> : <Copy size={16} />}
</button>;
```

---

## 2. Form Elements

Form inputs use semantic Tailwind tokens for theme-aware styling.

### Core Inputs

```jsx
// Text Input
<input type="text" placeholder="Enter value"
  className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-content text-sm placeholder-content-muted outline-none focus:border-blue-500 transition-colors" />

// Number Input
<input type="number" step="0.01"
  className="w-full px-3 py-2 bg-surface border border-edge rounded-lg text-content text-sm font-mono text-right outline-none focus:border-blue-500" />

// Select Dropdown
<select className="bg-surface border border-edge text-content rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 cursor-pointer">
  <option value="">Select...</option>
</select>

// Checkbox
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
    className="w-4 h-4 rounded border-edge bg-surface text-blue-600 focus:ring-blue-500 focus:ring-offset-surface" />
  <span className="text-sm text-content-secondary">Show Cpk</span>
</label>
```

### Form Field with Label

```jsx
<div className="flex flex-col gap-1.5">
  <label className="text-xs text-content-secondary font-medium">Upper Spec Limit (USL)</label>
  <input
    type="number"
    className="px-3 py-2 bg-surface border border-edge rounded-lg text-content"
  />
</div>
```

### Toggle Switch

```jsx
<button
  onClick={() => setEnabled(!enabled)}
  className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-600'}`}
>
  <span
    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-5' : 'left-1'}`}
  />
</button>
```

### File Input

```jsx
<label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-edge rounded-xl cursor-pointer hover:border-blue-500 hover:bg-surface-secondary/50 transition-colors">
  <Upload className="text-content-secondary" />
  <span className="text-sm text-content-secondary">Drop file or click to browse</span>
  <input type="file" className="hidden" onChange={handleFile} />
</label>
```

### Validation States

```jsx
// Error
<input className="... border-red-500 focus:border-red-500" />
<span className="text-xs text-red-400 mt-1">Invalid value</span>

// Disabled
<input disabled className="... opacity-50 cursor-not-allowed bg-surface-secondary" />
```

### Segmented Control (Factor Selector)

Location: `packages/ui/src/components/FactorSelector/`

```jsx
<div className="inline-flex bg-surface rounded-lg p-0.5 border border-edge">
  {options.map(option => (
    <button
      key={option}
      onClick={() => onChange(option)}
      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all relative ${
        selected === option
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
      }`}
    >
      {option}
    </button>
  ))}
</div>
```

Use for 2-5 options; use dropdown for more.

---

## 3. Cards

### Panel Card

```tsx
<div className="bg-surface border border-edge rounded-lg p-4">
  <h3 className="text-content font-semibold mb-2">Panel Title</h3>
  <div className="text-content-secondary">Panel content here</div>
</div>
```

| Variant     | Use Case        | Border                  |
| ----------- | --------------- | ----------------------- |
| Default     | Standard panels | `border-edge`           |
| Interactive | Clickable cards | `hover:border-blue-500` |
| Selected    | Active state    | `border-blue-500`       |

### Stats Card

```tsx
<div className="bg-surface-secondary rounded p-3">
  <div className="text-content-secondary text-xs">Label</div>
  <div className="text-content text-lg font-mono">1.45</div>
</div>
```

Always-visible: Mean, Median, Std Dev, Samples. Spec-dependent (requires USL/LSL): Pass Rate, Cp, Cpk.

`StatsPanelBase` shows pencil link when `onEditSpecs` is provided: "Set spec limits" (no specs) or "Edit spec limits" (specs exist).

### ColumnCard

Individual card for column mapping. Displays type badges (Blue=Numeric, Green=Categorical, Amber=Date, Slate=Text), sample values, summary line, missing warning, inline rename.

### DataPreviewTable

Collapsible mini table (first 5 rows) with color-coded headers. Collapsed by default, toggle via Table icon.

### ChartCard (Accent-Aware Hover)

```css
.chart-card:hover {
  border-color: var(--accent-hex, var(--color-edge-hover, #475569));
}
```

Azure App picks up company accent color; PWA falls back to `--color-edge-hover`. See [Shared Chart Components > ChartCard](../charts/shared-components.md#chartcard).

---

## 4. Modals

### Standard Modal

```jsx
{
  isOpen && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Modal Title</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">Content goes here</div>
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Confirm</button>
        </div>
      </div>
    </div>
  );
}
```

### Confirmation Modal

Compact: `max-w-sm`, danger button for destructive actions.

### Full-Screen Modal

For expanded chart views: `fixed inset-0 z-50 bg-slate-900/95 flex flex-col`.

### Sheet/Drawer (Mobile)

Slide-up panel: `absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl max-h-[85vh]` with drag handle.

### Modal Sizing

| Size | Max Width           | Usage           |
| ---- | ------------------- | --------------- |
| sm   | `max-w-sm` (384px)  | Confirmations   |
| md   | `max-w-md` (448px)  | Simple forms    |
| lg   | `max-w-lg` (512px)  | Standard modals |
| xl   | `max-w-xl` (576px)  | Complex content |
| 2xl  | `max-w-2xl` (672px) | Data tables     |

### Keyboard Handling

```jsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### Backdrop & Z-Index

| Level   | z-index   | Usage                |
| ------- | --------- | -------------------- |
| Modal   | `z-50`    | Standard modals      |
| Tooltip | `z-[60]`  | Tooltips over modals |
| Toast   | `z-[100]` | Notifications        |

Standard: `bg-black/60 backdrop-blur-sm`. Less prominent: `bg-black/40`.

---

## See Also

- [Layout Patterns](../patterns/layout.md)
- [Panels and Drawers](../patterns/panels-and-drawers.md)
- [Interactions](../patterns/interactions.md)
- [Specification Management](../../03-features/specifications.md)
