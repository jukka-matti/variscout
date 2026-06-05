---
tier: living
purpose: design
title: 'PO-7 · Honest-rename sweep + docs — sub-plan (investigationId → projectId)'
audience: human
status: active
date: 2026-06-05
last-reviewed: 2026-06-05
layer: spec
topic: [process-as-operations, entity-disposition, rename-sweep, sub-plan, doc-propagation]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
---

# PO-7 · Honest-Rename Sweep + Docs — Implementation Sub-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development — code sweep executed as **ONE Opus atomic-cascade dispatch** (per-entity-family commits, ladder below) per `feedback_atomic_sweep_one_dispatch`; doc tasks are separate Sonnet dispatches on the same branch. Worktree: `.worktrees/po-7-rename-sweep` (branch `feat/po-7-rename-sweep`). Implementer verification = targeted `<90s` runs; the full sweep is controller-level. **All line refs are 2026-06-05 grounding refs vs main `ec3f86fbc` and WILL drift — locate by symbol/label, never by cited line number.**

**Goal:** Every `investigationId` FK renames to `projectId` (names match runtime truth — the values have been project ids since IM-0a); `ControlReview.escalatedInvestigationId` deletes (1 line, zero readers/writers); the dead `ScopeReadAPI` deletes (PO-6 ReadAPI precedent, owner-ratified); the phantom Dexie `investigationId` index drops from the control tables in both apps (owner-ratified); journeys re-narrate; the §10 relocation doc + four ADR touchpoints land.

**Architecture:** Per-entity-family commits, each tsc-green in isolation: scope family → control+metadata family (coupled by the join — atomic) → migration-modal family → deletions → Dexie → load-bearing test additions → comment sweep. Docs ride the same branch as separate commits.

**Acceptance gate (controller-run, in this order):**

1. `grep -rn 'investigationId' --include='*.ts' --include='*.tsx' packages/*/src apps/*/src | grep -v 'db/schema.ts'` → **0 hits** (src + tests). `db/schema.ts` excluded because frozen historical Dexie version blocks legitimately retain the literal (monotonic-chain rule); within those two files, the literal may appear ONLY inside `version(N)` blocks with N ≤ 16 (azure) / N ≤ 14 (pwa) and in the PWA tests' `LEGACY_DOCUMENT_SNAPSHOT_STORES`-style legacy-seed constants.
2. `grep -rn 'escalatedInvestigationId' packages apps` → 0.
3. `grep -rc 'general-unassigned' …` per file: counts byte-identical to main (the VALUE literal never changes).
4. `grep -rn 'improvementProjectId' --include='*.ts' --include='*.tsx' packages/*/src apps/*/src | wc -l`: count identical to main (the distinct direct FK never renames).
5. Control join tests green: `packages/core/src/__tests__/control.test.ts` · `controlReadiness.test.ts` · `report/__tests__/ipReport.test.ts` · `packages/hooks/src/__tests__/useControlPanelModel.test.tsx` · azure `controlStorage.test.ts` · `ProcessHubControlRegion.test.tsx`.
6. Full `pnpm test` (turbo) + both app suites + `bash scripts/pr-ready-check.sh` green.

