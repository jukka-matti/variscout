---
title: 'ADR-037: Reporting Workspaces'
audience: [analyst, engineer]
category: architecture
status: Accepted
date: 2026-03-20
related: [report-view, workspace, audience-toggle, qc-story]
---

# ADR-037: Reporting Workspaces

Supersedes: [ADR-024](adr-024-scouting-report.md)

## Status

Accepted (2026-03-20)

## Context

ADR-024 defined a single 5-step report structure (Current Condition → Drivers → Hypotheses → Actions → Verification) that auto-detected into 3 types (quick-check, deep-dive, full-cycle). With the introduction of the 3-workspace model (Analysis, Findings, Improvement), the report needed to reflect the workspace the analyst is working in rather than forcing a full-cycle structure.

The original report types were tied to journey progress, which created confusion when analysts wanted a snapshot of their current workspace without implying they had completed later phases.

## Decision

Redesign the report view around 3 workspace-aligned report types with an audience toggle:

### Report Types

| Type                 | Workspace           | Sections                                                                                                          |
| -------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Analysis Snapshot    | Analysis            | Current Condition, Drivers                                                                                        |
| Investigation Report | Analysis + Findings | Current Condition, Drivers, Evidence Trail, Hypothesis Summary                                                    |
| Improvement Story    | All three           | Current Condition, Drivers, Evidence Trail, Hypothesis Summary, Improvement Plan, Cpk Learning Loop, Verification |

### Audience Toggle

Each report supports two audience modes:

- **Technical**: Full statistical detail (I-Chart parameters, ANOVA tables, Cpk values)
- **Summary**: High-level narrative for non-technical stakeholders

The toggle is stored in `sessionStorage` (tab-local, not browser-global) and defaults to Technical.

### Workspace-Colored Sections

Report sections are color-coded by workspace origin:

- Analysis sections: green left border
- Findings sections: amber left border
- Improvement sections: purple left border

### New Components

- `ReportCpkLearningLoop` — Before/Projected/Actual Cpk comparison with verdict
- `ReportHypothesisSummary` — Read-only hypothesis tree with status dots
- `ReportImprovementSummary` — Improvement ideas grouped by hypothesis

### Markdown Export

Markdown export always uses Technical mode, as archived documents need full detail.

## Consequences

### Positive

- Report structure matches the analyst's mental model (workspace-driven)
- Audience toggle enables sharing with both technical and non-technical stakeholders
- Workspace coloring provides visual continuity between the app and the report
- Cpk Learning Loop closes the PDCA feedback loop in the report

### Negative

- Existing report section IDs changed (breaking change for any saved deep-links)
- Report export logic is more complex with audience-conditional content

### Migration

- Old report types (`quick-check`, `deep-dive`, `full-cycle`) only existed in documentation — no code migration needed
- `useReportSections` hook now returns `ReportWorkspace` and `AudienceMode` types

## Implementation Note (April 2026)

Report is now a **workspace tab** (`activeView: 'report'`) rather than a modal overlay. The `isReportOpen` and `isPresentationMode` state flags have been removed. Report/export/PDF actions live within the Report workspace. See [ADR-055](adr-055-workspace-navigation.md) for the workspace navigation model.

## References

- [Design spec](../superpowers/specs/2026-03-20-reporting-workspaces-design.md)
- [ADR-024](adr-024-scouting-report.md) (superseded)
