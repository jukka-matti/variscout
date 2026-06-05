---
tier: living
purpose: design
title: 'First-Session Journey — the altitude model, the landing, and the capture grammar'
audience: human
status: active
date: 2026-06-06
last-reviewed: 2026-06-06
layer: spec
topic:
  [
    first-session,
    journey,
    onboarding,
    landing,
    capture,
    findings,
    altitude,
    wireframes,
    process-tab,
  ]
related:
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
  - docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/superpowers/specs/2026-05-31-factors-evaluation-design.md
  - docs/superpowers/specs/2026-05-26-framing-layer-v2-master-plan.md
  - docs/07-decisions/adr-082-wedge-architecture.md
implements:
  - docs/02-journeys/flows/first-time.md
  - docs/02-journeys/flows/pwa-solo-investigation.md
---

# First-Session Journey — the altitude model, the landing, and the capture grammar

> **Active · 2026-06-06.** Brainstormed with the owner (live `--chrome` walk + visual-companion wireframes), grounded by 9 subagent explorations + a 3-lens adversarial panel (wizard-reality / product-UX / architecture), then stress-tested by a **5-persona panel** (trainer/student · defect QE · invited Member · Sponsor · process engineer) whose amendments are folded in (§1 applicability, §4.2a re-framing, §6 humanization). Owner-reviewed + approved 2026-06-06. Build phased P1–P4 (§9). Origin: `investigations.md` "PWA first-session journey — sample-data → Explore → first Finding is not smooth" (logged 2026-06-05, promoted here).

## §0 · The felt friction (what this fixes)

Demos and real first sessions start the same way: load data → see charts → try to capture what you notice → take it to Analyze. The owner's live walk (2026-06-05/06) confirmed the logged friction and located it precisely:

