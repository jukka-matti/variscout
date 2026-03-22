---
title: Systematic Code Review — VariScout Lite
date: 2026-03-16
type: code-review
status: complete
---

# Systematic Code Review — VariScout Lite

**Date:** 2026-03-16
**Scope:** Full codebase — 6 packages, 3 apps, ~2,188 tests
**Method:** Three-pass review (architecture scan, targeted deep dives, synthesis)

---

## Executive Summary

The VariScout Lite codebase is **architecturally sound** with excellent package boundary discipline, zero circular dependencies, clean barrel exports, and strict TypeScript usage. The rapid Phase 1-3 delivery and 12-phase component extraction were executed well.

However, the review surfaces **1 critical security finding**, **several high-priority issues** across security, resilience, and code quality, and **significant duplication** in chart wrapper components (~7K LoC duplicated between PWA and Azure). The refactoring plan at the end provides concrete work packages.

---

## Health Scorecard

| Area                            | Score | Summary                                                                                                                   |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| **Architecture and Boundaries** | A     | Zero import violations, clean dependency graph, excellent barrel files                                                    |
| **Security Posture**            | B-    | 1 critical (CORS wildcard on OBO function), 3 high (unvalidated URLs, thumbnails, file size), strong XSS protection       |
| **Code Quality**                | B+    | Near-zero `any` usage, good memoization patterns, but stale closure bug in Azure DataContext and large orchestrator files |
| **Test Quality and Coverage**   | B     | Strong stats/parser coverage, but critical gaps in conflict resolution, runtimeConfig, AI service paths, and OBO exchange |
| **Developer Experience**        | A-    | Excellent naming, organization, documentation; gaps in colorScheme pattern docs and wrapper naming conventions            |

---

## Prioritized Findings

### Critical (Must Fix)

#### CRIT-1: OBO Token Exchange Function — CORS Defaults to Wildcard

- **Category:** Security
- **Files:** `infra/functions/token-exchange/index.js:68-70,109-117` _(Note: `index-findings` function deprecated by ADR-026)_
- **Description:** `getCorsHeaders()` defaults to `ALLOWED_ORIGIN || '*'` when the env var is unset. The function-level auth key guard is also optional (`if (functionKey && ...)`). A deployment without both `ALLOWED_ORIGIN` and `FUNCTION_KEY` configured exposes the OBO token exchange endpoint to any browser origin.
- **Impact:** Any page on any domain can POST to the function endpoint. Probing attacks (replaying intercepted tokens) become possible without the origin barrier.
- **Fix:** Make `ALLOWED_ORIGIN` required (throw on startup if missing). Document `FUNCTION_KEY` as mandatory in production.

#### CRIT-2: Stale `state` Closure in Azure `saveProject`

- **Category:** Code Quality
- **File:** `apps/azure/src/context/DataContext.tsx:95-113`
- **Description:** `saveProject` captures `state` in its closure. Between the `await actions.saveProject(name)` call and the subsequent `saveToCloud`, internal setters update state — but the captured `state` reference is stale. Also, including `state` in the dep array causes the callback identity to change on every state mutation, defeating downstream `React.memo` optimizations.
- **Impact:** Data loss risk on rapid saves; unnecessary re-renders throughout Editor.
- **Fix:** Use a `stateRef` pattern to read current state at call time, remove `state` from the dep array.

#### CRIT-3: IndexedDB Write Failures Silently Swallowed

- **Category:** Resilience
- **File:** `apps/azure/src/services/storage.ts:580-690`
- **Description:** `saveToIndexedDB` failures propagate to `classifySyncError` which labels them as `'unknown'` retryable errors. `QuotaExceededError` triggers infinite retry loop. The retry queue itself is in IndexedDB, so if the DB is unavailable, `addToSyncQueue` also throws uncaught.
- **Impact:** User sees "offline, will retry" when storage is actually full. Data is lost silently.
- **Fix:** Catch `QuotaExceededError` specifically, surface actionable message, do not attempt cloud sync if local save failed.

