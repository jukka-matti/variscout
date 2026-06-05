---
tier: living
purpose: design
title: 'PO-5 · Lineage retirement + Report re-source — sub-plan (one judgment system)'
audience: human
status: active
date: 2026-06-05
last-reviewed: 2026-06-05
layer: spec
topic: [process-as-operations, findings-domain, report-engine, lineage-retirement, sub-plan]
related:
  - docs/superpowers/plans/2026-06-04-process-ops-extraction-master-plan.md
  - docs/superpowers/specs/2026-06-04-process-ops-extraction-entity-disposition-design.md
  - docs/superpowers/specs/2026-06-02-connective-surface-model-design.md
---

# PO-5 · Lineage Retirement + Report Re-source — Implementation Sub-Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development — executed as **ONE Opus atomic-cascade dispatch** (Architect → Migration → Validator internal phases, per-category commits) per `feedback_atomic_sweep_one_dispatch`; the section-type deletion is a producer change, but the ladder below orders consumers-first so every intermediate commit compiles + targeted tests stay green. Worktree: `.worktrees/po-5-lineage-retirement` (branch `feat/po-5-lineage-retirement`). Implementer verification = targeted `<90s` runs; the full sweep is controller-level. **All line refs are 2026-06-05 grounding refs vs main `65a8fd1d2` and WILL drift — locate by symbol/label, never by cited line number.**