- The 7-tab workflow spine is invisible before data loads (`AppHeader.tsx` `hasData` gate) — no map of the journey.
- Landing in Explore skips orientation entirely; the first thing a user sees is an unsolicited stats banner (process-shift detection) whose only affordance is ✕ dismiss.
- **No visible capture invitation.** The Pin button renders only when filter chips exist (`ProcessHealthBar.tsx:599`); the Findings empty state instructs "click the pin button in the breadcrumb bar" **while no pin button is on screen** — the UI's own onboarding copy references an invisible affordance.
- The natural gesture — **brushing** — offers only `Clear | Create Factor`. No Finding path.
- "+ Add condition" on Wall hypothesis cards is an inert `<div>` with no onClick (`HypothesisCard.tsx:194`) — looks like a button, is a label (CS-12's two failed live attempts, explained).
- The Wall greets arriving users with "Write hypothesis" as if their captured Findings didn't exist.
- The paste path runs a wizard vestibule (`PasteScreen → ColumnMapping`) that the grounding panel verdict called "confirmation theater over decisions the engine has already made" — `detectColumns` writes Y/X to the store _before_ the modal renders (`usePasteImportFlow.ts:294-299`).

Root condition (owner): **"we have these different concepts, but they are not integrated and thought through holistically."** Five framing-concept generations coexist on one surface, each shipped coherently by a different initiative, never integrated (§2).

## §1 · The organizing frame: the altitude model

**One axis — altitude.** Every surface is a level of the same investigation:

```
L1 · System      — the Y and its health (Cpk, drift)          "what matters"
  ▼ zoom                                                      "where in the process?"
L2 · Process     — flow, timing badges, the bottleneck         ProcessMapBase + 8f viewport
  ▼ drill                                                     "this step"
L3 · Step        — the local mechanism: this step's Y/X        LocalMechanismView / AuthorL3View
  ▼ "See the data" (carries scope — CS-13)
Explore          — the data microscope, scoped to the descent  4 charts + drill filters
  ▼ brush / pin / point / engine signal
The condition    — the Finding: filters × window, factor-expressed
```

- **One grammar — engine proposes, analyst decides** — at every altitude: Y inference (b0), step-timestamp pairs (L2), mode detections, shift signals (Explore), best-subsets vital-few (Wall). The same chip/banner language top to bottom; the system never blocks with modals it can answer itself.
- **One unit — the Finding** — a condition captured at any altitude, filing **back up** to where it came from (`processLocation` join, investigation-surface spec §7), so the map deepens as you investigate.
- **One wrapper — the Untitled project** (§3) — always exists; ceremony is opt-in.
- **The landing rule (one sentence): no map → b0 · map → L2 · drilled → L3.** L1 is a zoom-out destination, never a cold landing — this matches the shipped scope gate (`detectScopeFromMap` routes on map nodes; a map-less L1 state doesn't exist in the router). Every first session therefore sees the framing surface: a raw paste lands at b0 as _confirm-the-proposals_ (engine-inferred Y/X pre-filled, one glance to fix); a curated sample lands at b0 as _here's-your-frame_ (fully confirmed, one click from "See the data"); The Bottleneck (once its map is seeded) lands at L2 with the bottleneck visible.
- **Applicability boundary (persona-panel amendment 2026-06-06): the rule governs FRESH data entry only** — paste, sample, manual, `.vrs` import. **Existing-project opens keep their current landing** (Dashboard → persisted view; `Editor.tsx:1109-1117`) — do not re-route the most common Azure collaboration entry. **Embed mode (`?embed=true`) is exempt** — it renders the requested chart, never the journey spine (its current Explore landing is accidental; the exemption must be explicit in P1). **`.vrs` imports route by the same rule against the _hydrated snapshot_** — a map-bearing scenario lands at L2 — and **reconstruct, never create**: the envelope's own project is the wrapper (name from the envelope; no fresh Untitled wrap; current `variscout.document` v1 envelope only — wedge no-back-compat, old `.vrs` versions are nobody's problem).

Framing (b0) is not a separate concept — it is "altitude not yet established." The Edit zones are not a separate concept — they are _authoring at a level_. The wizard dies because it stood outside the altitude model entirely.

Wireframe: [`altitude-model`](../../02-journeys/wireframes/altitude-model.md).

## §2 · Concept registry — the five generations, integrated

| Generation                                                               | Shipped via   | Role in the model                                 | Disposition                                                           |
| ------------------------------------------------------------------------ | ------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| LayeredProcessView 3-band (Outcome / Flow / Operations)                  | 2026-04-27    | Proto-altitude thinking                           | Superseded by L1–L3 (already true in code)                            |
| **L1–L3 levels-as-pan/zoom** (8f viewport)                               | PRs #160–#168 | **The spine** — State-mode altitude               | Keep; becomes the landing's destination                               |
| **CCJ Edit zones** (Palette ChipRail, drag-onto-steps, StepTimingsModal) | PRs #210–#231 | Authoring **at** L2/L3 — drag assigns a _place_   | Keep untouched; landing routes into it (step-timestamps banner, §4.3) |
| **FrameViewB0** question-led Y/X picker                                  | W3            | Framing before structure — click assigns a _role_ | Keep; **becomes the paste/sample landing** (§4)                       |
| ColumnMapping wizard (`PasteScreen → ColumnMapping`)                     | pre-CCJ       | Vestibule outside the model                       | **Demote to the "Fix data…" escape hatch; retire as primary path**    |

**Click-vs-drag continuity rule:** click assigns a _role_; drag assigns a _place_. At b0 there are no places yet — click only. Once structure exists (b1/b2), **the same chips** gain spatial meaning: draggable onto steps (step-bound X/Y feeding L3), re-bindable by drag, always writing the same store (`projectStore.outcome/factors`). The b0→b1 transition is the chips' world gaining geography, not a paradigm swap — and the transition affordance (connective-spec follow-up, line ~133) must _show_ the new draggability ("your factors can now be placed on steps").

## §3 · The unsaved-investigation model

Every data entry (sample, paste, manual, `.vrs` import) creates an **Untitled project** — auto-activated, in-memory, named after the sample when there is one ("Case: The Bottleneck"). The no-Project/Project mode split collapses into **unsaved vs. saved**. Ceremony (Charter, invites, signoff) stays opt-in and untouched — you never skip the project, you skip the ceremony.

- **The E1 T6 Process-tab gate dissolves** — there is always an active project; `NoActiveProjectGuidance` branches become unreachable on the main flow. (Amendment to the E1 T6 decision; its real rationale — canvas edits need a persistence home — is satisfied by the always-present project.)
- **IM-0a's Hub⟷Project 1:1 becomes total** (every hub always paired).
- **Durability is Word-style in Azure:** in-memory until first explicit save; **save nudge fires when the first Finding is saved** ("this session became worth keeping") — the primary protection; `beforeunload` guard when dirty is the backstop (native dialog; desktop-reliable; iOS-Safari-tab flakiness accepted — there is **no installed-PWA context by ADR-012**, browser-only). Corroborated by shipped code: Azure's `useNewHubProvision` already defaults to `'Untitled hub'`.
- **PWA unchanged per R6d:** the untitled project is in-memory; `.vrs` export _is_ its save; same nudge moments with "Export" verbs.
- Azure relocations: the analysis brief, goal narrative, and hub naming move **off the paste path** onto the project framing surface — they are Charter content miscategorized as ingestion (panel finding).
- **Name-before-invite (Sponsor-panel amendment):** the invite ceremony is exactly what makes a project visible to others — so the invite CTA gates on an explicit save + non-default title. A Sponsor never opens a project called "Untitled," and never reads an unsaved in-memory document whose loss they couldn't see.
- **Hubs share the Word-style story:** `useNewHubProvision` today eagerly persists the hub on creation (vestibule-era path) — reworked in P1 so the Untitled pair (hub + project) has one in-memory-until-save durability story, keeping IM-0a's total 1:1 consistent.
- **The save/export nudge fires on the user's _own_ first capture** — an imported scenario's trainer-authored findings don't trigger it (classroom reality: session-only is the communicated contract; the nudge is one calm line, single-fire, dismissible).
- Doc amendment: OVERVIEW's "Project — the optional formal wrapper" reframes to _ceremony is optional_.

## §4 · The landing

Fresh data lands on the **Process tab at the altitude rule** (§1). The wizard never renders on the primary path.

### §4.1 · b0 landing (no map yet) — wireframe: [`b0-landing`](../../02-journeys/wireframes/b0-landing.md)

The shipped `FrameViewB0` composition (question-led: _"What do you want to investigate?" / "What might be affecting it?"_, sparkline Y chips, selected-above-available X chips, inline spec editor, process-steps expander, _"See the data →"_), arriving **pre-filled by inference**:

- **Top Y pre-selected with top-3 sibling candidates visible** (`rankYCandidates` already ranks; never bury the choice — a wrong pick is one glance + one click to fix).
- **Provenance line**: "Pasted · 800 rows · 6 columns · 0.4% missing" — see the inference, don't trust it blind. (P2: per-candidate quality strip — %-missing, distinct count, inline distribution — data already in `ColumnAnalysis`.)
- **No-numeric-Y guard:** when `rankYCandidates` returns empty (all-categorical paste), port the `OutcomeNoMatchBanner` ("I expected the outcome to be \_\_\_" + skip) into the no-Y b0 state — never a permanently disabled CTA.
- **Multi-outcome guard (resolved → "+ track another outcome"):** the landing keeps its one-question clarity (single-Y); a quiet **"+ track another outcome"** link beneath the Y section gives the multi-Y minority wizard parity in one tap — the first-selected Y stays the lead for Explore. (For defect data the real "multiple outcomes" are derived metrics, not columns — see §4.2a.) Must land **before** the wizard demotes (guarded regression).
- **"Fix data…" hatch** = the demoted ColumnMapping, for messy pastes (title blocks, units rows), the wide-stack's two un-inferable name fields, and manual type overrides. It must **auto-surface when inference confidence is low** and must **not wipe `rawData` on cancel** (today's `handleMappingCancel` does — hostile; fix in P1).
- Sample and paste land on **one path** (today samples skip mapping and paste doesn't — accidental fork removed). Demo-featured samples (The Bottleneck first) get **seeded `processMap` configs** — the machinery exists in `loadSample`; only `analyze-showcase` uses it.

### §4.2 · Detection tiers — one system voice

| Tier                                                  | Detections                                                                                                          | Surface                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Quiet chips** (cosmetic, auto-applied + undoable)   | time-column + time-component extraction; type coercion; renames                                                     | dismissible inline chip: "Dates detected in Timestamp — added Day of Week + Month. Adjust ▾"      |
| **Loud banners** (unit-of-analysis; confirm-not-auto) | defect event-log (`detectDefectFormat`) · wide/multi-channel (`detectWideFormat`) · **step-timestamp pairs** (§4.3) | top-of-b0 proposal banner with one primary action; pre-computed `suggestedMapping` is the payload |

Rationale (panel): in a stats tool a wrong unit of analysis silently produces a _confident, meaningless chart_ — interpretive failure, invisible. "Never modal" holds; "never interrupt" does not, for unit-of-analysis. The existing detection modals (`PerformanceDetectedModal`, `DefectDetectedModal`, `CapabilitySuggestionModal`) retire into this grammar.

### §4.2a · Mode detections re-frame b0 — they never bypass it (persona-panel amendment 2026-06-06)

b0 as shipped is a _measurement-data_ surface; event logs and wide channel data break it (the QE panel verdict was **breaks**: empty Y picker + disabled CTA under a blocking defect modal; the process-engineer panel: "pick one of 8 indistinguishable channels" with siblings polluting the X list, and the wide banner not wired into the b0 path at all). The fix is one principle: **a unit-of-analysis detection renders its banner _above_ the picker, pre-empting any wrong pick, and accepting it re-frames what b0 frames:**

- **Defect event-log → accept sets `analysisMode='defect'` and the derived `DefectRate`/`DefectCount` becomes b0's pinned Y** (today the transform output is Dashboard-local `effectiveData` and never reaches b0's `rawData`-derived candidate list — that plumbing seam is named in §8). The Y question becomes a **derived-metric picker** (Count vs Rate, per `paretoYOptions`) — the honest "multiple outcomes" of defect data. **Honesty note:** defect confirmation carries real role decisions (type/count/result/units-produced — units often un-inferable from event logs); it is a short pre-filled confirm sequence, not a one-tap banner. Pretending otherwise would rebuild the vestibule as a chip.
- **Wide/multi-channel → accept sets `analysisMode='performance'` + `measureColumns`** — per-channel Cp/Cpk is a distinct surface, **not** multi-Y; never route it through the "+ track another outcome" path. **Channel siblings leave the Y and X candidate lists** (an 8-way tie at base score across pattern-matched siblings _is_ the "no single Y exists" signal — surface it, don't pick `Head_1`). The **stack** (unpivot-to-long) is the _secondary_ disposition ("or combine into one measure"), hosting its two un-inferable name fields in the chip expansion or the hatch.
- **No-Y floor is P1, not deferred:** the `OutcomeNoMatchBanner` port (§4.1) is the generic floor for _any_ all-categorical paste, detection-flagged or not.
- **No worst-combo interim:** P1 routes measurement-shaped pastes to b0; defect/wide-shaped pastes **keep today's modal path until P2 lands the re-framing banners** — never an empty-Y b0 underneath a blocking modal.
- **Step-timings can't false-positive on channels** (verified): pair detection requires date-kind `_start`/`_end` columns; numeric `Head_N` + one timestamp cannot trigger it.

### §4.3 · The step-timestamps chain — wireframe: [`step-timings`](../../02-journeys/wireframes/step-timings.md)

Multi-time-column pair shape (`Prep_start`+`Prep_end`, …) becomes the fourth detection (loud tier): _"These look like step timestamps — 3 start/end pairs detected. Build the process model from them?"_ Accepting routes into the **shipped** `StepTimingsModal` (By step / By column, pair pre-fill with auto-detected markers, single-duration alternative) → steps materialize → timing badges → `Lead_time`/`Total_work_time`/`Wait_time` derive → **land at L2 flow view** where the bottleneck is visible before any chart opens. Detection cost: lift the pair-regex already written in the modal's pre-fill into core detection. This gives the b0→b1 transition its most natural trigger.

## §5 · The capture grammar — wireframe: [`capture-card`](../../02-journeys/wireframes/capture-card.md)

**One draft card, four ways in.** Every capture gesture opens the same pre-filled Finding card — **condition + auto-computed evidence contrast + optional note** — converging with the Wall's shipped `BrushToFindingFlow` rather than adding a parallel grammar. A Finding _is_ "a bookmarked filter state with analyst notes" (`core/findings/types.ts:468`); the UI finally says so.

| Entry                                                              | Condition pre-fill                                     | Factor behavior                           |
| ------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------- |
| **Pin** (filter chips active)                                      | the active filter set — `Step=2 × Shift=Night`         | reuses existing factors                   |
| **Brush** (I-Chart range)                                          | window — `obs 32–58`; **composes** with active filters | **mints a derived in/out factor on save** |
| **Point at a chart** (boxplot category, I-Chart point, Pareto bar) | that anchor — `Step=2`                                 | reuses existing factors                   |
| **Engine detection** (shift banner → signal chip)                  | the detected condition — `before/after obs 60`         | mints the changepoint factor on save      |

**The rule that unifies it: a Finding's condition is always expressed in factors.** Gestures that point at existing structure reuse it; gestures that _carve_ new structure (brush range, detected changepoint) mint a derived factor — which is what plugs the Finding into the Wall's derived-edge machinery (CS-12 derives hypothesis edges from `Finding.context.activeFilters`) with zero new wiring concepts.

Brush specifics (owner-locked):

- **Brush is intent, not exploration** — it selects points (no zoom semantics); the card opens directly on release (pure option C, no intermediate popover). `Esc`/click-away cancels cleanly.
- Two actions: **Capture** (primary: finding + minted factor) / **Factor only** (secondary: data-shaping, no observation claimed). The proposed factor name is shown, editable.
- Factors mint **on save**, auto-named from the condition, tagged _derived_, deletable with the finding (orphan-factor cleanup offered).
- **The chart remembers:** saved windows render as subtle bands on the I-Chart — captured findings stay visible where they were found and double as tap-targets.
- I-Chart only in V1; one range per finding (disjoint multi-range YAGNI).
- Engine detections become **proposed findings**: the process-shift banner shrinks to a compact signal chip with a **Capture** action (and stops eating vertical space). Deterministic engine proposes; analyst decides.
- The Findings empty state teaches the actual grammar: _"Brush a range, pin your filters, or capture a detected signal."_ The pin stays chip-gated (correct — no filters, no filter-state to pin; three other entries cover the zero-filter moment). Point-at-chart gets a visible affordance; right-click stays as the shortcut.
- **Mobile (resolved): tap-capture only** — pin, point-at-chart, and engine chips work on touch unchanged; **brush is desktop-only in V1** (touch-brush revive trigger: evidence of mobile-first analysis sessions); the card renders as a **bottom sheet** on small screens (the established mobile pattern here).
- **Performance mode:** point-at-chart captures per-channel via the cross-channel boxplot (`FindingSource.category` = channel label). The per-channel Cpk _scatter_ has no `FindingSource` variant — **capture is not offered there in V1** (a new variant is deferred, revive on demand; do not silently overload an existing variant).

## §6 · Crossing up — the Analyze handoff and the status ladder

- **Findings-forward Wall arrival** — wireframe: [`wall-arrival`](../../02-journeys/wireframes/wall-arrival.md). With findings present, the Wall's empty state shows _your captured conditions as evidence waiting to be explained_ ("You've observed: [obs 32–58 elevated]. What do you suspect causes these?") — one tap promotes a finding's factor into a hypothesis hub. Plus the **afterglow**: saving a Finding shows a one-time "Take it to Analyze →" on the confirmation. Both paths land identically.
- **The status ladder.** The five `HypothesisStatus` values are untouched (settled enum; feeds Report composition via `groupHypothesesByStatus`). Presentation changes from a flat dropdown to the epistemic ladder it is: `Proposed → Evidenced → Needs disconfirmation → Supported / ↘ Refuted`, one-line teaching microcopy per rung ("Supported — survived an attempt to break it"). **Gestures drive status; the dropdown becomes the override** — suggested transitions surface as proposal chips ("3 supporting findings — mark Evidenced?"). Analyst-owned status survives intact (CS-10); first-session users meet the ladder one rung at a time.
- **Crossing back down:** "explore this factor" (CS-13) carries scope to Explore. Known gap, named: on PWA the Explore **chart mirror is deferred** (`lv1-pwa-mount`) so re-scoping isn't yet visible in the charts — a journey dependency, not silently absorbed.
- **The Report humanization boundary (Sponsor-panel amendment 2026-06-06).** `ReportView` renders `finding.text` **verbatim** in Summary mode today — brush-primary capture would put _"Brushed indices 32-58 on Day_of_Week"_ in front of an executive. Two gates: (1) raw `finding.text` / auto-minted factor names never render on the executive Report path — they pass through a condition humanizer ("Day-of-Week, observations 32–58") or the analyst's edited label; (2) **promotion requires a plain-language hypothesis name** — "What might cause this?" prompts for it; an auto-derived factor name (`obs 32–58 in/out`) never becomes a hypothesis title unedited, because hypothesis names ARE the Sponsor's primary read (`ipReport` narrative rows). §7's "Report composition untouched" is amended: _composition logic untouched; display names humanized at the Report boundary._

## §7 · Scope fences + guarded regressions

**Named but not touched:** Home session owns the populated launchpad + Azure arrival (this spec owns the empty landing end-to-end; Home inherits it locked). CS-P2…P5 build the §2A per-step capability view (this spec routes to it). CoScout / #12 Control / Project-tab sessions fully separate (overlap analysis 2026-06-05: no forcing design object). Second-paste **match-summary/provenance cascade untouched** — re-ingestion ≠ first-session; it keeps its own entry (a Member pasting into a shared project hits that cascade, never this landing). The §5.4 projectStore↔ProcessMap store seam stays un-reconciled per the connective spec. `HypothesisStatus` enum + Report composition logic untouched (display names humanized at the boundary, §6). Manual entry (already bypasses the wizard — existence proof for the design; lands its typed grid on the same b0 afterward), embed mode (exempt per §1), `.vrs` envelope unchanged.

**Load-bearing dependencies named (persona panel):** the **Sponsor ACL gate** (`IPDetailPage` routes sponsors to a Report-only branch — the _only_ reason authoring voice and capture gestures never reach the read-mostly role; a future routing change must not silently breach it). The **PendingInvitesBanner mounts in Editor chrome** (component lives under `ui/.../Home/`) — noted so the Home fence is accurate. The **invite→durable-membership seam** (accepting an invite is in-memory-only; durable cross-session access requires the Lead's save) belongs to the Home/collaboration session — logged in `investigations.md` with the `acceptInvite` silent-no-op bug.

**Guarded regressions:** b0 single-Y vs wizard multi-outcome (§4.1 — close before demoting); no-numeric-Y stranding (§4.1); `handleMappingCancel` rawData wipe (§4.1); defect/wide must stay confirm-not-auto (mode transforms run before stats); paste currently has **no row-count guardrail** (file upload does) — close uniformly with a non-modal banner.

## §8 · Architecture notes

- **Writer collapse, stated precisely:** one _interactive_ writer of `projectStore.outcome/factors` (the b0 picker) + seed writers (ingestion paths). Today three surfaces race through the same store actions (paste autodetect, mapping-confirm, b0 picker — mutually exclusive in time only). This strengthens connective-spec seam #3, whose stated invariant is already "the b0 picker is the only writer." **Defect-mode exception, named:** in defect mode the session outcome is owned by `defectResult.outcomeColumn` (the transform output, Dashboard-local today) — §4.2a's re-framing requires plumbing it into b0's candidate source (`columnAnalysis` is `rawData`-derived and mode-blind); until then "one interactive writer" holds for measurement modes only.
- Inference relocates nowhere: `detectColumns` / `rankYCandidates` / `detectWideFormat` / `detectDefectFormat` live in `packages/core` and are already called by `CanvasWorkspace` independently of the wizard.
- Azure twin (`useEditorDataFlow`, ~600 LOC, superset: hub provisioning + brief + Stage-3 confirm) mirrors the PWA reducer — **phase per-app, PWA first; never one cross-app PR**.
- E2E: ~25 `confirmColumnMapping` call sites rewrite — budgeted first-class, not cleanup.

## §9 · Phasing (no throwaway; decreasing reversibility)

- **P1** — route _measurement-shaped_ paste/sample → Process-tab landing (altitude rule; defect/wide-shaped pastes keep today's modal path until P2 — no worst-combo interim); `.vrs` import routing + embed exemption; demote wizard to "Fix data…" hatch (demote ≠ delete); Untitled-project auto-create + auto-activate (+ the hub eager-persist rework); no-Y `OutcomeNoMatchBanner` port; seeded process maps for demo-featured samples; fix the rawData-wipe.
- **P2** — detections → chips/banners that **re-frame b0** (§4.2a: defect derived-metric picker · performance `measureColumns` + sibling exclusion · time · step-timestamp pairs); retire the detection modals; PWA first, Azure mirror second.
- **P3** — capture card + brush-mints-factor + engine-signal capture + chart bands (mobile = tap-capture, bottom sheet); findings-forward Wall + afterglow (promotion prompts a plain-language hypothesis name); Report humanization boundary; status-ladder presentation; save nudge (own-capture rule) + `beforeunload` guard; name-before-invite gate.
- **P4** — writer collapse (defect-mode seam plumbed); wizard retirement from the primary path (hatch remains); E2E spine rewrite.

## §10 · Success criteria

1. Clean paste → charts in ≤2 interactions (land pre-filled → "See the data").
2. A first-time user captures a Finding in their first session **without instruction** — any of the four gestures, all roads to one card.
3. The journey teaches the loop: land at altitude → descend → capture → the Wall explains → cross back.
4. No silent loss: nudge at first Finding; close guard when dirty.
5. Wrong inference is one glance + one click to fix — never a dead end.

## §11 · Doc propagation + process integration (Apply phase, per-initiative)

This spec is the first application of two process rules adopted 2026-06-06 (owner):

1. **User-facing specs embed wireframes.** Canonical named-view wireframes live at `docs/02-journeys/wireframes/` (one doc per view, `tier: living`, edited in place as views evolve; specs link, never restate). Reviewer pairs on user-facing tasks verify the built interaction against the wireframe.
2. **Journey ↔ view ↔ component traceability.** `docs/02-journeys/traceability.md` gains a **View** column; journey flow steps name the view they happen on.

At delivery (Apply phase — per-initiative, not batch): rewrite `docs/02-journeys/flows/first-time.md` as this journey's L2 home (current draft references the removed Yamazumi mode — fossil evidence of the lapsed Apply discipline); update `pwa-solo-investigation.md` + traceability rows; fix OVERVIEW's stale "§3.0" citation + lingering 4-verb spine; amend the E1 T6 decision (gate dissolved) + wedge "optional wrapper" framing; decision card committed with this spec.

## §12 · Open questions

**Resolved 2026-06-06 (owner Q&A + 5-persona panel — trainer/student · defect QE · invited Member · Sponsor · process engineer; 4× holds-with-amendments, 1× breaks→fixed by §4.2a):**

- ~~b0 multi-outcome~~ → **"+ track another outcome"** link (§4.1); defect's real multi-outcome is the derived-metric picker (§4.2a).
- ~~Mobile ergonomics~~ → **tap-capture only; brush desktop-only; bottom-sheet card** (§5).
- ~~`beforeunload` on installed PWAs~~ → moot: **no installed-PWA context exists by ADR-012** (browser-only); iOS-Safari-tab flakiness accepted, nudge is the primary protection (§3).
- ~~L1-as-landing richness~~ → dissolved: **the rule is no map → b0 · map → L2**; L1 is a zoom-out destination only (§1).

**Still open:**

- A `FindingSource` variant for the per-channel Cpk scatter — deferred, revive on demand (§5).
- Trainer-pinned student entry surface (`.vrs` doesn't serialize `viewState`, so a scenario can't open _on the Wall_ where the trainer intended) — a real education-funnel enhancement; route to a future education/trainer session, not this build.
- The defect confirm-sequence's exact UI (how the pre-filled role decisions present inside the banner expansion) — P2 design detail, wireframe before build per §11.