#### CRIT-4: No Tests for 3-Way Merge Conflict Resolution

- **Category:** Tests
- **File:** `apps/azure/src/services/__tests__/storage.test.ts` (missing coverage for `storage.ts:614-640`)
- **Description:** The 3-way merge path — triggered when `syncState.baseStateJson` exists and cloud has changed — is entirely untested. This is the highest-risk code path in the Azure app.
- **Fix:** Add tests with mocked `db.syncState.get` returning `baseStateJson` and `getCloudModifiedDate` returning a newer timestamp. Cover clean merge, conflict copy, and null remote project.

---

### High Priority

#### HIGH-1: Runtime Config URL Fields Not Validated

- **Category:** Security
- **Files:** `apps/azure/src/lib/runtimeConfig.ts:28-35`, `apps/azure/src/auth/graphToken.ts:41`
- **Description:** `loadRuntimeConfig()` stores the `/config` JSON response without validating URL fields. `functionUrl` is used verbatim in fetch calls. A compromised config endpoint could exfiltrate Teams SSO tokens to an attacker's server.
- **Fix:** Validate all URL fields are HTTPS before caching.

#### HIGH-2: `thumbnailDataUrl` Rendered Without Protocol Validation

- **Category:** Security
- **File:** `packages/ui/src/components/FindingsLog/FindingComments.tsx:146`
- **Description:** `photo.thumbnailDataUrl` from cloud-loaded `.vrs` files is rendered as `<img src>` without validation. A malicious `.vrs` file in a shared OneDrive folder can set this to an arbitrary URL for tracking/exfiltration.
- **Fix:** Whitelist `data:image/(jpeg|png|webp|gif);base64,` prefix.

#### HIGH-3: No File Size Enforcement at Parser Entry Points

- **Category:** Security
- **Files:** `packages/core/src/parser/csv.ts:14`, `packages/core/src/parser/excel.ts:15`
- **Description:** Row limits (50K/100K) are enforced post-parse, but no byte-level size check exists. A multi-GB file crashes the browser tab.
- **Fix:** Add `MAX_CSV_BYTES = 50MB`, `MAX_EXCEL_BYTES = 25MB` guards before parsing.

#### HIGH-4: No Timeouts on AI API Calls

- **Category:** Resilience
- **File:** `apps/azure/src/services/aiService.ts:260,315,356,474`
- **Description:** `fetchNarration`, `fetchChartInsight`, `fetchCoScoutResponse`, and `fetchFindingsReport` have no `AbortSignal` timeout. A hung server leaves UI in permanent loading state.
- **Fix:** Apply `AbortSignal.timeout(30_000)` to all non-streaming fetches.

#### HIGH-5: Streaming Reader Not Released on Error

- **Category:** Resilience
- **File:** `apps/azure/src/services/aiService.ts:420-451`
- **Description:** If `onChunk` throws or `reader.read()` fails mid-stream, the `ReadableStream` stays locked. On retry, `getReader()` throws "ReadableStream is locked".
- **Fix:** Wrap reader usage in `try...finally { reader.releaseLock() }`.

#### HIGH-6: `errorService.notificationHandler` Never Wired Up

- **Category:** Resilience
- **Files:** `packages/ui/src/services/errorService.ts:106-134`
- **Description:** `showUserError()`, `showUserWarning()`, `showUserInfo()` are gated on `notificationHandler !== null`, but `setNotificationHandler` is never called in either app. All user-facing error calls are silently discarded in production.
- **Fix:** Wire `setNotificationHandler` in each app's root component.

#### HIGH-7: Chart Wrapper Duplication (~7,000 LoC)

- **Category:** Architecture
- **Files:** `apps/pwa/src/components/charts/` vs `apps/azure/src/components/charts/`
- **Description:** IChart, Boxplot, ParetoChart, CapabilityHistogram, ProbabilityPlot wrappers are 95-99% identical between PWA and Azure. Boxplot alone is 1,677/1,680 lines in each app.
- **Fix:** Extract shared wrapper logic to `@variscout/ui` or make Base components smarter.

