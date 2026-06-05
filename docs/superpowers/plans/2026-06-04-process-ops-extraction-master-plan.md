---
tier: living
purpose: design
title: 'Process-as-Operations Extraction + Entity Disposition — master plan (PO-0…PO-8b)'
audience: human
status: active
date: 2026-06-04
last-reviewed: 2026-06-04
layer: spec
topic:
  [
    process-as-operations,
    entity-disposition,
    master-plan,
    cadence-extraction,
    findings-domain,
    persistence,
  ]
related:
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
  - docs/superpowers/plans/2026-06-02-connective-surface-model-master-plan.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
---

# Process-as-Operations Extraction + Entity Disposition — Master Plan

> **For agentic workers:** this is the PR-level MASTER SEQUENCER, not a task-level plan. Per PR: run the grounding workflow → invoke `superpowers:writing-plans` for the bite-sized sub-plan → execute via `superpowers:subagent-driven-development` (one worktree per PR) → adversarial review gate → `gh pr merge --merge --delete-branch`. Delivery state lives in `gh pr list` + this plan's status flips, never in memory.

**Goal:** Dissolve the `ProcessHubAnalyze` projection-entity, retire `investigationLineage` (status drives Report), un-mount the named-future cadence layer, re-home the V1 survivors (ControlRegion→Project tab · slimmed Home chips · Survey stays in FrameView), execute the honest-rename sweep, and harden the declared two-tier persistence model.

**Architecture:** Reversible-first ladder (spec §12): dead shed → Control re-source + re-homes → engine delete → entity-dissolution cascade ∥ findings-domain track → rename cascade → persistence hardening. Three PRs are **Opus atomic cascades** (PO-4, PO-5, PO-7) per `feedback_atomic_sweep_one_dispatch`; validators run **app test suites**, not just builds (CS-12 lesson).

**Spec:** [`2026-06-04-process-ops-extraction-entity-disposition-design.md`](../specs/2026-06-04-process-ops-extraction-entity-disposition-design.md) — grounded by 9 readers + 24 adversarial verifications, research-validated (§9), hardened by a 6-angle adversarial review (29 agents). Section refs below are to the spec.

---

## Program integration (how this connects to everything)

