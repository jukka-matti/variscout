---
tier: living
purpose: design
title: 'Analyze/Wall legibility — suspected-cause cards, triangulated evidence, the causes matrix'
audience: human
status: active
date: 2026-06-07
layer: spec
topic:
  [analyze, wall, hypothesis, suspected-cause, evidence-angles, causes-matrix, legibility, wedge-v1]
related:
  - docs/07-decisions/adr-086-unified-investigation-canvas.md
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
  - docs/superpowers/plans/2026-06-03-cs-10-analyst-owned-status.md
  - docs/02-journeys/wireframes/suspected-cause-card.md
  - docs/02-journeys/wireframes/causes-matrix.md
  - docs/02-journeys/wireframes/wall-arrival.md
implements:
  - docs/03-features/workflows/analyze-wall.md
  - docs/03-features/workflows/investigation-surface.md
  - docs/02-journeys/flows/pwa-solo-investigation.md
---

# Analyze/Wall Legibility — Design

**Origin:** the 2026-06-07 FSJ-10 collaborative chrome walk. The owner — the product's own methodologist — did not recognize "MECHANISM BRANCH · PROPOSED" on a hypothesis card. The Wall rendered microscopic on cold start; the missing-evidence band leaked an internal codename; the "Diverging" chip sat unexplained in an empty sidebar; there was no way to see all hypotheses at a glance. Walk findings: investigations.md entries [LOGGED 2026-06-07].

**Calibration target (owner call):** every user-facing element of the Analyze surface must be legible to a **first-session user with zero training**. Methodology depth moves to tooltips/CoScout — never load-bearing on labels.

**Method note:** every decision below was grounded against code + canon by a 4-reader fan-out and adversarially reviewed; three decisions changed materially under grounding (D1 from enum-change to presentation mapping; D2 from net-new model to reviving a dead built rule; D4 from new-toggle-taxonomy to ADR-086's specced matrix lens).

## §1 Decisions

| #      | Decision                                                                                                                                                                                                                                                                                                                                                   | Grounding anchor                                                                                                                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | Hypothesis status displays as **3 states** (Suspected / Verified / Ruled out) via a presentation mapping; the stored 5-value `HypothesisStatus` enum is **untouched**                                                                                                                                                                                      | `findings/types.ts:645-650`; serializer hard-throws on unknown status (`analyzeSerializer.ts:54-62`); Report keys on 5 states (ADR-090)                                                                                                                                                 |
| **D2** | Evidence renders as **typed angle facts** — 📊 data / 👁 gemba / 💬 expert. Build = revive the dead breadth rule: an `evidenceType` picker at capture/edit                                                                                                                                                                                                 | `FindingEvidenceType` exists (`types.ts:460`); breadth+survived rule exists (`survey/wall.ts:37-48`); hard default `'data'` with no param (`factories.ts:54`) and `editFinding` is text-only (`analyzeStore.ts:88`) — no setter anywhere                                                |
| **D3** | User-facing label: **"Suspected cause"**. `Hypothesis` stays the code/glossary entity. Default-name minters stop saying "mechanism"                                                                                                                                                                                                                        | P5-approved replacement (`.claude/INVARIANTS.md`); minters at PWA `AnalyzeView.tsx:323,328` + Azure mirror reach Report verbatim                                                                                                                                                        |
| **D4** | All-causes overview = the **causes matrix**, implementing ADR-086's "ACH matrix lens" as a third `viewMode` value (**type widening**: the union at `canvasViewportStore.ts:58` is closed `'map' \| 'wall'` today — widening touches the union, `setViewMode`, and the serializer snapshot shape at `:293/:316`). One canvas, two lenses (spatial / matrix) | ADR-086 §Decision; `canvasViewportStore.ts:58,152,293,316`; gated on D2 (angle columns need data)                                                                                                                                                                                       |
| **D5** | Wall **fit-to-content**: content bbox over `wallLayout` positions drives the populated viewBox + a Fit control. **Snap-river deferred**                                                                                                                                                                                                                    | No bbox math exists for the populated Wall (`WallCanvas.tsx:369-370,1306-1313`); cold-start crop is zero-hub-only                                                                                                                                                                       |
| **D6** | Every card/row gets an **activity layer**: run-now checks = buttons; **in flight = evidence being collected** (MeasurementPlan rows); **stalled** detection                                                                                                                                                                                                | `MeasurementPlan` method/owner/status exist (`measurementPlan/types.ts:7-12`); glossary "Measurement Plan" = the DCP loop                                                                                                                                                               |
| **D7** | The **"Diverging" chip retires** from chrome. The `AnalyzePhase` model survives untouched as CoScout's compass                                                                                                                                                                                                                                             | Phase derives from FindingStatus only (`buildAIContext.ts:623-639`); CoScout consumes it; badge mounts in **5 production sites** (PWA `AnalyzeView:552`, Azure `AnalyzeWorkspace:1099`, ui `AnalyzeSidebar:111`, `FindingsWindow:327`, `CoScoutInline:117`) + test stubs that must stay |

## §2 The card

Canonical wireframe: [`suspected-cause-card`](../../02-journeys/wireframes/suspected-cause-card.md) (+ HTML assets). Four layers:

1. **Kicker + state** — "Suspected cause" + one of _Suspected / Verified / Ruled out_. Display mapping: `proposed | evidenced | needs-disconfirmation → Suspected`, `evidence-survived-test → Verified`, `refuted → Ruled out`. The display-label maps to update: `HypothesisCard`/`MobileCardList`/`HypothesisCardWithPlans` STATUS_KEY, `ReportImprovementSummary` badges, `ConclusionCard` HUB_STATUS_DOT, `HubCard` STATUS_STYLES. (`charts/SynthesisLayer.getStatusColor` maps the **stored** enum to chart colors — NOT a display-label site; no change under D1.)
2. **The cause statement** — plain language; hub names mint as "New suspected cause" / "Suspected cause: {factor}" (both apps).
3. **Typed evidence facts** — the three angles with misses gray; the ⚠ gap names what's missing: angles ("one angle only — go look / ask") and severity ("never tested"). This **replaces the status-ladder explainer card** and absorbs the per-card half of the missing-evidence story; the digest bar below the canvas stays as the secondary list (river spec's original intent) with the tagline rewritten in plain language.
4. **Activity layer** (§5).

