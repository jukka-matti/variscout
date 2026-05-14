---
title: Projects tab + IP Detail (Lifecycle) page + Home active-IP launchpad
audience: [product, engineer, designer]
category: design-spec
status: draft
last-reviewed: 2026-05-14
related:
  - docs/superpowers/specs/2026-05-14-variscout-coherence-design.md
  - docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/01-vision/methodology.md
  - docs/01-vision/constitution.md
  - docs/03-features/workflows/analysis-journey-map.md
  - docs/07-decisions/adr-037-reporting-workspaces.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md
  - docs/superpowers/plans/2026-05-14-projects-tab-foundation.md
---

# Projects tab + IP Detail (Lifecycle) page + Home active-IP launchpad

## §1 What this spec covers

Resolves the "IP detail page details — Overview / Sections toggle + team workspace pattern need detailed visual design" item carried forward in the [VariScout Coherence design spec](./2026-05-14-variscout-coherence-design.md) §15.

Defines:

- A new top-level **Projects** tab — extending the Path A 6-tab nav to **7 tabs**.
- The **IP detail (Lifecycle) page** — anatomy, stage tabs, Overview/Sections toggle, team workspace right rail.
- **Home as the active-IP launchpad** — Project Lead picks an active IP at Home; the choice cascades scope to the rest of the product.
- The **IP-context cascade model** — when an IP is active, Process / Analyze / Investigation / Report tabs all scope to that IP's data.
- **Cross-tab wiring** between the new Projects tab and the legacy Improve tab (which stays unchanged).
- **Report tab integration** — IP-scoped Overview/Technical audience toggle, QC-Story-shaped narrative arc, free-roaming Hub portfolio mode.

This spec is the canonical home of the design that emerged from the 2026-05-14 brainstorming session ("brainstorming/82348-1778768071"). It supersedes none of the parent specs but **amends the Coherence spec** (§4 surface model + §15 carry-forward closure) — see §9 below.

**Out of V1 scope** (explicitly enumerated in §10): mobile-responsive variants, persona-specific Home content for Pat / Dr. Chen / Fred (only Mira detailed here), V2 collaboration features (threaded comments / @-mentions / signoff queue / RACI per-section / change notifications), Improve tab redesign (left as legacy), USER-JOURNEYS-\*.md refresh.

---

## §2 Foundational decisions (D1–D14)

### D1 — 7-tab top nav

Path A's 6-tab structure expands to 7:

```
[Home] [Process] [Analyze] [Investigation] [Improve] [Projects] [Report]
```

Coherence spec §4 nav-bar lock amended: add **Projects** between Improve and Report.

### D2 — Tab names: keep "Improve", new tab is "Projects"

- **"Improve"** — the legacy verb tab (PDCA workbench). Unchanged.
- **"Projects"** — the new noun tab (IP lifecycle + detail). Short, Linear-shape.

The `.vrs` "project file" colloquial naming collision is acknowledged and accepted; disambiguation handled in docs + support copy ("an Improvement Project" vs "a .vrs file"). The longer alternative "Improvement Projects" was considered (unambiguous) but rejected for length; "Initiatives" was considered (clean) but rejected for adding new vocabulary.

### D3 — Legacy Improve tab unchanged

The current `ImprovementView` + `useImprovementOrchestration` + `improvementProjections` selectors stay as-shipped. **Zero migration.** The Improve tab continues to render PDCA workbench tooling (per-Question idea brainstorming, What-If Simulator, idea → action conversion).

Earlier exploration considered retiring `ImprovementView` and folding PDCA tooling into the Projects tab's Approach stage. That was reversed — the two surfaces serve genuinely different jobs (casual ideation across IPs vs. tracked-project authoring), and the verb/noun split is honest when both are deliberately preserved.

**Bonus from the split:** Improve tab gains a secondary use case as a Hub-level "all-PDCA-work-across-IPs" view when no IP is active. Process Owner can survey ideation across the Hub.

### D4 — Home is the active-IP launchpad

For the **Project Lead persona**, Home renders an Active-IP primary card that:

- Names the currently-active Improvement Project
- Surfaces one-line status (stage, day counter, top action needed)
- Provides a "Switch IP ▾" affordance (dropdown listing all IPs on this Hub + "+ New IP")
- "Exit IP" link to return to free-roaming mode

Picking an active IP at Home enters **IP-context mode** (D5). The active-IP state is per-Hub, per-user, session-persistent (D11 implementation primitive).

For other personas, Home does NOT show the active-IP slot:

- **Process Owner (Pat):** primary card is cadence-shape (drift signals, signoff queue) — they work Hub-level, not IP-level.
- **SME (Dr. Chen):** primary card is consult-shape; accepting a consult auto-sets the active IP so jumping to Investigation lands scoped.
- **Frontline (Fred):** primary card is Today-shape (action cards); no active-IP concept.

### D5 — IP-context cascade

When an active IP is set (via Home, canvas drill-down, or any other entry), it enters **IP-context mode**:

