---
title: Invariants Index
purpose: constrain
tier: stable
audience: agent
status: active
topic: [ax, invariants]
last-verified: 2026-05-16
---

# VariScout Invariants

Cross-cutting non-negotiables. Each invariant has ONE canonical home (linked) + ONE enforcement mechanism (lint rule, structural-absence test, denylist guard, or convention + code review). Subagents loading the `agent-context-quickstart` skill see this doc on session start.

Enforcement tiers:
- **ESLint** — blocks at lint-time; CI fails if violated.
- **Architecture test** — structural-absence guard in `packages/*/src/__tests__/`; CI fails if violated.
- **Denylist script** — bash script run in pre-commit / `bash scripts/pr-ready-check.sh`; blocks push.
- **Convention** — no mechanical gate; reviewer-enforced + code review protocol.

---

## Hard Invariants (lint- or test-enforced)

### Language

- **Never "root cause"** — say "contribution" / "suspected cause" / "mechanism" (P5 amended).
  - Canonical: [ADR-073](../docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md) §Rationale + [`.claude/invariants/coscout-prompts.md`](invariants/coscout-prompts.md).
  - Enforced: ESLint `variscout/no-root-cause-language` (scoped to AI prompts + CoScout code).

- **Interactions are `'ordinal'` / `'disordinal'` — never "moderator" or "primary"**.
  - Canonical: [`.claude/invariants/stats.md`](invariants/stats.md).
  - Enforced: ESLint `variscout/no-interaction-moderator` (scoped to stats + regression code).

### Stats engine

- **Never return `NaN` or `Infinity`** — return `number | undefined`; use `safeMath.ts` (`finiteOrUndefined`, `safeDivide`, `computeOptimum`).
  - Canonical: [`.claude/invariants/stats.md`](invariants/stats.md).
  - Enforced: convention + three-boundary numeric safety (ADR-069).

- **Never `.toFixed()` on stat outputs** — display via `formatStatistic()` from `@variscout/core/i18n`.
  - Canonical: [`.claude/invariants/stats.md`](invariants/stats.md) + [`.claude/invariants/i18n.md`](invariants/i18n.md).
  - Enforced: ESLint `variscout/no-tofixed-on-stats`.

- **Never `Math.random()` in any code or test** — tests use seeded PRNG helpers; production code avoids randomness.
  - Canonical: [`.claude/invariants/stats.md`](invariants/stats.md) + [`.claude/invariants/testing.md`](invariants/testing.md).
  - Enforced: convention + code review (no ESLint rule currently — see investigations.md for open gap).

- **NIST Longley fixture must stay green to 9 significant digits** — never weaken the threshold.
  - Canonical: [`.claude/invariants/stats.md`](invariants/stats.md).
  - Enforced: Vitest test fixture (failing it fails CI).

- **No cross-investigation statistical aggregation** — no `meanCpk`/`sumCpk`/`portfolioCpk` across heterogeneous units. Distributions, not aggregates. Side-by-side comparison (facets) is always safe; arithmetic across heterogeneous physics is always wrong.
  - Canonical: [ADR-073](../docs/07-decisions/adr-073-no-statistical-rollup-across-heterogeneous-units.md).
  - Enforced: architecture test `packages/core/src/__tests__/architecture.noCrossInvestigationAggregation.test.ts`.

### Chart components

- **Colors only via `chartColors` / `chromeColors`** from `@variscout/charts/colors` — no hex literals.
  - Canonical: [`.claude/invariants/charts.md`](invariants/charts.md).
  - Enforced: ESLint `variscout/no-hardcoded-chart-colors`.

- **LTTB must force-include UCL/LCL violations** — silent dropping is a correctness bug.
  - Canonical: [`.claude/invariants/charts.md`](invariants/charts.md).
  - Enforced: convention + code review.

### ADR-074 level-spanning surface boundary

- **Owner surfaces own their primitives** — Investigation Wall does not reimplement L1 chart rendering; SCOUT does not reimplement Evidence Map factor-network; FRAME does not embed hypothesis canvas surfaces; Evidence Map does not reimplement L2 flow rendering.
  - Canonical: [ADR-074](../docs/07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md).
  - Enforced: `scripts/check-level-boundaries.sh` (runs in `bash scripts/pr-ready-check.sh`).

### Persistence boundary (ADR-059 / ADR-079)

- **No direct Dexie import outside persistence layers** — only `apps/*/src/persistence/` and `apps/*/src/db/` may import Dexie directly. Exception: R12 (`packages/stores/src/canvasViewportStore.ts`), R13 sustainment direct writes with ESLint allow-list.
  - Canonical: [ADR-059](../docs/07-decisions/adr-059-web-first-deployment-architecture.md) + F1+F2 P7.2 enforcement.
  - Enforced: ESLint `no-restricted-imports` (P7.2 rule in `eslint.config.js`, R12+R13 allow-list).

### CoScout prompts

- **Entry point is `assembleCoScoutPrompt()`** — the sole prompt-assembly entry point (`legacy.ts` / `buildCoScoutSystemPrompt()` deleted 2026-05-30, ADR-068 complete).
  - Canonical: [`.claude/invariants/coscout-prompts.md`](invariants/coscout-prompts.md).
  - Enforced: convention + code review.