#### HIGH-8: Dashboard Duplication (~2,100 LoC)

- **Category:** Architecture
- **Files:** `apps/pwa/src/components/Dashboard.tsx` (1,076), `apps/azure/src/components/Dashboard.tsx` (1,087)
- **Description:** 95% code overlap. Both manage 10+ UI states, deep prop drilling for findings, mobile/desktop branching.
- **Fix:** Extract shared dashboard logic into composable hooks; split into DashboardCharts, DashboardToolbar, DashboardMobile sub-components.

#### HIGH-9: Incomplete colorScheme Pattern Adoption

- **Category:** DX
- **Files:** 8 Base components without colorScheme: FindingsPanelBase, CoScoutPanelBase, FocusedChartViewBase, ManualEntryBase, ManualEntrySetupBase, DataTableBase, DataTableModalBase, SettingsPanelBase
- **Description:** 3 Base components use colorScheme, 8 do not. Inconsistent theming approach.
- **Fix:** Adopt colorScheme universally or document when to use it vs. when not to.

#### HIGH-10: `runtimeConfig.ts` Has Zero Tests

- **Category:** Tests
- **File:** `apps/azure/src/lib/runtimeConfig.ts`
- **Description:** Single source of truth for plan, AI endpoint, and AI Search endpoint across all Marketplace deployments — completely untested.
- **Fix:** Create test covering: successful load + cache hit, 404 fallback, network error fallback, `getRuntimeConfig()` before `loadRuntimeConfig()`.

#### HIGH-11: OBO Token Exchange Path Untested

- **Category:** Tests
- **File:** `apps/azure/src/auth/__tests__/graphToken.test.ts`
- **Description:** `VITE_FUNCTION_URL` is always empty in test env, so the Teams SSO OBO exchange path is never exercised. Most security-sensitive code path has no test coverage.
- **Fix:** Add tests with mocked `VITE_FUNCTION_URL` and `fetch` to exercise the OBO exchange, including error paths.

---

### Medium Priority

#### MED-1: Cloud-Loaded `.vrs` Data Not Schema-Validated

- **Category:** Security
- **File:** `apps/azure/src/services/storage.ts:354-368,727-738`
- **Description:** `loadFromCloud()` returns `response.json()` without shape validation. Malicious `.vrs` files in shared OneDrive folders can inject unexpected field types.
- **Fix:** Add minimal runtime shape guard before trusting cloud data.

#### MED-2: CSV Export Vulnerable to Formula Injection

- **Category:** Security
- **File:** `packages/core/src/export.ts:40-53`
- **Description:** `escapeCSVValue()` does not handle formula injection. Values starting with `=`, `+`, `-`, `@` are written as-is, interpreted as formulas in Excel.
- **Fix:** Prefix formula-injection characters with single quote.

#### MED-3: `contentEditable` Annotation Box Lacks Paste Normalization

- **Category:** Security
- **File:** `packages/ui/src/components/ChartAnnotationLayer/AnnotationBox.tsx:200-217`
- **Description:** No `onPaste` handler means rich HTML from clipboard enters the DOM. Currently safe (reads `textContent` on blur), but fragile if refactored.
- **Fix:** Add `onPaste` handler that inserts plain text only.

#### MED-4: OData Filter Injection in `searchDocuments`

- **Category:** Resilience
- **File:** `apps/azure/src/services/searchService.ts:73`
- **Description:** Factor name interpolated directly into OData filter. Names with single quotes (e.g., `O'Brien`) break the query. _(Note: `searchRelatedFindings` deprecated by ADR-026; same issue exists in `searchDocuments`.)_
- **Fix:** Escape single quotes by doubling them.

#### MED-5: Concurrent Sync Flush Race Condition

