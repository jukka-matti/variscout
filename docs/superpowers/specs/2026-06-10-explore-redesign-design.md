---
tier: living
purpose: design
title: 'Explore redesign — chart-as-hero, the factor strip, and the condition loop'
audience: human
status: delivered
date: 2026-06-10
layer: spec
topic:
  [
    explore,
    ichart,
    factor-strip,
    eta-squared,
    conditions,
    scope,
    findings,
    capability,
    pareto,
    wedge-v1,
  ]
related:
  - docs/superpowers/plans/2026-06-10-explore-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
  - docs/07-decisions/adr-067-unified-glm-regression.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
  - docs/07-decisions/adr-088-level-native-contribution.md
  - docs/07-decisions/adr-089-retire-mode-lens-user-axis.md
implements:
  - docs/03-features/workflows/analysis-flow.md
  - docs/03-features/workflows/drill-down-workflow.md
  - docs/03-features/workflows/findings-hypotheses.md
---

# Explore Redesign — Design

**Origin:** the 2026-06-10 call-center user-testing walkthrough (owner-simulated improvement professional, 1,600×25 planted dataset) + a 12-agent grounding fan-out + an owner↔Claude design convergence session the same day. Every UX claim below was either observed live, grounded to `file:line`, or pressure-tested by a 4-persona comprehension panel (green-belt student / no-stats supervisor / Minitab black belt / executive sponsor — verdict: "legible to a mixed audience **with** the copy changes", all applied here).

**Canonical wireframe (named view, interactive):** [`docs/02-journeys/wireframes/assets/explore-redesign-mockup-2026-06-10.html`](../../02-journeys/wireframes/assets/explore-redesign-mockup-2026-06-10.html) — a self-contained HTML prototype computing every number live from a seeded dataset. It demonstrates the full loop end-to-end: chrome → hero → strip → model drawer → brush-band condition → membership view → capture → findings drawer → scope drill → within-condition recompute. Reviewer pairs verify built interactions against this file.

**Session record:** the grounded findings + decisions trail lives in `docs/ephemeral/investigations.md` (entries dated 2026-06-10: walkthrough cluster A1–D4, Explore sweep addendum, condition-primitive thesis + grounding correction, Pareto question-gating, Frame→Explore contract).

---

## §1 Problem (evidence, not vibes)

