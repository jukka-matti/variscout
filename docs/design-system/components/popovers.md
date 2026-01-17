# Popovers

Lightweight floating panels for in-context editing.

## YAxisPopover

A compact popover for editing Y-axis scale bounds on charts. Provides manual min/max override with validation and auto-reset capability.

### Props Interface

```typescript
interface YAxisPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentMin?: number;
  currentMax?: number;
  autoMin: number;
  autoMax: number;
  onSave: (settings: { min?: number; max?: number }) => void;
  anchorPosition?: { top: number; left: number };
}
```

| Prop             | Type                                                 | Description                               |
| ---------------- | ---------------------------------------------------- | ----------------------------------------- |
| `isOpen`         | `boolean`                                            | Controls popover visibility               |
| `onClose`        | `() => void`                                         | Called when popover should close          |
| `currentMin`     | `number \| undefined`                                | Current manual minimum (undefined = auto) |
| `currentMax`     | `number \| undefined`                                | Current manual maximum (undefined = auto) |
| `autoMin`        | `number`                                             | Auto-calculated minimum from data         |
| `autoMax`        | `number`                                             | Auto-calculated maximum from data         |
| `onSave`         | `(settings: { min?: number; max?: number }) => void` | Saves new scale settings                  |
| `anchorPosition` | `{ top: number; left: number }`                      | Position relative to parent               |

### Usage

```tsx
import YAxisPopover from './YAxisPopover';

const [yAxisPopoverOpen, setYAxisPopoverOpen] = useState(false);
const [yAxisSettings, setYAxisSettings] = useState<{ min?: number; max?: number }>({});

<YAxisPopover
  isOpen={yAxisPopoverOpen}
  onClose={() => setYAxisPopoverOpen(false)}
  currentMin={yAxisSettings.min}
  currentMax={yAxisSettings.max}
  autoMin={dataMin}
  autoMax={dataMax}
  onSave={setYAxisSettings}
  anchorPosition={{ top: clickY, left: 10 }}
/>;
```

### Structure

```jsx
<div className="absolute z-50 w-48 bg-surface-secondary border border-edge rounded-lg shadow-2xl">
  {/* Header */}
  <div className="flex items-center justify-between px-3 py-2 border-b border-edge">
    <h4 className="text-xs font-semibold text-content-secondary uppercase">Y-Axis Scale</h4>
    <button onClick={onClose}>
      <X size={14} />
    </button>
  </div>

  {/* Inputs */}
  <div className="p-3 space-y-3">
    <div>
      <label>Max</label>
      <span>Auto: {autoMax}</span>
      <input type="number" placeholder={autoMax} />
    </div>
    <div>
      <label>Min</label>
      <span>Auto: {autoMin}</span>
      <input type="number" placeholder={autoMin} />
    </div>
    {validationError && <p className="text-red-400">{error}</p>}
  </div>

  {/* Actions */}
  <div className="px-3 pb-3 space-y-2">
    {!isAutoScale && <button>Reset to Auto</button>}
    <button disabled={!hasChanges}>Apply Changes</button>
  </div>
</div>
```

### Interaction Patterns

| Action              | Behavior                           |
| ------------------- | ---------------------------------- |
| Click outside       | Closes popover (changes discarded) |
| Press Escape        | Closes popover (changes discarded) |
| Click close button  | Closes popover (changes discarded) |
| Click Apply         | Saves settings and closes          |
| Click Reset to Auto | Clears overrides and closes        |

### Validation

- **Min < Max**: If min >= max, shows error "Min must be less than Max"
- **Apply disabled**: Button disabled when no changes or validation error
- **Empty = Auto**: Empty input fields use auto-calculated values

### Visual States

| State            | Visual                            |
| ---------------- | --------------------------------- |
| No changes       | Apply button disabled, muted text |
| Has changes      | Apply button active (blue)        |
| Validation error | Red error text, Apply disabled    |
| Auto scale       | "Reset to Auto" button hidden     |
| Manual scale     | "Reset to Auto" button visible    |

### Popover vs Modal

Use popovers for:

- Quick, focused edits (1-2 fields)
- Context-specific adjustments
- Non-blocking interactions

Use modals for:

- Complex forms
- Destructive actions requiring confirmation
- Multi-step workflows

## Positioning

Popovers use absolute positioning relative to their parent container:

```tsx
style={{
  top: anchorPosition?.top ?? 40,
  left: anchorPosition?.left ?? 10,
}}
```

For chart-based popovers, calculate position from click event coordinates relative to the chart container.
