---
title: 'ADR-015: Investigation Board — Finding Status & Comments'
---

# ADR-015: Investigation Board — Finding Status & Comments

**Status:** Accepted (revised 2026-02-26)
**Date:** 2026-02-26
**Related:** ADR-014 (regression deferral — Phase 2 boundary)

---

## Context

The Findings system (db9c380) captures bookmarked filter states during drill-down.
Currently a flat list: pin → note → restore. Quality engineers need to track the
lifecycle of each finding — was it investigated? How significant is the contribution?
What was learned along the way?

Without this, analysts either:

- Keep mental notes about which findings they've followed up on
- Use external tools (spreadsheets, sticky notes) to track investigation status
- Lose context when returning to a project after days/weeks

This creates a gap in the investigation workflow: findings are captured but there's
no structured way to track the analysis that happens between pinning and acting.

## Decision

Add lightweight investigation tracking to findings: analysis-focused statuses,
optional classification tags, comment threads, and a grouped board view. This is
NOT project management — no assignees, no due dates, no priority levels.

### Statuses (Investigation lifecycle)

| Status        | Meaning                               | When to use              |
| ------------- | ------------------------------------- | ------------------------ |
| Observed      | Pattern spotted, not yet investigated | Auto-set on pin          |
| Investigating | Actively drilling into this           | Analyst is working on it |
| Analyzed      | Analysis completed                    | Ready to classify        |

### Tags (Analyzed finding classification)

Analyzed findings can optionally be tagged to indicate their significance:

| Tag        | Meaning                                        | Color  |
| ---------- | ---------------------------------------------- | ------ |
| Key Driver | Significant variation contributor — actionable | Green  |
| Low Impact | Minor or negligible contribution               | Gray   |
| _(none)_   | Analysis done, not yet classified              | Purple |

Tags reflect _contribution magnitude_, not causal certainty. VariScout quantifies
contribution, not causation.

### Comments

Each finding gains a timestamped comment thread — the investigation log. Captures
what was checked, when, and what was learned. Not a chat system — a sequential
record of investigation steps.

### Board View

Two layouts for the grouped-by-status view:

- Panel (≤500px): Accordion — collapsible sections per status (3 columns)
- Popout window (≥500px): Horizontal columns with native drag-and-drop

### Scope boundary

This enriches the investigation workflow. It does NOT:

- Add task management features (assignees, due dates, priorities)
- Affect the What-If Simulator (independent tool)

### Migration

Persisted `.vrs` files may contain the old 4-status model (`confirmed`/`dismissed`).
On load, `migrateFindings()` maps:

- `confirmed` → `analyzed` + tag `key-driver`
- `dismissed` → `analyzed` + tag `low-impact`

## Consequences

### Easier

- Track investigation progress across sessions (Azure)
- Classify findings by contribution magnitude (Key Driver / Low Impact)
- Audit trail: low-impact findings document what was ruled out
- Key Driver findings become natural shortlist for action
- Teaching tool: trainers can ask "show me your key drivers"

### Harder

- More UI surface area to maintain (status badge, tag badge, comments, board view)
- FindingsAction protocol grows (7 action types including set-tag)

---

## Revision: Unified Observations (2026-03-02)

### Change

Chart text annotations are now unified with the Findings system via `FindingSource`.
Previously, text annotations on charts were transient visual elements stored in
`DisplayOptions` (alongside color highlights). They are now stored as `Finding`
objects in `AnalysisState`, with a `source` field linking each finding to its
originating chart element.

### FindingSource

```typescript
interface FindingSource {
  chartType: 'boxplot' | 'pareto' | 'ichart';
  category?: string; // Boxplot/Pareto category name
  anchorX?: number; // I-Chart: 0–1 fraction of chart width
  anchorY?: number; // I-Chart: 0–1 fraction of chart height
}
```

`Finding.source` is optional — breadcrumb-pinned findings have no source (they
capture filter state, not chart position). Chart observations always have a source.

### What changed

| Aspect                | Before                       | After                                  |
| --------------------- | ---------------------------- | -------------------------------------- |
| Text annotation store | `DisplayOptions` (transient) | `Finding[]` in `AnalysisState`         |
| Color highlights      | `DisplayOptions`             | `DisplayOptions` (unchanged)           |
| Persistence           | Lost on project reload (PWA) | Persisted with findings (Azure .vrs)   |
| Context menu label    | "Add note"                   | "Add observation"                      |
| ChartAnnotationLayer  | Reads `ChartAnnotation[]`    | Reads `Finding[]` (filtered by source) |
| Status visibility     | None                         | Status dot on annotation box           |