- **Every tool in `tools/registry.ts` declares `phases` + optional `tier: 'team'`** — ungated tools leak across phases/tiers.
  - Canonical: [`.claude/invariants/coscout-prompts.md`](invariants/coscout-prompts.md).
  - Enforced: convention + code review.

- **Tier 1 is session-invariant** — moving content tier1 ↔ tier3 breaks prompt-cache hit rate.
  - Canonical: [`.claude/invariants/coscout-prompts.md`](invariants/coscout-prompts.md).
  - Enforced: convention + code review.

- **REF markers reference chart elements, not raw data values** (ADR-057, customer-owned data).
  - Canonical: [`.claude/invariants/coscout-prompts.md`](invariants/coscout-prompts.md).
  - Enforced: convention + code review.

### i18n

- **No string concatenation for translated content** — use `formatMessage()` with parameters; Intl APIs for plurals/numbers/dates.
  - Canonical: [`.claude/invariants/i18n.md`](invariants/i18n.md).
  - Enforced: convention + code review.

- **`registerLocaleLoaders()` before any `preloadLocale()`** — apps call at startup; tests register their own loader before `beforeAll`.
  - Canonical: [`.claude/invariants/i18n.md`](invariants/i18n.md).
  - Enforced: convention + test failures (locales silently fall back to English without registration).

### Testing

- **`vi.mock()` BEFORE component imports** — mocks after imports cause infinite loops.
  - Canonical: [`.claude/invariants/testing.md`](invariants/testing.md).
  - Enforced: convention (test hangs surface the violation).

- **`vi.mock()` factories referencing `@variscout/core` exports use `importOriginal` partial-pattern** — flat factories crash on transitive `DEFAULT_TIME_LENS` reads.
  - Canonical: [`.claude/invariants/testing.md`](invariants/testing.md).
  - Enforced: convention + test failures.

- **Floats: `toBeCloseTo(value, decimals)`** — never `toBe()` for float comparisons.
  - Canonical: [`.claude/invariants/testing.md`](invariants/testing.md).
  - Enforced: convention.

- **E2E selectors: `data-testid` only** — text/role/class selectors break with i18n + theme changes.
  - Canonical: [`.claude/invariants/testing.md`](invariants/testing.md).
  - Enforced: convention + code review.

- **Zustand stores: reset state in `beforeEach`** via `useStore.setState(useStore.getInitialState())`.
  - Canonical: [`.claude/invariants/testing.md`](invariants/testing.md).
  - Enforced: convention.

---

## Soft Invariants (convention + reviewer-enforced)

### Product data

- **Browser-only processing** — data stays in customer's Azure tenant. No server-side aggregation; no external API calls with row data.
  - Canonical: [ADR-059](../docs/07-decisions/adr-059-web-first-deployment-architecture.md).
  - Enforced: code review (no server-processing entry points in product code).

### Azure auth + storage

- **EasyAuth only** — no MSAL in client code; `/.auth/me` returns identity.
  - Canonical: [`.claude/invariants/azure-storage.md`](invariants/azure-storage.md).
  - Enforced: convention + code review.

- **No PII in App Insights** — log structural events only (counts, types, durations); send error *type*, not message text.
  - Canonical: [`.claude/invariants/azure-storage.md`](invariants/azure-storage.md).
  - Enforced: convention + code review.

- **SAS tokens minted server-side** via `/api/storage-token` — client never sees storage keys; container-scoped, 1h expiry.
  - Canonical: [`.claude/invariants/azure-storage.md`](invariants/azure-storage.md).
  - Enforced: convention + code review.

- **ETag concurrency on hub-blob writes (ADR-079)** — callers must handle the `{ ok: false; reason }` branch.
  - Canonical: [`.claude/invariants/azure-storage.md`](invariants/azure-storage.md) + [ADR-079](../docs/07-decisions/adr-079-hub-blob-storage-etag-concurrency.md).
  - Enforced: TypeScript typed result (compile-time guard); convention for branch handling.

### Architecture shape

- **9 Zustand stores across 3 layers** — Document (×4): `useProjectStore`, `useInvestigationStore`, `useCanvasStore`, `useImprovementProjectStore`; Annotation (×4): `useCanvasViewportStore` (per-hub), `usePreferencesStore` (per-user), `useActiveIPStore` (per-user), `useProjectMembershipStore` (per-user); View (×1): `useViewStore`. No DataContext.
  - Canonical: [ADR-078](../docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md) + `packages/stores/CLAUDE.md`.
  - Enforced: `packages/stores/src/__tests__/layerBoundary.test.ts` (structural-absence guard on layer names).

- **Package dependencies flow downward** — `core → hooks → ui → apps`. Never import upward.
  - Canonical: root `CLAUDE.md` §Invariants + [ADR-078](../docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md).
  - Enforced: convention + ESLint (some packages); TypeScript compiler catches circular deps.

