---
tier: living
purpose: design
title: 'Process-as-Operations Extraction + ProcessHubAnalyze Disposition — dissolve the projection-entity, retire lineage, re-home the V1 survivors'
audience: human
status: draft
date: 2026-06-04
last-reviewed: 2026-06-04
layer: spec
topic:
  [
    process-as-operations,
    entity-disposition,
    cadence-extraction,
    investigation-lineage,
    findings-domain,
    control-region,
    wedge-v1,
  ]
related:
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
  - docs/superpowers/plans/2026-06-02-connective-surface-model-master-plan.md
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md
  - docs/07-decisions/adr-082-wedge-architecture.md
  - docs/07-decisions/adr-085-drop-question-problem-statement-scope.md
  - docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md
implements:
  - docs/01-vision/positioning.md
  - docs/02-journeys/ia-nav-model.md
  - docs/03-features/workflows/investigation-surface.md
last-verified: 2026-06-04
verified-against-commit: 97551e0f54a5
---

# Process-as-Operations Extraction + ProcessHubAnalyze Disposition

> **Draft · 2026-06-04.** One holistic spec for the two halves the 2026-06-04 grounding showed to be one design object: the **§9 process-as-operations extraction** (un-mount the named-future cadence layer; connective spec §9) and the **`ProcessHubAnalyze` entity disposition** (the entity is the cadence layer's backbone). **Binding angle: design-right-over-demo-urgency** — phasing is by dependency + risk, never demo pressure. **Grounded against shipped code by 9 code-grounding readers + 24 adversarial verifications** (citations inline). Resolves the decision-log OQ "`ProcessHubAnalyze` entity disposition under Project⟷Hub 1:1".

---

## §1 · Context + scope boundary

### What this spec resolves

- The disposition of `ProcessHubAnalyze` / `ProcessHubAnalyzeMetadata` (`packages/core/src/processHub.ts:211-285`) — field by field (§3).
- The findings-domain consequences: `investigationLineage` retirement, Report re-source, the `Finding`/`Hypothesis` FK drop, PWA findings unification (§4).
- The cadence-layer extraction + the post-extraction homes for the V1-keep survivors: Control region, evidence/review-signal attention, Survey-Inbox (§5).
- The honest-rename sweep (`investigationId` → `projectId` where load-bearing) (§6).
- The CS-P2…P5 coordination contracts — **CS-P2/P5 gate on this spec, not on its build** (§7).
- **The persistence model, declared**: the two-tier architecture (operational entities + analysis aggregate), research-validated, with its schema/concurrency/durability hardening list (§9).

### Not in scope (boundary by contract, §8)

CS-P2…P5 content · the Home-launchpad design (consumes the §8 attention contract) · the Control closure model (initiative #12; consumes the re-homed region) · analyze-domain storage normalization (**retired as a goal** per §9 research; revive = derive an index from aggregates) · fine-grained sync / CRDT collaboration (explicitly rejected for V1, §9) · Evidence-Map post-Model-B fate (parked, `investigations.md`) · CoScout prompt redesign (context-slim only).

### Settled decisions honored (not re-opened)

Project⟷Hub 1:1 (IM-0a) · connective Decision 0 (process-as-ops → named-future) · the Finding is the unit (connective §4.0) · analyst-owned status (CS-10) · `CausalLink` optional layer (CS-12 not-now) · drop-Question (ADR-085) · the 5-verb frame.

---

## §2 · Grounding corrections — the reframe this spec is built on

The session brief weighted phasing around "reversible UI shed vs **irreversible persistence surgery**." Grounding dissolved most of the surgery. These corrections are recorded so future readers don't re-derive the stale priors:

| Brief prior                                                                                  | Grounded reality                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProcessHubAnalyze` is a persisted entity needing surgery                                    | It is a **projection**: Azure casts `ImprovementProject.metadata` into analyze-shaped objects at Dashboard render (`Dashboard.tsx:195-208`); `buildProjectMetadata` is the single writer of ~13 of its fields (`projectMetadata.ts:200-229`); the `INVESTIGATION_*` HubAction surface is dead (no-op reducers both apps — azure `applyAction.ts:456-466`, pwa `applyAction.ts:379-381` — zero dispatchers); Azure `AnalyzeReadAPI` is a stub; PWA's `investigations` Dexie table is never written |
| `Finding.investigationId` re-key ≈ ~130 files                                                | The FK is a **write-only `'general-unassigned'` sentinel** (`analyzeStore.ts:397`, `useFindings.ts:173`, both `TODO(F6)`), never read at runtime. Real Finding-domain surface: **~15–20 non-test src files**. The ~130 conflated Control's join key, `investigationLineage` (60 files), and 151 test files                                                                                                                                                                                        |
| `ProblemStatementScope.investigationId` keys by analyze id                                   | It already holds **`activeIP.id` at runtime** (`Editor.tsx:2109`; read at `AnalyzeWorkspace.tsx:293,458`). The type annotation lies; project-keying is the de-facto semantics                                                                                                                                                                                                                                                                                                                     |
| `metadata.scopeFilter` must be preserved until the scope-WHERE is wired (ordering guardrail) | **Already satisfied**: `metadata.scopeFilter` never carried the live WHERE (display-only chip via dead `useCanvasFilters`, zero live writers; the actual data filter is `projectStore.filters` via `useFilteredData.ts:78-104`); drill→`ProblemStatementScope` is **now live** in Azure (`AnalyzeWorkspace.tsx:280-302` → `syncScopeFromDrill`, `analyzeStore.ts:721-739`)                                                                                                                        |
| `onPlansChanged` nonce-bump is a load-bearing guardrail                                      | **Vestigial**: CS-11 removed the hook's call; neither app passes it (`useReingestAutoLink.ts:98`; apps wire only `onPendingMatches`). The real nonce is the apps' own `planLoadNonce`, untouched by this spec                                                                                                                                                                                                                                                                                     |
| `Control.escalatedInvestigationId` is a guardrail FK                                         | **Write-only, zero readers** (`control.ts:85`; written by `ControlReviewLogger.tsx`, never read back)                                                                                                                                                                                                                                                                                                                                                                                             |
| Multi-analyze "never shipped live" (ADR-078 D3)                                              | Half-right: the in-Editor container never shipped, but Dashboard's live **"New Analyze" button** (`Dashboard.tsx:690-696, 768-772`) creates additional projects under the selected hub — **contradicting IM-0a 1:1**. ADR-078 D3 says _deferred/tier-gated-future_, not "shipped then removed"                                                                                                                                                                                                    |
| Owner/Sponsor/Contributors live on the entity's header strip                                 | They were **never on the entity** — they are `ProcessContext` fields (`ai/types.ts:103-109`) written by the Editor header form (`Editor.tsx:237-270`) and copied to `ProjectMetadata` (`projectMetadata.ts:66-72`)                                                                                                                                                                                                                                                                                |
| `hypothesisIds` has zero writers                                                             | **Confirmed exhaustively** (112 refs) — plus a latent defect: `ReportView.tsx:182` filters hypotheses by the never-written set, so under active-IP scope the Report's hypothesis list collapses to empty                                                                                                                                                                                                                                                                                          |
| Provenance / ingestion at risk from re-key                                                   | **Untouched**: snapshots key `hubId`+`sourceId`, tags key `snapshotId`; the analyze id is not in the key chain. Stage 5 creates zero persisted entities; re-ingest (`useReingestAutoLink`) is read-compute-surface only                                                                                                                                                                                                                                                                           |

---

## §3 · The entity disposition — field by field

**`ProcessHubAnalyze` dissolves.** No projection entity is synthesized; surfaces read `ImprovementProject` / `ProjectMetadata` / `ProcessContext` directly.

### `ProcessHubAnalyzeMetadata` — full disposition table

| Field                                                                                                                                                     | Disposition                             | After                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` / `name` / `createdAt` / `updatedAt` (entity)                                                                                                        | dissolve                                | were `project.*` projections all along (`Dashboard.tsx:200-202`)                                                                                                                                                                                                                           |
| `processHubId`                                                                                                                                            | **KEEP**                                | `ProjectMetadata` — the 1:1 Project⟷Hub join key (`Dashboard.tsx:214`)                                                                                                                                                                                                                     |
| `analyzeDepth`                                                                                                                                            | **SHED → named-future**                 | + Editor strip Depth select (`Editor.tsx:211-213`), `ProjectCard` depth label, rollup `depthCounts`                                                                                                                                                                                        |
| `analyzeStatus`                                                                                                                                           | **SHED enum; re-source Control gating** | Control-readiness derives from the **IP stage** (Charter→Approach→Control; `analyzeStatusFromJourneyPhase` at `projectMetadata.ts:210` proves the mapping) + ControlRecord presence. Control-coupled reads (`control.ts:334,385`; ControlRegion setup-candidates filter) re-point to stage |
| `findingCounts`                                                                                                                                           | **KEEP** (derived)                      | `ProjectMetadata` — Home-card summary, recomputed at save (`projectMetadata.ts:147-150`)                                                                                                                                                                                                   |
| `actionCounts`                                                                                                                                            | SHED → named-future                     | `Finding.actions` stay in the document; overdue-attention was cadence                                                                                                                                                                                                                      |
| `processDescription` · `customerRequirementSummary` · `processMapSummary` · `surveyReadiness` · `currentUnderstandingSummary` · `problemConditionSummary` | **SHED projections**                    | sources live on `ProcessContext` / hub outcomes / `ProblemStatementScope`; only the rollup + readiness gates (cadence) read the projections                                                                                                                                                |
| `nextMove`                                                                                                                                                | SHED → named-future                     | + Editor strip input (`Editor.tsx:275-276`) + auto-set from recommendation (`Editor.tsx:1007`). (The Hypothesis-hub `nextMove` is a different field — untouched)                                                                                                                           |
| `reviewSignal`                                                                                                                                            | **KEEP**                                | `ProjectMetadata` — the evidence-signal source for Home attention (§5); written at save by `buildHubReviewSignal` (`localDb.ts:63-71`)                                                                                                                                                     |
| `stateNotes`                                                                                                                                              | SHED → named-future                     | huddle-ritual annotations keyed to ephemeral `ProcessStateItem` ids; the dangling-id risk dies with them                                                                                                                                                                                   |
| `sustainment`                                                                                                                                             | **KEEP**                                | `ProjectMetadata` — the Control projection (`ControlMetadataProjection`); the R13-allow-listed direct-Dexie write path (`localDb.ts:305-360`) documented and preserved                                                                                                                     |
| `canonicalMapVersion`                                                                                                                                     | **DELETE** (dead)                       | no writer, no reader in non-test code; the live `canonicalMapVersion` is the separate canvasStore/`ProcessHub`/`DocumentSnapshot` concept — untouched                                                                                                                                      |
| `nodeMappings`                                                                                                                                            | **KEEP**                                | **`ProcessContext`** (already the storage truth — `useHubMigrationState.ts:79-86` → `Dashboard.tsx:513-515` → `projectMetadata.ts:211`); engines read it directly (`nodeCapability.ts:104`, `stepErrorAggregation.ts:71-79`, `scopeDetection.ts:16`). **This is the CS-P2 contract (§7)**  |
| `timelineWindow`                                                                                                                                          | **DELETE** (dead persisted variant)     | live state is session-only (`useSessionCanvasFilters.ts:31,67-70`); dead hooks `useCanvasFilters` + `useTimelineWindow` delete (zero live callers; public-export removal noted)                                                                                                            |
| `migrationDeclinedAt`                                                                                                                                     | **KEEP**                                | `ProcessContext`; read by `useB0AnalyzesInHub.ts:27` (B0 migration UX — re-home note §5)                                                                                                                                                                                                   |
| `scopeFilter`                                                                                                                                             | **DELETE** (dead persisted variant)     | the durable WHERE is `ProblemStatementScope` (live, §2); the `ScopeFilter` _type_ survives for the session variant + Pareto highlight                                                                                                                                                      |
| `paretoGroupBy`                                                                                                                                           | **DELETE** (dead persisted variant)     | session variant survives                                                                                                                                                                                                                                                                   |

Phantom Dashboard sort keys `hasOverdueTasks` / `assignedTaskCount` (`Dashboard.tsx:181-187`, `ProjectMetadata`-only fields) **shed** → sort by `latestActivity`.

### The Editor header strip + 1:1 hygiene

- **Owner/Sponsor/Contributors free-text retire.** ADR-082 Project membership (`ProjectRole = lead | member | sponsor`, `projectMembership/types.ts:4`) is the **single home**; Report attribution reads membership. Trade-off accepted: no free-text external participants in V1 (single-tenant, no cross-AD-tenant invites). `ProcessHub.processOwner` (`processHub.ts:106`) stays — hub-internal.
- **The Process-Hub picker retires** (`Editor.tsx:202-207`) — under 1:1, hub assignment is fixed at charter.
- **The "New Analyze" buttons retire** (`Dashboard.tsx:690-696, 768-772`) — they violate IM-0a by minting sibling projects under one hub; new work routes through the Charter response path (new Project+Hub pair).

### Machinery deleted

`ProcessHubRollup` · `buildProcessHubRollups` (`processHub.ts:548`) · `buildProcessHubReview` · `buildProcessHubCadence` (`processHub.ts:866`) · `buildCurrentProcessState` (`processState.ts:144`) · `processHubReview.ts` · `analyzeActions.ts` (dead action surface) · the PWA `investigations` Dexie table (retired via `tableName: null` version bump — Dexie monotonic-chain rule) · Azure `AnalyzeReadAPI` stubs ("F3 normalizes" — F3 posture recorded in §9).

---

## §4 · The findings domain

### 4.1 `investigationLineage` retires (owner call, 2026-06-04)

Lineage is a fossil of the pre-1:1 world — an ID list answering "of all the findings in this hub, which are mine?", a question IM-0a dissolved (document boundary ≈ project boundary). Deleted: the section type + factory seed, both apps' `applyAction` merge cases, `toggleLineageFinding` + the CS-6 pin button, and all readers (`ipReport.ts:77`, `ReportView.tsx:176-185`, `AnalyzeWorkspace.tsx:592,752-763`, `AnalyzeView.tsx:174`, `activeIPScope.ts:71`, `activityEvents.ts:107`, `CharterOverview:47`, `ApproachOverview:96`). **PR #296's empty-set-means-unfiltered interim becomes the permanent semantics**: under active IP, the Wall shows the whole document (density is CS-12 DOI/Focus territory, not membership filtering).

### 4.2 The Report composes from analyst-owned status

"Tool assists, analyst decides" — the analyst's judgment already lives in CS-10 status; the Report reads it instead of a parallel membership list:

- **confirmed / contributing** → the narrative sections;
- **ruled-out** → "tested and excluded" (disconfirmation is first-class reporting value);
- **proposed / untested** → an open-questions block (collapsible; the growth bound is UI-level, §9).

The `ipReport` engine's goal/hypothesis back-references survive as _structure_ (cause-row derivation), gated by status instead of lineage. This **fixes the latent Report-collapse defect by deletion** (`ReportView.tsx:182`). Prereq folded in: the PWA/Azure conclusion-categorizer parity item (3-way vs 2-way buckets, `investigations.md` 2026-06-03) graduates into this phase — status semantics must be one shared mapping before the Report keys on them.

### 4.3 The FK drop

`Finding.investigationId` + `Hypothesis.investigationId` **delete** — types (`findings/types.ts:497,699`), factories (`factories.ts:43,255`), both sentinel writers, sample-data fixtures (`packages/data/src/samples/*`), and the PWA Dexie `findings`/`hypotheses`/`causalLinks` secondary indexes (`schema.ts:132-138`; the tables are dead surface and retire with the §3 sweep). Ownership = the document (1:1). Quick-analysis findings have no project, which is true. No migration (wedge no-back-compat; IM-0a precedent: empty version bump). F6 multi-investigation can re-add a real FK if that future ships.

### 4.4 PWA findings unification (in scope per owner call)

`useAnalyzeStore.findings` becomes the single source. The PWA's `useFindings` plain-React state (`App.tsx:378` — no `initialFindings`, no `onFindingsChange`) retires in favor of the store (Azure already wires persistence through `useFindingsOrchestration`). Consequences: `.vrs` export round-trips quick-analysis findings (`documentSnapshot.ts:102` already serializes store findings), making OVERVIEW's "save findings" promise true; the Charter-promotion data-source mismatch (approach inputs read React state, hypotheses read the store) heals as a side effect. Note: the PWA Wall/Capture paths already write _some_ findings into the store — unification removes the two-collections coexistence, not just the gap.

Optional fold (D2, small): close the Stage-5 `hypothesisDraft` persist TODO (`Editor.tsx:2452`) while the Hypothesis seam is open — create the draft Hypothesis in the store at investigation-open.

---

## §5 · The extraction — cadence shed + survivor re-homes

Post-CS-P1 state (grounded): `ProcessHubCadenceQueues` + `ProcessHubCadenceQuestions` are **orphaned dead files**; `ProcessHubReviewPanel` is the live host rendering Survey-Inbox + CurrentStatePanel + ControlRegion (`ProcessHubReviewPanel.tsx:55-59`); `ProcessHubControlRegion` **ignores its cadence prop** (`cadence: _cadence`) and derives buckets from `selectControlBuckets(rollup.analyzes, controlRecords, controlHandoffs)`; `buildCurrentProcessState` _requires_ the cadence summary and 6 of 7 state-item kinds are cadence-derived; the PWA has **no cadence surface at all** (Azure-only extraction).

**Owner call: `ProcessHubView` retires; survivors re-home into the 7-tab workflow** (hub-internal-only made a user-facing hub surface a fossil; under 1:1 the hub-selector duplicates the Project tab):

1. **ControlRegion → the Project tab** (Control is the third stage; project-lifecycle home). Data source re-signed to projects directly: `selectControlBuckets(projects, controlRecords, controlHandoffs)` — a re-host + re-sign, not a redesign. Setup-candidate gating reads the IP stage (§3) instead of `analyzeStatus`.
2. **Evidence/review-signal attention → Home.** The two honestly non-cadence state-item kinds become attention chips on Home project cards, reading `ProjectMetadata.reviewSignal` + `sustainment` due-ness (the §8 data contract). Click-to-Explore becomes click-to-open-project→Explore with finding deep-links (existing `handleFindingSelect` mechanics). Readiness/verification/action/next-move items die with the engine.
3. **Survey-Inbox**: keeps its FrameView mounts (pure `surveyInboxRules` over hub/IP/control entities — `survey/inbox.ts:30`, cadence-independent, both apps); the duplicate ReviewPanel mount drops.
4. **CoScout**: `buildProcessHubContext` (`processHub.ts:957`) slims to non-cadence inputs (framing + findings + control); the cadence/current-state narrative goes named-future with the engine.
5. Then `ProcessHubReviewPanel`, `ProcessHubView`, and the orphans **delete** (code deletion; the _design_ relocates per §10 — git history preserves the implementation).

**B0-migration UX re-home note**: the production-line-glance migration modal (`nodeMappings` authoring + `migrationDeclinedAt`) re-homes toward the framing surface — CS-P3's per-step spec editor is the natural neighbor; interim it stays reachable from the editor-canvas Process tab. Coordinate at CS-P3 sub-plan time.

---

## §6 · The honest-rename sweep

With `ProcessHubAnalyze` deleted, every `ProcessHubAnalyze['id']` annotation must re-point anyway — the sweep makes names match runtime truth in one atomic pass:

- `ProblemStatementScope.investigationId` → **`projectId`** (live filter: `AnalyzeWorkspace.tsx:293,458`, `syncScopeFromDrill`, serializers, `.vrs` facet).
- Control entities (`ControlRecord/Review/Handoff.investigationId`, `control.ts:42,78,92`) → **`projectId`** — _name only_; join semantics + the `${hub.id}:sustainment` synthetic fallback (`useControlPanelModel.ts:71`) preserved and documented inline.
- `ImprovementProject.metadata.investigationId` (`improvementProject/types.ts:45`) → **`projectId`**.
- `AnalyzeNodeMapping.investigationId` (migration-modal concept) → re-keys to project in the same sweep.
- `ControlReview.escalatedInvestigationId` **strips** (write-only, zero readers) — decision-log entry; revive trigger = the Control→Explore escalation design (#12).
- Type annotations re-point to `ImprovementProject['id']`.

No back-compat (wedge); strict-assert on unknown persisted fields per `feedback_strict_assert_over_silent_migration`; sample fixtures updated; the `'general-unassigned'` ↔ `DEFAULT_PROCESS_HUB_ID` string overload (`processHub.ts:62`) means **no grep-replace tooling on that literal**.

---

## §7 · CS-P2…P5 coordination (the gate, encoded)

Owner call 2026-06-04: **the spec gates, the build doesn't.**

| PR    | Verdict                                        | Contract                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CS-P3 | orthogonal — proceed now                       | canvasStore → `ProcessMapNode.capabilityScope`; never touches the entity. B0-migration re-home coordination (§5) at sub-plan time                                                                                                                                                                                                                                                                       |
| CS-P4 | fully orthogonal — proceed now                 | `computeOutputRate`/`computeBottleneck` take raw rows                                                                                                                                                                                                                                                                                                                                                   |
| CS-P2 | partial collision — **unblocked at spec-land** | per-step capability sources `nodeMappings` from **`ProcessContext` via the project document** (not `rollup.analyzes[].metadata`); the 2×2/`CapabilityTab` retirement belongs to **CS-P2's lift**, not this extraction (no double-shed); the duck-typed `(inv as {rows?}).rows` cast (`useHubProvision.ts:27`, `stepErrorAggregation.ts:76`) formalizes into a typed carrier as part of CS-P2's re-point |
| CS-P5 | partial — sequences after CS-P2 (existing dep) | mounts the **post-extraction shape**; PWA keeps its `useCapabilityBoxplotData` lineage, never imports `ProcessHubView` wiring                                                                                                                                                                                                                                                                           |

---

## §8 · Adjacent surfaces — boundary by contract

**The Home attention data contract** (this spec defines the data, not the surface): a project card may render attention chips from exactly `ProjectMetadata.reviewSignal` (evidence/change signals), `ProjectMetadata.sustainment` (control due-ness), and `findingCounts`/`latestActivity` (recency). Chips deep-link into the project (Explore for signals; the Project tab's Control region for due-ness). No cadence-derived attention kinds return.

**Declared follow-up map** (each consumes this spec's output; none blocks it):

| Follow-up                      | Consumes                                                                    | Status                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Home-launchpad design          | the attention data contract                                                 | own brainstorm, post-extraction                                                          |
| Control closure model (#12)    | the re-homed ControlRegion + the stripped escalation field's revive trigger | own brainstorm                                                                           |
| Analyze-domain normalization   | —                                                                           | **retired as a goal** (§9 research 2026-06-04); revive = derive an index from aggregates |
| Evidence-Map post-Model-B fate | —                                                                           | parked (`investigations.md`), post-demo                                                  |
| CoScout context redesign       | the slimmed `buildProcessHubContext`                                        | parked                                                                                   |

**Partial-integration policy**: between PO-2 (re-homes land) and the consuming designs (Home, #12), the re-homed surfaces ship _minimal_ — attention chips and the Control region render with today's visual language in their new hosts; no new interaction patterns are invented ahead of the consuming brainstorms. If a re-home would force a design decision belonging to a follow-up, the PR takes the smallest honest placement and logs the decision to the follow-up's brief.

---

## §9 · The persistence model — two-tier, declared (decision)

**Owner call 2026-06-04 ("make this right from the beginning") + research validation** (6 web researchers + an adversarial critic, unanimous SUPPORT): VariScout's persistence architecture is the **two-tier model** — promoted from implicit convergence to designed decision. Reference evidence: Figma (Postgres operational metadata + monolithic per-document checkpoints), tldraw (normalized reactive store in memory, ONE JSON snapshot on disk, document/session split), Automerge (the document is the addressable, wholesale-loaded unit), Excalidraw (one versioned JSON file). Notion is the legitimate counter-model — and it normalizes _because_ it queries across documents, the exact access pattern ADR-073 forbids here. IndexedDB research: the bottleneck is **transaction count, not record size** — one aggregate read/written in one transaction is transaction-optimal. **History corroborates: F3's normalized analyze-domain tables (PRs #130–#136) went dead in production code** — normalization belongs in memory (the 9 stores), not necessarily on disk.

### §9.1 · The two tiers

| Tier                                                                                         | Entities                                                                                                                                                | Persistence                                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Tier 1 — operational entities** (portfolio-visible, cross-session, individually addressed) | `ProcessHub` · `ImprovementProject` (+ `ProjectMetadata` projection) · `EvidenceSnapshot`+provenance · `ControlRecord/Review/Handoff` · `ProjectMember` | per-entity Dexie tables · action-routed writes · per-entity blob sync                                    |
| **Tier 2 — the analysis aggregate** (the working set, loaded wholesale into the stores)      | rawData + findings + hypotheses + scopes + causalLinks + durable canvas structure                                                                       | `DocumentSnapshot` → one Azure blob / one `.vrs` file — **one schema for both (parity by construction)** |

**Do not split Tier 2; do not normalize the analyze domain; no CRDTs for V1** (research verdict). The large aggregate is a **conscious deviation from Vernon's small-aggregates rule** — that rule targets multi-user contention + partial-load cost; here contention is coarse (per-project, 2–5 users, blob ETag) and the whole document is in memory anyway. Invariants set the boundary, not size.

### §9.2 · Bridge rules

- **Projection single-writer + load-time heal**: `ProjectMetadata` is written only by `buildProjectMetadata` at save (the `sustainment` direct-Dexie path is the one sanctioned refresh bypass, documented). Dexie+Blob give no cross-store atomicity, so on project open the portfolio card is **recomputed from the loaded aggregate and healed on mismatch** — a partial save can never become a permanent lie.
- **FK direction**: Tier 1 may hold Tier-2 roots (`projectId`, `hubId`); nothing inside the aggregate references Tier-1 rows (the §6 sweep enforces the spirit; this is the rule).
- **Co-load invariant**: any feature joining a Tier-2 finding to a Tier-1 record (evidence/provenance) does so **in-memory after wholesale load** — never via a cross-document query. Documented so a future feature doesn't quietly need the forbidden pattern.
- **View-state exclusion**: per-user transient state (camera/selection/viewport) never serializes into the shared Tier-2 blob — the ADR-078 View-layer split is the enforcement point; "canvas state" in the aggregate means durable analytical structure only. (Verify at PO-8 grounding — the tldraw document/session split is the reference.)

### §9.3 · Schema policy

- `DocumentSnapshot` gains **`schemaVersion`** — stamped in Phase F, _after_ the disposition + rename sweeps, freezing the cleaned shape as v1.
- **Strict-assert on load** for malformed/corrupt documents (loud failure per `feedback_strict_assert_over_silent_migration`) — **with a documented expiry: the first real customer's saved `.vrs`/blob is permanent history**; strict-reject of old versions becomes data loss at that instant.
- **Migration-dispatch seam scaffolded now**: an (initially empty) `migrateVn→Vn+1` table + an additive-first content model — the tldraw/Automerge pattern — so the first post-customer schema change is a migration, not an event.
- **Newer-than-reader (launch-blocking)**: a _known-but-newer_ `schemaVersion` opens **read-only with a "saved by a newer version" warning** (the SolidWorks/FME pattern) — never a refusal. With staggered upgrades across 2–5 users, a Member on an older build opening a Lead's newer blob is a day-one scenario. The `.vrs` file shares the format but has a longer forward-compat horizon — design the read path for file-meets-newer-reader first; incompatibility surfaces as a user-facing message, never an uncaught throw.

### §9.4 · Concurrency + durability hardening

- **Sync-conflict UX (launch-blocking)**: cloud writes use conditional PUT `If-Match:<etag>`; on HTTP 412 the user gets a **reload-or-branch choice** — never blind overwrite, never silent retry (whole-document ETag is last-writer-wins; silent loss contradicts the product's own loud-failure principle).
- **Same-user multi-tab**: the wholesale Dexie write + blob save wrap in a **Web Locks exclusive lock** (shared for reads); BroadcastChannel alone is reactive and insufficient.
- **IDB eviction**: `navigator.storage.persist()` requested on a save gesture + `navigator.storage.estimate()` surfaced; **the cloud blob is the durability source of truth**, so origin-wide eviction degrades to a re-sync, not data loss. (PWA stays session-only per R6d — `.vrs` is its durability.)
- **Serialization placement**: serialize+upload moves into the existing stats web worker; the payload stores as a Blob (bypasses the in-DB structured-clone cost); **size telemetry** with a >50MB re-architect trigger (research thresholds: <1MB fine · 1–10MB worker · 10–50MB chunk · >50MB split raw rows from the light analytical state).

### §9.5 · Data-growth posture

- **Working set (browser-only, ADR-059)**: unchanged — the unit of load is one project's document (1:1 = one process's data); raw rows live in `projectStore` + the stats worker as today.
- **Portfolio scale: improves.** Today Home synthesizes analyze entities + rollups over every project per mount (`buildProcessHubRollups`); after, Home reads save-time `ProjectMetadata` projections — linear in small metadata, zero document loads. This is why §3 _keeps_ the derived projections (`findingCounts`, `reviewSignal`, `sustainment`).
- **Cross-document queryability: retired as a goal, not deferred.** "All findings across projects" has no V1 query (ADR-073; the portfolio reads projections). Revive trigger = a real product need (cross-project search, portfolio CoScout); revive path = **derive an index from aggregates** — never switch the write model back to per-entity tables.
- **Re-ingest accumulation (Measure⇄Analyze loop)** — three accumulators, each owned: EvidenceSnapshots+provenance (hub/source-keyed, untouched; no pruning policy is a pre-existing watch-item, not changed here) · scopes (`syncScopeFromDrill` accumulates; the ScopeRail archive prune path is kept) · findings (status sections bound the Report's narrative; the open-questions block collapses; Wall density is CS-12 DOI/Focus). **Nobody should re-introduce lineage as a "performance fix" — the bounds are status + UI, by design.**
- **`.vrs` size**: findings are small structured JSON; noise relative to raw data the snapshot already carries.

---

## §10 · Named-future relocation (relocate intact)

One relocation doc — **"VariScout Process: the process-operations layer"** — captures the coherent future product before its code deletes: the cadence model (queues, huddle/review ritual, current-state narrative), the work-item fields (depth/status/nextMove/owner strip), `stateNotes`, the multi-analyze container, the overdue/readiness attention taxonomy — with commit-hash pointers to the deleted implementation and ancestry links to the three archived pre-wedge operating-model docs. Filed under the archive/named-future home with a decision-log entry. The _design_ relocates intact; the _code_ deletes (git preserves; orphans already accumulate).

---

## §11 · Doc-layer propagation + ADR touchpoints

**Drift-now** (safe on main, independent of build): root `CLAUDE.md` stale operating-model path (points to `docs/superpowers/specs/…`; the file lives at `docs/archive/specs/2026-04-27-process-learning-operating-model-design.md`) · `apps/azure/CLAUDE.md` false claim "MatchSummaryCard pill renders from `snapshot.provenance`" (the facet is write-only; it renders from in-memory `MatchSummaryClassification`).

**Apply-phase** (lands with its PR): journey re-narration — `docs/02-journeys/flows/project-reopen.md` + `azure-daily-use.md` rewritten from the improvement-specialist POV (the ADR-043 portfolio/continue-analysis/overdue-batch framing out) · `packages/stores/CLAUDE.md` + `packages/core/CLAUDE.md` analyze-surface notes · `OVERVIEW.md` quick-analysis promise wording once `.vrs` round-trips findings.

**ADRs + logs**: amend **ADR-078** (D3 disposition: the multi-analyze future is recorded in the §10 relocation doc; the entity dissolves) · close **ADR-085's** ScopeFilter-reconcile mandate (resolved by deletion — the durable WHERE is `ProblemStatementScope` alone) · **new ADR**: ProcessHubAnalyze dissolution + lineage retirement (the two structural calls) · **new ADR**: the two-tier persistence model (§9 — operational entities + analysis aggregate; normalization retired with revive trigger) · decision-log: close the ProcessHubAnalyze OQ → this spec; close the lineage-under-wired defect (fixed by deletion); log `escalatedInvestigationId` strip + revive trigger; log the CS-P2 gate call · `investigations.md`: graduate the categorizer-parity entry into D1; log the EvidenceSnapshot-pruning watch-item if absent.

---

## §12 · Phasing + delivery

**Approach: reversible-first ladder; atomic-cascade discipline inside C and E** (per `feedback_atomic_sweep_one_dispatch` — those two are tsc-wide breaking changes; one Opus dispatch each with Architect→Migration→Validator phases + per-category commits).

| PR    | Phase                         | Model                   | Content                                                                                                                                                                                                                                                                                                             |
| ----- | ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PO-1  | A · dead shed                 | Sonnet                  | orphaned `CadenceQueues`/`Questions` · dead fields + hooks (`scopeFilter`/`paretoGroupBy`/`timelineWindow`/`canonicalMapVersion`-analyze, `useCanvasFilters`/`useTimelineWindow`) · `analyzeActions.ts` · `onPlansChanged` option · escalation input strip · "New Analyze" buttons · hub picker · phantom sort keys |
| PO-2  | B1 · re-homes                 | Opus                    | ControlRegion→Project tab (re-sign to projects) · Home attention chips (§8 contract) · Survey dedup                                                                                                                                                                                                                 |
| PO-3  | B2 · engine delete            | Sonnet/Opus             | cadence engines + `ReviewPanel`/`ProcessHubView` delete · CoScout context slim                                                                                                                                                                                                                                      |
| PO-4  | C · entity dissolution        | **Opus atomic cascade** | `ProcessHubAnalyze`/`Rollup`/projection types retired · direct `ProcessContext`/`ProjectMetadata` reads · PWA Dexie retirement · validator runs **app test suites**, not just builds (CS-12 lesson)                                                                                                                 |
| PO-5  | D1 · Report re-source         | Opus                    | lineage retirement · Report-from-status (+ categorizer parity)                                                                                                                                                                                                                                                      |
| PO-6  | D2 · findings hygiene         | Sonnet                  | FK drop · PWA findings unification (+ optional Stage-5 hypothesisDraft fold)                                                                                                                                                                                                                                        |
| PO-7  | E · rename + docs             | **Opus atomic cascade** | `projectId` sweep · journey re-narration · doc propagation                                                                                                                                                                                                                                                          |
| PO-8a | F1 · schema hardening         | Opus                    | `DocumentSnapshot.schemaVersion` (freezes the post-E shape as v1) · strict-assert (malformed only) · migration-dispatch seam (empty table) · **newer-than-reader read-only + warning** (launch-blocking) · view-state-exclusion verify                                                                              |
| PO-8b | F2 · concurrency + durability | Sonnet/Opus             | **412 reload-or-branch UX** (launch-blocking) · Web Locks around the wholesale write · `navigator.storage.persist()`/`estimate()` · worker-side serialize + Blob storage · size telemetry (>50MB trigger) · load-time projection heal                                                                               |

**Dependencies**: A → {B1 → B2 → C} ∥ {D1 → D2} → E → {F1, F2}. CS-P2 starts any time post-spec. The two **launch-blocking** F items (newer-than-reader read-only; 412 UX) gate the **first customer**, not other PRs. Per PR: grounding → sub-plan → subagent build → adversarial review → merge; one worktree per PR; delivery state lives in `gh pr list` + the master plan, not memory.

---

## §13 · Guardrails + verification

**Surviving guardrails**: the no-Project onramp untouched (verified entity-free — PWA quick-analysis anchors on bare stores) · provenance untouched (hub/source-keyed) · Control join semantics unchanged through the rename · ADR-073 no-roll-up unaffected · the `sustainment` direct-Dexie write path preserved · cadence→analysis one-way-ness becomes moot (the engine deletes) but the surviving Control/Survey reads stay read-only over documents.

**Verification**: per-PR `pr-ready-check` green + **app test suites** · `--chrome` verify on the three re-homed surfaces (Project-tab Control region · Home attention chips · the editor-canvas Process tab post-husk-removal) · a `.vrs` round-trip test for PWA findings with a **negative control** (a finding absent from the store must not appear after import) · Report status-composition tests with negative controls (a ruled-out hypothesis must **not** enter the narrative section; a proposed finding must **not** enter "tested and excluded") per `feedback_load_bearing_tests` · **persistence hardening tests (Phase F)**: a newer-`schemaVersion` document opens read-only with the warning (negative control: same-version opens editable) · a 412 conflict surfaces the reload-or-branch choice (negative control: matching ETag writes silently) · two simulated tabs cannot interleave wholesale writes under the Web Lock.

---

## §14 · Open items

- B0-migration UX final home — decided at CS-P3 sub-plan time (§5 note); interim placement specified.
- EvidenceSnapshot pruning policy — pre-existing watch-item, logged, not this spec's to fix.
- Whether Home attention chips warrant per-user read-state — belongs to the Home-launchpad brainstorm (§8), not here.