- **Category:** Resilience
- **File:** `apps/azure/src/services/storage.ts:809-898`
- **Description:** `handleOnline` and `processRetryQueue` can both attempt to upload the same project concurrently. Last-write-wins corrupts the merge base.
- **Fix:** Add `isSyncingRef` guard to both paths.

#### MED-6: `fetchFindingsReport` Has No Retry or Timeout

- **Category:** Resilience
- **File:** `apps/azure/src/services/aiService.ts:461-486`
- **Description:** Uses `max_tokens: 2000` (largest request) but has no retry and no AbortSignal — most likely to hit rate limits.
- **Fix:** Apply same retry pattern as `fetchNarration`.

#### MED-7: KDE Computation Runs in Chart Render Path

- **Category:** Performance
- **Files:** `packages/core/src/stats/kde.ts`, `packages/charts/src/Boxplot.tsx:130-139`
- **Description:** O(n x 100) KDE runs inside `useMemo` in BoxplotBase. If parent passes new array reference on every render, KDE recomputes for all groups. At 100K rows this freezes the UI.
- **Fix:** Pre-compute KDE in `useBoxplotData` or ensure reference-stable input arrays.

#### MED-8: Boxplot Stats Computed Twice

- **Category:** Performance
- **Files:** `packages/hooks/src/useBoxplotData.ts`, `packages/hooks/src/useDashboardComputedData.ts:93-111`
- **Description:** Both hooks compute boxplot statistics from the same filteredData using different methods (d3 vs `calculateBoxplotStats`).
- **Fix:** Unify: have `useDashboardComputedData` consume `useBoxplotData` output.

#### MED-9: `handleSave` Not Wrapped in `useCallback`

- **Category:** Code Quality
- **File:** `apps/azure/src/pages/Editor.tsx:731-742`
- **Description:** Recreated on every render, defeating React.memo on EditorToolbar.
- **Fix:** Wrap in `useCallback` with `[currentProjectName, saveProject]` deps.

#### MED-10: `any` Types in IndexedDB Schema

- **Category:** Code Quality
- **File:** `apps/azure/src/db/schema.ts:11,35`
- **Description:** `data: any` on `ProjectRecord` and `project: any` on `SyncItem` bypass type safety at the persistence boundary.
- **Fix:** Type to `SavedProject` from `@variscout/hooks`.

#### MED-11: `useDataState` Is a Mega-Hook (664 Lines, 80+ Properties)

- **Category:** Architecture
- **File:** `packages/hooks/src/useDataState.ts`
- **Description:** DataState interface has 80+ properties covering core data, selection, stages, filters, settings, project state, performance mode, findings, hypotheses. Creates tight coupling.
- **Fix:** Consider domain-driven split (AnalysisState, PersistenceState, PerformanceState) or document why monolithic design was chosen.

#### MED-12: AI Service Tests Cover Only Unconfigured Path

- **Category:** Tests
- **File:** `apps/azure/src/services/__tests__/aiService.test.ts`
- **Description:** Tests only `classifyError`, `isAIAvailable` (returns false), and `fetchChartInsight` throwing when unconfigured. Production paths (narration, streaming, caching) untested.
- **Fix:** Mock `VITE_AI_ENDPOINT` and test the actual fetch/cache/retry logic.

#### MED-13: Brittle `setTimeout`-Based Timing in Tests

- **Category:** Tests
- **Files:** `packages/hooks/src/__tests__/useChartInsights.test.ts:180,206,231,249`, `apps/azure/src/services/__tests__/storage.test.ts:645,654,700,706`
- **Description:** Uses `await new Promise(r => setTimeout(r, 50))` instead of fake timers. Flaky under slow CI.
- **Fix:** Replace with `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()`.

---

### Low Priority

#### LOW-1: Mock Auth Not Env-Gated

- **Category:** Security
- **File:** `apps/azure/src/auth/easyAuth.ts:40-48`
- **Description:** `isLocalDev()` returns true for any localhost request. If production ever adds a localhost listener, mock user is served.
- **Fix:** Guard with `VITE_ENABLE_MOCK_AUTH` env var.