1. **Inverted information architecture.** Five stacked chrome strips consume ~24% of the viewport before any data; the default I-Chart plot band gets ~12%. Meanwhile the most decision-relevant number the product computes — per-factor share of variation (η², ANOVA, "Team 9.3% vs Weekday 1.2%") — is reachable only via maximize → carousel → factor tab: three unlabeled interactions deep.
2. **Affordance dishonesty.** Two silently dead controls ("Cpk stability", Analyze's "Model"), an unlabeled grid/scroll toggle that secretly holds the chart-room answer, a brush that selects and then offers nothing, CTA-styled text that isn't clickable.
3. **Marker chaos at scale.** n=1,600 → ~3,200 SVG nodes; four competing marker encodings; run-rule alarms fire on transactional row order (Monday clusters read as "process shift"). LTTB decimation is documented-as-shipped (ADR-039) but has no live call site.
4. **Trust paper-cuts.** Weekday order Fri-Mon-Thu-Tue-Wed; stage order non-chronological; histogram ignores set specs; the Stats panel shows no Cpk with specs set; finding cards show dataset-n instead of condition-n; What-If binds the wrong factor and recommends mean-worsening "best" scenarios.
5. **Buried machinery.** `FactorIntelligencePanel`, `EquationDisplay`, `BestSubsetsCard`, `InteractionPlot` already shipped inside the left PI panel behind unmet render conditions; `ProblemStatementScope` and `deriveConditionFromFindingSource` exist with zero live callers. **This redesign is substantially a re-homing and wiring of built things.**

## §2 Locked principles

1. **The chart is the room.** Chrome serves the chart, never the reverse. Two rows of chrome, total.
2. **A different question gets a different identity.** A chart is the answer to a question; if the question changes, the title, axis, and mark meaning visibly change. No silent "modes". (Generalizes ADR-089; convicts the Cpk toggle, the mode switcher, and the membership/magnitude strip variants alike.)
3. **Numbers are doors.** Every headline number opens the chart that explains it: Cpk → capability-over-time; a factor's % → its group comparison; a finding's n → its condition applied.
4. **Guidance ranks, the analyst decides.** The strip orders attention; status, causes, and conclusions stay analyst-owned (P5; "tool assists, analyst decides").
5. **Plain words on the surface, full rigor one click deep, nothing in between.** The persona panel's progressive-disclosure contract: the supervisor never needs the drawer; the black belt's trust lives entirely in it existing and being real.
6. **Commit is always explicit.** Hover = look; click = transient highlight; capture/scope = explicit commit. Nothing ever silently re-filters the surface.
7. **The condition is the noun** (internal vocabulary only — users keep seeing Finding / scope / segment). One predicate grammar (`ConditionLeaf`/`HypothesisCondition`) behind capture, drill, membership, hypothesis testing, What-If, and Control re-checks. Entity unification stays OUT of this spec (the queued entity-surgery brainstorm owns it); this spec only _wires what exists_.

## §3 Chrome consolidation (5 strips → 2 rows)

| Today's strip                                                    | Disposition                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header row (logo · 7 tabs · chips · tool icons)                  | **Stays — the only persistent row.** Compact one-row layout (today's sub-1024px responsive variant) becomes the default; tool labels go icon-only with tooltips.                                                                                                                                 |
| Tool strip (Stats/Findings/What-If row 2)                        | Merged into the header as icons. Findings icon carries a count badge.                                                                                                                                                                                                                            |
| Action strip (+ New analyze / Export .vrs / Edit framing)        | **Leaves Explore.** It is Process-tab canvas chrome per the CCJ spec; gate its mount to the Process tab (walkthrough finding D1). Export joins the context line; Edit framing is reachable via the measure/scope chip menu.                                                                      |
| Scope ribbon ("Explore scoped to…")                              | Deleted — pure duplication of the header's workspace + scope chips.                                                                                                                                                                                                                              |
| Stats strip (Factors(N) · x̄ · σ · n · Set specs · Time · Export) | Becomes the **context line** (row 2): `N calls · date range · x̄ · σ · Cpk · Filters` left; `Subgroup · Time · Stages · Export` lenses right. Cpk appears the moment a spec exists, red below target, **clickable → capability lens** (§4.3). The Factors(N) control retires into the strip (§5). |

The **scope bar** (§7) is a third, _conditional_ row that exists only while a condition is applied — it is state made visible, not chrome.

## §4 The I-Chart hero

### 4.1 Rendering at scale (sequenced AFTER the CC plan lands — CC-3/CC-4 touch the same files)

- **Prerequisite:** lift Nelson run rules 2/3 out of `packages/charts/src/IChart.tsx:173-179` to the full-data hooks layer; decimation under run rules computed post-decimation would corrupt them.
- Activate LTTB: pass chart width from `IChartWrapper/index.tsx:145` (+ Azure `ReportView` call site) into `useIChartData`'s existing decimation branch; replace the `chartWidth*2` threshold with a marker-aware policy. Amend ADR-039 + `packages/charts/CLAUDE.md` to match reality whichever way it lands.
- Marker policy: size-by-n (≥800 points → r≈1.4 quiet / 1.9 violations); violations-only emphasis (orange above USL); thin connecting line under the points; run-rule flags become **one digest chip** ("● 2 signals ▾") next to the title — never stacked banners. Run rules respect the Subgroup lens (day-subgrouping kills the Monday false alarms).
- Right-edge labels: UCL/USL/x̄/Tgt/LCL, computed, collision-nudged.

### 4.2 Brush = a condition-minting gesture

