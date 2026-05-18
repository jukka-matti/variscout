---
title: 'Wall: MeasurementPlan DOM detail surface mount point'
purpose: remember
tier: card
status: archived
date: 2026-05-16
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-16
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-16 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Wall: MeasurementPlan DOM detail surface mount point

**Surfaced by:** PR-WV1-3b Task 5 discovery, 2026-05-16.

**Context:** PR-WV1-3b needs a DOM surface for `<MeasurementPlanChip>` rows, `<AddPlanForm>` (multi-field inline expansion), and `<LinkFindingPicker>` (modal-ish finding picker). Initial concern: SVG canvas `<HypothesisCard>` (280x288 user-space units) seemed unsuitable for multi-input forms. Discovery checked whether an existing `<HypothesisDetailPanel>` or side panel / modal primitive already exists that could be reused.

**Discovery findings:**

1. **No pre-existing `<HypothesisDetailPanel>` or sidebar primitive.** `packages/ui/src/components/InvestigationWall/` contains: `WallCanvas`, `HypothesisCard`, `DraggableHypothesisCard`, `FindingChip`, `NarratorRail` (CoScout right-rail), `BrushToFindingFlow`, mini-charts, badges, and utilities. No detail panel, selected-hypothesis drawer, or modal scaffold exists in this family.
2. **`FindingChip` is a tethered SVG-only chip** (`<g role="button">` with SVG `rect`/`text`). It does not render inside `HypothesisCard` — it floats as a separate SVG element on the canvas. It is not the DOM primitive the spec's `<MeasurementPlanChip>` should mirror at the implementation level.
3. **`HypothesisCard` already uses `foreignObject` for DOM-in-SVG content.** The card body embeds `foreignObject` blocks for the mini-chart slot (`MiniIChart`/`MiniBoxplot` via `BrushToFindingFlow`), `TagChip` rows, and `OneStepAwayBadge`. This is the established pattern for DOM-rendered content inside the SVG card. `BrushToFindingFlow` itself uses a `foreignObject` inline-confirmation panel within the chart slot.
4. **No hypothesis selection state exists in any store or component.** `WallCanvas.onSelectHub` fires an opaque `(id: string) => void` prop that app-level consumers handle (e.g., navigation to detail). No `selectedHypothesisId` slice exists in `useCanvasViewportStore`, `wallLayoutStore`, or any other store.
5. **The spec (design decision §3) explicitly rules out a separate panel.** The spec states: "No separate modal, sidebar, or panel. Visual continuation of the existing `<FindingChip>` metaphor." The `<HypothesisCard>` extension section shows a two-half layout (EVIDENCE + MEASUREMENT PLAN) rendered directly inside the card body with `<MeasurementPlanChip>` rows and a `[+ Add Plan]` affordance.
6. **`AddPlanForm` inline expansion is feasible via `foreignObject`.** The card is currently 280x288 user-space units. The form (factor text input, method select, sample size number input, owner picker, MSA checkbox, Cancel/Save) can be rendered in a `foreignObject` expansion that grows the card's `height` prop while the form is open — the same mechanism used by `BrushToFindingFlow`'s inline-confirmation panel.

**Decision:** No new `<HypothesisDetailPanel>` component. No modal, side panel, or accordion. MeasurementPlan UI mounts **inline inside `<HypothesisCard>`** via `foreignObject`, extending the card body downward. Specifically:

- `<MeasurementPlanChip>` renders as DOM rows in a `foreignObject` block in the lower half of the card (below the existing findings/readiness section), mirroring how `TagChip` rows and `OneStepAwayBadge` already use `foreignObject` inside the card.
- `<AddPlanForm>` renders as an inline `foreignObject` expansion within the same card — card `height` prop increases when the form is open, identical to how `BrushToFindingFlow` shows a confirmation panel by swapping content inside the chart-slot `foreignObject`.
- `<LinkFindingPicker>` is the only truly modal-ish surface; it renders as a `foreignObject` overlay positioned over the card (or a fixed-position DOM portal — implementation detail for Task 7).

**Selection state:** No new `selectedHypothesisId` Zustand slice needed. `AddPlanForm` open state and `LinkFindingPicker` open state are local React `useState` within `HypothesisCard` or a new `<HypothesisCardWithPlans>` wrapper component. This matches the `BrushToFindingFlow` pattern where selection state (`pendingSelection`) is managed inside the render-prop component, not in any store.

**Rationale:** The spec is explicit ("no separate modal, sidebar, or panel") and the Wall architecture already validates this: `HypothesisCard` uses `foreignObject` for DOM content today, `BrushToFindingFlow` sets the precedent for inline confirmation panels within the card, and `MissingEvidencePanel` is the only DOM panel below the SVG (survey hints — a distinct concern). Growing the card vertically for inline forms respects the canvas-as-substrate principle (ADR-078 View layer owns canvas viewport; no new panel layer). The `NarratorRail` right-side rail is owned by CoScout messaging, not hypothesis-detail — reusing it would be a concern-mixing violation.

**Resolution:** PR-WV1-3b Tasks 6-7 build `<MeasurementPlanChip>`, `<AddPlanForm>`, and `<LinkFindingPicker>` as DOM components rendered via `foreignObject` inside `<HypothesisCard>`. Task 8 wires them into `HypothesisCard` (or a thin `<HypothesisCardWithPlans>` wrapper) using local `useState` for form-open and picker-open booleans — no store changes needed for selection state.
