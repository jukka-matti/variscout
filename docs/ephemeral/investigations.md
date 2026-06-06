---
tier: ephemeral
purpose: decide
title: 'VariScout — Active Investigations (open)'
audience: human
status: active
last-reviewed: 2026-05-18
related:
  - 2026-05-16-docs-strategy-design
---

# VariScout — Active Investigations (open)

Code-level smells, UX follow-ups, and architectural questions surfaced during work that are **not yet decisions**. Closed investigations are archived as cards under [`docs/cards/investigations/`](../cards/investigations/).

**When to add an entry:** while shipping fix A you notice problem B that's adjacent / related / surfaced by the same change. B isn't blocking A and you don't want to inflate scope, but it's worth not losing.

**When to remove an entry:**

- It became a decision → move to `decision-log.md` (Open Questions or Replayed Decisions) OR card under `docs/cards/decisions/`.
- It became a spec → link to `docs/superpowers/specs/...` and add `[PROMOTED YYYY-MM-DD]` marker.
- It was fixed → add `[RESOLVED YYYY-MM-DD]` marker (next docs:rebuild moves it to cards).
- It was tried and rejected → move to `decision-log.md` Replayed Decisions with rationale.

---

## Active investigations

### CapabilitySuggestionModal pops over the b0 landing [LOGGED 2026-06-06]