Brushing (x-range or y-band) shows the floating pill: `brushed: <cond> · n=… · x̄ in vs out · [✚ Capture finding] [view as condition →]`. Y-band brushes mint `between`/`gt` leaves (the probability-plot machinery's `anchorYMax` hints already anticipate this).

### 4.3 The capability lens (Values ⇄ Capability-over-time)

Not a mode — a different question with a different identity: title becomes "Capability over time · Cpk per <subgroup>", y-axis becomes Cpk with the 1.33 reference band, marks become subgroups. Entry points: the lens toggle (lights up when subgroup + spec exist; disabled state says what it needs) and **clicking the Cpk number in the context line**. Reuse/share the Cpk-trajectory rendering with Control's verification band (CC-4) — one component, two tabs.

## §5 The factor strip — "What explains the variation?"

The headline surface under the hero. Re-homes `computeMainEffects` / `FactorIntelligencePanel` from the PI panel.

- **v1 (instant): adjusted η² (ω²-style)** per candidate factor — level-count-penalized so cardinality can't fake rank: `adjusted = (SS_between − (k−1)·MS_within) / (SS_total + MS_within)` where `MS_within = (SS_total − SS_between)/(N−k)`, floored at 0. Continuous X's bin for display (the unified GLM handles them natively later).
- **v2 (model upgrade):** when two-pass best subsets completes, chips upgrade to **in-model ΔR²** (`perFactorDeltaR2`) and the **interaction chip** appears (set apart, dashed): `⚡ Team × Queue +6.2% — Team differences depend on the queue` — the conclusion ON the chip face (persona-panel R2 fix). Pattern label comes from `classifyInteractionPattern()` — never hardcoded (`ordinal`/`disordinal` only).
- **Honesty rules (non-negotiable):** parallel bars on a common scale, never stacked/pie (invalid decomposition — the settled multiplied-η² rejection); always-visible subtitle "…shares overlap, won't sum to 100%"; residual chip reads "everyday variation — not tied to these factors" with the residual explanation on hover; ★ says "largest share", never "strongest"; significance gates ★ and ordering ties, weak factors stay visible but gray (ruled-out is evidence); p/df/n per chip on hover; the link reads "How these % are computed (model & ANOVA) →".
- **Candidates seed, never gate (§13):** the strip screens ALL candidate factors; framing selection grants prominence; unselected collapse under "also screened (+N)". Y-derived columns (bins) are **excluded** from ranking against their source Y (provenance rule, §11).
- **What-if hover** per chip: "If all <factor> groups matched <best>: average, all N calls: x̄→…s · Cpk →… (reference 1.33)" with the "1 of k groups" bridge line — units always, the overall-average framing always. Permanent home for the math: `ProblemStatementScope.whatIfProjection` + `computeCumulativeProjection`.
- **Examined-state ✓** on visited chips (the completeness loop — un-examined factors are where retired `Question`'s value re-homed).
- Variants: **magnitude** (default), **within-condition** (recomputed under a categorical scope, retitled), **membership** (§7.3), **defect-rate share** (§12, per ADR-088 level-native contribution).

## §6 The model drawer — "The model behind the ranking"

One click from the strip link. Transient right overlay. Contents (all from the live engine; the GLM/QR solver needs SE/covariance exposure — the one real core addition):

1. Model summary (S/R²/R²adj/n) with the caption tying S to the residual chip.
2. Equation, reference-coded, largest terms first, with the guardrail caption ("group contrasts vs reference — how much this condition adds, not causes").
3. Full coefficient table (Coef/SE/t/p, significant bold).
4. ANOVA table (per-term SS/df/F/p + Error/Total), SS-type stated.
5. **Best-subsets ladder** — every candidate model its own fit, R²adj column, "✓ shown" row, hierarchical-screening note. This is the user's Minitab workflow (best subsets → reduce → check) rendered as the explanation of the strip.
6. **Predict-a-condition widget**: pick levels → fitted ± S vs observed cell mean ("check the equation").

The same drawer serves the Analyze tab's Model toggle (fixing its current no-op — AW-2 regression): one brain, two doors.

## §7 Conditions & the scope loop

### 7.1 Capture and apply

⊕ on any chart group / brush pill / composition bar mints a Finding whose condition is the `{column: levels}` ∧ range conjunction (existing `activeFilters` + `ConditionLeaf` shapes; compound two-key conditions from interaction/composition views). "View in charts" on a finding applies it as the scope: the **scope bar** appears (`⌖ Viewing condition: <cond> · n of N · × back to all data · Take it to Analyze →` — the Explore→Analyze handoff is persistent chrome here, not a toast, per the FSJ-10 owner call). Wires `ProblemStatementScope` (drill→PSS currently has zero live callers) and closes the spec'd crack: **the general (range) predicate→filter handoff**, not just categorical.

### 7.2 Per-chart tier defaults (resolves CS-3b Filter/Highlight/None)

- **I-Chart: Highlight** — full series in context, members lit (a filtered control chart of a y-band is statistical nonsense). Answers "when do they happen".
- **Boxplot/strip/histogram: Filter/compare** — within-condition recompute, ghost backdrop where useful.
- **Probability plot: the regime check** — within-scope straight line = one isolated regime; still kinked = another split hiding. (The owner's mixture-peeling method, formalized.)
- Click-a-group (tier 2) = transient cross-chart highlight, Esc clears, no state. Commit is always explicit (Principle 6).

### 7.3 Membership analysis ("What distinguishes these calls?")

For Y-range conditions, within-subset variance ranking is the wrong question (outcome-conditioned truncation). The strip flips to the **membership variant**: factors ranked by separation (Cramér's V or equivalent association vs membership), each chip showing its most over-represented group (`Queue — Billing ×2.8`). Clicking a chip renders the **composition view**: paired share bars per level, condition vs rest, lift annotation on the leader, ⊕ minting the compound condition. A **count ⇄ lift toggle** gives the classic Pareto reading in the same slot (§12).

### 7.4 Finding → Hypothesis (one question)

"What might cause this?" creates the hypothesis with: condition **inherited** (wire `deriveConditionFromFindingSource` into `createHubFromFinding` — currently uncalled; fixes Evaluate binding the brushed pseudo-factor), the finding auto-linked as first support, and exactly one prompt: **"Why do you think this happens?"** (the mechanism). Surface `connectFindingToHub` / `counterFindingIds` as "support / counts against" actions on finding cards (closes the logged no-affordance gap; coordinates with the AW redesign's evidence model — the Wall side of these flows belongs to that spec).

## §8 Drawer grammar + the Stats panel's retirement

Product-wide grammar (generalizing the Analyze tab's CS-14 pattern): **center = charts/canvas · LEFT drawer = evidence objects · RIGHT drawer = CoScout (Azure) + transient inspectors (the model drawer)**.

- **Findings drawer (left):** finding cards (condition chips · condition-scoped evidence "x̄ in vs out · n of N" · the **FindingStatus lifecycle chip** (observed → … — the Finding's own lifecycle, never the Hypothesis Suspected/Supported/Ruled-out vocabulary, which belongs to a different entity) · note · evidence-angle · support/counts-against/view-in-charts actions), a **Journal tab** (the session's auto-logged actions — relocated from the PI panel), Export `.vrs` + Take-it-to-Analyze in the footer. Cards stamp their Y; group by Y when several are tracked. Drawers **push, don't overlay** in the real build.
- **The left PI panel retires on Explore.** Its jobs are fully re-homed: summary → context line; Cpk → context line; equation/factor-intelligence/best-subsets → strip + model drawer; Journal → findings drawer; Data Table → an overflow item.
- **CoScout (Azure only, P8):** right drawer, surface-gated `explore` tools, reads scope + selected factor via REF markers, explains the strip; never sets status, never owns the workflow. The PWA shows the entry as an upgrade hint.

## §9 The Y-model (tracked · active · switchable)

- One **active** Y at a time (a surface answers one y=f(x)); `ProcessHub.outcomes[]` tracks many; per-measure specs via `measureSpecs`.
- The I-Chart measure dropdown is the honest **global Y-switcher** (it already calls `setOutcome`): grouped options — **Tracked outcomes** (with spec badges) first, then "other numeric columns"; picking a non-tracked one offers **"track this outcome?"** inline (which becomes the real "+ track another outcome" and severs the route into the Map-Your-Data wizard). On switch, everything re-binds, strip included. Findings stamp their Y.
- What-If reads `measureSpecs[outcome] ?? specs` and binds the analyzed factor (the B1 fixes), direction-of-goodness always derived from spec.

## §10 Probability lens & inflection binning

Keep the kink-detect → segment machinery; change the output's species: a committed segment is a **condition, not a factor** ("calls in the upper mode, > ~580s"). The follow-up CTA is "**what distinguishes these calls?**" → the membership strip. **Provenance rule:** a column derived from Y never enters the X ranking against that Y (the bin would explain ~100% by construction). The existing "Create bin column" persists as implementation with `derivedFrom` provenance.

## §11 Specs & direction-of-goodness

The spec popover stays (USL/LSL/Target/CpkTarget, per measure); add a one-line echo of the inferred characteristicType ("USL only → smaller is better") so the inference is visible. Spec lines render on **every** chart of that measure (I-Chart, histogram, boxplot reference) — today the histogram ignores them. `inferCharacteristicType` with empty specs must never produce a "best" recommendation (the What-If degenerate-preset guard).

## §12 Pareto is question-gated, not mode-gated

"Defect mode" decomposes into (a) **data-shape dispatch** — count/event-log Y auto-detected; `computeDefectRates` transforms BEFORE stats (untouchable boundary); Pareto takes a primary slot by right; the strip ranks by level-native defect-rate share (ADR-088) — and (b) **the count view as a question**, available on any data via conditions (§7.3's count⇄lift toggle). No user-facing mode switcher in the redesigned chrome; `AnalysisMode` persists as internal strategy state (its entity fate belongs to the entity-surgery brainstorm). No-modes ≠ one-stats-path.

## §13 The Frame/Process → Explore contract

1. **Candidates seed, never gate** (§5). The b0 auto-X seeding bugs (keyword-biased `slice(0,3)`, Weekday/Date_DayOfWeek dedup — D2) get fixed at ingestion but are no longer load-bearing.
2. **Vocabulary symmetry:** Process asks "what **might** be affecting it?" — the strip answers "what **does** explain it?" Same factors; say so in both surfaces' copy.
3. **Ownership split:** Process owns data identity + process semantics (steps, run order, goal, re-ingest, renames); Explore owns analysis attention (active Y, factor prominence, conditions); specs editable from both.
4. **Goal/target/spec unification:** spec = the measure's engineering limits; goal/AnalysisBrief.target = the project's improvement intent (lives with the Issue, feeds Report's "what we aimed for"); direction-of-goodness derives from spec, never prose.
5. **Steps → stages:** steps with a column mapping auto-bind the Stages lens; step-attributed X's get a step badge on their chips.

## §14 Cross-app & sequencing

- **PWA first** (it is the client-demo surface), Azure parity per component (most components are shared `@variscout/ui` — the Azure deltas are CoScout mounting and the What-If page's already-correct factor binding).
- **Collision guard:** §4.1 (I-Chart rendering) waits for the Control-closure plan to finish merging (CC-3/CC-4 touch the phase I-Chart). Everything else is parallel-safe.
- **Out of scope:** condition entity unification (entity-surgery brainstorm); the Wall's own surfaces (AW master plan); Control surfaces (CC plan); PWA durability (logged separately as the top first-session risk).

## §15 Decisions log (settled here)

| #   | Decision                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------- |
| D1  | Chrome = 2 rows + conditional scope bar; framing toolbar gated to Process tab; scope ribbon deleted                          |
| D2  | Strip v1 = adjusted η² (ω²-style); v2 upgrade = in-model ΔR² + interaction chip; copy per the persona panel                  |
| D3  | No stacked/pie decomposition ever; residual chip phrased "not tied to these factors"                                         |
| D4  | Pattern labels via `classifyInteractionPattern()` only                                                                       |
| D5  | Model drawer = shared surface for Explore link + Analyze Model toggle; core exposes coefficient SE                           |
| D6  | Per-chart condition tiers: I-Chart highlights, comparisons filter; commit always explicit (resolves CS-3b for Explore)       |
| D7  | Y-range conditions default the strip to membership (separation) — never within-subset η²                                     |
| D8  | Finding seeds hypothesis (never becomes); condition inherited via `deriveConditionFromFindingSource`; one mechanism question |
| D9  | Drawer grammar: left evidence / right CoScout+inspectors; PI panel retires on Explore; Journal moves in with Findings        |
| D10 | Y-switcher = grouped measure dropdown with inline "track this outcome"; wizard route severed                                 |
| D11 | Y-derived bins are conditions, not factors (provenance excludes them from ranking vs source Y)                               |
| D12 | Pareto question-gated; data-shape dispatch automatic; no mode switcher                                                       |
| D13 | Frame→Explore: seed-not-gate · vocabulary symmetry · ownership split · goal/spec unification · steps→stages                  |
| D14 | Capability lens = identity change + Cpk-number entry; shares the Cpk-trajectory component with Control's band                |

## §16 Open questions (deliberately NOT settled here)

- Which contrast the interaction annotation shows (within-team vs vs-other-teams') — pick at build, label it.
- The exact separation statistic for membership ranking (Cramér's V vs alternatives) — engine decision at build, displayed label stays plain ("separation").
- Condition entity unification + `AnalysisMode` persistence fate → entity-surgery brainstorm.
- The two-Y trade-off lens (factor hover showing effect on both AHT and CSAT) → future, after multi-Y ships.
