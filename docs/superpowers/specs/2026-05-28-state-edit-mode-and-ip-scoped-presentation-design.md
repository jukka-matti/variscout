---
tier: living
purpose: design
title: 'State/Edit mode rethink + cross-tab IP-scoped presentation — linked-views architecture (Phase 1)'
audience: human
category: design-spec
status: delivered
last-reviewed: 2026-05-28
layer: spec
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
  - docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md
  - docs/superpowers/plans/2026-05-28-canvas-connection-journey-h-1-polish.md
  - docs/07-decisions/adr-034-yamazumi-analysis-mode.md
  - docs/07-decisions/adr-038-subgroup-capability-analysis.md
  - docs/07-decisions/adr-047-analysis-mode-strategy-pattern.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/decision-log.md
supersedes:
  - 'docs/superpowers/specs/2026-05-16-wedge-architecture-design.md §3.3 (State/Edit binary + State-mode panels) — wedge V1 reframe'
  - 'docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md §H2 (Multi-Y tabs + per-step switcher) — folded into this spec'
  - 'docs/07-decisions/adr-034-yamazumi-analysis-mode.md — yamazumi mode removed in wedge V1 (subsumed by process-flow + future pivot capability; different data-gathering workflow not aligned with wedge V1 paste-and-analyze flow)'
  - 'docs/07-decisions/adr-047-analysis-mode-strategy-pattern.md — mode union simplifies (yamazumi removed from ResolvedMode + AnalysisMode)'
implements:
  - docs/02-journeys/personas/lead.md
  - docs/02-journeys/ia-nav-model.md
  - docs/01-vision/methodology.md
---

# State/Edit mode rethink + cross-tab IP-scoped presentation