- **Connective-surface master plan** ([`2026-06-02-connective-surface-model-master-plan.md`](2026-06-02-connective-surface-model-master-plan.md)): **the CS-P2/P5 gate is OPEN as of spec-land 2026-06-04** (§7). CS-P3/P4 were never gated. Handshakes: CS-P2 sources `nodeMappings` from `ProcessContext` via the project document and consumes **PO-4's typed capability carrier**; the `ProcessHubView` husk survives PO-3 as the thin CapabilityTab + B0-migration host and **deletes with CS-P2's lift**; CS-P5 mounts the post-extraction shape only. CS-14 (CoScout) and CS-15/CS-16 are untouched by this plan.
- **Concurrent-build rule:** PO-track and CS-P-track PRs may interleave; the only shared surfaces are the capability data path (owned by PO-4, consumed by CS-P2) and the B0-migration host (owned by PO-3's survivor rule, re-homed at CS-P3). Any PR touching those checks the other track's open PRs first (`gh pr list`).
- **Follow-up map** (spec §8 — none block this plan): Home-launchpad brainstorm (consumes the slimmed attention contract + the reviewSignal user-POV walkthrough) · Control closure model #12 (consumes the re-homed region; decides closure-vs-review-rhythm) · **CoScout phase + journey model** (queued 2026-06-04; integrates `JourneyPhase` with the 5-verb/7-tab/3-stage product; absorbs the CoScout-context redesign) · analyze-domain normalization retired-as-goal · Evidence-Map fate parked.
- **Logs:** decision-log OQ row routes to the spec; `investigations.md` graduations (categorizer parity → PO-5; lineage-under-wired → closed by PO-5; EvidenceSnapshot-pruning watch-item stays) land with their owning PRs per §11.

---

## Phase 0 · Drift-now doc fixes (direct commits to main — no PR, push before any branch)

- [x] Fix root `CLAUDE.md` operating-model pointer → `docs/archive/specs/2026-04-27-process-learning-operating-model-design.md` (+ the `2026-04-25-process-hub-design.md` pointer, same drift).
- [x] Fix `apps/azure/CLAUDE.md` stale claim "MatchSummaryCard pill renders from `snapshot.provenance`" → renders from in-memory `MatchSummaryClassification`; the facet is write-only (ADR-077 durability artifact).

---

## The ladder

### PR-PO-1 · Phase A — dead shed (reversible, zero behavior change)

- **Goal:** delete everything with zero live consumers; shrink every later diff.
- **Touches:** orphaned `ProcessHubCadenceQueues.tsx` + `ProcessHubCadenceQuestions.tsx` (+ their cadence-only `ProcessHubFormat` helpers) · dead persisted fields `metadata.scopeFilter`/`paretoGroupBy`/`timelineWindow`/`canonicalMapVersion`-analyze-variant · **inline `UseCanvasFiltersResult` into the surviving `useSessionCanvasFilters` + hooks-barrel update BEFORE deleting `useCanvasFilters.ts`** (review catch — `useSessionCanvasFilters.ts:3,37`) · `useTimelineWindow` (zero callers; public-export removal) · `analyzeActions.ts` (no-op `INVESTIGATION_*` action surface, both apps' reducer cases) · the vestigial `onPlansChanged` option (`useReingestAutoLink.ts:98`) · the write-only `escalatedInvestigationId` input (`ControlReviewLogger.tsx`) · the "New Analyze" buttons (`pages/Dashboard.tsx:690-696,768-772` — IM-0a violation) · the Editor hub picker (`Editor.tsx:202-207`) · phantom sort keys (`pages/Dashboard.tsx:181-187` → sort by `latestActivity`). **NOT in PO-1** (moved to PO-2 by the review): the Depth/Status/NextMove strip — the Status select is the Control predicate's only writer.
- **Depends on:** Phase 0 pushed.
- **Model:** Sonnet (mechanical against an explicit list; the `UseCanvasFiltersResult` inline is the one judgment point — called out in the sub-plan).
- **Acceptance:** gate green + app test suites; no behavior change anywhere (`--chrome` smoke of Dashboard + Editor); deleted-surface i18n keys untouched (they go with their UI in PO-2/PO-3).
- **Spec ref:** §3 (DELETE rows + 1:1 hygiene + consumer enumeration), §2.
- **Sub-plan:** [`2026-06-04-po-1-dead-shed.md`](2026-06-04-po-1-dead-shed.md). **DELIVERED 2026-06-04 via PR #298** (`094b563b`; ~ -880 lines; final adversarial review verified the zero-behavior-change invariant; the ReviewPanel New-Analyze button noted for PO-3).

### PR-PO-2 · Phase B1 — Control re-source + re-homes (the judgment PR)

- **Goal:** Control reads facts not labels; survivors land in their 7-tab homes; the work-item strip retires.
- **Touches:** **the Control-readiness predicate** (§3 — _control-eligible_ = Control stage reached OR ControlRecord/Handoff exists; _controlled_ = active ControlRecord; sub-plan grounding picks the typed source: the wedge stage marker if one exists, else a Control-scoped field written by the existing Control-entry actions) · re-point `control.ts:334,385` + the ControlRegion setup-candidates filter + the Editor `ControlEntryRow` gate · **`selectControlBuckets`/`selectControlReviews`/`ProcessHubReviewItem` core re-signature** (generic `ProcessHubAnalyze`→`ImprovementProject`; drop the ignored cadence prop) · ControlRegion → the Project tab (active-IP cascade pattern + empty-state per `feedback_active_ip_cascade_pattern`) · extract the surviving `ProcessHubFormat` Control helpers into a project-typed module · Editor strip removal (Depth/Status/NextMove selects + Owner/Sponsor/Contributors free-text → ADR-082 membership is the home) · `ProjectCard` slim (status chip `:59,108-110` · overdue footer `:58,156` · amber border `:76` · depth label) · Home interim chips (sustainment due-ness + recency + findingCounts — the §8 slimmed contract; **no reviewSignal**) · `reviewSignal` projection + `buildHubReviewSignal` save-call retire (`localDb.ts:63-71`; the engine fn stays in core) · **i18n catalog-key removals** for deleted UI (closed `MessageCatalog` — every key removed from the interface + all 32 locales).
- **Depends on:** PO-1.
- **Model:** Opus (core-engine re-signature + predicate design + UI re-homes; partial-integration posture: re-signed types co-exist with the not-yet-deleted entity until PO-4).
- **Acceptance:** Control buckets populate identically for a fixture with records/handoffs (negative control: a project with the old status word but no record must NOT appear control-eligible — the label-can't-lie test); `--chrome` verify Project-tab Control region + slimmed Home cards; gate + app suites green.
- **Spec ref:** §3 (analyzeStatus/reviewSignal rows + consumer enumeration), §5.1–5.3, §8.
- **Sub-plan:** [`2026-06-04-po-2-control-resource.md`](2026-06-04-po-2-control-resource.md). **DELIVERED 2026-06-04 via PR #299** (`11ad356e`; predicate w/ zero new fields; final adversarial review traced the predicate end-to-end; non-blocking carries: interim cadence-bridge opt-out broadening [dies PO-3] · vestigial storage.ts reopen-tombstone branch [#12]). _Grounding amendments 2026-06-04: predicate source = NO new field (`ip.status==='closed'` + the live `ControlRecord.improvementProjectId` join; `outcomeReference` FKs found zero-writer → logged for #12); **Survey dedup moved to PO-3** (panel dies whole); ProjectCard "Your tasks" block sheds (§3-consistent)._

### PR-PO-3 · Phase B2 — engine delete (cadence layer out)

- **Goal:** the cadence engines + their host leave V1; CoScout context slims.
- **Touches:** Survey dedup (the ReviewPanel `InboxDigest` mount dies with the panel; FrameView mounts stay — moved here from PO-2 by grounding) · delete `buildProcessHubCadence` (`processHub.ts:866`) · `buildProcessHubReview` · `buildCurrentProcessState` (`processState.ts:144`) · `processHubReview.ts` · `ProcessHubReviewPanel` (+ its `formatLatestActivity` helper use) · `ProcessHubCurrentStatePanel`/state-items UI + `StateItemNotesDrawer` (named-future with `stateNotes`) · slim `buildProcessHubContext` (`processHub.ts:957`) to framing + findings + control inputs · **`ProcessHubView` SURVIVES as the thin host** (GoalBanner + `ProcessHubCapabilityTab` + B0-migration banner/modal — §5 host-ordering; review catch) · `ProcessHubCadenceSummary` type deletion staged AFTER the PO-2 prop drop.
- **Depends on:** PO-2 (ControlRegion + Survey already re-homed; the cadence layer has no V1 tenants left).
- **Model:** Sonnet/Opus split per sub-plan (deletions Sonnet; the CoScout context slim + `JourneyPhase`-consumer guard Opus). **Guard:** PO-3 grounding verifies `JourneyPhase` consumers (CoScout `phases` gating) are untouched — the CoScout phase + journey model is a routed follow-up, not this PR.
- **Acceptance:** Process-tab editor canvas + the surviving thin `ProcessHubView` render clean; CoScout prompt assembly tests green with the slimmed context; gate + app suites green.
- **Spec ref:** §5.3–5.5, §8 (CoScout follow-up row).
- **Sub-plan:** [`2026-06-04-po-3-engine-delete.md`](2026-06-04-po-3-engine-delete.md). **DELIVERED 2026-06-04 via PR #300** (`b8923b449`; net −4,800 lines; final adversarial review MERGE-READY zero findings; `--chrome` verify confirmed the thin host live — framing prompt + B0-migration banner + CapabilityTab present, the review surface absent; the two apparent freezes during the verify were **pre-existing blocking native dialogs** — `window.prompt` Save-As `Editor.tsx` + `window.confirm` replace-data `useEditorDataFlow.ts`, identical on main, logged in `investigations.md`). _Grounding amendments 2026-06-04 (7-slice workflow + owner ratification): **`buildProcessHubContext` deletes wholesale** — zero live callers; the "slim for CoScout" rationale was phantom (CoScout's real path is `buildAIContext`; the "CoScout prompt assembly tests" acceptance criterion has no referent — `coScoutModes.test.ts` is the JourneyPhase sentinel instead) · **`stateNotes`/`ProcessStateNote` strips fully** (UI + type + 3 persisted shapes + the CoScout-context field) · **i18n catalog task = zero work items** (the dying UI never had catalog keys) · hidden cascade members join the delete list: `EvidenceSheet`, `processHubRoutes.ts`/`actionToHref`, core `processEvidence.ts` + `responsePathAction.ts`, the Dashboard handler cluster · build order = reverse-dependency ladder (azure → ui → core), every intermediate state green._

### PR-PO-4 · Phase C — entity dissolution (**Opus atomic cascade**)

- **Goal:** `ProcessHubAnalyze` ceases to exist; surfaces read `ImprovementProject`/`ProjectMetadata`/`ProcessContext` directly.
- **Touches:** retire `ProcessHubAnalyze`/`ProcessHubAnalyzeMetadata`/`ProcessHubRollup` types + `buildProcessHubRollups` (`processHub.ts:548`) + the Dashboard projection cast (`pages/Dashboard.tsx:195-208`) · **the typed per-step capability carrier** replacing the `(inv as {rows?}).rows` duck cast (`useHubProvision.ts:27`, `stepErrorAggregation.ts:76`) — re-points `useProductionLineGlanceData`/`useB0AnalyzesInHub`/`useHubMigrationState`/`nodeCapability`/`scopeDetection` to `ProcessContext.nodeMappings` via the project document (**the CS-P2 contract**) · **`ProcessHubCard` + the Dashboard hub-card grid retire** (`pages/Dashboard.tsx:799-808` — redundant under 1:1; review catch) · `useTimelineWindow`-era `Pick<ProcessHubAnalyze,…>` signatures cleaned · PWA `investigations` Dexie table retired (`tableName: null` version bump; monotonic chain) · Azure `AnalyzeReadAPI` stubs deleted (aggregate-by-design per §9) · `ProjectMetadata` slims to the §3 KEEP set (`processHubId` · `findingCounts` · `sustainment` + base fields).
- **Depends on:** PO-3 (B-track) — runs after; D-track may interleave.
- **Model:** **One Opus atomic-cascade dispatch** (Architect → Migration → Validator phases, per-category commits); **validator runs both app test suites** (CS-12 lesson — builds alone missed 4 red FrameView tests).
- **Acceptance:** zero `ProcessHubAnalyze` references outside git history; per-step capability renders from the carrier (CS-P2 can consume it); Dashboard = project cards only; gate + app suites green.
- **Spec ref:** §3 (machinery), §5.5, §7, §9.1.
- **Sub-plan:** [`2026-06-04-po-4-entity-dissolution.md`](2026-06-04-po-4-entity-dissolution.md). **DELIVERED 2026-06-05 via PR #301** (`09a52be98`; one Opus atomic-cascade dispatch, 6 per-category commits + review-fix; 146→0 entity references; **the `ProcessStepCapabilitySource` carrier SHIPPED — CS-P2 can consume it now**; spec + quality + final adversarial reviews all MERGE-READY; review fixes extracted + unit-tested `resolveCapabilityNodeTargets`; `--chrome` verified the selector→thin-host path live incl. the B0-migration banner fed by the carrier; the two CS-P2-pending dead seams [empty `rowsByAnalyze` row channel · migration-suggestion columns] logged in `investigations.md`). _Grounding amendments 2026-06-04 (6-slice workflow + 24 adversarial verdicts + owner ratification): **AnalyzeReadAPI is NOT zero-implementor** (the PWA impl does real Dexie reads — coordinated cascade, not "delete, zero callers") · the carrier carries `migrationDeclinedAt` (B0 dismissal silently breaks without it) and **no rows field** — the per-step row channel is dead-in-prod (all 3 duck-cast readers resolve `[]`); rows stay in the explicit `rowsByAnalyze` maps = the CS-P2 re-wire seam · `['id']` re-points are plain top-level `import type` (tsc-verified; no cycle workaround needed) · the storage.ts reopen-tombstone **excises** (owner call — trigger provably dead post-PO-2; reopen semantics → #12) · `ProjectMetadata.nextMove`/`currentUnderstandingSummary`/`problemConditionSummary` **shed with an atomic ProjectCard slim** (owner call — the spec's "only cadence reads the projections" was false for these three) · a **minimal hub selector** replaces the grid (owner call — preserves the §5 interim-reachable guarantee for the B0 host until CS-P2's lift) · the 4 context-summary projections are write-only → DROP kills the localDb surveyReadiness→metadata pipeline · `schema.v7.test.ts` verno pin 12→13 · hub-level `ProcessHub.reviewSignal` untouched (distinct field from the shed metadata projection)._

### PR-PO-5 · Phase D1 — lineage retirement + Report re-source (**Opus atomic cascade**)

- **Goal:** one judgment system — analyst-owned status composes the Report; lineage deletes.
- **Touches:** delete `sections.investigationLineage` (type + factory seed + both apps' `applyAction` merges + `toggleLineageFinding` + the CS-6 pin button) — **tsc-driven cascade, ~18 files / 5 packages** (the §4.1 list incl. `ProjectsTabView` merges, `useImprovementProjectPanelModel`, PWA `App.tsx:899,906`, `CharterSections`, `predicates.ts`, `useLiveProjection`, the `activityEvents` lineage touchpoints) · **the shared status→bucket categorizer** as prerequisite (unify Azure 2-way `AnalyzeWorkspace.tsx:856-863` vs PWA 3-way `AnalyzeView.tsx:559-568`) · rewrite `selectIPReportScope`→`linkedHypothesisIds` (`ipReport.ts:76-82`) + `deriveIPCauseRows` (`ipReport.ts:161-193`) to key on `HypothesisStatus` (`evidence-survived-test`/`evidenced` → narrative+cause rows · `refuted` → tested-and-excluded · `proposed`/`needs-disconfirmation` → open questions; goal back-refs survive as structure) · Wall scoping: the PR #296 interim becomes permanent (delete the lineage-gated filters) · **supersession notes land with this PR**: connective spec §4.6 + master plan CS-6 banners (Edge-2 pin wire, PR #287, reversed — rationale: status replaces membership) + decision-log entry.
- **Depends on:** PO-1 (independent of B-track; may run parallel with PO-2…PO-4).
- **Model:** **One Opus atomic-cascade dispatch**; validator runs app suites + the Report negative controls.
- **Acceptance:** Report composes from status (negative controls: a `refuted` hypothesis NOT in narrative; a `proposed` one NOT in tested-and-excluded); the Report-collapse defect gone (hypotheses render under active IP); Wall unchanged visually (interim semantics now permanent); gate green.
- **Spec ref:** §4.1–4.2, §11 (supersession).
- **Sub-plan:** [`2026-06-05-po-5-lineage-retirement.md`](2026-06-05-po-5-lineage-retirement.md). **DELIVERED 2026-06-05 via PR #302** (`5612d904e`; one Opus atomic-cascade dispatch, 7 per-category commits + 2 review-fix/docs; `investigationLineage` references → 0 incl. the tsc-invisible pin-prop chain; `groupHypothesesByStatus` shipped in core = the one status mapping; the Azure Report-collapse defect fixed by deletion; spec + quality + final adversarial reviews all green — adversarial MERGE-READY across 8 attack surfaces; `--chrome` verify partial: pin-button-absent/AnalyzeConclusion/Home-chips/empty-states confirmed live, the active-IP Wall/Report/Charter-KPI live checks blocked by the pre-existing replace-data `window.confirm` and covered by the re-cast seam tests + Report negative controls). _Grounding amendments 2026-06-05 (13-agent workflow + adversarial verifiers + completeness critic + owner ratification): **both app categorizer memos were GATE-ONLY ceremony** (gates ≡ `hubs.length > 0`; unification = delete both + the core primitive — no `bucketHypothesesByConclusion` shipped caller-less) · Azure ReportView had THREE local lineage paths (prop-filter collapse defect + pin-union + the engine) — adopts the PWA composition · the Editor/App `scopedFindings` filters were the same collapse class (no empty-set guard) · the pin-prop chain is tsc-invisible (optional plain callbacks — enumerated by hand, grep-guarded) · test budget ~45 files incl. 3 load-bearing sibling/clone-identity assertions · NO serialization migration (whole-IP cloneJson round-trip; Dexie lineage-free) · zero i18n · producer `sections`-literal deletions land WITH the type deletion (required member — implementer deviation, spec-review-ratified) · the read-only "Investigation lineage" Charter form section SURVIVES by recorded keep-decision (naming → the queued stage-overviews design session) · stage-overview counts dropped as the minimal-honest interim (owner call; status-shaped chips candidate routed to the same session)._

### PR-PO-6 · Phase D2 — findings hygiene (FK drop + PWA unification)

- **Goal:** honest Finding/Hypothesis types; one findings collection; `.vrs` round-trips the free onramp.
- **Touches:** delete `Finding.investigationId` + `Hypothesis.investigationId` (types `findings/types.ts:497,699` · factories `:43,255` · both sentinel writers `analyzeStore.ts:397`/`useFindings.ts:173` · sample fixtures `packages/data/src/samples/*`) · PWA Dexie `findings`/`hypotheses`/`causalLinks` index/table retirement (with the §3 sweep pattern; cascadeRules references cleaned) · **PWA findings unification**: `useAnalyzeStore.findings` becomes the single source; the `useFindings` React-state path retires (PWA `App.tsx:378`); the Charter-promotion approach-inputs mismatch heals · optional fold: the Stage-5 `hypothesisDraft` persist TODO (`Editor.tsx:2452`).
- **Depends on:** PO-5.
- **Model:** Sonnet (well-specified against enumerated writers; the unification has Azure's `useFindingsOrchestration` as the template).
- **Acceptance:** `.vrs` round-trip test with negative control (a finding absent from the store must NOT appear after import); quick-analysis → pin → export → import arc green; gate + app suites green.
- **Spec ref:** §4.3–4.4.
- **Sub-plan:** [`2026-06-05-po-6-findings-hygiene.md`](2026-06-05-po-6-findings-hygiene.md). **DELIVERED 2026-06-05 via PR #303** (`ddf41188d`; 138 files +385/−551; the store-swap unification healed the Wall split-brain + the Charter source mismatch + the lost-on-export quick-analysis pins — **the pin→Wall heal `--chrome`-verified live** (Findings panel + Wall "1 finding"; pre-PO-6 the Wall showed 0); FK refs → 0 (survivors = the PO-7 rename set); Dexie v14 + the three ReadAPIs deleted; Stage-5 fold landed in both apps; the `.vrs` store-absent negative control PASS→FAIL→PASS-verified; spec+quality review pairs per task + final adversarial review MERGE-READY across 8 attack surfaces; `pr-ready-check`'s first run caught 2 real residues the per-task gates missed — ui's build tsconfig covers `__tests__` [unlike core/stores/hooks], so a scope-literal over-deletion + 2 stale `createFinding` 7th-arg positionals only surfaced there; the Task-5 implementer crashed mid-flight [API outage] and its 122-file diff was controller-verified + double-audited; the `.vrs`-button/Stage-5-on-demand live checks stayed partial behind the pre-existing Process-canvas hub-setup walls [PO-3/PO-5 precedent], covered by the new tests).\_ _Grounding amendments 2026-06-05 (12-agent workflow: 6 readers + 5 adversarial verifiers + completeness critic; 4 owner-ratified calls): **unification = TRUE STORE-SWAP, not the Azure seed-mirror** (verified hazard: `useFindings` seeds only at first render while `BrushToFindingFlow`/AnalyzeView write the store directly — a mirror flush would clobber Wall-captured findings; the Azure mirror's own latent seam → `investigations.md` watch-item) · **`useFindings` (the hook) is NOT deletable** — Azure's `useFindingsOrchestration` wires it; only the PWA's bare call retires · the split-brain is an ACTIVE bug (Wall renders store findings, callbacks mutated React state — edits no-op'd) · the store has near-full API parity (gaps: new `promoteFindingAction` + `findDuplicate*` composed from core pure fns + 4 renames) · **Stage-5 fold lands in BOTH apps** (PWA `App.tsx` — there is no PWA Editor.tsx — + Azure `Editor.tsx`; Azure via `hypothesesState.createHub`, not store-direct) · **the never-constructed `*_ADD` action-variant `investigationId` members drop too** (critic catch — the spec named neither) · **cascadeRules EntityKind members KEPT** (entities survive; only dead tables retire — "references cleaned" = verified-no-coupling + comment updates) · the dead `FindingReadAPI`/`CausalLinkReadAPI`/`HypothesisReadAPI` + both repo impls delete (PO-4 AnalyzeReadAPI precedent) · CausalLink has NO `investigationId` on its type (the Dexie index was a phantom) · test census ~10–12 files not 146 (scope/Control hits are PO-7); apps' tsc covers tests, package tests need grep-guards; Dexie breaks are RUNTIME-only → PWA suite is the gate · schemaVersion stays literal 1, validator untouched (PO-8a owns the re-freeze)._

### PR-PO-7 · Phase E — the honest-rename sweep + docs (**Opus atomic cascade**)

- **Goal:** names match runtime truth; journeys re-narrated; doc layers propagate.
- **Touches:** `investigationId` → `projectId` on `ProblemStatementScope` (live filter: `AnalyzeWorkspace.tsx:293,458` + `syncScopeFromDrill` + serializers) · Control entities (`control.ts:42,78,92` — name only; join semantics + the `${hub.id}:sustainment` fallback preserved) · `ImprovementProject.metadata.investigationId` (**the Control join-key source — validator exercises the Control join tests**) · `AnalyzeNodeMapping.investigationId` · strip `ControlReview.escalatedInvestigationId` remnants · type annotations → `ImprovementProject['id']` · **no grep-replace on `'general-unassigned'`** (overloaded with `DEFAULT_PROCESS_HUB_ID`) · journey re-narration (`docs/02-journeys/flows/project-reopen.md` + `azure-daily-use.md` from the improvement-specialist POV; ADR-043 framing out) · §10 relocation doc ("VariScout Process: the process-operations layer" — design relocated intact w/ commit-hash pointers) · §11 ADR work: amend ADR-078 D3 · close ADR-085's reconcile mandate · NEW ADR (dissolution + lineage retirement) · NEW ADR (two-tier persistence) · `OVERVIEW.md` + package `CLAUDE.md` notes · decision-log + `investigations.md` closures.
- **Depends on:** PO-4 + PO-6 (all shape changes landed; the sweep freezes names last).
- **Model:** **One Opus atomic-cascade dispatch** (code sweep) + Sonnet doc tasks per sub-plan.
- **Acceptance:** zero `investigationId` in non-test src outside git history; Control joins green; doc-gate green; all four ADR touchpoints landed.
- **Spec ref:** §6, §10, §11.

### PR-PO-8a · Phase F1 — schema hardening (Azure)

- **Goal:** the cleaned shape frozen as v1; refusal replaced with graceful degradation.
- **Touches:** re-freeze the existing `DocumentSnapshot.schemaVersion: 1` (`documentSnapshot.ts:47,157`) post-E · **replace the strict-reject validator** (`documentSnapshotVrs.ts:34`) with the three-way branch: known-current → load · **known-newer → read-only + "saved by a newer version" warning** (launch-blocking) · unknown/corrupt → strict-assert throw · flip `documentSnapshotVrs.test.ts:125` (newer-rejected → newer-opens-read-only) · the migration-dispatch seam (empty `migrateVn→Vn+1` table; additive-first model; strict-assert expiry documented = first customer) · **strip/split `viewState` from the shared snapshot** (known violation — `documentSnapshot.ts:95`; per-user session record or omit; budget the dirty-fingerprint `Editor.tsx:624` + fixtures).
- **Depends on:** PO-7 (v1 freezes the post-rename shape).
- **Model:** Opus (validator semantics + the viewState split are judgment-dense).
- **Acceptance:** newer-`schemaVersion` doc opens read-only with warning (negative control: same-version opens editable); corrupt doc throws loudly; a teammate's import no longer adopts the saver's tabs/charts; gate + app suites green.
- **Spec ref:** §9.2–9.3.

### PR-PO-8b · Phase F2 — concurrency + durability (Azure)

- **Goal:** collaboration-safe saves; durable-by-default local storage.
- **Touches:** **evolve the shipped auto-conflict-copy** (`storage.ts:381-398`; `blobClient.ts:158,171-174`; `cloudSync.ts:254-256`) **into the explicit reload-or-branch dialog** (launch-blocking; "branch" = the existing conflict-copy, now user-chosen) · retire the redundant timestamp pre-flight (`storage.ts:345-360`) · rewrite `storage.test.ts:1231` · the evidence-snapshot retry+`PasteConflictToast` path stays exempt (append-only catalog) · Web Locks exclusive lock around the wholesale Dexie write + blob save · `navigator.storage.persist()` on a save gesture + `estimate()` surfaced · worker-marshal serialization (snapshot built main-thread → Comlink marshal → `JSON.stringify` + Blob-PUT in the worker; `StatsWorkerAPI` gains the method) · size telemetry incl. marshal cost (>50MB split trigger) · the load-time projection heal (recompute the portfolio card from the loaded aggregate; heal on mismatch).
- **Depends on:** PO-8a.
- **Model:** Sonnet/Opus split per sub-plan (locks/persist mechanical; the conflict dialog + worker marshal judgment-bearing).
- **Acceptance:** 412 surfaces the reload-or-branch dialog (negative control: matching ETag saves silently); two simulated tabs cannot interleave wholesale writes; projection heals on a seeded mismatch; gate + app suites green.
- **Spec ref:** §9.2, §9.4.

---

## Sequencing

```
Phase 0 (drift-now, direct to main)
PO-1 ─┬─ PO-2 ── PO-3 ── PO-4 ─┐
      └─ PO-5 ── PO-6 ─────────┴─ PO-7 ── PO-8a ── PO-8b
CS-P track (other plan): CS-P3 · CS-P4 free now │ CS-P2 free now (consumes PO-4's carrier;
its lift deletes the ProcessHubView husk) │ CS-P5 after CS-P2
```

The two **launch-blocking** F items (newer-than-reader read-only · the conflict dialog) gate the **first customer**, not other PRs.

## Verification (every PR)

`bash scripts/pr-ready-check.sh` green + **both app test suites** · per-PR adversarial review before merge · `--chrome` verify on UI-touching PRs (PO-2: Project-tab Control region + Home cards · PO-3: Process tab + thin ProcessHubView · PO-4: Dashboard project-card list · PO-8a/b: the two dialogs) · the spec §13 negative controls are non-negotiable sub-plan tasks (`feedback_load_bearing_tests`).