The internal 5 rungs stop being _taught_ and become _facts_: "has evidence" is the visible findings row; "needs disconfirmation" is the visible ⚠ never-tested gap + the Try-to-break-it affordance. The analyst-owned settle (CS-10) is the only state-changing act; the Verified chip suggestion (breadth ≥2 angles AND a survived attempt — `deriveHypothesisStatus`, unchanged) stays advisory and never auto-applies.

## §3 Status semantics (what each displayed state claims)

| Displayed     | Stored values                                    | Claim                                                              |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| **Suspected** | `proposed`, `evidenced`, `needs-disconfirmation` | Named; possibly evidenced; **not yet survived a break attempt**    |
| **Verified**  | `evidence-survived-test`                         | ≥2 evidence angles + survived a deliberate disconfirmation attempt |
| **Ruled out** | `refuted`                                        | Counter-evidence overturned it — a first-class good outcome        |

LSS alignment: this is the practitioner-standard _suspected → verified / eliminated_ model (cause-verification matrix), with VariScout's two additions on top: **triangulated angles** (qualitative evidence is first-class grounds, not garnish) and **severity** (Verified requires surviving an attack, not accumulating support).

## §4 Evidence angles

- `Finding.evidenceType: 'data' | 'gemba' | 'expert'` — exists today, required, hard-defaulted to `'data'` with no setter. Build: an `evidenceType` param on `createFinding` + `analyzeStore.addFinding`, an `editFindingEvidenceType` action, and a **3-value angle picker** on the capture/edit card.
- Explicitly NOT: a new `FindingSource` variant (angle ⊥ chart origin); NOT the 4-value `CausalLink.evidenceType`; NOT `MeasurementMethod` (the how-to-gather axis); NOT hub comments. Breadth reads `Finding.evidenceType` only (existing `evidenceTypesForHypothesis`).
- Manual gemba/expert capture path: the existing no-data disconfirmation flow + a finding-capture variant for qualitative observations (picker pre-set to gemba/expert).