> **Status — DRAFT 2026-05-28.** This spec **supersedes** three upstream artifacts:
>
> - **`docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` §3.3** (State/Edit binary + State-mode panels) — wedge V1 reframe drops the State/Edit binary, deletes most §3.3 panels, retires the Done button.
> - **`docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` §H2** (PR-CCJ-H2: Multi-Y tabs + per-step view switcher, Task #47) — folded into this spec via the scope chrome's click-to-edit chips. Task #47 closes as "delivered via this spec."
> - **`docs/07-decisions/adr-034-yamazumi-analysis-mode.md`** (Yamazumi analysis mode) — yamazumi mode removed in wedge V1; the flow-analysis use case lives in process-flow mode; activity-classified time-study data is a future pivot-table capability. ADR-047 amended to drop yamazumi from the mode union. Companion use-case doc archived.

> **Brainstorm 2026-05-28 (combined Tasks #45 + #44).** Visual companion artifacts: `.superpowers/brainstorm/41304-1779992784/`. Plan-file decisions log: `~/.claude/plans/with-the-latest-discovery-groovy-hedgehog.md`. This spec captures decisions D1–D10 and lays out the Phase 1 implementation surface. Phase 2 (full bidirectional linked views + pop-out) is deferred to T-NEW-4.

---

## §1 Context

### What this spec resolves

The wedge V1 pivot (2026-05-16) collapsed VariScout from a multi-IP platform to a single-IP improvement specialist tool. Two design questions remained unresolved:

- **#45 — State/Edit mode rethink.** The wedge architecture spec §3.3 commits State mode to "outcome panel + process map state badges + decisions queue + cross-IP reference links." Reality: State mode is just "canvas without `EditModeShell`." The §3.3 panels are inheritances from the retired Process Owner / continuous-monitoring workflow.
- **#44 — Cross-tab IP-scoped presentation.** Findings, Hypotheses, and observations surface inconsistently across Explore / Analyze / Improve / Report. Each tab uses inline `.filter()` to scope to active IP. No shared infrastructure. Improve tab can see Findings but not their parent Hypotheses (asymmetry).

These two were entangled at H2 row 6 (per-step view switcher), where both "what is per-step Edit mode?" and "what entities surface per step?" needed answers.

### Why these are combined into one spec

H2's per-step requirements crossed both questions. A unified spec avoids deciding the same boundary twice.

### Customer-validation gate (§8.3)

The wedge spec §8.3 gates expansion beyond §3.3 on customer validation. This spec stays inside §3.3's territory — it _simplifies_ §3.3 rather than expanding it. The Phase 1 / Phase 2 split (see §8) commits the vision but ships only the foundational primitives.

---

## §2 Foundational rethink — why the State/Edit binary dies

### Old rationale (Process Owner, continuous monitoring)

State mode was designed for daily process management:

- Every day → new data → check today's Cpk in State mode
- Browse decisions queue: "did the team review Tuesday's spike?"
- Cross-reference other active investigations
- _Occasionally_ enter Edit mode to restructure when the process changed
- Click Done → back to monitoring

State mode panels (outcome / decisions queue / cross-IP refs) are _steady-state monitoring_ primitives.

### New reality (Improvement Specialist, project investigation)

Wedge V1 has a linear-ish lifecycle: **Frame → Explore → Analyze → Improve → Control** (one project, beginning + end, no steady state). The activities are investigation + improvement, not continuous monitoring.

What dies:

- Daily monitoring rhythm → there isn't one
- Cross-IP browsing → one IP at a time (anti-wedge)
- Steady-state decisions queue → finite decisions inside a project
- "Current outcome" panel → Cpk computed per analysis batch, not continuously

### What "State mode was solving" — and how each concern survives

| Original concern                           | Survives wedge V1? | Alternative solution                                                        |
| ------------------------------------------ | ------------------ | --------------------------------------------------------------------------- |
| Sponsors/Members shouldn't edit            | ✅ Yes             | `canEditCanvas` permission (already shipped)                                |
| Reading canvas should be visually calmer   | 🟡 Maybe           | Optional Focus toggle (single button, not a state) — out of scope this spec |
| Frame is a distinct phase from Drill       | ✅ Yes             | Modeled at **stage** level (Charter/Approach/Control), not UI mode          |
| Reduce accidental edits to a stable canvas | 🟡 Maybe           | Drag handles on hover; undo always works (Figma pattern)                    |
| Continuous-monitoring read mode            | ❌ No              | Not a wedge V1 workflow                                                     |
| Decisions queue / ops dashboard            | ❌ No              | Project lifecycle is finite                                                 |
| Cross-IP context refs                      | ❌ Anti-wedge      | One-IP-at-a-time deletes this                                               |

2 of 7 concerns die outright; 3 of 7 have non-mode alternatives; 2 of 7 plausibly justify keeping a _toggle_, not a binary state machine.

### Modern direct-manipulation pattern

Best-in-class tools (Figma, Notion, Linear, Miro) have moved past mode binaries. Permission gating handles "Viewer can't edit." Optional Present/Focus mode handles "I want visual calm." Inline editing on hover handles "small structural change."

VariScout wedge V1 adopts this pattern.

---

## §3 Decisions (D1–D10)

These were locked during the brainstorm session (2026-05-28). The plan file at `~/.claude/plans/with-the-latest-discovery-groovy-hedgehog.md` records the full rationale.

### D1 — Kill the State/Edit binary

Remove `authoringMode = 'author' | 'read'` state machine. Canvas is always directly editable (subject to `canEditCanvas` permission). Edit affordances appear contextually (hover/click). No transition ceremony.

**Code surface:**

- `packages/ui/src/components/Canvas/CanvasLevelRouter.tsx:33` — retire `CanvasAuthoringMode` type
- `packages/ui/src/components/Canvas/EditMode/EditModeShell.tsx` — retire as conditional shell; chrome inlines into the canvas itself
- `packages/ui/src/components/Canvas/CanvasWorkspace.tsx` — drop `authoringMode` useState, `effectiveAuthoringMode`, `setAuthoringMode`, `handleShellDone`

### D2 — Drop most §3.3 panels; keep outcome summary pill

Decisions queue and cross-IP reference links **die** (cross-IP anti-wedge). Process map state badges live on the canvas itself (no extra panel).

**KEEP** a small **outcome summary pill** in the Process tab header showing the current active outcome's name + latest Cpk + link to outcome spec. As chrome, not as a "State mode panel."

### D3 — Done button retires

No mode to exit. Delete `EditModeShell.tsx:178-184` (Done button) + `CanvasWorkspace.tsx:1202 handleShellDone` callback + `effectiveAuthoringMode` simplification.

### D4 — Click-to-Explore as the canvas's affirmative purpose

The Process tab becomes the IP's **structural model + analytical launchpad**. Outcome chips, factor chips, and step chips are click-navigable to Explore tab with the measure pre-scoped.

This is the affirmative answer to "what does the Process tab DO if not State/Edit?" — it's not a passive structural diagram; it's the launcher for analysis.

### D5 — H2 row 6 reframes (no separate switcher in Explore)

The per-step view switcher (H2 row 6) is delivered via:

- Click a step on canvas L2 → drill to step L3 (existing 8f viewport)
- Click a step-bound outcome/factor chip at L3 → land in Explore with `stepId` in scope
- Yamazumi mode renders that step's bar highlighted; standard mode filters to step rows; etc.

No separate UI switcher in Explore. The canvas IS the per-step selector.

### D6 — 5-verb activity-frame model + Project = IP vocabulary

Adopt the **5-verb activity-frame**: **Frame → Explore → Analyze → Improve → Control**. Each verb matches a tab or stage name; no vocabulary drift.

- Frame ↔ Process tab (canvas configuration)
- Explore ↔ Explore tab (EDA)
- Analyze ↔ Analyze tab (Wall)
- Improve ↔ Improve tab (actions)
- Control ↔ Control stage (verify + handoff)

This supersedes #39's 4-verb proposal (Frame/Drill/Improve/Verify) — the new model is stricter. **"Drill"** preserved as the in-Explore sub-action verb only (`drill-down into '{category}'`).

Project = IP terminology inherited from #40. Use "Project" in user-facing copy; "IP" allowed in code identifiers (per existing convention).

### D7 — Naming: "Explore from canvas" / "Open in Explore →"

- **Spec doc concept name:** "Explore from canvas"
- **Hover affordance label on chips:** "Open in Explore →"
- **Code primitive:** `navigateToExploreForChip(chip)` (extends F1's `pendingExploreIntent` pattern)

Three-level naming hierarchy preserved:

- **JOB** (Lead JTBD): "Drill" — the analyst's activity
- **SURFACE** (tab): "Explore" — where they go to do Drill
- **SUB-ACTION** (in-chart): "drill-down" — refining within Explore (existing i18n keys preserved)

### D8 — Mode-orthogonal Click-to-Explore (status quo modes for this spec)

`analysisScopeStore` mutations don't touch `projectStore.analysisMode`. Modes are auto-detected at data ingestion and rarely changed. Click-to-Explore sets within-mode selectors only.

> **Note:** The user (2026-05-28) flagged that the whole mode-system concept may need rethinking under wedge V1's 3-canvas-level (L1/L2/L3) framing — capability is really a lens-toggle (ADR-038), not a true mode; mode predates the wedge pivot. Captured as T-NEW-3 follow-up; out of scope for this spec.

### D8.1 — Drop `focusedChart` from Click-to-Explore intent

Default landing for Click-to-Explore is the **full 4-chart dashboard** of the active mode (I-Chart + Boxplot + Pareto + Stats/Capability for standard; mode-specific layouts for yamazumi/performance/defect). `yColumn` + `boxplotFactor` + `stepId` apply across all 4 slots; no single-chart full-screen zoom on click.

F1's existing `→ Explore` initial-exit button keeps its `focusedChart` behavior (different intent, different UX — the soft-gate exit is a guided first entry, not a per-chip click).

### D9 — H2 (Task #47) folded into single-row scope chrome with click-to-edit chips

Y / step switching is delivered via the **scope chrome** itself (§5.1) — not via separate Y-strip + step-strip rows. Each scope chip is click-to-edit:

- **Y / X / step chips** (single-select) → click opens a `SingleSelectPopover` (new small primitive) with the IP's outcomes / factors / steps, active value highlighted, click alternative → swap
- **Categorical filter chips** (multi-select) → click opens the existing `FilterChipDropdown` component (checkboxes; add/remove values)
- **`+ filter`** affordance at end-of-row → column picker → opens `FilterChipDropdown` for the chosen factor

This collapses three potential chrome rows (scope + Y-strip + step-strip) into one. Matches Linear / Notion / Tableau / Figma's modern filter-chip patterns. Task #47 closes as "delivered via this spec."

### D10 — `analysisScopeStore` as the linked-views bridge primitive

New Zustand store. Single source of truth for the active analysis scope. Both Process tab and Explore tab subscribe. Multi-value semantics for categorical filters match the existing `FilterChipData` / `onUpdateFilterValues(factor, newValues[])` pattern from `ProcessHealthBar`.

```typescript
// packages/stores/src/analysisScope/analysisScopeStore.ts (new)

export interface CategoricalFilter {
  readonly column: string;
  readonly values: ReadonlyArray<string | number>;
}

export interface AnalysisScopeState {
  readonly yColumn?: string;
  readonly boxplotFactor?: string;
  readonly stepId?: string;
  readonly categoricalFilters: ReadonlyArray<CategoricalFilter>;
}

export interface AnalysisScopeActions {
  // Single-value setters (Y / X / step)
  setY(yColumn: string | undefined): void;
  setBoxplotFactor(factor: string | undefined): void;
  setStepId(stepId: string | undefined): void;

  // Multi-value categorical actions (matches existing FilterChipDropdown semantics)
  addCategoricalValue(column: string, value: string | number): void;
  removeCategoricalValue(column: string, value: string | number): void;
  setCategoricalValues(column: string, values: ReadonlyArray<string | number>): void;
  removeCategoricalFilter(column: string): void;

  clearScope(): void;
}
```

The store is **session-scoped**, not persisted. Scope is ephemeral analysis state, not IP identity.

**Categorical filter semantics (matches existing `FilterChipDropdown`):**

- `addCategoricalValue('vessel', 'A')` — adds value to factor; creates filter entry if factor doesn't exist
- `addCategoricalValue('vessel', 'B')` again — appends to existing values → `vessel = [A, B]`
- `removeCategoricalValue('vessel', 'A')` — removes single value; auto-removes filter if values become empty
- `setCategoricalValues('vessel', ['A', 'B', 'C'])` — replaces the entire values array (called from `FilterChipDropdown` commit)
- `removeCategoricalFilter('vessel')` — removes entire factor (× on scope chip)

---

## §4 Process tab — what changes

### §4.1 Outcome summary pill (chrome)

A small pill in the Process tab header:

```
┌────────────────────────────────────────┐
│ Active outcome: yield_pct · Cpk 1.21 ↗ │
└────────────────────────────────────────┘
```

- Shows the **scoped** outcome (from `analysisScopeStore.yColumn`)
- Cpk recomputed live (cached) given current `categoricalFilters` + `stepId`
- ↗ click → open the outcome spec popover (existing component)
- If `yColumn` undefined → hidden

### §4.2 Click-to-Explore affordances on chips

Chips with the "Open in Explore →" affordance:

- **Outcome chips** (Outcome zone): hover → small `→ Explore` icon button appears top-right of chip
- **Factor chips** (Factors zone): same
- **Step-bound chips** at L3 focal step: same
- **Step boxes** in process map (L2): hover → border becomes interactive; click → drill to L3 OR set `stepId` (see §4.4)

Affordance markup:

```html
<button
  type="button"
  class="explore-jump-button"
  aria-label="Open yield_pct in Explore"
  data-testid="chip-explore-jump"
>
  →
</button>
```

Drag-vs-click coexistence: chip body drags (for re-zoning); the small icon button is the launch target (Q-CTE-2 + Q-CTE-3 lock).

### §4.3 Click handler contract

```typescript
// packages/ui/src/components/Canvas/EditMode/handlers/navigateToExploreForChip.ts (new)

import { useAnalysisScopeStore } from '@variscout/stores';
import { usePanelsStore } from '...';

export function navigateToExploreForChip(chip: Chip): void {
  const scope = useAnalysisScopeStore.getState();
  const panels = usePanelsStore.getState();

  switch (chip.kind) {
    case 'outcome':
      scope.setY(chip.columnName);
      if (chip.stepId) scope.setStepId(chip.stepId);
      break;
    case 'factor':
      scope.setBoxplotFactor(chip.columnName);
      if (chip.stepId) scope.setStepId(chip.stepId);
      break;
    case 'step':
      scope.setStepId(chip.stepId);
      break;
  }

  panels.showExplore();
}
```

No `focusedChart` set (per D8.1). Mode stays orthogonal (per D8).

### §4.4 Step boxes in process map (L2)

Step boxes on the process map have TWO interactions:

- **Click body** → drill to L3 (existing 8f navigation)
- **Click "Open in Explore →" affordance** → set `stepId` in scope + switch to Explore (no L3 drill)

The L3-drill remains the default; Explore-jump is the explicit secondary action.

### §4.5 Live scope visualization on canvas

The canvas subscribes to `analysisScopeStore` and renders in-scope markers:

- **Active Y outcome chip**: green border + ✓ marker
- **Active boxplot factor chip**: blue border + ✓ marker
- **Active step**: highlighted in process map + "📍 active" badge in steps band
- **Categorical filters**: chip badges show "({column}={value} only)" — e.g., `vessel chip → "vessel = A only"`
- **Out-of-scope chips**: dimmed (~50% opacity) when _any_ scope is active

When scope is empty, all chips render normally (full opacity, no markers).

### §4.6 Step-bound chips at L3

When user drills to step L3 via canvas, the focal step's step-bound chips (per PR-CCJ-C2/C3) are visible. Each has the Click-to-Explore affordance. Clicking sets both `yColumn`/`boxplotFactor` AND `stepId` automatically (the chip carries `stepId`).

---

## §5 Explore tab — what changes

### §5.1 Scope chrome in Explore header (single row, mixed-behavior chips)

Above the dashboard, a single thin chrome row holds all active scope chips. Each chip is click-to-edit. The row collapses to a single-line empty-state hint when scope is empty.

**Visual layout** (when scope populated):

```
scope:  [Y: yield ▾]  [X: temperature ▾ ×]  [step: Pack ▾ ×]  [vessel: A, B ▾ ×]  [operator: 3 values ▾ ×]  [+ filter]  clear all
```

**Chip behaviors (two flavors):**

| Scope dimension                          | Selection | Click action                                                                    | × ?                                        |
| ---------------------------------------- | --------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| **Y** (outcome)                          | single    | Opens `SingleSelectPopover` with IP outcomes; click alternative swaps Y         | no (Y is required when scope is non-empty) |
| **X** (boxplot factor)                   | single    | Opens `SingleSelectPopover` with IP factors                                     | yes                                        |
| **step**                                 | single    | Opens `SingleSelectPopover` with IP process steps (+ "all" option)              | yes                                        |
| **categorical** (vessel, operator, etc.) | **multi** | Opens existing `FilterChipDropdown` (checkboxes, available values + counts)     | yes (removes entire filter)                |
| **`+ filter`**                           | n/a       | Column picker (IP's factor list) → opens `FilterChipDropdown` for chosen factor | n/a                                        |
| **`clear all`**                          | n/a       | `scope.clearScope()`                                                            | n/a                                        |

**Label format for categorical chips:**

- 1 value: `vessel: A`
- 2 values that fit: `vessel: A, B`
- 3+ values: `operator: 3 values` (full list visible on hover or in the dropdown)

**Component reuse:**

- Categorical chips → reuse existing `FilterChipDropdown` (`packages/ui/src/components/FilterChipDropdown/`); wire its `onUpdateFilterValues` callback to `scope.setCategoricalValues(column, newValues)`
- Y/X/step chips → new small `SingleSelectPopover` primitive in `@variscout/ui` (radios + active marker; ~80 LOC)
- Top-level `<ScopeChip>` component dispatches to the right popover based on `kind`

**Empty-state hint** (when `yColumn` is undefined):

```
No outcome selected. Go to Process tab to pick a measure.
```

Single-line, dimmed, with a link back to Process tab. Same pattern as F1's "Set an outcome to unlock Explore" copy.

### §5.2 [DELETED] Y-strip — folded into §5.1

The original H2 row 5 (multi-Y switching) is delivered by §5.1's Y chip click → `SingleSelectPopover`. No separate strip needed.

### §5.3 [DELETED] Step-strip — folded into §5.1

The original H2 row 6 (per-step switcher) is delivered by §5.1's step chip click → `SingleSelectPopover`. No separate strip needed.

### §5.4 Drill-in from charts (Phase 1 minimum)

Two chart interactions add categorical filter values to scope:

- **Pareto bar click** → `scope.addCategoricalValue(paretoFactor, clickedCategory)` — additive (creates filter if factor not yet in scope; appends value if filter exists)
- **Boxplot category click / whisker click** → `scope.addCategoricalValue(boxplotFactor, clickedCategory)`

Repeated clicks accumulate values within the same factor. Click "vessel=A" then "vessel=B" → `vessel = [A, B]`. The categorical chip in scope chrome updates to show `vessel: A, B`. Click the chip → opens `FilterChipDropdown` for fine-grained editing.

Other chart-driven mutations (I-Chart point → date filter, Histogram bucket → value-bin filter, Capability annotation → above/below-spec filter) are **Phase 2 / T-NEW-4**.

### §5.5 Removed: focusedChart on click (D8.1)

The 4-chart dashboard renders all charts simultaneously. No single-chart full-screen zoom on Click-to-Explore. (F1's `→ Explore` exit button keeps its own `focusedChart` behavior — it's the soft-gate first-entry experience, separate from Click-to-Explore.)

### §5.6 Migration of F1's `pendingExploreIntent`

F1's existing `pendingExploreIntent` (in `panelsStore`) writes to `analysisScopeStore` on apply:

```typescript
// existing F1 logic in Dashboard.tsx:437-447, refactored:
useEffect(() => {
  if (!pendingExploreIntent) return;
  const scope = useAnalysisScopeStore.getState();
  if (pendingExploreIntent.focusedChart) {
    setFocusedChart(pendingExploreIntent.focusedChart); // F1 exit-only
  }
  if (pendingExploreIntent.boxplotFactor) {
    scope.setBoxplotFactor(pendingExploreIntent.boxplotFactor);
  }
  clearPendingExploreIntent();
}, [pendingExploreIntent]);
```

After this spec ships, the F1 exit button keeps its focusedChart UX (it's a guided first-entry). Per-chip clicks use the new `navigateToExploreForChip()` helper which doesn't set focusedChart.

---

## §6 Mode interaction

The `analysisScopeStore` is mode-agnostic. Each mode reads scope and renders accordingly. Irrelevant fields are silently ignored.

| Mode           | yColumn                                       | boxplotFactor                | stepId                                 | categoricalFilters   |
| -------------- | --------------------------------------------- | ---------------------------- | -------------------------------------- | -------------------- |
| `standard`     | Active Y on I-Chart, Boxplot, Capability slot | X-axis of Boxplot + Pareto   | Filter rows to step                    | Filter rows globally |
| `capability`   | Same as standard + Capability slot uses specs | Same                         | Same (subgroup if step has duplicates) | Same                 |
| `performance`  | Selects channel (if measureColumns)           | Channel-level boxplot factor | N/A (channels aren't steps)            | Filter rows globally |
| `defect`       | Selects defect rate metric                    | Defect type factor           | Filter to step (if step structure)     | Filter rows globally |
| `process-flow` | Selects flow metric (lead / cycle / wait)     | Station factor               | Highlight station; filter side charts  | Filter rows globally |

**Edge case — irrelevant scope mutations.** If user is in a mode that doesn't use a particular scope dimension (e.g., `boxplotFactor` in process-flow where the X-axis is fixed to station sequence), scope still stores the value. Mode silently ignores it; switching modes later applies it naturally. **No toast, no auto-switch.** Mode-aware switching is the T-NEW-3 question.

### §6.1 Yamazumi mode removed in wedge V1

Yamazumi was previously a specialty mode for lean-style cycle-time decomposition (VA / NVA / Waste / Wait stacked bars). It is **removed in wedge V1** for three reasons:

1. **Process-flow mode covers the flow-analysis use case** — yamazumi was the deeper cut on the same data process-flow already handles
2. **Different data-gathering workflow** — activity-typed time studies (stopwatch + observer) are a separate craft from the wedge V1 paste-and-analyze ingestion flow
3. **Future pivot-table capability covers activity-decomposition** — a generic pivot (rows = steps, cols = activity types, values = sum cycle time) gives the same insight; specialty mode not needed

Removal is an atomic deletion sweep (PR-LV1-0) that lands before the linked-views work begins. ADR-034 marked superseded; ADR-047 amended; companion use-case doc archived. See §10 for the implementation order.

---

## §7 Vocabulary alignment (D6 inherited)

This spec uses the **5-verb activity-frame** consistently:

- "Frame" — what the analyst does in Process tab
- "Explore" — both the verb (entering Explore tab) and the surface name
- "Analyze" — the activity in Analyze tab (Wall + Hypotheses)
- "Improve" — design + commit actions
- "Control" — verify + handoff

"Drill" is the JOB the analyst performs in Explore (per Lead JTBD restructure). Used internally in JTBD docs only; UI label is `drill down` (in-chart sub-action).

"Project" = "IP" — same concept. Use "Project" in user-facing copy.

The methodology + journey doc PR (T-NEW-1) catches up the canonical docs to match this vocabulary. Until then, this spec is the bridge.

---

## §8 Phase 1 (this spec) vs Phase 2 (T-NEW-4)

### Phase 1 — ships from this spec

0. **Prerequisite:** Yamazumi mode removal (atomic deletion sweep — PR-LV1-0)
1. `analysisScopeStore` Zustand store with single-value + multi-value categorical actions
2. F1 `pendingExploreIntent` migration to write to scope store
3. `navigateToExploreForChip()` helper + Outcome/Factor/Step chip "Open in Explore →" affordances on canvas
4. Outcome summary pill in Process tab header
5. Process tab canvas live scope visualization (✓ markers, dim out-of-scope, badges for categorical filters)
6. Single-row scope chrome in Explore header (mixed-behavior chips: single-select Y/X/step via new `SingleSelectPopover` + multi-select categorical via existing `FilterChipDropdown` + `+ filter` affordance + `clear all`)
7. Pareto bar click + Boxplot category/whisker click → `addCategoricalValue()` accumulation
8. Drop `focusedChart` from per-chip intent (keep F1 exit button behavior)
9. Retire `authoringMode` state machine + `EditModeShell` + Done button

### Phase 2 — T-NEW-4 (separate spec + sub-plans)

- I-Chart point click → date/category filter mutation
- Histogram bucket click → value-bin filter
- Capability annotation click → above/below-spec filter
- Cross-chart hover-highlight (hover Pareto bar → highlight matching points in I-Chart)
- Pop-out window mode for Process + Explore side-by-side
- Categorical filter editor UI in scope chrome (add filter via search/dropdown)

Phase 2 closes the bidirectional loop. Phase 1 alone is a substantial upgrade: the analyst gets canvas-as-live-scope-visualization + accumulating filters in one direction.

---

## §9 Out of scope (deferrals + follow-ups)

### Explicit deferrals (out of scope for this spec)

- **T-NEW-1** — Methodology + JTBD vocabulary alignment doc PR (5-verb spine). Supersedes #39.
- **T-NEW-2** — Methodology spec amendment if extensive.
- **T-NEW-3** — Explore tab mode/lens system rethink under wedge V1 3-canvas-level framing. Companion to #11. The user flagged that modes predate the wedge pivot + capability is really a lens-toggle. Plausible reframing: data-shape gates available lenses; user toggles in Explore chrome; no persistent IP-level "mode" identity. **Now with yamazumi removed, 5 modes remain — T-NEW-3 should consider whether performance / defect / process-flow should similarly consolidate as lenses within a unified standard surface.**
- **T-NEW-4** — Linked views Phase 2 (bidirectional cross-filtering + pop-out).
- **Future pivot-table capability** — generic pivot UI for activity-classified time-study data or similar 2D aggregation. Replaces yamazumi's specialty use case. No timeline.
- **ControlHandoff HubAction dispatch wiring** — Task #12 (separate ControlHandoff design session).
- **8f canvas viewport L1/L2/L3 lens-modes** — confirmed orthogonal to this spec; preserved as-is.
- **"Mode A.1"** — doesn't exist in code; drop from scope.

### Preserved identifiers (do not rename per CLAUDE.md)

`AnalysisMode`, `AnalysisBrief`, `AnalysisStats`, `AnalysisModeStrategy`, `AnalysisLensTab`, `DashboardTab` union, `ProcessStateLens`, `AIContext.investigation`, Investigation Wall (methodology brand), `'investigation-report'` ReportType, `docs/03-features/analysis/`, `Dashboard.tsx`, `ProjectMetadata.sustainment`, `panelsStore 'sustainment'` key, CoScout AI prompts, `investigationId` FK fields, ADR-074 timing concepts (`investigation-time`, `RouterPhase | 'investigation'`).

---

## §10 Implementation order (writing-plans handoff)

Per the user's `feedback_master_plan_for_multi_subsystem_specs`: this spec touches multiple engineering surfaces (yamazumi removal + new store + canvas changes + Process header + Explore chrome + chart click handlers), so writing-plans should produce a **master plan at PR-level granularity**, then invoke writing-plans per PR for bite-sized sub-plans.

Suggested PR sequencing (**9 PRs total** — 1 prerequisite + 8 linked-views):

0. **PR-LV1-0** — **Remove yamazumi mode (atomic deletion sweep).** Delete `packages/core/src/yamazumi/`, `packages/charts/src/YamazumiChart.tsx`, yamazumi dashboards in apps/azure + apps/pwa, mode strategy entries, auto-detection wiring, persistence (`YamazumiColumnMapping`), and i18n keys. Drop `'yamazumi'` from `AnalysisMode` + `ResolvedMode` unions. Mark ADR-034 superseded; amend ADR-047; archive use-case doc. Per `feedback_atomic_sweep_one_dispatch`: ONE Opus implementer with Architect → Migration → Validator internal phases. No back-compat (`feedback_wedge_v1_no_migration_no_backcompat`). Lands first; every subsequent PR is simpler. **Opus.**
1. **PR-LV1-A** — `analysisScopeStore` Zustand store + multi-value categorical actions + tests. No UI changes. Foundation. **Opus** (store design).
2. **PR-LV1-B** — Migrate F1 `pendingExploreIntent` apply logic to write to scope store. No-op behavioral change. **Sonnet.**
3. **PR-LV1-C** — Retire `authoringMode` + `EditModeShell` + Done button. Canvas becomes always-editable (permission-gated). **Sonnet.**
4. **PR-LV1-D** — `navigateToExploreForChip()` helper + chip hover affordances on canvas + scope mutations. **Sonnet.**
5. **PR-LV1-E** — Scope chrome in Explore header (single row, mixed-behavior chips). New `SingleSelectPopover` primitive + integration with existing `FilterChipDropdown` for categorical chips + `+ filter` affordance + `clear all`. **Sonnet.**
6. **PR-LV1-F** — Pareto bar + Boxplot category click → `addCategoricalValue()` accumulation. **Sonnet.**
7. **PR-LV1-G** — Process tab canvas live scope visualization (✓ markers + dim out-of-scope + categorical badges). **Sonnet.**
8. **PR-LV1-H** — Outcome summary pill in Process tab header. **Sonnet.**

Each linked-views PR is well-specified UI/store work; mostly Sonnet implementer feasible per the subagent-driven-development protocol. Opus for PR-LV1-0 (judgment-heavy deletion-cascade) and PR-LV1-A (store design), plus the final branch review.

---

## §11 Related

- Wedge V1 architecture spec: `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` (§3.3 amended by this spec)
- Canvas Connection Journey spec: `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md` (Spec 2 of Framing Layer V2)
- F1 sub-plan (existing intent infra): `docs/superpowers/plans/2026-05-28-canvas-connection-journey-f-1-explore-exit.md`
- H1 sub-plan (latest CCJ ship): `docs/superpowers/plans/2026-05-28-canvas-connection-journey-h-1-polish.md`
- ADR-034 (Yamazumi mode): `docs/07-decisions/adr-034-yamazumi-analysis-mode.md`
- ADR-038 (Capability is a lens not a mode): `docs/07-decisions/adr-038-subgroup-capability-analysis.md`
- ADR-047 (mode strategy pattern): `docs/07-decisions/adr-047-analysis-mode-strategy-pattern.md`
- ADR-082 (wedge architecture): `docs/07-decisions/adr-082-wedge-architecture.md`

Brainstorm artifacts: visual companion outputs at `.superpowers/brainstorm/41304-1779992784/` (gitignored).
