---
title: Process Intelligence Panel
date: 2026-03-28
status: design-approved
audience: [developer, designer]
category: design-spec
related: [stats-panel, what-if, target-discovery, sidebar, process-health-bar]
---

# Process Intelligence Panel

Redesign the Stats sidebar from a passive metrics display into an active intelligence panel that helps analysts discover achievable targets, project improvement impact, and explore data.

## Problem

The Stats sidebar currently duplicates content that exists elsewhere:

- Summary stats duplicate the ProcessHealthBar toolbar
- Histogram/Probability Plot tabs duplicate the VerificationCard in the grid

Meanwhile, key capabilities have no home:

- **Target discovery** — the complement data reveals achievable capability, but there's no UI for it
- **What-If simulation** — lives on a separate page, disconnected from the analysis flow
- **Data table** — not accessible from the dashboard

## Design

### Panel Structure: 3 Tabs

| Tab         | Content                                                                   | Source                                                             |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Summary** | Stats grid + Target Discovery card + Centering opportunity                | New composition                                                    |
| **Data**    | Sortable data table with factor columns, highlights filtered subset       | Existing `DataTableBase`                                           |
| **What-If** | Mean shift + σ reduction sliders, distribution preview, projected metrics | Existing `WhatIfSimulator` + smart presets from `computePresets()` |

Drop the Histogram and Probability Plot tabs — `VerificationCard` in the grid handles those.

### Summary Tab

#### Stats Grid

Compact card grid showing process metrics:

- Row 1: Pass Rate, Cp, Cpk (with target below)
- Row 2: Mean, Median, Std Dev, n
- "Edit specifications" link at bottom

Same data as the toolbar but with Median added and more visual room. When specs are not set, Cp/Cpk/Pass Rate cards show "—" with a prompt.

#### Target Discovery Card

Adaptive card that appears in the Summary tab. Content changes based on context:

**State 1: No specs, not drilling**

> Your process runs at Mean 11.74 ± 1.05 (n=30).
> Drill into factors to discover what's achievable, or [set specifications manually].

Simple prompt. No actionable target yet — the analyst needs to drill first.

**State 2: No specs, drilling (the key discovery moment)**

The complement data (everything except the selected subset) reveals the process's natural capability:

> **Without Bed C, your process achieves:**
> Mean 10.92 | σ 0.31 | Range 10.0 – 11.8
>
> [Set as specifications →] [Customize...]

The suggested specs derive from the complement's natural tolerance:

- **Nominal**: Mean ± 3σ → LSL, USL. Target = complement mean.
- **Smaller-is-better**: 95th percentile of complement → USL. No LSL.
- **Larger-is-better**: 5th percentile of complement → LSL. No USL.

"Set as specifications" accepts the complement-derived specs in one click → Cpk activates → full projection pipeline.

"Customize..." opens the capability suggestion modal (existing `CapabilitySuggestionModal`) with pre-filled values from complement, editable.

**State 3: Specs exist, not drilling**

Centering opportunity (when Cp - Cpk > 0.1):

> **Quick win: Centering**
> Cpk 0.26 → Cp 1.01 just by centering the process.
> Gap: 0.75 — adjust process aim, no root cause needed.

**State 4: Specs exist, drilling**

Best subset comparison against target:

> **Your best subset (Bed A, B) achieves Cpk 1.85**
> Target: 1.33 — headroom confirmed. Fixing Bed C is sufficient.

Or reality check when best subset doesn't reach target:

> **Your best subset only reaches Cpk 0.95**
> Target: 1.33 — fixing outliers alone won't reach the target.
> Process changes needed. [Open What-If →]

#### Characteristic Type Awareness

The Target Discovery card adapts language and spec derivation based on `CharacteristicType`:

| Type                         | Question                            | Spec derivation             |
| ---------------------------- | ----------------------------------- | --------------------------- |
| Nominal (USL + LSL)          | "What should your process aim for?" | Complement Mean ± 3σ        |
| Smaller-is-better (USL only) | "What's your upper limit?"          | Complement 95th percentile  |
| Larger-is-better (LSL only)  | "What's your minimum?"              | Complement 5th percentile   |
| Unknown / exploring          | "What type of measure is this?"     | Prompt to select type first |

