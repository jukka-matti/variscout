# ADR-015: Investigation Board — Finding Status & Comments

**Status:** Accepted
**Date:** 2026-02-26
**Related:** ADR-014 (regression deferral — Phase 2 boundary)

---

## Context

The Findings system (db9c380) captures bookmarked filter states during drill-down.
Currently a flat list: pin → note → restore. Quality engineers need to track the
lifecycle of each finding — was it investigated? Confirmed or dismissed? What was
learned along the way?

Without this, analysts either:

- Keep mental notes about which findings they've followed up on
- Use external tools (spreadsheets, sticky notes) to track investigation status
- Lose context when returning to a project after days/weeks

This creates a gap between Phase 1 (Investigate) and Phase 2 (What-If): findings
are captured but there's no structured way to track the investigation that happens
between pinning and acting.

## Decision

Add lightweight investigation tracking to findings: investigation-specific statuses, comment
threads, and a grouped board view. This is NOT project management — no assignees,
no due dates, no priority levels.

### Statuses (Investigation lifecycle)

| Status        | Meaning                                 | When to use               |
| ------------- | --------------------------------------- | ------------------------- |
| Observed      | Pattern spotted, not yet investigated   | Auto-set on pin           |
| Investigating | Actively drilling into this             | Analyst is working on it  |
| Confirmed     | Root cause validated with evidence      | Ready for What-If         |
| Dismissed     | Not a real issue (noise, data artifact) | Ruled out, keep for audit |

### Comments

Each finding gains a timestamped comment thread — the investigation log. Captures
what was checked, when, and what was learned. Not a chat system — a sequential
record of investigation steps.

### Board View

Two layouts for the grouped-by-status view:

- Panel (≤500px): Accordion — collapsible sections per status
- Popout window (≥500px): Horizontal columns with drag-and-drop (dnd-kit)

### Scope boundary

This enriches Phase 1 of the investigation workflow. It does NOT:

- Add task management features (assignees, due dates, priorities)
- Change the Phase 1 → Phase 2 transition (still manual)
- Affect the What-If Simulator

## Consequences

### Easier

- Track investigation progress across sessions (Azure)
- Distinguish "just noticed" from "verified root cause"
- Audit trail: dismissed findings document what was ruled out
- Confirmed findings become natural shortlist for What-If
- Teaching tool: trainers can ask "show me your confirmed findings"

### Harder

- More UI surface area to maintain (status badge, comments, board view)
- dnd-kit dependency added for popout drag-and-drop
- FindingsAction protocol grows (6 action types vs current 2)
