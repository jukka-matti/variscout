---
tier: living
purpose: design
title: VariScout Coherence — Persona + Surface + Vocabulary Design
audience: human
category: design-spec
status: draft
last-reviewed: 2026-05-14
related:
  - docs/superpowers/specs/2026-05-03-variscout-vision-design.md
  - docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md
  - docs/superpowers/specs/2026-05-09-response-path-system-v1-design.md
  - docs/superpowers/specs/2026-05-13-canvas-viewport-architecture-design.md
  - docs/superpowers/specs/2026-04-25-process-hub-design.md
  - docs/superpowers/specs/2026-04-25-process-hub-use-cases.md
  - docs/superpowers/specs/2026-04-25-engagement-profile-raci-design.md
  - docs/superpowers/specs/2026-04-29-multi-level-scout-design.md
  - docs/archive/specs/2026-05-03-framing-layer-design.md
  - docs/01-vision/constitution.md
  - docs/01-vision/methodology.md
  - docs/glossary.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
  - docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md
  - docs/07-decisions/adr-077-row-provenance-tagging.md
  - docs/07-decisions/adr-081-canvas-viewport-architecture.md
---

# VariScout Coherence — Persona + Surface + Vocabulary Design

> **⚠️ PARTIALLY SUPERSEDED 2026-05-16 by [ADR-082](../../07-decisions/adr-082-wedge-architecture.md) + the [wedge architecture spec](./2026-05-16-wedge-architecture-design.md).**
>
> The wedge pivot retires Session A's 4-persona model for V1 (migrates to VariScout Process, a future product), amends Session B's nav structure (6 tabs in workflow order, not 7), and refocuses Session C's pedagogy on a single-persona narrative. The Coherence spec sections still in force are: Session B vocabulary (verb/noun separation where it survives), Session C visual identity + a11y. Sessions A nav layout assignments, persona-adaptive Home shell, persona-routing assumptions are **NOT in force** for V1.
>
> Treat this spec as historical context for the brainstorming that _led to_ the wedge pivot, not as the canonical V1 design. The wedge spec is canonical.
>
> See [wedge spec §9.3](./2026-05-16-wedge-architecture-design.md#§93-coherence-audit-2026-05-14--partial-supersession-coherence-v2) for the full supersession matrix.

---

> **Status (pre-wedge):** Sessions A (Persona model) + B (Surface + Vocabulary) + partial C (radical simplification, IP-as-context, persona-name finalization, "+ New analysis" simplification, upstream spec reconciliation) locked. Session C still pending: pedagogy + first 60 seconds + visual identity + Inbox visual hierarchy + accessibility. This spec was partial-but-load-bearing — downstream implementation plans drove from the locks below. See §16 for upstream spec reconciliation (Framing Layer, Process Hub, RACI, Multi-level SCOUT, Operating Model, Process Hub Use Cases).

---

## §1 Context

**Positioning anchor (foundation-locked per `docs/01-vision/methodology.md`):** VariScout is **Exploratory Data Analysis (EDA) for process improvement** — not statistical verification. The distinction matters: _"Is this significant at p<0.05?"_ vs _"Where should I focus?"_. VariScout finds **where to focus**; users apply Lean thinking + further analysis to find why and what to do. Different category from Minitab / JMP / SPC verification tools.

**Methodology lineage:** Shewhart (1924) → Tukey (1977) → Juran (1950s) → Watson (2015, 2019a) → **Turtiainen (2019)** → VariScout. The Turtiainen 2019 Master's thesis ("Mental Model for Exploratory Data Analysis Applications for Structured Problem-Solving," LUT University) is the synthesis; VariScout is its productization. Watson's three Qs (Problem Statement framework) and Watson's locality rule (ADR-073) are components within the synthesis, not the foundation itself.

**Product adoption progression** — Day 1 (analyze a dataset) → Week 2 (investigate something interesting) → Month 3 (set up a Process Hub for ongoing monitoring) → Quarter 2 (run a formal Improvement Project with sustainment + handoff). Tier matches maturity: PWA Free + Azure Standard serve Day 1 → Week 2; Azure Team serves Month 3 → Quarter 2. The structure deepens as use matures; no explicit opt-in moments.

**User reflection (2026-05-14, founder):** _"we have nice pieces, but they are not holistically yet here."_

The team has shipped Canvas migration, Data-Flow F-series, Response Path System V1, and Canvas Viewport 8f — each individually reviewed, polished, merged. Yet the product feels assembled, not authored. A 5-agent audit (vision intent / shipped reality / open tensions / persona reality / doc inventory + archaeology) confirmed: **the foundation is locked and coherent; the UI propagation + persona layer lag behind it.**

### Five coherence fault lines

1. **Terminology drift in UI** — `Frame` tab vs `Canvas` (vision spec); SuspectedCause → Hypothesis rename incomplete in UI; Hub/Investigation/Process overlap; Mode vs Lens fuzzy; L2 overlay chips read as five near-synonyms.
2. **ADR-074 boundary violations shipped** — `AuthorL3View` parallel-implements Frame; Wall overlay is badge-projection, not the "same data, two views" dual-home vision §5.6 promised.
3. **Journey discoverability gaps** — 3 question entry points scope-carriage incomplete; L1 capability shows `--` with no guidance; L3 has 20 flat-leveled CTAs; B2 chrome-walk queued since 2026-04-29.
4. **Methodology narrative absent from UI** — foundation is locked + opinionated (`feedback_drop_methodology_bridges`); UI copy doesn't propagate it.
5. **Persona × surface × tier matrix unmapped** — biggest gap surfaced by archaeology. `processHub.processOwner` stored but never queried; same paste interface for analyst-with-CSV and process-owner-with-team.

### What's NOT being changed

This spec is propagation + persona-layer addition. It does **not** rewrite:

- The vision spec (2026-05-03; accepted)
- The methodology (Constitution + methodology.md; locked)
- Canonical vocabulary (glossary.md is authoritative)
- ADR-073 / ADR-074 / ADR-081 (the structural rules)
- RPS V1, Canvas viewport 8f, F-series (delivered)

The work is making the UI, surface treatment, and persona model **match** the locked foundation.

---

## §2 Findings from the 5-agent audit

Summarized from the audit transcripts (captured in `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/project_coherence_audit_2026-05-14.md`).

### Vision intent (Audit 1)

Internally coherent. 6 spec-level tensions, all resolved by design choice. Canonical product: **FRAME → SCOUT → INVESTIGATE → IMPROVE inside a persistent Process Hub.**

### Shipped reality (Audit 2)

All 5 RPS paths live (Quick Action / Wall Detective / IP / Sustainment / Handoff). All top-level surfaces wired. No orphan code. The "mystery black pill" in the user-screenshot is the active-state styling on `CanvasLensPicker` — correct affordance but renders unreadably.

### Open tensions (Audit 3)

6 categories of coherence fault lines (collapsed to 5 above).

### Persona reality (Audit 4)

**10 personas defined in product docs, not 1.** Process Owner field exists in `processHub.ts` but is never queried by the UI. No persona-aware onboarding. Same paste interface for Analyst Alex (data-first) and OpEx Olivia (process-owner). Sponsor is a stored role but not a journey. MBB-fluent foundation copy coexists with generalist-friendly entry surface — the _hidden_ audience is MBB; the _visible_ entry point is generalist.

### Documentation inventory (Audit 5)

- **56 active specs** in `docs/superpowers/specs/`
- **46 archived specs** (pre-Process-Hub era)
- **74 ADRs**
- **10 persona files** (`docs/02-journeys/personas/`)
- **6 user-journey docs** (`docs/USER-JOURNEYS*.md`) — 5 mode-specific docs last-reviewed 2026-04-17, predate vision spec acceptance
- **8 industry use-case flows** + **14 scenario flows**
- **Four-Lenses + Two-Voices sub-vision clusters**

**Drift signals confirmed:**

1. `USER-JOURNEYS.md` last-reviewed 2026-04-24 (predates Process Hub canonical moment)
2. 5 mode journey docs last-reviewed 2026-04-17 (predate vision spec)
3. Persona files predate Hub specs entirely (no `last-reviewed`)
4. Retired terminology surfaces in older docs
5. Canvas + data-flow specs (May 5-14) are anchors, not entrants

---

## §3 Persona model (Sessions A + C locked)

> **⚠️ SUPERSEDED 2026-05-16 for V1** — Session A's 4-persona model retires for VariScout V1 per [wedge spec §3.5](2026-05-16-wedge-architecture-design.md#35-persona-collapse). V1 ships with a single Specialist persona; the 4-persona design moves to VariScout Process (named-future). The substance of §3 (personas, RACI orthogonality, evidence affinities, persona-aware onboarding, cross-persona handoffs) is preserved as design heritage for the Process product capture at [`docs/01-vision/variscout-process/four-personas.md`](../../01-vision/variscout-process/four-personas.md). **For V1 access model, see [membership-philosophy.md](../../08-products/membership-philosophy.md) (Lead / Member / Sponsor ACL).**

### Four product-user personas

| #   | Persona           | Primary verb         | Default landing                       | Tier story                                              | Evidence type (Constitution P7) |
| --- | ----------------- | -------------------- | ------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| 1   | **Process Owner** | Monitor + decide     | Process tab (their assigned process)  | Azure Team primarily; Pro for small-business single-hub | (consumes evidence)             |
| 2   | **Project Lead**  | Analyze + improve    | My Work (project-shaped default view) | All tiers — this is the most common persona             | **Data**                        |
| 3   | **SME**           | Provide expert input | My Work (consult-shaped default view) | Azure Team primarily                                    | **Expert**                      |
| 4   | **Frontline**     | Capture + execute    | Today                                 | Azure Team primarily (needs team infra)                 | **Gemba**                       |

Four personas, **not 10.** The original 10 conflated three orthogonal axes:

- **Persona** (who you are in the product) — these 4
- **Entry archetype** (how you arrived: b0 data-first / b1/b2 process-authored) — orthogonal
- **Task type** (quick analysis vs chartered project) — orthogonal

The remaining 6 of the original 10 are out of scope for product UX design (buyers, evaluators, admins, education funnels — they live in marketing / sales / education docs).

**Why 4 not 3:** Three of the four personas map cleanly to Constitution P7's three evidence types (Data / Gemba / Expert). The SME persona ensures Expert evidence has a clear UX owner — without it, expert-evidence creation is "whoever happens to be in the RACI C role," which is structurally vague. SMEs are internal tenant users whose primary product use is providing expert input on artifacts they're invited to consult on.

**Project Lead and SME share the My Work surface** with different default views driven by their `personaRole`:

- Project Lead default view: active investigations + IPs they lead
- SME default view: consult invitations + watching (artifacts they've contributed to)

Same surface, persona-aware default. Tenant admin assigns one of 4 `personaRole` values; UI uses it for default landing + default-view-within-surface + copy density.

### Two-layer model

**Layer 1** = the 3 product-user personas. They log into VariScout, have tenant accounts, navigate surfaces.

**Layer 2** = team references on artifacts. Names on `assignee` / `responsibleRole` / `sponsor` / `verifiedBy` fields. May be:

- A Layer 1 user (e.g., assigning a Quick Action to another team member)
- A non-user (named operator on the shop floor, external sponsor, retired domain SME, etc.)

**All Layer 1 users must be internal to the customer's Azure tenant.** No external/guest/B2B accounts in V1. External experts engage via email digests / screenshare / one internal user driving — not via product accounts.

### RACI roles are orthogonal to personas

The RACI engagement-profile spec (`2026-04-25-engagement-profile-raci-design.md`, draft) defines 4 roles:

- **R (Responsible)** — does the work
- **A (Accountable)** — owns the outcome
- **C (Consulted)** — SMEs providing input
- **I (Informed)** — read-only stakeholders

The 4 personas each play **multiple RACI roles** depending on the artifact. Critically:

- **SME persona predominantly plays the C role.** They're invited to consult on specific investigations / IPs, provide expert input + expert evidence, and may occasionally play R when they execute their own recommendation. Their persona designates _what they primarily do in the product_; the RACI role designates _what they're doing on this specific artifact_.
- **Project Lead in C role ≠ SME persona.** A Project Lead consulting on someone else's investigation is in the C role for that artifact but their persona is still Project Lead. The distinction: a Project Lead's primary work is leading investigations; an SME's primary work is consulting. Same product affordances; different defaults + workflows.
- **Sponsor is Layer 2, not a persona.** A slot on the IP / Charter with optional signoff workflow; the sponsor doesn't need a persona arc — they're a named non-user (Layer 2) on artifacts.

### Persona × tier mapping

Per `docs/08-products/tier-philosophy.md` — **per-tenant flat-fee licensing** (PWA Free / Azure Standard €79/mo / Azure Team €199/mo unlimited users). Adding a user to your tenant has zero marginal cost; no per-seat fee.

| Tier               | Who fits                                                                                    | Persona routing                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **PWA Free**       | Project Lead in b0 mode (data-first CSV analysis); education funnel personas (out of scope) | No persona routing; single-user mode                                                    |
| **Azure Standard** | Project Lead doing serious work alone; small-business Process Owner with one hub            | No persona routing; single-user plays all roles                                         |
| **Azure Team**     | All 4 personas active in team context                                                       | **Persona-aware routing via admin-assigned `personaRole` field on team-member records** |

**Persona awareness applies only in Team tier.** PWA + Standard skip persona infrastructure entirely (one user, all roles played by them).

### Default landing per persona (Team tier)

| Persona       | Default landing surface     | Default view (if surface has multiple views)                           |
| ------------- | --------------------------- | ---------------------------------------------------------------------- |
| Process Owner | Their process's Process tab | L1 outcome view with decisions queue surfaced                          |
| Project Lead  | My Work                     | Project-shaped: active investigations + IPs they lead                  |
| SME           | My Work                     | Consult-shaped: pending consult invitations at top, watching in middle |
| Frontline     | Today                       | Task-shaped: today's assigned actions + signals to ack                 |

**Process Owner is process-anchored.** Project Lead + SME share the **My Work** surface with different default views. Frontline has a distinct **Today** surface for task-shaped work. Cross-persona consistency: same top nav for all 4 personas — `[Home] [Process] [Investigation] [Improvement] [Report]`. Tenant admin's `personaRole` assignment drives the default landing.

### Team workspaces inside artifacts

Personal queues (My Work / Today / Process tab) show _your slice_ of the work. Team coordination happens **inside the artifacts** — IPs and investigations are team workspaces with:

- **Team roster** (RACI roles per artifact: who's R/A/C/I on this IP)
- **Activity feed** (chronological — who did what, when)
- **Threaded comments** (discussion across team members)
- **@-mentions** routing attention to specific people via notifications bell
- **Signoff queue** (when a section needs an A-role to approve)

Cross-persona handoffs become visible in the IP's activity feed ("Pat approved Section 6 outcome — Dr. Chen added expert evidence — Fred marked action done"). No separate "team coordination" surface needed; the artifact IS the team workspace. GitHub / Linear / Asana pattern.

### Persona-aware onboarding (Option A)

Tenant admin assigns each team member a `personaRole` field on their team-member record (one of 4: `process-owner` / `project-lead` / `sme` / `frontline`). Product reads it for default landing + default-view-within-surface + copy density. Layer 2 references (action assignees with no account) get name + optional role label, no account required.

No "what are you here for?" modal at first session. The admin's setup answered it.

### Cross-persona handoffs

Defer to RACI engagement-profile spec (`ProcessParticipantRef` + `EngagementEvent` model). This coherence spec names the personas and points at RACI for the handoff mechanics. EngagementEvent → external webhook (Teams, Power Automate, Slack) handles notifications.

### Role-gating with `processHub.processOwner`

Gate the _action that would mislead the wrong persona_ — not navigation. Examples:

- "Approve IP signoff" CTA only visible to Process Owner
- "Acknowledge handoff" only to designated owner

**Don't gate navigation:** any tenant user can read any surface they have permission to view. The gating is about misleading CTAs, not access control (that's a separate Azure permissions concern).

### Evidence type ↔ persona affinity

Constitution P7 names three evidence types. Each has a primary persona affinity:

- **Data evidence** ↔ Project Lead (analysis)
- **Gemba evidence** ↔ Frontline (capture)
- **Expert evidence** ↔ anyone in RACI C role (mostly Project Lead consulting)

Composite step cards adapt to data availability — show whichever evidence exists, hide what doesn't.

### Terminology disambiguation (Persona vs RACI vs artifact reference)

Three distinct concepts that share role-shaped names. Confusion is real; the table locks them apart:

| Concept                          | Scope                                                                  | Examples                                                | Stored as                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Persona** (Layer 1)            | Tenant account holder with a primary product role                      | Process Owner / Project Lead / SME / Frontline          | `teamMember.personaRole`                                                                     |
| **RACI role**                    | Responsibility slot on a specific artifact (investigation, IP, action) | Responsible / Accountable / Consulted / Informed        | RACI fields on the artifact                                                                  |
| **Artifact reference** (Layer 2) | Named person on an artifact who may or may not have a tenant account   | Sponsor, external SME, named operator, retired employee | `assignee` / `responsibleRole` / `sponsor` / `verifiedBy` (per RACI engagement-profile spec) |

**Specific disambiguations that have caused confusion:**

- **"Process Owner" the persona** (Layer 1 tenant user with `personaRole='process-owner'`) ≠ **`processHub.processOwner` field** (which is a single tenant user reference per Hub — a Process Owner persona happens to occupy this slot for their assigned Hub) ≠ **"Process Owner (Operations)" in RACI spec** (a Layer 2 named operator who may not be a product user). All three are valid concepts; coherence spec uses **"Process Owner persona"** specifically for the Layer 1 sense.
- **`ProcessMapNode.responsibleRole`** (per Framing Layer + RACI spec) is a per-node label (e.g., "Maintenance lead") that scopes step ownership in the canvas. **It is NOT a tenant user assignment.** It surfaces in the canvas as a label on the step; it doesn't gate access.
- **SME persona** (Layer 1 tenant user with `personaRole='sme'`) ≠ **anyone in the C RACI role** on a specific artifact. A Project Lead consulting on someone else's investigation is in the C role for that artifact but their persona is still Project Lead. The SME persona is for users whose _primary product use_ is consulting.

This terminology lock is the single most consequential alignment with upstream specs (RACI engagement-profile spec; Process Hub design).

---

## §4 Surface model (Sessions B + C locked, Path A revision 2026-05-14)

### Top-level navigation (Path A — 7 tabs, one job each)

```
[Home] [Process] [Analyze] [Investigation] [Improve] [Projects] [Report]
```

Seven top-level tabs. Each passes the Linear test (describable in one sentence). The dual-purpose "Process tab with Map/Analyze toggle inside" pattern is retired in favor of honest separation.

> **Amendment 2026-05-14:** Originally locked as 6 tabs (with one "Improvement" tab subsuming both PDCA workbench and IP lifecycle). Split into 7 tabs per [`2026-05-14-projects-tab-design.md`](./2026-05-14-projects-tab-design.md): the legacy verb tab (Improve = PDCA workbench, current `ImprovementView` unchanged) and the noun tab (Projects = IP lifecycle + detail page). Deliberate verb/noun split — both surfaces serve genuinely different jobs.

| Tab               | One sentence                                                                     | Primary persona             |
| ----------------- | -------------------------------------------------------------------------------- | --------------------------- |
| **Home**          | Your personal queue + active-IP launchpad (Project Lead picks scope here)        | All (persona-adaptive)      |
| **Process**       | A process's current state and structure — anything drifting? anything to decide? | Process Owner               |
| **Analyze**       | The EDA workspace — explore data, find what's varying                            | Project Lead                |
| **Investigation** | Hypotheses + Factors — case-building post-EDA                                    | Project Lead, SME           |
| **Improve**       | PDCA workbench — idea brainstorming + What-If + idea→action conversion           | Project Lead                |
| **Projects**      | Improvement Projects lifecycle — list + detail page (Charter→Handoff)            | Project Lead, Process Owner |
| **Report**        | Exports + summaries for sharing outside VariScout                                | All                         |

**Home** = personal queue, **persona-adaptive**. Linear-style: ONE primary item full-bleed; everything else collapsed under "Also waiting · N":

- Process Owner: most urgent decision (drift, IP signoff); others collapsed
- Project Lead: most stalled investigation or most urgent IP item; others collapsed
- SME: most urgent consult invitation; others collapsed
- Frontline: today's first action; others collapsed

**Process** = this process's state + structure. Two modes via a State / Edit toggle (see §4 Process tab below).

**Analyze** = EDA workspace. Filter chips at top (replacing breadcrumb); 4-chart grid; Factor Intelligence first-class; chart interactions for drill + brush.

**Investigation** = case-building. **2 view projections + 1 cross-cutting filter** (not 3 peer views): Hypotheses view (= shipped Wall code) + Factors view (= shipped Evidence Map code); Questions as a cross-cutting filter/progress tracker.

**Improve** = PDCA workbench (legacy `ImprovementView`, unchanged). Per-Hypothesis idea brainstorming + What-If Simulator + idea→action conversion. Can be used standalone (Hub-level, cross-IP) or scoped to active IP.

**Projects** = Improvement Projects lifecycle. Single home for IP cards + IP detail (Lifecycle page with Charter / Approach / Sustainment / Handoff stage tabs + Overview/Sections toggle). Other surfaces reference IPs via badge-links; never duplicate IP cards.

**Report** = exports / summaries.

**Notifications bell** in the header (slide-out drawer, Fluent 2 pattern) for passive feed — mentions, comments, lower-priority signals.

### Header utility row + entry actions

```
VariScout · Mira (Project Lead) · [Filling Line 3 ▾]    [+ Add data]  [+ New analysis]  🔔 3  ◎
```

| Element                | What it is                                                                                                      | When visible                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Identity + persona** | User name with persona label                                                                                    | Always                                          |
| **Process picker**     | Dropdown listing accessible processes                                                                           | Always (collapses to single label if 1 process) |
| **`+ Add data`**       | Append data to active process; opens paste flow scoped to current Hub; triggers match-summary + drift detection | Only when a process is selected                 |
| **`+ New analysis`**   | Create a fresh investigation from pasted data; b0 entry to Analyze tab                                          | Always                                          |
| **Notifications bell** | Slide-out drawer with passive feed (mentions / comments / lower-priority signals)                               | Always                                          |
| **Settings cog**       | App settings, account, signout                                                                                  | Always                                          |

`+ Add data` vs `+ New analysis` are two distinct entry actions — process-scoped append vs fresh analysis. They serve different user intents and shouldn't be merged.

### Process tab — state + structure of this process

Process tab does ONE job: _"this process — its current state and structure."_ That includes viewing the state AND editing the structure (framing). Implemented as **two modes within one tab**, not two tabs:

| Mode                       | What's editable                                                                                                            | Default for                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **State mode** _(default)_ | Read-only: outcome panel, process map with state badges, decisions queue, reference links to IPs/actions/investigations    | Process Owner                        |
| **Edit mode**              | Editable: add/rearrange steps, assign columns to steps, set CTQ specs per step, set outcome specs, multi-source join setup | Project Lead (when framing/refining) |

Mode toggle via "Edit map" affordance in Process tab header. Visual chrome changes in Edit mode (editing toolbar appears, ChipRail of unassigned columns visible, hover states active, "Done" exits to State mode).

**State mode sections (4 max, primary attention first):**

1. **Needs your decision** (primary attention; indigo-accent cards) — IP signoffs awaiting, drift escalations, sustainment cadence prompts. THE primary section for Process Owner.
2. **Current state** — outcome panel: Cpk / on-time / drift trend; refined typography; tabular numerals
3. **Process map** — compact step badges color-coded by state; click step → drill to L3
4. **In flight on this process** (reference badges, not full cards) — "3 active IPs → Improvement" / "5 open actions → list" / "2 investigations → Investigation" links

**No duplication of IP cards.** Reference badges link to the canonical home (Improvement tab) rather than re-rendering full IP card data.

**Canvas (design-doc term)** = the Process tab's architectural pattern: pan/zoom across L1/L2/L3 (8f Canvas Viewport Architecture); embedded sub-surfaces at each level (outcome panel at L1, process map at L2, focal step detail at L3); State + Edit mode toggle. "Canvas" stays in design docs + code (`CanvasWorkspace`); UI label is "Process tab."

### Analyze tab — EDA workspace

Analyze tab does ONE job: _"the EDA workspace — explore data, find what's varying."_ No state monitoring here; that's Process tab.

**Anatomy:**

```
[Filter chips at top]                                                    n=247 of 753
[× Shift=Night]  [× Material batch=B]  [+ Add filter]

[4-chart grid]                              Focus: Capability ▾
[I-Chart]  [Boxplot]
[Pareto]   [Stats]

[Factor Intelligence · ranked within current filter]
▸ Operator        η²=0.42   [Drill →]
▸ Machine state   η²=0.18   [Drill →]
▸ Time of day     η²=0.07   [Drill →]

[Interaction hint: Click bar to filter · Brush to select + pin · Right-click for more · ⌘-click to drill without losing context]
```

**Filter chips replace breadcrumb metaphor.** Each chip independently dismissible. No false hierarchy. Sample size visible (`n=X of Y`).

**Factor Intelligence is first-class** (below the grid, not buried in a side panel). Ranked by η² / R²adj for the current filter scope. Click to drill.

**Chart interaction patterns:**

| Interaction                                                    | Effect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Click a Boxplot category**                                   | Adds to filter stack → grid restratifies → Factor Intelligence reranks within new scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Brush a region on I-Chart**                                  | Selects rows in that time range → highlights across charts → "Pin Finding" CTA appears                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Brush + Create Factor** _(shipped pattern)_                  | Brush region on chart → `SelectionPanel` appears with selected-count → click "Create Factor" → `CreateFactorModal` (in `packages/ui/src/components/CreateFactorModal/`) prompts for factor name → system creates derived column (selected → factorName, unselected → "Other") → view auto-filters to selected points. State managed via `useCreateFactorModal` hook.                                                                                                                                                                                                                                                                                                                            |
| **Click chart point**                                          | Highlights row in data table (existing `panelsStore.handlePointClick` cross-panel coordination preserved)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Right-click** _(shipped pattern, surface-specific contents)_ | Context menu opens; contents vary per surface (chart: Filter / Exclude / Drill / Pin / Create factor; Wall hypothesis: Edit / Delete / Promote-to-causal; Evidence Map node: Expand / Show related; Evidence Map edge: Promote-to-CausalLink / View evidence). **Pattern is consistent across all surfaces** (per `packages/ui/CLAUDE.md`): fixed-position cursor-anchored, viewport-clamped, auto-focus first item, Escape + backdrop-click close, mutual exclusion across overlays. Implementations: `EvidenceMapContextMenu/` (`NodeContextMenu` + `EdgeContextMenu`), `AnnotationContextMenu/` (chart findings), inline handlers on Wall components (`HypothesisCard`, `FindingChip`, etc.) |
| **⌘-click**                                                    | Adds to filter stack without losing current scope (additive vs replacement)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Pin as Finding** affordance is one-click from any chart context. After pin, lightweight QuestionLinkPrompt offers: link to question / propose hypothesis / save as standalone observation.

### Investigation tab — Hypotheses + Factors (2 views + 1 cross-cutting filter)

Investigation tab does ONE job: _"case-building post-EDA — Hypotheses and Factors."_

**2 view projections** (not 3 peer views):

| View           | Code reality                                    | What it shows                                                                                           |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Hypotheses** | `packages/ui/src/components/InvestigationWall/` | Hypothesis-centric: lifecycle-aware sections (Hypotheses you're testing / Suspected causes / Ruled out) |
| **Factors**    | `packages/ui/src/components/EvidenceMap/`       | Factor-centric: factor network, R²adj edges, suspected-cause hubs                                       |

**Questions** = **cross-cutting filter/progress tracker**, not a peer view. Surfaced as:

- Side panel or inline filter in either view
- Home tab "Also waiting" item count ("4 open questions across investigations")
- Inbox digest items when questions go stale

This honors Constitution P5 "One Graph, Three Projections" at the data layer (factor / hypothesis / question are three projections of the investigation graph); the UI promotes Hypotheses + Factors to primary projections (where case-building work happens) and treats Questions as cross-cutting progress.

### Survey — cross-cutting methodology + data-lifecycle layer

Survey is a **horizontal layer**, not a tab. Methodology-driven rules that surface as inline hints across every relevant surface. Deterministic (rules in `@variscout/core/survey`); works without AI; available in all tiers (including Free PWA).

**6 V1 rule categories — methodology + data-lifecycle senses:**

| Rule category       | Methodology sense              | Data-lifecycle sense                                               |
| ------------------- | ------------------------------ | ------------------------------------------------------------------ |
| **Status**          | Stale artifacts                | "Investigation hasn't received new data in 14 days"                |
| **Data-collection** | Thin sample for stratification | "You're investigating night shift — collect more night-shift data" |
| **Triangulation**   | Single evidence type           | "Add gemba photo to this data finding"                             |
| **Power**           | Statistical insufficiency      | "Sample insufficient to detect 10% shift — collect more?"          |
| **Drift**           | Outcome shifted                | "New data shows 2% drift since last week — re-check"               |
| **Lifecycle**       | Stage transition ready         | "IP closed 30 days — set up sustainment cadence?"                  |

**Where Survey surfaces:**

| Surface           | Survey hint examples                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Home              | Aggregated nudges as "Also waiting" items: drift alerts, lifecycle prompts, stale-hypothesis warnings        |
| Process tab       | Drift hints in decisions queue (already part of design); lifecycle hints ("IP closed long ago")              |
| Analyze tab       | Data-collection + power hints inline when scope thin; triangulation hint when pinning a finding              |
| Investigation tab | Status hints on stale hypotheses; triangulation hints on findings with one evidence type                     |
| Improvement tab   | Lifecycle hints on IP detail (sustainment cadence, handoff ready); drift hints during sustainment monitoring |

**Visual pattern:** Inline Banner variant with `✦` marker (distinct from `◆` general suggestions, `⚠` drift alerts). Same modern aesthetic — soft elevation, refined accent, dismissible.

**Survey degradation:** if user dismisses many of one category, that rule auto-suppresses for the session.

### CoScout — AI coaching layer (Azure paid)

CoScout is a **separate layer from Survey.** Two distinct concerns:

| Layer       | What it does                                 | Mechanism                | Tier            |
| ----------- | -------------------------------------------- | ------------------------ | --------------- |
| **Survey**  | Methodology + data-lifecycle rule evaluation | Deterministic rules      | All tiers       |
| **CoScout** | AI-powered conversational coaching           | LLM-based, context-aware | Azure paid only |

**Placement:**

- **Header invocation button** (next to + New analysis) — opens conversational panel
- **Slide-in panel from right** (Fluent 2 drawer per ADR-017) — chat interface
- **Context-aware** — CoScout knows current tab / level / focal artifact
- **Inline "Ask CoScout about this" chips** on artifacts (charts, findings, hypotheses) — small `✦ Ask` affordance; Azure paid only (hidden in free)

CoScout merges existing `CoScoutPanel` + `CapabilityCoachingPanel` shipped components into one adaptive coaching layer.

### Post-paste drift-detection loop

When a user clicks `+ Add data` and the data is successfully appended:

1. **Match-summary classifier** (Framing Layer §7) verifies append is valid (column shape + temporal continuity)
2. **Append rows** to existing investigation/Hub
3. **Drift detection runs automatically** — compares new-snapshot summary to previous-snapshot summary
4. **Drift hints surface** as Survey inline banners on:
   - Home (aggregated)
   - Process tab decisions queue (per-process)
   - Investigation tab hypothesis cards (per-hypothesis if affected factors changed)
5. **CoScout (Azure paid)** can offer conversational walkthrough of what changed

This is the "data evolution → investigation update" coaching loop that makes VariScout a living investigation, not a one-shot analysis.

### Theme: light-mode only (Session C lock)

VariScout is **light-mode only.** Dark mode is retired.

**Why:** VariScout's audience is quality professionals + operations practitioners — overwhelmingly light-mode-preference contexts (M365 / Office / Teams / shareable reports / printable documents / shop-floor visibility). Dark mode is "developer-tool table stakes" but doesn't serve VariScout's audience. The simplification matches every other Session C move (commit to what fits the audience; drop the rest).

**What this locks:**

- All UI patterns + chart rendering target light mode
- Reports + exports + shareable content always render light (was already the rule; now universal)
- `text-{color}-400 + text-{color}-700` chart-label pairing simplifies — always light-mode contrast
- Bundle smaller; design + maintenance surface smaller; no theme-matrix testing
- Settings theme switcher retired
- `data-theme='dark'` CSS variables block + `getChromeColors(isDark)` branching retired (downstream cleanup)
- `useChartTheme()` `isDark` field deprecated; always-false (downstream cleanup)
- Designer's "and how does this look in dark?" mental load disappears

**What this doesn't remove:**

- Light-mode-aware semantic tokens (surface / content / edge / status) — these stay; they're the foundation
- Per-component theme awareness via `useChartTheme()` — hook stays for shape parity; just returns light
- Dark-mode preference at OS level is ignored; product always renders light

**Migration:** 1-2 small cleanup PRs (CSS + hook simplification). Not a big project.

**If we revisit:** if a specific customer segment surfaces strong dark preference in 2027+, the decision can be reopened. Current evidence doesn't support investing.

### Investigation-first reframing

The primary unit of user activity is the **Investigation**. The Hub is the durable context an investigation runs against. Even a power user with many Hubs is navigating _investigations_, with Hubs as the persistent backdrop that accumulates state.

This unifies PWA (investigation-first today) and Azure (Hub-first today) under one model. The Hub _accretes_ naturally as investigations accumulate on the same data — it's not a thing users must explicitly create and curate.

### Active context and navigation scope (Session C lock)

VariScout has **two layers of active navigation context** that scope what tabs show:

| Context                            | When it applies                      | What it scopes                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hub-context**                    | User has selected a specific process | Process tab scoped to this process; Investigation tab filters to this process's investigations; Improvement tab lists this process's IPs                                                                                                                                                               |
| **IP-context** (nested inside Hub) | User has opened a specific IP        | Process tab auto-scopes to the IP's process at IP's `focusLevel` (Level + View); Analyze tab pre-configures Focus per IP's `focusLevel`; Investigation tab filters to investigations linked to this IP's lineage; Findings everywhere scope to this IP's evidence; right rail shows IP team + activity |

**Context indicator at top of workspace** when in a context:

```
Working on: Reduce variation L3 (IP)    [Exit IP]
```

Or with both layers visible:

```
Filling Line 3 > Reduce variation L3    [Exit IP]
```

**Nesting:** IP-context implies Hub-context (an IP belongs to one process). Hub-context doesn't imply IP-context (you can browse a Hub without being in an IP). Two clean levels.

**This is Notion's active-page / Figma's active-frame pattern.** When working on an artifact, the workspace narrows to it. Exit returns to broader navigation. Answers the natural user question _"which hypotheses / findings / investigations are relevant to my project?"_ — automatically, by context.

### Investigation tab — methodology grounding (the upstream tension)

The Investigation tab's view structure resolves a tension between two upstream design positions:

1. **methodology.md §"One Graph, Three Projections"** (Constitution-locked): _"An investigation graph (`Hypothesis` + `CausalLink` + `Finding` + `Question`) admits three projections — factor-centric (Evidence Map), hypothesis-centric (Investigation Wall), and question-centric (Question framework). Each projection is the same data, different lens."_ — points toward UI unification.
2. **Multi-level SCOUT §3 + ADR-074** (boundary-keeping rule): Wall and Evidence Map are listed as _separate L3 surfaces_, each owning a primary level/angle. Shipped code reflects this: `packages/ui/src/components/InvestigationWall/` + `packages/ui/src/components/EvidenceMap/` exist as separate components.

**Coherence resolution (Path A):** Investigation tab is the L3 surface, with **2 view toggles + 1 cross-cutting filter** (per the earlier Investigation tab subsection):

- Hypotheses view (= shipped Wall code) — primary
- Factors view (= shipped Evidence Map code) — primary
- Questions = cross-cutting filter, not a peer view

This honors Constitution P5 at the data layer (factor / hypothesis / question are three projections of the investigation graph). At the UI layer, the two primary work surfaces are Hypotheses + Factors; Questions surfaces as a progress filter.

**ADR-074 reconciliation:** boundary-keeping rule still holds — the Investigation tab owns L3 mechanism work entirely. Process tab handles L1 + L2 (state + flow analysis); clicking deeper into a step from Process tab → navigates to Investigation tab scoped to that step.

**Code-level migration:**

- `InvestigationWall/` → Hypotheses view implementation
- `EvidenceMap/` → Factors view implementation
- Both keep internal structure; merge is at tab-organization level, not a rewrite
- IP-as-context: when in IP-context, both views scope to that IP's lineage

### IP Lifecycle page (Session C lock)

Charter + Sustainment + Handoff are sequential stages of one improvement, not separate destinations. **Collapse into one IP Lifecycle page** with stage tabs:

```
IP: Reduce variation L3
[Charter]  [Approach]  [Sustainment]  [Handoff]    [Overview / Sections toggle]
```

Each stage tab shows the relevant section(s) of the IP. The current `activeView: 'charter' | 'sustainment' | 'handoff'` modes from `panelsStore.ts` collapse into navigation _within_ the IP Lifecycle page. Top-nav top-level Improvement tab lists IPs; clicking one opens this page.

### Three orthogonal navigation concepts (Level / View / Focus)

Path A separated the cognitive modes into different tabs (Process tab for state + structure; Analyze tab for EDA workspace). But the underlying three-axis navigation model still holds, applied within each tab where relevant:

| Concept   | What it controls                                         | Cardinality         | Examples                                            | Lives in                                              |
| --------- | -------------------------------------------------------- | ------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| **Level** | Navigational scope (L1 outcome / L2 flow / L3 mechanism) | Pick one (pan/zoom) | L1 / L2 / L3                                        | Process tab (Canvas viewport)                         |
| **View**  | Spatial rendering at this Level                          | Pick one per Level  | Map / Flow / Yamazumi / Performance                 | Process tab (Map view at L2 / Performance view at L3) |
| **Focus** | Chart-grid configuration                                 | Pick one            | Capability / Defect / Flow / Yamazumi / Performance | Analyze tab                                           |

Three orthogonal axes. Each control has one cardinality. **Process tab handles Level + View; Analyze tab handles Focus.** No single tab carries all three pickers.

**b0 / b1 / b2 default behavior:**

| Entry context                                | Default tab                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| b0 — data-first (CSV pasted, no process map) | **Analyze tab** (b0 preserves legacy Analysis dashboard experience — 4-chart grid on outcome)   |
| b1 / b2 — process exists                     | **Process tab State mode** (default for Process Owner; Project Lead may go directly to Analyze) |
| Returning to existing investigation          | Last-used tab + view for this investigation                                                     |

### Specialized paradigms: View + Focus pairings

Each _data-shape paradigm_ has BOTH a spatial View AND a statistical Focus, paired by paradigm name:

| Paradigm        | View (Map mode, spatial)                    | Focus (Analyze mode, statistical)                                                     | When available                                        |
| --------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Flow**        | Flow lines, station boxes, queue indicators | Lead time + step cycle Boxplot + bottleneck Pareto + takt Stats                       | L2 with timing data                                   |
| **Yamazumi**    | Activity-type stacked bars per station      | Per-activity time stats; VA% as headline                                              | L2 with activity-type data                            |
| **Performance** | Side-by-side per-channel mini-charts        | Worst-channel Pareto, channel-color Boxplot, multi-channel I-Chart, channel Cpk Stats | L3 with multi-channel data; OR L1 if b0 multi-channel |

**Capability and Defect are different** — they're metric types, not data-shape paradigms. They have **Focus only, no separate View** (composite step cards show their metrics automatically when data exists).

### Data-shape-aware pickers

The View / Focus pickers are **contextual to data shape**, not blanket-listed:

- Flow View / Focus available only when timestamp pairs or pre-computed cycle/wait times exist
- Yamazumi View / Focus available only when activity-type rows exist
- Performance View / Focus available only when multi-channel columns (e.g., `Head_*`, `Cavity_*`) detected
- Map View always available; Capability + Defect Focuses always available (when specs / defect events respectively exist)

The product **gets simpler for simple data; richer for rich data.** Progressive complexity that matches what the user actually has.

### What dies from the current `CANVAS_LENS_REGISTRY`

The lens picker is retired entirely. The 6 lenses split:

- ❌ **Default / Capability / Defect** retire as canvas card-rendering lenses (composite cards adapt to data automatically; Capability + Defect survive as Analyze Focuses)
- ✅ **Process Flow → Flow View** at L2 + Flow Focus in Analyze (renamed for symmetry with Focus)
- ✅ **Yamazumi → Yamazumi View** at L2 + Yamazumi Focus
- ✅ **Performance → Performance View** at L3 + Performance Focus

### No multi-hub portfolio dashboard

**Permanently dropped.** A portfolio aggregation across heterogeneous hubs would violate ADR-073 (no statistical roll-up across heterogeneous units). What users actually need — "where do I focus my limited coaching time across 50 hubs?" — is served by:

- The Inbox (drift signals + open work across all accessible processes)
- A simple Hub picker / list (navigation, not aggregation)
- ADR-073 ensures we don't build something that violates the locality rule

### IP focus level drives canvas state (Path A — per-tab routing)

IPs carry a derived `focusLevel: 'outcome' | 'flow' | 'mechanism'` computed from which Goal levels (Y / X / x) are populated. In Path A's tab structure, **opening an IP routes both Process tab and Analyze tab to sensible defaults** for the IP's focus:

| IP focus                           | Process tab default (Level + View) | Analyze tab default (Focus)                  |
| ---------------------------------- | ---------------------------------- | -------------------------------------------- |
| **Outcome IP** (Y only)            | L1 outcome panel                   | Capability or Defect Focus on the outcome    |
| **Flow IP** (Y + X with flow data) | L2 + Flow View                     | Flow Focus on whole-flow metrics             |
| **Mechanism IP** (Y + X + x)       | L3 focal step (Map view)           | Capability or Defect Focus on the focal step |

When the user opens an IP in IP-context, both tabs preconfigure so navigating between them feels coherent. Process tab shows the structural slice; Analyze tab shows the statistical slice; the IP's `focusLevel` determines both.

**One universal IP form** (no branched templates per focus level). The `focusLevel` is metadata that drives default tab state, not a workflow gate.

### VariScout's IP scope vs customer's PM workflow

VariScout's Improvement Project entity = **the analytical record** of an improvement (Goal, Investigation lineage, Approach derived from evidence, Outcome reference).

Customer's existing PM tools (PowerPoint decks, Jira, OKR tools, MS Project, kaizen boards) = **the project management record** of the same improvement (team assignments, meeting minutes, schedule, status reports, budget).

These are complementary, not duplicate. VariScout doesn't try to be a PM tool. Positioning: _"We give you the analytical spine of an improvement; you keep your existing PM workflow."_

---

## §5 Vocabulary lock

### Canonical user-facing terms (30 core)

| Term                                                | Definition                                                               | Where used                    |
| --------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| **Process**                                         | The user's real-world process / production line / queue / workflow       | Top nav, copy, vocabulary     |
| **Process Hub**                                     | (data model only)                                                        | ADRs, methodology, spec docs  |
| **Investigation**                                   | Scoped analysis attached to a process                                    | Top nav, copy                 |
| **Improvement Project**                             | Analytical record of an improvement; FK-linked to investigation findings | Top nav, copy                 |
| **Sustainment**                                     | Cadence-monitored verification of a sustained gain                       | Workflow surface              |
| **Handoff**                                         | Control-plan ownership transfer to operations                            | Workflow surface              |
| **Quick Action**                                    | Ephemeral fix; logged for audit; no formal project                       | Action surface                |
| **Finding**                                         | Evidence pinned to chart region (data / gemba / expert)                  | Investigation artifact        |
| **Hypothesis**                                      | Testable candidate explanation (5-state status)                          | Investigation artifact        |
| **Question**                                        | Open inquiry (stratification factor query)                               | Investigation artifact        |
| **CausalLink**                                      | Proven causal relationship                                               | Investigation artifact        |
| **Issue Statement**                                 | Vague concern initiating investigation                                   | Methodology                   |
| **Problem Statement**                               | Precise declaration (Watson's three questions)                           | Methodology                   |
| **Specification**                                   | Per-column or per-step target / USL / LSL / cpkTarget                    | Methodology                   |
| **Cadence**                                         | The recurring rhythm of process review                                   | Methodology                   |
| **Evidence Source**                                 | Recurring source of hub evidence                                         | Data model + methodology      |
| **Snapshot**                                        | One dated evidence package from an Evidence Source                       | Data model                    |
| **Current Process State**                           | Output of Process Measurement System                                     | Methodology                   |
| **Map** _(view name)_                               | Default canvas rendering with composite step cards                       | Process tab                   |
| **Flow** _(view + focus)_                           | Theory-of-constraints analysis at L2                                     | Process tab                   |
| **Yamazumi** _(view + focus)_                       | Lean time-study analysis at L2                                           | Process tab                   |
| **Performance** _(view + focus)_                    | Multi-channel parallel analysis at L3 (or L1 b0)                         | Process tab                   |
| **Capability** _(focus)_                            | Specs-bound outcome analysis                                             | Analyze view                  |
| **Defect** _(focus)_                                | Defect-event analysis                                                    | Analyze view                  |
| **CHANGE / FLOW / FAILURE / VALUE** _(Four Lenses)_ | Pedagogical chart-type labels                                            | Methodology + chart slots     |
| **Level** _(L1 / L2 / L3)_                          | Analytical scope: outcome / flow / mechanism                             | Process tab navigation        |
| **Map view / Analyze view**                         | Two cognitive view modes inside Process tab                              | Process tab toggle            |
| **Inbox**                                           | Cross-process work queue                                                 | Top nav                       |
| **Hypotheses view (was Wall)**                      | Hypothesis-centric projection of the investigation graph                 | View inside Investigation tab |
| **Factors view (was Evidence Map)**                 | Factor-network projection of the investigation graph                     | View inside Investigation tab |
| **Questions view**                                  | Question-framework projection of the investigation graph                 | View inside Investigation tab |

### Retired terms (must never reintroduce into UI)

| Retired                                                                        | Replaced by                                                                                                 | Reason                                                                                          |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Hub** _(as user-facing word)_                                                | "process"                                                                                                   | UI uses domain language; "Hub" is data-model + methodology only                                 |
| **Hubs** _(as top-nav tab)_                                                    | (no separate tab; `[Process: <name> ▾]` dropdown for multi-hub)                                             | Investigation-first nav; no portfolio dashboard                                                 |
| **Frame** _(as top-nav tab)_                                                   | "Process"                                                                                                   | Tab now contains both Map + Analyze view modes                                                  |
| **Canvas** _(as UI label)_                                                     | "Process"                                                                                                   | Canvas survives as design-doc architectural pattern                                             |
| **Analysis tab**                                                               | "Analyze view" inside Process tab                                                                           | Per Vision Q0                                                                                   |
| **Lens / Lens picker**                                                         | View + Focus (two distinct controls)                                                                        | Two mechanisms separated                                                                        |
| **Mode** _(as UI concept)_                                                     | Merge into View or Focus per context                                                                        | Conflated concepts                                                                              |
| **Capability mode / Defect mode**                                              | "Capability Focus / Defect Focus" inside Analyze view                                                       | Survive as Focuses, not canvas-rendering modes                                                  |
| **Process Flow mode**                                                          | "Flow View" at L2 + "Flow Focus" in Analyze                                                                 | Renamed for symmetry                                                                            |
| **Performance mode**                                                           | "Performance View" at L3 + "Performance Focus"                                                              | Symmetric pairing                                                                               |
| **Yamazumi mode**                                                              | "Yamazumi View" at L2 + "Yamazumi Focus"                                                                    | Symmetric pairing                                                                               |
| **SuspectedCause** _(as entity name)_                                          | "Hypothesis"                                                                                                | Per RPS V1 D15 rename                                                                           |
| **"Hypothesis hubs"** _(as L2 overlay chip)_                                   | (retired; was leftover from SuspectedCause rename — Hypotheses overlay can filter by `themeTags` if needed) | Overlay chip cleanup                                                                            |
| **Tributary**                                                                  | "factor" / "input" / "input arrow"                                                                          | Per glossary; ADR-070 retired the river metaphor                                                |
| **CTS / CTQ** _(as user-facing acronyms)_                                      | "outcome at customer" / "measure at step"                                                                   | Acronym opacity; concept survives                                                               |
| **Root cause**                                                                 | "contribution" / "suspected cause" / "mechanism"                                                            | Constitution P5; ESLint-enforced                                                                |
| **Moderator effect** _(in ANOVA / interaction context)_                        | "ordinal interaction" / "disordinal interaction"                                                            | Constitution; ESLint-enforced                                                                   |
| **River-SIPOC**                                                                | "Canvas" _(internal)_ / "Map view" _(UI)_                                                                   | Vision §6                                                                                       |
| **Layered Process View**                                                       | "Canvas with mode lenses" _(internal)_ / "Process tab" _(UI)_                                               | Per ADR-074 + Vision                                                                            |
| **Hub of Hubs**                                                                | (not user-facing; "Plant-hub layout" named-future)                                                          | Implementation term only                                                                        |
| **Charter** _(as entity name)_                                                 | "Improvement Project"                                                                                       | Per RPS V1 brainstorm 2026-05-08                                                                |
| **"Spine"** _(as surface noun)_                                                | Replace with surface name: Process tab / Investigation tab                                                  | Per three-spines reconciliation                                                                 |
| **"Investigation Wall"** _(as standalone top-level surface)_                   | "Hypotheses view inside Investigation tab"                                                                  | Constitution P5 + methodology.md §"One Graph, Three Projections"                                |
| **"Evidence Map"** _(as standalone top-level surface)_                         | "Factors view inside Investigation tab"                                                                     | Same                                                                                            |
| **"Wall + Evidence Map as peer L3 surfaces"** _(Multi-level SCOUT §3 framing)_ | "Two view projections inside one Investigation tab"                                                         | Multi-level SCOUT §3 boundary rule still holds; surface organization unified per methodology.md |
| **Dark mode**                                                                  | Retired; light-mode only                                                                                    | Audience reality (quality professionals) + simplification; see §4 "Theme: light-mode only"      |

### Three "spines" reconciled

| Concept                                                                                                  | Definition                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Investigation Spine**                                                                                  | Methodology narrative pattern (FRAME → SCOUT → INVESTIGATE → IMPROVE) — NOT a surface                                                   |
| **Canvas** _(internal)_ / **Process tab** _(UI)_                                                         | Pan/zoom spatial home (Process tab handles L1 outcome + L2 flow analysis; L3 investigation work lives in Investigation tab per ADR-074) |
| **Evidence Map** _(historically a standalone L3 surface; now the Factors view inside Investigation tab)_ | Factor-centric projection of the investigation graph per methodology.md §"One Graph, Three Projections"                                 |

The word "spine" survives only in methodology narrative — not as a surface noun. "Investigation Wall" and "Evidence Map" survive as **named view projections** inside the Investigation tab (Hypotheses view = Wall; Factors view = Evidence Map; Questions view = Question framework) — not as separate top-level surfaces.

---

## §6 IA principles

### When to add a top-level tab

A surface earns a top-level tab when:

1. It represents an entity-type the user actively manages (Inbox, Process, Investigation, Improvement, Report)
2. It has its own lifecycle (create / edit / close / archive)
3. Users navigate to it as a destination, not just visit it from another surface

If a surface is reached _only_ by clicking from another surface, it's a sub-surface, not a tab.

### When to add a View vs a Focus

- **View** = spatial rendering of the canvas (Map / Flow / Yamazumi / Performance). Each View is a structurally different way of drawing the process at a given Level.
- **Focus** = chart-grid configuration in Analyze mode. Each Focus picks data sources for the 4 chart slots (I-Chart / Boxplot / Pareto / Stats).

Add a View when a paradigm requires structurally different canvas rendering. Add a Focus when a paradigm has 4-chart-friendly data sources but doesn't need a new canvas rendering.

### When to add an Overlay vs a View

- **Overlay** = markers on top of existing canvas (Investigations / Hypotheses / Findings / Wall pins). Multi-select. Toggle on/off independently.
- **View** = the underlying canvas rendering itself. Mutually exclusive — pick one.

Visually distinct controls. Overlays use checkbox-shape chips; Views use radio-shape segmented control.

### When to gate a CTA by persona

Gate a CTA only when:

- Acting on it would mislead the wrong persona (e.g., a Frontline approving an IP signoff)
- The persona-specific authority is required by the methodology or compliance

Never gate navigation. Any tenant user can read any surface they have permission to view.

### When to add a new mode-specific journey doc

Almost never. The 5 existing mode-specific USER-JOURNEYS docs already cover the surface area for Capability / Defect / Flow / Yamazumi / Performance. New journeys should be specs in `docs/superpowers/specs/`, not new journey docs.

### How to expose the View / Focus pickers

**Data-shape-aware.** Only show options the data supports:

- Flow View / Focus → only with timestamp pairs or cycle time data
- Yamazumi View / Focus → only with activity-type data
- Performance View / Focus → only with multi-channel data
- Map View → always available
- Capability + Defect Focus → always available when specs / defect events exist

Don't show disabled buttons with "Coming soon" tooltips (per `feedback_hidden_vs_disabled_cta`). Hide what's not applicable; surface what is.

---

## §7 Legacy doc reconciliation map (Q14 answer)

All 5 mode-specific `USER-JOURNEYS-*.md` docs survive. None archived. Each maps to one or both new homes:

| Legacy doc                      | New home(s)                                                   | Reconciliation work                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `USER-JOURNEYS-CAPABILITY.md`   | **Capability Focus** documentation                            | Update language: "in Analyze view with Capability Focus" instead of "Capability mode"                                                                                                                                                                                                |
| `USER-JOURNEYS-DEFECT.md`       | **Defect Focus** documentation                                | Same; "Defect Focus" replaces "Defect mode"                                                                                                                                                                                                                                          |
| `USER-JOURNEYS-PERFORMANCE.md`  | **Performance View** at L3 + **Performance Focus** in Analyze | Update language; preserve multi-channel data-detection logic; clarify L3 + b0 dual applicability                                                                                                                                                                                     |
| `USER-JOURNEYS-YAMAZUMI.md`     | **Yamazumi View** at L2 + **Yamazumi Focus** in Analyze       | Update language; preserve activity-type rendering + VA% headline                                                                                                                                                                                                                     |
| `USER-JOURNEYS-PROCESS-FLOW.md` | **Flow View** at L2 + **Flow Focus** in Analyze               | Update language; **flag: Flow View is unbuilt as of 2026-05-14 — Process Flow Phase 1 design exists in `2026-04-07-process-flow-analysis-mode-design.md` but no code yet.** This is now a load-bearing gap (without Flow View, L2 has no native tool for queue-based flow analysis). |

`docs/USER-JOURNEYS.md` (root) needs an update against the post-Hub model — currently last-reviewed 2026-04-24, predates Process Hub canonical moment.

---

## §8 Session C work — status pointer

**Session C has been substantively done.** See §15 for the comprehensive done/pending list. Major Session C locks captured in this spec:

- Persona name finalization (§3) — locked
- Path A 6-tab structure (§4) — locked
- Visual identity (§11) — pattern catalog + two-color-system rule
- Motion + transitions (§12)
- Accessibility framework (§13)
- Methodology narrative location (§4 + §5) — internal vs UI plain-language
- First-60-seconds (§4) — Project Lead walkthrough done; other personas pending
- Empty states (§4 + §11) — patterns set; persona-specific variants pending
- Survey + CoScout layers (§4)

Remaining open items listed in §15. Pre-Path-A "deferred" list (Smart default chain / Inbox visual hierarchy / Surface-to-surface transitions) folded into the relevant locked sections (§4 + §11 + §12).

---

## §9 Out of scope for this spec

- **Implementing any of the coherence fixes** — those become downstream plans P1-P17.
- **Reopening RPS V1 / Canvas 8f / F-series architectural decisions** — locked + delivered.
- **Rewriting the vision spec** — vision is sound; the seams are the issue.
- **Multi-investigation / Portfolio Investigation work** (H3, named-future).
- **Security hardening** (#13 in `docs/roadmap.md` — separate brainstorm).
- **The pre-existing React `setState-in-render` warning in `AppMain`** (separate diagnostic task).
- **External/guest tier accounts.** All users must be internal to tenant; cross-tenant B2B federation deferred indefinitely.
- **Process Hubs portfolio dashboard.** Permanently dropped (ADR-073 violation; superseded by Inbox + Hub picker).

---

## §10 Downstream plans this spec drives

| #   | Plan                                                                                                                                                       | Driven by                      | Size |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---- |
| P1  | Vocabulary lock-in: Frame→Process rename + Hub→process UI + retired terms sweep                                                                            | §5                             | S–M  |
| P2  | 3-question entry-point scope carriage + L3 primary-action signal                                                                                           | §4 (Q11 from plan)             | M    |
| P3  | ADR-074 cleanup (AuthorL3View embed + Wall mirror decision)                                                                                                | §1.2, ADR-074                  | M    |
| P4  | Persona-aware onboarding + `personaRole` field + Team-tier default routing                                                                                 | §3                             | L    |
| P5  | Process-Owner-aware UI gating (read `processHub.processOwner` for action-CTA gating)                                                                       | §3                             | M    |
| P6  | Methodology narrative copy + lineage doc                                                                                                                   | §8 (Session C)                 | M    |
| P7  | Half-shipped affordance cleanup (data-shape-aware View/Focus pickers)                                                                                      | §4                             | S    |
| P8  | B2 chrome-walk + canonical journey doc                                                                                                                     | §1.3, audit findings           | M    |
| P9  | `USER-JOURNEYS-*.md` refresh against new model                                                                                                             | §7                             | S–M  |
| P10 | Empty-state coaching pass (every `--` + disabled state gets a next action)                                                                                 | §8 (Session C)                 | S    |
| P12 | Home tab redesign (Linear-style one-primary-item + "Also waiting · N" collapsed; persona-adaptive)                                                         | §4                             | M    |
| P14 | Lens-system retirement migration (remove `CANVAS_LENS_REGISTRY`; composite step cards adapt to data; reframe paradigms as Views + Focuses)                 | §4                             | L    |
| P15 | Analyze tab as its own destination (4-chart grid + Factor Intelligence first-class + filter chips; NOT a sub-mode of Process tab per Path A)               | §4                             | M    |
| P16 | Process Flow View + Focus build (was named-future; now load-bearing for L2 coherence)                                                                      | §4 + §7                        | L    |
| P17 | `personaRole` field on team-member records + admin UI for assignment                                                                                       | §3                             | M    |
| P18 | Build "How VariScout works" in-product Learn page (plain language; no methodology phase branding)                                                          | §4 methodology                 | M    |
| P19 | Copy density pass per persona — tooltip dictionary + empty-state copy + CoScout density rules                                                              | §3 + §4                        | L    |
| P20 | Process goal narrative rendering on Process tab header                                                                                                     | §4 + Framing Layer Stage 1     | S    |
| P21 | Lifecycle-aware Wall sections (Hypotheses you're testing / Suspected causes / Ruled out)                                                                   | §4 Investigation tab           | M    |
| P22 | One-click Finding-pinning from any chart context + lightweight QuestionLinkPrompt                                                                          | §4 Analyze tab + Investigation | M    |
| P23 | Hide CausalLink + GateNode from typical UI; expose only in advanced/Problem Condition mode                                                                 | §4 + §5                        | S    |
| P24 | Pattern library extension — author 7 modern patterns in `docs/06-design-system/patterns/`                                                                  | §11                            | M    |
| P25 | Accessibility audit pass on each new pattern (WCAG 2.1 AA in light mode)                                                                                   | §16                            | M    |
| P26 | Motion + reduced-motion implementation across 8 transition specs                                                                                           | §15                            | M    |
| P27 | UI accent token introduction (indigo family — chart-palette-neutral)                                                                                       | §11                            | S    |
| P28 | Lucide icon system rollout (replace emoji-as-UI-affordance)                                                                                                | §11                            | S–M  |
| P29 | Light-only theme cleanup (remove `data-theme='dark'` block + `getChromeColors(isDark)` branching + theme switcher UI)                                      | §4 theme                       | S    |
| P30 | Dark mode polish — **deferred** until customer signal                                                                                                      | —                              | —    |
| P31 | Factor Intelligence + drill-down UX detail design (first-class section in Analyze tab)                                                                     | §4 Analyze tab                 | M    |
| P32 | Cross-cutting Questions filter component (replaces Questions as a peer view in Investigation tab)                                                          | §4 Investigation tab           | S    |
| P33 | Chart interactions detail design — click/brush/right-click/⌘-click semantics + first-time hints                                                            | §4 Analyze tab                 | M    |
| P34 | Edit mode design for Process tab — toolbar, ChipRail, drag-to-rearrange, exit affordance, mode-shift chrome                                                | §4 Process tab                 | M    |
| P35 | Survey hint UX detail — per-category banner copy + dismissibility + auto-suppress                                                                          | §4 Survey                      | M    |
| P36 | CoScout panel placement + inline "Ask CoScout" chip affordance + adaptive coaching merge                                                                   | §4 CoScout                     | M    |
| P37 | `+ Add data` flow design — match-summary scoped to current process; distinct from `+ New analysis`                                                         | §4 header utility              | M    |
| P38 | Drift-detection automatic post-paste + cross-surface hint dispatch (Home + Process + Hypotheses)                                                           | §4 post-paste loop             | M    |
| P39 | Survey rule library expansion — explicit data-lifecycle senses for all 6 categories (status / data-collection / triangulation / power / drift / lifecycle) | §4 Survey                      | M    |

(Plans P11 + P13 from the original plan file are **dropped permanently** — Hubs portfolio view and Guest/External SME tier respectively.)

---

## §11 Visual identity — pattern catalog (Session C, Path A revision)

**Foundation (locked, don't reopen):**

- ADR-017 Fluent 2 alignment (panels, drawers, dismiss behaviors)
- `docs/06-design-system/foundations/typography.md` (system fonts + 6-tier scale)
- `packages/ui/src/styles/theme.css` (semantic color tokens: surface / content / edge / interactive / status)
- `packages/charts/src/colors.ts` (Minitab-familiar chart palette: pass/fail/warning/violation/spec/control/mean — never reuse for UI chrome)

**Two color systems, never confused:**

- **Chart canvas:** vivid Tailwind-500 saturations, industry conventions (Minitab-familiar). Red = out-of-spec; orange = spec lines + control violation; cyan = control limits; green = in-spec; blue = mean. Locked per `packages/charts/CLAUDE.md`.
- **UI chrome:** warm off-white surface (`#fdfdfb`), warm-gray text (`#1e293b` primary / `#64748b` secondary), **indigo accent** (`#6366f1` / `#4f46e5`) — chart-palette-neutral. Subtle drop-shadows for depth, not hard 1px borders.

**Energy:** Calm confidence. Reference aesthetic: Linear / Stripe Dashboard / iA Writer / Cron Calendar. NOT Tableau (frenetic), NOT Minitab (intimidating), NOT Slack (playful). Metaphor: a quiet workshop, well-lit.

**Light-mode only** (per §4 theme lock). All patterns target light; no dark variants designed.

### Pattern catalog — 7 new patterns introduced by coherence work

| #   | Pattern                              | Visual treatment                                                                                                                                          | Tokens / specs                                                                                                                                                                                                                                       |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Primary-attention card**           | Soft elevated card + thin indigo accent strip (3px, left-anchored). NOT red-bordered alarm chrome. Status carried by icon + content, not by alarm chrome. | `background: #fdfdfb` / `box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(99,102,241,0.06)` / `border: 1px solid rgba(99,102,241,0.12)` / accent strip via `::before` pseudo-element                                                          |
| 2   | **View picker (segmented control)**  | Linear-style soft pill segmented control. Active state via white-pill-on-warmgray-track + subtle shadow. NO stark dark/white.                             | Track `background: #f5f5f1; border-radius: 8px; padding: 3px;`. Active button `background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.06);`. Transition 150ms ease-out.                                                                               |
| 3   | **Pill-toggle chips (multi-select)** | Rounded pill; subtle indigo-tinted fill + thin border when active. NO explicit checkbox glyph.                                                            | Default `background: #f5f5f1; color: #64748b; border: 1px solid transparent;`. Active `background: rgba(99,102,241,0.08); color: #6366f1; border-color: rgba(99,102,241,0.15);`                                                                      |
| 4   | **Filter chip (with dismiss)**       | Pill-chip with `× dismiss` affordance per chip. Independently dismissible. NO breadcrumb-style hierarchy.                                                 | Background `rgba(99,102,241,0.08); color: #4f46e5; border: 1px solid rgba(99,102,241,0.15); border-radius: 999px;`. Dismiss is a button child.                                                                                                       |
| 5   | **IP-context indicator**             | Slim chip in workspace header showing IP scope. Subtle indigo tint (NOT warm-yellow alarm banner). Refined `Exit IP` link.                                | Pill-shape `padding: 4px 12px; background: rgba(99,102,241,0.06); color: #4f46e5; border: 1px solid rgba(99,102,241,0.12);`. Persistent across all tabs while in context.                                                                            |
| 6   | **Inline banner**                    | Floating card with soft drop-shadow. Refined accent icon (Lucide-stroke, NOT emoji). Subtle suggestion tone (NOT system warning). Dismissible.            | `background: white; border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.05);`. Stacks at top of view. Survey variant uses `✦` marker; general suggestion uses `◆`; drift alert uses `⚠`. |
| 7   | **Lifecycle-aware sections**         | Ghost chevrons (▸ collapsed / ▾ expanded) + count badge tabular-numeral + airy section gaps. Each section sorts independently.                            | Section headers `font-weight: 600; color: #1e293b;`. Count `font-family: ui-monospace; color: #94a3b8;`. Collapsed sections muted. Thin divider between sections `border-top: 1px solid rgba(0,0,0,0.04);`                                           |

### Additional patterns referenced

- **Mode toggle (State / Edit)** for surfaces with authoring affordances — applies to Process tab (State / Edit) and IP detail (Overview / Sections). Pattern: segmented toggle in header; visual chrome shift when in edit mode (toolbar appears, hover states active, "Done" exit affordance).
- **Refined header utility row** — identity left, utilities right; `+ Add data` and `+ New analysis` as distinct CTAs; notifications bell + settings as ghost icons.
- **Tabular numerals** — `font-variant-numeric: tabular-nums` + monospace for ALL data values (Cpk, η², counts, percentages). Signals "this is a measurement, not prose."

### Iconography

**Primary:** Lucide line icons (1.5-2px stroke, consistent). Used for UI affordances — toggles, dismiss, settings, notifications, navigation.

**Secondary:** Refined accent marks: `◆` (suggestion / IP context), `✦` (Survey hint), `⚠` (drift alert), `🔴` (critical state — sparingly).

**Tertiary:** Emoji ONLY for human-authored content (Fred's gemba note: "🚧 saw spillover at 14:32"). NOT used as UI affordances.

### Spacing scale

`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px`. Generous padding on cards (16-24px); tight rhythm between related items (4-8px); strong section gaps (32-48px between major sections).

---

## §12 Motion + transitions (Session C, Path A revision)

**Principles:**

- Short durations: 150-250ms for most; 400ms for the longest (pin-finding pulse)
- Ease-out for entrances; ease-in for exits; ease-in-out for context transitions
- Never jittery; never decorative; always intentional
- `prefers-reduced-motion` respected — disables non-essential animations

### 8 transition specifications

| Transition                                                                       | Pattern                                                                         | Duration + easing                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Tab switch** (Home ↔ Process ↔ Analyze ↔ Investigation ↔ Improvement ↔ Report) | Instant content swap (no transition); active tab indicator slides               | Tab indicator: 200ms ease-out                   |
| **State ↔ Edit mode toggle** (Process tab)                                       | Editing chrome appears via fade + slight slide-down; ChipRail appears from left | 250ms ease-in-out                               |
| **Pan/zoom across L1/L2/L3** (Process tab Canvas)                                | Smooth zoom (d3-zoom defaults); LOD cross-fade at level transitions             | 150ms LOD cross-fade per 8f spec                |
| **IP-context enter**                                                             | Workspace narrows; context indicator slides in from top                         | 250ms ease-in-out                               |
| **Notifications panel**                                                          | Slide-in from right (Fluent 2 drawer per ADR-017)                               | 200ms ease-out                                  |
| **CoScout panel**                                                                | Slide-in from right (Fluent 2 drawer)                                           | 200ms ease-out                                  |
| **Inline banner enter/dismiss**                                                  | Fade + small translate; new banner stacks below existing                        | 150ms ease-out (enter), 150ms ease-in (dismiss) |
| **Pin-finding pulse**                                                            | Brief highlight on finding marker after pin (signals "saved")                   | 400ms ease-out scale + opacity                  |
| **Lifecycle section expand/collapse**                                            | Height transition + content fade                                                | 200ms ease-out                                  |
| **Filter chip add/remove**                                                       | Fade + slight scale on add; fade-out on remove                                  | 150ms ease-out (add), 100ms ease-in (remove)    |

### Reduced-motion behavior

When `prefers-reduced-motion: reduce` is set:

- **Disabled:** LOD cross-fade, pin-finding pulse, banner slide, filter chip scale
- **Kept (essential):** Tab indicator (preserves orientation), panel slide-in (Fluent 2 essential per ADR-017)
- All disabled transitions become instant content swap

---

## §13 Accessibility — WCAG 2.1 AA per pattern (Session C, Path A revision)

**Light-mode-only simplifies verification** — single contrast pass per pattern (no light + dark matrix).

| Area                           | Pattern decision                                                                                                                                                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contrast ratios**            | Semantic tokens enforce AA: `content-primary` on `surface` ≥ 7:1; `content-secondary` ≥ 4.5:1; refined warm-grays already pass. Validate per new pattern via contrast-checker.                                                                                                    |
| **Color-blind safety**         | Chart status colors (red/amber/orange/cyan/green/blue) NEVER convey meaning alone — always paired with icon, text, or position. Red-bordered alarm chrome retired (the indigo primary-attention strip + icon + verb-first title is color-blind-safe).                             |
| **Keyboard navigation**        | Tab order follows visual order; focus rings visible (shadcn `--ring` token); Escape dismisses panels (Fluent 2); Enter activates primary CTA on focused card. View / Overlay pickers keyboard-traversable. ⌘-shortcuts for power users (⌘N = new analysis; ⌘K = command palette). |
| **Screen reader**              | ARIA labels on icon-only buttons (`🔔 = "Notifications, 3 unread"`); semantic HTML (`<h2>` / `<h3>` / `<nav>` / `<main>` / `<aside>`); section headings on lifecycle-aware groups; `aria-live` regions for inline banner appearance.                                              |
| **Reduced motion**             | `prefers-reduced-motion: reduce` disables LOD cross-fade, pin pulse, banner slide. Keeps tab indicator, panel slide-in.                                                                                                                                                           |
| **Mobile touch targets**       | Frontline persona mobile-first: ≥44×44px tap targets on Today view CTAs (action cards, ack buttons). Per ADR-017 Fluent 2 responsive guidance.                                                                                                                                    |
| **Persona-aware copy density** | Plain (Process Owner + Frontline) vs Standard (Project Lead) vs Standard+technical (SME) — all tested for readability (Flesch-Kincaid grade ≤ 12 for Plain; ≤ 14 for Standard).                                                                                                   |
| **Tabular numerals**           | `font-variant-numeric: tabular-nums` ensures consistent column alignment of data values across screen-reader and visual rendering.                                                                                                                                                |

---

## §14 Verification

The coherence work is complete when:

- A returning MBB customer opens VariScout and has a sense of _what to do_ without reading the spec.
- A new Process Owner lands on their process's overview, not on a blank paste screen.
- A new analyst (Project Lead in b0) lands in Analyze view with the 4-chart grid ready, preserving today's Analysis dashboard experience.
- Every UI term has one canonical meaning. No Frame/Canvas, Hub/process, Mode/Lens, Hypothesis/SuspectedCause confusion.
- Every empty state has a concrete next action.
- Every CTA is either fully wired or honestly hidden (never disabled-with-no-explanation).
- Every methodology choice is acknowledged in copy, not just in design docs.
- `processHub.processOwner` is queried by the UI for action-CTA gating.
- Top nav reads `[Inbox] [Process] [Investigation] [Improvement] [Report]` consistently.
- Data-shape-aware View / Focus pickers — simple data shows minimal pickers; rich data exposes Flow / Yamazumi / Performance options.
- All 5 mode-specific USER-JOURNEYS docs updated to the new Map/Analyze + View/Focus framing.

---

## §15 Session C — what's done + what's still pending

### Done in Session C (locked in this spec)

- **Persona name finalization** (§3): Process Owner / Project Lead / SME / Frontline locked
- **Path A 6-tab surface structure** (§4): top nav locked; each tab one job (Linear test passes)
- **Process tab State + Edit modes** (§4): framing fits inside Process tab via mode toggle, not a separate tab
- **Analyze tab as own destination** (§4): EDA workspace with filter chips + Factor Intelligence first-class
- **Investigation tab — 2 view projections + cross-cutting Questions filter** (§4): Hypotheses + Factors as primary; Questions as progress filter
- **Chart interactions** (§4): click / brush / right-click / ⌘-click semantics; Brush + Create Factor grounded in shipped `CreateFactorModal` pattern
- **Survey as cross-cutting layer** (§4): methodology + data-lifecycle coaching; 6 rule categories surface as inline hints across tabs
- **CoScout placement** (§4): header button + slide-in panel + inline "Ask CoScout" chips; Azure paid only
- **`+ Add data` distinct from `+ New analysis`** (§4): two distinct entry actions for distinct intents
- **Post-paste drift-detection loop** (§4): match-summary + drift detection + cross-surface hint dispatch
- **Home with one primary item** (§4): Linear-style; "Also waiting · N" collapsed
- **IPs single-home in Improvement tab** (§4): reference badges elsewhere, no card duplication
- **Light-mode only** (§4): dark mode retired
- **Visual identity foundation grounded** (§11): ADR-017 Fluent 2 + typography.md + chart colors locked; two-color-system rule (chart canvas vs UI chrome)
- **7 modern pattern catalog** (§11): primary-attention card / segmented control / pill chips / filter chip / IP-context indicator / inline banner / lifecycle sections
- **Motion + transitions** (§12): 10 specs; reduced-motion handling
- **Accessibility framework** (§13): WCAG 2.1 AA per pattern in light mode
- **EDA-for-process-improvement positioning** (§1): foundation-aligned with methodology.md; Turtiainen 2019 lineage
- **Methodology narrative as internal** (§5): plain language for UI; framework names internal-only
- **Layer 1 vs Layer 2 vs RACI disambiguation** (§3): terminology lock

### Still pending in Session C (carried forward)

- **Mobile design** — Frontline-first responsive variants. Path A is desktop-shaped; mobile experience for Frontline (Today + Inbox) needs dedicated design pass.
- **Persona-specific Home variants** — only Project Lead walkthrough designed concretely; Pat (Process Owner) / Dr. Chen (SME) / Fred (Frontline) Home designs pending.
- ~~Right-click context menu discoverability~~ — **resolved**: pattern shipped (`EvidenceMapContextMenu` + `AnnotationContextMenu` + chart `onContextMenu` handlers); contents vary per surface (chart / Wall / Evidence Map / IP), pattern is consistent. Discoverability rule: every right-click action must also have a visible UI affordance; right-click is power-user shortcut, not the only path. First-time hint banner ("Right-click for more actions") appears once per view; dismissible.
- ~~**IP detail page details** — Overview / Sections toggle + team workspace pattern (Team roster + Activity feed) need detailed visual design.~~ **Resolved 2026-05-14** — see [`2026-05-14-projects-tab-design.md`](./2026-05-14-projects-tab-design.md). Resolution introduced the 7-tab split (Improve + Projects), Home active-IP launchpad, IP-context cascade, SuspectedCause-anchored Approach stage, and Report Overview/Technical audience toggle with QC-Story narrative arc.
- **USER-JOURNEYS-\*.md refresh** — legacy journey docs need refresh against new Path A model (downstream plan P9).
- **Spec self-review pass end-to-end** — read full spec for consistency after all the iterations.

When the remaining items resolve, this spec moves from `status: draft` to `status: accepted`.

---

## §16 Upstream spec integration matrix (Session C reconciliation)

A focused reconciliation pass on 2026-05-14 (mid-Session C) caught that the coherence spec was making decisions assuming upstream specs without grounding in their actual content. This matrix lists what each upstream spec contributes to coherence + key components the coherence spec depends on.

### Spec contributions matrix

| Upstream spec                                               | Status                                      | What coherence inherits                                                                                                                                                                                                                                                                                                                                                | Key locked components                                                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`2026-05-03-variscout-vision-design.md`**                 | accepted                                    | 5-tab top nav direction, Canvas-as-spatial-home, three-level methodology, "Hub IS canvas IS logic map" framing                                                                                                                                                                                                                                                         | §8 + Q0 decisions (12 locked); Canvas replaces Frame+Analysis tabs                                                                                                                |
| **`2026-04-27-process-learning-operating-model-design.md`** | superseded by vision but still load-bearing | Three-level model (System/Flow/Mechanism = L1/L2/L3), Current Process State definition, Response paths (Quick Action / Focused Investigation / Charter / Sustainment / Handoff), Process Measurement System concept                                                                                                                                                    | "Current Process State" = latest structured read across outcome / flow / x-control / capability / trust                                                                           |
| **`2026-05-09-response-path-system-v1-design.md`**          | delivered                                   | IP multi-level Goal (Y/X/x) → `focusLevel`, 5 response paths, RACI signoffs, Sustainment auto-fire on IP closure (ADR-080), Hypothesis (5-state) entity rename                                                                                                                                                                                                         | IP form 6 sections; `ImprovementProject` data model; `SustainmentRecord` lifecycle                                                                                                |
| **`2026-05-13-canvas-viewport-architecture-design.md`**     | delivered (PRs #160-#165, #166 followups)   | Canvas pan/zoom across L1/L2/L3; ADR-081 boundary; `useCanvasViewportStore` hub-keyed state                                                                                                                                                                                                                                                                            | View picker + LOD switcher; Wall overlay (now subsumed under L3 Investigation surface per coherence merge)                                                                        |
| **`2026-04-25-process-hub-design.md`**                      | in-progress                                 | Hub as durable organizational context; 9-value investigation status enum (`issue-captured` → `controlled`); five ownership roles (process owner, investigation owner, sponsor, contributors, action owners); Hub cadence = improvement rhythm not operational alarm                                                                                                    | Investigation status enum (derived from journey phase + optional override) — used by Home filtering                                                                               |
| **`2026-04-25-process-hub-use-cases.md`**                   | draft                                       | Nine user contexts (process owner, quality engineer, GB/BB, data team, sponsor, contributor/operator, analyst, admin, trainer); eight core use cases; legacy projects → General/Unassigned Hub                                                                                                                                                                         | Use-case-to-persona mapping (multiple contexts collapse into 4 personas)                                                                                                          |
| **`2026-04-25-engagement-profile-raci-design.md`**          | brainstorm/draft                            | 4 RACI roles + 6 identity-anchor fields (`Sponsor` on IssueStatement, `responsibleRole` on ProcessMapNode, `assignee` on Question + ImprovementIdea, `status` pending-validation on SuspectedCause, `verifiedBy` on FindingOutcome); `EngagementEvent` → external webhook (Teams/Power Automate/Slack); ADR-071 (pending) supersedes ADR-015's "no PM features" stance | Events-not-notifications pattern; identity anchors as the Layer 2 reference fields                                                                                                |
| **`2026-04-29-multi-level-scout-design.md`**                | delivered (slices 1-3 shipped)              | Three-primitive architecture (Strategy + 4 slots + TimelineWindow + dataRouter); boundary-keeping rule (each surface owns one level, lenses others read-only); `TimelineWindow` (fixed/rolling/open-ended/cumulative); throughput module (8 functions); cross-investigation hypothesis frequency                                                                       | Boundary rule justifies L3 Investigation merge (Wall+Evidence Map+Questions as projections); dataRouter dispatches View/Focus                                                     |
| **`docs/archive/specs/2026-05-03-framing-layer-design.md`** | delivered (slices 1-3)                      | `OutcomeSpec[]` array, `DataQualityBanner`, `validateData()`, `detectColumns()`, `inferMode()`, match-summary card (2-axis classifier), multi-source join with `RowProvenanceTag` (ADR-077 D6), HubGoalForm + ColumnMapping + StageFiveModal as authoring components                                                                                                   | Pre-existing entry flow components that survive in the simplified "+ New analysis" flow as inline banners                                                                         |
| **`2026-05-14-projects-tab-design.md`**                     | draft                                       | 7-tab nav split (Improve + Projects); IP detail (Lifecycle) page anatomy; Home active-IP launchpad; IP-context cascade across Process/Analyze/Investigation/Improve/Report tabs; SuspectedCause-anchored Approach stage; Report Overview/Technical audience toggle; QC-Story-shaped narrative arc                                                                      | Stage tabs Charter/Approach/Sustainment/Handoff; team workspace right rail (V1+V2 scope); `ImprovementProject.reflection?` field addition; Improve tab unchanged (zero migration) |

### Specific upstream commitments coherence depends on

These are the named things the coherence spec assumes work as designed in upstream specs. If any of these change, coherence updates:

1. **`OutcomeSpec[]` is an array** (Framing Layer) — supports multi-outcome Hubs (manufacturing process with both fill weight CTS and delivery time CTS). Coherence §4 L1 panel adapts to multiple outcomes.
2. **`processHub.processOwner` is a stored reference** (Process Hub design + RACI spec) — single tenant user per Hub. Used by coherence §3 for default landing routing + persona-aware CTA gating ("Approve IP signoff" only to Process Owner of relevant hub).
3. **9-value investigation status enum** (Process Hub design) — derived from journey phase + optional override. Home filtering uses it (Project Lead sees `investigating` + `ready-to-improve` items).
4. **Hub cadence ≠ operational alarm** (Process Hub design + Operating Model) — coherence's Process Owner Home landing reflects cadence rhythm (weekly/daily review), not real-time monitoring.
5. **Multi-source join is shipped** (Framing Layer slice 3) — coherence's "+ New analysis" flow surfaces it as an inline opportunistic banner, not a buried wizard.
6. **`TimelineWindow` primitive exists** (Multi-level SCOUT) — implicit fourth axis alongside Level/View/Focus in the Process tab. Attachment point (ProcessContext vs investigation envelope) is implementation-pending per Multi-level SCOUT §2.B.
7. **`RowProvenanceTag`** (ADR-077 D6) — preserves source attribution across multi-source joins. Coherence implicitly depends on this for join-key suggestions to stay valid downstream.
8. **`EngagementEvent` → external webhook** (RACI spec) — coherence's notifications + cross-persona handoffs route through this pattern, not in-product invitation UI.

### Reconciliation tensions (acknowledged + accepted)

Cases where the upstream spec has detail the coherence spec is intentionally silent on — these are not gaps, but boundaries:

- **Process Hub design Phase 2 migration** — legacy projects to General/Unassigned Hub. Coherence is silent; this is implementation-timing detail, not coherence concern.
- **`TimelineWindow` attachment point** — flagged for implementation review in Multi-level SCOUT §2.B. Coherence carries this forward; UI doesn't change, but schema lock affects Framing → SCOUT handoff.
- **ADR-071 still pending** — RACI spec proposes it as superseding ADR-015. Coherence cites RACI but doesn't hard-require ADR-071 acceptance.

### SuspectedCause vs Hypothesis terminology (ongoing reconciliation)

RPS V1 PR-RPS-1 (2026-05-09) renamed the entity `SuspectedCause` → `Hypothesis` with 5-state `HypothesisStatus`. The data model migrated cleanly. The **methodology + foundation docs** still use both terms, sometimes interchangeably, sometimes with distinct senses.

Current state (foundation docs not yet fully migrated):

- `docs/01-vision/methodology.md` Constitution P5: _"Multiple suspected causes are correct outcomes, not failures"_ — uses "suspected cause" as the principle name
- `docs/01-vision/methodology.md §"One Graph, Three Projections"`: lists `SuspectedCause + CausalLink + Finding + Question` as the investigation graph data structure — stale; should be `Hypothesis`
- `docs/01-vision/eda-mental-model.md §4.7` "SuspectedCause Hubs as Investigation Output" — uses "SuspectedCause hub" as the named-mechanism concept
- Constitution P5 entry-points: mentions "upfront hypotheses captured during FRAME" AND "Multiple suspected causes are correct outcomes" — mixing terms

**Coherence resolution: they are different lifecycle stages of one data entity, not synonyms.** An earlier draft of this section incorrectly stated "Hypothesis IS a suspected cause, same entity two names by layer" — that's only true at the data layer. At the methodology layer, **Question → Hypothesis → Suspected cause** is a sequence of artifacts playing different roles.

| Artifact             | What it is                                                                                    | Lifecycle role                            | Code representation                                                             |
| -------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| **Question**         | Open inquiry                                                                                  | Entry — the inquiry to answer             | `Question` entity                                                               |
| **Hypothesis**       | Testable proposal — what we _expect / want to investigate_                                    | Middle — being tested with evidence       | `Hypothesis` entity in `proposed` / `evidenced` / `needs-disconfirmation` state |
| **Suspected cause**  | Evidence-supported conclusion — what we _suspect contributes_ to variation; feeds improvement | End — post-evidence, drives IMPROVE phase | `Hypothesis` entity in `confirmed` / late `evidenced` state                     |
| **Finding**          | Pinned evidence (data / gemba / expert)                                                       | Throughout — collected against Hypotheses | `Finding` entity                                                                |
| **Ruled-out factor** | Negative learning — refuted Hypothesis preserved for audit                                    | End — what we checked and dismissed       | `Hypothesis` entity in `refuted` state                                          |

So at the **data layer**, there's one `Hypothesis` entity with 5 lifecycle states. At the **methodology layer**, "Hypothesis" and "Suspected cause" name **different lifecycle roles** — one is what you test, one is what you conclude.

**"Suspected cause" is methodologically opinionated:** plays the role "root cause" plays in other methodologies (the conclusion you address), but framing is intentionally different — multiple allowed, evidence-supported but not deterministic, contribution not causation (Constitution P5 + ESLint enforced). Don't migrate "suspected cause" to "Hypothesis" in methodology language; the term carries meaning the entity name doesn't.

**Investigation → Improvement loop:** confirmed/evidenced Hypotheses (= Suspected causes) FK-link into the IP's Section 4 (Investigation lineage). The IP's approach addresses the suspected causes.

**Foundation-doc cleanup needed (downstream, not coherence scope):**

- Update `methodology.md §"One Graph, Three Projections"` data-structure list to `Hypothesis + CausalLink + Finding + Question` (code-accurate); preserve "suspected causes are correct outcomes" principle phrasing
- Update `eda-mental-model.md §4.7` to clarify "SuspectedCause hub" = methodology concept naming a confirmed-Hypothesis-with-grouped-findings (the named-mechanism unit), not the entity name
- Constitution P5 phrasing: keep "Multiple suspected causes are correct outcomes" — this is the methodology principle (about lifecycle conclusion); semantically different from "multiple Hypotheses exist" (which is true at any lifecycle stage)
- UI vocabulary: lifecycle-aware labels — "Open questions" (Question entity), "Hypotheses you're investigating" (Hypothesis in proposed/evidenced/needs-disconfirmation), "Suspected causes" (Hypothesis in confirmed), "Ruled out" (Hypothesis in refuted) — same entity, different lifecycle-aware UI labels

### Memory + plan-file references

- **Plan file:** `~/.claude/plans/lets-reflect-on-what-calm-music.md` (approved 2026-05-14)
- **Coherence audit memory:** `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/project_coherence_audit_2026-05-14.md`
- **5-agent audit transcripts:** captured in plan file + memory; not in this spec (too long)
- **Reconciliation transcript (this section):** captured in plan file; not duplicated here
- **Feedback memories honored:** `feedback_step_back_for_system_design`, `feedback_full_vision_spec`, `feedback_drop_methodology_bridges`, `feedback_world_class_critique`, `feedback_honor_vision_commitments`, `feedback_hidden_vs_disabled_cta`, `feedback_process_owner_reality_chain`, `feedback_tier_gate_inside_surface`