#### LOW-2: Graph Token Cached in Module Variable

- **Category:** Security
- **File:** `apps/azure/src/auth/graphToken.ts:19-20,48-54`
- **Description:** Token persists across logout if app does SPA logout without page reload.
- **Fix:** Ensure `clearGraphTokenCache()` in all logout paths.

#### LOW-3: OBO Audience Check Not Cryptographic

- **Category:** Security
- **File:** `infra/functions/token-exchange/index.js:42-51`
- **Description:** Manual base64 decode checks `aud` but not JWT signature. Not exploitable (MSAL validates), but provides false confidence.
- **Fix:** Add clarifying comment or remove the check.

#### LOW-4: `useDashboardChartsBase` Hook Untested

- **Category:** Tests
- **File:** `packages/hooks/src/useDashboardChartsBase.ts`
- **Description:** Shared composition hook for dashboard chart state — used by both apps — has no test file.

#### LOW-5: `useDataComputation` Edge Cases Untested

- **Category:** Tests
- **File:** `packages/hooks/src/useDataComputation.ts`
- **Description:** Core computation pipeline (stats, staged data, performance results) only tested with 4-row simple dataset. NaN values, empty measureColumns, single-row stages not covered.

#### LOW-6: `indexService.ts` Has Zero Tests

- **Category:** Tests
- **File:** `apps/azure/src/services/indexService.ts`
- **Description:** Debounce, plan gate, auth token injection, error handling all untested.

#### LOW-7: Insight String Matching Is Brittle

- **Category:** Tests
- **File:** `packages/core/src/__tests__/stats.test.ts:279-280`
- **Description:** Tests assert on natural-language insight wording. Any copy change breaks the test.
- **Fix:** Test structure (non-empty, references correct group) not exact wording.

#### LOW-8: App-Level Hook Wrappers May Be Unnecessary

- **Category:** Architecture
- **Files:** `apps/pwa/src/hooks/useChartScale.ts`, `useDataIngestion.ts`, `useFilterNavigation.ts` (and Azure equivalents)
- **Description:** Thin wrappers around shared hooks with minor customizations. Could be eliminated if shared hooks accept config.

#### LOW-9: ColorScheme Pattern Not Documented

- **Category:** DX
- **Description:** ~30 components use colorScheme but the pattern is not in code-style.md. New developers discover it by example only.
- **Fix:** Add section to `.claude/rules/code-style.md`.

#### LOW-10: Wrapper Component Naming Inconsistency

- **Category:** DX
- **Description:** Both `*WrapperBase` and `*Base` suffixes used. `IChartWrapperBase` vs `IChartBase` vs `BoxplotWrapperBase`.
- **Fix:** Document the distinction in monorepo.md.

---

## Refactoring Plan

### Quick Wins (less than 1 hour each)

| #   | Item                                                    | Priority | Files                                                               | Effort |
| --- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------- | ------ |
| Q1  | Add `ALLOWED_ORIGIN` required check in OBO function     | Critical | `infra/functions/token-exchange/index.js`                           | 15 min |
| Q2  | Add `AbortSignal.timeout(30_000)` to all AI fetch calls | High     | `apps/azure/src/services/aiService.ts`                              | 20 min |
| Q3  | Add `reader.releaseLock()` in finally block             | High     | `apps/azure/src/services/aiService.ts`                              | 10 min |
| Q4  | Add file size guards in CSV/Excel parsers               | High     | `packages/core/src/parser/csv.ts`, `excel.ts`                       | 15 min |
| Q5  | Validate `thumbnailDataUrl` is `data:image/`            | High     | `packages/ui/src/components/FindingsLog/FindingComments.tsx`        | 10 min |
| Q6  | Add HTTPS validation for runtime config URLs            | High     | `apps/azure/src/lib/runtimeConfig.ts`                               | 15 min |
| Q7  | Escape OData filter values in search service            | Medium   | `apps/azure/src/services/searchService.ts`                          | 10 min |
| Q8  | Add CSV formula injection prefix                        | Medium   | `packages/core/src/export.ts`                                       | 10 min |
| Q9  | Add `onPaste` plain-text handler to AnnotationBox       | Medium   | `packages/ui/src/components/ChartAnnotationLayer/AnnotationBox.tsx` | 10 min |
| Q10 | Wrap `handleSave` in `useCallback`                      | Medium   | `apps/azure/src/pages/Editor.tsx`                                   | 10 min |
| Q11 | Wire `errorService.setNotificationHandler`              | High     | `apps/azure/src/pages/Editor.tsx` or root component                 | 20 min |
| Q12 | Add `isSyncingRef` guard to concurrent sync paths       | Medium   | `apps/azure/src/services/storage.ts`                                | 20 min |
| Q13 | Add retry + timeout to `fetchFindingsReport`            | Medium   | `apps/azure/src/services/aiService.ts`                              | 15 min |

