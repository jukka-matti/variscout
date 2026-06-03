# @variscout/core

Pure TypeScript domain layer. Stats, parser, glossary, tier, i18n, findings, variation, defect, strategy.

## Hard rules

- Never import React, visx, or any UI library. This package must stay pure TS.
- Stats functions must return `number | undefined` — never `NaN` or `Infinity`. Use `safeMath.ts` (safeDivide, safeLog, safeSqrt).
- Never use `Math.random` in code or tests. Tests that need randomness use a deterministic PRNG (see packages/core/src/stats/**tests**/ for examples).
- Never use `.toFixed()` on exported stat values — consumers call `formatStatistic()` from `@variscout/core/i18n`.

## Invariants

- Sub-path exports are public API. Adding a new sub-path requires updating `packages/core/package.json` exports field + `tsconfig.json` paths.
- Available sub-paths: root (barrel), /stats, /ai, /capability, /parser, /processHub (CharacteristicType, OutcomeSpec, ProcessHub, InvestigationStatus, etc.), /findings (incl. `findings/drift.ts`), /variation, /tier, /types, /i18n, /glossary, /export, /navigation, /responsive, /performance, /time, /timeline (TimelineWindow + applyWindow), /throughput (computeOutputRate, computeBottleneck), /projectMetadata, /strategy, /ui-types, /evidenceMap, /defect.
- `resolveMode()` + `getStrategy()` in `src/analysisStrategy.ts` is the mode dispatch point. New analysis modes must register here.
- The stats engine is the authority for numeric claims. CoScout receives stat results; it does not recompute.
- Numeric safety has three boundaries (ADR-069): B1 parser rejects NaN via `toNumericValue`; B2 stats functions return `undefined`; B3 display uses `formatStatistic`.
- Registering locale loaders (`registerLocaleLoaders`) is an app responsibility — core no longer calls `import.meta.glob` directly.
- The `ai/prompts/coScout/` directory is the canonical CoScout prompt architecture. Entry point is `assembleCoScoutPrompt()` — `legacy.ts` was deleted 2026-05-30 (ADR-068 complete).
- `EvidenceSnapshot.provenance?: RowProvenanceTag[]` (envelope facet) is the canonical home for row-source metadata per ADR-077 amendment 2026-05-07. The runtime sidecar `Map<rowKey, RowProvenanceTag>` from slice 3 is retired; persistence + in-memory access converge on `snapshot.provenance` directly.

## Domain modeling invariants

- **`FindingSource` is a discriminated union** (`src/findings/types.ts`) with **4 variants** (5 `chart` discriminant values: `boxplot`/`pareto` share one variant, plus `ichart`, `probability`, `coscout`) — discriminant is `chart`. Always narrow with `'category' in src` or an exhaustive `switch` before accessing variant fields. A new variant requires updating every exhaustive switch (TypeScript will surface them via `never` exhaustiveness errors).
- **`wouldCreateCycle()` lives in `src/stats/causalGraph.ts`** (not in `findings/`). It is a graph utility, not a domain operation. Import: `import { wouldCreateCycle } from '@variscout/core/stats'`.
- **Interaction patterns are geometric, not role-based.** `classifyInteractionPattern()` returns `'ordinal'` or `'disordinal'`. Never call interactions "moderator" or "primary" — ESLint rule `no-interaction-moderator` enforces.
- **Never write "root cause"** in code, prompts, tests, or doc comments — say "contribution" / "suspected cause" / "mechanism" (constitution P5 amended). ESLint rule `no-root-cause-language` enforces in `ai/prompts/`.

## Strategy + analysis modes