- **Sub-path exports need BOTH `package.json#exports` AND `tsconfig.json#paths` updated together** — updating one but not the other silently breaks imports.
  - Canonical: root `CLAUDE.md` §Invariants.
  - Enforced: convention + build failures (`pnpm build` catches type gaps).

- **`@source` directive in every `apps/*/src/index.css` for shared packages** — missing it silently breaks Tailwind v4 responsive utilities.
  - Canonical: root `CLAUDE.md` §Invariants.
  - Enforced: convention (visual regression surfaces it; see `feedback_verify_before_push`).

- **No bare `useStore()` calls** — always use selectors: `useProjectStore(s => s.field)`.
  - Canonical: `packages/stores/CLAUDE.md`.
  - Enforced: convention + code review.

- **Strategy pattern for modes** — `resolveMode()` + `getStrategy()` is the sole source of truth for mode-specific behavior. No cascading mode ternaries.
  - Canonical: [Constitution §15](../docs/01-vision/constitution.md) + `packages/core/CLAUDE.md`.
  - Enforced: convention + code review.

### Visual design

VariScout V1 uses **only light shades** in the UI palette:

- **Surfaces**: Tailwind 50-300 utilities (`bg-blue-100`, `bg-stone-200`, etc.) — no 700+ fills.
- **Text + strokes**: Tailwind 400-700 utilities, paired with darker text (600-800) for accessibility per [`feedback_green_400_light_contrast`](../docs/cards/memory/feedback_green_400_light_contrast.md).
- **No dark mode in V1.** Re-evaluate post-wedge.
- **No deep-saturated fills.** Clinical/paper-document feel.

Canonical homes: [Constitution §V1 Wedge Principles](../docs/01-vision/constitution.md) + [`packages/ui/CLAUDE.md`](../packages/ui/CLAUDE.md) §Color discipline.
Enforcement: convention-only today (M5 may add a Steward grep check for Tailwind 700+ surface utilities).

### Chart components (soft)

- **Theme via `useChartTheme()`** — never read `data-theme` directly.
  - Canonical: [`.claude/invariants/charts.md`](invariants/charts.md).
  - Enforced: convention + code review.

- **Pair `text-{color}-400` with `text-{color}-700`** for label contrast — `red/amber/green-400` fail light-mode contrast alone.
  - Canonical: [`.claude/invariants/charts.md`](invariants/charts.md).
  - Enforced: convention + visual regression (see `feedback_green_400_light_contrast`).

- **No manual `React.memo()` on new chart components** — React Compiler handles memoization.
  - Canonical: [`.claude/invariants/charts.md`](invariants/charts.md).
  - Enforced: convention + code review.

### Git / workflow

- **Never `--no-verify` on commits** — hooks enforce invariants; bypassing hides real violations.
  - Canonical: root `CLAUDE.md` §Workflow + `feedback_subagent_no_verify`.
  - Enforced: convention; reviewers reject `--no-verify` evidence in PRs.

---

## Topic-Scoped Invariants (load on demand)

Load these when working in the relevant area — they provide more detail than the summaries above.

| Topic                          | Invariant file                                                   | When to load                                        |
| ------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------- |
| Stats engine + math            | [invariants/stats.md](invariants/stats.md)                       | Writing or modifying stats/findings code            |
| Test code (Vitest + Playwright)| [invariants/testing.md](invariants/testing.md)                   | Writing or modifying any test file                  |
| Chart components               | [invariants/charts.md](invariants/charts.md)                     | Chart component work                                |
| CoScout AI prompts             | [invariants/coscout-prompts.md](invariants/coscout-prompts.md)   | Editing CoScout prompts / AI tools / prompt registry. For CoScout work: load [coscout-ax-design](../docs/01-vision/coscout-ax-design.md) first (canonical AX design: persona, tier-gating, knowledge architecture, safety, eval), then this invariant file for prompt engineering details. |
| i18n strings + locale          | [invariants/i18n.md](invariants/i18n.md)                         | Adding or modifying localized strings               |
| Azure storage + auth           | [invariants/azure-storage.md](invariants/azure-storage.md)       | Azure Blob/Dexie sync, auth, SAS token work         |

---

## Enforcement Gaps (open)

The following soft invariants lack a mechanical enforcement mechanism. Gaps are logged in `docs/investigations.md`.

- ~~`Math.random()` ban: enforced by convention only; no ESLint rule.~~ **RESOLVED 2026-05-17 via PR #198** — Tier 1 Math.random retirement + ESLint guard shipped. Now mechanically enforced.
- `@source` directives: no build-time check; only visual regression surfaces it. A `pnpm docs:gen-arch`-style check for Tailwind source maps could close this (Play 7 candidate).

---

## Related

- [docs/agent-context/onboarding-quick-start.md](../docs/agent-context/onboarding-quick-start.md) — 5-min agent orientation that summarizes the 4 hard invariants
- [docs/agent-context/package-router.md](../docs/agent-context/package-router.md) — routing table pointing to relevant invariant files per work area
- [docs/01-vision/constitution.md](../docs/01-vision/constitution.md) — 10 product principles (overlaps with soft invariants above; constitution is canonical for P1–P10)
