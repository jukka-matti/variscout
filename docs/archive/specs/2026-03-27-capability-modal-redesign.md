---
title: Capability Suggestion Modal Redesign
date: 2026-03-27
status: approved
audience: [developer, designer]
category: design-spec
related: [capability, specs, cpk, modal, decision-support]
---

# Capability Suggestion Modal Redesign

## Problem

The current CapabilitySuggestionModal ("Specification limits set") asks users to choose between Capability View and Standard View but provides insufficient data for an informed decision:

- No spec values shown (USL, LSL, Target) — user can't verify correctness
- No Cpk preview — user can't assess whether Capability View is relevant
- No dataset context (name, column, row count)
- No description of what Standard View shows (only Capability View is described)
- No way to correct wrong specs before entering a view
- Cpk target not configurable at the decision point

Target persona: **experienced quality engineer** who knows what Cpk means and wants to verify + decide quickly.

## Design: Data Card Modal

Compact decision-support card showing detected specs (editable), live Cpk summary, and view choice.

### Layout

```
+----------------------------------------------+
| Specification limits detected            X   |
| Coffee Moisture . Moisture_pct . 30 rows     |
|                                              |
|  USL  [12.0]   Target [11.0]   LSL [10.0]   |
|  Type: [Nominal v]     Cpk target: [1.33]    |
|                                              |
|  * Cpk 0.26 -- below 1.33 target            |
|    Cp 1.01                                   |
|                                              |
| [Start Capability View]   [Standard View]    |
|  You can switch anytime in I-Chart header    |
+----------------------------------------------+
```

### Elements

1. **Header**: "Specification limits detected" + close button
2. **Dataset context**: `{dataFilename} . {outcome} . {rowCount} rows`
3. **Editable spec fields**: USL, Target, LSL as inline number inputs. Pre-filled with detected values. Empty placeholder for undetected fields.
4. **Characteristic type**: Dropdown (Nominal / Smaller-is-better / Larger-is-better)
5. **Cpk target**: Editable number, default 1.33. Sets `cpkTarget` in DataContext on confirm.
6. **Cpk summary**: Traffic-light status:
   - Green: Cpk >= target ("meets {target} target")
   - Amber: 1.0 <= Cpk < target ("marginal, below {target}")
   - Red: Cpk < 1.0 ("below {target} target")
   - Cp shown on second line for centering-loss context
   - **Live recalculation** on spec/target edits (<10ms)
7. **Action buttons**: "Start with Capability View" (green) + "Standard View" (secondary)
8. **Footer**: "You can switch anytime using the toggle in the I-Chart header"

### What's Removed

- "What you'll see" bullet list (unnecessary for target persona)
- Bar chart icon in header (visual weight without information)

### Cpk Target

- Default: **1.33** (industry standard minimum, universally applicable)
- Editable by clicking the number field
- Industry context: 1.33 = 4 sigma general manufacturing, 1.67 = 5 sigma safety-critical (IATF 16949), 2.00 = 6 sigma aerospace
- Value persists to dashboard via `setCpkTarget` in DataContext

### Data Flow

All data already available in DataContext at modal render time:

| Data                    | Source      | Purpose                   |
| ----------------------- | ----------- | ------------------------- |
| `dataFilename`          | DataContext | Dataset context line      |
| `outcome`               | DataContext | Column name display       |
| `rawData.length`        | DataContext | Row count                 |
| `specs`                 | DataContext | Pre-filled USL/LSL/Target |
| `stats.cp`, `stats.cpk` | DataContext | Cpk summary line          |
| `cpkTarget`             | DataContext | Cpk target field          |

Live recalculation: modal calls `calculateStats()` from `@variscout/core/stats` with edited spec values locally. DataContext only updated on confirm (either button).

### Props

```typescript
interface CapabilitySuggestionModalProps {
  // Existing
  factorColumns: string[];
  onStartCapability: (config: SubgroupConfig) => void;
  onStartStandard: () => void;
  // New
  dataFilename: string | null;
  outcome: string | null;
  rowCount: number;
  specs: SpecLimits;
  stats: StatsResult | null;
  rawData: DataRow[];
  cpkTarget: number | undefined;
  onSpecsChange: (specs: SpecLimits) => void;
  onCpkTargetChange: (target: number | undefined) => void;
}
```

### Implementation Scope

**Modify:**

- `packages/ui/src/components/CapabilitySuggestionModal/index.tsx` — Complete redesign
- `apps/pwa/src/App.tsx` — Pass new props
- `apps/azure/src/components/editor/EditorModals.tsx` — Pass new props (shared component)
- `packages/core/src/i18n/messages/en.ts` — Update translation keys

**Reuse (no changes):**

- `calculateStats()` from `@variscout/core/stats`
- `cpkTarget` / `setCpkTarget` from DataContext
- `specs` / `setSpecs` from DataContext

## Design Decisions

| Decision                  | Choice                       | Rationale                                                                    |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Persona                   | Experienced quality engineer | Tool is for quality professionals, not beginners                             |
| Spec editing              | Inline in modal              | Catch errors at point of detection, not after entering a view                |
| Cpk recalculation         | Live on edit                 | <10ms calculation, immediate feedback on spec correctness                    |
| Cpk target default        | 1.33                         | Universally accepted minimum; user edits if stricter target needed           |
| Standard View description | Omitted                      | Expert users know what standard I-Chart shows; data card is self-explanatory |
