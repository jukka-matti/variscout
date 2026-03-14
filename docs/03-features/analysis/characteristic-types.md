# Characteristic Type Awareness

Quality characteristics come in three types. VariScout detects the type from specification limits and uses it to provide direction-aware analysis throughout the tool.

---

## The Three Types

| Type                  | Goal                     | Example                             | Spec Pattern |
| --------------------- | ------------------------ | ----------------------------------- | ------------ |
| **Nominal-is-best**   | Hit the target           | Fill weight, dimensions, pH         | USL + LSL    |
| **Smaller-is-better** | Lower values are better  | Defect count, cycle time, shrinkage | USL only     |
| **Larger-is-better**  | Higher values are better | Yield, strength, uptime             | LSL only     |

For nominal characteristics, both over and under are bad. For directional characteristics (smaller/larger), deviation in one direction is harmful while deviation in the other is favorable or at least not a defect.

---

## How the Type is Determined

### Auto-inference from Specification Limits

When no explicit type is set, VariScout infers it from the limits provided:

| Limits Set | Inferred Type | Rationale                           |
| ---------- | ------------- | ----------------------------------- |
| USL + LSL  | Nominal       | Both limits = target-centered       |
| USL only   | Smaller       | Upper limit only = lower is better  |
| LSL only   | Larger        | Lower limit only = higher is better |

This covers the majority of real-world cases. A fill weight with both an upper and lower limit is nominal. A cycle time with only an upper limit is smaller-is-better.

### Manual Override

Three icon buttons appear below the Target field in both the SpecEditor popover and the ColumnMapping setup screen:

| Icon             | Type              | Meaning          |
| ---------------- | ----------------- | ---------------- |
| ↕ (MoveVertical) | Nominal           | Target-centered  |
| ↓ (ArrowDown)    | Smaller is better | Lower is better  |
| ↑ (ArrowUp)      | Larger is better  | Higher is better |

**Button states:**

- **No icon selected** (default) = auto-inference from limits. The inferred icon gets a dotted blue outline. A "detected: nominal" hint appears below when limits are set.
- **Icon selected** (clicked) = explicit override. Solid blue fill. Click the active icon again to reset back to auto.

Manual override is necessary when auto-inference is wrong. For example, a yield metric with both USL and LSL would auto-infer as nominal, but if the LSL is a minimum acceptance threshold and higher yield is always better, the analyst should override to "Larger."

The override is persisted with the spec limits and saved in .vrs project files. When reset to auto (no icon selected), the type re-infers if the analyst later changes the limits.

---

## I-Chart Interpretation

The I-Chart uses characteristic type to distinguish between harmful and favorable special causes.

### Violation Color Map

| Violation           | Nominal         | Smaller-is-better | Larger-is-better  |
| ------------------- | --------------- | ----------------- | ----------------- |
| Above USL (spec)    | Orange (defect) | Orange (defect)   | --                |
| Below LSL (spec)    | Orange (defect) | --                | Orange (defect)   |
| Above UCL (control) | Red (harmful)   | Red (harmful)     | Green (favorable) |
| Below LCL (control) | Red (harmful)   | Green (favorable) | Red (harmful)     |
| Nelson Rule 2       | Red (pattern)   | Red (pattern)     | Red (pattern)     |

**Spec violations** are always orange regardless of direction -- any out-of-spec point is a defect.

**Nelson Rule violations** (Rule 2 diamonds ◆ and Rule 3 squares ■) are always rendered with a consistent shape regardless of the characteristic type or favorable/unfavorable direction. The shape identifies the rule; the color still reflects directionality (red = harmful, green = favorable) when a characteristic type is set.

**Control violations** gain directional awareness:

- **Green dots** = favorable signal -- investigate to _replicate_ (what went right?)
- **Red dots** = harmful signal -- investigate to _fix_ (what went wrong?)

Tooltips show a "-- favorable signal" suffix for beneficial special causes, guiding the analyst toward the correct investigation action.

### Why This Matters

Without direction awareness, an analyst seeing a point below LCL on a cycle time chart (smaller-is-better) would investigate it as a problem. In reality, that point represents unexpectedly fast performance -- something to understand and replicate, not fix. This is one of the most common mistakes in SPC practice.

---

## Boxplot Direction Coloring

When specs are set, boxplot categories are colored by how well their mean aligns with the quality goal:

| Characteristic Type | Best (Green)      | Worst (Red)          |
| ------------------- | ----------------- | -------------------- |
| Smaller             | Lowest mean       | Highest mean         |
| Larger              | Highest mean      | Lowest mean          |
| Nominal             | Closest to target | Furthest from target |

Categories are ranked into thirds:

- **Top third** = green (best performers)
- **Middle third** = amber (average)
- **Bottom third** = red (worst performers)

With 2 categories: best = green, worst = red. With 1 category: neutral gray (no comparison possible).

### Combined with Variation Contribution

Direction coloring complements the existing variation contribution system:

- **Box fill color** -- direction quality (green/amber/red)
- **Contribution bar** -- variation impact (proportional width)
- Together: "Machine A causes 45% of variation AND is performing badly (red)"

This dual encoding lets the analyst quickly identify categories that are both high-impact and poorly performing -- the highest-priority improvement targets.

### Override Behavior

- Manual annotation highlights (right-click) always override auto-colors
- When specs are hidden (display option) or cleared, boxes revert to neutral gray
- Direction coloring requires at least one spec limit to be set

---

## What-If Smart Presets

The What-If Simulator auto-computes up to 6 presets based on current stats and characteristic type. These are one-click shortcuts that set slider values; users can still adjust manually afterward.

| #   | Preset          | Requires                   | Logic                                |
| --- | --------------- | -------------------------- | ------------------------------------ |
| 1   | Shift to target | Specs with target/midpoint | Mean shift to target                 |
| 2   | Shift to median | Skewed distribution        | Mean shift to median (corrects skew) |
| 3   | Match best      | Active factor              | Direction-aware best category mean   |
| 4   | Tighten spread  | Active factor              | Match tightest category's std dev    |
| 5   | Reach 95% yield | Specs, yield < 95%         | Reverse-calc shift/reduction for 95% |
| 6   | Best of both    | Active factor              | Combine #3 + #4                      |

### Direction Awareness in Presets

Preset 3 ("Match best") uses the characteristic type to determine which category is "best":

- **Smaller-is-better**: category with the lowest mean
- **Larger-is-better**: category with the highest mean
- **Nominal**: category with mean closest to target

This ensures the preset shifts toward the correct direction. Without type awareness, the preset would default to the category closest to target (nominal behavior), which is wrong for directional characteristics.

---

## Relationship to Two Voices

This feature extends the [Two Voices](../../01-vision/two-voices/index.md) model (Voice of the Customer vs Voice of the Process):

- **Spec violations** (Voice of the Customer, orange) remain direction-neutral -- any out-of-spec point is a defect regardless of which side it falls on
- **Control violations** (Voice of the Process, red/green) gain directional awareness -- a special cause that moves the process toward the quality goal is favorable, not a problem

The Two Voices distinction is preserved: specs define customer requirements, control limits define process behavior. Characteristic type adds a third dimension -- _which direction is good_ -- that refines how control violations are interpreted.

---

## Technical Reference

### Types and Functions

```typescript
// Type definition
type CharacteristicType = 'nominal' | 'smaller' | 'larger';

// Auto-inference from spec limits
import { inferCharacteristicType } from '@variscout/core';
const type = inferCharacteristicType(specs);
// { usl: 10, lsl: 5 } → 'nominal'
// { usl: 10 }         → 'smaller'
// { lsl: 5 }          → 'larger'

// Direction-aware category coloring for boxplot
import { computeCategoryDirectionColors } from '@variscout/core';
const colors = computeCategoryDirectionColors(data, specs);
// Returns per-category color assignment: 'green' | 'amber' | 'red' | 'neutral'
```

### Persistence

- `SpecLimits.characteristicType` -- optional field (`CharacteristicType | undefined`)
- When `undefined`, auto-inference is used (backward compatible with existing .vrs files)
- When set to a specific type, the override is persisted and restored on load

---

## See Also

- [Capability Analysis](capability.md) - Cp/Cpk metrics that depend on spec limits
- [I-Chart](i-chart.md) - Where violation colors are displayed
- [Two Voices](../../01-vision/two-voices/index.md) - Control limits vs specification limits
- [What-If Simulator](../../06-design-system/components/what-if-simulator.md) - Smart presets and simulation
- [Variation Decomposition](variation-decomposition.md) - Category contribution system
- [Nelson Rules](nelson-rules.md) - Pattern detection on I-Chart
- [Boxplot](boxplot.md) - Category comparison with direction coloring