**Goal:** `sections.investigationLineage` ceases to exist (type + factory seeds + both apps' applyAction/ProjectsTabView/panel-model merges + `toggleLineageFinding` + the CS-6 pin button + the `activeIPLineage` consumer surface); the Report composes from analyst-owned `HypothesisStatus` via a new shared `groupHypothesesByStatus` core primitive (evidence-survived-test/evidenced → narrative + cause rows · refuted → "Ruled out:" tested-and-excluded · proposed/needs-disconfirmation → "What's next" open questions); the PR #296 empty-set-means-unfiltered Wall interim becomes the permanent semantics; supersession notes for the reversed CS-6 Edge-2 wire land with the PR.

**Architecture:** Consumers-first ladder — core additions (categorizer primitive, engine re-source) first; then the apps' `activeIPLineage` consumer sweep (Wall permanence + pin handlers + Azure Report re-source); then the packages/ui pin chain + lineage bridge; then writers/merges/UI-reads shed while the type still stands; the type deletion + fixture sweep last (now zero-referenced); docs close.

**Acceptance gate:** `grep -rIn 'investigationLineage' --include='*.ts' --include='*.tsx' --exclude-dir=dist packages apps scripts .claude | wc -l` → **0** (src AND tests; ~63 files today). **Plus the prop-chain grep** (tsc CANNOT catch these — the pin props are optional plain callbacks): `grep -rIn 'onToggleProjectLineage\|isInProjectLineage\|projectLineageFindingIds\|toggleLineageFinding\|ActiveIPLineageIds\|deriveActiveIPLineageIds' --exclude-dir=dist --include='*.ts' --include='*.tsx' packages apps` → zero.

**Grounded decisions (2026-06-05, 13-agent grounding workflow + adversarial verifiers + completeness critic + owner ratification — encode, don't re-derive):**

- **The app conclusion-categorizer memos were GATE-ONLY ceremony** (grounding correction to the spec's parity framing): Azure's 2-way (`AnalyzeWorkspace.tsx:856-864`) and PWA's 3-way (`AnalyzeView.tsx:559-569`) buckets feed ONLY their render gates, and since the buckets partition `hubs`, both gates already reduce to `hubs.length > 0`. `AnalyzeConclusion` renders ALL hubs flat (per-hub `STATUS_STYLES` badges; no internal bucketing). **Unification = delete both memos + simplify both gates to `hubs.length > 0` + ship `groupHypothesesByStatus` in core as the ONE status→bucket mapping the Report keys on.** Owner-ratified "unify to 3-way" is honored: no status drops anywhere; all 5 statuses get explicit Report destinations. Do NOT ship a caller-less `bucketHypothesesByConclusion` — the conclusion-chip UI is the queued stage-overview design session's territory.
- **The Report re-source keeps the 7-section D13 contract** (owner-visible call): tested-and-excluded = the EXISTING `Ruled out:` items in 'What we standardized + learned' (already implemented at `ipReport.ts:215,222` — stays); open questions = NEW `Open question:` items in 'What's next'. `D13_OVERVIEW_SECTION_TITLES` does not change. The collapsible open-questions block is Report-VIEW territory (UI-level growth bound per spec §9) — not this PR.
- **`selectIPReportScope.hypotheses` becomes ALL live input hypotheses** (under IM-0a 1:1 the document boundary IS the project boundary; every status has a Report destination). The semantic delta is deliberate: a hypothesis with Report-relevant status but NO `factorControls.linkedHypothesisId` back-ref now APPEARS in the Report (today it silently vanishes). `linkedHypothesisIds` deletes wholesale; `linkedFindingIds` loses ONLY its lineage seed line — the `mechanismGoals.linkedFindingIds` + `hypothesis.findingIds`/`counterFindingIds` unions survive as structure. `goal.factorControls.linkedHypothesisId` remains on the type, unread by the engine post-rewrite (its writers stay; field disposition = future design, not PO-5).
- **Azure ReportView adopts the PWA composition pattern** (kills the asymmetry): `reportFindings`/`reportHypotheses` derive from `ipReportScope` directly; the THREE Azure-local lineage paths die (the `scopedHypothesisIds`-keyed `reportHypotheses` filter = THE collapse defect at `:182`; the `reportFindings` pin-union `:190-198`; the `activeIPLineage` prop). PWA ReportView needs ZERO local change (engine-only; verified no `activeIPLineage` refs).
- **The Editor/App `scopedFindings` lineage filters die too** (grounding catch — same collapse class, NO empty-set guard): `Editor.tsx:1248-1253` + `App.tsx:847-852` filter `findingsState.findings` by `activeIPLineageFindingIds` under `isIPScoped` → pass `findingsState` through unfiltered (the permanent semantics).
- **tsc will NOT surface the pin-prop chain** (verifier catch): `onToggleProjectLineage?`/`isInProjectLineage?`/`projectLineageFindingIds?` are optional plain-typed props across `FindingCard`/`FindingsLog`/`FindingBoardView`/`FindingsPanelBase` + both apps — they must be removed by enumeration (Commits 3–4), and the acceptance grep is the guard.
- **Zero i18n work** (verified): the pin button uses hardcoded English literals; no `MessageCatalog` key exists for lineage UI. `analyze.pinAsFinding` belongs to the OTHER pin gesture — untouched.
- **NO serialization migration / NO version bump** (critic-verified): `documentSnapshot.ts`/`documentSnapshotVrs.ts` round-trip the whole IP via `cloneJson` (no field-level lineage read); both apps' Dexie `schema.ts` have zero lineage refs (IPs stored as opaque rows). A re-serialized IP simply stops carrying the section; an old snapshot's extra property is ignored on read (wedge no-back-compat). Do not invent back-compat.
- **Test budget = ~45 files** (critic-corrected from ~31). Three load-bearing assertions beyond the obvious suites: `factories.test.ts` clone-identity guard (`a.sections.investigationLineage !== b.sections.investigationLineage` — delete the lineage line, keep siblings), and both apps' `applyAction.improvementProject.test.ts` "other sub-sections must not be dropped" guards (`expect(row?.sections.investigationLineage).toBeDefined()` azure `:205` / pwa `:197` — the 4-sibling premise shrinks to 3).
- **Seam tests fail for the RIGHT reason**: `AnalyzeWorkspace.emptyLineage.seam.test.tsx` tests 1b (`:314`) + 2b (`:347`) and the PWA mirror's 1b (`:174`) assert non-empty lineage STILL filters — DELETE those; re-cast 1a/2a/control as the permanent "active IP → whole document" semantics tests.
- **`ipReport.test.ts` passes for TWO reasons today** (load-bearing-test risk): the scope test seeds lineage `['hyp-1','hyp-ruled']` AND `factorControls.linkedHypothesisId:'hyp-1'` — the rewrite must keep it green for the STATUS reason (re-fixture). The 'PR-CS-6 Edge 2 union' test (`:170-191`) pins the reversed gesture — DELETE.
- **The activity 'Investigation lineage updated' section-edit event removal is a live behavior change** (the pin stamps `updatedAt`), but the pin gesture dies in the same PR, so the event could never fire again — remove the tuple. The `'hypothesis-linked'` kind is dead-on-arrival (count always 0) and orphans no UI (`IPDetailTeamRail` renders `event.label` plain — verified, no per-kind switch).
- **Stage-overview counts: minimal-honest interim, design routed** (owner call 2026-06-05): drop the dead lineage counts from `CharterOverview`/`ApproachOverview`; keep buttons/navigation untouched. The status-shaped-chips candidate + the stale "Continue in Investigation" vocabulary + the orientation-vs-dashboard question route to a NEW queued design session "Project tab / IP-detail stage overviews" (logged in `investigations.md`, Commit 7).
- **Supersession docs (verifier-expanded)**: connective spec §4.6 bullet is DOUBLY stale (claims findingIds "never populated" — CS-6 wired it; PO-5 reverses it) — the banner must correct the false premise, not just say "reversed". The connective master-plan CS-6 row was NEVER flipped to DELIVERED (decision-log `:338` records shipped) — the note fixes both. **`decision-log.md:143`** (Amendment 2026-05-15 PR-PT-7: "Empty lineage is intentionally empty scoped state") is a missed living entry PO-5 invalidates — needs a supersession line.

**Conventions:** work only in the worktree · commit per category (ladder below) · tsc error revealing an unlisted live consumer → BLOCKED with file:line, don't improvise · locate by symbol · `git rm` for whole-file deletions (none expected this PR) · review `git status` before commit (lint-staged stash hazard — no blind `git add -A`).

**Keep-guards (violating any = BLOCKED, report instead of proceeding):**

1. **`ipReport.ts` Control joins byte-identical**: `selectControlRecord` + `selectControlHandoff` (read `ip.sections.outcomeReference.{sustainmentRecordId,controlHandoffId}` + `ip.metadata.investigationId`) untouched — #12/PO-7 territory. Same for `goalItems()` (factorControls/mechanismGoals reads), `actionsForCause`/`actionProgressLabel`/`verificationLabel`/`selectedIdeaText`, and everything from `daysSince` down (`deriveHubPortfolioReport` etc.).
2. **`isCollaborative` stays** in `predicates.ts`; the file survives; the barrel line edits surgically.
3. **`deriveActiveIPScopeLabels` + `deriveActiveIPCanvasFocus` + `ActiveIPScopeLabels`/`ActiveIPCanvasFocus` stay byte-identical** (read goal/outcome, NOT lineage) — incl. their ActiveIP barrel lines and their Editor.tsx/App.tsx imports + call sites (`Editor.tsx:542,1379`; `App.tsx:820,1081`). The grouped imports need SURGICAL edits, not whole-line deletes.
4. **The OTHER pin gesture untouched**: `onPinFinding`/`handlePinFinding`/`btn-pin-finding` testid/`analyze.pinAsFinding` i18n key (`FilterBreadcrumb`, `ProcessHealthBar`, `MobileCategorySheet`, `useFindingsOrchestration`, `App.tsx:1561`). That is pin-FILTER-as-finding, not the lineage pin.
5. **`ProblemStatementScope.hypothesisIds` is a DIFFERENT entity** (ADR-085): `analyzeStore.ts:767,847` writes + `analyzeSerializer.ts:182` are scope mutations, NOT lineage — untouched.
6. **`deriveHypothesisStatus` (survey/wall.ts) untouched**; nothing routes through it. `groupHypothesesByStatus` reads the STORED `h.status` (analyst-owned, CS-10). The display-only 5-way maps (`HubCard.STATUS_STYLES`, `ConclusionCard.HUB_STATUS_DOT`, `ReportImprovementSummary.STATUS_BADGE_*`, `HypothesisCard.STATUS_KEY` + `wall.status.*` i18n keys) untouched.
7. **i18n untouched** — zero catalog keys in scope; `git diff --stat` must show zero `i18n/` files.
8. **NO schema/serializer/migration work** — no Dexie version bump, no `.vrs` schema note beyond the no-op statement, no `documentSnapshot*` edits beyond test fixtures.
9. **`useLiveProjection` hook SURVIVES** (generic FK projector; comment-only lineage ref) — re-point its JSDoc example to a surviving FK array (e.g. `approach.actionItemIds`); do NOT delete the hook. **`handleLineageNavigate` nav SURVIVES** (`useImprovementProjectPanelModel` — opens the Wall; its `section: 'lineage'` uiState string is a free-text breadcrumb label, not a typed lineage ref).
10. **`WallCanvas` untouched** (pure renderer; PR #296's WallCanvas diff was visual polish — the filters live in app files). `D13_OVERVIEW_SECTION_TITLES` stays 7 sections.
11. **PO-6/PO-7 fences**: no `Finding.investigationId`/`Hypothesis.investigationId` FK work, no PWA `findings`/`hypotheses`/`causalLinks` Dexie tables, no `investigationId`→`projectId` renames, no `'general-unassigned'` edits, no `metadata.investigationId` touches.
12. **`AnalyzeConclusion`/`HubCard`/`HubComposer` component internals untouched** (they render all hubs flat; only the mount-site gates + `scopedHubs`/`scopedWallFindings` arg names re-point).

---

### Commit 1: Core — `groupHypothesesByStatus` (the shared status mapping)

**Files:** Modify `packages/core/src/findings/helpers.ts` · Test `packages/core/src/findings/__tests__/helpers.test.ts` (or the existing helpers test file — locate by `groupFindingsByStatus` describe).

- [ ] **Step 1: Write the failing test** (mirror the `groupFindingsByStatus` test style; use `createHypothesis` factory):

```typescript
describe('groupHypothesesByStatus (PO-5 — the shared status→bucket mapping)', () => {
  it('partitions all 5 HypothesisStatus values exhaustively', () => {
    const statuses: HypothesisStatus[] = [
      'proposed',
      'evidenced',
      'evidence-survived-test',
      'refuted',
      'needs-disconfirmation',
    ];
    const hubs = statuses.map((status, i) =>
      createHypothesis({ id: `h-${i}`, name: `H${i}`, status })
    );
    const groups = groupHypothesesByStatus(hubs);
    expect(groups['proposed'].map(h => h.id)).toEqual(['h-0']);
    expect(groups['evidenced'].map(h => h.id)).toEqual(['h-1']);
    expect(groups['evidence-survived-test'].map(h => h.id)).toEqual(['h-2']);
    expect(groups['refuted'].map(h => h.id)).toEqual(['h-3']);
    expect(groups['needs-disconfirmation'].map(h => h.id)).toEqual(['h-4']);
    // Every hub lands in exactly one bucket (partition property).
    const total = statuses.reduce((n, s) => n + groups[s].length, 0);
    expect(total).toBe(hubs.length);
  });

  it('reads the STORED analyst-owned status, never a derivation (CS-10 guard)', () => {
    // A hub whose linked-finding evidence might suggest otherwise still buckets
    // by its stored status — the categorizer must not route through
    // deriveHypothesisStatus.
    const hub = createHypothesis({
      id: 'h-stored',
      name: 'Stored wins',
      status: 'proposed',
      findingIds: ['f-1', 'f-2', 'f-3'],
    });
    expect(groupHypothesesByStatus([hub])['proposed'].map(h => h.id)).toEqual(['h-stored']);
  });
});
```

(If `createHypothesis` doesn't accept these fields directly, build via the factory + spread override — check `packages/core/src/findings/factories.ts` for the real signature first.)

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter @variscout/core test -- helpers` → FAIL (`groupHypothesesByStatus` not exported).
- [ ] **Step 3: Implement** in `helpers.ts` (below `groupFindingsByStatus`; add `HypothesisStatus` to the type import):

```typescript
/**
 * Group hypotheses by their analyst-owned STORED status (PO-5 — the shared
 * status→bucket mapping; one judgment system).
 *
 * This is the single canonical status grouping: the Report engine keys its
 * section placement on it (evidence-survived-test/evidenced → narrative +
 * cause rows · refuted → tested-and-excluded · proposed/needs-disconfirmation
 * → open questions), and it replaced the two divergent app-level conclusion
 * categorizer memos (Azure 2-way / PWA 3-way — both were gate-only).
 *
 * Reads `hypothesis.status` (CS-10: analyst-owned) — NEVER routes through the
 * advisory `deriveHypothesisStatus` derivation.
 */
export function groupHypothesesByStatus(
  hypotheses: readonly Hypothesis[]
): Record<HypothesisStatus, Hypothesis[]> {
  const groups: Record<HypothesisStatus, Hypothesis[]> = {
    proposed: [],
    evidenced: [],
    'evidence-survived-test': [],
    refuted: [],
    'needs-disconfirmation': [],
  };
  for (const hypothesis of hypotheses) {
    groups[hypothesis.status].push(hypothesis);
  }
  return groups;
}
```

- [ ] **Step 4: Verify** — `pnpm --filter @variscout/core test -- helpers && pnpm --filter @variscout/core exec tsc --noEmit` → green. (`findings/index.ts` already `export * from './helpers'` — no barrel edit.)
- [ ] **Step 5: Commit** — `feat(po-5): groupHypothesesByStatus — the shared analyst-owned status mapping (core)`

### Commit 2: Core — Report engine re-source (status composes the Report)

**Files:** Modify `packages/core/src/report/ipReport.ts` · `packages/core/src/report/__tests__/ipReport.test.ts`.

- [ ] **Step 1:** `ipReport.ts` — import the categorizer: `import { groupHypothesesByStatus } from '../findings/helpers';`. DELETE `linkedHypothesisIds` (the whole function). REPLACE `linkedFindingIds` with `reportFindingIds` (the lineage seed line dies; the structural unions survive):

```typescript
/** Findings enter the Report via their hypothesis linkage + goal mechanism links (PO-5). */
function reportFindingIds(ip: ImprovementProject, hypotheses: readonly Hypothesis[]): Set<string> {
  const ids = new Set<string>();
  for (const goal of ip.goal.mechanismGoals ?? []) {
    for (const id of goal.linkedFindingIds ?? []) ids.add(id);
  }
  for (const hypothesis of hypotheses) {
    for (const id of hypothesis.findingIds) ids.add(id);
    for (const id of hypothesis.counterFindingIds ?? []) ids.add(id);
  }
  return ids;
}
```

- [ ] **Step 2:** Rewrite `selectIPReportScope` (the `unique` helper + `selectControlRecord`/`selectControlHandoff` calls stay byte-identical):

```typescript
export function selectIPReportScope(input: IPReportScopeInput): IPReportScope {
  // PO-5: the Report composes from analyst-owned status (CS-10), not lineage
  // membership. Under Project⟷Hub 1:1 (IM-0a) the document boundary IS the
  // project boundary — every live hypothesis has a Report destination
  // (narrative / tested-and-excluded / open questions per its status).
  const hypotheses = [...input.hypotheses];
  const findingIds = reportFindingIds(input.ip, hypotheses);
  const findings = input.findings.filter(finding => findingIds.has(finding.id));
  const controlRecord = selectControlRecord(input.ip, input.controlRecords);
  const controlHandoff = selectControlHandoff(input.ip, input.controlHandoffs, controlRecord);

  return { hypotheses, findings, controlRecord, controlHandoff };
}
```

- [ ] **Step 3:** Rewrite `deriveIPCauseRows` — cause rows = the narrative statuses; the `.map()` body stays byte-identical:

```typescript
export function deriveIPCauseRows(input: {
  ip: ImprovementProject;
  hypotheses: readonly Hypothesis[];
  findings: readonly Finding[];
  controlRecord?: ControlRecord;
}): IPCauseRow[] {
  // PO-5: cause rows key on analyst-owned status — evidence that survived
  // testing plus evidenced mechanisms. Refuted → tested-and-excluded;
  // proposed/needs-disconfirmation → open questions (deriveIPReportNarrative).
  const groups = groupHypothesesByStatus(input.hypotheses);
  const causeHypotheses = [...groups['evidence-survived-test'], ...groups['evidenced']];
  return causeHypotheses.map(hypothesis => {
    /* ...the EXISTING map body, unchanged (causeFindings/actions/miniChartType)... */
  });
}
```

- [ ] **Step 4:** Extend `deriveIPReportNarrative` — `refuted` derivation re-points to the categorizer; 'What's next' gains open questions (everything else byte-identical):

```typescript
  const causeRows = deriveIPCauseRows(input);
  const groups = groupHypothesesByStatus(input.hypotheses);
  const refuted = groups['refuted'];
  const openQuestions = [...groups['proposed'], ...groups['needs-disconfirmation']];
```

and in the `"What's next"` section:

```typescript
    {
      title: "What's next",
      items: [
        ...inProgress.map(row => `${row.title}: ${row.actionProgressLabel}`),
        ...openQuestions.map(hypothesis => `Open question: ${hypothesis.name}`),
        ...(inProgress.length === 0 && openQuestions.length === 0
          ? ['Continue cadence review and watch for new Survey hints.']
          : []),
      ],
    },
```

- [ ] **Step 5: `ipReport.test.ts` rewrite.** Strip `investigationLineage` from the fixture (`:35`); DELETE the `'PR-CS-6 Edge 2'` union describe (`:170-191` — it pins the reversed gesture). Re-anchor the scope test on STATUS (the right-reason guard — it previously passed via lineage AND back-ref): the fixture hypothesis `hyp-1` keeps `status: 'evidence-survived-test'`; assert it is in scope WITHOUT any factorControl link by adding a sibling fixture. ADD the load-bearing negative controls (spec §13, `feedback_load_bearing_tests`):

```typescript
describe('Report composes from analyst-owned status (PO-5)', () => {
  const mkHyp = (id: string, status: HypothesisStatus) =>
    createHypothesis({ id, name: `name-${id}`, status, synthesis: `syn-${id}` });

  it('a hypothesis with Report-relevant status but NO goal back-ref appears in scope', () => {
    const scope = selectIPReportScope({
      ip: ipWithoutFactorControls, // fixture: goal.factorControls = []
      hypotheses: [mkHyp('hyp-status-only', 'evidence-survived-test')],
      findings: [],
    });
    expect(scope.hypotheses.map(h => h.id)).toContain('hyp-status-only');
  });

  it('NEGATIVE: a refuted hypothesis is NOT a cause row and NOT in the narrative items', () => {
    const rows = deriveIPCauseRows({ ip, hypotheses: [mkHyp('hyp-ref', 'refuted')], findings: [] });
    expect(rows).toHaveLength(0);
    const sections = deriveIPReportNarrative({ ip, hypotheses: [mkHyp('hyp-ref', 'refuted')], findings: [] });
    const found = sections.find(s => s.title === 'What we found + what we did')!;
    expect(found.items.join(' ')).not.toContain('name-hyp-ref');
    const learned = sections.find(s => s.title === 'What we standardized + learned')!;
    expect(learned.items).toContain('Ruled out: name-hyp-ref');
  });

  it('NEGATIVE: a proposed hypothesis is NOT in tested-and-excluded; it is an open question', () => {
    const sections = deriveIPReportNarrative({ ip, hypotheses: [mkHyp('hyp-open', 'proposed')], findings: [] });
    const learned = sections.find(s => s.title === 'What we standardized + learned')!;
    expect(learned.items.join(' ')).not.toContain('Ruled out: name-hyp-open');
    const next = sections.find(s => s.title === "What's next")!;
    expect(next.items).toContain('Open question: name-hyp-open');
  });

  it('cause rows include evidenced + evidence-survived-test, nothing else', () => {
    const rows = deriveIPCauseRows({
      ip,
      hypotheses: [
        mkHyp('a', 'evidence-survived-test'),
        mkHyp('b', 'evidenced'),
        mkHyp('c', 'proposed'),
        mkHyp('d', 'refuted'),
        mkHyp('e', 'needs-disconfirmation'),
      ],
      findings: [],
    });
    expect(rows.map(r => r.hypothesisId).sort()).toEqual(['a', 'b']);
  });
});
```

(Adapt fixture names to the file's existing builders; the existing `selectIPReportScope`/`deriveIPCauseRows`/`deriveIPReportNarrative` describes update their expectations to the new semantics — scope now returns ALL hypotheses.)

- [ ] **Step 6: Verify:** `pnpm --filter @variscout/core test -- ipReport helpers && pnpm --filter @variscout/core exec tsc --noEmit` → green. Confirm `selectControlRecord`/`selectControlHandoff`/`goalItems` diff-clean (`git diff packages/core/src/report/ipReport.ts` shows no hunks in them).
- [ ] **Step 7: Commit** — `feat(po-5): Report composes from analyst-owned status — selectIPReportScope/deriveIPCauseRows/narrative re-source; lineage seeds out; negative controls`

### Commit 3: Apps — the activeIPLineage consumer sweep (Wall permanence + pin handlers + Azure Report re-source)

**Files:** Modify `apps/azure/src/pages/Editor.tsx` · `apps/azure/src/components/editor/AnalyzeWorkspace.tsx` · `apps/azure/src/components/views/ReportView.tsx` · `apps/pwa/src/App.tsx` · `apps/pwa/src/components/views/AnalyzeView.tsx` + tests (`AnalyzeWorkspace.emptyLineage.seam.test.tsx`, pwa `AnalyzeView.emptyLineage.seam.test.tsx`, `ReportView.evidenceMap.test.tsx`, any AnalyzeWorkspace/AnalyzeView test passing the dead props).

- [ ] **Step 1: `Editor.tsx` (azure, locate by symbol):** DELETE `handleToggleProjectLineage` (the useCallback + its `IMPROVEMENT_PROJECT_UPDATE` lineage dispatch) + the `onToggleProjectLineage={...}` wire (`:1998`) + the `activeIPLineage` memo (`:557-560`) + `activeIPLineageFindingIds` (`:561-564`) + the `activeIPLineage` prop passes to AnalyzeWorkspace (`:2114`) and ReportView (`:1990`). REWRITE `scopedFindings` → pass-through (the permanent semantics; delete the memo and use `findingsState` directly where `scopedFindingsState` wrapped it — locate `scopedFindingsState` and collapse the pair). Import trims: drop `deriveActiveIPLineageIds` from the grouped ActiveIP import (`:48` — KEEP `deriveActiveIPScopeLabels` + `deriveActiveIPCanvasFocus`); drop the `toggleLineageFinding` import (`:87`). Refresh the IM-1 comment block (`:565-567`) that references the removed memos.
- [ ] **Step 2: `App.tsx` (pwa, mirror):** DELETE `handleToggleProjectLineage` (`:902-909`, incl. the PR-CS-6 doc comment `:898-901`) + the wire (`:1440-1441`) + `activeIPLineage` memo (`:835-838`) + `activeIPLineageFindingIds` (`:839-842`) + the `activeIPLineage` prop pass to AnalyzeView (`:1429`). REWRITE `scopedFindings`/`scopedFindingsState` → pass-through (mirror Step 1). Import trims: drop `deriveActiveIPLineageIds` (`:27`), `toggleLineageFinding` (`:71`). **Do NOT touch `onPinFinding={handlePinFinding}` (`:1561`) — keep-guard 4.**
- [ ] **Step 3: `AnalyzeWorkspace.tsx` (azure):** DELETE from its props interface: `activeIPLineage` (`:102,:180`) + `onToggleProjectLineage` (`:128,:188`). DELETE the `scopedHubIds`/`scopedFindingIds` memos (`:591-598`). COLLAPSE `scopedHubs` → `hubs` and `scopedWallFindings` → `findingsState.findings` (delete both memos `:752-763` + the interim comment block `:748-751`; re-point every consumer — WallCanvas mounts `:786,:1325,:1353,:1365`, `detectEvidenceClusters` `:828`, miniChart `:1380`, the AnalyzeConclusion mount `:1181` + `findings={scopedWallFindings}` `:1191`). DELETE the categorizer memo (`:856-864`) + its comment block (`:840-855`) — replace the gate (`:1171`) and `hasConclusions` (`:1175`) with `hubs.length > 0` (the buckets partition hubs; gate-only ceremony — grounded decision). DELETE the `onToggleProjectLineage`/`projectLineageFindingIds` pass-downs to FindingsLog (`:1422-1423`).
- [ ] **Step 4: `AnalyzeView.tsx` (pwa, mirror):** DELETE props `activeIPLineage` (`:79,:115`) + `onToggleProjectLineage` (`:99,:123`). DELETE `scopedHubIds`/`scopedFindingIds` (`:173-180`) + the interim comment (`:181-184`). COLLAPSE `scopedWallHubs` → `hubs`, `scopedWallFindings` → `wallFindings` (delete the memos `:185-195`; re-point WallCanvas mounts `:287,:748,:786,:810` + the AnalyzeConclusion mount + `findings=`). DELETE the categorizer memo (`:559-569`) — gate (`:594`) becomes `hubs.length > 0`. DELETE the FindingsLog pass-downs (`:826-827`).
- [ ] **Step 5: `ReportView.tsx` (azure) — adopt the PWA composition:** DELETE the `activeIPLineage` prop (decl `:82`, destructure `:141`) + the `ActiveIPLineageIds` import (`:39`) + `scopedFindingIds` (`:171-174`) + `scopedHypothesisIds` (`:175-178`) + the `reportHypotheses` lineage filter (`:179-185`) + the `reportFindings` pin-union + its PR-CS-6 comment (`:186-198`). MOVE the `activeIP` + `ipReportScope` memos ABOVE the replacements, then:

```typescript
  // PO-5: one composition path — the core engine (status-keyed) is the
  // canonical Report scope; mirrors the PWA ReportView exactly.
  const reportFindings = activeIP && ipReportScope ? ipReportScope.findings : findings;
  const reportHypotheses = activeIP && ipReportScope ? ipReportScope.hypotheses : hypotheses;
```

(All downstream consumers — Evidence Map, timeline, `bestProjectedCpk`, improvement-plan, summary findings — keep reading `reportHypotheses`/`reportFindings` unchanged. This is where the Report-collapse defect dies: hypotheses render under active IP.)

- [ ] **Step 6: Seam tests re-cast (fail-for-the-right-reason set).** Azure `AnalyzeWorkspace.emptyLineage.seam.test.tsx`: DELETE tests 1b (`:314`, non-empty hypothesisIds filters) + 2b (`:347`, non-empty findingIds filters); KEEP 1a/2a/control re-titled as the permanent semantics (e.g. `'active IP scope shows the whole document on the Wall (PO-5 permanent semantics)'`); remove the `activeIPLineage` prop + `ActiveIPLineageIds` import from the fixtures; update the file header comment (it references the interim). OPTIONAL rename: `AnalyzeWorkspace.activeIPWall.test.tsx`. PWA `AnalyzeView.emptyLineage.seam.test.tsx`: same — DELETE 1b (`:174`); keep 1a/control re-titled. `ReportView.evidenceMap.test.tsx`: drop any `activeIPLineage` prop from fixtures; if it asserts hypothesis presence under active IP it now passes for the status reason — verify the assertion survives.
- [ ] **Step 7: Verify:** `pnpm --filter @variscout/azure-app test -- AnalyzeWorkspace ReportView Editor && pnpm --filter @variscout/pwa test -- AnalyzeView App && pnpm --filter @variscout/azure-app exec tsc --noEmit && pnpm --filter @variscout/pwa exec tsc --noEmit` → green.
- [ ] **Step 8: Commit** — `feat(po-5): apps shed the activeIPLineage surface — Wall whole-document permanence, pin handlers out, Azure Report adopts the engine composition, conclusion gates simplify`

### Commit 4: packages/ui — pin chain + the lineage bridge

**Files:** Modify `packages/ui/src/components/FindingsLog/FindingCard.tsx` · `FindingsLog.tsx` · `FindingBoardView.tsx` · `packages/ui/src/components/FindingsPanel/FindingsPanelBase.tsx` · `packages/ui/src/components/ActiveIP/activeIPScope.ts` · `ActiveIP/index.ts` + tests (`ActiveIP/__tests__/activeIPScope.test.ts`, FindingsLog/FindingCard tests).

- [ ] **Step 1: `FindingCard.tsx`** — DELETE the pin button block (`:335-361`, the `Link2`/`Link2Off` toggle, `data-testid='toggle-lineage-btn'`) + props `onToggleProjectLineage` (`:94`) + `isInProjectLineage` (`:96`) + their destructures (`:183-184`) + the props' doc comments (`:91-96`). Drop `Link2`/`Link2Off` from the lucide import if now-unused.
- [ ] **Step 2: `FindingsLog.tsx`** — DELETE props `onToggleProjectLineage` (`:70`) + `projectLineageFindingIds` (`:72`) + destructures (`:140-141`) + forwards (`:199-200`) + the `isInProjectLineage={projectLineageFindingIds?.has(finding.id)}` computation (`:246-247`).
- [ ] **Step 3: `FindingBoardView.tsx`** (`:49-50,:94-95,:185-186`) + **`FindingsPanelBase.tsx`** (`:74,:76,:156-157,:362-363`) — same two-prop deletion + forwards.
- [ ] **Step 4: `activeIPScope.ts`** — DELETE `deriveActiveIPLineageIds` (`:69-74`) + the `ActiveIPLineageIds` interface (`:16-19`). `ActiveIP/index.ts`: DELETE the `deriveActiveIPLineageIds` (`:12`) + `type ActiveIPLineageIds` (`:15`) lines — KEEP `deriveActiveIPCanvasFocus` (`:11`) + `deriveActiveIPScopeLabels` (`:13`) + `type ActiveIPScopeLabels` (`:14`).
- [ ] **Step 5: Tests.** `activeIPScope.test.ts`: DELETE the `'returns lineage ids for tab scoping'` it (`:102-107`) + the `deriveActiveIPLineageIds` import (`:6`) — the scope-labels + canvas-focus describes stay (keep-guard 3). FindingCard/FindingsLog tests: strip the dead props from fixtures; ADD the negative control:

```typescript
it('renders no lineage pin button; sibling actions survive (PO-5)', () => {
  render(<FindingCard finding={finding} onAssign={vi.fn()} /* existing fixture props */ />);
  expect(screen.queryByTestId('toggle-lineage-btn')).not.toBeInTheDocument();
  // Sibling survival control — the action row itself still renders.
  expect(screen.getByTestId('finding-card')).toBeInTheDocument();
});
```

(Adapt the sibling assertion to the file's real testids — locate by what the existing tests assert.)

- [ ] **Step 6: Verify:** `pnpm --filter @variscout/ui test -- FindingCard FindingsLog FindingBoardView FindingsPanelBase activeIPScope && pnpm --filter @variscout/ui exec tsc --noEmit` → green. Grep guard: `grep -rIn 'onToggleProjectLineage\|isInProjectLineage\|projectLineageFindingIds\|ActiveIPLineageIds\|deriveActiveIPLineageIds' --exclude-dir=dist --include='*.ts' --include='*.tsx' packages apps` → zero.
- [ ] **Step 7: Commit** — `feat(po-5): retire the CS-6 pin chain (FindingCard button + prop plumbing) + the deriveActiveIPLineageIds bridge`

### Commit 5: Writers, merges + UI reads shed (type still standing)

**Files:** Modify `packages/core/src/improvementProject/factories.ts` · `predicates.ts` · `improvementProject/index.ts` · `packages/hooks/src/useImprovementProjectPanelModel.ts` · `packages/hooks/src/useLiveProjection.ts` · `apps/azure/src/persistence/applyAction.ts` · `apps/pwa/src/persistence/applyAction.ts` · `apps/azure/src/components/ProjectsTabView.tsx` · `apps/pwa/src/components/ProjectsTabView.tsx` · `packages/ui/src/components/IPDetail/activityEvents.ts` · `stages/CharterOverview.tsx` · `stages/ApproachOverview.tsx` · `stages/CharterSections.tsx` + tests (`predicates.test.ts`, `activityEvents.test.ts`, `CharterOverview.test.tsx`, `useImprovementProjectPanelModel.test.tsx`, both apps' `applyAction.improvementProject.test.ts` + `ProjectsTabView.test.tsx`).

- [ ] **Step 1: Writers + seeds.** `factories.ts`: DELETE the `investigationLineage: {}` seed line (`:83`). `predicates.ts`: DELETE `toggleLineageFinding` (`:17-46` incl. its PR-CS-6 doc block) — `isCollaborative` stays. `improvementProject/index.ts:23`: `export { isCollaborative, toggleLineageFinding } from './predicates'` → `export { isCollaborative } from './predicates'`. `useImprovementProjectPanelModel.ts`: DELETE the seed (`:92`) + the merge branch (`:120-123`) — `handleLineageNavigate` + the `section: 'lineage'` uiState stay (keep-guard 9).
- [ ] **Step 2: Merges.** Azure `applyAction.ts`: DELETE the `investigationLineage` key from the sections merge (`:291-294`; `background`/`approach`/`outcomeReference` stay). PWA `applyAction.ts` (`:549-552`), azure `ProjectsTabView.tsx` (`:87-90`), pwa `ProjectsTabView.tsx` (`:61-64`): same deletion.
- [ ] **Step 3: `activityEvents.ts`** — REMOVE `'hypothesis-linked'` from `IPActivityEventKind` (`:8`); REMOVE the `['investigationLineage', 'Investigation lineage']` tuple from `sectionEvents` (`:89`); DELETE the hypothesis-linked emit block (`:106-117`, `lineageUpdatedAt`/`hypothesisCount`).
- [ ] **Step 4: Stage overviews (minimal-honest interim — owner call).** `CharterOverview.tsx`: DELETE `hypoCount` (`:47`) + `findingCount` (`:48`); the Investigation KPI body (`:106-108`) becomes `Hypotheses + findings live on the Wall`; the continue button label (`:124`) `Investigation · {hypoCount} hypotheses` → `Investigation`. `ApproachOverview.tsx`: the Wall button label (`:96`) `Wall · {…hypothesisIds?.length ?? 0} hypotheses` → `Wall`. Nothing else changes (buttons, navigation, testids stay).
- [ ] **Step 5: Comment-only touches (tsc-invisible — do them by hand).** `CharterSections.tsx:9`: drop the investigationLineage mention from the doc comment. `useLiveProjection.ts:5`: re-point the JSDoc example to `sections.approach.actionItemIds[]`-style surviving FK arrays (the hook itself untouched — keep-guard 9).
- [ ] **Step 6: Tests.** `predicates.test.ts`: DELETE the `'toggleLineageFinding (PR-CS-6 Edge 2)'` describe (`:56-93`); `isCollaborative` tests stay. `activityEvents.test.ts`: drop the hypothesis-linked + lineage-section assertions. `CharterOverview.test.tsx`: re-anchor the Investigation-KPI assertion to the new static line; drop lineage fixtures (`:39`). `useImprovementProjectPanelModel.test.tsx`: drop seed/merge lineage assertions (`:53,:242`). Both `applyAction.improvementProject.test.ts`: in the `'other sub-sections must not be dropped'` test, DELETE the `expect(row?.sections.investigationLineage).toBeDefined()` line (azure `:205` / pwa `:197`) — the approach/outcomeReference sibling assertions stay (the guard's premise shrinks 4→3 sections). Both `ProjectsTabView.test.tsx`: strip lineage from merge fixtures.
- [ ] **Step 7: Verify:** `pnpm --filter @variscout/core test -- predicates factories && pnpm --filter @variscout/hooks test -- useImprovementProjectPanelModel && pnpm --filter @variscout/ui test -- activityEvents CharterOverview ApproachOverview && pnpm --filter @variscout/azure-app test -- applyAction ProjectsTabView && pnpm --filter @variscout/pwa test -- applyAction ProjectsTabView` → green.
- [ ] **Step 8: Commit** — `feat(po-5): shed lineage writers, merges + UI reads — toggleLineageFinding out, applyAction/ProjectsTabView/panel-model merges trimmed, activity events + stage-overview counts honest`

### Commit 6: Core — the type deletion + fixture sweep (zero references)

**Files:** Modify `packages/core/src/improvementProject/types.ts` · `improvementProject/index.ts` + the residual test-fixture files (the remaining `investigationLineage: {}` boilerplate across ~40 test files — tsc-surfaced).

- [ ] **Step 1:** `types.ts` — DELETE the `ImprovementProjectInvestigationLineageSection` interface (`:98-103`) + the `investigationLineage:` member of `ImprovementProject['sections']` (`:133`). `improvementProject/index.ts`: remove `ImprovementProjectInvestigationLineageSection` from the type re-export (`:10`).
- [ ] **Step 2: The fixture sweep.** Run `pnpm --filter @variscout/core exec tsc --noEmit` then each package/app tsc in turn; every error is a fixture literal carrying `investigationLineage: {}` (or a typed read missed earlier — if a LIVE read surfaces, BLOCKED per conventions). Strip the property from every fixture. Known members beyond the obvious: `factories.test.ts` clone-identity line (`:140` — delete the lineage expect, keep background/approach/outcomeReference siblings) · `exhaustiveness.test.ts` HubAction fixture (`:219` — fixture only; the action switch doesn't branch on lineage) · `documentSnapshot.test.ts` fixture · azure `schema.v6.test.ts` fixture · `miniChart.test.ts:115` · `causeProjection.test.ts:27` · `IPDetailTeamRail.test.tsx:36` · `types.test.ts`.
- [ ] **Step 3: The acceptance greps (implementer-level; validator re-runs):**

```bash
grep -rIn 'investigationLineage' --include='*.ts' --include='*.tsx' --exclude-dir=dist packages apps scripts .claude | wc -l   # → 0
grep -rIn 'toggleLineageFinding\|ActiveIPLineageIds\|deriveActiveIPLineageIds\|onToggleProjectLineage\|isInProjectLineage\|projectLineageFindingIds' --exclude-dir=dist --include='*.ts' --include='*.tsx' packages apps   # → zero
grep -rIn "hypothesis-linked" --exclude-dir=dist --include='*.ts' --include='*.tsx' packages apps   # → zero
grep -rIni 'PR-CS-6 Edge 2\|project lineage\|investigation lineage' --exclude-dir=dist --include='*.ts' --include='*.tsx' packages apps   # → zero (stale-comment sweep)
```

- [ ] **Step 4: Verify:** `pnpm --filter @variscout/core test && pnpm --filter @variscout/hooks test && pnpm --filter @variscout/ui test && pnpm build` → green (full package suites; the build proves the cascade compiles end-to-end incl. app test files via app tsc).
- [ ] **Step 5: Commit** — `feat(po-5): delete ImprovementProjectInvestigationLineageSection — investigationLineage ceases to exist; fixture sweep to zero references`

### Commit 7: Docs — supersession notes + log graduations (land WITH the PR)

**Files:** Modify `docs/superpowers/specs/2026-06-02-connective-surface-model-design.md` · `docs/superpowers/plans/2026-06-02-connective-surface-model-master-plan.md` · `docs/decision-log.md` · `docs/ephemeral/investigations.md`.

- [ ] **Step 1: Connective spec §4.6** (heading `:330`): add under the heading a supersession banner that ALSO corrects the doubly-stale bullet (`:335` claims findingIds "is never populated by any UI gesture — wire the lineage write"; CS-6/PR #287 DID wire it; PO-5 reverses it):

```markdown
> **Superseded by PO-5 (2026-06-05).** The Edge-2 lineage write below WAS wired
> (CS-6 / PR #287: the FindingCard pin gesture populating
> `IP.sections.investigationLineage.findingIds`) and is **deliberately
> REVERSED by PO-5**: `sections.investigationLineage` is deleted; analyst-owned
> CS-10 `HypothesisStatus` replaces membership lineage as the Report curation
> system (the process-ops extraction spec §4.1–4.2). The bullet below predates
> the CS-6 delivery and reads as if the wire was never built — both states are
> historical now.
```

- [ ] **Step 2: Connective master plan PR-CS-6 row** (`:100-107`): append a delivery + reversal note (the row never got its DELIVERED flip — fix both at once):

```markdown
- **DELIVERED 2026-06-02 via PR #287** (Edges 1/2/4 — see decision-log). **Edge-2 REVERSED by PO-5 (2026-06-05)**: the `investigationLineage.findingIds` pin wire is deleted; analyst-owned CS-10 status replaces membership lineage as the Report curation system (process-ops spec §4.1; recorded design reversal, decision-log entry cites PR #287).
```

- [ ] **Step 3: decision-log.md.** (a) NEW Replayed-Decision entry at the TOP of §1 (house format, mirroring the PO-4 entries): `**2026-06-05 — PO-5 — investigationLineage retired; the Report composes from analyst-owned HypothesisStatus.**` Body: the two halves distinguished honestly (`hypothesisIds` zero-writers defect → fixed by deletion; `findingIds` = the CS-6/PR #287 Edge-2 pin wire → deliberately reversed; rationale: one judgment system, status is the curation surface); the Wall's empty-set-means-unfiltered interim (PR #296) is now the permanent semantics; the shared `groupHypothesesByStatus` core mapping replaced the two gate-only app categorizer memos (the parity item resolves by deletion); trade-off recorded per spec §4.2 (an independent Report-curation gesture is removed; escape hatch = a per-finding Report-view boolean; revive trigger = user demand); closes the lineage-under-wired defect. Trailing citation: `` `code`: `feat/po-5-lineage-retirement`; spec: [process-ops extraction §4.1–4.2]; sub-plan: [2026-06-05-po-5-lineage-retirement.md] ``. (b) **Amend the 2026-05-15 PR-PT-7 entry** (`:143` — "Empty lineage is intentionally empty scoped state…"): append `*(Superseded 2026-06-05 by PO-5: `investigationLineage` deleted; active-IP surfaces show the whole document — empty-set-means-unfiltered is the permanent semantics.)*`
- [ ] **Step 4: investigations.md** (the real file is `docs/ephemeral/investigations.md`): (a) categorizer-parity entry (`:303`) title gains `[PROMOTED 2026-06-05 → PO-5]` + a closing line (resolved by deletion: both memos were gate-only; `groupHypothesesByStatus` in core is the one mapping). (b) `investigationLineage is under-wired` (`:71`) title gains `[RESOLVED 2026-06-05 → PO-5]` (resolved by deletion). (c) `Created hubs don't register into active-IP lineage` (`:91`) title gains `[RESOLVED 2026-06-05 → PO-5]`. (d) NEW entry: **"Project-tab stage overviews need their own design pass"** — CharterOverview/ApproachOverview accumulated drift: the lineage counts died with PO-5 (interim: static Wall pointer, no counts); "Continue in Investigation" is stale post-WV1 vocabulary (the tab is Analyze; the Wall is the brand); the orientation-vs-dashboard role question + the status-shaped-chips candidate (echoing ProjectStatusCard's dot·count·label pattern, fed by `groupHypothesesByStatus`) belong to a dedicated brainstorm. Note the pre-existing duplicate `data-testid="charter-continue-analyze"` on both CharterOverview buttons.
- [ ] **Step 5: Verify:** `pnpm docs:check` (or the repo's doc-gate equivalent in `pr-ready-check`) → green.
- [ ] **Step 6: Commit** — `docs(po-5): supersession notes (connective §4.6 + CS-6 row reversed, PR-PT-7 amendment) + log graduations + the stage-overview design-session entry`

---

## Controller-level acceptance (Validator phase)

`bash scripts/pr-ready-check.sh` green + **ALL FIVE suites** (`core`, `hooks`, `ui`, `azure-app`, `pwa` — builds alone are NOT the gate, CS-12 lesson) · the Commit-6 acceptance greps ZERO (incl. the prop-chain grep — tsc cannot surface the optional pin props) · the Report negative controls green (refuted NOT in narrative/cause rows; proposed NOT in tested-and-excluded; status-only hypothesis IN scope) · Control-join sentinels diff-clean (`selectControlRecord`/`selectControlHandoff` untouched; `useControlPanelModel` + control tests green) · i18n untouched (`git diff --stat` shows zero `i18n/` files) · keep-guard spot-greps: `isCollaborative` exported, `deriveActiveIPScopeLabels`/`deriveActiveIPCanvasFocus` live with callers, `btn-pin-finding`/`analyze.pinAsFinding` untouched, `useLiveProjection` exported · `--chrome` verify: Wall under active IP shows the whole document (visually unchanged vs main); Azure Report under active IP renders hypotheses (the collapse defect gone — Evidence Map + improvement-plan populated); FindingCard shows NO pin button; AnalyzeConclusion renders in both apps with hubs present; CharterOverview Investigation KPI shows the static Wall line (no dead counts) · final adversarial Opus branch review (non-negotiable — caught cross-task seams on PO-1…PO-4) · merge `gh pr merge --merge --delete-branch`; DELIVERED flips (master-plan PO-5 row + this sub-plan's `status: delivered`) ride a follow-up commit on main.