- **Always exactly 4 chart slots** per mode strategy. Never add a 5th — if a mode needs alternate views, add a switcher within a slot (defect Pareto factor-selector). Changing slot count breaks the dashboard layout contract.
- **`AnalysisMode` (persisted)** = `'standard' | 'performance' | 'defect'`. **`ResolvedMode` (rendering)** adds `'capability'`. Capability is produced by `resolveMode()` from `standardIChartMetric === 'capability'`; never persist it as an `AnalysisMode` value.
- **Mode transforms run BEFORE stats**, not after. `computeDefectRates()` produces the working dataset; never call the stats engine on raw event-log data in defect mode.
- **`isPerformanceMode` is removed** (~67 references deleted). Never re-introduce. Use `analysisMode === 'performance'` if you must branch, or prefer `getStrategy()`.
- ADR-074 boundary policy applies: SCOUT (investigation-time) and Hub Capability (hub-time, rolling default) link as peers via the strategy's `dataRouter`.

## CoScout prompt invariants

- Entry point is `assembleCoScoutPrompt()`; `legacy.ts` deleted (ADR-068 migration complete 2026-05-30). `BuildCoScoutToolsOptions` lives in `ai/prompts/coScout/tools/registry.ts`.
- Tier 1 (role + glossary) must stay session-invariant — it is the prompt-cacheable prefix (Azure AI Foundry, ≥1024 tokens). Moving content tier1 ↔ tier3 breaks cache hit rate or embeds ephemeral state.
- Every tool in `ai/prompts/coScout/tools/registry.ts` MUST declare `phases`. The `tier` field is an internal prompt-cache phasing signal per ADR-068 (Tier 1 session-invariant vs Tier 3 per-session) — NOT customer-facing pricing tier. Ungated tools (missing `phases`) leak across investigation phases.
- CoScout references chart elements via REF markers (`REF:boxplot:productLine`), never raw data values — upholds customer-owned-data + contribution-not-causation framing.

## i18n loading invariants

- Apps call `registerLocaleLoaders()` once at startup before any `preloadLocale()`. Tests must register their own loader via `import.meta.glob` before `beforeAll` / `beforeEach` — without it, all locales silently fall back to English.
- **Adding a message key is all-or-nothing:** `MessageCatalog` (`i18n/types.ts`) is a CLOSED interface, so a new key must land in the interface + ALL 32 catalogs in `i18n/messages/` (`en.ts` + 31 others; English placeholder is the convention for technical labels, translate later). The `tsc` build + the i18n completeness test enforce it — one missing locale = build break. (`check:i18n` needs `tsx`, absent locally + not in `pr-ready-check`.)
- Chinese locales: `zh-Hans` → `zhHans.ts`, `zh-Hant` → `zhHant.ts` via the `LOCALE_TO_FILENAME` map in `i18n/index.ts`. Don't rename — the camelCase ↔ BCP-47 mismatch is intentional.
- Stat values in UI go through `formatStatistic()` (handles `Number.isFinite()` + locale formatting). `.toFixed()` is ESLint-forbidden on stat outputs.

## Test command

```bash
pnpm --filter @variscout/core test
```

Float assertions use `toBeCloseTo(expected, precision)`. NIST regression tests in `src/stats/__tests__/nistLongley.test.ts` validate the OLS QR solver against Minitab/JMP reference outputs to 9 significant digits — never weaken the threshold. Two-pass best-subsets only screens interactions among Pass-1 winners (hierarchical constraint per ADR-067) — never enumerate all factor pairs.

## Core sub-domains

Agents searching code may miss these — they live in `core` despite "package-like" names:

- `src/ai/` — CoScout prompts + 5 V1 response paths; entry: `assembleCoScoutPrompt()`. ADR-080 (Sustainment auto-fire).
- `src/projectMembership/` — pure-TS ACL: `canAccess()`, `ROLE_PERMISSIONS`, `ProjectAction` union. Pairs with `useProjectMembershipStore` per wedge V1 (ADR-082). Used by both PWA + Azure.

## Related

- ADR-045 Modular architecture (DDD-lite)
- ADR-047 Analysis mode strategy pattern
- ADR-057 Visual grounding (REF markers)
- ADR-067 Unified GLM regression (two-pass best subsets)
- ADR-068 CoScout cognitive redesign (modular tiers)
- ADR-069 Three-boundary numeric safety
- ADR-074 Multi-level boundary policy (SCOUT × Hub Capability)
- ADR-077 Provenance envelope facet