- **IP-context indicator chip** (pattern #5 from Coherence §11) appears in the header utility row across all tabs. Indigo-tinted pill; reads `◆ Working in IP: [title] · Exit IP`.
- **Process tab** routes to the IP's `focusLevel`-appropriate Level + View (Outcome → L1; Flow → L2 + Flow View; Mechanism → L3 + focal step).
- **Analyze tab** pre-configures Focus per the focusLevel; filter chips apply (outcome, factor, timeline-since-IP-started).
- **Investigation tab** filters the Wall + Evidence Map to the IP's linked Hypotheses + Findings.
- **Projects tab** opens directly to the IP's detail page (skipping the list).
- **Report tab** renders this IP's report (D12) instead of free-roaming Hub portfolio.
- **Improve tab** scopes its PDCA workbench to this IP's hypotheses (when in-context). When free-roaming (no chip), Improve shows all Hub-level ideation work.
- **Home** keeps the active-IP slot live as the launchpad.

Switching IPs at Home re-scopes all tabs live; "Exit IP" clears scope and returns to free roaming.

Per-Hub state: switching Hubs (in paid Azure multi-Hub mode) clears active-IP automatically.

### D6 — IP detail (Lifecycle) page anatomy

The IP detail page lives at `Projects tab → click IP card`. Anatomy (top to bottom):

1. **Header utility row** (shared with all tabs) — identity / Hub picker / IP-context chip / `+ Add data` / `+ New analysis` / 🔔.
2. **Top-level tab row** — 7 tabs; Projects highlighted.
3. **Page header** — back-link ("← All Improvement Projects") · status pill (DRAFT / ACTIVE / SUSTAINING / HANDOFF / CLOSED) · IP title · one-line goal summary + day counter · team avatars (max 5 visible + count) + "+ Invite" affordance.
4. **Stage tabs + Overview/Sections toggle** — single row. Stage tabs (Charter / Approach / Sustainment / Handoff) on the left with visual state indicators (✓ done · current with indigo underline · ○ not started · ⏸ prerequisite-locked). Overview/Sections segmented toggle on the right (Pattern #2 from Coherence §11).
5. **Body** — two-column grid:
   - **Main content** (flexible width): stage-current banner + KPI strip + stage summary + "Continue in" scoped jump-outs (Overview mode) OR section forms (Sections mode).
   - **Right rail** (280px, always visible on desktop; collapsible on tablet; drawer on mobile): team workspace (D11).

### D7 — Stage tabs map to lifecycle phases

The 4 stage tabs sequence the IP's lifecycle:

| Stage tab       | Lifecycle phase            | What it represents                                                                            |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| **Charter**     | Framing                    | Issue captured, Goal set, Investigation lineage forming. Status DRAFT typically.              |
| **Approach**    | PDCA Plan + Do             | Per-SuspectedCause ideas + actions; the "doing the work" phase. Status ACTIVE.                |
| **Sustainment** | PDCA Check + Act (cadence) | Post-implementation monitoring. Cadence ticks confirm or detect drift. Status SUSTAINING.     |
| **Handoff**     | Operational transfer       | Control plan + training + cadence assignment + owner acknowledgment. Status HANDOFF → CLOSED. |

**Stage transition rules** (per RPS V1 D10 chain transitions):

- Charter → Approach: no gate (user-driven); when Goal is set + at least one Hypothesis is linked, Approach stage tab becomes prominently available.
- Approach → Sustainment: requires `hasIntervention(hub)` (closed IP with selected idea + at least one done action) per `responsePathReadiness.ts`.
- Sustainment → Handoff: requires `sustainmentConfirmed(record)` (4 consecutive on-target cadence ticks OR manual review verdict).
- All-active mode is also valid — multiple stages can be filled in parallel; the visual state indicator just shows where the current work is concentrated.

### D8 — Overview/Sections toggle is mode-shaped

Pattern #2 (segmented control) from Coherence §11 §11. Two modes of looking at the same IP:

- **Overview** (default): read-mode + status dashboard. Shows the stage-current banner, KPI strip, stage summary, jump-outs to scoped tabs. Process Owner's primary mode (cadence-review job). Stakeholder-shareable.
- **Sections**: author/edit mode. Renders the IP's 6-section form (today's `ImprovementProjectForm`, expanded so the sections relevant to the current stage tab are open by default; others collapse). Project Lead's primary mode (authoring job).

Within Overview, the content adapts to which Stage tab is active (each stage has its own KPI strip + summary + jump-outs — see §3).

Within Sections, the form is the same 6 sections, but the stage tab determines which sections are expanded vs collapsed by default.

### D9 — SuspectedCause-anchored Approach (per-cause hierarchy)

The Approach stage's structural unit is the **SuspectedCause** (confirmed Hypothesis), not a flat narrative. The data hierarchy:

```
ImprovementProject
└── Goal.factorControls[]              ← one entry per confirmed SuspectedCause
    ├── linkedHypothesisId             ← FK to Hypothesis ("nozzle temp drift")
    ├── targetCondition                ← "in control 95±2°C"
    └── ImprovementIdea[]              ← brainstormed against this cause
        ├── selected: boolean          ← PDCA Plan-Select winner
        ├── whatIfProjection           ← projected Cpk impact
        └── ActionItem[]               ← what to do (owner, deadline, status)
```

This matches Constitution P5 (multiple suspected causes are correct outcomes; ruled-outs preserved as negative learnings) and the analysis-journey-map Phase 4 PDCA structure.

**In Overview mode (Approach stage):** per-cause cards as the visual unit — each card shows cause name · selected idea · action progress · projected impact · status pill (✓ resolved / ⏳ in-progress / ○ pending).

**In Sections mode (Approach stage):** per-cause **read-mode** workbench layout — same hierarchy expanded inline (cause → ideas → actions), but with **"Open in Improve workbench" jump-out per cause** (D10). The actual brainstorming + What-If + idea-to-action conversion happens in the legacy Improve tab, scoped to this cause.

### D10 — Cross-tab wiring (Projects ↔ Improve)

The Projects tab does NOT duplicate the Improve tab's PDCA tooling. Instead:

- **Approach stage cards** show status (read-mode of per-cause hierarchy).
- Each card has an **"Open in Improve workbench"** button.
- Clicking jumps to the **Improve tab**, scoped to this IP and this Hypothesis. Brainstorming, What-If, and idea-to-action conversion happen there.
- When the user creates/selects ideas in Improve, the IP's `sections.approach.improvementIdeaIds[]` and `actionItemIds[]` update via FK; returning to the Projects tab shows the updated state.
- **Return navigation:** the Improve tab honors `useReturnNavigation` so a "Back to Project" link appears when scoped.

**From Improve tab → Projects:**

- When in IP-context (chip present), Improve scopes to that IP's hypotheses.
- When free-roaming (no chip), Improve shows all Hub-level work. From any cause, a "Promote to IP" affordance creates a new IP referencing this cause's Hypothesis (or opens an existing IP if one references it).

**From Canvas drill-down → Projects (response path 3):**
The "Improvement Project" CTA on `CanvasStepOverlay` continues to fire `usePanelsStore.showCharter()` (no rename needed — internal action name) which now routes to the Projects tab → IP detail page. The legacy `CharterPanel.tsx` becomes a transient route shim.

### D11 — Team workspace right rail (V1 + V2 scope)

The 280px right rail of the IP detail page hosts team collaboration affordances. **V1 scope (ships with this spec):**

- **Team roster** — list of `metadata.team[]` entries with RACI role chips (R / A / C / I). Add / remove via "+ Invite" in page header. Reads `ProcessParticipantRef` per RACI engagement-profile spec.
- **Recent activity feed (read-only)** — last 5 chronological events; "View all activity →" link expands to drawer/modal. V1 events: section edits, idea selection, action status changes, signoff requested. Synthesized from existing audit fields (`updatedAt` on actions, `signoff.requestedAt`, etc.). No new event-log entity in V1.
- **Signoff status card** — shows current `signoff.requestedAt` / `approvedAt` state. "Request approval" button (paid-tier). Pat sees "Approve" button when the request is targeted at the Process Owner.

**V2 scope (deferred; tier-gated when shipped):**

- **Threaded comments** per section (heavy SSE / pub-sub infra; RPS V1 §14)
- **@-mentions** routing notifications via 🔔 bell (per Coherence §3 cross-persona handoffs)
- **Signoff queue UI** (multi-tier signoff workflow with `Under Review` + `Approved` status states)
- **RACI per-section** (which sections need which roles' approval)
- **Change notifications** (email / push via `EngagementEvent` → external webhook)

V2 features render with a lock icon + upsell tooltip on free tier per Coherence §11 "Hidden vs disabled CTA" pattern (`feedback_hidden_vs_disabled_cta`).

### D12 — Report tab IP-scoped with Overview/Technical audience toggle

The Report tab respects IP-context (D5):

- **IP-scoped** (active IP set): renders this IP's report.
- **Free-roaming** (no active IP): renders Hub-level portfolio — list of all IPs, drift signals, cadence health. Process Owner's monthly review surface.

When IP-scoped, the Report uses an **Overview / Technical** segmented control (mirroring the IP detail page's Overview / Sections pattern visually, with different semantics):

- **Overview report** — stakeholder-shareable. Narrative-shaped. ~5 charts story-shaped (goal trajectory, before/after capability, per-cause mini-charts). Plain-English section headings. Audience: sponsors, executives, audit-light.
- **Technical report** — methodology-rigorous. 7–10 charts audit-shaped (capability histograms with full stats, I-Chart with intervention markers, factor R²adj Pareto, regression scatter, ANOVA boxplots, per-cause control charts). Methodology footnote (Turtiainen 2019 / Watson, NIST validation, ADR-069 numeric safety). Audience: quality team, regulators, MBB peer review.

Both layers export to **PDF** at print resolution and offer **Share link** (Azure paid; read-only public URL with optional auth).

### D13 — Report Overview honors the QC-Story narrative arc

The Report Overview renders a 7-section narrative arc with **plain-English section names**. Methodology lineage (QC-Story / Toyota TBP / DMAIC) is acknowledged in this design spec but never appears in UI copy (per RPS V1 D2 "drop methodology bridges in UI" + `feedback_drop_methodology_bridges`).

| Report section (UI copy)           | Synthesized from                                                                           | QC-Story heritage (internal)                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Executive summary**              | `metadata.title` + `status` + one-line goal achievement                                    | §1 Theme                                                |
| **Where we started**               | `sections.background.snapshotText` + capability-before chart                               | §2 Current Situation + §3 Problem Statement             |
| **What we aimed for**              | `goal.outcomeGoal` (Y) + `goal.factorControls[]` (X) + `goal.mechanismGoals[]` (x) + chart | §4 Goal                                                 |
| **What we found + what we did**    | Per-SuspectedCause cards (Hypothesis + Findings + selected Idea + Actions narrative)       | §5 Cause Analysis + §6 Countermeasures                  |
| **Did it work?**                   | Capability-after chart + per-cause verification + linked `SustainmentRecord` cadence ticks | §7 Effect Confirmation + "Did It Work? / Learning Loop" |
| **What we standardized + learned** | Linked `ControlHandoff` + new `reflection` field (D14) + ruled-out Hypotheses (negative)   | §8 Standardization & Reflection                         |
| **What's next**                    | In-progress causes + open Survey hints + linked future cadence                             | Closing / forward-look                                  |

Negative learnings (refuted Hypotheses and the reasoning that excluded them) appear in "What we standardized + learned" — audit-valuable, pedagogically powerful, honors Constitution P5.

### D14 — Data model addition: `ImprovementProject.reflection?: string`

Add an optional top-level field to the `ImprovementProject` interface:

```ts
export interface ImprovementProject extends EntityBase {
  // ... existing fields ...
  /** Optional analyst-authored lessons-learned narrative. Authored in Sections
   *  mode (Sustainment or Handoff stages typically); surfaces in the Report
   *  Overview "What we standardized + learned" section. */
  reflection?: string;
}
```

This is the only data-model change in this spec. Backward-compatible (optional). No format version bump for `.vrs`. Existing IPs without `reflection` render the section with the synthesized content only (ControlHandoff + ruled-outs); the analyst quote is omitted.

Implementation primitive: a new HubAction patch field `reflection?: string` on the `IMPROVEMENT_PROJECT_UPDATE` action (per the existing Action UPDATE patch pattern from `feedback_action_patch_omit_lifecycle`).

---

## §3 The 4 stages — content per stage

Each Stage tab's Overview content adapts to the lifecycle phase. The unifying primitives are: stage-current indigo banner · KPI strip (varies per stage) · per-cause status (Approach / Sustainment) or checklist (Charter / Handoff) · "Continue in" scoped jump-outs.

### §3.1 Charter stage

**Overview content:**

- **Stage-current banner**: "Framing in progress" with the most relevant Survey hint inline (e.g., "Goal not yet set — pick OutcomeSpec before brainstorming countermeasures").
- **KPI strip** (3 cards, checklist-shaped):
  - **Issue** — short summary from `sections.background.snapshotText` (or "—" if empty).
  - **Goal** — Y-target if set; ⏳ "Not yet set" with "Set goal →" CTA if missing.
  - **Investigation** — count of linked Hypotheses + Findings ("2 hypotheses · 4 findings"), clickable to scoped Investigation tab.
- **No per-cause cards** (Approach hasn't started).
- **"Continue in" jump-outs**: Investigation tab (scoped, with N hypotheses) · Analyze tab (scoped to outcome, capability Focus).

**Sections content:** the IP's 6 sections rendered as forms with Sections 1 (Metadata) + 2 (Background) + 3 (Goal) + 4 (Investigation lineage) **expanded by default**; Sections 5 (Approach) + 6 (Outcome reference) **collapsed** (placeholder copy: "Approach work happens after Goal is set — pick the lead Hypothesis first").

**Stage transition cue:** when Goal is set + ≥1 Hypothesis is linked, an inline "✓ Charter complete — ready for Approach?" banner appears with a "Move to Approach →" CTA.

### §3.2 Approach stage

**Overview content:**

- **Stage-current banner**: "Approach in progress · N of M causes addressed" with the most relevant per-cause status.
- **KPI strip** (3 cards):
  - **Goal · Y**: numeric trajectory ("0.86 → 1.33") with day counter.
  - **Survey**: the strongest current Survey verdict (e.g., "⚠ X-goal lacks recent evidence" or "✓ All X-goals showing evidence").
  - **Next milestone**: nearest deadline (`actionItem.dueDate` min, `goal.deadline`, or `sustainmentReview.next`).
- **Per-SuspectedCause cards** (D9 hierarchy) — the visual unit. Each card shows: cause name · status pill · selected idea · action progress (e.g., "A1 ✓ · A2 ⏳") · projected impact ("+0.48 Cpk projected").
- **"Continue in" jump-outs**: Investigation Wall (scoped, with this IP's hypotheses) · Analyze tab (scoped Focus) · Process tab (scoped Level + View) · per-cause "Open in Improve workbench" CTA (D10).

**Sections content:** per-cause read-mode workbench (D9). Each cause renders as a collapsible card showing the brainstormed ideas (selected one highlighted) + per-idea actions. The "Open in Improve workbench" jump-out per cause is the canonical authoring path.

**Ergonomics note (Coherence §11 lifecycle-aware sections pattern):** for mature IPs with many causes, collapse "ruled-out / not pursuing" causes below a "Show ruled out · N" link. Active + in-progress causes expanded by default.

### §3.3 Sustainment stage

**Overview content:**

- **Stage-current banner**: "Sustained · N of M ticks on target" (green) OR "Drift detected · last tick failed" (amber) — colors per `sustainment.status` enum.
- **KPI strip** (2 cards spanning the row + chart):
  - **Cpk over time** chart — line chart showing post-close cadence ticks. Target line at goal.
  - **Per-cause in-control evidence** — list of factor controls, each with current in-control status ("✓ in control · 95.1°C ± 1.4°C" or "⚠ drift detected").
- **Cadence tick history** — horizontal bar with per-tick status pills ("Wk 1 ✓ · Wk 2 ✓ · Wk 3 ✓ · Wk 4 ⚠ · Wk 5 …").
- **"Continue in" jump-outs**: Process tab (monitor drift L2 view) · Analyze tab (capability latest) · primary action "→ Start Handoff" CTA when `sustainmentConfirmed(record)` is true.

**Sections content:** linked `SustainmentRecord`'s fields rendered as form (cadence picker, override toggle, latest review entry). The Approach + Charter sections are collapsed but accessible.

**Auto-fire per ADR-080:** when consecutive on-target ticks reach the configured threshold (default 4), the IP auto-transitions Sustainment status to `confirmed-sustained` and the Handoff stage tab becomes prominently available.

### §3.4 Handoff stage

**Overview content:**

- **Stage-current banner**: "Handoff readiness · N of 4 items complete" with the outstanding item highlighted.
- **No KPI strip** — the checklist below IS the status.
- **Operationalization checklist** (4 items):
  - **Control plan documented** — links to SOP / control plan artifact; status ✓ when populated.
  - **Training materials delivered** — links to training acknowledgment records.
  - **Monitoring cadence assigned** — confirms Sustainment cadence + owner.
  - **Process Owner acknowledgment** — Pat's signoff on the control plan; ⏳ when pending. "Nudge Pat" affordance (V1 sends an `EngagementEvent` via webhook per RACI spec; V2 uses in-product notification).
- **"Continue in" jump-outs**: Report tab (final summary) · "Export PDF for audit" (rasterized Technical report).

**Sections content:** linked `ControlHandoff`'s fields rendered as form (control plan text, training materials FK, cadence assignment, owner FK, acknowledgment status).

**Stage close:** when all 4 checklist items are complete, the IP auto-transitions to `status: 'closed'`. User can still re-open by manually setting status back to `active` if drift returns.

---

## §4 Home — active-IP picker

### §4.1 Project Lead persona (Mira) — primary use case

Home renders an **Active Improvement Project primary card** with:

- IP title (large) · status pill · day counter
- One-line "most urgent" derived from the IP's current stage:
  - Charter: "Goal not yet set" or "Pat awaiting Charter signoff"
  - Approach: "Verification data due [date]" or "Pat awaiting your Approach signoff"
  - Sustainment: "Cadence tick due [date]" or "Drift detected on [factor]"
  - Handoff: "Control plan pending Pat's acknowledgment"
- Recent activity strip — last 3 events ("Pat approved Goal · 2h ago · Fred marked A2 in-progress · 1d · Dr. Chen added expert evidence · 3d")
- **"Switch IP ▾"** dropdown — lists all IPs on this Hub (most-recent-first), with status pill per entry. Bottom of dropdown: "+ New Improvement Project" CTA.
- **"Exit IP"** link inline — returns to free-roaming mode (clears active-IP state for this Hub).

Below the primary card: "Also waiting · N ▾" — collapsed list of other queued items (other IPs, questions awaiting response, consult invitations).

### §4.2 Other personas

- **Process Owner (Pat):** No active-IP slot. Primary card is cadence-shape (drift detected, signoff queued, capability check due). Pat works Hub-level; if they need to dip into a specific IP, they navigate via Projects tab list or via the cadence prompt's deep-link (which temporarily scopes the chip but Pat can clear it immediately).
- **SME (Dr. Chen):** No active-IP slot directly. Primary card is consult-shape ("Mira asks: ..."). Accepting a consult auto-sets the active IP to the IP the consult references; this makes Investigation tab scoped when Dr. Chen jumps there.
- **Frontline (Fred):** No active-IP slot. Primary card is Today-shape (action cards). Each action card carries a "see project" link (optional click) that temporarily scopes the chip; closing returns to Today.

### §4.3 Edge cases

- **0 IPs on the Hub.** Active-IP slot becomes "+ Start your first Improvement Project" — opens a draft. After creation, becomes the active IP.
- **1 IP.** Auto-active on session start (no explicit pick required). Switch dropdown still shows in case user wants to drop into free roaming.
- **Switching mid-session.** Picking a different IP changes scope live. Open tabs re-scope automatically. Any in-flight unsaved edits to the previous IP stay (autosave per existing pattern).
- **Session persistence.** Active IP persists across page refresh — implementation primitive (D11 below). On revisit days later, prompt "Continue working on [title]?" with option to clear.
- **Cross-Hub navigation.** Switching Hubs clears active-IP (each Hub has its own active-IP state).

### §4.4 Implementation primitive — active-IP state

Active-IP state is a new field per Hub, per user:

- **Storage:** `localStorage` keyed `variscout:activeIP:{hubId}:{userId}` — survives page refresh, doesn't sync across devices in V1.
- **Type:** `{ ipId: ImprovementProject['id']; setAt: number } | null`.
- **Read/write:** new Zustand store `useActiveIPStore` in `@variscout/stores` (Annotation layer per ADR-078 — UI state, not Document content).
- **Subscribers:** the IP-context indicator chip, the per-tab scope filters (Process / Analyze / Investigation / Report), the page-header chip in IP detail.

V2 may sync across devices via Azure Blob Storage if user demand materializes.

---

## §5 Cross-tab wiring + IP-context model

### §5.1 IP-context indicator chip

Pattern #5 from Coherence §11 (already locked). Slim indigo-tinted pill in the header utility row when an IP is active:

```
◆ Working in IP: Heads 5-8 Cpk shortfall · Exit IP
```

Spec: `padding: 4px 10px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.2); border-radius: 999px; color: #4f46e5;`. Persistent across all 7 tabs while in context. Clicking the IP title in the chip navigates to the IP detail page in the Projects tab; clicking "Exit IP" clears scope.

### §5.2 Per-tab scope behavior

| Tab               | Free-roaming mode                                | IP-scoped mode                                                                                     |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Home**          | Persona-adaptive primary card                    | Active-IP primary card live (Project Lead); chip in header                                         |
| **Process**       | L1 default; whole-Hub canvas                     | Routes to IP's focusLevel (L1 outcome / L2 + Flow View / L3 focal step); other steps dimmed        |
| **Analyze**       | Default 4-chart grid on Hub outcome              | Filter chips applied: outcome=Y, factor=X, timeline=since IP started; Focus pre-set per focusLevel |
| **Investigation** | All Hub hypotheses + findings                    | Filtered to this IP's linked Hypotheses + Findings; other entities hidden                          |
| **Improve**       | Hub-level all-PDCA work                          | Scoped to this IP's hypotheses; per-cause workbench reachable from Approach jump-out               |
| **Projects**      | List view (all IPs in this Hub)                  | Opens directly to this IP's detail page                                                            |
| **Report**        | Hub-level portfolio (Process Owner monthly view) | This IP's report (Overview / Technical layers per D12)                                             |

### §5.3 Entry points for setting active IP

- **Home** (primary) — active-IP card with Switch dropdown (Project Lead)
- **Projects tab list** — clicking an IP card opens detail + sets active
- **Canvas drill-down → "Improvement Project" response-path CTA** — creates/opens IP and sets active (per existing `usePanelsStore.showCharter()` wiring; routes to Projects tab)
- **Inbox digest prompts** — cadence prompts deep-link to specific IPs with active-IP set
- **Cross-surface badges** — `ContextLinkItem` clicks (from any surface referencing an IP) set active

### §5.4 Exit IP affordances

- IP-context chip "Exit IP" link (universal)
- Switching to a different IP at Home (replaces, not stacks)
- Switching Hubs (clears active-IP for the previous Hub)
- Explicit "Free roaming" CTA in the Switch dropdown (rare; for Process Owner-style cross-IP work without losing tab context)

---

## §6 Team workspace right rail

### §6.1 V1 scope (ships with this spec)

The 280px right rail of the IP detail page contains three V1 components:

**§6.1.1 Team roster**

- Reads `metadata.team[]` (typed: `Array<{ role: 'champion' | 'sponsor' | 'projectLead' | 'teamMember' | 'processOwner'; person: ProcessParticipantRef }>`).
- Renders as compact list: avatar + name + RACI chip.
- "+ Invite" affordance in page header opens a modal: name, email (optional), role picker, RACI assignment. Saves to `metadata.team`.
- Avatars: deterministic color from name hash (no uploads in V1).

**§6.1.2 Recent activity feed (read-only)**

- Last 5 chronological events synthesized from existing audit fields:
  - Section edits (`section.updatedAt` deltas)
  - Goal set / changed (`goal.outcomeGoal` changes)
  - Hypothesis linked (`metadata.investigationId` set; `sections.investigationLineage.hypothesisIds[]` changes)
  - Idea selected (`ImprovementIdea.selected` changes)
  - Action status changes (`ActionItem.status` changes)
  - Signoff requested / approved (`signoff.requestedAt` / `approvedAt`)
- Event copy: "[Person] [verb] [object] · [relative time]" (e.g., "Pat approved Goal · 2h ago").
- "View all activity →" link expands to drawer/modal with full chronological log (no pagination in V1; assumes <500 events per IP).

**§6.1.3 Signoff status card**

- Reads `signoff.requestedAt` / `approvedAt`.
- States:
  - **No signoff requested**: shows "Request approval" button (paid-tier; lock + tooltip on free).
  - **Pending**: shows "[Approver] awaiting · [Days] days ago" + "Nudge" button (free-tier free; paid-tier sends real `EngagementEvent` webhook).
  - **Approved**: shows "✓ Approved by [Approver] · [Date]".
- Pat (Process Owner persona on a hub where they are the `processHub.processOwner`) sees an **"Approve"** button when looking at a pending request — per Coherence §3 role-gating (`processHub.processOwner` field gates the CTA, not navigation).

### §6.2 V2 scope (deferred)

V2 features render with a lock icon + upsell tooltip on free tier; tier-gated active on Azure paid. **Not built in V1.** Listed here so the right-rail layout reserves space for them:

- **Threaded comments per section** — heavy SSE / pub-sub infra; RPS V1 §14 deferral
- **@-mentions** — routing notifications via 🔔 bell (per Coherence §3 cross-persona handoffs)
- **Signoff queue UI** — multi-tier workflow with `Under Review` + `Approved` status states between Draft and Active
- **RACI per-section** — which sections need which roles' approval
- **Change notifications** — email / push via `EngagementEvent` → external webhook

V2 may need a small data-model extension (event-log entity, comment threads, per-section signoff queue) — out of V1 scope.

### §6.3 Mobile / tablet behavior

- **Desktop (≥1024px)**: rail always visible.
- **Tablet (768–1023px)**: rail collapsible via a chevron; defaults to collapsed when first visiting; remembers per-user via `usePreferencesStore`.
- **Mobile (<768px)**: rail becomes a drawer accessed via a 👥 button in the page header. Tab order: page content first, drawer last.

Detailed mobile responsive design deferred to a follow-up spec (§10 out-of-V1 scope).

---

## §7 Report integration

### §7.1 Audience toggle

Overview / Technical segmented control (Pattern #2 from Coherence §11). Lives in the Report tab page header on the right; the left shows "Reporting on: [IP title]" or "Reporting on: Hub portfolio" (free-roaming mode).

### §7.2 Overview report — 7-section narrative arc (D13)

Each section uses plain-English UI copy as listed in D13. Sections render top-to-bottom in narrative order. **Charts**: ~5 story-shaped (goal trajectory + before/after capability + per-cause mini-charts in "What we found + what we did").

**Per-cause mini-chart auto-selection** (V1 registry):

| SuspectedCause shape (derived)              | Auto-selected mini-chart                                          |
| ------------------------------------------- | ----------------------------------------------------------------- |
| X-control (factorControls[].factor exists)  | I-Chart of the factor with target band (e.g., nozzle.temp 95±2°C) |
| Grouping (Hypothesis classifies subgroups)  | Boxplot by subgroup (e.g., viscosity by supplier × shift)         |
| Mechanism (linkedFindingIds with specifics) | Capability histogram with USL/LSL/target overlay                  |
| Default                                     | I-Chart with target band on the outcome                           |

Analyst can override chart selection per cause via a "Customize chart" affordance in Sections mode (V1.1; not blocking V1 ship).

### §7.3 Technical report — full analytical chart suite

7–10 charts audit-shaped:

- Capability histograms (before + after) with full stats table (n, mean, σ, Cp, Cpk, %Defect)
- I-Chart with intervention marker (when retune/action happened) on the outcome
- Factor R²adj Pareto (from two-pass best-subsets regression)
- Regression scatter (top factor vs outcome) with R²adj annotation
- ANOVA boxplot per cause
- Per-cause control charts (I-Chart of each X factor)

Methodology footnote: Turtiainen 2019 / Watson lineage, NIST-validated OLS QR solver (ADR-067), three-boundary numeric safety (ADR-069), customer-owned data (ADR-059, ADR-078).

Charts use existing VariScout chart components (`@variscout/charts`). Interactive in-app (click chart → opens in Analyze with IP-scope preserved); rasterized to PNG at 300dpi for PDF export.

### §7.4 Free-roaming Report — Hub portfolio

When no active IP, Report tab shows Hub-level portfolio:

- List of all IPs with status pills + day counters + last-activity timestamps
- Hub-level capability summary (rolling Cpk on primary outcome)
- Drift signals across all IPs
- Cadence health (% of IPs meeting their cadence schedule)
- Open Survey hints across IPs

Process Owner's monthly review surface. No QC-Story narrative arc here (that's IP-scoped).

### §7.5 Export + share

- **PDF export**: rasterizes the current Report (Overview or Technical) at print resolution. Filename: `[Hub]-[IP-title]-[Overview|Technical]-[YYYY-MM-DD].pdf`.
- **Share link** (Azure paid): generates a read-only public URL with optional auth (per ADR-059 customer-owned data — share link is signed against the tenant). Free tier: PDF export only.

---

## §8 Data model changes

Single change: add an optional `reflection: string` field to `ImprovementProject` (D14).

```ts
// packages/core/src/improvementProject/types.ts (additive)
export interface ImprovementProject extends EntityBase {
  hubId: ProcessHub['id'];
  status: ImprovementProjectStatus;
  metadata: ImprovementProjectMetadata;
  goal: ImprovementProjectGoal;
  sections: {
    /* unchanged */
  };
  updatedAt: number;
  signoff?: ImprovementProjectSignoff;
  /** Optional analyst-authored lessons-learned narrative. Surfaces in
   *  Report Overview "What we standardized + learned" section. */
  reflection?: string;
}
```

`HubAction` extension — extend the existing `IMPROVEMENT_PROJECT_UPDATE.patch` to allow `reflection`:

```ts
// packages/core/src/actions/improvementProjectActions.ts (additive)
| {
    kind: 'IMPROVEMENT_PROJECT_UPDATE';
    projectId: ImprovementProject['id'];
    patch: Partial<Omit<ImprovementProject, 'id' | 'createdAt' | 'hubId' | 'updatedAt' | 'deletedAt'>>;
    // ↑ existing shape already supports adding new optional fields without action-shape changes
  };
```

No new action kind needed (the existing UPDATE patch type covers it).

Persistence: backward-compatible — existing IP rows without `reflection` field render the Report's "What we standardized + learned" section with synthesized content only (ControlHandoff + ruled-outs). `.vrs` round-trip unchanged (optional field, default omitted on export when absent).

No `.vrs` format version bump.

---

## §9 Coherence spec amendments

The parent [VariScout Coherence design spec](./2026-05-14-variscout-coherence-design.md) needs the following amendments. These are applied at implementation time as part of the first PR.

### §9.1 Amend §4 — top-level nav: 6 → 7 tabs

Replace the locked nav line:

```
[Home] [Process] [Analyze] [Investigation] [Improvement] [Report]
```

with:

```
[Home] [Process] [Analyze] [Investigation] [Improve] [Projects] [Report]
```

Update the Tab table (§4 line 254): add a new row for **Projects** (one-sentence: "Improvement Projects lifecycle — list + detail page"; primary persona: Project Lead, Process Owner). Update **Improve** row (re-shape the description from "IPs lifecycle" to "PDCA workbench — per-question idea brainstorming + What-If + idea→action conversion"; primary persona: Project Lead).

### §9.2 Amend §4 — IP-context navigation, active-IP launchpad

Add language to §4 "IP-as-context" section:

> **Setting active IP is a deliberate user action**, not implicit. Project Lead picks an IP at Home; the choice cascades scope to Process / Analyze / Investigation / Improve / Report tabs. The IP-context chip in the header utility row makes the scope explicit and reversible (Exit IP link).

### §9.3 Resolve §15 carry-forward

Update §15 "Still pending in Session C (carried forward)":

> ~~**IP detail page details** — Overview / Sections toggle + team workspace pattern (Team roster + Activity feed) need detailed visual design.~~ **Resolved 2026-05-14** — see `docs/superpowers/specs/2026-05-14-projects-tab-design.md`.

### §9.4 Add to §16 Spec contributions matrix

New row:

| Upstream spec                                       | Status | What coherence inherits                                                                        | Key locked components                                                                                                                                            |
| --------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`2026-05-14-projects-tab-design.md`** (this spec) | draft  | 7-tab nav; Projects tab + IP detail page anatomy; Home active-IP launchpad; Report integration | Stage tabs Charter/Approach/Sustainment/Handoff; SuspectedCause-anchored Approach; QC-Story-arc Report Overview; `ImprovementProject.reflection?` field addition |

### §9.5 Update §11 Pattern catalog references

Pattern #5 (IP-context indicator) is now load-bearing — referenced explicitly in §5.1 of this spec. Pattern #2 (segmented control) used twice on IP detail page (Stage tabs row's Overview/Sections toggle) and once on Report (Overview/Technical toggle).

### §9.6 Coherence's persona table (§3) unchanged

The persona model (Process Owner / Project Lead / SME / Frontline) is unchanged. Persona × default landing table is unchanged. Per-persona Home variants (carried forward in §15) remain pending — this spec only details Mira (Project Lead).

---

## §10 Out of V1 scope

Explicitly not built in this spec's V1 — listed so they're known-future, not surprises:

- **Mobile-responsive variants** — Frontline mobile-first design. Right rail → drawer pattern noted, but full mobile design deferred (carried forward in Coherence §15).
- **Persona-specific Home variants** for Pat (Process Owner) / Dr. Chen (SME) / Fred (Frontline) — only Mira detailed. (Carried forward in Coherence §15.)
- **V2 collaboration features** — threaded comments per section, @-mentions, signoff queue UI, RACI per-section, change notifications via webhook. (Spec §6.2 lists them; tier-gated when shipped.)
- **Improve tab redesign** — kept as legacy. Any redesign is a separate future spec.
- **USER-JOURNEYS-\*.md refresh** — legacy journey docs need Path A 7-tab refresh (Coherence §15 carry-forward).
- **Cross-device active-IP sync** — V1 is localStorage per device.
- **Analyst-customizable Report chart selection** — V1 uses auto-selection registry; per-cause override deferred to V1.1.
- **Multi-Hub Report portfolio** — Hub-level only in V1 free-roaming Report. Cross-Hub portfolio out of scope (per Coherence §4 "no multi-hub portfolio dashboard").
- **In-product event-log entity** for activity feed — V1 synthesizes from existing audit fields; dedicated event log is V2.

---

## §11 Open questions for the implementation plan

Don't block design; want concrete answers in the plan.

1. **Stage tab visual state under `prerequisite-locked` mode.** Coherence spec patterns list ✓ done / current / ○ not started. What's the visual for Sustainment + Handoff when prereqs aren't met? `⏸` icon with tooltip explaining the gate?
2. **Active-IP store ownership.** Confirmed Annotation layer (per ADR-078). Storage: `localStorage` keyed `variscout:activeIP:{hubId}:{userId}`. Validate the key shape with the persistence team — does `userId` come from `useTenantStore` or `useAuthStore`?
3. **"Recent activity" event derivation.** V1 synthesizes from audit fields. What's the canonical computation rule for "what counts as an event"? Plan needs to enumerate the exact set + the diffing logic. Confirm `updatedAt` deltas across `metadata`, `goal`, `sections.*`, `signoff` are sufficient.
4. **Per-cause chart auto-selection registry.** §7.2 lists 4 cases. Where does the registry live in code? Suggested: `packages/core/src/improvementProject/reportCharts.ts` exporting a `pickChartForCause(cause: ImprovementProjectFactorControl, evidence: Hypothesis): ChartKind` pure function. Validate.
5. **PDF export rendering.** §7.5 specifies 300dpi rasterization. Library choice (Puppeteer-server-side in Azure paid; `html2canvas` client-side in PWA free for screenshot-shaped exports)? Tier behavior?
6. **Improve tab IP-scoping mechanics.** §5.2 says Improve scopes to "this IP's hypotheses" in IP-context. Implementation: does Improve read `useActiveIPStore` directly, or receive scope via prop from a parent route shell? Confirm the wiring pattern.
7. **First-time discovery for the active-IP picker at Home.** Onboarding hint copy? Per Coherence §11 dismissable first-time hints — what does "Tip: pick a project to scope your work" look like exactly?
8. **Empty-state copy for 0-IP Hub.** §4.3 says "+ Start your first Improvement Project". Tone (instructive vs minimal)? Connection to the canvas drill-down "Improvement Project" CTA (the more common entry)?

---

## §12 References

### VariScout context

- [VariScout Coherence design](./2026-05-14-variscout-coherence-design.md) — parent spec (amended)
- [Response Path System V1](./2026-05-09-response-path-system-v1-design.md) — IP entity definition (6 sections, multi-level Goal)
- [VariScout Vision](./2026-05-03-variscout-vision-design.md) — 5 response paths origin (§2.4)
- [`docs/01-vision/methodology.md`](../../01-vision/methodology.md) — FRAME → SCOUT → INVESTIGATE → IMPROVE spine; nested methodology hierarchy
- [`docs/01-vision/constitution.md`](../../01-vision/constitution.md) — P5 (multiple suspected causes); P7 (three evidence types)
- [`docs/03-features/workflows/analysis-journey-map.md`](../../03-features/workflows/analysis-journey-map.md) — Phase 4 IMPROVE (PDCA)

### ADRs

- [ADR-037 Reporting workspaces](../../07-decisions/adr-037-reporting-workspaces.md) — audience-toggle heritage
- [ADR-078 PWA + Azure architecture alignment](../../07-decisions/adr-078-pwa-azure-architecture-alignment.md) — same product, gated tiers
- [ADR-080 Sustainment auto-fire pattern](../../07-decisions/adr-080-sustainment-auto-fire-pattern.md) — auto-confirmation per consecutive on-target ticks
- [ADR-067 Unified GLM regression](../../07-decisions/adr-067-unified-glm-regression.md) — NIST-validated OLS solver (Technical report charts)
- [ADR-069 Three-boundary numeric safety](../../07-decisions/adr-069-three-boundary-numeric-safety.md) — Technical report methodology footnote
- [ADR-059 Web-first deployment architecture](../../07-decisions/adr-059-web-first-deployment-architecture.md) — customer-owned data (share link signing)

### Methodology heritage (internal-only; not UI copy)

- QC Story / Toyota TBP narrative — referenced via [2026-05-08 IP V1 spec (superseded)](./2026-05-08-improvement-project-v1-design.md); influence on Report Overview's 7-section arc.
- [2026-03-22 mode-aware reports (archived)](../../archive/specs/2026-03-22-mode-aware-reports-design.md) — "Did It Work? / Learning Loop" section heritage.

### Brainstorming artifacts

- Plan + transcript captured in `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/` session `82348-1778768071` (2026-05-14). Visual companion mockups in `.superpowers/brainstorm/82348-1778768071/content/`.

### Feedback memories honored

- `feedback_step_back_for_system_design` — pivoted from per-piece design to system-level when ImprovementView overlap surfaced
- `feedback_drop_methodology_bridges` — QC-Story heritage acknowledged internally; UI copy stays plain English
- `feedback_world_class_critique` — opinionated tab structure call (7-tab verb/noun split defended on its merits)
- `feedback_hidden_vs_disabled_cta` — V2 features render as visible-with-lock per pattern
- `feedback_no_backcompat_clean_architecture` — `reflection` field added cleanly (optional, no shims)
- `feedback_check_prior_plans_first` — searched for prior IP detail discussions before brainstorming
- `feedback_check_shipped_patterns_first` — confirmed RPS V1 supersession of 2026-05-08 spec before referencing
- `feedback_drop_methodology_bridges` — UI copy methodology-neutral; lineage in design spec only