**Surfaced by:** the FSJ-1 chrome walk (PR #307): loading a map-less sample with seeded specs (`?sample=coffee`) lands on the b0 picker — correct — with the "Specification limits detected" modal blocking it.

**Summary:** pre-existing behavior (the modal fired over Explore before FSJ-1; now it fires over b0). Spec §4.2 (first-session journey) already names `CapabilitySuggestionModal` for retirement into the chip/banner grammar; this entry pins the live evidence + the P2 acceptance criterion: **no modal ever renders over the landing surface**. Input to FSJ-4/FSJ-5 planning.

**Promotion path:** absorbed by P2 of the first-session master plan (FSJ-4/5). **Severity:** low-medium (demo-visible interstitial; dismissible).

### Embed mode renders the chart title but no painted chart [LOGGED 2026-06-06]

**Surfaced by:** the FSJ-1 chrome walk: `?sample=bottleneck&embed=true&chart=ichart` shows "I-Chart: Cycle_Time_sec" + an unpainted chart area — **identical on main and the FSJ-1 worktree**, so pre-existing, not a landing regression. Possibly a wrong `chart=` param value or an embed lazy-paint issue.

**Promotion path:** verify the documented embed param contract (`docs/02-journeys/flows/pwa-education.md`) against the code; if genuinely broken, a small fix PR — embeds are the education funnel's delivery vehicle. **Severity:** medium-if-real (trainer-facing), unverified-params caveat.

### acceptInvite is in-memory-only + can silently no-op — durable membership requires the Lead's save [LOGGED 2026-06-06]

**Surfaced by:** the first-session-journey 5-persona panel (invited-Member evaluator), 2026-06-06.

**Summary:** `useProjectMembershipStore.acceptInvite` (≈`:117-145`) mutates the in-memory `projectsById` mirror and consumes the per-user localStorage invite, but never writes the new membership to `db.projects` or cloud — so accepting an invite does not, by itself, make the project pass `canAccessProjectRecord` (`localDb.ts:66-69`) in the Member's next session; only the Lead's subsequent project save durably grants access. Additionally, if the foreign project isn't hydrated in the Member's `projectsById` when they accept, the target-find misses and the invite is **consumed with no member added** (silent no-op). Pre-dates the first-session work; the Untitled-project model (spec 2026-06-06 §3) changes hub/project hydration timing and must not worsen it.

**Promotion path:** the Home / collaboration-arrival design session owns the invite→durable-membership seam (the first-session spec §7 names it as a fenced dependency). The silent no-op is a candidate straight bug-fix PR independent of design.

**Severity:** medium — collaboration onboarding can strand an invited Member without visible error; rare at 2–5 users but it is the _first_ thing a new Member does.

### PWA first-session journey — sample-data → Explore → first Finding is not smooth [PROMOTED 2026-06-06 → spec 2026-06-06-first-session-journey-design]

**Surfaced by:** owner live walk 2026-06-05 (during PO-8a execution): clicking a sample dataset in the PWA lands in Explore, but capturing the first Finding from there had visible friction — the wiring works, the _journey_ doesn't flow.

**Summary:** the no-Project quick-analysis onramp (OVERVIEW §3.0 — the free-PWA teaser and the first five minutes of every demo) crosses several seams that were each built/fixed separately but never designed as ONE journey: sample-data entry → Explore charts → Finding capture (pin/brush gestures) → Wall/Analyze (PR #295 fixed the entry CTAs; CS-13 added the crossing-back; CS-12 noted the "+ Add condition" gesture not opening an editor in 2 live attempts). The friction is a holistic user-journey question, not a single defect: where does the user's eye go after sample load, what is the invitation to capture, how does the first Finding teach the Explore⟷Analyze loop. Adjacent-but-not-covering queued design sessions: Home launchpad (Azure arrival, attention contract) and CoScout phase + journey model (JourneyPhase fossil) — neither owns the PWA first-session capture ergonomics.

**Promotion path:** its own brainstorm — "the first-session journey" (PWA onramp + sample entry + Explore→Finding capture flow + the handoff into Analyze/Wall). Timing OWNER-CONFIRMED 2026-06-05: the brainstorm runs **right after PO-8b ships** (persistence launch-blockers done) — NOT gated on CS-P2…P5; the journey is demo-critical (demos start exactly here) and orthogonal to the Process-tab per-step work. Open with a live `--chrome` walk (owner driving) to ground the design in the felt friction.

**Severity:** medium — no data loss / no crash, but it is the conversion path and the demo opening; rough edges here cost disproportionately.

### EvidenceSnapshot accumulation — no pruning policy [LOGGED 2026-06-05]

**Surfaced by:** PO-7 doc propagation pass (spec §11 mandate — log if absent); grounding reference: spec `2026-06-04-process-ops-extraction-entity-disposition-design.md` §9.5 + §14.

**Summary:** `EvidenceSnapshot`s accumulate per hub/source-key across re-ingests (the Measure⇄Analyze loop) with no pruning policy. Today snapshots can land with `stepCapabilities === undefined` (the producer-side stamping was a separate deferred item, resolved 2026-05-08), but the broader question — how many snapshots accumulate before this becomes a storage / load-time concern, and what is the eviction policy — is unanswered. The spec explicitly tags this as a "pre-existing watch-item, not changed here" (§9.5) and records the interim as: snapshots+provenance are hub/source-keyed and untouched by PO-4…PO-7; no pruning policy is a known gap. The `ScopeRail` archive prune path (for scopes) exists as a precedent shape.

**Watch-item:** (a) monitor snapshot count growth per hub as real projects accumulate re-ingests; (b) when a threshold is hit or the load-time impact is observable, design the eviction policy (LRU-per-source, keep-N-most-recent, or user-driven archive prune mirroring the ScopeRail pattern). Nobody should re-introduce `investigationLineage` as a "performance fix" — the spec's bound is status + UI by design (§9.5).

**Promotion path:** the §9 / ADR-091 persistence-model follow-up spec when triggered by data growth. Candidate design: keep-N-most-recent per source-key eviction, same prune-path shape as `ScopeRail`.

**Severity:** low — no observed impact today; tracking for when re-ingest loops accumulate real volume.

---

### `useImprovementOrchestration` (PWA) appears orphaned [LOGGED 2026-06-05]

**Surfaced by:** PO-6 grounding workflow (12-agent, 2026-06-05).

**Summary:** `ImprovementView` was migrated to `ImproveTabRoot` (driven by `activeIP.metadata.actions`); the only remaining references to `useImprovementOrchestration` in `apps/pwa/src` are the hook's own definition file (`apps/pwa/src/features/improvement/useImprovementOrchestration.ts`) and the barrel re-export (`apps/pwa/src/features/improvement/index.ts:2,6`). A comment in `improvementStore.ts:5` names it but does not call it. No component or hook mounts it. The hook consumed the React-state findings slice that PO-6 retired. VERIFY before acting: `grep -rn "useImprovementOrchestration" apps/pwa/src` — confirm zero live callers remain.

**Promotion path:** candidate dead-shed for a future hygiene PR (atomic delete: hook file + barrel line). Verify the barrel is not re-exported further up before deleting.

**Severity:** low — no runtime effect; dead code weight only.

### Azure `useFindings` mirror has a latent lost-write seam [LOGGED 2026-06-05]

**Surfaced by:** PO-6 grounding workflow (12-agent, 2026-06-05).

**Summary:** `useFindings` (`packages/hooks/src/useFindings.ts:156`) seeds local React state from `initialFindings` only at first render via a `useState` initializer — there is no re-sync effect. `BrushToFindingFlow` (mounted via `HypothesisCard` in `packages/ui`) writes `useAnalyzeStore` directly. An Azure mirror flush (`onFindingsChange` → `loadAnalyzeState({ findings })`, wired at `useFindingsOrchestration.ts:119-121` + `Editor.tsx` `setPersistedFindings`) can therefore clobber findings that were written to the store directly but not yet flushed through the mirror round-trip. The PWA escaped this class of issue via the PO-6 store-swap (findings now live exclusively in `useAnalyzeStore`, no React-state mirror); Azure still runs the mirror path.

**Watch-item:** the seam is latent today because Azure does not yet use store-direct Wall writes from `BrushToFindingFlow`. It surfaces if Azure adopts the same store-direct write pattern. Candidate fix = an Azure store-swap mirroring PO-6 §4.4 (retire `useFindings` / `useFindingsOrchestration` in favour of a direct `useAnalyzeStore` subscription in the Editor).

**Promotion path:** fold into the next Azure persistence-layer hygiene pass or the §9 CS-P2 carrier work if findings and the mirror are touched together.

**Severity:** low (latent) — no observed data loss today; risk materialises only when Azure adopts store-direct Wall writes.

### Project-tab stage overviews need their own design pass [LOGGED 2026-06-05]

**Surfaced by:** PO-5's stage-overview-count cleanup (`CharterOverview` / `ApproachOverview`). The PO-5 owner call was "minimal-honest interim, design routed": the dead lineage counts (`{hypoCount} hypotheses · {findingCount} findings`, `Wall · {n} hypotheses`) were dropped — they read the now-deleted `investigationLineage` and were always 0-ish — and replaced with a static "Hypotheses + findings live on the Wall" pointer + bare `Investigation` / `Wall` button labels. Buttons + navigation + testids untouched.

**Summary:** the Project-tab IP-detail stage overviews have accumulated drift that wants a dedicated brainstorm, not piecemeal patches: (1) the interim static Wall pointer is honest but inert — a **status-shaped-chips** candidate (dot · count · label, echoing `ProjectStatusCard`'s pattern, fed by the new core `groupHypothesesByStatus`) would restore a live signal without re-introducing a lineage filter; (2) "Continue in Investigation" / the `Investigation` button vocabulary is **stale post-WV1** (the tab is Analyze; the Wall is the brand); (3) the **orientation-vs-dashboard role** of these overviews is unsettled — are they a launchpad or a status surface? (4) pre-existing nit: both `CharterOverview` continue buttons carry the same `data-testid="charter-continue-analyze"` (duplicate testid); (5) the read-only **"Investigation lineage"** Charter form section + its progress step also carry vocabulary drift — named after the now-retired concept (rename candidate: **"Linked evidence"**), the section component is `AnalyzeLineageSection` and the `ImprovementProjectForm` props are `lineageProps`, wired live from store hypotheses/findings (decoupled from the deleted `investigationLineage` data field — PO-5 left it in place). The design session owns the rename.

**Promotion path:** a dedicated "Project tab / IP-detail stage overviews" brainstorm → spec. Fed by `groupHypothesesByStatus` (already shipped in core by PO-5) for the status-chips candidate.

**Severity:** low — the interim is honest and non-blocking; the design questions outlive the PR.

### `bestProjectedCpk` scans all hypothesis statuses post-PO-5 [LOGGED 2026-06-05]

**Surfaced by:** the PO-5 final adversarial review. With the Report scope now status-keyed (`selectIPReportScope.hypotheses` = all live hypotheses), the `bestProjectedCpk` derivation in both apps' `ReportView` (`Math.max` over selected-idea `projection.projectedCpk` across `reportHypotheses`) has no status filter — a `refuted` or `proposed` hypothesis that still carries a selected idea with a projection contributes to "best projected Cpk."

**Summary:** `ReportImprovementSummary` is _designed_ to render every status (it badges each with `STATUS_BADGE_LABELS`), so all-status display is intended; the question is narrower — should the aspirational _projection metric_ respect cause status (e.g. only `evidence-survived-test`/`evidenced`, matching the cause-row buckets)? Gating it is a product decision, not a PO-5 obligation.

**Promotion path:** fold into the next Report-view design touch (or the #12 Control-closure brainstorm if the metric feeds closure framing).

**Severity:** low — aspirational ceiling metric; no correctness impact.

### PO-4 CS-P2-pending dead seams — per-step capability row channel + `useHubMigrationState` suggestion derivation [LOGGED 2026-06-05]

**Surfaced by:** PO-4 review (entity-dissolution PR) — two seams left intentionally inert until CS-P2 wires the editor's live `rawData` through the carrier.

**Summary:** two seams in `apps/azure/src/features/processHub/` are unreachable in the current portfolio-source code path and will remain so until CS-P2:

- **(a) Per-step capability row channel.** `useHubProvision` always returns an empty `rowsByAnalyze` map (see the `// CS-P2 seam:` comment in `useHubProvision.ts`). Consequently, `useProductionLineGlanceData`'s per-step capability boxplots in `ProcessHubCapabilityTab` are computed from zero rows for every canonical step — the capability-distribution rendering branch (`capabilityNodes`) is structurally unreachable until CS-P2 lifts the editor's live `rawData` into the portfolio carrier's `rowsByAnalyze` seam. The `resolveCapabilityNodeTargets` cascade logic is now unit-tested separately (PO-4 review fix), so the target-resolution correctness is covered; only the live-data path is dormant.

- **(b) `useHubMigrationState` suggestion derivation.** The `suggestNodeMappings` engine call in `useHubMigrationState` always receives an empty `cols: string[]` array (dataset columns are not reachable from the portfolio source). `engineSuggestions` is therefore always `[]` and the modal entries carry no auto-suggestions. The engine itself stays unit-covered in `@variscout/core/stats`; only the wiring is dormant. Both code-comment annotations (`// CS-P2 seam:`) are in place so CS-P2 grounding picks them up.

**Promotion path:** CS-P2's grounding phase should verify both seams and wire them in scope. The code comments are the durable pointer; this entry provides the cross-surface summary for any grounding agent that reads `investigations.md` before looking at the files.

**Severity:** low — both seams are documented in code comments; no correctness gap, only dormant rendering paths. CS-P2 is the planned resolution.

### CS-13 follow-up: carry the WHERE across the crossing-back (condition → categoricalFilters + an Explore chart mirror) [LOGGED 2026-06-04]

**Surfaced by:** CS-13 build. The crossing-back carries y+x only (owner-locked). Two missing pieces before a hypothesis's full territory (its WHERE — e.g. "Line 2, night shift") can cross: (1) no inverse `ConditionLeaf[] → categoricalFilters` converter exists anywhere (every shipped converter goes the other way); (2) no Explore chart reads `analysisScopeStore.categoricalFilters` (the scope chip displays them; `Dashboard.tsx` mirrors only `yColumn`/`boxplotFactor`). Writing the WHERE today would make the chip claim a scope the charts don't honor. Intersects CS-3b (highlight-coordination) — when the dim layer lands, the WHERE-carry likely rides it. Also adjacent: the inert `stepId` mirror (`TODO(lv1-e-step-mirror)`) and the PWA chart mirror (`DEFERRED(lv1-pwa-mount)`).

**Promotion path:** deferred as a follow-up to CS-13 (scope + design clarity needed; not blocking the crossing-back merge).

**Severity:** low — the WHERE-carry is out-of-scope for CS-13 (owner decision); design question for downstream refactor work.

### `Finding.investigationId` FK rename — parked, blast radius named [LOGGED 2026-06-04] [RESOLVED 2026-06-05 → PO-6 + PO-7]

**[RESOLVED 2026-06-05]** Two-step resolution: (1) `Finding.investigationId` + `Hypothesis.investigationId` were **deleted** in PO-6 (PR #303, spec §4.3 — the FKs were write-only `'general-unassigned'` sentinels never read at runtime; ownership = the document under 1:1); (2) the surviving FK instances on ProblemStatementScope / Control entities / `ImprovementProject.metadata` were **renamed to `projectId`** in PO-7 (PR `feat/po-7-rename-sweep`) — the atomic cascade per `feedback_atomic_sweep_one_dispatch`. The original blast-radius estimate (~130 files) conflated the Finding/Hypothesis FK (deleted), the `investigationLineage` membership FK (deleted in PO-5), and the surviving control-domain FKs (renamed in PO-7). See decision-log §1 2026-06-05 PO-7.

**Surfaced by:** the 2026-06-04 analyze-session grounding pass on `ProcessHubAnalyze` entity disposition.

**Summary:** the rename re-keys the FK from the old multi-hub `investigationId` token to the `ProjectId` under the Project⟷Hub 1:1 model. Explicitly deferred by the investigation-surface build ("does NOT cover") with a stable-token rationale; blast radius is ~130 files across persistence, serialization, and FK consumers. Any analyze-entity surgery (see `ProcessHubAnalyze` OQ in `decision-log.md §2`) must treat this as its own pre-step, never a drive-by change inside a V1 PR.

**Promotion path:** pre-step of the analyze-entity surgery brainstorm. Atomic rename PR, not bundled.

**Severity:** low (intentionally parked) — pointer so the brainstorm finds it and doesn't discover the blast radius mid-flight.

### `ScopeFilter` (processHub.ts:203) → `ProblemStatementScope` reconcile ordering [LOGGED 2026-06-04]

**Surfaced by:** the 2026-06-04 analyze-session grounding pass. ADR-085 mandates a reconcile decision for the `scopeFilter` field on analyze-session metadata.

**Summary:** the analyze-session metadata carries a `scopeFilter` field (typed `ScopeFilter` in `processHub.ts:~203`) alongside the V1-canonical `ProblemStatementScope` entity (ADR-085). ADR-085 mandates a reconcile decision: the `scopeFilter` field must NOT be removed before the durable scope-WHERE is verifiably wired through `ProblemStatementScope`. PR-CS-0 previously found zero live callers for the scope materialization path, so removal before wiring would silently drop the scope-WHERE signal entirely. This is an ordering constraint, not a removal veto.

**Promotion path:** analyze-entity surgery brainstorm; resolve before any `ProcessHubAnalyze` field removal PR.

**Severity:** medium — ordering constraint; removing `scopeFilter` before `ProblemStatementScope` is fully wired repeats the PR-CS-0 zero-caller mistake.

### `investigationLineage` is under-wired, not a relic [LOGGED 2026-06-04] [RESOLVED 2026-06-05 → PO-5]

**[RESOLVED 2026-06-05 → PO-5]** Resolved by deletion. `sections.investigationLineage` is retired entirely: the zero-writer `hypothesisIds` half is gone (no more dead filter), and the `findingIds` CS-6 pin wire is deliberately reversed — analyst-owned `HypothesisStatus` (CS-10) is now the single Report-curation surface, and the empty-set-means-unfiltered Wall interim became the permanent semantics. See decision-log §1 2026-06-05 PO-5.

**Surfaced by:** the 2026-06-04 analyze-session grounding pass; corrects an over-claim that lineage was a multi-project leftover ready to delete.

**Summary:** `IP.sections.investigationLineage.findingIds` has a write path (CS-6 pin gesture) but `investigationLineage.hypothesisIds` has **zero writers anywhere** in the codebase — the active-IP Wall filter that reads it produces an empty set by construction, making the filter meaningless on every IP today. This is a live defect, not a doc issue. Even under Project⟷Hub 1:1, lineage legitimately distinguishes project-curated work from quick-analysis-without-a-Project (the no-Project free-PWA onramp — OVERVIEW §3.0). The full curation/membership model belongs to the analyze-entity surgery brainstorm. **Interim fix** (separate small PR, not blocked by the brainstorm): treat empty `hypothesisIds` as "unfiltered" on the Wall filter so the scoped Wall is not silently empty for every IP today.

**Promotion path:** two paths — (1) interim empty-set-means-unfiltered fix, small PR now; (2) full curation/membership model in the analyze-entity surgery brainstorm.

**Severity:** medium-high — live defect (the Wall IP-scope filter is inoperative for hypotheses on every project) + design gap (curation model unbuilt).

### Stale continuous-ops journey docs [LOGGED 2026-06-04]

**Surfaced by:** the 2026-06-04 analyze-session grounding pass; both docs are `status: active` but their narrative rests on the pre-wedge model.

**Summary:** `docs/02-journeys/project-reopen.md` and `docs/02-journeys/azure-daily-use.md` rest on ARCHIVED ADR-043 and narrate the pre-wedge continuous-operations model ("open/create/continue analysis", overdue-batch flags, per-hub analysis cadence). Under the wedge V1 model these journeys either belong to the named-future process-as-operations layer (§9) or need re-narration from the improvement-specialist perspective. They currently mislead any agent or onboarder reading the L2 journeys tier.

**Promotion path:** re-narrate or mark `status: named-future` during the §9 / §10 doc propagation sweep (the process-as-operations follow-up spec). Not blocking active build work.

**Severity:** low (doc drift) — no runtime effect, but misleads documentation readers and doc-grounding agents.

### Created hubs don't register into active-IP lineage [LOGGED 2026-06-04] [RESOLVED 2026-06-05 → PO-5]

**[RESOLVED 2026-06-05 → PO-5]** Resolved by deletion. The lineage membership filter is gone — under active-IP scope the Wall now shows the whole document, so a newly created hub always appears regardless of any registration step. See decision-log §1 2026-06-05 PO-5.

**Surfaced by:** the Wall-entry fix review. When an active IP is scoped, both apps filter the Wall to `activeIPLineage.hypothesisIds` — but NO hub-creation path (`handleProposeHypothesis`, `createHubFromFinding`, and the newly wired write/seed CTAs) registers the new hub into the lineage. A hub created while IP-scoped-with-zero-lineage-hubs won't appear on the scoped Wall. Identical pre-existing behavior across all creation paths; common unscoped case unaffected.

**Promotion path:** decide whether hub creation should auto-register into the active IP's lineage (likely yes — one-line per path) as a small follow-up.

**Severity:** low-medium — confusing edge case under IP scoping; consistent across paths.

**[NOTE 2026-06-04]** superseded-in-framing by the `investigationLineage is under-wired` entry above: the gap is the missing `hypothesisIds` write-path + curation model, not per-creation registration; the interim empty-set-means-unfiltered fix covers the symptom.

### "Pin as finding" crashes both apps — click event flows into the finding text [LOGGED 2026-06-04]

**Surfaced by:** the CS-12 `--chrome` laptop verify. Clicking **Pin as finding** (dashboard `ProcessHealthBar`) crashes the whole app to the error boundary: `Converting circular structure to JSON — starting at object with constructor 'SVGSVGElement' … 'FiberNode' … 'stateNode' closes the circle`. **Confirmed identical on origin/main** (replayed the same Hospital Ward → drill `Time_Period: Afternoon` → Pin-as-finding flow on a main dev server) — pre-existing, NOT a CS-12 regression.

**Suspected mechanism:** `ProcessHealthBar.tsx:601` passes the raw click handler — `onClick={onPinFinding}` — into a prop typed `onPinFinding?: (noteText?: string) => void`, so the React `MouseEvent` (whose target is an SVG element) arrives as `noteText` and rides into the created Finding's text; serialization (persistence/snapshot) then hits the circular DOM/fiber structure. One-line fix candidate: `onClick={() => onPinFinding()}` (+ a type-level guard so an event can never satisfy `noteText`).

**Promotion path:** immediate small fix PR — this breaks the core evidence-capture loop in BOTH apps and is customer-demo-blocking.

**Severity:** HIGH — core analyst loop crashes the app; pre-existing on main.

**[RESOLVED 2026-06-04]** — fixed in this PR (ProcessHealthBar arrow-wrap + Azure boundary guard). Correction: the crash was **Azure-only** — PWA's handler takes no parameters and was never affected; the original entry over-claimed "both apps".

### Wall empty-state CTAs silently no-op [LOGGED 2026-06-04]

**Surfaced by:** the CS-12 `--chrome` laptop verify. On a fresh investigation (data loaded, zero hypotheses), the Analyze-tab Wall empty state's two CTAs — **"Write a suspected mechanism"** and **"Seed 3 from Factor Intelligence"** — produce no visible action and no console errors when clicked. **Confirmed identical on origin/main** — pre-existing, NOT a CS-12 regression. Combined with the Pin-as-finding crash above, there is currently NO working UI path from a fresh dataset to a populated Wall — worth treating as one demo-blocking cluster. (Minor, same surface: the cold-start Wall svg renders the ModelBuilderBand + factor glyph at a tiny scale — the 2000×1400 user-space compresses into the container; pre-existing for the band, CS-12 only added the adjacent glyph.)

**Promotion path:** investigate the CTA handlers (modal not mounted? handler gated on missing state?) alongside the Pin-as-finding fix; one combined "Wall entry paths" fix PR is the likely shape.

**Severity:** HIGH (cluster) — blocks the fresh-data → Wall journey before customer demos.

**[RESOLVED 2026-06-04]** — both CTAs wired on the destination mounts (write → createHub; seed → top-3 candidate factors); Seed hidden when no factors. The cold-start tiny-scale note remains open (minor, not fixed here).

### Evidence Map post-Model-B fate [LOGGED 2026-06-04]

**Surfaced by:** CS-12 (reasoning canvas) now renders per-factor glyphs + Finding-mediated factor↔hypothesis edges on the Analyze-tab Wall. With both surfaces live side-by-side, the question of what the Evidence Map's unique residue is deserves evaluation before the next connective-surface build cycle.

**Summary:** with the Wall now showing factors + signed factor↔hypothesis edges, the Evidence Map's distinguishing residue is: (a) the **cross-scope overview** (the "muuttuja kartta" — multiple conditions + factor network at once); (b) **factor→factor `CausalLink` arrows** (the analyst-authored DAG, analyst-creatable and not-now on the Wall per decision-log 2026-06-04); (c) **R²-sized node visual** (contribution-proportional node area, not glyph). Evaluation options: keep as a separate cross-scope surface, absorb its unique residue into the Wall (e.g. optional CausalLink overlay), or retire if Model B makes it redundant. Touches ADR-074/086, CS-7 parity, Report (where CausalLinks render), and where `CausalLink` edges are best surfaced. The CausalLink Wall overlay decision (not-now) and the Evidence Map fate are linked but distinct.

**Promotion path:** evaluate when both surfaces are in active use with real data (post-customer-demo). Promotion candidates: decision-log if a choice is made, or a new connective-surface spec addendum.

**Severity:** low — both surfaces are live, nothing is broken; this is a medium-term UX coherence question.

### Orphaned canvas.localMechanism control/handoff i18n keys [LOGGED 2026-06-04]

**Surfaced by:** CS-12 glue-retirement audit. The keys `canvas.localMechanism.control`, `canvas.localMechanism.controlAria`, `canvas.localMechanism.handoff`, `canvas.localMechanism.handoffAria` appear in 33 locale files (all languages) but have **zero code consumers** — they pre-date CS-12, originating from the sustainment→control rename (`94da8a95`), and were never wired to any rendered string.

**Summary:** these 4 keys × 33 locale files are pure dead i18n weight. They are not causing harm (unused), but they add noise to locale diffs and inflate the i18n key surface. Safe to delete in a future i18n dead-key sweep alongside any other unresolved orphans.

**Promotion path:** fold into a future i18n dead-key sweep (not its own PR). Not blocking.

**Severity:** low — cosmetic dead weight, no runtime effect.

### Ingest match-summary 'plans waiting for this data' line [LOGGED 2026-06-03]

**Surfaced by:** CS-11 host-design review — the pending-match prompt on the Wall chip is one touch-point; a complementary line in the ingest match-summary panel (surfacing how many Measurement Plans the new columns satisfy) would make the signal visible at import-time, before the analyst reaches the Wall.

**Summary:** optional polish: add a "N plan(s) matched to new columns" line to the match-summary rendered after successful ingest, alongside the existing column-count and row-count lines. The pending descriptors (`computeReingestAutoLink`) already contain the count; it is a display-only addition, no new engine work. A third touch beside the chip prompt + the Inbox breadcrumb.

**Promotion path:** a small standalone UI PR (Azure + PWA match-summary component). Not blocking any CS-series PR.

**Severity:** low — polish, not correctness.

### PWA cluster-prompt parity [LOGGED 2026-06-03]

**Surfaced by:** CS-11 scope discipline — the cluster detector (`detectEvidenceClusters`) is computed only in Azure's `AnalyzeWorkspace`; `SynthesisPrompt` is an Azure-only component. CS-11 de-ranked the detector (removed `rSquaredAdj` sort + "combined R²adj %" display) but did not extend the cluster-prompt UI to PWA.

**Summary:** PWA's `AnalyzeConclusion` never receives cluster output. The detector is core-pure and already shared; only the prompt rendering is Azure-only. Extending to PWA would require mounting `detectEvidenceClusters` in the PWA Analyze path and rendering an equivalent `SynthesisPrompt` (or a shared component extracted from it).

**Promotion path:** a parity PR when the cluster-prompt surface stabilises (post-Model-B reasoning canvas, CS-12+). Not blocking.

**Severity:** low — Azure-only surface was always the declared scope; PWA parity is follow-up work.

### Cadence-UI orphans after CS-P1 shed → §9 cadence extraction [LOGGED 2026-06-03]

**Surfaced by:** PR-CS-P1 shed the cadence/Status rollup from `ProcessHubReviewPanel` (hide-not-extract; the cadence engines stay live).

**Summary:** `apps/azure/src/components/ProcessHubCadenceQuestions.tsx` + `ProcessHubCadenceQueues.tsx` now have **zero importers** (grep-verified) — dead code retained intentionally. A clean delete now would be a _partial_ extraction: it would also orphan their unique `ProcessHubFormat` helpers (`processQuestionAnswers`, `sustainmentBandAnswer`, `formatTopFocus`, …) and leave the still-live cadence engines untouched (`buildProcessHubCadence`/`buildCurrentProcessState` are still consumed by ReviewPanel's header `latestActivity` + the lifted `ProcessHubControlRegion`). So the coherent removal — the 2 components + their unique helpers + any engine that becomes dead once the new monitoring surface exists — belongs to the §9 process-as-operations follow-up, not CS-P1.

**Promotion path:** delete as part of the §9 named-future cadence extraction (see `decision-log.md` §3 row "Per-step capability on the editor Process tab"). Until then they compile harmlessly (no importer, no test).

**Severity:** Minor — dead code retained, tracked; not blocking.

### Refactoring roadmap sequencer [LOGGED 2026-05-31]

**Surfaced by:** read-only refactoring-opportunity evaluation using four explorer subagents across core/data/stats, stores/hooks, UI/app workflow surfaces, and tooling/package health.

**Summary:** clear opportunities exist, but they should not be executed as one broad cleanup. The plan is to run the work as sequenced PR slices. R0/R1 shipped via PR #264; R2a deterministic sample generation shipped via PR #266; R2b static computed chart fixtures shipped via PR #267; R4 shared workflow nav and Active-IP extraction shipped via PR #268; R5a-R5e thin app-feature/adaptor slices shipped via PRs #270-#274; R6a-R6d settled the snapshot/save boundary via PRs #275-#277 plus the save-semantics pass. A post-Phase-6 read-only evaluation plan was split into [`docs/superpowers/plans/2026-06-01-post-phase-6-refactoring-evaluation.md`](../superpowers/plans/2026-06-01-post-phase-6-refactoring-evaluation.md): R6e/R6f stay as Phase 6 closeout, Eval-A through Eval-E are neutral audit candidates, and R7/R8/R9 remain later horizons unless the evaluation promotes a specific part into immediate work.

**Promotion path:** master sequencer lives at [`docs/superpowers/plans/2026-05-31-refactoring-roadmap.md`](../superpowers/plans/2026-05-31-refactoring-roadmap.md). For each slice, re-check `main`, use brainstorming when decisions are still open, write a dedicated implementation plan, then execute via subagent-driven development in a dedicated worktree.

**Severity:** architectural-maintenance roadmap — not blocking current product work, but useful before more workflow/state code piles onto known drift.

### Doc + user-journey alignment after the investigation-surface + Factors&Evaluation delivery [LOGGED 2026-05-31 · VERIFIED + SIZED 2026-06-02 · RESOLVED 2026-06-02]

**Surfaced by:** 14 PRs this session (#250–#263) closed the whole investigation-surface arc (IM-0a…IM-7) + the Factors&Evaluation follow-on (model-builder + test-plan triad + evaluate + disconfirmation fusion) + IM-6 (retire mode/lens). This shipped major new product behavior; the **canonical L1/L2/L3 docs + user journeys now lag the shipped reality** and need a deliberate alignment pass.

**What likely lags (verify against code — do not trust the prose):**

- **`docs/USER-JOURNEYS.md` + `docs/02-journeys/*`** — the analyst flow is now: drill → capture Finding → compound `ProblemStatementScope` → hypotheses (causes) → **model-builder** (vital-few, R²adj+p) → **test-plan triad** (derived factors + auto-suggested tool + one-tap evaluate→typed finding) → **disconfirmation** ("Try to break it," engine-graded survived/refuted) → **per-hypothesis What-If Cpk** → **Improve handoff** (suspected-cause = role+selection → factor-control + ideas). The old mode/lens-driven journey is gone.
- **`docs/OVERVIEW.md` + `docs/03-features/analysis/*`** — mode/lens picker retired (the four charts are always-on + drillable; Values⇄Capability is the one specs-gated view, Cp/Cpk only); the Wall is the find-focus→test→refine loop.
- **Terminology** — "Supported" (not "Confirmed"); "Counts against" (loud); "contributing factors"; "suspected cause" = a role/selection, not a grouping entity.
- **SDD L1 vision / L2 journey layers** + `docs/01-vision/four-lenses/` (now teaching-only).

**VERIFIED 2026-06-02 — per-tab freshness audit (grounded 6-agent sweep + Analyze deep-dive):** the drift is **systemic, not isolated to Analyze**. Scoreboard across the V1 7-tab nav:

| Tab         | Verdict                                | Canonical doc(s)                                         | last-reviewed |
| ----------- | -------------------------------------- | -------------------------------------------------------- | ------------- |
| **Home**    | 🔴 no canonical L3 doc                 | only `ia-nav-model` + wedge spec + a decision card       | —             |
| **Project** | 🔴 materially stale                    | `specifications.md`, `business-bible.md`                 | 05-16 / 05-17 |
| **Process** | 🟡 minor drift                         | `process-maps.md` (no date)                              | —             |
| **Explore** | 🟡 minor drift                         | `analysis/index.md`, `four-lenses-workflow.md` (no date) | —             |
| **Analyze** | 🔴 materially stale                    | `analyze-wall.md`                                        | 04-29         |
| **Improve** | 🟡 minor drift                         | `improvement-workspace.md` (no date)                     | —             |
| **Report**  | 🔴 materially stale + no dedicated doc | `specifications.md`, `export.md` (draft stub)            | 05-16 / 06-01 |

**Cross-cutting (higher leverage than any single tab):**

- **`docs/03-features/specifications.md` (last-reviewed 2026-05-16) is the shared offender** — flagged stale by the Project + Process + Report audits: still prints the pre-rename nav `[…Analyze][Investigation]…` (should be `…Explore][Analyze]…`), "Charter → Approach → **Sustainment**", and "State + Edit modes". Fix once, 3 tabs benefit.
- **Home + Report have no L3 feature doc** (create, not edit). Report's **R6 snapshot/`.vrs` export model is undocumented** (`export.md` is a draft stub); Home's PWA-training-funnel vs Azure-durable-doc-list divergence + `PendingInvitesBanner` + active-IP-cascade-origin live only in decision cards.
- **`analyze-wall.md` is the proposed Analyze home but is itself a month stale** (predates FE-1/FE-2 + IM-4: missing model-builder band / test-plan triad / disconfirmation / What-If Cpk / typed Supports/Counts-against; its intent diagram still draws a `Q#7` node). `question-driven-analyze.md` is orphaned + already superseded in `methodology.md` → safe to archive once the ~2 salvageable bits (η² validation thresholds; "never root cause"/Suspected-vs-Supported) are ported.
- **~half the feature docs carry no `last-reviewed` frontmatter** — the governance gap that let this rot silently.

**Correction (NOT a code bug):** the Project stage enum value `'sustainment'` is a _deliberately preserved code identifier_ (same pattern as `confirmed` / `investigationId`); only the **user-facing label** is "Control". The stale docs are `specifications.md` / `business-bible.md` printing "Sustainment" as the user-facing stage — doc drift, not a code/spec mismatch. Do not "fix" the enum.

**→ RESOLVED 2026-06-02 — all 6 waves delivered** (commits `0b0d4cc0`…`0ecd5d51`; each wave grounded-against-code + adversarially reviewed; the R-series freeze is lifted per decision-log 2026-06-02). Master spec: [`docs/superpowers/specs/2026-06-02-documentation-alignment-design.md`](../superpowers/specs/2026-06-02-documentation-alignment-design.md); tracker `docs/superpowers/plans/2026-06-02-doc-alignment-master-plan.md`. It embeds the full coverage matrix (57 capabilities: 10 current / 7 stale / 12 partial / 28 missing), the root-cause finding (the SDD **Apply phase** is systematically skipped), the cluster→canonical-doc map, the 6-wave sequence, and the governance fix (ship Play 2b validator). The per-tab/per-capability stale-evidence line lists live in the audit + Wave plans, not here.

**→ Coherence pass + spec-lifecycle close (2026-06-02, commits `6ca89f14` + `a759da68`):** a final completeness audit (grep-verified, not over-flagged this time) found 5 docs still carrying the retired `FRAME → SCOUT → INVESTIGATE` spine + Question/SuspectedCause framing — fixed `constitution.md`, `positioning.md`, `methodology.md`, `analyze-to-action.md` (partially-superseded banner → `findings-hypotheses.md`/`investigation-surface.md`; P5 root-cause→suspected-cause; flagged `SuspectedCauseHub` as never-shipped — canonical = Finding+Hypothesis+CausalLink), and `improvement-workspace.md`. Graph: feature-index retired-spine section headers (SCOUT/INVESTIGATE → EXPLORE/ANALYZE) + 5-verb spine + flagged the question-driven row superseded + added the missing `save-and-load.md` row; `iso-9001-alignment.md` question-driven link marked superseded. **Both upstream specs flipped draft → delivered** (`2026-05-29-investigation-surface` ← IM-0…IM-7 #243–#263, #263 closes it; `2026-05-31-factors-evaluation` ← FE-1/2a/2b #260–#262 — all PRs verified merged first), and factors-evaluation `implements:` repointed off the prior Wall _spec_ onto the real doc homes. **Apply-phase sensor now fully green (947 docs, 0 WARN)** after stamping the 4 lagging implements targets (sponsor/control/subgroup-capability/lead — each grounded current before stamping).

**Deferred follow-ups — Category-3 undocumented-but-shipped surfaces (tracked, NOT blocking; none mislead, they are simply absent):** **CoScout Tools** (the tool-calling surface), the **Hub Creation** flow, **Admin Hub**, and the **Process Hub views** still lack canonical L3 docs. Write each on next touch of its surface (Apply-on-edit discipline) rather than a batch pass. A hardened completeness sweep (2026-06-02, 4 blind critics across routes / Azure components / PWA / core+ui domains) confirmed these 4 are **not** the whole set — it found **7 more** shipped-but-undocumented surfaces: **Survey/Inbox** (the cross-phase methodology engine — `packages/core/src/survey/*` + `InboxDigest`; methodology §256), **process-map state-items** (`EvidenceSheet` + `StateItemNotesDrawer` / `ProcessStateNote`), **cross-surface connection badges** (`packages/ui/src/components/CrossSurface/*`, the Canvas Connection Journey output), **Document Shelf** (`packages/ui/src/components/DocumentShelf/*`, Azure — retrieval is in `knowledge-base-search.md`, the shelf UI isn't), **installable / offline-first PWA** (service worker + offline banner, only at L5/ADR-004), **PWA mobile (phone) Explore** (`MobileDashboard` carousel — also an undocumented PWA-vs-Azure divergence), and the **Evidence Map popout** (`?view=evidence-map`, currently partially-wired / URL-only). Full code pointers + suggested doc homes + a ready-to-paste pickup prompt are in the `project_doc_followups` agent memory. **Voice Input is explicitly deferred to a future (~next-year) product increment — do NOT document it now** (2026-06-02 product decision: keep the V1 design simple, don't over-complicate).

**Review-caught code-path drift (tracked):** the Wave-6 adversarial review found the **Sustainment → Control rename also propagated to the control-domain code identifiers** — `packages/core/src/control.ts` exports `Control*` types (`ControlCadence` / `ControlVerdict` / `ControlStatus` / `ControlHandoffSurface` with **9** surfaces), and the PWA ships `ControlPanel.tsx`, not `SustainmentPanel.tsx`. `control.md` had been documenting the OLD `packages/core/src/sustainment.ts` + `Sustainment*` paths (and was wrongly stamped current) — **fixed in the same commit as this note**. Other docs still carry the stale `sustainment.ts`/`Sustainment*` paths: `feature-parity.md` is the one **active** doc to re-ground (the rest are historical plans + memory cards + a RESOLVED entry above). Fix on next touch. This also retires the 2026-05-29 "preserved code-level sustainment identifiers intact" claim **for the control domain** (the rename landed in code post-PR-#241, in the IM-6 era).

**Promotion path (historical — the FRESH-SESSION pass below was executed 2026-06-02):** a FRESH-SESSION doc-alignment pass — grounded against shipped code (per [[feedback_subagent_grounding_catches_drift]]), using the docs toolbox (`pnpm docs:find`/`docs:related`) + a multi-lens audit; update L1/L2/L3 + journeys to match; follow the Propose→Apply→Archive doc-discipline. Canonical "what shipped" sources: the spec `docs/superpowers/specs/2026-05-31-factors-evaluation-design.md` + the 2026-05-30 Wall spec + ADR-086/088/089 + the 2026-05-31 decision-log entries.

**Severity:** doc-drift — the canonical journeys now materially lag a major delivery; not blocking, but the docs should be re-aligned before they mislead. User-flagged as the explicit next-session follow-up (2026-05-31).

### Connective navigation & surface model for the updated investigation approach — DESIGN INITIATIVE [LOGGED 2026-06-02]

**Surfaced by:** the 2026-06-02 **surface-vision triage** (12 shipped surfaces evaluated keep/cut/defer against wedge V1 + the IM/FE investigation model). The triage's real finding: the IM/FE work shipped the new investigation **core** (scope=`ProblemStatementScope` / cause=`Hypothesis`, unified canvas, always-on charts) but **never holistically designed the connective tissue** — how surfaces link, and what each surface _is_ in V1. Several shipped surfaces are partial **old-model** answers to that un-designed question.

**Deeper reframe (owner, 2026-06-02) — re-derive V1 first, don't start from the surface list.** "V1" is not a ground-up design; it's the **wedge-pivot (2026-05-16) boundary drawn _over_ ~6 weeks of pre-wedge accreted code** (4-persona/multi-hub-portfolio/tiered Product Vision 2026-05-03; the continuous process-owner operating model 2026-04-27; Framing Layer / Process Hub / Production-Line-Glance / RPS / Canvas). The pivot set strategy+nav and IM/FE rebuilt the core, but never went surface-by-surface — hence the recurring "is this V1?". The owner re-opened 3 of the triage's "solid V1" surfaces (**hub creation, process-map state-items, offline-first PWA**); all lean named-future/out-of-core. **The single clarifying call:** derive surfaces from the wedge prop ("one improvement specialist runs one investigation → improvement → control, optionally with a small team, worth €120/mo"); the murky layer is one thing — **"Process-as-ongoing-operations" (Process Hub, hub creation, current-state/state-items, cadence) = the process-owner continuous-operations model = VariScout Process (named-future)**, in V1 only because the code existed + the nav has a "Process" tab. Candidate resolution to pressure-test: Process tab in V1 = the process **map**; Process **Hub**/owner-monitoring = named-future; hub-creation → "investigation setup"; the **free PWA is a separable funnel bet**. So the brainstorm starts from re-deriving V1; the items below are downstream.

**Design scope (downstream of the V1 re-derivation):**

- **Connective navigation** — spine (owner's words): _"from a process step, see its linked findings → jump to Analyze to see the hypothesis,"_ generalized to a **where-from / where-to** path for every entity across **Frame ↔ Explore ↔ Analyze ↔ Improve ↔ Control**.
- **Multi-screen** — Process view + Analysis Wall + Explore on **separate, synced screens** (build on the existing `usePopoutChannel`/`BroadcastChannel` popout infra).
- **The Process tab, holistically** — owner's realization: it's an **accretion of ~6-8 initiatives** (Layered Process View · Process Hub cadence · Production-Line-Glance Capability · Framing Layer · Canvas/8f · Canvas-Connection badges · RPS state-items), not a single coherent design. Includes the V1-vs-named-future line _inside_ `ProcessHubReviewPanel`: the cadence-monitoring loop is named-future "VariScout Process" but is code-entangled with V1 response-paths (`buildCurrentProcessState`), the Control region (`ProcessHubControlRegion`, nested in `ProcessHubCadenceQueues`), and Survey/Inbox (a keep).

**Out of scope** — 8 surfaces triaged solid-V1 (document-only): CoScout Tools · Hub Creation · Survey/Inbox · Document Shelf · offline-first PWA · PWA mobile · process-map state-items · Admin Hub.

**Decisions locked (2026-06-02):**

- **Cross-surface connection badges → KEPT** (cut was reverted). They implement wedge §3.3.2 "in-flight references" + are the seed of the connective-nav redesign — not dead code. (`packages/ui/src/components/CrossSurface/*` via `CanvasStepOverlay`.)
- **PresentationView → CUT** — shipped as **PR #281** (dead since `ee52e664`).
- **Process Hub cadence strip → NOT a mechanical delete** — it's the "what is the Process Hub Status tab in V1" design question above.

**Promotion path:** **PROMOTED 2026-06-02 → [connective surface model design spec](../superpowers/specs/2026-06-02-connective-surface-model-design.md)** (grounded by 8 code-grounding agents + a 5-cluster laptop-ergonomics benchmark + an adversarial spec review). The spec settles the V1 boundary (Decision 0 — process-as-operations → named-future), the linked-panels spine (Model A) + the Analyze reasoning canvas (Model B; whole-app canvas C rejected as too dense for a laptop), the step→findings→hypothesis spine + the `CausalLink` factor↔cause edge, framing-on-load, PWA↔Azure parity, the ADR-086 unification debt + orphan cleanup, and the holistic doc-layer propagation; it splits the process-as-operations **extraction** to a follow-up spec. Original brainstorm context + pickup prompt remain in the `connective-surface-redesign` agent memory.

**Severity:** design-debt — RESOLVED at design level by the spec above; build pending `writing-plans`.

### Hypothesis-stage walkthrough — Wall honesty bugs + test-plan-triad gaps + "confirm" terminology [LOGGED 2026-05-31]

**Surfaced by:** the grounded hypothesis-stage analyst walkthrough (3-lens exploration) during the "Factors & Evaluation" V-next design. Splits into (a) two shipped-state honesty BUGS worth a small near-term PR, (b) the V-next initiative's design gaps, (c) a terminology follow-up.

**(a) Shipped-state bugs — cheap, fix-soon (a "Wall honesty" PR):**

1. **Auto-link re-ingest Finding over-credits progress.** The breadcrumb auto-Finding (`autoLink/engine.ts:85-108`) is `evidenceType:'data'`, source-less, with **no `validationStatus`**. In `projectMechanismBranch` (`mechanismBranch.ts:148-153`) the bucketing is `contradicts`→counter, `inconclusive`→not-tested, **else→supporting** — so the no-`validationStatus` auto-Finding falls into `else`, lands as a supporting clue, and silently bumps a hypothesis **`proposed→evidenced` on data-arrival alone** (before the analyst tests anything). To an MBB this reads as "the tool thinks I have evidence" when a column merely showed up. **Fix:** stamp the auto-Finding `validationStatus:'inconclusive'` → routes to not-tested → card says "data arrived, not yet tested." One-line, outsized honesty payoff.
2. **PWA can't reach the top status tier.** `onRecordDisconfirmation` is wired in Azure (`Editor.tsx:~699`) but **omitted from PWA `wallPlanningProps`** (`apps/pwa/src/App.tsx:~845-925`), so a PWA hypothesis can never record a survived disconfirmation → never leaves `needs-disconfirmation`. Wire it (mirrors the Azure block).

**(b) Terminology — "confirmed" overclaims (separate follow-up, user-raised 2026-05-31):** falsification logic never _confirms_ a hypothesis; the gate literally computes "≥2 evidence types **+ a survived disconfirmation attempt**", so the `confirmed` label contradicts its own logic and cuts against contribution-not-causation. Proposed honest lifecycle: `proposed → evidenced → **corroborated** / refuted` (Popper's term; or plainer "withstood challenge" / "well-supported" — user picks). The **user-facing relabel is cheap** and can ride the (a) honesty PR (same "stop overstating certainty" theme); the **code-identifier rename** (`'confirmed'` across the `HypothesisStatus` union + `survey/wall.ts` messages + 32-locale i18n) is a wider deferred sweep. Decide the term with the user (domain call) before the rename.

**SHIPPED 2026-05-31 (Wall honesty PR, label-only):** user picked **"Supported"**. Relabeled the user-facing status label in `en.ts` (`'wall.status.confirmed': 'Supported'`), `HubCard.tsx` (`label: 'Supported'`), `ReportImprovementSummary.tsx`, and the survey triangulation message in `survey/wall.ts` ("…promote this from evidenced to **supported**"). Code identifier `'confirmed'` left intact (HypothesisStatus union, `data-status` attrs, derivation logic, `formatStatus`-rendered raw-code surfaces like `AnalyzeLineageSection`). **Deferred follow-up — non-English status-label retranslation:** the other 31 locales' `wall.status.confirmed` values still hold the literal English placeholder `'Confirmed'` (they were never translated); they were NOT machine-translated in this PR and now diverge from en-US until the locale-retranslation sweep runs. The code-identifier rename remains its own atomic-rename PR.

**(c) V-next design gaps → the "Factors & Evaluation" initiative spec (not bugs):**

- **The per-factor test-plan triad is unbuilt** (the initiative's core): `deriveBranchColumns(hub, findings)` (`mechanismBranch.ts:93-106`) already computes the cause's relevant factors but the UI discards them at the card boundary; there is no tool-per-data-type suggestion (categorical→boxplot+2-sample, continuous→scatter+regression, spread→Cp/Cpk — `deriveMiniChartConfig` only picks i-chart-vs-boxplot descriptively, no scatter/regression/Cpk branch), no per-factor data-readiness join, and no one-tap "evaluate" → run test → attach a TYPED (support/counts-against) Finding.
- **Per-hypothesis What-If Cpk is built but invisible.** `computeScopeWhatIfProjection` + `computeConditionCoverage` (`variation/scopeContribution.ts`, non-additive by enforced design) are correct but not surfaced on the card; confounds are adjudicated by clue-counts today, not by "fix-H1→Cpk 1.4 vs fix-H5→Cpk 1.1." Surfacing it is high-leverage (it's also the "expected gain" that carries to Improve).
- **Confound sign is manual + easy to miss:** a finding linked via `findingIds` defaults to _supporting_ unless explicitly tagged `contradicts`/added to `counterFindingIds`, so the losing side of an opposite-signed confound won't auto-refute.
- **Brush-to-finding is descriptive, not inferential:** `BrushToFindingFlow.tsx:128-129` pins a statistic-free text finding (no `evidenceType`/`refutes`/`validationStatus`) → inflates supporting count without a test.
- Minor: `AddPlanForm` `primaryFactor` is free-text (`AddPlanForm.tsx:~71`) not pre-filled from derived factors (drift); vertical card stacking uses magic-number `foreignObject` heights (cramped at 3–4 active cards); `DisconfirmationAttempt.linkedFindingIds` is always `[]` (no falsification evidence attached — "survived→corroborated" can be asserted without data). `FindingProjectionModelContext` already carries `rSquaredAdj`/`scopeLabel`/`linkedFactor` — the hook for saving the concluded model into the finding (per the settled capture-as-Finding decision).

**Deferred follow-up — fused-disconfirmation persistence-dispatch gap [LOGGED 2026-05-31, FE-2b adversarial-review minor]:** the FE-2b fused "Try to break it" path (`handleEvaluateFactor` in `AnalyzeWorkspace.tsx` Azure / `AnalyzeView.tsx` PWA) updates live hook/store state (`recordDisconfirmation`) but — unlike the legacy MANUAL disconfirmation form (`Editor.tsx:~699`) — does NOT also fire `azureHubRepository.dispatch({ kind: 'HYPOTHESIS_RECORD_DISCONFIRMATION', … })`. **Cosmetic today:** `applyAction.ts:~526` (Azure) / `:~397` (PWA) makes `HYPOTHESIS_RECORD_DISCONFIRMATION` a no-op (F5-deferred — `disconfirmationAttempts` is in-session-only, no SSE, no reload survival), so there is NO real asymmetry now. **When F5 disconfirmation-persistence lands**, the fused path MUST also dispatch (or share a single helper with the manual form) or a fused `survived` will be lost on reload while a manually-recorded one persists. Wire the dispatch into the fused path at the same time as the F5 applyAction handler — don't let the no-op lull hide the gap. See [adr-082]/F5 + [[investigation-surface-build]].

**Deferred follow-up — mobile model-builder band [LOGGED 2026-05-31, FE-1 Increment 1 adversarial-review fix]:** the FE-1 model-builder band mounts only on the desktop SVG body of `WallCanvas` (now including the zero-hub cold-start path so screening isn't hidden); it is intentionally ABSENT on the `MobileCardList` branch. Mobile is focus-only per ADR-086. A mobile-native model-builder surface is a deferred follow-up — NOT built in Increment 1. Don't add a band to `MobileCardList` without revisiting the mobile interaction model.

**Promotion path:** (a)+(b user-facing relabel) → a small "Wall honesty" PR (single-implementer). (b code rename) → its own atomic-rename PR. (c) → the "Factors & Evaluation" initiative spec + master-plan (test triad + model-builder + What-If-on-card + Improve handoff). Related: [adr-086](../07-decisions/adr-086-unified-investigation-canvas.md) Amendment 2026-05-31, decision-log 2026-05-31, [[investigation-surface-build]].

**Severity:** (a) medium (trust/honesty, cheap); (b) low (terminology, real but non-blocking); (c) the initiative itself.

### Stored-vs-derived `hub.status` split (IM-4a adversarial review) [LOGGED 2026-05-30 · RESOLVED 2026-06-03]

**Surfaced by:** IM-4a adversarial review. IM-4a makes `WallCanvas` + `MobileCardList` call `deriveHypothesisStatus` (the live Survey-rule derivation) rather than reading `hub.status`. This creates a structural split: the Wall derives status correctly, but ~8 other readers across the codebase still trust the stored `hub.status` field.

**What was verified as safe (not a regression):** on `main`, `setHubStatus` has zero production callers. `factories.ts:~221` seeds `'proposed'`. Nothing writes `status: 'confirmed'` in production paths. The ~8 `hub.status === 'confirmed'` readers are therefore already dead branches:

- `apps/azure/src/components/editor/AnalyzeWorkspace.tsx:~580` (`hypotheses`/`ruledOut` gate for AnalyzeConclusion)
- `apps/azure/src/features/analyze/useImprovementOrchestration.ts:~303`
- `packages/ui/src/components/Wall/GoalSection.tsx:~51`
- `packages/ui/src/components/Wall/IdeaGroupCard.tsx:~326`
- `packages/core/src/survey/mechanismBranch.ts:~76`
- `packages/hooks/src/useCanvasAnalyzeOverlays.ts:~294`
- `packages/ui/src/components/AnalyzeWall/AnalyzeWorkspace.tsx:~468` (if present)
- `apps/pwa/src/pages/AnalyzeView.tsx:~193`

IM-4a makes the split structural (Wall derives; others still read stored). The AnalyzeWorkspace.tsx `hypotheses`/`ruledOut` memo has an inline comment pointing here.

**Open question for IM-4b / IM-6:** two options — (A) migrate the ~8 readers to call `deriveHypothesisStatus(h, findings)` at their call site (requires threading `findings`); (B) persist the derived value back to `hub.status` on each Wall render (simpler consumers, but adds a write path). PWA `onRecordDisconfirmation` is Azure-only (consistent with the LV1 PWA-Mount-Deferral); no PWA wiring needed until PWA tab expands.

**Severity:** low — readers are already dead branches. Not blocking IM-4a. Resolution is IM-4b/IM-6 scope.

**→ RESOLVED 2026-06-03 (PR-CS-10) — third path taken.** Neither option A (migrate readers to derivation) nor option B (persist derived back to stored) was chosen. Instead: `setHubStatus` re-introduced as the analyst-owned source of truth (the setter deleted in IM-4a, commit `84045c42`, returns); the ~8 `hub.status` readers now read a real analyst-set value; `deriveHypothesisStatus` is demoted to an advisory suggestion chip on the Wall (never auto-applies). The split is resolved: stored status is authoritative everywhere.

### PWA/Azure conclusion-categorizer parity divergence [LOGGED 2026-06-03] [PROMOTED 2026-06-05 → PO-5]

**[PROMOTED 2026-06-05 → PO-5]** Resolved by deletion. Grounding found both app categorizer memos (Azure 2-way / PWA 3-way) were **gate-only ceremony** — their buckets partition `hubs`, so both conclusion-panel gates reduced to `hubs.length > 0` and `AnalyzeConclusion` renders all hubs flat regardless. PO-5 deleted both memos and shipped the one canonical status→bucket mapping in core (`groupHypothesesByStatus`), keyed by the Report engine. No status drops; the divergence is gone. See decision-log §1 2026-06-05 PO-5.

**Surfaced by:** PR-CS-10 (analyst-owned status). The Wall now displays the analyst-set stored `hub.status`, which exposed the fact that the two apps categorize conclusion status differently.

**Summary:** PWA buckets hypotheses 3-way (`suspected` / `contributing` / `ruledOut`) in `apps/pwa/src/components/views/AnalyzeView.tsx`; Azure buckets 2-way (`suspected` / `ruledOut`) in `apps/azure/src/components/editor/AnalyzeWorkspace.tsx`. Both read the same stored `hub.status` field. CS-10 left this divergence untouched (status-only scope). A parity follow-up should align the two conclusion-categorizer memos (or consolidate into a shared hook) before the `contributing` bucket in PWA becomes user-visible.

**Promotion path:** align in a dedicated parity follow-up PR. Not blocking CS-10. See also `decision-log.md` 2026-06-03 PR-CS-10 entry.

**Severity:** low — the divergence is latent today (contributing bucket empty until analysts set that status); becomes visible when `setHubStatus` is wired to UI controls.

### ΔR² association-strength → `Finding.modelContext` (capture-time wiring) [LOGGED 2026-06-03]

**Surfaced by:** PR-CS-8 (best-subsets association strength), explicitly deferred there and NOT folded into CS-9 or CS-10.

**Summary:** CS-8 shipped the per-scope **semipartial-R² association-strength** magnitude (`perFactorDeltaR2` in `@variscout/core/stats`) as a live signal in `ModelBuilderBand` (ΔR² bars paired with the partial p). When the analyst captures a Finding from that band, the ΔR² magnitude is **not** recorded onto the Finding — so the association strength lives only in the live band, not on the persisted Finding. The follow-up: write the per-scope ΔR² map onto the captured Finding's `modelContext` at capture time so the magnitude travels with the Finding (Evidence Map, Report, re-open). Cross-app (Azure + PWA capture paths).

**Promotion path:** a small standalone PR or fold into a nearby Findings-touching CS-PR (e.g. CS-12 reasoning canvas, which renders Finding-mediated links). Engine already exists; this is capture-time plumbing + a `modelContext` field check. Not blocking the customer-demo bar. CS-12 fold-in nomination not taken (owner); stays deferred.

**Severity:** low — the ΔR² is recomputable from the live band; persisting it is a fidelity/portability nicety, not a correctness gap.

### IM-1 execution deferrals + tech-debt (drop-Question cascade) [LOGGED 2026-05-30]

**Surfaced by:** IM-1 (PR #249, drop `Question` + `ProblemStatementScope`) execution + its 4-dimension adversarial review. Net-new follow-ups beyond the master-plan IM-4/IM-5 scope, captured so they aren't lost. Full build context: [[investigation-surface-build]] memory.

- **3 detached UI flows → re-mount on the IM-4 unified Wall.** IM-1 deleted the Question components that wired (a) inline improvement-idea projection (`handleProjectIdea`/`ideaImpacts` in Editor/AnalyzeWorkspace), (b) the inline add-idea surface (`ImprovementIdeasSection` — rebuilt + re-keyed by `hypothesisId` in `@variscout/ui`, currently UNMOUNTED), (c) propose-finding→Hypothesis (`createHubFromFinding`, previously wired via the deleted `QuestionLinkPrompt`). Handlers/components still exist; re-mount on the bipartite Wall in IM-4. Primary Improve workflow (`ImprovementWorkspaceBase`) is intact. Marked with `// IM-1:` comments at deletion sites.
- **Scope blob round-trip (F3).** azure `serializeInvestigationState`/`serializeScopes` has no production callers + drops `gateNode`; Azure scopes live in session state. Real blob wiring deferred.
- **`ProcessHubContext.questions`** retained as a hardcoded-zero stub (ADR-085 transitional) — drop/replace when consumers migrate to scope/hypothesis counts.
- **Hooks test-tsc debt:** `packages/hooks/src/__tests__/{useBoxplotData,timeLensWiring}.test.ts` have `Record<string,unknown>[]` vs `DataRow[]` tsc errors — gate-invisible (hooks build excludes tests; vitest no strict-tsc). **Pre-existing, NOT IM-1** (0 IM-1 commits touched them); fix opportunistically.
- **`IdeaGroupCard`** badges only `confirmed`/`evidenced`; `proposed`/`refuted` get none (diverges from `ReportImprovementSummary`, which maps all five `Hypothesis.status` values). Cosmetic IM-4 polish.
- **CoScout `legacy.ts` / ADR-068** retirement — see the `decision-log.md` §1 2026-05-30 entry (scheduled as a Wave-1 PR before IM-3).

**Promotion path:** the IM-4/IM-5 items graduate (mark `[RESOLVED]`) when those PRs land; the hooks test-tsc + IdeaGroupCard items are opportunistic. **Severity:** low–medium; none block IM-1; primary user flows intact.

### IM-0b-2 deferrals (canvasStore = rich-map authoring authority) [LOGGED 2026-05-30]

**Surfaced by:** IM-0b-2 — making `canvasStore` the single authoring authority for the rich-map fields (`ctqColumn` / tributaries / `subgroupAxes` / hunches). `ProcessMapBase`'s mutators now dispatch new canvasStore-backed props instead of building `next: ProcessMap` + `onChange`. Two scope cuts were deliberately deferred (user-approved minimal direction: migrate the persistence path, preserve behavior, defer the holistic capability question). Full build context: [[investigation-surface-build]] memory + `PLAN-im-0b-2.md`.

- **Net-new per-step `node.capabilityScope` (`SpecRule[]`) authoring — DEFERRED to the IM-5/IM-6 holistic design.** `ProcessMapBase` never wrote `node.capabilityScope`; its per-step specs editor routes to `setMeasureSpec(column, SpecLimits)` → project-wide `measureSpecs` (preserved exactly in IM-0b-2 — see the `// IM-0b-2 deferral:` comments at the `onStepSpecsChange → setMeasureSpec` seam in `ProcessMapBase.tsx` + `CanvasWorkspace.tsx`). Whether/how to author per-step capability scope is entangled with IM-5 (level-native contribution), IM-6 (Values⇄Capability view) and ADR-038/073 — it belongs in that design, not this structural migration. canvasStore therefore gained **no** `setStepCapabilityScope` action.
- **Full VISUAL retirement of `ProcessMapBase` — DEFERRED; verify the real need at IM-4 planning.** After IM-0b-2 `ProcessMapBase` is a thin dispatcher (all authoring flows through canvasStore), so it's harmless. Rebuilding ctqColumn/tributary/specs/hunch authoring as native Edit-mode zone UI in `ProcessStructureZone` (currently read-only) is speculative until IM-4 confirms the `Canvas/index.tsx` `canvas-authoring-map` panel actually needs removing. Don't rebuild UI speculatively now.

**Promotion path:** the `capabilityScope` authoring item graduates into the IM-5/IM-6 spec when that design lands; the `ProcessMapBase` visual-retirement item is verified (kept or actioned) at IM-4 planning. **Severity:** low; neither blocks IM-0b-2; the structural migration (single authoring authority, second persistence path retired) is complete + behavior-preserving.

### Investigation-model design direction (Clusters A + B + C) — unified canvas · drill-to-condition · level×lens · Measurement-Plan-as-DCP [PROMOTED 2026-05-29]

**Surfaced by:** Holistic design conversation 2026-05-29 (visual-companion brainstorm, opus). Settled the V1 investigation-model spine across **Cluster A** (PWA/Azure seam, #12 closure) + **Cluster C** (Findings/Hypotheses domain + canvas) + **Cluster B** (analysis surfaces — #11/#50/#51, resolved; see the Cluster B block below). Grounded against code (6 grounding workflows) + the methodology author's GB "Measure" decks (~144 pp).

**Settled direction (decision-log candidates — graduate to `decision-log.md` + a spec when design → buildable):**

- **Project = the collaboration container** — one continuous investigation; **inviting people is the trigger** that makes it a Project (→ inherently Azure). Solo = a savable/closeable/reportable _investigation_ in the PWA; Azure adds collaboration + cloud + CoScout + audit. No Charter ceremony (already gone — decision-log 2026-05-28 entry). Closure (#12): optional, **non-blocking** signoff, hidden solo; reconcile the shipped processOwner-gated in-app signoff toward optional; fix stale Sponsor-gatekeeper wording in personas/ia-nav.
- **Drop `Question` as a tracked entity** — the Investigation Wall (Findings + Hypotheses) is the centerpiece; Question's value re-homes to Factor Intelligence (generative) + un-examined factors (completeness). Retires the legacy `Question.causeRole` duplication + the phantom `SuspectedCause` naming (it is `Hypothesis` in code).
- **One `y = f(x)`, two projections:** Evidence Map (factor-centric, **= the "muuttuja kartta"**, recursive X→x→smaller x) + Wall (hypothesis-centric) — on a **single unified canvas** with a **Focus lens + semantic-zoom LOD** (NOT a global force-graph; the "hairball" failure mode). Anti-bias migrates from neutral questions to the **disconfirmation gate** (typed, unwired — must build the UX).
- **Drill-to-specific-condition is the spine — but WHERE (scope) ≠ WHY (cause)** (corrected 2026-05-29 vs thesis). Layering: **Issue Statement (1)** → **Outcome Y (1)** → **Problem-Statement SCOPE(s) = the WHERE** (a `{factor=level}` condition, e.g. Machine X / B∩night; found by drilling / Progressive Sharpening; can be MANY scopes) → **Suspected Causes = the WHY** (mechanisms — worn spindle / coolant / setup; MANY per scope; carry η²/contribution + Measurement Plans). methodology.md:34 — "VariScout finds WHERE; apply Lean to find WHY." The drilled condition is the **Problem-Statement scope**, NOT the hypothesis; hypotheses are the causes _within_ the scope. Bidirectional #51 falls out of the scope.
  - **Code conflation to untangle (build):** `Finding.context.activeFilters` holds the scope correctly, but `Hypothesis.condition` puts a where-clause _on the cause_, and the **Problem Statement is not a first-class entity** (synthesized string in `buildProblemStatement`; "with-causes" maturity is a comment, not a type). Make the **Problem-Statement scope first-class** with **multiple causes nested**; `GateNode`/`problemContributionTree` already composes the causes.
- **Contribution is level-native (NOT a bespoke SS-share):** per-lens native share (Cpk-per-group / Pareto count / regression slope / VA% / bottleneck-sec) + **What-If** as the actionable cross-lens number, routed by the **three process-learning levels Y/X/x** (Outcome/Flow/Local — "level before mode"). No Lean/Six-Sigma labels in product. (Grounded: zero SS / F-ratio / variance-components arithmetic across 144 pp of the author's own teaching → a bespoke SS-% would be _more formal than the course_.)
- **Trust = soft caveat, not a gate:** operational-definition + MSA/Gage-R&R are **optional free-text notes** surfaced beside the contribution; **no stability gate** (instability is the signal you drill into).
- **Iterative Measure⇄Analyze loop:** a drilled condition opens a new local `y=f(x)`; **Measurement Plan = a DCP** — `{ outcome(Y), primaryFactor, neededFactors[] (stratifiers, captured alongside — not one), sampleSize, method, owner, status, scope, processLocation, opDef?, msaNote? }`. **No randomized-order field; MSA = optional comment.** All three surfaces (Process tab / Evidence Map / Wall) deepen together on re-ingest via the `processLocation` join + the existing column-mediated binding (`conditionReferencesStep`).

**Cluster B — analysis surfaces (settled 2026-05-29):** **#50** — retire "mode" + "lens" as user axes. The four lenses (CHANGE/FLOW/FAILURE/VALUE) are **pedagogy only** (no UI picker; the 4 charts are always-on — `mental-model-hierarchy.md:118`); the 3 code modes (`standard`/`performance`/`defect`, capability derived) **dissolve into the Frame** (data shape) + measure selection. Model = pick a **measure (Y) + factor(s)** → always-on charts (I-Chart/Boxplot/Pareto/Stats) + drill; "Level" = which measure (global vs step-local). The ONE genuine view that survives = **Values ⇄ Capability** (specs-gated; per-subgroup Cp/Cpk **stability** — `packages/core/src/stats/subgroupCapability.ts` / ADR-038 / `docs/03-features/analysis/subgroup-capability.md`; the "don't Pp on my Cp" apparatus — a distinct VIEW, not a lens). Plus a **Frame-aware outcome+decomposition pairing** (I-Chart = framed outcome / Boxplot = framed per-step measures by step = the L1+L2 **bottleneck / "process-flow" view**; part-whole only — NOT two unrelated Ys, per ADR-073). **#11** (Analyze-tab) + **#51** (Phase-2 bidirectional) fall out of Cluster C (drop-Question / Wall-centric / drill-to-condition; condition=scope). **Build:** per-chart measure binding for the outcome+decomposition view (today one shared Y feeds all 4 charts); multi-outcome + step-scope picker partial.

**Open questions:** overlap apportionment when two hypothesis conditions share rows (coverage double-counts) · confirm Measurement-Plan hypothesis-exclusivity is intentional (requires a `hypothesisId`; no plan on a bare condition) · freeze-vs-auto-sync a hypothesis's condition at capture (lean: freeze + allow refine) · the "different measure per chart" question is resolved to _part-whole only_ (outcome+decomposition), arbitrary unrelated-Y pairing deliberately excluded.

**Build reality:** ~70% built — MeasurementPlan primitive (`packages/core/src/measurementPlan/`, WIRED through `AddPlanForm`/`HypothesisCardWithPlans`/HubRepository); the per-step local `y=f(x)` (`LocalMechanismView` L3 = local Evidence Map + local Wall + η²); `HypothesisCondition` + HOLDS evaluator; drill chips (`analysisScopeStore`); the river Wall (`AnalyzeWall/`, canonical `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`). **Net-new:** scope/outcome/`processLocation`/`neededFactors[]`/opDef/msaNote on the Plan; the **auto-link engine** (re-ingest → detect new column → generate Finding → match by factor → link → progress status — aspirational; manual 3-step picker today); the re-load cascade (append preserves but doesn't re-match; replace orphans); the disconfirmation UX (`setHubStatus` orphaned, `disconfirmationAttempts` zero-UI). **Architectural prereq:** reconcile the **two unreconciled process-step models** — rich `ProcessMap`/`ProcessMapNode` (canvas L2/L3) vs flat `IP.processSteps {id,name,order}` (E1).

**Decision / next step:** **[PROMOTED 2026-05-29]** — graduated to the combined [investigation-surface design spec](../superpowers/specs/2026-05-29-investigation-surface-design.md) + 5 ADRs ([085](../07-decisions/adr-085-drop-question-problem-statement-scope.md) drop-`Question` / Problem-Statement-scope · [086](../07-decisions/adr-086-unified-investigation-canvas.md) unified canvas · [087](../07-decisions/adr-087-process-step-model-reconciliation.md) step-model reconciliation · [088](../07-decisions/adr-088-level-native-contribution.md) level-native contribution · [089](../07-decisions/adr-089-retire-mode-lens-user-axis.md) retire mode/lens + Values⇄Capability) + the [master plan](../superpowers/plans/2026-05-29-investigation-surface-master-plan.md) (IM-0…IM-7). Build halts at plan-ready for ADR review. Grounding refined the design (three step homes not two; `ProblemCondition`/`ScopeFilter` name-collisions; the What-If chain already exists; 8f LOD ≠ factor-family coarsening; `SuspectedCause` type never existed). Doc-layer propagation (spec §13) lands per-PR in each Apply phase; pre-existing drift (Control rename, Sponsor-gatekeeper wording, stale `stores/CLAUDE.md` SuspectedCause claim) safe to fix anytime.

**Doc-layer propagation (SDD "Apply" phase, with the spec, post-Cluster-B — not now):** the spec's `implements:` must amend — **L1 vision** (`methodology.md`/`eda-mental-model.md`: drop-Question, the "One Graph, Three Projections" line still names `SuspectedCause`+`Question`; `positioning.md`: Project=collaboration, Control naming); **L2 journeys** (`ia-nav-model.md`; `personas/*` Sponsor non-gating; NEW #37 Mode-1 solo-investigation journey; the drill→hypothesis→collect-more loop); **L3 features** (`workflows/analyze-wall.md`; Evidence-Map/muuttuja-kartta; Measurement-Plan-as-DCP; contribution-by-lens; `workflows/control.md` #12). **Safe to fix NOW (independent of the spec — pre-existing drift):** Sponsor-gatekeeper wording (personas + ia-nav, stale vs the existing wedge spec) + Control-vs-Sustainment stage naming.

Full detail: memory `project_investigation_model_design.md` + plan `~/.claude/plans/i-m-coming-off-linked-serialized-sparkle.md`.

### Palette overlays (ColumnChipContextMenu + ParsingOverridePopover) lack viewport clamping

**Surfaced by:** PR-CCJ-B2.3 final Opus branch review, 2026-05-27.

**Description:** `ColumnChipContextMenu.tsx` and `ParsingOverridePopover.tsx` render at the caller-provided `anchor = (rect.left, rect.bottom)` from `ColumnChip`'s ▾ / ⋮ buttons. A chip near the right or bottom viewport edge will paint the overlay partially offscreen. `packages/ui/CLAUDE.md` documents the Evidence Map context-menu pattern as "fixed position, **viewport-clamped**, auto-focus first item, Escape + backdrop-click close" — `EvidenceMapContextMenu/NodeContextMenu.tsx:62-71` uses `useLayoutEffect` to clamp left/top with an 8 px margin. The B2.3 sub-plan explicitly deferred clamping in scope §"Out of scope" with the rationale "trust caller-provided anchor; revisit if real overflow surfaces." The reviewer's flag IS that trigger — no current app wires the palette, but H1 polish should not ship without clamping.

**Possible resolutions (PR-CCJ-H1):**

- Port `NodeContextMenu`'s `useLayoutEffect` clamp pattern to both overlays (~10 lines each).
- Extract a shared `useClampedAnchor(anchor, ref)` hook in `packages/ui/src/components/Canvas/EditMode/Palette/` so a third overlay variant in C-phase (e.g. specs popover) inherits the behavior.

**Decision:** logged for H1 polish; not blocking B2.3 merge per plan scope.

### ParsingBanner ARIA role — `status` vs `alert`

**Surfaced by:** PR-CCJ-B2.3 final Opus branch review, 2026-05-27.

**Description:** `ParsingBanner.tsx` uses `role="status"` (implies `aria-live="polite"`). For a ⚠ warning copy ("N columns need attention"), `role="alert"` (assertive) is more typical for screen-reader interruption semantics, or `role="region" aria-label="Parsing warnings"`. Spec §3.1 does not pin this. `role="status"` is defensible (banner is a passive status surface that appears after a paste, not an emergency) but worth confirming with accessibility lens in H1.

**Decision:** logged for H1 polish; not blocking B2.3 merge.

### `CharacteristicType` SSOT consolidation in `@variscout/core`

**Surfaced by:** PR-CCJ-C1 implementer + Opus reviewer, 2026-05-27.

**Description:** `@variscout/core` has two `CharacteristicType` definitions:

- `packages/core/src/types.ts:121` — legacy `'nominal' | 'smaller' | 'larger'`, used by `SpecEditor`, `CharacteristicTypeSelector`, `inferCharacteristicType()` on `SpecLimits` (PI Panel surface).
- `packages/core/src/processHub.ts:84` — wedge V1 `'nominalIsBest' | 'smallerIsBetter' | 'largerIsBetter'`, used by `OutcomeSpec` + new Canvas Edit-mode `OutcomeZone` components.

Same semantic concept, different vocab. Both lived in the barrel briefly (PR-CCJ-C1 Task 1 added the duplicate); resolved by importing the wedge V1 union via `@variscout/core/processHub` subpath in new consumers (`b9532636` keeps barrel = legacy). Long-term SSOT consolidation should:

1. Migrate `SpecEditor`, `CharacteristicTypeSelector`, `inferCharacteristicType`, and `SpecLimits` to the wedge V1 vocab.
2. Retire the legacy type at `types.ts:121`.
3. Re-add `CharacteristicType` to the barrel (single canonical type).

**Decision:** logged for post-C cleanup (likely H1 polish or a dedicated tooling PR). Not blocking C2/C3 — the subpath import is the correct C-phase pattern.

### Canvas/index.tsx `handleDragEnd` wiring for `handleOutcomeDrop`

**Surfaced by:** PR-CCJ-C1 implementer + Opus reviewer, 2026-05-27.

**Description:** C1 ships `handleOutcomeDrop()` as a pure unit-tested helper at `packages/ui/src/components/Canvas/EditMode/handleOutcomeDrop.ts`, but the parent-level integration at `packages/ui/src/components/Canvas/index.tsx:425` (`useChipDragAndDrop({ handleDragEnd })`) is NOT wired. Until wired, dragging a `column:<name>` chip onto the OutcomeZone fires no callback — UI displays the drop affordance but no `OutcomeCard` materializes.

**Why deferred from C1:** C1 scope was the Edit-mode authoring SURFACE (components + helper + EditModeShell prop surface). The Canvas wiring requires Canvas to accept a new `onOutcomeSpecAdd` prop and route to it from `handleDragEnd`, then consumers (PWA/Azure app) wire `useState<OutcomeSpec[]>` and pass it through. The plan's "Out of scope" section properly defers persistence to E1; without persistence, even with Canvas wiring, drops would be lost on re-render.

**Decision:** C2 (Factors zone) MUST bundle the Canvas wiring for both outcome + factor drop routers in one PR — they share the same `DndContext` and a single `handleDragEnd` extension is cleaner than two staged additions. Tracked as part of C2's scope.

### Two "Done" buttons in Edit mode (Process tab)

**Surfaced by:** PR-CCJ-B1 (`feat/wedge-v1-ccj-b1-edit-mode-shell`), 2026-05-26. Branch-level reviewer + Task 4 spec reviewer.

**Description:** When the user is in Process tab Edit mode, two visually distinct "Done" affordances appear simultaneously: (a) the relabeled `CanvasModeToggle` icon button in the canvas chrome with `aria-label="Done"`, and (b) the `EditModeShell` header's visible-text "Done" button. Both call `setAuthoringMode('read')`; behavior is identical, no state divergence. Tests disambiguate via `within(shell)` (`CanvasWorkspaceEditModeShell.test.tsx:233`) and `aria-pressed` (`CanvasWorkspace.test.tsx:906`) — durable scoping using attributes the toggle reliably exposes.

**Possible resolutions (for PR-CCJ-H1 polish):**

- Hide `CanvasModeToggle` when the workspace renders inside `<EditModeShell>` — pass `onModeChange={undefined}` to `<Canvas>` whenever `showEditShell === true` (the existing hide-toggle guard at `Canvas/index.tsx:593` handles this). Keeps the shell's prominent text Done as the canonical exit.
- Keep both, but visually de-emphasize the toggle when inside the shell so the shell's Done is the obvious affordance.
- Keep both as-is — the chrome's icon-toggle stays useful for keyboard discoverability of mode-switch even when the shell is present.

**Spec status:** Spec 2 §2.3 names "one Edit map / one Done" conceptually but is silent on the icon-toggle's behavior _while inside_ Edit mode. Not a B1 spec violation; resolution deferred until the shell carries real authoring zones (Phase C+) so the UX seam can be evaluated against the mature shell, not the empty placeholder.

**Promotion path:** Resolve in `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md` H1 (PR-CCJ-H1) when polish work begins. Not blocking any subsequent task. [RESOLVED 2026-05-28 via PR #236 — LV1-C retired `EditModeShell` + `CanvasModeToggle` + the Done button entirely, eliminating this entry's premise.]

---

### CoScout AI prompt vocabulary alignment

**Surfaced by:** PR-WV1-NAV-2026-05-27 spec-reviewer audit on the 13-commit Investigation → Analyze rename sweep.

**Description:** Three CoScout prompt-authoring files emit "investigation" methodology language into LLM context that ultimately appears in user-visible CoScout responses:

- `packages/core/src/ai/prompts/coScout/legacy.ts` (deprecated `buildCoScoutSystemPrompt`)
- `packages/core/src/ai/prompts/coScout/context/analyze.ts` (Tier 2 context formatter)
- `packages/core/src/ai/buildAIContext.ts` (AIContext assembly entry)

The rename pass renamed the **Analyze tab** (formerly Investigation tab) + the Sustainment stage → Control. But the methodology word "investigation" — meaning **"the practice of inquiry"** (as in "this requires investigation" = "this requires inquiry") — appears in CoScout prompts both as references to the renamed tab AND as the methodology noun in instructional / pedagogical / framing text. Disambiguating which sites are referring to which is a per-occurrence judgment call that the cleanup pass deferred.

Each of the 3 files carries a top-of-file deferral comment (PR-WV1-NAV cleanup deferral 2026-05-27) preserving the existing prose pending a design call.

**Possible resolution paths:**

- **Strict rename pass** — all "investigation" occurrences in these files become "analyze" (matches the renamed tab name; loses some methodology nuance in instructional copy where the word means "inquiry").
- **Disambiguate per site** — read each occurrence, decide tab-name vs methodology-word, rename only tab-name sites. Higher fidelity; bigger time investment.
- **Style-guide ruling** — adopt a project rule that CoScout prompt copy uses "Analyze" for the tab and "analysis" / "explore" for the methodology act (avoids "investigation" entirely). Then rename all 3 files mechanically + write the rule into `.claude/INVARIANTS.md` or the AIX design system doc.

**Promotion path:** Pair with the CoScout prompt design owner; resolve in a follow-up PR (CoScout vocabulary alignment). Not blocking PR-WV1-NAV-2026-05-27 merge.

---

### Foreign-key field name `investigationId` rename deferral [RESOLVED 2026-06-05 → PO-7]

**[RESOLVED 2026-06-05 → PO-7]** The deferred FK rename was executed in `feat/po-7-rename-sweep` (PR `feat/po-7-rename-sweep`, 2026-06-05): `ControlRecord/Review/Handoff.investigationId` → `projectId`, `ImprovementProject.metadata.investigationId` → `projectId`, `ProblemStatementScope.investigationId` → `projectId`, migration-modal entry renamed. Option (b) from the possible-resolutions list — atomic Opus implementer sweep — was the delivery vehicle, per `feedback_atomic_sweep_one_dispatch`. Wedge no-back-compat: pre-rename persisted rows yield `projectId === undefined` and silently stop joining; the cost is documented-by-test (ADR-091; loud validation = PO-8a). See decision-log §1 2026-06-05 PO-7.

**Surfaced by:** PR-WV1-NAV-2026-05-27 final-branch reviewer audit on the 22-commit Investigation → Analyze vocabulary rename.

**Description:** The wedge V1 vocabulary refresh renamed the `Investigation` entity → `Analyze` across types, stores, hooks, components, i18n, and canonical docs. The **foreign-key field name on related entities** was preserved — i.e. `ControlRecord.investigationId`, `ControlHandoff.investigationId`, and `ImprovementProjectMetadata.investigationId` still carry the `investigationId` token even though the entity those IDs point to is now an `Analyze`.

Renaming the FK token would cascade to ~130 files: ~50 components reading the field, ~30 tests asserting on shapes, persistence read/write (Dexie schema + bumped migration), serializers (`.vrs` export/import), and CoScout AIContext payloads. No observable behavior change — the field is a stable opaque ID and the JSON keys are not user-visible.

The reviewer flagged the asymmetry: the rename pass is otherwise exhaustive (architecture-grep tripwires pass, no `Investigation`-prefixed types remain outside the explicit preservation set), so the surviving FK token reads as drift rather than as a designed exception.

**Possible resolutions:**

- **(a) Accept as design debt.** Document the asymmetry in `.claude/INVARIANTS.md` or the entity-rename rule, and move on. Pro: no further work. Con: future readers will flag it again; the asymmetry is real.
- **(b) Atomic follow-up sweep.** Ship a single Opus-implementer follow-up PR (per `feedback_atomic_sweep_one_dispatch`) doing the cascade in one commit: Dexie schema bump, persistence shims, all consumer renames, all test fixture updates. Pro: drift closed cleanly. Con: ~130-file PR; per-task review is harder.
- **(c) Preserve indefinitely as "stable token".** Promote the asymmetry to an explicit invariant: "Entity names evolve with vocabulary; foreign-key tokens stay stable to preserve serialization compatibility." This is the conservative position — many real-world systems take it. Pro: durable answer. Con: only matters if we expect serialization compatibility across vocabulary shifts; wedge V1 has no users yet (`feedback_wedge_v1_no_migration_no_backcompat`) so this rationale is weak.

**Promotion path:** Design call before next major version (V2 or the Process tier). Until then the FK rename is parked. Not blocking the wedge V1 master plan continuation.

---

### Docs site sidebar drift: 5 dead refs + 5 unlisted personas

**Surfaced by:** PR #207 fixing the `pnpm build` failure on `@variscout/docs`, 2026-05-25.

**Description:** Build was failing because `apps/docs/astro.config.mjs` referenced 5 slugs with no corresponding content file. Starlight resolves `slug: 'foo/bar'` to either `foo/bar.md` OR `foo/bar/index.md` — initial audit missed the directory-index resolution and over-counted to 25 dead refs; an Opus reviewer caught the false positives during PR #207 review (reverted 19 incorrect removals — those slugs all point to existing `index.md` files like `04-cases/avocado/index.md`).

**The 5 actually-dead slugs**, all removed in PR #207:

| Slug                                          | Most likely cause                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `02-journeys/personas/green-belt-gary`        | wedge V1 persona retirement                                                           |
| `02-journeys/personas/curious-carlos`         | wedge V1 persona retirement                                                           |
| `02-journeys/personas/student-sara`           | wedge V1 persona retirement                                                           |
| `08-products/azure/pricing-tiers`             | superseded by tier-gating retirement (per memory `feedback_tier_gate_inside_surface`) |
| `07-decisions/adr-033-pricing-simplification` | ADR moved to archive or never landed                                                  |

**Secondary drift (other direction)**: 5 files in `02-journeys/personas/` are not in the sidebar — `analyst-alex.md`, `engineer-eeva.md`, `lead.md`, `member.md`, `sponsor.md`. The last three are the wedge V1 project roles (Lead / Member / Sponsor per `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` §4); the other two appear to be unsurfaced marketing personas.

**Possible directions for the secondary drift:**

- **Surface the wedge V1 project roles** under a new "Project Roles" sidebar group, separate from "Personas" (which would stay GTM-only).
- **Surface analyst-alex + engineer-eeva** under Personas if current; archive otherwise.
- **Audit all 5 with marketing/product** — likely the right answer.

**Promotion path:** Decision required from marketing/product on the secondary-drift personas. Promote to `docs/decision-log.md` when locked. Not blocking — site builds today.

**Process lesson** (for the originating PR's controller): when auditing a docs-tool sidebar, model the tool's slug-resolution rules accurately before flagging entries as dead. Starlight's directory-index rule was the trap here.

---

### `@variscout/ui` vitest full-suite hang (pr-ready-check blocker) [RESOLVED 2026-05-25]

**Surfaced by:** Lane B Phase 1 controller verification (PR #203), 2026-05-19.

**STATUS 2026-05-25 — RESOLVED:** Wholesale-rewrote `Canvas.test.tsx` (1500 lines → ~575 lines) on branch `fix/canvas-test-quarantine-vitest-hang`. **Actual root cause:** the legacy file imported the real `@variscout/hooks` package — its transitive graph (`useCanvasViewportInput`, `useCanvasHypothesisDrawing`, `useCanvasKeyboard`, `useChipDragAndDrop`, …) deadlocked vitest's mock-resolution during module init. The fresh file mirrors `CanvasWorkspace.test.tsx`'s full `vi.mock('@variscout/hooks', ...)` factory (~365 lines, the proven non-hang pattern), keeps the 4 component mocks (`@variscout/charts` via `importOriginal`, `../../InvestigationWall` synthetic, `@dnd-kit/core` synthetic, `../internal/LocalMechanismView` synthetic), and covers Canvas-direct concerns only: smoke render, L2 step cards, step-click → 3 wedge-V1 response-path CTAs render, Charter callback fires with stepId, Charter hides when handler absent (per `responsePathCta.ts` "hide, don't tease" rule), mobile Wall-shortcut visibility. Deeper response-path coverage stays in `internal/__tests__/CanvasStepOverlay.test.tsx` (unit) and `CanvasWorkspace.test.tsx:1093` (workspace integration). Earlier `importOriginal`-only hypothesis (from an Explore subagent on the same date) was insufficient — verified hung at 240s after that change; the `@variscout/hooks` mock was the missing piece.

**Verification:** isolated file 6/6 passing in 3.19s; full `@variscout/ui` suite 223 files / 2140 tests in 86.59s (down from 117s baseline with quarantine); `scripts/pr-ready-check.sh` green end-to-end.

**Bisect log (2026-05-25, controller: Opus):**

| Iter | Filter                                                                     | Files        | Result          | Outcome                |
| ---- | -------------------------------------------------------------------------- | ------------ | --------------- | ---------------------- |
| 0    | Sanity: `SystemLevelView`                                                  | 1            | passes 2.96s    | tooling OK             |
| 1    | `InvestigationWall ReportView ImprovementPlan IPDetail ImprovementProject` | 84           | passes 17.90s   | offender NOT in these  |
| 2    | `Canvas`                                                                   | ~28          | hangs (SIGKILL) | offender in Canvas fam |
| 3    | `Canvas/internal`                                                          | 22           | passes 8.93s    | offender NOT in here   |
| 4    | `Canvas/__tests__`                                                         | 3            | hangs (SIGKILL) | narrowed to 3 files    |
| 5a   | `Canvas.test`                                                              | 1+wallcanvas | hangs           | **offender**           |
| 5b   | `CanvasProcessMap`                                                         | 1            | passes 4.69s    | not it                 |
| 5c   | `CanvasWorkspace`                                                          | 1            | passes 6.16s    | not it                 |

Root-cause diagnosis deferred — likely candidates per stack signature: a `vi.mock` factory with `await import('react')` interacting with the heavy transitive import graph of `Canvas/index.tsx` (which pulls @variscout/charts + InvestigationWall + LocalMechanismView + the store family). 50 tests of Canvas integration coverage are dark until this is fixed.

**Promotion path:** CLOSED 2026-05-25 — entry retained as historical record; promotion path no longer applicable. If a _new_ heavy-mock test file is added with similar import shape (real `@variscout/hooks` + Canvas-like component graph) and starts hanging, the bisect playbook in `feedback_pr_ready_check_vitest_hang` still applies — but the structural lesson (mirror `CanvasWorkspace.test.tsx`'s hooks-mock pattern from the start) is now the durable answer.

**Description:** `bash scripts/pr-ready-check.sh` hangs indefinitely on its first step (`pnpm test` via turbo). Sampling the worker via macOS `sample(1)`:

- Under turbo: V8 hot in `Object.defineProperty` / `OrdinaryDefineOwnProperty` flood — vitest mock/spy installation loop. STAT=`R`, CPU=101%, observed 57+ minutes.
- Without turbo (direct `pnpm --filter @variscout/ui test -- --run`): different signature — V8 hot in `MicrotaskQueue::RunMicrotasks` → `PromiseFulfillReactionJob` → `AsyncFunctionAwaitResolveClosure` → deep `InterpreterEntryTrampoline` recursion. Promise reaction loop. Same STAT=`R`, CPU=102%, observed 3+ minutes before kill.

Other packages are clean: `@variscout/core` (3397 pass, 18s), `@variscout/hooks` (1203 pass, 87s), `@variscout/stores` (281 pass, 5s), `@variscout/charts` (170 pass, 30s). The implementer's targeted `pnpm --filter @variscout/ui test -- --run SystemLevelView` ran the affected Phase-1 file cleanly in **1.91s** on the same tree, ruling out the Pp/Ppk deletion as causal. The hang is in _some other_ ui test file the targeted filter doesn't load. _(2026-05-25: bisect confirmed offender = `Canvas/__tests__/Canvas.test.tsx` — see STATUS block above.)_

---

### Testing strategy — Tier 2 + Tier 3 deferred work

**Surfaced by:** Wedge V1 post-launch testing audit, 2026-05-17 (PR #197 + PR #198 + plan in `~/.claude/plans/`).

**Description:** Tier 1 testing improvements shipped as [PR #198](https://github.com/jukka-matti/variscout/pull/198) (Math.random retirement + ESLint guard + fake-indexeddb docs + local TDD cheatsheet). Tier 2 (Vitest Projects migration) and Tier 3 (branded-type architecture guards / Vitest pool profiling / scheduled nightly Playwright + optional CI coverage) are preserved as a planning artifact rather than scheduled. The full plan including triggers-for-execution, file-level scope, and sequencing lives at [`docs/superpowers/plans/2026-05-17-testing-strategy-tier2-3-deferred.md`](../superpowers/plans/2026-05-17-testing-strategy-tier2-3-deferred.md).

**Possible directions:** See the linked plan doc — each tier has its own trigger condition. CI work (Tier 3c) is explicitly user-deferred ("for ci, we want to keep it local for now"); revisit only if policy changes.

**Promotion path:** When any single tier item becomes worth scheduling, dispatch via `superpowers:subagent-driven-development` per the linked plan. The plan is intentionally written so any one item can ship independently.

---

### PR-WV1-1 — architecture-review follow-ups (project membership foundation)

**Surfaced by:** system-architect (Opus) review on `feat/wedge-pr-wv1-1-project-membership` 2026-05-16, after the 10-task implementation sub-plan completed. CRITICAL (app-side wiring gap) was fixed in commit `695091e3` before merge; 3 IMPORTANT items deferred to PR-WV1-2 via `decision-log.md` 2026-05-16 wedge-amendment; 2 items below are smaller follow-ups outside the wedge implementation sequence.

**Open items (post-merge):**

- **Admin view of pending invites per project (V2 deferral)** — `useProjectMembershipStore` is per-user only: each user sees their own `pendingInvites[]`, no surface today for a Lead to see "who else have I invited to project X who hasn't accepted yet?". Wedge spec §4 doesn't require this; track for V2 collaboration features. Promotion: spec amendment + new UI when collaboration tier work lands.

- **`useInvitationSync` Graph API wiring** — V1 ships a stub at `apps/azure/src/features/projectMembership/useInvitationSync.ts` that echoes the email as `{ userId, displayName: email.split('@')[0] }`. Real Microsoft Graph user-lookup wiring (with proper `displayName` resolution from AD, photo fetch optional) is post-V1 Azure-only follow-up. Today no caller invokes the stub — Task 8's Charter integration builds `displayName` inline. Promotion: separate Azure-only PR; trigger is the first call site that needs real AD lookup.

- **`displayName = email.split('@')[0]` truncation for dotted email locals** — Task 8's `IPDetailPage.handleMemberInvite` derives `displayName` from the email (e.g., `first.last@org` → `first.last`). V1-acceptable since the modal has no Name field, but produces awkward strings for users with dotted email locals. Promotion: gated on either (a) Name field added to `InviteModal`, or (b) `useInvitationSync` returning real Graph displayName.

---

### Durable cross-device invitation persistence

**Surfaced by:** PR-WV1-3a Implementation 2026-05-16.

**Description:** Invitations live transiently in `useProjectMembershipStore.pendingInvites[]` + localStorage. The inviter sees the invite locally; the invitee on a different browser does not. The wedge spec §4.2 "in-app + email notification" relies on the email half for cross-device delivery. For durable in-app multi-device delivery, invitations must persist somewhere tenant-scoped (`ImprovementProjectMetadata.invitations?: Invitation[]` field OR a tenant-wide invitation table).

**Possible directions:**

- Add `invitations?: Invitation[]` to `ImprovementProjectMetadata` (parallel to `members?`). Banner reads from a derived selector iterating all IPs for the current user. Cost: schema migration, .vrs round-trip, Dexie scheme bump.
- Tenant-wide invitation table in `azureHubRepository`. Cost: new repo path; PWA has no parallel.

**Promotion path:** Decision required if customer demand surfaces for multi-device invite UX. Track until PR-WV1-5 (tier-gating retirement + nav reorder, where auth-wiring refinement lands) — that PR is the natural place to revisit since per-user persistence keys (`useProjectMembershipStore`'s deferred item (c)) are also being addressed there.

---

### 8f canvas viewport — followup findings from 3-agent retrospective

**Surfaced by:** retrospective architecture / design / code-quality review on `main` 2026-05-13, after 8f's 6 PRs (#160–#165) shipped. Per-PR Opus reviews had passed; cross-PR drift was the gap.

**Description:** 20 findings total — 5 HIGH that qualify the "shipped" claim, 8 MEDIUM spec-vs-shipped drift, 7 LOW cleanups. Followup workstream plan at [`docs/superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md`](../superpowers/plans/2026-05-13-canvas-viewport-8f-followups.md). Decision-log "8f canvas viewport SHIPPED" entry has been amended to reference these gaps. Roadmap continues to mark 8f shipped; the followups are a separate cleanup sequence.

**STATUS 2026-05-14 — RESOLVED:** 19 of 20 findings closed by PR #166 (squash-merged as `cd936915` after `--chrome` walk verification). HIGH #4 resolved via spec AMEND (intentional V2 placeholders); HIGH #1/#2/#3/#5 resolved via implementation; all 8 MEDIUM resolved (including the spec §10 amend); 6 of 7 LOW resolved. LOW #19 (brand `ProcessHubId`) closed by PR #168 (cleanup/setstate-appmain) — opaque type defined in `packages/core/src/processHub.ts`, sentinel `'__wall-canvas-unbound__'` replaced with `null` short-circuit, 25-file sweep across packages + apps + tests. **Remaining:** LOW #16 (`Canvas/index.tsx` 1122-line refactor, defer to next viewport feature). Entry retained as historical record; the diff is in `cd936915` + PR #168.

**HIGH (5):**

- **Azure Blob sync gap** — `apps/azure/src/features/investigation/useCanvasViewportLifecycle.ts:15-30` is byte-identical PWA/Azure; both call only `persistCanvasViewport` / `rehydrateCanvasViewport` against local Dexie. ADR-081 §2 locked "Azure = IndexedDB + Blob sync with ETag per ADR-079." Team-shared per-Hub viewport does not round-trip across devices on Azure.
- **AuthorL3View parallel-implements FRAME column-assignment** — `packages/ui/src/components/Canvas/internal/AuthorL3View.tsx` is a hand-rolled droppable + ChipRail wrapper re-deriving `assigned/ctqColumn/tributaryColumns`. Spec §5.3.b + ADR-074 amendment require embedding `packages/ui/src/components/Frame/`. The cleanest ADR-074-amendment violation in the shipped surface.
- **Legacy `variscout-wall-layout` IndexedDB never deleted in prod** — `packages/stores/src/canvasViewportStore.ts` has no `Dexie.delete('variscout-wall-layout')` call. The test at `canvasViewportStore.test.ts:297` titled "clean-breaks an existing v1 project-keyed Dexie database" creates the legacy DB but never asserts deletion. Silent storage leak for any user who touched the prior store.
- **Lens × level matrix narrower than spec §10** — `packages/hooks/src/useCanvasStepCards.ts:38-75` sets `performance.enabled:false` and `yamazumi.enabled:false`; `CanvasLensPicker.tsx:36` disables their buttons. Spec §10 only disables 3 cells (yamazumi-L1 + process-flow-L1 + process-flow-L3). Net: 6 of 13 enabled cells are unreachable because the lens is unselectable. **RESOLVED 2026-05-13 via AMEND path** — `performance` and `yamazumi` were intentional V2 placeholders at original ship (registry descriptions say "Future ... lens"). Spec §10 amended to mark these cells as deferred-V2 rather than expanding the registry. Original §10 over-promised; the as-shipped state is the right one.
- **~30+ hardcoded English UI strings** in `SystemLevelView.tsx` (~16 instances: outcome labels, capability metrics, Inbox, prompts), `useCanvasStepCards.ts:38-75` (lens labels + descriptions in `CANVAS_LENS_REGISTRY`), `CanvasLensPicker.tsx:26,37,51`, `NoFocalStepPrompt.tsx:24`, `MobileLevelPicker.tsx:55`, `AuthorL3View.tsx:31`, `LocalMechanismView.tsx` (~4 strings). None in `packages/core/src/i18n/messages/`.

**MEDIUM (8):**

- LOD cross-fade is cosmetic-only — `LODSwitcher.tsx:14-26` sets `opacity: 1` constant with a 150ms transition; nothing to interpolate. Spec §4.6 promised real cross-fade.
- Snap-to-LOD on wheel-stop missing — spec §4.6 commits to easing from 0.3–0.5 → 0.5 and 1.8–2.0 → 1.8.
- L1 `specLimits` not contractually tied to outcome's own spec — `SystemLevelView.tsx:89-100` trusts caller; latent ADR-073 risk if a step-level spec leaks in.
- L3 response-path CTAs collapsed to Quick Action only — `LocalMechanismView.tsx:207-214` renders one "Action" button per column. Spec §5.3.a lists 5 CTAs (Quick Action / Focused Investigation / IP / Sustainment / Handoff).
- Mobile L3 without focalStep redirects to L2 + `setZoom(2.5)` instead of step-list — `MobileLevelPicker.tsx:71-75`. Spec §7 promised "Pick a step to view" list.
- d3-zoom subscribes store-wide — `useCanvasViewportInput.ts:81` calls `useCanvasViewportStore.subscribe(...)` with no selector. Every store mutation fires `syncElementToStoreViewport()`. Diff-check makes it cheap, but should be selector-scoped via `subscribeWithSelector`.
- `setViewportLevel` throws on L3 without focalStepId — `canvasViewportStore.ts:114`. Zustand `set` inconsistency risk; prefer warn + no-op.
- Click-vs-drag deadband not explicitly set to 6px — `useCanvasViewportInput.ts` uses d3-zoom defaults; spec §6.3 contract not enforced.

**LOW (7):**

- `STORE_LAYER === 'annotation-per-project'` but state is per-Hub keyed — `'annotation-per-hub'` would be more honest (the test enum already allows it).
- `Canvas/index.tsx` now 1122 lines — refactor target before next viewport feature.
- `CanvasViewport.tsx` primitive appears unused — `Canvas/index.tsx` inlines the CSS transform via `lodInputSurfaceRef`. Verify and either adopt or delete.
- `worldToWallSvg(p, _viewport)` in `coordSpace.ts:22` is identity — delete or document.
- Stale `wallLayoutStore` references in `viewStore.ts:140` + `preferencesStore.ts:178` doc strings.
- ~~Sentinel hubId `'__wall-canvas-unbound__'` in `WallCanvas.tsx:248` — brand `ProcessHubId` to prevent leak into the store's `viewports` Record.~~ **CLOSED** — PR #168: `ProcessHubId` opaque type in core, `hubId ?? null` sentinel removed, full 25-file sweep.
- Missing test — `CanvasLensPicker.tsx` (the lens × level enabled predicate is load-bearing).

**Possible directions:** Execute the 6-PR followup plan via `superpowers:subagent-driven-development`. PR0 (docs sync) direct to main; PR1 (i18n + Dexie cleanup + branded hubId), PR2 (ADR-074 cleanup), PR3 (lens matrix — brainstorm first to decide expand-vs-amend), PR4 (LOD polish + dead-code), PR5 (Azure Blob sync — the ADR-081 §2 commitment), PR6 (L3 CTAs + mobile step-list + selector scope + STORE_LAYER rename).

**Promotion path:** entry closes when the 6 followup PRs ship; decision-log amendment block updates to note "followups complete"; `MEMORY.md` line 4 flips from "8f SHIPPED with followups in flight" to "8f SHIPPED + followups complete"; `project_canvas_viewport_8f.md` caveat block removed.

---

### Canvas journey clarity — designer-lens UX observations from PR #166 walk

**Surfaced by:** `--chrome` walk of PR #166 on 2026-05-14, requested as "designer classes on, think how logical and easy to use and understand is the whole analysis journey."

**Description:** PR #166 itself ships the followup fixes correctly; the broader Canvas journey has discoverability and labeling friction worth tracking separately from #166 scope:

1. **"Frame" tab label hides that this IS the canvas.** Top nav reads `Frame | Analysis | Investigation | Improvement | Report`. The vision spec (`project_canvas_replaces_tabs.md`, Q0 2026-05-03) commits to `[Hubs] [Canvas] [Investigation] [Improvement] [Report]`. A new user clicks "Frame" expecting "set up framing" and gets the L1/L2/L3 canvas surface with no breadcrumb signaling it. Nav rename to `Canvas` is the cheapest journey-clarity win.

2. **Desktop has no visible LODSwitcher.** Mobile has `MobileLevelPicker` pills (`System | Process | Step`); desktop users discover level changes only via wheel-zoom (no level chip, no breadcrumb, no "you are here" indicator). Desktop parity would be a small toolbar component.

3. **Mode toggle is mislabeled "Lock canvas."** The `CanvasModeToggle` button uses the lock/unlock icon + label "Lock canvas" / "Edit canvas" to flip between `author` mode (AuthorL3View column-assignment) and `read` mode (LocalMechanismView with 4 response-path CTAs). A user reading "Lock" thinks "prevent edits," not "switch to analysis view that exposes Investigate / Charter / Sustain / Handoff." The 4 column-granularity CTAs that PR #166 ships are gated behind a button no one will click to find them.

4. **L1 capability metrics row shows `--` despite specs detected on load.** Showcase opening modal said "Cpk 0.81 — Below target"; L1 SystemLevelView shows `Cp -- Cpk -- Pp -- Ppk -- Conformance 100.0%`. The gap is `outcome.ctsColumn` unbound until FRAME flow completes — but the L1 view doesn't tell the user this. No "Bind a CTS column to see capability" hint; just blank.

5. **L3 read mode renders 5 column cards × 4 CTAs = 20 flat-leveled actions.** No primary action signaled, no visual lead toward the suspected-contribution column. Every column reads as equally important. Designer instinct: rank-order cards by signal strength, demote weak contributors.

6. **L2 sub-tab vocabulary overlaps.** `Investigations | Hypotheses | Hypothesis hubs | Findings | Wall` reads as five near-synonyms to a learner. Expert-fluent, novice-hostile.

7. **L3 Investigate CTA whisks user to Investigation tab with no scope memory.** Clicking Investigate on `Fill_Weight_g` column lands on the hub composer showing 6 questions about `Does Line + Shift + Material_Batch together explain...` — none obviously scoped to the `Fill_Weight_g` selection that triggered the navigation.

8. **"Authoring model" caption (bottom-right of L2/L3)** is cryptic — neither label nor button; reads as orphan text.

9. **"Open SCOUT" button at L1** with no hover/tooltip; first-timer has no model for what SCOUT does.

**Why it matters:** PR #166 successfully ships the 19 of 20 followup fixes; the journey-around-them remains uneven. Each item above is a small-to-medium change; together they shift the canvas from "shipped, functional" to "explainable in 60 seconds to a first-time user."

**Possible directions:** Surface to brainstorming when the next canvas slice opens. Items 1, 2, 3 are small renames + a toolbar; 4 is an empty-state copy add; 5 is a sort + visual-weight change; 6 is a glossary-driven simplification; 7 is breadcrumb wiring; 8, 9 are caption/tooltip polish. Don't bundle into PR #166.

---

### Pre-existing tsc errors deferred from PR #168 (cleanup/setstate-appmain)

**Surfaced by:** PR3 implementer tsc run + controller verification on main, 2026-05-14.

**Description:** 3 categories of pre-existing tsc errors were not fixed in PR #168 because they require
either new dev-dependency installs or non-trivial test restructuring.

**Deferred items:**

1. **d3 module type resolution** — `packages/hooks/src/useCanvasViewportInput.ts:2-4` (`Cannot find
module 'd3-selection' / 'd3-transition' / 'd3-zoom'`) + cascading line 72, 73, 86 errors.
   Requires adding `@types/d3-selection`, `@types/d3-zoom`, `@types/d3-transition` to
   `packages/hooks/package.json`. (Note: `@types/d3-zoom` and `@types/d3-selection` are already
   in `devDependencies`; the issue may be a missing hoisting entry for `@types/d3-transition`.)
   Pickup: add/verify the three `@types/d3-*` entries in a follow-up dep-bump PR.
   **CLOSED in PR A (post-168-tsc-hygiene), commit `e2c584ec`** — NOTE: the original hypothesis
   (missing hoisting entry) was partially wrong. The actual contribution was `@types/d3-transition`
   mis-placed in `dependencies` rather than `devDependencies` in `packages/hooks/package.json`
   (introduced by commit `07add8a4`). Moving it to `devDependencies` resolved all 3 d3 type errors.
   Empirical `--prod`-install reproduction was NOT run; fix accepted on semantic grounds (type
   packages belong in `devDependencies`, never `dependencies`). `@types/d3-zoom` and
   `@types/d3-selection` were already correctly placed and required no change.

2. **Tuple-mock typing** — `packages/hooks/src/__tests__/useHubCommentStream.test.ts:274-277`.
   `vi.fn(() => Promise.resolve(...))` infers call signature as 0-arg, so `fetchMock.mock.calls[0]`
   is typed as an empty tuple `[]`. Fix requires restructuring the fetch mock to carry explicit args
   in the factory (`vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(...)`) or using
   `as unknown as MockedFunction<typeof fetch>`. Out of scope for a trivial-cast PR.
   Pickup: next test-quality pass on `useHubCommentStream.test.ts`.
   **CLOSED in PR A (post-168-tsc-hygiene), commit `35c34d83`** — used `vi.fn<typeof fetch>(...)`
   (vitest 4.x single-type-param form), updated 3 call sites in the test file. `@variscout/hooks`
   tsc now exits 0 with no tuple-inference errors.

3. **`beforeEach` globals in `core/src/ai/__tests__/responsesApi.test.ts:862`** — ~~vitest globals
   not declared in core tsconfig~~ **CLOSED in PR #168 commit `e73fca64`** by adding `beforeEach` to
   the explicit `import { ... } from 'vitest'` on line 1 (more targeted than the `///` reference
   directive used in `setup.ts`).

4. **Entity fixture-shape mismatches in core tests (surfaced post-fix; both sub-items now closed)** — once `responsesApi.test.ts`
   was unblocked, core tsc revealed 9 more pre-existing errors:
   - `packages/core/src/__tests__/processHub.test.ts:722, 732, 1164` + `processState.test.ts:180` +
     `sustainment.test.ts:546` — `SustainmentRecord` fixtures are missing required fields added since
     they were written: `status`, `title`, `consecutiveOnTargetTicks`, `hasOverride`, `lastEvaluatedSnapshotId`
     (the entity grew during RPS V1 work without test-fixture catch-up).
     **CLOSED in PR A (post-168-tsc-hygiene), commit `7685734d`** — added all 5 missing required fields
     to fixtures across 4 test files; `recordFor` builder improved in-place; no `as` casts.
   - `packages/core/src/canvas/__tests__/stampStepCapabilities.test.ts:9, 64, 70, 91` — `ProcessMap`
     fixtures missing `version`, `tributaries`, `createdAt`, `updatedAt`; plus two `null` vs `string | undefined`
     assignment errors.
     Pickup: a focused "fixture catch-up" PR that adds the missing required fields to each fixture (preferred
     over blanket `as` casts — the casts mask real schema-vs-fixture drift). Touches 4 files in `packages/core/src/__tests__/`
     and `packages/core/src/canvas/__tests__/`.
     **CLOSED in PR A (post-168-tsc-hygiene), commit `27027162`** — extracted local `makeMap` builder;
     added all 4 missing required fields; changed `null` → omit on `ctqColumn` to match `string | undefined`
     type. `@variscout/core` tsc now exits 0.

**Not a blocking concern** — tsc runs per-package in isolation; vitest runs under bundler transforms
that supply vite globals. Runtime behaviour is unaffected.

---

### Branded Cpk type as durable replacement for forbidden-name guard

**Surfaced by:** post-#168 architecture-test refactor workstream (branch `post-168-architecture-test-refactor`), 2026-05-14. Related to T2 refactor commit `06d2638a`.

**Description:** The architecture test at
`packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts` (enforcing
ADR-073, "no cross-investigation Cp/Cpk aggregation") is a tripwire: a denylist substring grep for
16 forbidden function names (`aggregateCpk`, `aggregateCapability`, `rollupCpk`, etc.). It catches
the obvious case where a contributor reaches for `aggregateCpk`, but it has real limits:

- A creative renaming (`unifiedQualityIndex()`, `combinedProcessMetric()`) passes cleanly — the rule
  degrades to a naming convention, not an architectural boundary.
- It is a substring grep, not AST analysis; semantics are invisible to it.
- Scope is narrow: the vitest guard scans only `@variscout/core`. Cross-investigation aggregation
  introduced in `packages/charts`, `packages/ui`, or apps is not caught.
- The denylist can never be complete; reality has more names than any human (or language model) will
  enumerate at design time.

The same architectural rule could be enforced TYPE-LEVEL by making `Cpk` an opaque branded type —
analogous to `ProcessHubId` in `packages/core/src/processHub.ts` (introduced in PR #168). That type
is defined as `type ProcessHubId = string & { readonly __brand: 'ProcessHubId' }` with a single
typed constructor `asProcessHubId()` that throws on empty input. With the same pattern applied to
`Cpk`, multi-spec arithmetic becomes a compile error, not a runtime denylist match.

**Possible directions:**

- **Branded `Cpk` type in `@variscout/core`.** Define `Cpk` as an opaque type (`type Cpk = number &
{ readonly __brand: 'Cpk' }`) whose only constructor takes a single-`SpecRule` context — i.e., one
  spec, one investigation, one step. Forbid helpers that return `Cpk[]` from mixed-investigation
  inputs; allow only `Map<ProcessHubId, Cpk>` or `Map<StepKey, Cpk>` where the map keys preserve
  the locality dimension and prevent arithmetic across keys. Apply the same pattern to `Cp`, `Pp`,
  and `Ppk` if they share the ADR-073 constraint.

- **Migrate consumers.** All ~30+ call sites that read or produce `Cpk` values become typed. The
  display layer already goes through `formatStatistic()` (in `@variscout/core/i18n`) — that boundary
  is already clean. The engine layer is the migration target: replace bare `number` returns with
  typed-constructor calls.

- **Delete the architecture-grep test** once the type-level enforcement is in place. The substring
  guard becomes redundant when the type system prevents the violation. Update ADR-073 with an
  amendment note: "enforced by branded `Cpk` type; the historical forbidden-name guard at
  `architecture.noCrossInvestigationAggregation.test.ts` is removed."

**Why it matters:** LLM-assisted development is especially good at "obvious" naming — and especially
good at picking novel-but-semantically-equivalent names when the obvious ones are blocked. A denylist
that a language model can route around in one creative step is a thin safety layer. Type-level
enforcement removes the routing option entirely.

**Estimated scope:** Real engineering effort, not hygiene. Probably 4–8 tasks across:
`@variscout/core` (type definition + typed constructor + engine-layer consumer migration),
`@variscout/ui` + apps (display-layer migration via the existing `formatStatistic` pathway),
and tests (fixture + assertion updates). Not a single-PR cleanup.

**Promotion path:** When the engineering budget appears — likely as part of a broader stats-engine
type-cleanup pass — this becomes an ADR-073 amendment + a small design spec + a multi-PR migration.
Until then: stays as a logged investigation. The current tripwire remains the enforcement mechanism.

---

### Stats-bar "Set specs →" link reads project-wide specs only

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03 (branch `feature/full-vision-frame-b0`).

**Description:** The Analysis tab's stats-bar shows a "Set specs →" link even after the user has saved per-column specs via FRAME b0's `+ add spec` editor. Same root cause as the I-Chart bug fixed in this batch: the link reads `useProjectStore(s => s.specs)` (project-wide) rather than `measureSpecs[outcome]` (per-column).

**Possible directions:**

- Mirror the I-Chart fix locally: derive an effective spec object from `measureSpecs[outcome] ?? specs` at the consumer.
- Sweep all consumers of `s.specs` and apply the same fallback uniformly.
- Address the root cause via the parallel-stores investigation below.

**Promotion path:** trivial fix (one consumer) → ship in a follow-up PR. Wide sweep → audit task in `decision-log.md` Open Questions.

---

### Cpk badge in standard (Measurements) I-Chart mode

**Surfaced by:** FRAME b0 walkthrough, 2026-05-03.

**Description:** Once a spec is saved, the I-Chart in Measurements mode draws USL/LSL/target lines but shows no Cpk readout. Cpk is only surfaced when the user flips to "Cpk stability" / capability mode. Natural user expectation after spec save: a Cpk number visible somewhere alongside the trend chart.

**Possible directions:**

- Cpk badge in the stats-bar next to `x̄ | σ | n | Set specs →`.
- Cpk readout on the I-Chart's right-edge labels (alongside USL / Mean / LSL).
- Per-mode placement: Performance mode already has a `ProcessHealthBar` chip — generalize for the standard I-Chart.

**Promotion path:** UX decision → design slice → ADR if it changes Cpk presentation policy across modes; otherwise spec + implementation.

---

### Parallel spec sources of truth: `specs` vs `measureSpecs[outcome]`

**Surfaced by:** FRAME b0 spec wiring fixes, 2026-05-03.

**Description:** `projectStore` exposes two distinct spec fields: `specs: SpecLimits` (legacy project-wide single spec) and `measureSpecs: Record<string, SpecLimits>` (per-column, the newer Phase B model per `packages/ui/CLAUDE.md`). Writers branch on whether an outcome is set: with outcome → `setMeasureSpec(outcome, ...)`; without → `setSpecs(...)`. Readers are inconsistent: `resolveCpkTarget` already prefers per-column, but several other consumers read `specs` directly (the I-Chart wrapper was one — fixed locally; the stats-bar link, see above, is another). The asymmetry guarantees drift between "spec is set" indicators and the chart actually drawing the spec lines.

**Possible directions:**

- **Status quo + sweep:** keep both fields, sweep all consumers to use the per-column-first fallback. Cheapest now, leaves the smell.
- **Make `specs` derived:** treat `specs` as a computed view (`specs = outcome ? (measureSpecs[outcome] ?? {}) : projectWideFallback`). Eliminates the asymmetry without removing the field; readers don't change.
- **Unify on `measureSpecs`:** retire `specs`, route all reads / writes through `measureSpecs[outcome]`. Cleanest, biggest blast radius (legacy consumers, persistence shape, possibly Azure app).
- **ADR:** if the issue keeps biting, write an ADR that picks one of the above and locks it.

**Promotion path:** ADR-worthy if it bites again. Could also be folded into a Phase B follow-up spec, since per-characteristic specs (`SpecEditor`, `setMeasureSpec`) are the documented intent.

---

### P2.5 deferral: per-step mini-Pareto chips on LayeredProcessView step cards

**STATUS: archived 2026-05-26.** Retired under wedge V1 (ADR-082). `useStepDefectPareto` deleted in commit `748fa382` (no production consumer; only its own tests). `StepDefectIndicator` retained — `CanvasStepCard` already uses it directly. Per-step mini-Pareto on `ProcessMapBase` nodes was a slice-4 idea that doesn't map to wedge V1's canvas L2→L3 response-path model; if needed later, re-design under wedge response paths rather than reviving this entry. See `docs/decision-log.md` §1 "Framing Layer slice 4 archive" 2026-05-26.

**Surfaced by:** slice 4 task P2.5, 2026-05-04 (branch `framing-layer-v1-slice-4`).

**Description:** Slice 4 ships `useStepDefectPareto` (data hook) and `StepDefectIndicator` (visual primitive) but defers visual mounting onto `ProcessMapBase` nodes / tributary chips. The Operations band currently shows `ProductionLineGlanceDashboard` (a 2×2 grid with a `StepErrorPareto` slot) — feeding `useStepDefectPareto` output into `errorSteps` is the simplest mounting path and can be done without node-rendering surgery. Per-node-card chip mounting requires `ProcessMapBase` to expose an injectable slot per node, which is out of slice 4 budget. Spec acceptance §9.2 "per-step mini-Pareto" is considered partially met by the data + primitive availability.

**Possible directions:**

- **Operations-band slot wiring (low cost):** pass `useStepDefectPareto(perStep).data` as the `errorSteps` prop on the existing `StepErrorPareto` chart inside `ProductionLineGlanceDashboard`. No node-card surgery needed.
- **Per-node chip (higher cost):** extend `ProcessMapBase` to accept a `nodeDecorator?: (stepKey: string) => ReactNode` slot; mount `StepDefectIndicator` from there. Gives inline-per-step chips as originally envisioned.
- **Hybrid:** wire the Operations-band slot first (quick win), then layer the per-node chip in a dedicated follow-up task.

**Promotion path:** Operations-band slot wiring → carry into a P3.x or standalone follow-up task. Per-node chip → design task + ADR-check on ProcessMapBase extension if the slot pattern is reused for other decorators.

---

### Canvas-filter app-level integration + E2E (slice 4 P3.6 / P4.2 / P4.3 follow-up)

**STATUS: archived 2026-05-26.** Retired under wedge V1 (ADR-082). `ParetoMakeScopeButton` + `onMakeInvestigationScope` + `onScopeFilterClick` deleted in commit `748fa382` — PWA + Azure never passed the callbacks, so the chain was unreachable. Wedge V1 §3.3.4 commits to 3 canvas response paths (Investigate / Quick Action / Charter) triggering from canvas L2→L3 — NOT from chart bar-clicks, so the Pareto→Stage5 chain doesn't map. `useCanvasFilters` + `useSessionCanvasFilters` + `CanvasFilterChips` + `ScopeFilter` type are retained — they have live consumers in `CanvasWorkspace`. The "promotion path" note below (about a future "wire canvas-filter writers" PR) is retired. See `docs/decision-log.md` §1 "Framing Layer slice 4 archive" 2026-05-26.

**Surfaced by:** slice 4 tasks P3.6, P4.2, P4.3, 2026-05-04 (branch `framing-layer-v1-slice-4`).

**Description:** Slice 4 shipped the canvas-filter primitives end-to-end at the package level: `ScopeFilter` type on `ProcessHubInvestigationMetadata`, `useCanvasFilters` hook (`@variscout/hooks`), `CanvasFilterChips` component, `LayeredProcessView.canvasFilterChips` slot, Pareto bar-click `onScopeFilterClick` propagation through `ParetoChartWrapperBase`, `ParetoMakeScopeButton` component, and the `onMakeInvestigationScope` prop. App-level integration is partial:

- **PWA + Azure FrameView mount (P3.6):** uses session-local `useState<ProcessHubInvestigationMetadata>` rather than a real `ProcessHubInvestigation` because FrameView is the canonical-map authoring surface and has no investigation entity in scope. Chips render correctly when state is set programmatically (verified in tests) but state does not roundtrip through any real persistence path. Reload clears.
- **Pareto bar-click → scopeFilter writers:** the `onScopeFilterClick` prop on `ParetoChartWrapperBase` is wired (P3.5) but no production consumer in the Operations band passes a writer. The `ProductionLineGlanceDashboard`'s `StepErrorPareto` is mounted directly (not via `ParetoChartWrapper`), so bar clicks there don't currently route through the wrapper. PerformancePareto's migration via P1.4 left the picker but didn't surface a make-scope wiring there either.
- **`ParetoMakeScopeButton` → `StageFiveModal` opener (P4.2):** the wrapper-level wiring exists (`onMakeInvestigationScope` prop), but no app currently passes a callback that opens StageFiveModal with the brief. Investigation creation requires app-state plumbing (modal `open` state + investigation-store writer).
- **E2E coverage (P4.3):** deferred. With production writers absent, an E2E test would primarily exercise the test-only programmatic-state path. Postpone E2E until the writers above are wired.

**Possible directions:**

- **Investigation-bound mount:** identify where the active `ProcessHubInvestigation` entity is reachable in PWA / Azure (probably the Dashboard or PI Panel after Mode B confirms — not FrameView), and move the `useCanvasFilters` mount there. Wire `onChange` to whatever existing `persistInvestigationMetadata` flow already supports `timelineWindow` updates.
- **Operations-band Pareto bar-click writer:** route `StepErrorPareto`'s bar-click in `ProductionLineGlanceDashboard` through a thin adapter that calls `setScopeFilter` from `useCanvasFilters`. Either pass the setter as a prop or use a small store.
- **StageFiveModal opener:** add a small app-level state slice (e.g., `useState<AnalysisBrief | null>` for "brief pending Stage 5") that the `onMakeInvestigationScope` prop writes to; the modal opens when non-null.
- **E2E spec:** once any one writer above is wired, add a Playwright spec covering: paste defect data → click Pareto bar → assert blue scope chip appears → click "Make this the investigation scope" → assert StageFiveModal opens with pre-filled `issueStatement`.

**Promotion path:** when the writers land (likely as a single focused follow-up PR titled "wire canvas-filter writers in PWA + Azure" or similar), close this entry, ship the E2E in the same PR, and update the framing-layer spec verification §16 with the green checkboxes.

---

### Sustainment workflow V1

**Surfaced by:** PR8-8a amendment review, 2026-05-07.

**Description:** PR8-8a ships a Sustainment stub destination only. The CTA's prerequisite signal (`hasIntervention`) is hardcoded `false` in FrameView until the data model lands. The full surface — continuous monitoring of a confirmed process change to verify the gain holds — is deferred.

**Possible directions:**

- "Intervention exists" signal: needs concrete definition. Likely tied to a future `Intervention` entity OR derived from existing `ImprovementIdea` + `ActionItem` data with status `implemented`.
- Monitoring infrastructure: schedule, alerts, control charts post-change; review-marked / auto-verified states.
- Free-tier vs paid-tier split: free can record sustainment manually; paid gets continuous monitoring + alerts.

**Promotion path:** Standalone slice when prioritized. Sequence after Charter authoring (charter formalizes the change being monitored).

---

### Canvas hypothesis-arrows visually obscured under Wall overlay when both active

**Surfaced by:** PR #141 (sub-PR 8e) final code review, 2026-05-08.

**Description:** Spec 4 ext §6 z-stack puts the Wall overlay (`z-[15]`) above per-step badge overlays (`z-10`). When a user activates both the `'hypotheses'` overlay and the `'wall'` overlay simultaneously, the persistent `<HypothesisArrowsLayer>` connector arrows render below the Wall SVG and are visually hidden. Behavior is correct per spec — the Wall is a richer view of the same causal data — but the side effect is undocumented in the spec and may surprise users who expect both overlays' visuals to compose.

**Possible directions:**

- Status quo: accept that Wall-on supersedes per-step arrows; rely on Wall's own arrow rendering for causal context. Document in the spec.
- Auto-toggle: when `'wall'` activates, suppress the `'hypotheses'` toggle in `CanvasOverlayPicker` (mutual exclusion in the picker) since Wall already encodes that data.
- Z-axis re-stack: hoist the per-step arrow layer above the Wall (`z-20`+) so arrows draw on top — but Wall pointer-events would still gate clicks, and the resulting visual is busy.

**Promotion path:** Spec 4 retroactive consolidation (Tier 3 followup) is the natural home for documenting the z-stack semantics. Promote to a decision-log Open Question only if user research surfaces confusion about the dual-overlay state.

**Resolution [2026-05-08]:** Status-quo + doc per the listed promotion path. Spec 4 ext (`2026-05-08-canvas-wall-overlay-design.md`) §6 now carries a §6.1 "Rendering z-stack" subsection documenting that Wall (`z-[15]`) supersedes per-step arrows (`z-10`) by design — the Wall is a richer projection of the same causal data. No code change; auto-mutual-exclusion in `CanvasOverlayPicker` was rejected (would imply the dual-active state is illegal — it isn't, just superseded). Promote to a decision-log Open Question only if user research surfaces confusion about the dual-overlay state.

---

### Canvas levels-as-pan/zoom architecture deferred without note (vision §5.4)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.4 says levels (System / Process Flow / Local Mechanism) are _"expressed as a canvas pan/zoom, not a separate picker"_ — orthogonal to mode lenses. Codex shipped the lens picker correctly as a discrete control but **levels-as-pan/zoom is entirely deferred** — there is no canvas viewport at all (flat vertical scroll). This is a fundamental canvas architecture gap, not a feature gap.

**Possible directions:**

- Pan/zoom viewport: introduce a `react-flow`-style or hand-rolled SVG/CSS-transform viewport. Levels computed from zoom level.
- Discrete level picker (spec deviation): if pan/zoom too costly, ship a discrete picker; document the deviation in a retroactive ADR.
- Defer to V2: acknowledge the V1 canvas is single-level (Process Flow); revisit when use cases surface (e.g., 50+ nodes makes flat layout unscannable).

**Promotion path:** PR8f of the canvas migration sequence — but **large**; canvas viewport architecture is a multi-week effort and may warrant its own design spec rather than a sub-PR. Recommendation: defer to V2 with an explicit decision-log entry; revisit when triggered.

---

### `'general-unassigned'` sentinel as investigationId placeholder in test fixtures

**Surfaced by:** P1.4 review fixes, 2026-05-06 (branch `data-flow-foundation-f1-f2`).

**Description:** Several test fixtures inside `packages/stores/` and `packages/hooks/` that create `Question`, `Finding`, or `SuspectedCause` objects use `investigationId: 'inv-test-001'` (correct, deterministic) or similar per-test sentinels. However, the codebase also includes patterns where no investigation context is available at construction time — for example, `createQuestion` callers in pre-P1.4 code sometimes passed no `investigationId` at all (now a required arg). A related smell is that some places in production code (not tests) construct entities with a placeholder string like `'general-unassigned'` to satisfy the type when no real investigation FK is in scope. This deferred FK is an architectural liability: it bypasses cascade safety guarantees (a tombstoned investigation should stop queries against its entities, but entities with a placeholder FK are orphaned from that safety net).

**Possible directions:**

- Audit all production call sites of `createQuestion`, `createFinding`, and `createSuspectedCause` for non-real `investigationId` values (empty string, `'general-unassigned'`, `'unknown'`, etc.).
- Where a real investigationId is not in scope at construction time, either defer construction until it is (pass investigationId as a runtime param) or use a branded nominal type (`InvestigationId`) that prevents silent placeholder injection.
- Document any legitimately un-scoped entities (e.g., global template questions) as a typed variant rather than a placeholder string.

**Promotion path:** Low priority while investigations are single-tenant and not aggregated cross-investigation. Becomes a safety gap if multi-investigation queries or cascade deletes are added (see ADR-073 boundary policy). Log in `decision-log.md` as a named-future item when cascade-delete scope is tackled.

---

### Per-app feature-store overlap with `usePreferencesStore`

**Surfaced by:** F4 spec D7, 2026-05-07 (branch `worktree-f4-three-layer-state`).

**Description:** `apps/azure/src/features/panelsStore.ts` and `apps/pwa/src/features/panelsStore.ts` semantically duplicate `usePreferencesStore` on workspace tab selection + panel open/close toggles. F4 now owns those fields in `usePreferencesStore` (persisted, `'variscout-preferences'` key), but the per-app feature stores keep their own copies of analogous per-workspace toggle state. A decision is needed: either the per-app feature stores re-export their relevant slices from `usePreferencesStore`, or they remain independent (accepting duplication). Keeping them independent risks a user-visible inconsistency — reloading the app could restore `usePreferencesStore` fields but not the feature-store toggles if the two sets diverge.

**Possible directions:**

- **Unify:** move per-app feature-store panel state into `usePreferencesStore` as named sub-slices. Clean boundary; single persistence key.
- **Re-export shim:** feature stores expose getters that delegate to `usePreferencesStore`. Avoids consumer API change.
- **Status quo + audit:** accept duplication for now; document the divergence risk; revisit when a concrete user-reported inconsistency emerges.

**Promotion path:** revisit when feature-store unification becomes a priority (likely during the Canvas/Hub surface build-out, where panel state proliferates). Out of F4 scope.

---

### `wallLayoutStore.selection` Set/JSON Dexie round-trip

**Surfaced by:** F4 audit, 2026-05-07 (branch `worktree-f4-three-layer-state`).

**Description:** `wallLayoutStore.selection` is typed as `Set<NodeId>`. The store uses idb-keyval for persistence. JavaScript `Set` objects do not survive `JSON.stringify` / `JSON.parse` round-trips cleanly — `JSON.stringify(new Set([1,2]))` returns `'{}'`, meaning the persisted value will always be an empty object on reload. The `wallLayoutStore` `partialize` block should either convert to `string[]` before persist and back to `Set` on rehydration, or the `selection` field should be excluded from persistence entirely (treating selection as transient View state per F4's layer rule). F4 does not touch `wallLayoutStore` selection logic (wallLayoutStore is `STORE_LAYER = 'view'` per F4 — selection is correctly in the view layer) but the Dexie round-trip hazard remains if anything else tries to persist the store.

**Possible directions:**

- **Convert at partialize boundary:** `partialize: (s) => ({ ...s, selection: [...s.selection] })` and rehydrate with `new Set(raw.selection)` using a custom `merge` or `onRehydrateStorage` callback. Standard Zustand/idb-keyval pattern.
- **Exclude from persist:** confirm `selection` is pure View state (already labeled so by F4) and remove it from any persist `include` list.
- **Type change:** switch `selection: string[]` everywhere; simpler, loses Set lookup semantics.

**Promotion path:** low urgency (wallLayoutStore `STORE_LAYER = 'view'` per F4, so no persist middleware is expected). Becomes blocking if a future slice adds persist middleware to wallLayoutStore or reads selection from a persisted snapshot. Check before adding any persist to wallLayoutStore.

**Resolution [2026-05-08]:** Audit confirmed — `selection` was never in `WallLayoutSnapshot`; `persistWallLayout` and `rehydrateWallLayout` skip it intentionally. Locked with a regression test in `packages/stores/src/__tests__/wallLayoutStore.test.ts` (`selection persistence boundary` describe) and a clarifying docstring on `WallLayoutSnapshot` in `packages/stores/src/wallLayoutStore.ts` documenting the boundary + the Set→string[] conversion pattern any future author should use if persistent multi-select recall ever becomes a spec requirement. Note the original entry's "STORE_LAYER = 'view'" claim is slightly off — `wallLayoutStore` is `STORE_LAYER = 'annotation-per-project'` per F4; selection is the per-session view-state field within that store, and the persist boundary excludes it correctly.

---

### Producer-side stamping of EvidenceSnapshot.stepCapabilities

**Surfaced by:** Canvas PR8-8b plan, 2026-05-07 — partial-integration policy.

**Description:** PR8-8b shipped the consumer surface for canvas drift (engine + hook + UI + app read path). The producer side — stamping `EvidenceSnapshot.stepCapabilities` at snapshot-create time so prior values are available for drift comparison — is deferred. Today snapshots can still land with `stepCapabilities === undefined`, so `priorStepStats` can be an empty Map and the drift indicator stays inert.

**Possible directions:**

- Identify the right call site: snapshot creation lives in `apps/pwa/src/hooks/usePasteImportFlow.ts` and the Azure equivalent, but the canvas process map + `measureSpecs` are not necessarily complete at paste time.
- Add a pure helper: `stampStepCapabilities({ map, rows, measureSpecs }) -> StepCapabilityStamp[]` in `@variscout/core/canvas`.
- Trigger a domain action after canvas authoring reaches a complete map for a snapshot, e.g. `EVIDENCE_STAMP_STEP_CAPABILITIES`.

**Promotion path:** small follow-up PR after PR8-8b merges. About 3 tasks.

**Resolution [2026-05-08]:** `stampStepCapabilities({ map, rows, measureSpecs })` helper added in `@variscout/core/canvas`; called inside the existing `EVIDENCE_ADD_SNAPSHOT` snapshot-construction sites in `apps/pwa/src/hooks/usePasteImportFlow.ts` and `apps/azure/src/features/data-flow/useEditorDataFlow.ts` so each new snapshot ships with `stepCapabilities` populated. No new action kind, no handler change. Empty maps at paste-time emit `[]` per the partial-integration policy in `docs/superpowers/plans/2026-05-08-canvas-polish-v1.md` — the drift indicator self-heals on the snapshot-after-canvas-authoring without further producer changes. Stamping uses the same rows variable that feeds `_proceedWithParsedData` (mirrors the existing `rowCount` source-of-truth per site).

---

### CanvasStepMiniChart histogram still uses first-12-raw-values pseudo-binning (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06; carried forward to PR8-8b.

**Description:** The histogram branch in `CanvasStepMiniChart.tsx` plots the first 12 raw values normalized to the local min/max, not a true histogram. PR8-8b intentionally left this as-is to keep the slice scoped to drift + time-series.

**Possible directions:**

- Sturges' rule: `bins = ceil(log2(n) + 1)`. Cheap and well-known.
- Scott's rule: `binWidth = 3.49 * sigma * n^(-1/3)`. More statistically grounded.
- Add a small helper in `@variscout/core/stats`, e.g. `computeHistogramBins(values, rule)`, returning `{ x0, x1, count }[]`; bind `CanvasStepMiniChart` to bin counts.

**Promotion path:** small follow-up PR. About 2 tasks: helper + UI swap.

**Resolution [2026-05-08]:** `computeHistogramBins(values, rule?)` helper added in `@variscout/core/stats` (Sturges default, Scott option). `CanvasStepMiniChart` histogram branch now renders one bar per bin with bin counts as heights, replacing the first-12-raw-values normalization. Empty bins floor at 8% height so the bin axis stays legible — this replaces the prior 15% floor (which was tuned for 12 raw-value pseudo-bars; 8% reads more honestly when bin counts can legitimately be zero).

---

### Sponsor visibility too restrictive — should see Analyze + Investigation read-only throughout

**Surfaced by:** 2026-05-26 customer-hat walkthrough session (Spec 2 brainstorm) — user reacting to the Promote-to-Project / Charter design: _"sponsor can see things throughout the project, not just in the end!!"_

**Description:** `docs/02-journeys/personas/sponsor.md:61` claims the Sponsor _"skips Analyze and Investigation entirely — those tabs are working surfaces for Lead and Members."_ The corresponding sequence diagram in `sponsor.md:38–59` shows `Sponsor-->>Analyze: (no interaction)` and `Sponsor-->>Investigation: (no interaction)`. The persona × tab matrix in `ia-nav-model.md:96–104` has `(no touch)` for Sponsor on those tabs. Real-world executive sponsorship varies — engaged sponsors want continuous visibility (read what the team is finding, ask informed questions, spot drift early); bounded-time sponsors stick to approval gates. Forcing the "skips entirely" framing in the journey doc misrepresents the product's capability and excludes engaged sponsors from the work surface.

**Evidence:**

- `docs/02-journeys/personas/sponsor.md:61` — _"The Sponsor's flow skips Analyze and Investigation entirely"_ (contradicts real sponsor practice for engaged sponsors)
- `docs/02-journeys/personas/sponsor.md:38–59` — sequence diagram shows `(no interaction)` on Analyze + Investigation
- `docs/02-journeys/ia-nav-model.md:96–104` — persona × tab matrix has Sponsor as `(no touch)` on those rows
- `docs/02-journeys/personas/sponsor.md:23` (same doc) says _"They never edit canvas, hypotheses, or measurement plans. Their gestures are: open, read, approve, sign off."_ — this text correctly distinguishes "never edit" from "never see," but the sequence diagram + matrix collapse the two into "no interaction." Internal contradiction within the same persona doc.

**Doc claim vs reality:**

- Doc claim (sequence + matrix): Sponsor doesn't interact with Analyze or Investigation at all
- Reality intended (same doc, persona statement): Sponsor reads everything; only their _write actions_ are limited to approval gates
- Product capability: read-only is a natural fall-through of the wedge V1 ACL model (`canAccess()` denies edit, read is permitted) — the restriction is in the docs, not the product

**Possible directions:**

- **Update the matrix in `ia-nav-model.md`**: change `(no touch)` to `Read` for Sponsor on Analyze + Investigation rows.
- **Update the sequence diagram in `sponsor.md`**: replace the dotted `(no interaction)` arrows with solid `Sponsor->>Analyze: Read (optional)` / `Sponsor->>Investigation: Read (optional)`.
- **Update the prose in `sponsor.md:61`**: remove "skips Analyze and Investigation entirely" and replace with something like _"The Sponsor reads Analyze + Investigation when they want to engage with the analysis directly; their active gestures are bounded to Charter approval, Improve sanction, and Report sign-off."_
- **Architectural framing (no doc change needed)**: this is actually a clean consequence of the State/Edit mode split we locked earlier in this session. Sponsor = State mode everywhere + 2 gated writes; Lead = State + Edit + advance. Worth surfacing in the design as a positive design choice rather than a "Sponsor restriction."

**Promotion path:** Doc-only PR touching `personas/sponsor.md` (prose + sequence) + `ia-nav-model.md` (matrix). Walkthrough HTML at `/tmp/variscout-walkthrough.html` also needs the matrix + sequence update.

**Severity:** **vision violation** — incorrectly characterizes a real product capability and demotes engaged sponsors out of the work surface. The internal contradiction within `sponsor.md` itself (statement says "read-mostly" but sequence says "no interaction") is evidence that the journey doc was authored without careful read-through. Same pattern as the other walkthrough findings — corpus authored faster than reviewed.

**Meta-note:** Fifth structural finding from today's customer-hat walkthrough. None caught by the morning's 5-lens audit. Pattern continues to confirm `feedback_audit_findings_need_design_triage` — audits inherit the corpus's blind spots; customer-hat reading catches what audits can't.

---

### Tab vocabulary positioning question: Explore / Analyze / Control vs Analyze / Investigation / Sustainment

**Surfaced by:** 2026-05-26 customer-hat walkthrough session — user proposing: _"how about if analyze, would be explore (like exploratory data analysis) and investigate would be analyze and then sustainment control?"_

**Description:** User-proposed rename across three nav/lifecycle surfaces: **Analyze tab → Explore** (matching Tukey's EDA vocabulary, universal stats language); **Investigation tab → Analyze** (matching DMAIC's Analyze phase, which it actually is — cause identification + hypothesis testing); **Sustainment stage → Control** (matching DMAIC's Control phase). The proposal exposes a real semantic overlap in current naming (_"Analyze" and "Investigation" both describe analysis activities_) and improves LSS practitioner pattern-matching. But it directly contradicts the deliberate prior choice captured in `feedback_drop_methodology_bridges`: _"VariScout-native vocabulary over external bridges (DMAIC/QC Story/TBP/A3); UI copy plain English; lineage in design specs only."_ This is **not a label-fix; it's an identity-level vocabulary decision** that affects positioning, marketing copy, onboarding cognitive cost, and product differentiation from generic DMAIC tools.

**Evidence:**

- Current tab vocabulary `docs/02-journeys/ia-nav-model.md:42–77`: Home / Project / Process / **Analyze** / **Investigation** / Improve / Report. Sustainment is the closing stage of the Project lifecycle, not a tab.
- Semantic overlap demonstrated in same file: Analyze tab description (`:59–62`) — _"canvas-based exploratory data analysis. The Four Lenses … emerge here. Findings created on the canvas link forward to Hypotheses on the Wall."_ Investigation tab description (`:64–67`) — _"Investigation Wall — Hypotheses, evidence, Measurement Plans. The accumulation surface where Findings cluster into Hypotheses, evidence is triangulated."_ Both describe analytical work; the distinction (exploration-of-data vs hypothesis-testing) is real but the labels don't carry it.
- Prior team decision: `feedback_drop_methodology_bridges.md` explicitly retires DMAIC-bridge vocabulary in favor of native FRAME / SCOUT / INVESTIGATE / IMPROVE methodology layer + plain-English UI tabs.
- Methodology layer per `docs/superpowers/specs/2026-04-27-process-learning-operating-model-design.md` — FRAME / SCOUT / INVESTIGATE / IMPROVE are _under-the-hood_ methodology phases, not tab labels.

**Trade-offs (not pre-decided here):**

- **Rename → Explore / Analyze / Control**: clearer Explore/Analyze separation; instant DMAIC pattern-match for LSS buyers (the wedge V1 ICP); "Control" is plain-English + unambiguously C-of-DMAIC; "Sustainment" is unusual vocabulary. Onboarding cost drops.
- **Keep Analyze / Investigation / Sustainment**: differentiates from generic DMAIC tools (positioning); preserves the _"we have an opinion about methodology that goes beyond DMAIC"_ posture; "Sustainment" has product-personality vs the bureaucratic "Control."
- **Partial move — rename Analyze → Explore only**: cheapest clarity win. "Explore" is universal stats vocabulary (Tukey 1977), not DMAIC-specific. Resolves the semantic-overlap-with-Investigation concern. Doesn't commit to full DMAIC alignment. Investigation and Sustainment stay native. Lowest commitment-to-positioning-shift.

**Possible directions:**

- **Promote to a positioning / vocabulary design session.** Pair the conversation with the JTBD-shape finding (Lead JTBD is lifecycle-framed vs activity-framed) — both go to the heart of _"what is VariScout's voice and stance?"_ Decide consciously whether `feedback_drop_methodology_bridges` still holds under the wedge V1 ICP sharpening.
- **Or take the partial Explore rename** as a clarity fix that doesn't commit positioning-wise. Update `ia-nav-model.md`, `personas/*.md`, `USER-JOURNEYS.md`, i18n keys (`workspace.analyze` → `workspace.explore`), and walkthrough HTML. Defer Investigation→Analyze and Sustainment→Control to the positioning session.
- **L1 vision cross-check.** Whatever's decided, `docs/01-vision/product-overview.md` + positioning copy + marketing materials should reflect it consistently. Vocabulary debt across L1/L2/L3 is what creates the current "we say one thing in spec, another in UI" muddle.

**Promotion path:** Should NOT be a quick rename. Promote to a vocabulary design session (companion to tasks #11 + #12 — same shape: customer-hat reading caught a finding that's deeper than a label fix). Possibly merge into a single "wedge V1 substrate cleanup design session" covering tab names + JTBD shape + Project=IP terminology, since all four findings from today's walkthrough are vocabulary/conceptual-model at root.

**Severity:** **vision violation** — tab labels are the most visible vocabulary surface in the entire product. Wrong choice compounds with every customer demo, every marketing page, every onboarding doc, every CoScout prompt that references "the Analyze tab." Right choice creates immediate clarity for the wedge V1 ICP. This is the highest-leverage naming decision in the wedge V1 surface area.

**Meta-note:** fourth structural finding from today's walkthrough; fourth one the 5-lens audit missed. Pattern is now unambiguous — customer-hat reading is a _qualitatively different_ validation activity from audit-style consistency checking. Audits validate the corpus is internally consistent with itself; customer-hat reading validates the corpus is internally consistent with how a real buyer thinks. Both are needed; today's audit covered only the first.

---

### Project = ImprovementProject in code; docs still use legacy "IP promoted from hypothesis" framing

**Surfaced by:** 2026-05-26 customer-hat walkthrough session — user reacting to the active-IP cascade section: _"is this really the right framing of an active improvement project? … improvement project is like lss gb project etc. so once we formalize an investigation into a project and then we would like in the end to improve the process, right?"_

**Description:** The journey docs frame "Project" and "Improvement Project (IP)" as two distinct things, with IP described as _"promoted from a validated hypothesis"_ and Project as the container that holds at-most-one-active-IP. **The code disagrees.** `ImprovementProject` in `packages/core/src/improvementProject/types.ts:93` is a single entity that carries everything an LSS Green Belt project file holds — title, business case, financial impact, members (Lead/Member/Sponsor), goal (outcome + factor controls + mechanism), background section, investigation lineage (hypothesisIds, findingIds), approach (improvement ideas, action items), outcome reference (Sustainment + control handoff), signoff. Status enum (`draft → active → closed`) maps directly to the lifecycle Charter / Approach / Sustainment. The wedge V1 intent (`project_wedge_v1` memory) is **one Project per Hub 1:1; Project = ImprovementProject; created via Charter ceremony, not via hypothesis promotion**. Hypotheses are _inside_ the project (in `sections.investigationLineage.hypothesisIds`), not parent to it. The doc framing inverts the relationship.

**Evidence:**

- Code: `packages/core/src/improvementProject/types.ts:93–110` — `ImprovementProject` extends EntityBase with hubId (1:1), status (Charter/Approach/Sustainment lifecycle), metadata.members (wedge V1 roster), goal, sections (background/investigationLineage/approach/outcomeReference), signoff. Investigation lineage stores hypothesis IDs _inside_ the project, confirming hypotheses are children of the project, not parents.
- Legacy store shape: `packages/stores/src/improvementProjectStore.ts:8` — `projectsByHub: Record<HubId, ImprovementProject[]>` (list per hub) is the pre-wedge "multiple IPs per Hub" model. The wedge V1 commits to 1:1 per `project_sdd_architectural_findings` memory and `project_wedge_v1` — _"each Project wraps one internal Hub 1:1; … `projectsByHub: Record<ProcessHubId, ImprovementProject[]>` flagged as legacy holdover; spec §6 commits to re-keying by `ProjectId` for project-scoped state."_ Re-keying is committed but not done.
- Doc legacy framing: `docs/02-journeys/ia-nav-model.md:79–92` — _"An active IP is an Improvement Project the Lead has promoted from a validated hypothesis. At most one IP is active per Project at a time."_ Both clauses are wrong: (a) IPs are created via Charter ceremony, not hypothesis promotion; (b) "at most one IP per Project" implies Project ⊃ IP nesting, which contradicts the 1:1 wedge V1 intent.
- Lead journey reinforces the muddle: `docs/02-journeys/personas/lead.md:55–56` — _"Promote validated hypothesis → Active IP. Active-IP cascade lights up downstream tabs."_ Same inverted relationship.
- Active-IP store: `packages/stores/src/activeIPStore.ts:8,18,23` — tracks one `ipId` per `(hubId, userId)` scope. This is **project selection**, not a downstream cascade artifact. Naming it "active IP" obscures that it's just "which Project is the user currently focused on."

**Doc claim vs reality:**

- Doc: Project and IP are different concepts; IP is a sub-unit promoted from a validated hypothesis; multiple IPs can exist within a Project (at most one active).
- Reality (code + wedge intent): Project = ImprovementProject. One entity. Created by Charter ceremony. One per Hub 1:1. Hypotheses live _inside_ it. "Active IP" is just project selection — which Project the user is currently focused on.

**Possible directions:**

- **Rename and reframe "active-IP cascade" → "active Project context"** in `ia-nav-model.md`. Explain it as project selection (user has multiple Projects, picks one, verb tabs scope to it), not a downstream-from-hypothesis cascade.
- **Fix the "promoted from validated hypothesis" framing** in `ia-nav-model.md` and `personas/lead.md`. Replace with "elevated into a Project via Charter" or similar — Charter creates the Project; hypotheses are investigated inside it.
- **Drop "IP" as a separate user-facing term.** Use "Project" everywhere. Reserve "ImprovementProject" / "IP" for code-internal type names with a JSDoc note: _"ImprovementProject is the typed name for what the UI calls a Project."_
- **Complete the store re-key** (separate PR — actual code change): migrate `projectsByHub: Record<HubId, IP[]>` → `projectsById: Record<ProjectId, ImprovementProject>` per the deferred wedge spec §6 commitment. This is the actual structural fix; the doc fixes propagate from it.
- **Cross-check L1 vision docs** — `docs/01-vision/product-overview.md` and positioning copy — for the same Project-vs-IP muddle. The market-facing copy should consistently say "improvement project."

**Promotion path:** Two PRs. (1) Doc-only PR: terminology cleanup across `ia-nav-model.md`, `personas/lead.md`, `personas/index.md`, `USER-JOURNEYS.md`, plus the walkthrough HTML. Lands quickly. (2) Code PR: complete the `projectsByHub → projectsById` re-key per wedge spec §6 commitment. This is the structural fix that closes out the wedge V1 migration. May want a brainstorm session before locking the re-key scope (companion to tasks #11 + #12 — same pattern of "doc-flagged finding has code structural debt underneath").

**Severity:** **vision violation** — the IP-vs-Project muddle distorts the mental model at the heart of the product. Every customer conversation, every onboarding doc, every roadmap discussion has to navigate "is this thing a Project or an IP?" The wedge V1 amendment intended to collapse the two (one Project = one IP); the docs and store shape haven't followed. This is exactly the kind of conceptual debt that compounds: every new feature touches the IP/Project surface and inherits the ambiguity. Touching it now (before more engineering builds on the muddle) is much cheaper than fixing it after.

**Meta-note:** the 2026-05-26 5-lens audit did not catch this either. The lenses validated wedge V1 surface alignment (7 tabs ✓, 3 stages ✓, 3 personas ✓) but never questioned the conceptual model below the surface. This is the third structural finding the customer-hat walkthrough has surfaced that the audit missed (after mode-1 invisibility and Lead JTBD shape). The pattern is consistent: audits check that what's documented matches what's coded; only customer-perspective reading checks that what's documented is the _right thing_ to document. Reinforces `feedback_audit_findings_need_design_triage` — audits inherit the corpus's blind spots.

---

### Lead JTBD is lifecycle-framed; should be activity-framed (analyst craft, not project management)

**Surfaced by:** 2026-05-26 customer-hat walkthrough session — user reacting to Lead's JTBD section: _"jobs to be done, we have actually a few, framing yes, then i want to do the drill down and understand the different causes and hypothesis can be used in that, as well as the regression things etc. and we also have the improvement actions, and thinking about those with team."_

**Description:** The Lead persona JTBD in `docs/02-journeys/personas/lead.md` is structured as **one master goal + three supporting jobs**, with the master goal being lifecycle management (_"drive a Project through Charter → Approach → Sustainment"_). The customer-hat reading names **three to four distinct first-class jobs**, with the lifecycle as a structural container rather than the JTBD itself: (1) frame the problem, (2) drill / hypothesis-test / regression to find contributions, (3) design + commit improvement actions with the team, (4) verify the fix via Sustainment. The current framing optimizes for _"did we finish the project properly?"_; the restructured framing optimizes for _"did we get the analysis right + commit good actions?"_ — closer to how a real Black Belt or CI engineer would describe what they're hiring VariScout for.

**Evidence:**

- Current Lead JTBD: `docs/02-journeys/personas/lead.md:23–31` — master JTBD is lifecycle-shaped; supporting bullets compress framing / hypothesis / Sustainment into helper roles under "drive the lifecycle".
- Member JTBD already activity-shaped (`personas/member.md:25–33`): _"contribute hypothesis evidence, measurement plan rows, or action items"_ — three distinct activities. Member is fine.
- Sponsor JTBD lifecycle-shaped (`personas/sponsor.md:25–34`) but Sponsor's actual work is narrow enough (approve / review / sign off) that lifecycle framing fits. Sponsor is fine.
- Activity surface is real in the product: regression / factor intelligence (best-subsets R²adj per `packages/core/CLAUDE.md` strategy section + ADR-067) is a first-class analytical tool the JTBD doesn't surface; collaborative ideation under Improve tab (`<ImprovementWorkspaceBase>`, PR-WV1-2) is the team-thinking surface the current JTBD elides.

**Doc claim vs reality:** Doc frames the Lead JTBD as project-management work. Reality: the Lead is doing analyst-craft work (framing → drilling → designing actions → verifying), and the lifecycle is the container that holds those jobs. The lifecycle framing risks under-surfacing the analytical depth (regression, factor intelligence, hypothesis primitives) that's actually what differentiates VariScout from project-management tools.

**Possible directions:**

- **Restructure Lead JTBD** to name 3–4 first-class jobs (Frame / Drill / Improve-with-team / Verify) with the lifecycle named as the container, not the JTBD itself. Each job gets a "When I… I want to… so I can…" statement.
- **Resurface analytical primitives** in the Lead journey narrative — explicitly mention regression / best-subsets / factor intelligence as part of the Drill job, not buried in supporting feature touch-points.
- **Promote "thinking with the team"** from a Member-side concern to a Lead-side first-class job — collaborative ideation is a verb the Lead drives, not just a Member contribution surface.
- **Consider whether the L1 buyer persona (Improvement Specialist) JTBD** in `docs/01-vision/product-overview.md` has the same shape problem; if it's also lifecycle-framed, the restructure should propagate up.

**Promotion path:** Doc-only PR touching `docs/02-journeys/personas/lead.md` + possibly `docs/01-vision/product-overview.md`. Should be paired with a walkthrough-HTML refresh so future customer-hat sessions render the restructured JTBD. NOT a design session — the analytical primitives the user named (regression, hypothesis, Improvement actions, team collaboration) all exist in the product; this is journey-doc framing, not unresolved design.

**Severity:** **vision violation** — JTBD framing shapes every downstream product decision (where to invest, what to surface, how to position). Lifecycle-framed JTBD risks positioning VariScout as a project-management tool when the actual differentiation is analyst-craft depth. This is the kind of frame-level mistake that distorts roadmap decisions over months.

**Meta-note:** the 2026-05-26 5-lens audit did not catch this — Lens B audited the persona ACL split (Lead/Member/Sponsor) and validated wedge alignment but never asked whether the JTBDs were the right _shape_. The audit lenses inherit the doc's own framing assumptions. Audits validate consistency-within-frame; they don't question the frame itself. Worth keeping in mind when scoping future audits — every lens has the corpus's blind spots built into its scope.

---

### L2 journey corpus silent on wedge spec mode-1 (quick-analyze) workflow

**Surfaced by:** 2026-05-26 customer-hat walkthrough session — user reading the active-IP cascade section of the rendered journey walkthrough caught it: _"we have also the case when we have just data, which needs to be analyzed."_

**Description:** Wedge spec §3.0 commits to **two first-class modes**: (1) quick-analyze with no Project required (paste data → Four Lenses → optional Findings/Hypotheses, served by PWA session-only + Azure persistent), and (2) project-anchored investigation with Charter ceremony, lifecycle, and ACLs. The L2 journey corpus only documents mode 2. Mode 1 — the PWA free-tier evaluation onramp that the L1 Improvement Specialist buyer persona enters through — has no journey representation.

**Evidence:**

- Spec commits to both modes: `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` §3.0 (lines 76–87) — _"V1 serves two distinct workflows, both as primary use cases… Tenant users can paste data and analyze without ever creating a Project."_
- Lead journey opens with Project: `docs/02-journeys/personas/lead.md:46–47` — _"Open VariScout (project list) → Create / select Project (Charter)."_
- Member journey assumes invitation: `docs/02-journeys/personas/member.md:48` — _"see Projects I'm in."_
- Sponsor journey same: `docs/02-journeys/personas/sponsor.md:49` — _"see Projects I sponsor."_
- IA nav model locks cascade to post-Charter mode: `docs/02-journeys/ia-nav-model.md:79–92` — _"An active IP is an Improvement Project the Lead has promoted from a validated hypothesis."_ No acknowledgement of the pre-Project state.
- Use cases mode-ambiguous: `docs/02-journeys/use-cases/{bottleneck-analysis,batch-consistency}.md` describe Finding capture + Hypothesis creation but never specify mode-1 vs mode-2 context.
- Persona index: `docs/02-journeys/personas/index.md` lists three personas but doesn't note they only apply post-Promote-to-Project.
- Canonical L2 anchor: `docs/USER-JOURNEYS.md` — no pre-Project journey section.

**Doc claim vs reality:** Wedge spec promises two first-class modes. L2 corpus documents one (mode 2). Mode 1 — the actual evaluation onramp for new users — is invisible to anyone reading the journey corpus.

**Possible directions:**

- Add a **Quick Analyze (no Project)** journey to `docs/02-journeys/` as a sibling to the three persona journeys, explicitly marked as role-less and Project-less. Sequence: Home (paste data / open sample) → Process (optional process map) → Analyze (Four Lenses, create Findings) → Investigation (cluster into Hypotheses, optional) → **+ Promote to Project** bridge — Charter inherits Hub state (data, outcome, factors, process map, Findings, Hypotheses, viewport).
- Add a preamble to `docs/USER-JOURNEYS.md` + `docs/02-journeys/personas/index.md`: _"The three personas below apply once a Project exists. Pre-Project quick-analyze flow → see [link to new journey]."_
- Add a precondition note to `ia-nav-model.md` active-IP cascade section: _"The cascade applies once a Project exists with an active IP. Pre-Project state has no IP and no cascade — every tab operates on the current Hub directly."_
- Annotate the two existing use-cases to specify which mode the narrative starts in (or show the bridge: starts in mode 1, promotes to mode 2 at the Hypothesis step).
- Update the walkthrough artifact (`/tmp/variscout-walkthrough.html`) to render the Quick Analyze panel alongside the three personas.

**Promotion path:** Doc-only PR touching ~5–6 files in `docs/02-journeys/` + `docs/USER-JOURNEYS.md`. Pair with a walkthrough-HTML refresh so future customer-hat sessions render both modes. Should NOT be promoted to a design session — mode 1 is already specified in the wedge spec; this is journey-doc propagation, not unresolved design.

**Severity:** **vision violation** — mode 1 is the PWA free-tier evaluation onramp (the entry point for the canonical "Improvement Specialist" buyer persona per L1). Hiding it in L2 means the journey corpus implicitly optimizes for post-purchase mode 2 while the actual buyer evaluates in mode 1. Every "is X discoverable?" sanity-check downstream of this corpus has been implicitly mode-2-oriented — including today's 5-lens audit, which never asked whether the quick-analyze flow was documented at all.

---

### Pinning Findings: PWA wires at App root, Azure wires via Editor + orchestration hook

**STATUS 2026-05-26 — doc-half closed:** per-app persistence note added to `docs/02-journeys/use-cases/{bottleneck-analysis,batch-consistency}.md` and to feature-parity Sustainment + Investigation Wall rows. Architectural convergence (lift `useFindingsOrchestration` into `packages/hooks/` so both apps share one orchestrator) remains open — that's the code-half. Keeping this entry open until the hook convergence decision lands or is explicitly deferred.

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens D: Analyze-tab interactions). User-reported observation that "pinning findings happens differently in Azure and PWA" prompted the audit.

**Description:** Both apps wire `handlePinFinding` and pinning is functional in both — an earlier exploration mis-claimed Azure had no wiring (it was reading a hallucinated `apps/azure-app/` path that does not exist; actual path is `apps/azure/`). However, the wiring **architectures genuinely diverge**, and the persistence behaviour after a pin differs in ways the journey docs don't acknowledge.

**Evidence:**

- PWA: `apps/pwa/src/App.tsx:598–609` — `handlePinFinding` defined inline at App root; calls `findingsState.addFinding()` from `useFindings()` hook (`packages/hooks/src/useFindings.ts:141`). Findings live as in-memory session state until `.vrs` export.
- Azure: `apps/azure/src/features/findings/useFindingsOrchestration.ts:168–185` — `handlePinFinding` defined inside an orchestration hook; consumed at `apps/azure/src/pages/Editor.tsx:964`; passed down `Editor.tsx:2010 → EditorDashboardView.tsx:225 → DashboardSection.tsx:102 → Dashboard.tsx:127/607/759`. Findings flow into `useInvestigationStore` (`packages/stores/src/investigationStore.ts`) and persist via `apps/azure/src/persistence/AzureHubRepository.ts` to Azure Blob with ETag concurrency.
- Shared: `packages/ui/src/types/findingsCallbacks.ts:11–32` defines `FindingsCallbacks` + `AzureFindingsCallbacks` types — clearly designed for parity.
- Journey docs: `docs/02-journeys/use-cases/bottleneck-analysis.md` + `batch-consistency.md` describe pinning as a single behaviour ("right-click chart category → Finding pinned"); `docs/USER-JOURNEYS-PROCESS-FLOW.md` + `USER-JOURNEYS-YAMAZUMI.md` describe "Lead pins station-level Findings"; none distinguish per-app persistence.

**Doc claim vs reality:** Journey docs imply that pinning is a single product behaviour. Reality: in PWA a pin is session-only until `.vrs` export; in Azure a pin is durable cloud state immediately, gated by ETag. A user testing PWA-then-Azure would experience two materially different commitments without any explanatory copy.

**Possible directions:**

- Add a per-app behaviour note to the Analyze-tab use-case docs and/or to `docs/USER-JOURNEYS.md` (one sentence each: "PWA: session-only until `.vrs` export. Azure: persisted on-the-fly to tenant blob.").
- Converge the wiring patterns by lifting `useFindingsOrchestration` into `packages/hooks/` so both apps consume the same orchestrator (eliminates the App-root-vs-Editor architectural split).
- Status-quo + doc-only: accept the architectural divergence as intentional (Azure has cloud sync to coordinate; PWA does not) and only fix the journey-doc silence.

**Promotion path:** Doc-only fix is a small PR (1–2 files, ~10 lines). Hook convergence is larger (~3 tasks, touches both apps). Decide after triage. Not blocking V1.

**Severity:** functional gap (silent behavioural divergence the journey docs paper over).

---

### Personas docs silent on Azure-vs-PWA app scope [RESOLVED 2026-05-26]

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens B: Persona roles & ACL).

**Description:** `docs/02-journeys/personas/{index,lead,member,sponsor}.md` (refreshed 2026-05-18 for wedge V1) present the three project roles as universal V1 behaviour. In code, only the Azure app enforces them. PWA is single-user open-access by design (free tier, training/learning surface) — `apps/pwa/src/App.tsx` uses a stable `'analyst@local'` user key and `InvestigationView` never calls `canAccess()`. Trainers importing `.vrs` scenarios into PWA, or users moving between the two apps, get no warning that role gating only kicks in on Azure.

**Evidence:**

- Shared role model: `packages/core/src/projectMembership/types.ts:4` (`ProjectRole = 'lead' | 'member' | 'sponsor'`); `packages/core/src/projectMembership/canAccess.ts:11–21` (`ROLE_PERMISSIONS`).
- Azure enforces: `apps/azure/src/components/editor/InvestigationWorkspace.tsx:104–107` gates photo upload via `canAccess(userId, members, 'edit-approach')`.
- PWA does not enforce: `apps/pwa/src/components/views/InvestigationView.tsx:53–85` accepts no `userId`/`members` props; no ACL invocation.
- Personas docs silent on scope: `grep -rn "appliesTo\|azure-only\|pwa-only" docs/02-journeys/personas/` returns nothing.
- Doc text: `docs/02-journeys/personas/index.md` says "V1 ships 3 personas inside each Project. Per-project ACLs; no cross-AD-tenant invites" — reads as universal.

**Doc claim vs reality:** Personas docs imply role-based ACLs apply to V1. Reality: PWA has no role enforcement; only Azure (€120 tenant SKU) does.

**Possible directions:**

- Add a single "Scope" line at the top of `personas/index.md` and each of `lead.md`/`member.md`/`sponsor.md`: "These project roles apply to the Azure tenant SKU. PWA (free tier) is single-user open-access by design."
- Promote to a scope note in `docs/USER-JOURNEYS.md` so it shows up before readers click into individual personas.
- Optionally cross-link to `docs/08-products/feature-parity.md` from the persona docs.

**Promotion path:** Small doc-only PR (1 line per file × 4 files = trivial).

**Severity:** vision violation (V1 product surface presented as universal across apps when role behaviour is not).

---

### Azure Analyze tab omits Pareto from lens-tab switcher

**STATUS 2026-05-26 — promoted to a design session:** the original audit recommendation ("copy PWA's conditional spread into `azureAnalysisLensTabs`") was the wrong move to lock in without revisiting Analyze-tab design principles first. User flagged that an intentional design choice may be hiding behind what looks like drift (`feedback_step_back_for_system_design`, `feedback_check_registry_placeholders_first`). Open questions to answer in the design session: (a) what are the canonical design principles for the Analyze tab? (Four Lenses model, lens-switcher behaviour, per-lens-mode framing.) (b) is Azure's Pareto-outside-the-switcher placement intentional (separate surface for category drill) or accidental drift? (c) is PWA's conditional-tab pattern the canonical UX or a tactical accommodation? (d) does the answer differ by mode (Capability / Performance / Yamazumi / Defect / Process-flow)? Reopen only with a dedicated brainstorm session — do not let drive-by PRs touch the lens-tab switcher in either app until this is settled.

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens D: Analyze-tab interactions).

**Description:** The Analyze tab's lens-tab switcher (Probability / Capability / Pareto) is built differently in the two apps. PWA includes a conditional Pareto tab when a Pareto factor is selected; Azure's equivalent switcher omits the Pareto variant entirely. Azure still renders a Pareto chart elsewhere (`Dashboard.tsx:927–929` conditional on `paretoFactor`), but it's not surfaced through the unified Four-Lenses UX that the journey docs describe.

**Evidence:**

- PWA: `apps/pwa/src/components/Dashboard.tsx:437–470` defines `analysisLensTabs` with `...(paretoFactor ? [{ id: 'pareto', … }] : [])` at line 448.
- Azure: `apps/azure/src/components/Dashboard.tsx:455–470` defines `azureAnalysisLensTabs` with **no Pareto branch**. Pareto state (`paretoFactor`) exists at line 287 and renders elsewhere, but not via the lens switcher.
- Journey doc: `docs/03-features/workflows/four-lenses-workflow.md` describes Four Lenses (I-Chart, Boxplot, Pareto, CapabilityHistogram) as uniformly available from Analyze.

**Doc claim vs reality:** Doc says Four Lenses are uniformly available in Analyze. Reality: Azure users can't reach Pareto via the lens-tab UX in the Analyze tab; PWA users can.

**Possible directions:**

- Copy PWA's conditional spread (`...(paretoFactor ? [{ id: 'pareto', … }] : [])`) into `azureAnalysisLensTabs`. Mirror the chart component wiring already used elsewhere in `Dashboard.tsx`.
- Lift the lens-tab builder into `packages/hooks/` (or `@variscout/ui`) so both apps share one source of truth — eliminates this whole class of divergence.

**Promotion path:** Small targeted PR. About 1–2 tasks (Azure wiring + a test mirroring PWA's).

**Severity:** functional gap (documented capability not reachable in one app's primary UX path).

---

### `ControlHandoff` type + `handoff-updated` activity event survive in code despite wedge "Handoff folded into Sustainment"

**STATUS 2026-05-26 — promoted to a design session (was PR3):** pre-plan grounding revealed that `ControlHandoff` is load-bearing operational data, not stale drift. Core selectors `selectSustainmentReviews` (`packages/core/src/sustainment.ts:328–349`) and `selectSustainmentBuckets` (`:371`) consume `handoffs: ControlHandoff[]` and use the `retainSustainmentReview: boolean` flag to suppress investigations from the Sustainment cadence board. `ControlHandoffSurface` (`:26`) enumerates 9 operational systems (mes-recipe, scada-alarm, qms-procedure, work-instruction, training-record, audit-program, dashboard-only, ticket-queue, other) — the model captures **where control was handed off to** after a project closes. Plus `operationalOwner`, lifecycle states (`pending → acknowledged → operational`), `escalationPath`, `reactionPlan`. Both apps have dedicated editors (`apps/azure/src/components/ControlHandoffEditor.tsx`) and full persistence flows through repositories, applyAction, schema, cloud sync. The audit recommendation ("rename `onStartHandoff` → `onEnterSustainment`, drop `handoff-updated` event, retire ControlHandoff") silently assumes V1 drops the operational-handoff concept — that's a design call, not a cleanup. Open questions: (a) is the wedge "Handoff folded into Sustainment" UI-only or also data-model? (b) does V1 still capture control-handoff state inside Sustainment closure UI? (c) which retention model — keep entity, fold fields into SustainmentRecord, or drop entirely per `feedback_wedge_v1_no_migration_no_backcompat`? Reopen only with a dedicated brainstorm session — companion to the Analyze-tab session (same anti-pattern: audit-finding-as-deletion-recommendation masking design question). See task #12.

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens C: Stage transitions & response paths).

**Description:** The 2026-05-16 wedge V1 amendment folded the Handoff stage into Sustainment closure — wedge spec §3.2 and ADR-082 say there are only three stages (Charter, Approach, Sustainment). The runtime stage enum (`StageStateMap` in `packages/ui/src/components/IPDetail/stageState.ts`) correctly stops at Sustainment. However, the data model still treats `ControlHandoff` as a first-class entity and exposes Handoff in the activity timeline + IP-detail prop surface — meaning the V1 codebase still persists, reads, and reasons about Handoff state as a distinct thing.

**Evidence:**

- `packages/core/src/improvementProject/types.ts:9` imports `ControlHandoff` as a sibling of `SustainmentRecord`; line 82 keeps `controlHandoffId?: ControlHandoff['id']` as a first-class IP field.
- `packages/core/src/improvementProject/types.ts:107` JSDoc still references "Sustainment or Handoff stages typically".
- `packages/ui/src/components/IPDetail/activityEvents.ts:14` declares an activity-event kind `'handoff-updated'`; line 177–184 produces events labeled "handoff …".
- `packages/ui/src/components/IPDetail/IPDetailPage.tsx:53–55` keeps `controlHandoff?: ControlHandoff` prop with comment "Present when handoff stage is active or beyond"; line 258 wires `onStartHandoff={() => setActiveStage('sustainment')}` — a transition handler named for a stage that no longer exists.

**Doc claim vs reality:** Wedge spec + journey docs treat Sustainment as the terminal stage and never reference Handoff. Reality: code still treats Handoff as a separately persisted artefact with its own events and prop surface.

**Possible directions:**

- Rename `ControlHandoff` to something Sustainment-relative (e.g. `SustainmentControlHandover`) and fold the `controlHandoffId` into `SustainmentRecord` so the IP type only references Sustainment.
- Merge `'handoff-updated'` activity events into `'sustainment-control-recorded'` or similar; update timeline consumers.
- Rename `onStartHandoff` → `onEnterSustainment` (or remove if the prop is dead — verify call sites first).
- Or: leave the data model alone and add a JSDoc note explaining that `ControlHandoff` is the persisted artefact of the closure flow within Sustainment — cheaper but keeps the naming dissonance.

**Promotion path:** Likely a dedicated rename/cleanup PR. Touches `packages/core/`, `packages/ui/`, both apps' consumers. Worth pairing with a wedge-V1 terminology sweep — check `feedback_systemic_before_patching` discipline.

**Severity:** functional gap (data model has not caught up with the spec; future readers will be confused).

---

### ADR-080 Sustainment auto-fire deferred — current implementation is direct localDb write (R13 exception)

**STATUS 2026-05-26 — banner added:** "Implementation status" block added to the top of `docs/07-decisions/adr-080-sustainment-auto-fire-pattern.md` documenting the R13-exception deferral. F5 implementation itself remains deferred per `packages/stores/CLAUDE.md` R13. Keeping this entry open until F5 lands or is explicitly retired.

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens C: Stage transitions & response paths).

**Description:** ADR-080 prescribes a co-located auto-fire pattern where, on IP transition to Sustainment, a follow-up reducer fires inside the same dispatch. Today, Sustainment records are written via direct `saveSustainmentRecordToIndexedDB` (the documented R13 exception in `packages/stores/CLAUDE.md`) rather than via the HubAction → reducer auto-fire pattern. Journey docs (`USER-JOURNEYS.md` §stages; `USER-JOURNEYS-YAMAZUMI.md`) describe Sustainment as flowing automatically once an IP reaches that stage, which is true at the user-experience level but not at the architectural level the ADR specifies.

**Evidence:**

- ADR: `docs/07-decisions/adr-080-*` describes auto-fire co-location.
- Current code: `packages/stores/CLAUDE.md` documents R13 exception (direct localDb writes for Sustainment records). `packages/core/src/sustainment.ts:37–61` defines `SustainmentRecord` entity with no upstream transition reducer.
- F5 plan: deferred per `packages/stores/CLAUDE.md` R13.

**Doc claim vs reality:** ADR-080 architecturally prescribes auto-fire; F5 implementation is deferred; journey docs describe the user-visible flow as automatic. The journey description is accurate; the ADR is currently aspirational.

**Possible directions:**

- Add a `Status: deferred to F5` banner to ADR-080 referencing the R13 exception so future readers don't assume the pattern is live.
- Or: implement F5 and retire the R13 exception.

**Promotion path:** Banner is a 1-line ADR amendment. F5 implementation is a multi-task plan.

**Severity:** functional gap (intentional, but undisclosed in the ADR itself).

---

### Wedge spec §3.1 text still says "Improve tab is removed" — superseded by the same spec's §15 amendment [RESOLVED 2026-05-26]

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens C).

**Description:** `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` §3.1 retains the original wedge-design language saying Improve is removed as a top-level surface. §15 (the 2026-05-16 amendment) restored it. Both apps now ship the Improve tab and journey docs describe a 7-tab nav including Improve. The §3.1 text is now misleading without re-reading §15.

**Evidence:**

- Spec §3.1: text describes 6-tab nav without Improve.
- Spec §15 (amendment block): restores Improve as top-level verb tab.
- Code: `apps/azure/src/components/AppHeader.tsx:451–461` renders Improve; `apps/pwa/src/App.tsx:121–124` lazy-loads `ImprovementView` + `ReportView`; both render the 7-tab order from `docs/02-journeys/ia-nav-model.md`.

**Doc claim vs reality:** Internal doc contradiction. §3.1 says Improve is gone; §15 + reality say it's back.

**Possible directions:**

- Per `docs/agent-context/doc-discipline.md`, design specs are edited in place. Update §3.1 to reflect the amendment and cross-reference §15.
- Or: leave §3.1 untouched and add a "Superseded by §15 amendment" banner at the top of §3.1.

**Promotion path:** Tiny doc edit. 1 file, ~5 lines.

**Severity:** cosmetic (doc-internal inconsistency; not a code drift).

---

### Investigation Wall: shared UI but Azure-only CoScout background pipeline — feature-parity matrix is misleading [RESOLVED 2026-05-26]

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens E: Cross-cutting per-app divergence).

**Description:** `docs/08-products/feature-parity.md:81` lists "Investigation Wall: Azure only". In practice the Wall UI (WallCanvas, hypothesis cards, mini-charts) is shared via `packages/ui/src/components/InvestigationWall/` and renders in both apps. What is genuinely Azure-only is the **CoScout-driven background suggestions pipeline** (best-subsets detection, AI hint emission) in `apps/azure/src/features/investigation/useWallBackgroundJobs.ts`; the PWA equivalent is a deliberate no-op (`apps/pwa/src/features/investigation/useWallBackgroundJobs.ts:20`). The matrix conflates "the AI surface" with "the whole Wall".

**Evidence:**

- Azure: `apps/azure/src/features/investigation/useWallBackgroundJobs.ts:69` — debounced best-subsets + CoScout emit.
- PWA: `apps/pwa/src/features/investigation/useWallBackgroundJobs.ts:20` — explicit no-op stub.
- Shared UI: `packages/ui/src/components/InvestigationWall/WallCanvas.tsx` imported by both apps.

**Doc claim vs reality:** Matrix says "Investigation Wall: Azure only". Reality: the Wall UI is shared; only the AI suggestion pipeline is Azure-only.

**Possible directions:**

- Split the feature-parity row: "Investigation Wall UI: both" + "Wall AI background suggestions: Azure only".
- Or: add a footnote clarifying the distinction.

**Promotion path:** 1-line doc edit.

**Severity:** cosmetic (misleading parity row; no code change needed).

---

### Sustainment persistence asymmetry not disclosed in feature-parity.md [RESOLVED 2026-05-26]

**Surfaced by:** 2026-05-26 systematic L2/L3 user-journey audit (Lens E).

**Description:** Both apps wire Sustainment UI (`SustainmentRecordEditor`, `SustainmentPanel`). The persistence story differs significantly — Azure persists Sustainment records via the R13 direct-write exception to IndexedDB + Cloud Blob; PWA's Sustainment is session-only and is not currently part of `.vrs` export per the same R13 path. `docs/08-products/feature-parity.md` does not list Sustainment as a row, so this differential is invisible to anyone reading the parity matrix.

**Evidence:**

- Azure UI: `apps/azure/src/components/SustainmentRecordEditor.tsx`; orchestration in `apps/azure/src/features/panels/panelsStore.ts`.
- PWA UI: `apps/pwa/src/components/SustainmentPanel.tsx`; lazy-loaded at `apps/pwa/src/App.tsx:122`.
- Persistence: `packages/stores/CLAUDE.md` documents Sustainment as the R13 exception (direct localDb writes, not yet HubAction-dispatched).
- Feature-parity: `docs/08-products/feature-parity.md` has no "Sustainment" row.

**Doc claim vs reality:** Parity matrix is silent; both UIs exist; persistence behaviours differ.

**Possible directions:**

- Add a Sustainment row to `feature-parity.md` distinguishing UI (both) from persistence (Azure: durable; PWA: session-only).
- Couple with the ADR-080 banner (see "ADR-080 Sustainment auto-fire deferred" entry) so the two related drifts are visible together.

**Promotion path:** Small doc edit, 1 file.

**Severity:** functional gap (parity matrix omits a real differential that affects whether `.vrs` round-trips Sustainment state).

## `outcomeReference` FKs are zero-writer (lineage-pattern fossil) [LOGGED 2026-06-04]

`ip.sections.outcomeReference.{sustainmentRecordId, controlHandoffId}` have 3 readers (`activeIPPresentation.ts`, `ipReport.ts`, `survey/control.ts`) and **zero writers** on main — the Control-entry actions (`ControlRecordEditor`/`ControlHandoffEditor`) write the entities + `ControlRecord.improvementProjectId`/`controlHandoffId` but never patch the IP. Surfaced by the PO-2 grounding (process-ops master plan). PO-2's Control-readiness predicate deliberately derives from the live `improvementProjectId` join instead. **Disposition belongs to the #12 Control-closure-model brainstorm**: wire the back-reference at Control-entry, or retire the section (the readers can derive from the join). Same shape as the retired `investigationLineage.hypothesisIds`.

## Blocking native dialogs (`window.prompt`/`window.confirm`) in Save-As + replace-data paths [LOGGED 2026-06-04]

Surfaced by the PO-3 `--chrome` verify (PR #300): `Editor.tsx` Save-As/Rename fire `window.prompt`, and the data-flow replace-data paths fire `window.confirm` (`useEditorDataFlow.ts`, 4 sites — one already commented as "legacy"). Verified **pre-existing on main**, not a PO-3 artifact. Two costs: (1) browser-automation hostile — they wedge CDP-driven verification (each chrome verify will trip on them) and Playwright needs explicit dialog handlers; (2) dated UX relative to the app's own modal language (`HubCreationFlow`, `ProductionLineGlanceMigrationModal` show the house pattern).

**Possible directions:** replace with house modal components (a small `NameDialog` + the existing confirm-toast patterns); or keep + document dialog handlers in the chrome-verify playbook.

**Promotion path:** small UI refactor, 2 files; no design decision pending.

**Severity:** low (cosmetic/UX + automation friction; no data risk).

## `cloneJson` per-facet deep-clone is the measured save-path hotspot (PO-8b research) [LOGGED 2026-06-05]

`buildDocumentSnapshot` pays `JSON.parse(JSON.stringify())` per facet (stores `documentSnapshot.ts` cloneJson; same pattern in canvasStore) — this, not the final stringify, is the real main-thread cost on large documents, and no worker fixes it. Named candidates if the PO-8b telemetry trigger fires: structural-sharing clone where safe; `CompressionStream('gzip')` on the upload body (server must accept it). Owner: whoever picks up the re-architect trigger.

## Editor records a saved baseline on cloud-failed (queued) saves [LOGGED 2026-06-05]

Pre-existing: `saveAndRecordBaseline` clears the dirty state for `offline`/`error` results too (the local Dexie save did succeed — R6d reads this as "saved"); only `conflict` now skips the baseline (PO-8b). If queued-cloud-save honesty ever matters (e.g. a sync-pending chip), the `SaveProjectResult` union already carries the signal.

## Dashboard `handlePersistInvestigation` ignores `SaveProjectResult` — silent latent conflict [LOGGED 2026-06-05]

PO-8b final adversarial review: `Dashboard.tsx` (`handlePersistInvestigation`, the nodeMappings/`migrationDeclinedAt` writer) discards the `SaveProjectResult` union. On a 412 it sets `pendingConflict` + `syncStatus: 'conflict'` but the resolution dialog only mounts in the Editor — the Dashboard user gets no toast and the cloud write drops (the local Dexie write survives; the conflict surfaces when the document is next opened in the Editor). This is a feedback REGRESSION vs the pre-PO-8b auto-conflict-copy + warning toast on this path, accepted at merge because the trigger needs a concurrent editor advancing the cloud doc between the Dashboard's load and its mappings save (rare at 2–5 users) and there is no data loss. Candidate fix: inspect the result and raise a "Cloud copy changed — open the project to resolve" notification; or route the Dashboard persist through a conflict-aware path. Revisit with the CS-P2 Dashboard rework or the first-session-journey work.