## §5 Activity layer — "are we actively analyzing this?"

Status is epistemic; activity is operational. The card and matrix answer both.

- **Run-now checks** (existing data): immediate buttons ("Answerable now: Shift × CycleTime → Check it"), never listed as plans.
- **In flight** = evidence being collected: a projection of linked `MeasurementPlan`s (`Planned`/`In progress`, with method icon, owner, due, optional n/N progress) + pending `DisconfirmationAttempt` verdicts. The Measure⇄Analyze loop closes visibly: pasted data matching an open plan (factor + window) auto-suggests the link; accepting completes the plan and lights the angle.
- **Stalled** = unsettled AND run-now checks exhausted AND no open collection plan AND quiet ≥ N days (default **N=5 working days**; constant, not configurable in V1). Amber treatment + three escape actions: _Plan a check / Go look / Rule it out_.
- Derivation is pure/render-time; no new stored state.

## §6 Views — one canvas, two lenses

Per ADR-086 the Evidence Map and the Wall are projections of ONE bipartite canvas; CS-12 already shipped the factor glyphs + derived edges + DOI dimming onto the Wall. This spec adds the **matrix lens** ADR-086 named: the [`causes-matrix`](../../02-journeys/wireframes/causes-matrix.md) — rows = suspected causes; columns = 📊/👁/💬 · break attempts · **In flight** · verdict; digest line for the Sponsor scan. Read-only projection; row click focuses the Wall card.

Pragmatics: `causes` is **added** to the `canvasViewportStore.viewMode` union (today closed at `'map' | 'wall'` — the widening touches the union type, `setViewMode`, and the serializer snapshot shape at `canvasViewportStore.ts:293/316`). The target union is `'map' | 'wall' | 'causes'` **regardless** of the `map` slot's fate — `map` is interim pending the logged post-demo "does the Evidence Map survive post-Model-B?" decision, and retiring it later shrinks the union without moving `causes`.

## §7 Wall viewport ergonomics

Benchmark: Miro/FigJam **navigation primitives only** (Model C whole-app canvas stays rejected). V1 scope:

- **Fit-to-content by default**: compute the content bbox over `wallLayout` position arrays (hubs, findings, factor glyphs, scope anchor) and drive the populated-Wall viewBox from it — extends the existing zero-hub `coldStartViewBox` crop to the populated case. Kills the microscopic cold start (demo blocker).
- **Fit control**: wire the existing `useWallKeyboard` `F` stub + a visible ⌖ button; both apps (today neither passes `onFit`).
- Fit must work with zero process-map bindings (orphan hubs parked).
- **Deferred**: Snap-river re-layout (depends on optional processMap tributary ordering) → follow-up; the never-built right narrator rail stays a non-goal here.

## §8 Vocabulary changes

