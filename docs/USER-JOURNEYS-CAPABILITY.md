---
title: Capability Mode — User Journey
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-05-16
related: [capability, journey, cpk, spc, subgroup]
---

# Capability Mode — User Journey

Under the [wedge pivot](superpowers/specs/2026-05-16-wedge-architecture-design.md) ([ADR-082](07-decisions/adr-082-wedge-architecture.md)), Capability mode serves the single V1 persona — the **Improvement Specialist** — working either solo (quick analysis, no project) or inside a Project. The methodology below is unchanged; persona variants have collapsed to one. See [USER-JOURNEYS.md](USER-JOURNEYS.md) for the canonical spine.

## What the Specialist wants

The Specialist runs Capability mode to answer three questions: Does my process fit within the customer's specification window? Is it centered on the target? Has capability been stable over time, or was it good last month and poor this month?

The measurable outcome is Cp and Cpk with confidence that the numbers are calculated correctly — using σ_within from the moving range method, consistent with Minitab and JMP — plus the ability to plot capability per subgroup to detect batch-to-batch or shift-to-shift instability.

Typical contexts: PPAP submissions, SPC monitoring against customer specs, before/after capability evidence for a customer complaint, or qualification of a process change.

## How the Specialist uses it

### Setting up specification limits

After uploading data and completing column mapping, the Specialist enters LSL, USL, and optionally a target. The characteristic type determines which limits apply: nominal (two-sided, Cp and Cpk both calculate), smaller-is-better (USL only, Cp = Cpk), or larger-is-better (LSL only, Cp = Cpk). Without at least one spec limit, capability indices are suppressed.

### Choosing the timeline window

Before reading capability, the Specialist chooses a [timeline window](03-features/analysis/timeline-window-investigations.md) in the dashboard chrome. The default is `rolling` matched to the working cadence (weekly → last 7 days; monthly → last 30 days). For PPAP submissions the Specialist typically switches to `fixed [start, end]` once the analysis period is locked. Findings record the active window so before/after capability comparisons stay explicit and drift between saved and current windows is flagged.

### Reading the standard capability view

The laptop-first dashboard keeps the I-Chart visible and places capability reading in the adaptive right-hand lens. When specs exist, the lens labels the histogram tab **Capability** and pairs it with **Probability**. The top strip summarizes Cp/Cpk context and provides the spec shortcut.

The industry rule of thumb is **Cpk ≥ 1.33** for a capable process (4σ buffer from the nearest limit). Automotive PPAP typically requires Cpk ≥ 1.67.

**Diagnosing a failed Cpk**: Compare Cp to Cpk.

- If **Cp ≥ 1.33 but Cpk < 1.33**: The process has enough inherent capability but is off-center. The spec window is wide enough; the mean needs to move closer to the midpoint. Action: adjust the process mean (centering contribution, not variation contribution).
- If **Cp < 1.33**: The process variation is too wide regardless of centering. Even perfect centering would not achieve Cpk ≥ 1.33. Action: reduce variation — tighter controls, better materials, equipment maintenance. Centering alone will not fix this.

### Subgroup capability — when single Pp/Ppk is insufficient

For PPAP or ongoing monitoring, the Specialist maps a subgroup column (e.g., Batch, Shift, or fixed groups of n=5) and toggles to Capability mode.

The I-Chart (Slot 1) switches to a **dual Cp/Cpk series**: Cpk (blue, primary) and Cp (purple, secondary), with a grey connecting line between each pair. A long gap between Cp and Cpk means the subgroup is capable but off-center. If the Cpk I-Chart is in control, Cpk ≈ Ppk — the summary number is representative. If Cpk is out of control, the overall Ppk is misleading (it averages unstable capability). An in-control Cpk I-Chart is stronger PPAP evidence than a single Ppk number.

The lower-left panel remains the subgroup / variation-source panel. In the laptop baseline, capability does not replace that slot; it stays available through the adaptive right-hand lens while the subgroup panel continues supporting drill-down.

### Decision point: centering vs variation

After reading Cp and Cpk, the Specialist decides what to fix. Two scenarios:

**Centering contribution**: Mean is 503g, spec is 495–505g, σ_within = 0.8g. Cp = 2.08 (excellent); Cpk = 0.83 (fails). The window is wide enough — the process is just shifted. Action: adjust the mean setpoint.

**Variation contribution**: Mean is 500g (centered), σ_within = 2.5g. Cp = 0.67, Cpk = 0.67. Both fail. The distribution is too wide regardless of centering. Action: investigate variation sources in the INVESTIGATE phase.

### Handing off to IMPROVE

When Cpk fails, the INVESTIGATE phase identifies which factors (Shift, Machine, Material Lot) contribute via η². The What-If Explorer projects: "If I reduce variation by 40% for the top factor, what does Cpk become?" This projection uses the scoped regression model.

Inside a Project, the same Capability evidence carries forward into the Improve stage (action tracker) and Sustainment ("did the fix hold?"). The Specialist as project Lead invites teammates as Members; a Sponsor sees the Cpk story in the Report. Outside a Project (quick analysis), the same chart suite still produces decisions — just without the lifecycle wrapper.

## What makes this mode distinctive

- **σ_within via moving range**: VariScout uses MR̄/d2 (d2 = 1.128 for individuals data) for Cp, Cpk, and control limits — the same method as Minitab and JMP. σ_overall is not used for capability. This produces conservative, defensible numbers.
- **Subgroup Cp/Cpk I-Chart**: Dual series on the same chart makes centering loss visible as a gap between Cp and Cpk over time. This is more diagnostic than a single Pp/Ppk summary.
- **Characteristic type awareness**: One-sided specs (USL-only, LSL-only) compute Cpk from the relevant side only; Cp is suppressed when only one limit exists.
- **PPAP context**: The subgroup-level stability plot directly addresses the supplier quality submission requirement — demonstrating consistent capability, not just an average value.
- **Capability grades**: Target-relative bands against the user-set Cpk target (default 1.33), not literature 1.67/1.33/1.00. Color-coded and shown in the Process Health Bar; the Cpk ≥ 1.33 default reflects the automotive industry standard but the target is user-configurable.

## Design reference

- **Wedge canon:** [wedge architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](07-decisions/adr-082-wedge-architecture.md)
- **Spec:** `docs/archive/specs/2026-03-21-capability-time-subgrouping.md`, `docs/archive/specs/2026-03-29-capability-mode-coherence-design.md`
- **ADR:** [`adr-038-subgroup-capability.md`](07-decisions/adr-038-subgroup-capability.md)
- **Code:** `packages/core/src/stats/` (calculateStats for Cp/Cpk, subgroupCapability.ts for per-subgroup series), `packages/hooks/src/useCapabilityIChartData.ts`, `packages/hooks/src/useCapabilityBoxplotData.ts`, `packages/ui/src/components/CapabilityMetricToggle/`, `packages/ui/src/components/SubgroupConfig/`

## Code ground truth

When this doc and code disagree, trust the code.

- `apps/azure/e2e/full-lifecycle.spec.ts` — end-to-end Project lifecycle including spec entry, Cpk read, and Findings creation
- `packages/data/src/samples/journey.ts` — seeded journey dataset suitable for Capability mode walkthroughs
- `apps/azure/src/lib/journeyPhaseConfig.ts` — phase configuration that wraps Capability investigations inside a Project