**Total quick wins: ~3 hours**

### Medium Effort (half-day each)

| #   | Item                                                   | Priority | Scope                                                     | Dependencies |
| --- | ------------------------------------------------------ | -------- | --------------------------------------------------------- | ------------ |
| M1  | Fix stale closure in Azure DataContext `saveProject`   | Critical | `apps/azure/src/context/DataContext.tsx`                  | None         |
| M2  | Add `QuotaExceededError` handling in storage save path | Critical | `apps/azure/src/services/storage.ts`                      | None         |
| M3  | Write conflict resolution tests for storage            | Critical | `apps/azure/src/services/__tests__/storage.test.ts`       | None         |
| M4  | Write runtimeConfig tests                              | High     | New: `apps/azure/src/lib/__tests__/runtimeConfig.test.ts` | None         |
| M5  | Write OBO exchange tests for graphToken                | High     | `apps/azure/src/auth/__tests__/graphToken.test.ts`        | None         |
| M6  | Expand AI service tests (narration, streaming, cache)  | Medium   | `apps/azure/src/services/__tests__/aiService.test.ts`     | None         |
| M7  | Add cloud data schema validation                       | Medium   | `apps/azure/src/services/storage.ts`                      | None         |
| M8  | Type IndexedDB schema (remove `any`)                   | Medium   | `apps/azure/src/db/schema.ts`                             | None         |
| M9  | Replace `setTimeout` with fake timers in tests         | Medium   | Hook + storage test files                                 | None         |
| M10 | Document colorScheme pattern in code-style.md          | Low      | `.claude/rules/code-style.md`                             | None         |
| M11 | Standardize colorScheme across all Base components     | High     | 8 Base components in `packages/ui/`                       | M10          |

**Total medium effort: ~5 days**

### Larger Refactors (1+ day each)

| #   | Item                                 | Priority           | Scope                                                                                      | Dependencies                  |
| --- | ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------ | ----------------------------- |
| L1  | Extract shared chart wrappers        | High               | Move chart wrapper logic from both apps to shared location; reduce ~7K LoC duplication     | M10 (colorScheme docs)        |
| L2  | Extract shared Dashboard logic       | High               | Create composable hooks (useDashboardState, useDashboardLayout); split into sub-components | L1 (chart wrappers)           |
| L3  | Refactor Editor.tsx orchestration    | Complete (ADR-041) | Extract useEditorAI, Zustand panelsStore + feature stores, reduced to 1,085 lines          | None                          |
| L4  | Pre-compute KDE in useBoxplotData    | Medium             | Move KDE from chart render path to data hook; ensure reference-stable arrays               | None                          |
| L5  | Unify boxplot stats computation      | Medium             | Eliminate dual computation in useBoxplotData + useDashboardComputedData                    | L4                            |
| L6  | Split useDataState into domain hooks | Low                | AnalysisState, PersistenceState, PerformanceState (consider if benefit outweighs churn)    | L2 (dashboard refactor first) |

**Total larger refactors: ~2-3 weeks**

### Recommended Execution Order

**Phase 1 — Security and resilience (Week 1)**