| Surface                                                                                                                                                                                                                                                                                                                                         | From → To                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `wall.card.hypothesisLabel` (+ `ariaLabel`, `empty.*`, `canvas.ariaLabel` — 5 keys × 32 catalogs)                                                                                                                                                                                                                                               | "Mechanism Branch" → "Suspected cause" family                                                                 |
| `wall.status.*` display strings — **value updates, not key renames** (the "Verified" target is the existing key **`wall.status.confirmed`**, value "Supported" → "Verified"; `wall.status.proposed`/`evidenced`/`needsDisconfirmation` values → "Suspected"; `wall.status.suggestSupported` value rewords "mark Supported?" → "mark Verified?") | Proposed/Evidenced/Needs disconfirmation → "Suspected"; Supported → "Verified"; Refuted → "Ruled out"         |
| Hub-name minters (PWA `AnalyzeView.tsx:323,328` + Azure `AnalyzeWorkspace.tsx:946,950`)                                                                                                                                                                                                                                                         | "New mechanism branch" / "Suspected mechanism: {f}" → "New suspected cause" / "Suspected cause: {f}"          |
| `wall.empty.writeHypothesis` (currently "Write a suspected mechanism")                                                                                                                                                                                                                                                                          | → "Add a suspected cause" (keeps CTA + minted hub name consistent)                                            |
| `wall.missing.tagline`                                                                                                                                                                                                                                                                                                                          | "Missing evidence · the detective move nobody ships ({count})" → "Evidence you haven't checked yet ({count})" |
| Entry points (`WallArrival`)                                                                                                                                                                                                                                                                                                                    | "Write hypothesis" → "Add a suspected cause" (keep "What might cause this?" — it's already right)             |
| `AnalyzePhaseBadge` chrome chip                                                                                                                                                                                                                                                                                                                 | retired (component unmounted from the 6 sites; `AnalyzePhase` model + lifecycle-map doc untouched)            |

Test assertions matching /mechanism branch/i update alongside — **grep, don't trust a count** (known sites: `WallCanvas.test.tsx` ×3, `MobileCardList.test.tsx` ×2, `HypothesisCard.test.tsx` ×1, Azure `AnalyzeWorkspace.mapwall.test.tsx` ×3). `findings/mechanismBranch.ts` **identifiers stay** — the identifier/label drift is logged to investigations.md, not ridden.

## §9 Non-goals

- No `HypothesisStatus` enum change, no persisted-data migration, no Report re-grouping (ADR-090 intact).
- No new evidence entities or `FindingSource` variants.
- No re-automation of status (CS-10 fence: suggestions are chips, never auto-applied).
- Snap-river, the right narrator rail, semantic-zoom factor clustering, the ACH lens beyond the matrix columns specced here.
- The Evidence Map's fate (logged post-demo question) and the dark-theme wizard restyle (separate investigations entry).
- Voice/i18n translation pass beyond English-placeholder convention.

## §10 Build order (PR-sized; every PR lands PWA + Azure parity)

| PR      | Scope                                                                                      | Depends on |
| ------- | ------------------------------------------------------------------------------------------ | ---------- |
| **L-1** | `evidenceType` param + picker + `editFindingEvidenceType`; angle facts render on cards     | —          |
| **L-2** | 3-state display mapping (~7 maps) + vocabulary sweep (§8) + minters + chip retirement (D7) | —          |
| **L-3** | Activity layer: run-now buttons, in-flight projection, stall detection + escape actions    | L-1        |
| **L-4** | Wall fit-to-content + Fit control                                                          | —          |
| **L-5** | Causes matrix lens (`viewMode: 'causes'`) + Sponsor digest                                 | L-1, L-2   |

## §11 Doc supersessions (Apply at delivery, per-initiative)

- `docs/glossary.md` "Hypothesis (Investigation Wall)": status ladder text → 3-state display + 5-state stored note; add "Suspected cause" as the user-facing label.
- `docs/02-journeys/wireframes/wall-arrival.md`: ladder presentation superseded by `suspected-cause-card`; the "enum untouched" fence is honored and stays.
- River-roots spec `2026-04-19-investigation-wall-design.md`: **re-status** (stale: Question pills, `SuspectedCause` naming, never-built rail, `wallLayoutStore` rename); ADR-086 + this spec are live canon for the Wall.
- Design-system pages naming "Mechanism Branch Card" (`signal-branch-components.md`, `investigation-workspaces.md`).
- decision-log entries: D1-as-presentation-mapping; Diverging-chip retirement; matrix lens = ADR-086 implementation.

## §12 Open questions

- Does the Evidence Map survive post-Model-B? (existing logged question; the `map` toggle value is interim either way)
- Stall threshold N and whether Sponsor-facing surfaces (Report) show stalled counts in V1 (default: yes in the matrix digest, no new Report section).
- Whether the gemba/expert capture deserves its own lightweight entry point on mobile (WallShortcutButton adjacency) — defer to the mobile pass.