**Grounded decisions (2026-06-05, 11-agent workflow + 4 adversarial verdicts + completeness critic + owner ratification — encode, don't re-derive):**

- **`AnalyzeNodeMapping.investigationId` DOES NOT EXIST** (unanimous: 6 readers + 3 verifiers). The core type (`processHub.ts` ~149) is `{nodeId, measurementColumn, specsOverride?}` — **do not touch it; do not invent the field**. The spec §6 line is a misnomer corrected by doc task D8. The real surface is the migration-modal family: `ProductionLineGlanceMigrationModalEntry.investigationId` + `useHubMigrationState` signatures, where the value IS a project id under 1:1 (`inv.id`, Dashboard members map) — rename → `projectId` is honest (Commit 3).
- **`escalatedInvestigationId` is a 1-line type-member delete** (`control.ts` ~80). PO-1 already removed the only writer (ControlReviewLogger input, commit `71a6ab020`); zero readers, zero writers, zero test refs, never a Dexie index key. No migration, no scrub.
- **The rename is NAME-ONLY**: every FK is already typed `ImprovementProject['id']` (PO-4/PO-6 absorbed the re-points). Values don't change; serializers don't emit the key (`serializeScopes` is FK-free); `'general-unassigned'` is a VALUE that can populate `scope.projectId` — the field key renames, the value literal never does.
- **The Control join is `string === string` — tsc CANNOT catch a partial rename** (both sides are structurally `string`). The control-family + metadata renames land in ONE commit (Commit 2); the acceptance grep is the primary structural gate; the join tests corroborate. **Masked-clause gap** (verifier catch): `ipReport.selectControlRecord` clause 3 (`record.projectId === ip.metadata.projectId`) is never exercised in isolation today — existing fixtures also match clause 2. Commit 7 adds the isolation test per `feedback_load_bearing_tests`.
- **Local-var shadowing hazard** (critic catch): `control.ts` `indexRecordsByProject` already binds `const projectId = record.improvementProjectId` — a DISTINCT, non-renamed direct FK. Locals holding the (possibly synthetic) join-key value use **`joinKey`/bridge naming**, never `projectId`: `handoffByInvestigation` → `handoffByJoinKey` (×2), `bridgeInvestigationIds` → `bridgeJoinKeys`, `useControlPanelModel.buildDraftRecord`'s local → `joinKey`.
- **Owner-ratified: drop the phantom Dexie index** — `investigationId` is a declared secondary index on controlRecords/Reviews/Handoffs in BOTH apps but ZERO `.where('investigationId')` queries exist (PO-6 CausalLink precedent). New version bump per app (azure v17, pwa v15) drops it; do NOT add a `projectId` index. Historical version blocks stay byte-identical.
- **Owner-ratified: delete the dead `ScopeReadAPI`** (interface + `HubRepository.scopes` member + `persistence/index.ts` re-export + both stub impls) — same class as the three ReadAPIs PO-6 deleted; both impls are `[]`-returning stubs with underscore-prefixed params; zero external callers (verified: no `.scopes.` repository access anywhere). Re-verify zero-caller before deleting; a live caller = BLOCKED, report.
- **NO persistence migration, NO strict-assert** — wedge no-back-compat: pre-rename blobs/`.vrs`/Dexie rows deserialize with `projectId === undefined` and silently stop joining (the ACCEPTED cost, documented in ADR-091 + baked into a documentation-by-test in Commit 7). `documentSnapshotVrs.ts` validator + `schemaVersion` are **PO-8a's** — untouched here.
- **Naming clash to leave alone**: `DocumentSnapshot.project.projectId` (pre-existing, = the active-document identity, NOT the IP self-FK) — different referent, untouched; Commit 8 adds a one-line distinguishing comment where confusion is likely.
- **tsc visibility split** (PO-6 lesson, re-confirmed): ui + both apps compile `__tests__` in build tsc; core/stores/hooks do NOT — their ~15 test files break only at vitest runtime. Echo-stub traps: `AnalyzeWorkspace.scopePerIP.seam.test.tsx` + `mapwall.test.tsx` stubs ECHO the field into scope objects — rename stub keys AND assertions together, keep the per-IP negative control (ip-B drill must NOT co-mingle into ip-A's scope) meaningful.
- **Zero i18n work** — no `MessageCatalog` keys carry the FK; aria/testid/visible "investigation" strings are vocabulary/brand KEEPS.
- New ADR numbers: **ADR-090** (dissolution + lineage retirement) and **ADR-091** (two-tier persistence) — verified next-free (highest existing = 089).

**Conventions:** work only in the worktree · commit per family (ladder below) · tsc error revealing an unlisted live consumer → BLOCKED with file:line, don't improvise · locate by symbol · review `git status` before commit (lint-staged stash hazard — no blind `git add -A`).

**Keep-guards (violating any = BLOCKED, report instead of proceeding):**

1. **`improvementProjectId` stays byte-identical everywhere** — the distinct direct project FK (`control.ts` member, `controlReadiness.ts` predicate, `ipReport.ts` clause 2, `useControlPanelModel` `record.improvementProjectId === targetId` + the emitted `improvementProjectId: project?.id`, `indexRecordsByProject`).
2. **`'general-unassigned'` VALUE literal untouched everywhere** (overloads `DEFAULT_PROCESS_HUB_ID` + the quick-analysis scope-owner sentinel). No grep-replace tooling on it; per-file occurrence counts must match main.
3. **Core `AnalyzeNodeMapping` byte-identical** (no `investigationId` exists on it).
4. **`documentSnapshotVrs.ts`, `DocumentSnapshot.schemaVersion`, `DocumentSnapshot.project.projectId` untouched** (PO-8a territory / different referent).
5. **Historical Dexie version blocks frozen** (azure `version(1..16)`, pwa `version(1..14)` incl. the v1 dead-table strings and v3/v4/v6/v9 control strings) + the PWA tests' legacy-seed store maps (`App.test.tsx` / `modeA1.test.tsx` `LEGACY_DOCUMENT_SNAPSHOT_STORES`) stay byte-identical — they describe on-disk history. If the PWA suite reds on schema shape, the fix is in the NEW version block, never the seeds.
6. **Visible copy + brand untouched**: "Linked investigation" label (HeaderMetadataSection), Investigation Wall brand, testid/aria VALUES, i18n catalogs. Copy decisions belong to the queued "Project tab / IP-detail stage overviews" design session.
7. **The `${hub.id}:sustainment` synthetic fallback expression preserved byte-identical** and documented inline (spec §6 mandate).
8. **JourneyPhase + CoScout untouched** (`coScoutModes.test.ts` green untouched).
9. **No back-compat shims, no key migrations, no value transforms** — name-only sweep.

**Rename boundary (pin — neither under- nor over-rename):** IN scope: the `investigationId` identifier itself (fields, params, props, locals) + same-symbol companions that would otherwise lie against a renamed sibling: `investigationName` → `projectName` (modal entry), `scopeInvestigationId` prop → `scopeProjectId` (AnalyzeWorkspace + Editor call site), `investigationOptions`/`onInvestigationIdChange` → `projectOptions`/`onProjectIdChange` (HeaderMetadataSection + both panel callers), `handoffByInvestigation`/`bridgeInvestigationIds` → joinKey-naming, `ControlEntryRow` prop. OUT of scope: broader "Investigation" vocabulary tokens (`persistInvestigation`, `handlePersistInvestigation`, store names, brand strings, visible copy, testids), `SerializedInvestigationState` (serializer-internal type name — rename only if zero-risk mechanical; if it cascades, leave + note in D8).

---

## Part 1 — Code cascade (ONE Opus dispatch, commits in order)

### Commit 1: Scope family (`ProblemStatementScope.investigationId` → `projectId`)

**Files:** `packages/core/src/findings/types.ts` (ProblemStatementScope member ~821 + JSDoc) · `packages/core/src/findings/factories.ts` (`createProblemStatementScope` param + JSDoc + object key) · `packages/core/src/actions/scopeActions.ts` (`SCOPE_ADD.investigationId`) · `packages/stores/src/analyzeStore.ts` (`addScope` + `syncScopeFromDrill` interface sigs + impls + the idempotency read `s.investigationId === …`) · `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` (prop `scopeInvestigationId` → `scopeProjectId`, default `'general-unassigned'` VALUE unchanged; the two live filters + the syncScopeFromDrill call + deps arrays) · `apps/azure/src/pages/Editor.tsx` (`scopeInvestigationId={…}` call site) · any `applyAction` SCOPE_* destructure both apps (tsc-driven).

- [ ] **Step 1:** Rename the type member; replace the stale "Field name preserved (projectId rename is PO-7)" comment with: `/** FK to the owning ImprovementProject (PO-7 rename of investigationId). May carry the quick-analysis sentinel 'general-unassigned' when no project is active. */`
- [ ] **Step 2:** tsc-walk the family: factory, action, store (interface + impl + the load-bearing `s.projectId === projectId` idempotency read in `syncScopeFromDrill`), workspace filters, Editor call site. Run `pnpm --filter @variscout/core build && pnpm --filter @variscout/stores build`.
- [ ] **Step 3:** Test files (rename fixture keys + assertions TOGETHER; keep negative controls meaningful): `core findings/__tests__/problemStatementScope.test.ts` · `findings.test.ts` · `applyAction.test.ts` SCOPE_ADD literal · `stores analyzeStore.test.ts` + `analyzeStore.scope.test.ts` · azure `AnalyzeWorkspace.scopePerIP.seam.test.tsx` (stub echo lines ~171-179 AND assertions ~282/290/319/424/441) · `AnalyzeWorkspace.mapwall.test.tsx` (stub ~223-228 + assertion ~762) · `AnalyzeWorkspace.emptyLineage` variant · `analyzeSerializer.test.ts` scope literal · ui `ScopeRail.test.tsx` · `WallCanvas.test.tsx` scope literal ~1029 (the PO-6 gate-catch keep — drop its "until PO-7" comment) · `documentSnapshot.test.ts` ~66 · `documentSnapshotVrs.test.ts` ~61.
- [ ] **Step 4:** Targeted runs: `pnpm --filter @variscout/core test -- problemStatementScope`, `pnpm --filter @variscout/stores test -- analyzeStore.scope`, azure scopePerIP seam. All green.
- [ ] **Step 5:** Commit `refactor(po-7): scope family — ProblemStatementScope.investigationId → projectId`.

### Commit 2: Control family + metadata (ATOMIC — the join crosses these files)

**Files:** `packages/core/src/control.ts` (ControlRecord/ControlReview/ControlHandoff members + `handoffFor`/`selectControlReviews`/`selectControlBuckets` locals) · `packages/core/src/controlReadiness.ts` · `packages/core/src/survey/handoff.ts` (~34) · `packages/core/src/report/ipReport.ts` (clauses 3 in `selectControlRecord` + `selectControlHandoff`) · `packages/core/src/improvementProject/types.ts` (`metadata.investigationId` → `projectId` + stale comment) · `packages/core/src/actions/controlActions.ts` + `controlHandoffActions.ts` (Omit key unions — verify whether `'investigationId'` appears; standard `Omit` does NOT error on stale keys, fix by grep not tsc) · `packages/hooks/src/useControlPanelModel.ts` · azure `ControlRecordEditor.tsx`/`ControlReviewLogger.tsx`/`ControlHandoffEditor.tsx` (props) · `Editor.control.tsx` (`ControlEntryRow` prop + filter) · `Editor.tsx` (~740/766/769/2013 bridge reads + `investigationId={projectId}` → `projectId={projectId}` at the ControlEntryRow mount) · pwa `App.tsx` (~1063/1448) · azure `services/localDb.ts` (param + `record.investigationId` read) · ui `HeaderMetadataSection.tsx` (props `investigationId`/`investigationOptions`/`onInvestigationIdChange` → `projectId`/`projectOptions`/`onProjectIdChange`; the visible "Linked investigation" label STAYS) · both apps' `ImprovementProjectPanel.tsx` (`metadata: { projectId }` writer + callback param).

- [ ] **Step 1:** `control.ts` — rename the three entity members. On `ControlRecord.projectId` write the spec-mandated inline doc:

```typescript
/**
 * The Control join key (PO-7 rename of `investigationId` — name-only; join
 * semantics unchanged). Usually the owning ImprovementProject id under
 * Project⟷Hub 1:1; records created without an associated closed project carry
 * the synthetic `${hub.id}:sustainment` fallback (see
 * `useControlPanelModel.buildDraftRecord`), so this is NOT guaranteed to
 * resolve to a live project. `improvementProjectId` is the direct optional
 * project FK; THIS field is the bridge key handoffs join through.
 */
projectId: ImprovementProject['id'];
```

- [ ] **Step 2:** `control.ts` locals: `handoffByInvestigation` → `handoffByJoinKey` (both selectors), `handoffFor` param accordingly. `controlReadiness.ts`: `bridgeInvestigationIds` → `bridgeJoinKeys`, return type `Set<ControlRecord['projectId']>`, doc comments updated. **`improvementProjectId` sites byte-identical** (keep-guard 1).
- [ ] **Step 3:** `useControlPanelModel.buildDraftRecord`:

```typescript
// The Control join key: the project's self-FK when a closed project exists,
// else the synthetic `${hub.id}:sustainment` fallback — the only join key for
// records created without an associated closed project. PO-7 renamed the
// FIELD (investigationId → projectId); the fallback VALUE is deliberately not
// a project id and is preserved byte-identical.
const joinKey = project?.metadata.projectId ?? `${hub.id}:sustainment`;
```

…and `projectId: joinKey` in the record literal. The emitted `improvementProjectId: project?.id` stays.

- [ ] **Step 4:** tsc-walk the rest (metadata member, ipReport clauses, survey/handoff, editors, bridges, localDb, HeaderMetadataSection + panels). `pnpm --filter @variscout/core build && pnpm --filter @variscout/hooks build && pnpm --filter @variscout/ui build`.
- [ ] **Step 5:** Test files (~40 control-domain fixtures, mechanical — rename keys + assertions together): `control.test.ts`, `controlReadiness.test.ts`, `controlActions/controlHandoffActions` tests, `ipReport.test.ts`, `useControlPanelModel.test.tsx`, azure `controlStorage.test.ts` (the `db.projects.get('inv-1')` join-key VALUE convention stays — only field keys rename), `ProcessHubControlRegion.test.tsx`, `Editor.control` tests, pwa `applyAction.control.test.ts` (NOTE: `escalationPath`/`reactionPlan` are ControlHandoff fields — untouched), pwa `App.test.tsx`/`modeA1.test.tsx` control fixtures (legacy-seed constants FROZEN per keep-guard 5), `handoff.test.ts`, charter/panel tests.
- [ ] **Step 6:** Targeted runs: core control + controlReadiness + ipReport, hooks useControlPanelModel, azure controlStorage. Green.
- [ ] **Step 7:** Commit `refactor(po-7): control family + metadata — the join key renames atomically (joinKey locals; improvementProjectId untouched)`.

### Commit 3: Migration-modal family (the spec's "AnalyzeNodeMapping" misnomer, corrected)

**Files:** `packages/ui/src/components/ProductionLineGlanceMigration/ProductionLineGlanceMigrationModal.tsx` (`ProductionLineGlanceMigrationModalEntry.investigationId` → `projectId`, `investigationName` → `projectName`, `onSave` mapping element, `onDecline` param, preselect map, interpolated testid/htmlFor EXPRESSIONS — values unchanged) · `apps/azure/src/features/processHub/useHubMigrationState.ts` (`handleSave`/`handleDecline` sigs, `modalEntries` builder `projectId: inv.id`, `byId` map) · `ProductionLineGlanceMigrationModal.test.tsx` + `useHubMigrationState` tests.

- [ ] **Step 1:** Rename across the three files; core `AnalyzeNodeMapping` + the persisted `nodeMappings` shape (`{nodeId, measurementColumn}`) byte-identical (keep-guard 3).
- [ ] **Step 2:** `pnpm --filter @variscout/ui build && pnpm --filter @variscout/azure-app build` (ui build tsc covers its tests). Targeted modal test run green. B0 contract intact: `handleSave` still writes `nodeMappings`/`processHubId`, `handleDecline` still writes `migrationDeclinedAt`.
- [ ] **Step 3:** Commit `refactor(po-7): migration-modal entry — investigationId → projectId (core AnalyzeNodeMapping untouched; spec misnomer corrected in docs)`.

### Commit 4: Deletions — `escalatedInvestigationId` + dead `ScopeReadAPI`

**Files:** `packages/core/src/control.ts` (delete the `escalatedInvestigationId?:` line) · `packages/core/src/persistence/HubRepository.ts` (delete `ScopeReadAPI` interface + the `scopes: ScopeReadAPI` member) · `packages/core/src/persistence/index.ts` (re-export) · `apps/azure/src/persistence/AzureHubRepository.ts` + `apps/pwa/src/persistence/PwaHubRepository.ts` (stub blocks + import).

- [ ] **Step 1:** Re-verify zero callers: `grep -rn '\.scopes\b' packages/*/src apps/*/src --include='*.ts' --include='*.tsx' | grep -i 'repo\|repository\|hubRepo'` → only the impl blocks themselves. A live caller = BLOCKED.
- [ ] **Step 2:** Delete all five sites. `pnpm build` green across packages.
- [ ] **Step 3:** Commit `refactor(po-7): delete escalatedInvestigationId (zero writers since PO-1) + dead ScopeReadAPI (PO-6 ReadAPI precedent, owner-ratified)`.

### Commit 5: Dexie — drop the phantom index (both apps)

**Files:** `apps/azure/src/db/schema.ts` · `apps/pwa/src/db/schema.ts` · `apps/azure/src/db/__tests__/schema.v6.test.ts` (verno 16 → 17, two assertions) · `apps/pwa/src/db/__tests__/schema.v7.test.ts` (`LATEST_SCHEMA_VERSION` 14 → 15).

- [ ] **Step 1:** Azure — append (historical blocks untouched):

```typescript
// Version 17: PO-7 honest-rename — drop the phantom `investigationId` index
// from the three control tables (zero `.where('investigationId')` queries
// exist anywhere; control joins are post-fetch filters — PO-6 CausalLink
// precedent). The row FIELD renamed to `projectId` (in-row, unindexed; no
// `projectId` index added). No upgrade callback — wedge no-back-compat:
// pre-rename rows keep the old key in-row and simply stop joining.
this.version(17).stores({
  controlRecords: 'id, hubId, nextReviewDue, updatedAt, deletedAt',
  controlReviews: 'id, recordId, hubId, reviewedAt',
  controlHandoffs: 'id, hubId, handoffDate',
});
```

- [ ] **Step 2:** PWA — append (same comment, `&id` convention):

```typescript
this.version(15).stores({
  controlRecords: '&id, hubId, nextReviewDue, updatedAt, deletedAt',
  controlReviews: '&id, recordId, hubId, reviewedAt',
  controlHandoffs: '&id, hubId, status, handoffDate, deletedAt',
});
```

- [ ] **Step 3:** Bump both pin tests. Run both apps' db test suites (Dexie breaks are RUNTIME-only — the suite is the gate, not tsc). If a schema-shape assertion beyond the pins reds, fix the NEW block or the LATEST-shape expectation — never a legacy seed (keep-guard 5).
- [ ] **Step 4:** Commit `refactor(po-7): drop phantom investigationId Dexie index — azure v17 + pwa v15 (no upgrade callback; owner-ratified)`.

### Commit 6: Residue sweep (the tsc-invisible tail)

- [ ] **Step 1:** Run acceptance greps 1–4 (header). Fix every residue: comments, JSDoc, type-doc references, stray test fixtures in `packages/data/src/samples/*`, `SerializedInvestigationState` per the rename boundary. core/stores/hooks test files are tsc-invisible — the grep IS the guard there.
- [ ] **Step 2:** Full package suites for core/stores/hooks (`pnpm --filter @variscout/core test` etc. — runtime catches what build tsc can't).
- [ ] **Step 3:** Commit `refactor(po-7): residue sweep — comments, fixtures, samples (grep-guarded zero investigationId)`.

### Commit 7: Load-bearing test additions (negative controls)

**Files:** `packages/core/src/report/__tests__/ipReport.test.ts` · `packages/stores/src/__tests__/documentSnapshotVrs.test.ts` (or the vrs round-trip suite — locate by symbol).

- [ ] **Step 1:** ipReport clause-3 isolation test (adapt accessors to the real `IPReportScope` shape — read the type first):

```typescript
it('selects the control record via the metadata projectId join alone (clause 3 isolation)', () => {
  // improvementProjectId deliberately NON-matching + no outcomeReference hit:
  // only `record.projectId === ip.metadata.projectId` can select it.
  const record = makeControlRecord({
    id: 'rec-meta-join',
    projectId: 'ip-1',
    improvementProjectId: 'some-other-ip',
  });
  const ip = makeProject({ id: 'ip-1', metadata: { ...baseMetadata, projectId: 'ip-1' } });
  const scope = selectIPReportScope({ ...baseInput, project: ip, controlRecords: [record] });
  expect(/* the surfaced control record id */).toBe('rec-meta-join');
});
it('selects NO control record when the metadata join key mismatches (negative control)', () => {
  const record = makeControlRecord({
    id: 'rec-no-join',
    projectId: 'unrelated',
    improvementProjectId: 'some-other-ip',
  });
  /* …same input → expect no control record surfaced */
});
```

- [ ] **Step 2:** `.vrs` scope round-trip pair: (a) a scope serialized with `projectId` round-trips — parsed object has `projectId === value` and `'investigationId' in scope === false`; (b) **documentation-by-test of the accepted cost**: a hand-built pre-rename snapshot JSON whose scope carries `investigationId` deserializes WITHOUT throwing and yields `scope.projectId === undefined` — comment: `wedge no-back-compat (ADR-091): pre-rename .vrs scope joins are silently dropped; loud validation is PO-8a`.
- [ ] **Step 3:** Run both suites; each new test verified red-by-construction first (point clause-3 at a non-matching key — must fail), then green.
- [ ] **Step 4:** Commit `test(po-7): clause-3 isolation + .vrs round-trip negative controls (feedback_load_bearing_tests)`.

### Commit 8: Distinguishing comments

- [ ] **Step 1:** One-liner near `DocumentSnapshot.project.projectId`: `// The active-document identity — NOT the ImprovementProject self-FK (metadata.projectId, PO-7).` Equivalent note at `ProblemStatementScope.projectId` if Commit 1's JSDoc doesn't already carry it.
- [ ] **Step 2:** Commit `docs(po-7): distinguish the two projectId referents inline`.

---

## Part 2 — Doc tasks (Sonnet dispatches on the same branch; D1–D7 independent, D8 last)

**Frontmatter discipline:** every new doc satisfies `scripts/docs-frontmatter-schema.mjs` + gets ≥1 inbound link. Run `node scripts/docs-check.mjs` (or the docs-gate command in pr-ready-check) after each task.

### D1: `docs/02-journeys/flows/project-reopen.md` — near-total rewrite

The ADR-043 portfolio framing is the doc's spine (title/sections/links) — all of it leaves. Rewrite from the improvement-specialist POV against the SHIPPED post-PO surface: open VariScout → Home (project cards w/ interim attention chips: control due-ness, recency, finding counts) → open the project (the document loads wholesale, stores hydrate) → continue in the 7-tab flow (`Home · Project · Process · Explore · Analyze · Improve · Report`); Control region lives on the Project tab (active-IP cascade). Remove: "Portfolio home screen", "Continue analysis" entry points, "Check investigation status", overdue-batch triage, the `investigationStore.expandedHypothesisId` + `panelsStore.activeView: 'investigation'` mechanics (stale store narration — re-verify any store reference against `packages/stores/CLAUDE.md` before writing it). ADR-043 may remain ONLY as a one-line historical-heritage link. Frontmatter `last-reviewed` bumps.

### D2: `docs/02-journeys/flows/azure-daily-use.md` — rewrite

Same POV shift: Green-Belt-Gary persona framing out; improvement-specialist (Lead/Member/Sponsor per-project roles, ADR-082) in. Daily loop = open project → re-ingest (Measure⇄Analyze) → Explore/Analyze → capture Findings → status the hypotheses → Report composes from status (PO-5). Control review happens on the Project tab when due. Verify every named surface against shipped code before writing (grounded-subagent rule).

### D3: §10 relocation doc — `docs/01-vision/variscout-process/process-operations-layer.md` (NEW)

"VariScout Process: the process-operations layer" — the coherent named-future design, relocated intact before its code deleted: the cadence model (queues, huddle/review ritual, current-state narrative), the work-item fields (depth/status/nextMove/owner strip), `stateNotes`, the multi-analyze container, the overdue/readiness attention taxonomy. **Commit-hash pointers to the deleted implementation:** PO-1 `094b563b` (PR #298, queue UI shed) · PO-2 `11ad356e` (PR #299, strip + re-homes) · PO-3 `b8923b449` (PR #300, engine delete) · PO-4 `09a52be98` (PR #301, entity dissolution) · PO-5 `5612d904e` (PR #302, lineage). Ancestry links to the three archived pre-wedge operating-model docs (locate in `docs/archive/specs/` — the 2026-04-27 operating-model + 2026-04-25 process-hub designs + sibling). Inbound link from `docs/01-vision/variscout-process/index.md`. Decision-log entry (see D7).

### D4: ADR-078 amendment + ADR-085 closure

- `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md`: amend D3 — the `ProcessHubAnalyze` entity dissolved (PO-4, PR #301); the multi-analyze future is recorded in the §10 relocation doc (link D3's file); supersession pointer to ADR-090.
- `docs/07-decisions/adr-085-drop-question-problem-statement-scope.md`: close the ScopeFilter-reconcile mandate — resolved by deletion; the durable WHERE is `ProblemStatementScope` alone; note the PO-7 field rename (`projectId`) in any shape examples that spell the field.

### D5: NEW `docs/07-decisions/adr-090-processhubanalyze-dissolution-lineage-retirement.md`

The two structural calls, recorded as one decision record: (1) `ProcessHubAnalyze` dissolution (PO-4 — surfaces read `ImprovementProject`/`ProjectMetadata`/`ProcessContext`; the typed capability carrier = the CS-P2 contract); (2) `investigationLineage` retirement (PO-5 — analyst-owned status composes the Report; the CS-6 pin wire reversed, PR #287 superseded). Context → decision → consequences → links (spec, master plan, PRs #301/#302, ADR-078, ADR-085, connective spec §4.6).

### D6: NEW `docs/07-decisions/adr-091-two-tier-persistence-model.md`

Spec §9 promoted to ADR: Tier 1 operational entities (per-entity Dexie + blob sync) · Tier 2 the analysis aggregate (`DocumentSnapshot` → one blob / one `.vrs`; one schema, parity by construction). Bridge rules (§9.2), schema policy (§9.3 — strict-assert expiry = first customer), normalization retired-as-goal with the derive-an-index revive path, R6d PWA scoping. **Record the PO-7 accepted cost**: pre-rename persisted keys silently yield `projectId === undefined` (no-back-compat); loud validation = PO-8a. Links: spec §9, PO-8a/8b rows, ADR-073, ADR-059.

### D7: decision-log + investigations.md (incremental — rows exist for PO-4/PO-5; don't re-log)

`docs/decision-log.md`: ADD (1) `escalatedInvestigationId` stripped (zero writers since PO-1); revive trigger = the Control→Explore escalation design (#12); (2) the PO-7 rename executed + the two owner-ratified calls (phantom-index drop · ScopeReadAPI deletion); (3) pointers to ADR-090/ADR-091. `docs/ephemeral/investigations.md`: close entries PO-7 resolves (check for a rename/`investigationId` watch-item); verify the EvidenceSnapshot-pruning watch-item exists (log if absent, per spec §11); leave the rest.

### D8: Spec/plan corrections + CLAUDE.md notes + OVERVIEW wording

- Spec §6 (`2026-06-04-process-ops-extraction-entity-disposition-design.md`): append a dated grounding-correction note — `AnalyzeNodeMapping.investigationId` never existed (the real surface was the migration-modal entry; renamed Commit 3); `escalatedInvestigationId` had zero writers since PO-1 (the "written by ControlReviewLogger" wording is stale).
- `packages/core/CLAUDE.md` + `packages/stores/CLAUDE.md`: analyze-surface notes — `ProblemStatementScope.projectId` (+ the Control join-key inline-doc pointer); retire any "rename is PO-7" forward references.
- `docs/OVERVIEW.md` quick-analysis wording (~line 38): reflect that quick-analysis findings now round-trip through `.vrs` (PO-6) — pins/findings survive export/import without a Project.
- Each commit message per doc task: `docs(po-7): <task>`.

---

## Verification (controller, after all commits)

1. Acceptance greps 1–4 (header) — the PRIMARY structural gate.
2. `bash scripts/pr-ready-check.sh` green (the only sweep running every package's build tsconfig — PO-6 lesson).
3. Both app suites + full turbo test.
4. Control join tests green list (header §5) + the two new Commit-7 tests.
5. Doc-gate green (frontmatter schema + inbound links).
6. `--chrome` verify (light — rename PR): Editor Analyze tab drill→scope chip still scopes per-IP; Project tab Control region renders; B0 migration banner present on a B0 fixture hub. Known walls: the Save-As `window.prompt` + replace-data `window.confirm` block deeper paths (pre-existing, logged).
7. Final adversarial Opus branch review (STEP 0: checkout the PR branch) — attack surfaces: partial-rename join breaks (grep `investigationId` semantics), `improvementProjectId` accidental renames, `'general-unassigned'` corruption, legacy Dexie block edits, echo-stub vacuous-pass, doc-claim accuracy vs shipped code.