- All quick wins Q1-Q13 (3 hours)
- M1 (stale closure fix)
- M2 (quota error handling)

**Phase 2 — Test gaps (Week 1-2)**

- M3 (conflict resolution tests)
- M4 (runtimeConfig tests)
- M5 (OBO exchange tests)
- M6 (AI service tests)

**Phase 3 — Code quality (Week 2)**

- M7 (schema validation)
- M8 (IndexedDB types)
- M9 (fake timers)
- Q10 (handleSave useCallback)

**Phase 4 — Architecture (Week 3-4)**

- M10, M11 (colorScheme docs + adoption)
- L1 (chart wrapper extraction)
- L2 (Dashboard extraction)

**Phase 5 — Optimization (Week 4+)**

- L3 (Editor refactor)
- L4, L5 (boxplot/KDE optimization)
- L6 (useDataState split — evaluate if still needed after L2)

---

## What Is Working Well

- **Package boundaries**: Zero violations, clean acyclic dependency graph
- **Barrel exports**: Well-organized with clear grouping comments
- **Type safety**: Near-zero `any` usage in packages (only IndexedDB schema)
- **XSS protection**: Zero unsafe HTML rendering; all user content rendered as React text children
- **Stats engine**: Well-modularized (13 focused modules, all < 300 lines except multiRegression)
- **Stats tests**: Exemplary — real numerical assertions with `toBeCloseTo`, comprehensive edge cases
- **EXIF stripping tests**: Byte-level validation of security-critical code
- **EasyAuth tests**: Thorough coverage of token expiry, refresh, fallback
- **Naming consistency**: Excellent across entire codebase
- **Zero stale TODOs**: No abandoned code or technical debt markers
- **Context splitting**: DataStateContext / DataActionsContext pattern correctly minimizes re-renders
- **Offline-first architecture**: Well-designed with sync queue and retry
- **Error boundary coverage**: All chart rendering paths wrapped

---

## Appendix: Files Referenced

### Security Surface

- `infra/functions/token-exchange/index.js`
- ~~`infra/functions/index-findings/index.js`~~ _(deprecated by ADR-026)_
- `apps/azure/src/auth/easyAuth.ts`
- `apps/azure/src/auth/graphToken.ts`
- `apps/azure/src/lib/runtimeConfig.ts`
- `apps/azure/src/services/storage.ts`
- `apps/azure/src/services/aiService.ts`
- `apps/azure/src/services/searchService.ts`
- `apps/azure/src/services/indexService.ts`
- `packages/core/src/parser/csv.ts`
- `packages/core/src/parser/excel.ts`
- `packages/core/src/export.ts`
- `packages/core/src/utils/exifStrip.ts`
- `packages/ui/src/components/FindingsLog/FindingComments.tsx`
- `packages/ui/src/components/ChartAnnotationLayer/AnnotationBox.tsx`

### Architecture

- `apps/pwa/src/components/charts/` (5 wrapper files)
- `apps/azure/src/components/charts/` (9 wrapper files)
- `apps/pwa/src/components/Dashboard.tsx`
- `apps/azure/src/components/Dashboard.tsx`
- `apps/azure/src/pages/Editor.tsx`
- `apps/azure/src/context/DataContext.tsx`
- `apps/azure/src/db/schema.ts`
- `packages/hooks/src/useDataState.ts`
- `packages/hooks/src/useProjectPersistence.ts`
- `packages/hooks/src/useFindings.ts`
- `packages/hooks/src/useBoxplotData.ts`
- `packages/hooks/src/useDashboardComputedData.ts`
- `packages/ui/src/services/errorService.ts`

### Tests

- `apps/azure/src/services/__tests__/storage.test.ts`
- `apps/azure/src/services/__tests__/aiService.test.ts`
- `apps/azure/src/auth/__tests__/graphToken.test.ts`
- `packages/hooks/src/__tests__/useChartInsights.test.ts`
- `packages/core/src/__tests__/stats.test.ts`
