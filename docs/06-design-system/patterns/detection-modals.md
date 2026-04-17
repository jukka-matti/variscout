---
title: Detection Modals
audience: [developer]
category: reference
status: stable
related: [modal, capability, performance, yamazumi, analysis-mode]
---

# Detection Modals

Contextual modals that appear after data import when the system detects special data patterns. Each modal helps the user verify the detection and choose an analysis mode.

## E2E Flow

```
Data Import → Column Mapping → Detection Logic → Modal → View Choice → Dashboard
```

Detection runs after column mapping is confirmed. Only one detection modal shows at a time (priority: Yamazumi > Performance > Capability). All modals can be dismissed to continue with Standard View.

## Trigger Conditions

| Modal           | Triggers when                                            | Priority    |
| --------------- | -------------------------------------------------------- | ----------- |
| **Yamazumi**    | Activity type + cycle time + step columns detected       | 1 (highest) |
| **Performance** | Wide-format data with 3+ measure columns detected        | 2           |
| **Capability**  | USL or LSL specs present AND (factors > 0 OR rows >= 10) | 3 (lowest)  |

Each modal sets a `dismissed` flag to prevent re-showing. Mutually exclusive with other detection modals (checked via `!yamazumiDetection && !wideFormatDetection`).

## Capability Suggestion Modal

**Component:** `packages/ui/src/components/CapabilitySuggestionModal/index.tsx`

Shows detected specification limits with inline editing, live Cpk/Cp summary, and a choice between Capability View and Standard View.

### Layout

```
+----------------------------------------------+
| Specification limits detected            X   |
| {filename} . {outcome} . {rows} rows        |
|                                              |
|  USL  [12.0]   Target [11.0]   LSL [10.0]   |
|  Type: [Nominal v]     Cpk target: [1.33]    |
|                                              |
|  * Cpk 0.26 -- below 1.33 target            |
|    Cp 1.01                                   |
|                                              |
| [Start Capability View]   [Standard View]    |
|  Cpk trend per subgroup    Individual values |
|  Switch anytime in I-Chart header            |
+----------------------------------------------+
```

### Data shown

| Element             | Source                                                        | Editable                   | Tooltip                                 |
| ------------------- | ------------------------------------------------------------- | -------------------------- | --------------------------------------- |
| Dataset context     | `dataFilename`, `outcome`, `rawData.length`                   | No                         | —                                       |
| USL / Target / LSL  | `specs` from DataContext                                      | Yes (inline number inputs) | Spec limit definitions                  |
| Characteristic type | `specs.characteristicType`                                    | Yes (dropdown)             | Nominal / Smaller / Larger explanation  |
| Cpk target          | `cpkTarget` from DataContext (default 1.33)                   | Yes (number input)         | Industry standards (1.33 / 1.67 / 2.00) |
| Cpk summary         | Derived from `stats.mean`, `stats.sigmaWithin` + edited specs | Live recalculation         | Cpk/Cp definitions                      |

### Live recalculation

Cp and Cpk are recomputed instantly when spec fields or Cpk target change. The calculation uses `stats.mean` and `stats.sigmaWithin` (which don't change with spec edits) — no raw data reprocessing needed.

### Traffic-light status

| Color | Condition           | Verdict                     |
| ----- | ------------------- | --------------------------- |
| Green | Cpk >= target       | "meets {target} target"     |
| Amber | 1.0 <= Cpk < target | "marginal (below {target})" |
| Red   | Cpk < 1.0           | "below {target} target"     |

### Button subtitles

Each action button includes a one-line subtitle describing the view:

- **Start Capability View** — "Cpk trend per subgroup"
- **Standard View** — "Individual values chart"

### On confirm

Both buttons persist edited specs and Cpk target to DataContext. "Start Capability View" additionally sets `standardIChartMetric: 'capability'` and auto-selects a subgroup method (time-extracted column > first factor > fixed n=5).

## Performance Detected Modal

**Component:** `packages/ui/src/components/PerformanceDetectedModal/index.tsx`

Shows auto-detected wide-format measure columns with confidence level. User can customize column selection and label.

### Trigger data

- `WideFormatDetection.channels` — detected measure columns
- `WideFormatDetection.confidence` — 'high' | 'medium' | 'low' (affects UI color)

### User actions

- Select/deselect measure columns (minimum 3 required)
- Set custom measure label (e.g., "Fill Head")
- Enable Performance Mode or decline to Standard

## Yamazumi Detected Modal

**Component:** `packages/ui/src/components/YamazumiDetectedModal/index.tsx`

Shows detected lean time study columns (activity type, cycle time, step). User can set takt time.

### Trigger data

- `YamazumiDetection.suggestedMapping` — auto-detected column roles
- Optional takt time input

### User actions

- Review detected column mapping
- Set optional takt time
- Enable Yamazumi Mode or decline to Standard

## Shared Patterns

### Editable fields with tooltips

All detection modals use inline-editable fields for user verification. Each field label has a `title` attribute explaining the concept. This follows the "verify at point of detection" principle — users should be able to correct auto-detection before entering a view.

### "Switch anytime" reassurance

Every modal includes footer text indicating the user can change their choice later, reducing decision anxiety.

### Dismiss behavior

- Close button (X) = dismiss to Standard View
- Backdrop click = dismiss to Standard View
- Escape key = dismiss to Standard View (native `<dialog>` behavior)
- Edited values persist on any dismiss path

### Accessibility

- Native `<dialog>` element with `showModal()`
- `FocusTrap` from `focus-trap-react`
- `aria-modal="true"`, `role="dialog"`
- Keyboard navigable (Tab, Escape)

## Related

- [Dashboard Design Principles](dashboard-design.md)
- [Navigation Patterns](navigation.md)
- [Tooltip Positioning](tooltip-positioning.md)
- Capability Modal Redesign Spec
