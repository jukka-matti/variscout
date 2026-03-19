---
title: 'ADR-031: Report Export — Print/PDF for All Azure Plans'
audience: [analyst, engineer]
category: architecture
status: Accepted
date: 2026-03-19
related: [report-view, export, pdf, print, scouting-report]
---

# ADR-031: Report Export — Print/PDF for All Azure Plans

**Status**: Accepted

**Date**: 2026-03-19

## Context

The Scouting Report (ADR-024) composes a scrollable, story-driven document from
analysis state. Standard plan users can view it and copy individual elements
(chart PNG, section-as-slide, rich HTML text), but have no way to produce a
single, complete artifact for colleagues without VariScout access.

Team+ users share via Teams deep links and SharePoint publishing. Standard plan
users store everything locally (IndexedDB + File System Access API) and need a
local file export.

### Options considered

| Option                       | Bundle cost | Effort   | Quality                          | Verdict      |
| ---------------------------- | ----------- | -------- | -------------------------------- | ------------ |
| Print/PDF via `@media print` | 0 KB        | 1-2 days | High (SVG charts print natively) | **Selected** |
| Self-contained HTML          | 0 KB        | 2-3 days | High (modern, searchable)        | Backlog      |
| PowerPoint (PptxGenJS)       | +150 KB     | 3-4 days | Medium (raster charts)           | Backlog      |
| Client-side PDF (jsPDF)      | +200-800 KB | 3-4 days | Low (poor SVG fidelity)          | Rejected     |

### Why Print/PDF wins

1. **Zero dependencies** — `window.print()` + CSS `@media print`. No bundle impact.
2. **SVG fidelity** — visx charts render as native SVG in print. No rasterization.
3. **Universal output** — PDF is the one format everyone can open and email.
4. **Already a document** — Report View is a scrollable story layout. It was
   designed to be printable.
5. **Covers 90% of need** — The remaining 10% (editable slides, interactive HTML)
   can be added later if users request it.

### Why not HTML or PPTX now

- **PPTX is redundant** — ADR-024's copy-as-slide workflow already handles the
  PowerPoint assembly use case (2 minutes vs 10).
- **HTML is niche** — Some corporate email systems block HTML attachments. PDF is
  universally accepted. HTML can be added later as a backlog item.
- **One excellent export > three adequate ones.**

## Decision

Add a Print/PDF export to the Report View, available on all Azure plans
(Standard, Team, Team AI). Not available on PWA (no Report View).

### Implementation

1. **Print stylesheet** (`packages/ui/src/styles/report-print.css`) —
   `@media print` rules that hide chrome, force light theme, control page breaks,
   preserve colors, and handle SVG charts.

2. **Print callback** (in `apps/azure/src/components/views/ReportView.tsx`) —
   Expands all sections, switches `data-theme` to light, calls `window.print()`,
   restores state via `afterprint` event.

3. **Sidebar button** — "Save as PDF" in Report View sidebar footer, below
   "Copy All Charts", above "Share Report" (Team+).

4. **In-document header/footer** — Process name, date, analyst name rendered as
   hidden elements shown only in `@media print`. Cross-browser (page margin boxes
   are Chromium-only).

### Tier gating

Local file export requires no cloud infrastructure. Per tier-philosophy
Principle 5 ("Infrastructure Reflects Value"), this belongs at Standard.

The upgrade trigger to Team remains intact: PDF is a static snapshot. Teams deep
links provide live, real-time access. "I need my team to see this in real-time"
still drives Standard → Team.

## Consequences

### What becomes easier

- Standard plan users can produce a professional PDF with one click
- The PDF looks consulting-grade (clean typography, colored status badges, SVG charts)
- Zero bundle cost — no new dependencies

### What stays the same

- Existing copy workflow unchanged (chart PNG, section-as-slide, rich HTML)
- Teams sharing unchanged (Team+ only)
- SharePoint publishing unchanged (Team AI only)

### Future options (backlog, not commitments)

- HTML export if users request searchable/interactive reports
- PPTX export if copy-as-slide proves too manual for 10+ finding reports
- Web Share API for mobile native sharing

## Related

- [ADR-024: Scouting Report](adr-024-scouting-report.md) — Report View design
- [Tier Philosophy](../08-products/tier-philosophy.md) — Feature gating principles
- [Feature Parity](../08-products/feature-parity.md) — Complete feature matrix