When the analyst hasn't indicated a characteristic type, the card prompts them to choose before suggesting specs. The existing `CharacteristicTypeSelector` component handles this.

### Data Tab

Renders existing `DataTableBase` component:

- All rows with outcome + factor columns
- Sortable columns
- When drilling, the filtered subset is highlighted (bold or background color)
- Scrollable within the sidebar width (280–500px, resizable)

### What-If Tab

Relocates the existing `WhatIfSimulator` component from the standalone What-If page into the sidebar:

- Mean shift slider
- Variation reduction slider
- Distribution preview (bell curve overlay)
- Projected Cpk / yield / PPM
- Smart presets from `computePresets()`:
  1. Shift to target
  2. Shift to median
  3. Reach 95% yield
  4. Match best category
  5. Tighten spread
  6. Best of both
- Preset availability adapts to context (some need specs, some need active factor)

The standalone What-If page remains accessible from the nav bar for backward compatibility but is now secondary to the sidebar tab. PWA still uses the standalone page on mobile.

## What Changes

| Area               | Before                              | After                                       |
| ------------------ | ----------------------------------- | ------------------------------------------- |
| Sidebar tabs       | Summary, Histogram, ProbPlot        | Summary, Data, What-If                      |
| Histogram/ProbPlot | In sidebar AND VerificationCard     | VerificationCard only                       |
| Target discovery   | No UI (math exists)                 | Card in Summary tab                         |
| Data table         | Not in dashboard                    | Data tab in sidebar                         |
| What-If            | Separate nav page                   | Sidebar tab + nav page (backward compat)    |
| Stats duplication  | Toolbar + sidebar show same numbers | Toolbar = glance, sidebar = detail + action |

## Files to Modify

| File                                                            | Change                                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/StatsPanel/StatsPanelBase.tsx`      | Replace Histogram/ProbPlot tabs with Data/What-If. Add Target Discovery card to Summary tab. |
| `packages/ui/src/components/StatsPanel/TargetDiscoveryCard.tsx` | New component: adaptive target discovery card                                                |
| `apps/pwa/src/components/StatsPanel.tsx`                        | Update tab wiring, pass complement stats + What-If props                                     |
| `apps/azure/src/components/StatsPanel.tsx`                      | Same as PWA + pass improvement context                                                       |
| `packages/hooks/src/useProcessProjection.ts`                    | Already exports complement stats — expose for sidebar                                        |

## Existing Code to Reuse

- `computePresets()` in `packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx` — smart preset generation
- `WhatIfSimulator` in `packages/ui/src/components/WhatIfSimulator/` — full simulation UI
- `DataTableBase` in `packages/ui/src/components/DataPanel/` — data table component
- `CapabilitySuggestionModal` in `packages/ui/src/components/CapabilitySuggestionModal/` — spec editor with live preview
- `CharacteristicTypeSelector` in `packages/ui/src/components/CharacteristicTypeSelector/` — type selection
- `computeSpecSuggestion()` in `packages/core/src/variation/projection.ts` — complement-based spec derivation
- `computeCenteringOpportunity()` in `packages/core/src/variation/projection.ts` — Cp vs Cpk gap
- `computeBenchmarkProjection()` in `packages/core/src/variation/projection.ts` — best subset projection
- `inferCharacteristicType()` in `packages/core/src/types.ts` — type inference from specs

## Testing

- Unit: TargetDiscoveryCard renders correct content for each of the 4 states
- Unit: Tab switching works (Summary → Data → What-If)
- Unit: "Set as specifications" click calls setSpecs with complement-derived values
- Integration: Drill into category → Target Discovery shows complement stats
- Visual: Chrome verification of all 4 target discovery states
- Regression: Existing Stats sidebar tests still pass with new tab structure
