---
title: Reporting Workspaces Design
audience: [engineer, analyst, manager]
category: workflow
status: draft
related:
  [report, workspaces, analysis, findings, improvement, audience, two-voices, adr-024, adr-031]
---

# Reporting Workspaces Design

The reporting view evolves from a flat 5-step narrative into **workspace-aligned report types** with an **audience toggle**, creating reports that naturally tell the story of the analyst's current workspace at the right level of detail for the reader.

## Motivation

The current report view has a single structure: 5 linear steps (Current Condition → Drivers → Hypotheses → Actions → Verification) that auto-detect into 3 types (quick-check, deep-dive, full-cycle). With the 3-workspace model (Analysis, Findings, Improvement), the report should:

1. **Reflect the workspace** the analyst is working in — not force a full-cycle structure when the analyst is still exploring
2. **Speak in the right voice** — technical detail for quality engineers vs. executive summary for managers (Two Voices principle)
3. **Surface rich improvement data** — the current report doesn't show hypothesis trees, improvement ideas, risk assessments, or the projected-vs-actual learning loop

## Two Dimensions

### Dimension 1: Report Type (auto-detected, workspace-aligned)

| Report Type              | Auto-Detect Condition         | Color            | Phase       | Workspace Focus    |
| ------------------------ | ----------------------------- | ---------------- | ----------- | ------------------ |
| **Analysis Snapshot**    | No findings exist             | Green (#22c55e)  | SCOUT       | Analysis workspace |
| **Investigation Report** | Findings exist, no outcomes   | Amber (#f59e0b)  | INVESTIGATE | Findings workspace |
| **Improvement Story**    | Findings + actions + outcomes | Purple (#8b5cf6) | IMPROVE     | All 3 workspaces   |

### Dimension 2: Audience Mode (user-selected toggle)

| Mode          | Target Audience                        | Voice                 | Content Level                                          |
| ------------- | -------------------------------------- | --------------------- | ------------------------------------------------------ |
| **Technical** | Quality engineer, problem-solving team | Voice of the Process  | Full statistical detail, drill paths, hypothesis trees |
| **Summary**   | Manager, sponsor, team briefing        | Voice of the Customer | Capability verdicts, key metrics, actions, outcomes    |

Default: Technical. Persisted per session (not per project).

---

## Report Type Details

### Analysis Snapshot (Green)

The analyst is exploring data. The report captures the current state and variation drivers.

**Sections:**

| #   | Section           | Technical Mode                                      | Summary Mode                                   |
| --- | ----------------- | --------------------------------------------------- | ---------------------------------------------- |
| 1   | Current Condition | KPI grid + I-Chart + AI narrative                   | KPI grid only (capability card)                |
| 2   | Variation Drivers | Boxplot + Pareto for first factor + η² contribution | KPI grid with key driver name + contribution % |

**Workspace color:** Green left border on sections, green dots in TOC.

**Who reads this:**

- **Green Belt Gary** — quick process health check
- **Field Fiona** — morning standup chart review
- **Student Sara** — learning SPC basics

### Investigation Report (Amber)

The analyst has pinned findings and is building the case. The report captures the evidence trail.

**Sections:**

| #   | Section           | Technical Mode                                                                                                                                             | Summary Mode                                       |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Current Condition | KPI grid + I-Chart                                                                                                                                         | KPI grid only                                      |
| 2   | Variation Drivers | Boxplot + Pareto                                                                                                                                           | Key driver + contribution %                        |
| 3   | Evidence Trail    | Hypothesis tree summary (status per hypothesis, cause role badges, investigation phase indicator) + synthesis card + finding snapshots with filter context | Synthesis narrative + primary suspected cause only |

**Workspace color:** Sections 1-2 have green left border (Analysis workspace), Section 3 has amber left border (Findings workspace).

**Who reads this:**

- **Engineer Eeva** — sharing investigation progress with the team
- **Curious Carlos** — understanding what's been found so far
- **OpEx Olivia** (summary mode) — status update on the investigation

### Improvement Story (Purple)

The full PDCA cycle is documented. The report tells the complete story across all three workspaces.

**Sections:**

| #   | Section               | Technical Mode                                                                                           | Summary Mode                                 |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Current Condition     | KPI grid + I-Chart                                                                                       | KPI grid only                                |
| 2   | Where Variation Hides | Boxplot + Pareto + η²                                                                                    | Key driver + contribution %                  |
| 3   | What We Found         | Hypothesis tree + synthesis card + finding snapshots                                                     | Synthesis + primary cause                    |
| 4   | What We Planned       | Improvement ideas grouped by hypothesis + direction badges + timeframe/cost/risk summary + projected Cpk | Timeframe breakdown bar + best projected Cpk |
| 5   | What We Did           | Actions with completion status + idea traceability + assignees + due dates                               | Action count + completion %                  |
| 6   | Did It Work?          | Outcomes + staged comparison charts + Cpk learning loop (before → projected → actual)                    | Cpk delta (before → after) with verdict      |

**Workspace colors:** Sections 1-2 green (Analysis), Section 3 amber (Findings), Sections 4-6 purple (Improvement).

**Who reads this:**

- **Engineer Eeva** — improvement project closure documentation
- **OpEx Olivia** (summary mode) — management review presentation
- **Knowledge Base** — published to SharePoint for organizational learning

---

## Audience Toggle Design

### UI Placement

A segmented button pair in the report header, positioned between the report type badge and the analyst name:

```
[×] 📄 Process Name   [Analysis Snapshot]  [Technical | Summary]  Analyst
```

### Behavior

- **Technical** (default): Full content as described in the Technical Mode columns above
- **Summary**: Reduced content as described in the Summary Mode columns above
- Toggle is instant (no re-render delay) — content is conditionally rendered
- State persisted in session storage (not per project)
- Print/PDF respects the current audience mode

### Two Voices Integration

The audience toggle maps to the Two Voices pedagogy:

| Voice                 | Mode      | Language Pattern                                                            | Example                                                                   |
| --------------------- | --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Voice of the Process  | Technical | "Evidence suggests…", "η² = 0.46", "Drill path: Machine → Shift → Operator" | "46% of total variation concentrated in Machine C, Shift 2"               |
| Voice of the Customer | Summary   | "Capability improved…", "Target met", "Yield: 92% → 98%"                    | "Cpk improved from 0.8 to 1.35 — process now meets customer requirements" |

---

## Sidebar TOC with Workspace Groups

The sidebar table of contents gains workspace group headers:

```
┌─────────────────────────┐
│ ANALYSIS                │  ← green divider
│  ● Current Condition    │
│  ● Variation Drivers    │
├─────────────────────────┤
│ FINDINGS                │  ← amber divider
│  ● Evidence Trail       │
├─────────────────────────┤
│ IMPROVEMENT             │  ← purple divider
│  ○ What We Planned      │
│  ○ What We Did          │
│  ○ Did It Work?         │
└─────────────────────────┘
```

- Groups only appear when their sections are present
- Analysis Snapshot: only "ANALYSIS" group
- Investigation Report: "ANALYSIS" + "FINDINGS" groups
- Improvement Story: all three groups
- Group headers are colored text (green/amber/purple) with a thin colored left border
- Section dots use workspace color when active, grey when future

---

## New Report Components

### ReportHypothesisSummary

Read-only compact hypothesis tree for the Evidence Trail section.

```
┌──────────────────────────────────────────────────┐
│  🟢 Supported  Machine wear causes fill drift    │  ← primary cause badge
│     └─ 🟢 Supported  Nozzle #3 worn past spec   │
│     └─ 🔴 Contradicted  Temperature variation    │
│  🟡 Partial  Operator technique varies           │  ← contributing badge
└──────────────────────────────────────────────────┘
```

Props: `hypotheses: Hypothesis[]` (pre-filtered to roots + children).
Displays: hypothesis text, validation status dot (green/amber/red/grey), cause role badge, factor link.
No interactivity — pure read-only display.

### ReportImprovementSummary

Read-only improvement plan summary for the "What We Planned" section.

```
┌──────────────────────────────────────────────────┐
│  Hypothesis: Machine wear causes fill drift      │
│  ┌────────────────────────────────────────────┐  │
│  │ ✓ Replace worn nozzles        [Prevent] 🟢│  │  ← selected, direction, timeframe
│  │   Just do · No cost · Low risk             │  │
│  │ ✓ Add daily inspection        [Detect]  🔵│  │
│  │   Days · Low cost · Low risk               │  │
│  │   Projected Cpk: 1.45                      │  │  ← from What-If
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Summary ─────────────────────────────────┐   │
│  │ 2 selected · 1 just-do · 1 days          │   │
│  │ Best projected Cpk: 1.45                  │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

Props: `hypotheses` with ideas, `selectedIdeaIds`, `targetCpk?`.
Summary mode: Only shows the summary bar (timeframe breakdown + projected Cpk).

### ReportCpkLearningLoop

Before → Projected → Actual Cpk comparison for the "Did It Work?" section.

```
┌──────────────────────────────────────────────────┐
│  Before          Projected         Actual         │
│   0.82    →→→     1.45     →→→     1.35          │
│    ○──────────────○──────────────────●            │
│                                                   │
│  Verdict: Partially effective (+0.53 Cpk)         │
│  Gap: -0.10 from projection                      │
└──────────────────────────────────────────────────┘
```

Data sources:

- **Before**: `FindingOutcome.cpkBefore` (already on type)
- **Projected**: Best `ImprovementIdea.projection.projectedCpk` among selected ideas
- **Actual**: `FindingOutcome.cpkAfter` (already on type)

Color-coded:

- Green if actual ≥ projected (or within 5%)
- Amber if actual improved but below projected
- Red if actual not improved from before

No type changes needed — all data already exists on `FindingOutcome` and `ImprovementIdea.projection`.

---

## Section ID Mapping

Old → New section IDs:

| Old ID              | New ID              | Report Types               |
| ------------------- | ------------------- | -------------------------- |
| `current-condition` | `current-condition` | All                        |
| `drivers`           | `drivers`           | All                        |
| `hypotheses`        | `evidence-trail`    | Investigation, Improvement |
| _(new)_             | `improvement-plan`  | Improvement                |
| `actions`           | `actions-taken`     | Improvement                |
| `verification`      | `verification`      | Improvement                |

---

## Workspace Metadata on Sections

Each `ReportSectionDescriptor` gains a `workspace` field:

```typescript
export type ReportWorkspace = 'analysis' | 'findings' | 'improvement';

export interface ReportSectionDescriptor {
  id: ReportSectionId;
  stepNumber: number;
  title: string;
  status: SectionStatus;
  workspace: ReportWorkspace; // NEW
  findings: Finding[];
  hypotheses: Hypothesis[];
  hasAIContent: boolean;
}
```

Workspace assignment:

- `current-condition`, `drivers` → `'analysis'`
- `evidence-trail` → `'findings'`
- `improvement-plan`, `actions-taken`, `verification` → `'improvement'`

---

## Report Type Detection

```typescript
export type ReportType = 'analysis-snapshot' | 'investigation-report' | 'improvement-story';

function deriveReportType(findings: Finding[]): ReportType {
  if (findings.length === 0) return 'analysis-snapshot';

  const hasActions = findings.some(f => f.actions && f.actions.length > 0);
  const hasOutcome = findings.some(f => f.outcome != null);

  if (hasActions && hasOutcome) return 'improvement-story';
  return 'investigation-report';
}
```

---

## Audience Mode API

```typescript
export type AudienceMode = 'technical' | 'summary';

export interface UseReportSectionsOptions {
  findings: Finding[];
  hypotheses: Hypothesis[];
  stagedComparison: boolean;
  aiEnabled: boolean;
  audienceMode?: AudienceMode; // NEW — defaults to 'technical'
}
```

The `audienceMode` flows into the `ReportSectionDescriptor` as a signal for rendering — sections are always generated (same count), but the app-level `renderSection` callback uses it to choose between full and condensed content.

---

## Tier Availability

| Feature                | PWA                | Azure Standard | Azure Team | Azure Team AI |
| ---------------------- | ------------------ | -------------- | ---------- | ------------- |
| Analysis Snapshot      | ✗ (no report view) | ✓              | ✓          | ✓             |
| Investigation Report   | ✗                  | ✓              | ✓          | ✓             |
| Improvement Story      | ✗                  | ✓              | ✓          | ✓             |
| Audience toggle        | ✗                  | ✓              | ✓          | ✓             |
| AI narrative in report | ✗                  | ✗              | ✗          | ✓             |
| SharePoint publish     | ✗                  | ✗              | ✓          | ✓             |
| Teams share            | ✗                  | ✗              | ✓          | ✓             |

---

## Mobile Considerations

- Sidebar TOC hidden on mobile (existing `hidden lg:flex`) — workspace groups only visible on desktop
- Mobile TOC dropdown in header gains workspace group separators (`<optgroup>` elements)
- Audience toggle renders as full-width segmented control on mobile (below header)
- Summary mode is recommended default on mobile for reduced scroll depth

---

## Print / PDF

- Print respects current audience mode
- Workspace group headers appear as colored section dividers in print
- Report type badge renders in print header
- All `data-export-hide` elements stripped (toggle buttons, chevrons, copy buttons)

---

## Markdown Export (SharePoint)

Updated markdown structure with workspace headings:

```markdown
# VariScout Improvement Story: Fill Weight Analysis

**Date:** 2026-03-20
**Analyst:** Eeva K.
**Report Type:** Improvement Story

## Key Metrics

- **Cpk:** 1.35
- **Samples:** 1,200

## Analysis

### Step 1: Current Condition

[KPI metrics]

### Step 2: Where Variation Hides

[Driver analysis]

## Findings

### Step 3: What We Found

[Synthesis + hypotheses + findings]

## Improvement

### Step 4: What We Planned

[Selected ideas with timeframe/cost/risk]

### Step 5: What We Did

[Actions with completion status]

### Step 6: Did It Work?

[Outcomes + Cpk learning loop]

---

_Generated by VariScout on 2026-03-20_
```

---

## Implementation Files

| File                                                                 | Change                                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/hooks/src/useReportSections.ts`                            | New types, workspace metadata, audience mode, 6 sections for improvement story |
| `packages/hooks/src/__tests__/useReportSections.test.ts`             | Updated tests for new types + section counts                                   |
| `packages/ui/src/components/ReportView/ReportViewBase.tsx`           | Workspace TOC groups, audience toggle, new badge labels/colors                 |
| `packages/ui/src/components/ReportView/ReportStepMarker.tsx`         | Workspace color ring                                                           |
| `packages/ui/src/components/ReportView/ReportSection.tsx`            | Workspace left-border accent                                                   |
| `packages/ui/src/components/ReportView/ReportHypothesisSummary.tsx`  | NEW — compact hypothesis tree                                                  |
| `packages/ui/src/components/ReportView/ReportImprovementSummary.tsx` | NEW — improvement plan summary                                                 |
| `packages/ui/src/components/ReportView/ReportCpkLearningLoop.tsx`    | NEW — before/projected/actual Cpk                                              |
| `apps/azure/src/components/views/ReportView.tsx`                     | Wire new sections, audience toggle state                                       |
| `apps/azure/src/services/reportExport.ts`                            | Updated markdown with workspace headings + improvement content                 |
| `packages/ui/src/index.ts`                                           | Export new components                                                          |
| `packages/hooks/src/index.ts`                                        | Export new types                                                               |

---

## Related Documents

- [IMPROVE Phase UX Design](2026-03-19-improve-phase-ux-design.md) — Three-workspace model origin
- [Improvement Prioritization Design](2026-03-20-improvement-prioritization-design.md) — Timeframe, cost, risk model
- [ADR-024](../../07-decisions/adr-024-scouting-report.md) — Original scouting report design (superseded)
- [ADR-031](../../07-decisions/adr-031-report-export.md) — Report export strategy
- [Two Voices](../../01-vision/two-voices/index.md) — Process voice vs. customer voice pedagogy

## Clarifications

### Cpk Learning Loop — Pending Verification

When `cpkAfter` is null (verification not yet complete), the Actual column renders "Pending verification" with a dashed border outline instead of a value. The verdict row is hidden until actual data arrives.

### Summary Mode — Primary Hypothesis

In Summary audience mode, the hypothesis section shows only the primary hypothesis (identified by `causeRole === 'primary'`). If no hypothesis has `causeRole === 'primary'`, falls back to the first hypothesis in the tree.

### Markdown Export — Always Technical

Markdown export always uses Technical mode regardless of the current audience toggle state. Archived documents need full statistical detail for future reference.

### sessionStorage Scoping

The audience mode preference is stored in `sessionStorage` (not `localStorage`), making it tab-local. Each browser tab can independently set Technical or Summary mode without affecting other tabs.
