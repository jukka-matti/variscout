---
title: 'Agent Docs Architecture — Phase 1: Foundation'
status: delivered
date: 2026-04-17
---

# Agent-Facing Documentation Architecture — Phase 1 (Foundation) Implementation Plan

**Baseline:** [docs/09-baseline/2026-04-17-agent-docs-baseline.md](../../09-baseline/2026-04-17-agent-docs-baseline.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the A++ documentation architecture (12 skills + 8 package CLAUDE.md.new drafts + 3 Tier 1 human docs + 5 Tier 2 per-mode journey docs + root CLAUDE.md.new draft) as a fully additive delta — zero breaking changes, no deletions, old system stays active until Phase 2.

**Architecture:** Five-layer model (invariants → package context → skills → retrieval corpus → enforcement). Phase 1 only builds Layers 1–4 _additively_ by creating `.new` variants alongside existing CLAUDE.md and new `docs/*.md` narrative files. Nothing is activated yet.

**Tech Stack:** Markdown-only. Anthropic YAML frontmatter for skills (`name`, `description`). Vitest (existing test suite must keep passing — 5792 tests). pnpm workspaces. No runtime code changes.

**Reference spec:** `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md`

---

## File Structure — Phase 1 deliverables

**Created new (~25 files):**

- `.claude/skills/{12 skill-folders}/SKILL.md` (frontmatter only, empty body)
- `CLAUDE.md.new` (root)
- `packages/{core,charts,hooks,ui,stores,data}/CLAUDE.md.new` (6 files)
- `apps/{azure,pwa}/CLAUDE.md.new` (2 files)
- `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md` (3 Tier 1 docs)
- `docs/USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md` (5 Tier 2 docs)
- `docs/09-baseline/2026-04-17-agent-docs-baseline.md` (one-off: baseline measurements)

**Unchanged (old system stays active):**

- `CLAUDE.md` (existing root, 181 lines — not touched)
- `.claude/rules/*.md` (all 6 files preserved)
- `MEMORY.md` (untouched)
- All existing `docs/**` content preserved

**Verification gate:** `pnpm test` must pass (5792/5792), `pnpm build` must succeed, and Tier 1 docs must be readable in 15 minutes by someone unfamiliar with recent work.

---

## Conventions used in this plan

- **`.new` suffix** → file is a draft parallel to the live file. Not activated. Deleted or swapped in Phase 2.
- **"Draft"** means: write full markdown content to the file, frontmatter + body, per the templates below.
- **"Verify"** means: line count is within target, required sections present, no broken internal links, preview rendering OK.
- **Committing:** one commit per related group (not per file), conventional commits: `docs(agent-arch): …`, `chore(agent-arch): …`.

---

## Task 1: Baseline measurements + evaluation prompts

**Files:**

- Create: `docs/09-baseline/2026-04-17-agent-docs-baseline.md`

- [ ] **Step 1: Create baseline directory**

```bash
mkdir -p docs/09-baseline
```

- [ ] **Step 2: Measure current always-loaded context**

Run and capture output:

```bash
wc -l CLAUDE.md MEMORY.md .claude/rules/*.md
```

Expected: `CLAUDE.md` ≈ 181, 6 `rules/*.md` totalling ~724, MEMORY.md ~175.

- [ ] **Step 3: Record baseline test suite pass count**

```bash
pnpm test 2>&1 | tail -20
```

Expected: 5792 tests pass (or current count; record actual).

- [ ] **Step 4: Write baseline document**

Create `docs/09-baseline/2026-04-17-agent-docs-baseline.md` with exact content:

```markdown
---
title: Agent Docs Architecture Baseline (Pre-Phase 1)
audience: [engineer]
category: reference
status: reference
related: [claude-md, skills, migration, measurement]
---

# Agent Documentation Architecture — Baseline Measurements

**Date:** 2026-04-17
**Purpose:** Snapshot of system state before A++ migration begins. Used to measure success at end of each phase.

## Always-loaded context (lines)

| File                             | Lines     | Notes                      |
| -------------------------------- | --------- | -------------------------- |
| `CLAUDE.md`                      | {FILL-IN} | Root project instructions  |
| `.claude/rules/charts.md`        | {FILL-IN} | Eager-loaded rule file     |
| `.claude/rules/code-style.md`    | {FILL-IN} | Eager-loaded rule file     |
| `.claude/rules/documentation.md` | {FILL-IN} | Eager-loaded rule file     |
| `.claude/rules/monorepo.md`      | {FILL-IN} | Eager-loaded rule file     |
| `.claude/rules/ruflo.md`         | {FILL-IN} | Eager-loaded rule file     |
| `.claude/rules/testing.md`       | {FILL-IN} | Eager-loaded rule file     |
| `MEMORY.md`                      | {FILL-IN} | Auto-memory (user-level)   |
| **Total**                        | {SUM}     | Target after Phase 3: ≤300 |

## Test suite baseline

- Total tests passing: {FILL-IN} / {FILL-IN}
- Duration: {FILL-IN}
- Date recorded: 2026-04-17

## Corpus inventory

- ADRs: 71 (`docs/07-decisions/adr-*.md`)
- Design specs: 64 (`docs/superpowers/specs/`)
- Archived: 65 (`docs/archive/`)
- Total `docs/**/*.md`: 455

## Evaluation suite — 10 failure-mode prompts

These 10 prompts test whether the agent loads correct context and avoids the two confirmed failure modes (C: context overload, D: duplication-caused conflict). Run pre-migration, end of Phase 2, end of Phase 3. Record correction count per run.

1. **Chart colors:** "Add a new Boxplot variant that highlights outliers in a distinct color." (Tests: does agent reach for `chartColors` from `@variscout/charts/colors`, not hardcode hex?)
2. **Numeric safety:** "Format a Cpk value for display in a new tooltip." (Tests: does agent use `formatStatistic()` not `.toFixed()`?)
3. **Store access:** "Read the current project title in a new component." (Tests: does agent use a direct selector from `useProjectStore`, not DataContext?)
4. **Terminology:** "Draft a CoScout response that explains why batch variation matters." (Tests: does agent avoid "root cause"?)
5. **Interaction language:** "Write a paragraph describing a two-way interaction for the user." (Tests: does agent use ordinal/disordinal, not moderator/primary?)
6. **Chart patterns:** "Add a new I-Chart annotation for a detected out-of-control point." (Tests: does agent know props-based, `useChartTheme`, annotation patterns?)
7. **Mode strategy:** "Add a new chart slot for Yamazumi mode that shows idle time." (Tests: does agent know `resolveMode`, chart slot mapping, mode transforms?)
8. **Azure auth:** "Add a call that reads a file from Blob Storage." (Tests: does agent know EasyAuth + SAS tokens + customer-owned principle, not MSAL?)
9. **i18n:** "Add a new translation key for 'Edit finding'." (Tests: does agent know locale loader + typed catalogs, not string concat?)
10. **Test setup:** "Write a component test for the new feature." (Tests: does agent put `vi.mock()` BEFORE imports? Use `toBeCloseTo` for floats?)

For each prompt, record:

- Correct on first try? (Y/N)
- Number of corrections needed
- Observed failure mode (C, D, or none)
```

- [ ] **Step 5: Fill in actual measurements**

Replace all `{FILL-IN}` placeholders with actual numbers from Steps 2–3.

- [ ] **Step 6: Verify**

```bash
wc -l docs/09-baseline/2026-04-17-agent-docs-baseline.md
grep -c "FILL-IN" docs/09-baseline/2026-04-17-agent-docs-baseline.md
```

Expected: file exists, no remaining `FILL-IN` placeholders.

- [ ] **Step 7: Commit**

```bash
git add docs/09-baseline/
git commit -m "docs(agent-arch): record baseline measurements for A++ migration"
```

---

## Task 2: Create `.claude/skills/` scaffolding — 12 skill folders

**Files:**

- Create: `.claude/skills/{12 folders}/SKILL.md` (frontmatter only, empty body)

- [ ] **Step 1: Create skills parent directory**

```bash
mkdir -p .claude/skills
```

- [ ] **Step 2: Create all 12 skill folders**

```bash
cd .claude/skills
mkdir -p editing-charts editing-statistics editing-coscout-prompts editing-evidence-map editing-investigation-workflow editing-azure-storage-auth editing-analysis-modes writing-tests adding-i18n-messages maintaining-documentation using-ruflo editing-monorepo-structure
cd ../..
```

Verify:

```bash
ls .claude/skills/
```

Expected output (12 folders): `editing-charts editing-statistics editing-coscout-prompts editing-evidence-map editing-investigation-workflow editing-azure-storage-auth editing-analysis-modes writing-tests adding-i18n-messages maintaining-documentation using-ruflo editing-monorepo-structure`

- [ ] **Step 3: Create SKILL.md for `editing-charts`**

File `.claude/skills/editing-charts/SKILL.md`:

```markdown
---
name: editing-charts
description: Use when editing packages/charts/ or chart wrappers in apps. Chart component patterns (Base + responsive wrapper), theme-aware colors via useChartTheme, chartColors/chromeColors constants, export dimensions, Pareto/Boxplot overflow for many categories, LTTB decimation, chart annotations, dot plot fallback for small N, violin mode, boxplot sorting.
---

<!-- Body to be populated in Phase 2. Reference content lives in .claude/rules/charts.md during transition. -->
```

- [ ] **Step 4: Create SKILL.md for `editing-statistics`**

File `.claude/skills/editing-statistics/SKILL.md`:

```markdown
---
name: editing-statistics
description: Use when editing packages/core/src/stats/ or statistical computation code. Three-boundary numeric safety (ADR-069), safeMath.ts, two-pass best subsets with interaction screening (ADR-067), NIST validation expectations, OLS regression via QR solver, ANOVA metrics (ADR-062), design matrices. Stats functions must return number | undefined, never NaN.
---

<!-- Body to be populated in Phase 2. Reference content lives in ADR-067, ADR-069, docs/05-technical/statistics-reference.md during transition. -->
```

- [ ] **Step 5: Create SKILL.md for `editing-coscout-prompts`**

File `.claude/skills/editing-coscout-prompts/SKILL.md`:

```markdown
---
name: editing-coscout-prompts
description: Use when editing CoScout AI prompts or packages/core/src/ai/prompts/. Modular architecture, assembleCoScoutPrompt() entry point (tier1/tier2/tier3 structure, replaces deprecated buildCoScoutSystemPrompt()), 25-tool registry with phase/mode/tier gating, mode-aware methodology coaching, visual grounding markers, investigation context wiring.
---

<!-- Body to be populated in Phase 2. Reference: ADR-047, ADR-049, ADR-060, ADR-068, docs/05-technical/architecture/coscout-prompt-architecture.md -->
```

- [ ] **Step 6: Create SKILL.md for `editing-evidence-map`**

File `.claude/skills/editing-evidence-map/SKILL.md`:

```markdown
---
name: editing-evidence-map
description: Use when editing packages/charts/src/EvidenceMap/ or apps/azure/src/components/editor/InvestigationMapView.tsx. 3-layer SVG architecture (statistical / investigation / synthesis), props-based (no context), interactions (click, right-click, context menus), edge detail + promote-to-causal, popout sync via usePopoutChannel, mobile patterns (enableZoom, EdgeSheet).
---

<!-- Body to be populated in Phase 2. Reference: docs/superpowers/specs/2026-04-05-evidence-map-design.md, 2026-04-07-evidence-map-edge-interactions-design.md -->
```

- [ ] **Step 7: Create SKILL.md for `editing-investigation-workflow`**

File `.claude/skills/editing-investigation-workflow/SKILL.md`:

```markdown
---
name: editing-investigation-workflow
description: Use when editing findings, SuspectedCause hubs, causal links, questions, or investigation spine. SuspectedCause hub model (ADR-064), CausalLink entity in investigationStore, three investigation threads (regression, hub UX, EDA heartbeat), FindingSource discriminated union narrowing (boxplot/pareto/ichart/yamazumi/coscout variants), question-linked findings pattern.
---

<!-- Body to be populated in Phase 2. Reference: ADR-015, ADR-020, ADR-053, ADR-064, ADR-065, ADR-066, docs/superpowers/specs/2026-04-04-investigation-spine-design.md -->
```

- [ ] **Step 8: Create SKILL.md for `editing-azure-storage-auth`**

File `.claude/skills/editing-azure-storage-auth/SKILL.md`:

```markdown
---
name: editing-azure-storage-auth
description: Use when editing apps/azure/ auth, storage, or cloud sync code. EasyAuth (no MSAL code), IndexedDB via Dexie schema, Blob Storage sync with SAS tokens, /api/storage-token endpoint, App Insights telemetry with strict no-PII rule, customer-owned data principle (ADR-059), Azure feature stores in features/*/.
---

<!-- Body to be populated in Phase 2. Reference: ADR-059, docs/08-products/azure/authentication.md, docs/08-products/azure/blob-storage-sync.md -->
```

- [ ] **Step 9: Create SKILL.md for `editing-analysis-modes`**

File `.claude/skills/editing-analysis-modes/SKILL.md`:

```markdown
---
name: editing-analysis-modes
description: Use when editing mode resolution, strategy pattern, or mode-specific features across yamazumi, performance, defect, process-flow, or capability modes. resolveMode() + getStrategy() in @variscout/core/strategy, chart slot mapping per mode, CoScout methodology coaching per mode, mode transforms (computeYamazumiData, computeDefectRates), adding a new analysis mode end-to-end. Mode-specific details in YAMAZUMI.md, PERFORMANCE.md, DEFECT.md, PROCESS-FLOW.md reference files.
---

<!-- Body and mode reference files (YAMAZUMI.md, PERFORMANCE.md, DEFECT.md, PROCESS-FLOW.md) to be populated in Phase 2. Reference: ADR-047, ADR-034, docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md -->
```

- [ ] **Step 10: Create SKILL.md for `writing-tests`**

File `.claude/skills/writing-tests/SKILL.md`:

```markdown
---
name: writing-tests
description: Use when writing or modifying tests in any package. Vitest + React Testing Library + Playwright patterns, CRITICAL vi.mock() BEFORE component imports to prevent infinite loops, toBeCloseTo() for float comparisons, Zustand store test pattern (setState in beforeEach), i18n locale loader registration in tests, E2E selector conventions (data-testid), deterministic PRNG in stats tests (never Math.random).
---

<!-- Body to be populated in Phase 2. Reference content lives in .claude/rules/testing.md during transition. Also: docs/05-technical/implementation/testing.md -->
```

- [ ] **Step 11: Create SKILL.md for `adding-i18n-messages`**

File `.claude/skills/adding-i18n-messages/SKILL.md`:

```markdown
---
name: adding-i18n-messages
description: Use when adding user-facing strings or new translation keys. Apps call registerLocaleLoaders() at startup, typed message catalogs in packages/core/src/i18n/messages/, Intl API for formatting, no string concatenation (use formatMessage with parameters). Tests must register their own loaders via import.meta.glob.
---

<!-- Body to be populated in Phase 2. Reference: ADR-025, packages/core/src/i18n/ -->
```

- [ ] **Step 12: Create SKILL.md for `maintaining-documentation`**

File `.claude/skills/maintaining-documentation/SKILL.md`:

```markdown
---
name: maintaining-documentation
description: Use when creating or updating ADRs, design specs, diagrams, or the spec index. ADR template + sequential numbering + immediate index update in docs/07-decisions/index.md, spec frontmatter requirements (title, audience, category, status, related), Starlight frontmatter for docs/ content, spec-anchored policy (living docs, status progression draft→delivered), diagram health check via scripts/check-diagram-health.sh, spec index sync requirement.
---

<!-- Body to be populated in Phase 2. Reference content lives in .claude/rules/documentation.md during transition. -->
```

- [ ] **Step 13: Create SKILL.md for `using-ruflo`**

File `.claude/skills/using-ruflo/SKILL.md`:

```markdown
---
name: using-ruflo
description: Use when running ruflo tools or accessing ruflo memory for VariScout. Semantic memory search via npx ruflo memory search, when to use ruflo memory vs MEMORY.md (routing vs semantic), worker dispatch via mcp__ruflo__hooks_worker-dispatch, hook error logs at /tmp/ruflo-hooks.log, version pinned to 3.5.42 in .mcp.json.
---

<!-- Body to be populated in Phase 2. Reference content lives in .claude/rules/ruflo.md during transition. Also: docs/05-technical/implementation/ruflo-workflow.md -->
```

- [ ] **Step 14: Create SKILL.md for `editing-monorepo-structure`**

File `.claude/skills/editing-monorepo-structure/SKILL.md`:

```markdown
---
name: editing-monorepo-structure
description: Use when adding packages, changing package.json exports, adjusting sub-path exports, or restructuring the monorepo. pnpm workspaces, downward-only dependency flow (core→hooks→ui→apps), @variscout/core sub-path exports (stats, ai, parser, findings, variation, etc), Tailwind v4 @source directive requirement in each app's index.css, workspace:* for internal refs.
---

<!-- Body to be populated in Phase 2. Reference content lives in .claude/rules/monorepo.md during transition. -->
```

- [ ] **Step 15: Verify all 12 SKILL.md files exist with valid frontmatter**

```bash
ls .claude/skills/*/SKILL.md | wc -l
```

Expected: `12`

```bash
for f in .claude/skills/*/SKILL.md; do
  head -1 "$f" | grep -q "^---$" || echo "MISSING FRONTMATTER: $f"
done
```

Expected: no output (all files have frontmatter).

- [ ] **Step 16: Confirm no live system affected**

```bash
ls CLAUDE.md .claude/rules/*.md
pnpm test 2>&1 | tail -5
```

Expected: all 7 old files unchanged; tests still pass 5792/5792.

- [ ] **Step 17: Commit**

```bash
git add .claude/skills/
git commit -m "chore(agent-arch): scaffold 12 skill folders with frontmatter-only SKILL.md

Phase 1 Foundation — fully additive. Bodies to be populated in Phase 2.
Reference: docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md"
```

---

## Task 3: Draft root `CLAUDE.md.new` (≤50 lines)

**Files:**

- Create: `CLAUDE.md.new`

- [ ] **Step 1: Write new root CLAUDE.md.new**

Create file `CLAUDE.md.new` with exact content:

```markdown
# VariScout

Structured investigation for process improvement. Browser-based,
offline-first, customer-owned data.

## Hard rules (enforced by lint/hooks — do not violate)

- Never use `.toFixed()` on stats — use `formatStatistic()` from
  `@variscout/core/i18n`
- Never hardcode hex colors in charts — use `chartColors`/`chromeColors`
  from `@variscout/charts/colors`
- Never use "root cause" in user-facing strings or AI prompts —
  use "contribution" (P5)
- Never interpret interactions as "moderator/primary" — use
  geometric terms (ordinal/disordinal)

## Invariants

- Browser-only processing; data stays in customer's tenant
- 4 domain Zustand stores are source of truth; no DataContext
- Deterministic stats engine is authority; CoScout (AI) adds context
- Package dependencies flow downward: core → hooks → ui → apps

## Commands

- `pnpm dev` — PWA at :5173
- `pnpm --filter @variscout/azure-app dev` — Azure app
- `pnpm test` — all packages
- `pnpm build` — all packages + apps
- `claude --chrome` — enable browser for E2E

## Orientation

- System in practice: @docs/OVERVIEW.md
- User journeys and personas: @docs/USER-JOURNEYS.md
- Data lifecycle: @docs/DATA-FLOW.md

## Where to find domain knowledge

- Package-specific context: nested CLAUDE.md in each `packages/*/` and `apps/*/`
- Workflow-specific knowledge: `.claude/skills/` (auto-loaded by task)
- Decisions (why): `docs/07-decisions/` (ADR-001 through ADR-069)
- Designs (what): `docs/superpowers/specs/`
- Reference corpus: `docs/index.md` (domain manifest)

## When uncertain

Prefer retrieval over recall. Read the relevant ADR, spec, or package
CLAUDE.md before writing non-trivial code. If an instruction contradicts
code, trust code and flag the drift.
```

- [ ] **Step 2: Verify line count ≤50**

```bash
wc -l CLAUDE.md.new
```

Expected: between 42 and 50 lines.

- [ ] **Step 3: Verify live CLAUDE.md unchanged**

```bash
wc -l CLAUDE.md
```

Expected: 181 (unchanged).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md.new
git commit -m "docs(agent-arch): draft new root CLAUDE.md.new (<=50 lines)

Phase 1 Foundation — live CLAUDE.md unchanged. Activation in Phase 2."
```

---

## Task 4: Draft 6 package `CLAUDE.md.new` files

**Files:**

- Create: `packages/core/CLAUDE.md.new`
- Create: `packages/charts/CLAUDE.md.new`
- Create: `packages/hooks/CLAUDE.md.new`
- Create: `packages/ui/CLAUDE.md.new`
- Create: `packages/stores/CLAUDE.md.new`
- Create: `packages/data/CLAUDE.md.new`

Each file follows this **section structure** exactly:

1. Package name + one-line purpose
2. `## Hard rules` — only rules specific to this package
3. `## Invariants` — package-specific facts that break the system if violated
4. `## Test command` — how to run tests for this package
5. `## Skills to consult` — 1–3 relevant skills by name
6. `## Related` — 2–4 relevant ADRs/specs by path

- [ ] **Step 1: Write `packages/core/CLAUDE.md.new` (~80 lines)**

File `packages/core/CLAUDE.md.new`:

````markdown
# @variscout/core

Pure TypeScript domain layer. Stats, parser, glossary, tier, i18n, findings, variation, yamazumi, defect, strategy.

## Hard rules

- Never import React, visx, or any UI library. This package must stay pure TS.
- Stats functions must return `number | undefined` — never `NaN` or `Infinity`. Use `safeMath.ts` (safeDivide, safeLog, safeSqrt).
- Never use `Math.random` in code or tests. Tests that need randomness use a deterministic PRNG (see packages/core/src/stats/**tests**/ for examples).
- Never use `.toFixed()` on exported stat values — consumers call `formatStatistic()` from `@variscout/core/i18n`.

## Invariants

- Sub-path exports are public API. Adding a new sub-path requires updating `packages/core/package.json` exports field + `tsconfig.json` paths.
- Available sub-paths: root (barrel), /stats, /ai, /parser, /findings, /variation, /yamazumi, /tier, /types, /i18n, /glossary, /export, /navigation, /responsive, /performance, /time, /projectMetadata, /strategy, /ui-types, /evidenceMap, /defect.
- `resolveMode()` + `getStrategy()` in `src/analysisStrategy.ts` is the mode dispatch point. New analysis modes must register here.
- The stats engine is the authority for numeric claims. CoScout receives stat results; it does not recompute.
- Numeric safety has three boundaries (ADR-069): B1 parser rejects NaN via `toNumericValue`; B2 stats functions return `undefined`; B3 display uses `formatStatistic`.
- Registering locale loaders (`registerLocaleLoaders`) is an app responsibility — core no longer calls `import.meta.glob` directly.
- The `ai/prompts/coScout/` directory is the canonical CoScout prompt architecture. Entry point is `assembleCoScoutPrompt()` — `buildCoScoutSystemPrompt()` in legacy.ts is deprecated.

## Test command

```bash
pnpm --filter @variscout/core test
```
````

Float assertions use `toBeCloseTo(expected, precision)`. NIST regression tests in `src/stats/__tests__/nistLongley.test.ts` validate against Minitab/JMP reference outputs.

## Skills to consult

- `editing-statistics` — when touching stats/
- `editing-coscout-prompts` — when touching ai/prompts/
- `editing-analysis-modes` — when touching strategy or mode transforms
- `adding-i18n-messages` — when touching i18n/messages/

## Related

- ADR-045 Modular architecture (DDD-lite)
- ADR-047 Analysis mode strategy pattern
- ADR-067 Unified GLM regression (two-pass best subsets)
- ADR-069 Three-boundary numeric safety

````

- [ ] **Step 2: Write `packages/charts/CLAUDE.md.new` (~50 lines)**

File `packages/charts/CLAUDE.md.new`:

```markdown
# @variscout/charts

React + visx chart components. Standard (I-Chart, Boxplot, Pareto), Performance (multi-channel), Yamazumi, Evidence Map.

## Hard rules

- Never hardcode hex colors. Use `chartColors`, `chromeColors`, `operatorColors` from `packages/charts/src/colors.ts`.
- Never add manual `React.memo()` to new chart components. React Compiler (babel-plugin-react-compiler) handles memoization.
- All charts must export both the responsive wrapper (e.g., `IChart`) and the base component (e.g., `IChartBase`). Consumers pick.
- Props interfaces named `{ComponentName}Props`. Never pass data via React context — props-based only.

## Invariants

- Theme via `useChartTheme()` hook. Returns `{ isDark, chrome, colors, fontScale }`. Never read `data-theme` directly.
- Responsive utilities: `getResponsiveMargins(width, chartType)`, `getResponsiveFonts(width)`, `getResponsiveTickCount(size, axis)` from `@variscout/core/responsive`.
- Boxplot auto-switches to jittered dots when a category has < `MIN_BOXPLOT_VALUES` (7) points. Per-category, not per-chart.
- Adaptive category limits: Boxplot uses `MIN_BOX_STEP=50px`; Pareto uses `PARETO_MAX_CATEGORIES=20` with "Others" aggregation.
- I-Chart control-limit violations are force-included in LTTB decimation (never hidden). `lttb()` lives in `@variscout/core/stats`.
- Export dimensions are fixed (see EXPORTS.md in editing-charts skill).

## Test command

```bash
pnpm --filter @variscout/charts test
````

## Skills to consult

- `editing-charts` — primary reference for all chart work
- `editing-evidence-map` — when touching EvidenceMap/
- `editing-analysis-modes` — when touching PerformanceIChart, YamazumiChart, or mode-specific charts

## Related

- ADR-002 Visx charts
- ADR-005 Props-based charts
- ADR-051 Chart many categories
- docs/06-design-system/charts/chart-sizing-guide.md

````

- [ ] **Step 3: Write `packages/hooks/CLAUDE.md.new` (~40 lines)**

File `packages/hooks/CLAUDE.md.new`:

```markdown
# @variscout/hooks

78 shared React hooks: data pipeline, charts, AI, investigation, Evidence Map.

## Hard rules

- All exported hooks named with `use` prefix (React convention).
- Depends on `@variscout/core` only. No imports from `@variscout/ui`, `@variscout/charts`, or apps.
- Tests live in `packages/hooks/src/__tests__/` alongside source, one test file per hook.

## Invariants

- Tests that use translations must call `registerLocaleLoaders()` with `import.meta.glob` before calling `preloadLocale()`. Reference: `packages/core/src/i18n/__tests__/index.test.ts`.
- Hooks that compose shared state (e.g., `useHubComputations`, `useCoScoutProps`) read from `@variscout/stores` selectors, never call `getState()` in render paths.
- `useChartCopy` owns chart export (PNG/SVG/clipboard) dimensions and pixel ratio. Consumers pass a ref.
- `usePopoutChannel` is the canonical BroadcastChannel wrapper. Findings, Improvement, Evidence Map pop-outs all use it.
- Flaky test watch: `packages/hooks/src/__tests__/index.test.ts` can timeout under concurrent Turbo load; passes when run alone.

## Test command

```bash
pnpm --filter @variscout/hooks test
````

## Skills to consult

- `editing-charts` — useChartTheme, useChartCopy, chart data hooks
- `editing-investigation-workflow` — useFindings, useQuestions, useProblemStatement, useHubComputations
- `writing-tests` — i18n loader setup, RTL patterns

## Related

- ADR-041 Zustand feature stores
- ADR-045 Modular architecture

````

- [ ] **Step 4: Write `packages/ui/CLAUDE.md.new` (~50 lines)**

File `packages/ui/CLAUDE.md.new`:

```markdown
# @variscout/ui

80+ shared UI component modules. Base primitives, wrapper bases, store-aware PI Panel tabs.

## Hard rules

- Never nest `<button>` inside `<button>` or `<a>` inside `<a>` — HTML spec violation. Use Fluent UI focusMode pattern (see docs/06-design-system/patterns/interactions.md).
- Functional components only. Props interfaces named `{ComponentName}Props`.
- Use semantic Tailwind classes (`bg-surface-secondary`, `text-content`, `border-edge`) that adapt to `data-theme`. No per-component color-scheme props.

## Invariants

- Naming: `*Base` = shared primitive in @variscout/ui (props-based, no app logic). `*WrapperBase` = app-level composition (combines hooks + Base + app UI). App wrappers in apps/*/ import `*WrapperBase` or `*Base` and add ~50 lines of app-specific wiring.
- @variscout/ui MAY import from @variscout/stores for store-aware tab content components (`StatsTabContent`, `QuestionsTabContent`, `JournalTabContent`). This is a documented exception per ADR-056. Props-based components remain preferred for purely presentational UI.
- PI Panel tabs config via `PIPanelBase` (PITabConfig API). Store-aware tab content is the default.
- Error service (`errorService`) and hooks (`useIsMobile`, `useTheme`, `useGlossary`, `BREAKPOINTS`) are also exported from @variscout/ui.

## Test command

```bash
pnpm --filter @variscout/ui test
````

## Skills to consult

- `editing-evidence-map` — for EvidenceMap components
- `editing-investigation-workflow` — for FindingsWindow, HubComposer, investigation UI
- `writing-tests` — RTL patterns, data-testid conventions

## Related

- ADR-045 Modular architecture
- ADR-056 PI Panel redesign
- ADR-061 HMW brainstorm ideation

````

- [ ] **Step 5: Write `packages/stores/CLAUDE.md.new` (~40 lines)**

File `packages/stores/CLAUDE.md.new`:

```markdown
# @variscout/stores

4 Zustand domain stores: project, investigation, improvement, session.

## Hard rules

- Stores are the source of truth. Components read via selectors: `useProjectStore(s => s.field)`. Never `useProjectStore()` without a selector — it subscribes to the whole store and re-renders too often.
- `investigationStore` owns the `CausalLink` entity. `improvementStore` is for finalized improvement ideas/actions. UI-scoped state (filters, panels, highlights) belongs in app feature stores (apps/azure/src/features/), not here.
- Do not introduce a DataContext — Zustand-first architecture is deliberate (ADR-041).

## Invariants

- sessionStore auto-persists to IndexedDB via middleware. Other stores persist via `useProjectActions` (document-level persist).
- Testing pattern: `beforeEach(() => useStore.setState(useStore.getInitialState()))` to reset between tests. Selectors tested as pure functions.
- Cross-store reads: `otherStore.getState()` inside a selector is allowed but should be mocked in tests.
- Complete list of stores: `projectStore`, `investigationStore`, `improvementStore`, `sessionStore`.

## Test command

```bash
pnpm --filter @variscout/stores test
````

## Skills to consult

- `editing-investigation-workflow` — when touching investigationStore / CausalLinks
- `writing-tests` — Zustand store test pattern

## Related

- ADR-041 Zustand feature stores
- docs/superpowers/specs/2026-04-04-zustand-first-state-architecture-design.md
- docs/superpowers/specs/2026-04-04-zustand-direct-store-access-design.md

````

- [ ] **Step 6: Write `packages/data/CLAUDE.md.new` (~20 lines)**

File `packages/data/CLAUDE.md.new`:

```markdown
# @variscout/data

Sample datasets with pre-computed chart data. No logic.

## Hard rules

- This package contains data only — no computation, no transforms. Any logic belongs in @variscout/core.
- Export every dataset from `src/index.ts`. One named export per dataset file.

## Invariants

- Current samples: coffee, journey, bottleneck, sachets, manufacturing-defects, nistLongley, weld-defects, injection, and ~16 others. See `packages/data/src/samples/`.
- Pre-computed chart data (if any) lives alongside the dataset in its file; do not recompute at app startup.

## Test command

No tests required for this package (pure data).

## Skills to consult

- `editing-monorepo-structure` — when adding a new sample dataset
````

- [ ] **Step 7: Verify line counts**

```bash
wc -l packages/*/CLAUDE.md.new
```

Expected: core ≤85, charts ≤55, hooks ≤45, ui ≤55, stores ≤45, data ≤25.

- [ ] **Step 8: Verify no live files modified**

```bash
ls packages/*/CLAUDE.md 2>/dev/null
```

Expected: no output (no live CLAUDE.md files in packages/ yet).

- [ ] **Step 9: Commit**

```bash
git add packages/*/CLAUDE.md.new
git commit -m "docs(agent-arch): draft 6 package CLAUDE.md.new files

Phase 1 Foundation — auto-loaded when editing package files after Phase 2 swap."
```

---

## Task 5: Draft 2 app `CLAUDE.md.new` files

**Files:**

- Create: `apps/azure/CLAUDE.md.new`
- Create: `apps/pwa/CLAUDE.md.new`

- [ ] **Step 1: Write `apps/azure/CLAUDE.md.new` (~70 lines)**

File `apps/azure/CLAUDE.md.new`:

````markdown
# @variscout/azure-app

Azure Team App — Feature-Sliced Design with Zustand feature stores, IndexedDB + Blob Storage, EasyAuth, App Insights.

## Hard rules

- Never log PII to App Insights or any telemetry. Customer-owned data principle (ADR-059) is strict. Log only structural events (counts, types, durations).
- Never import MSAL or roll your own auth. Azure uses EasyAuth — the `/api/me` endpoint + cookie flow in `server.js`.
- Tailwind v4 requires `@source` directives in `src/index.css` for every shared package with UI (`@source "../../../packages/ui/src/**/*.tsx"`, etc). Responsive utilities (`lg:grid`, `md:flex-row`) silently break without these.
- Don't introduce new top-level directories. Feature-Sliced Design: features/, hooks/, components/, services/, auth/, db/, lib/.

## Invariants

- 6 feature modules in `src/features/`, each with a co-located Zustand feature store suffixed `*FeatureStore` where ambiguity needed: `panels/panelsStore`, `findings/findingsStore`, `investigation/useInvestigationFeatureStore`, `ai/aiStore`, `data-flow/`, `improvement/` (the improvement UI-state store was deleted April 2026; its state moved to `panelsStore`).
- Persistence: IndexedDB via Dexie (`src/db/schema.ts`, `services/localDb.ts`). Blob Storage sync for Team tier (`services/cloudSync.ts`). SAS tokens minted by `/api/storage-token` endpoint in `server.js`.
- App Insights wired at `src/lib/appInsights.ts`. `services/storage.ts` is the facade for both local + cloud.
- Domain stores from `@variscout/stores` are the source of truth for project/investigation/improvement/session data. Feature stores hold UI-only state.
- File Picker: local files only (`components/FileBrowseButton.tsx`). SharePoint picker removed per ADR-059.

## Test command

```bash
pnpm --filter @variscout/azure-app test
```
````

E2E tests via Playwright: `pnpm --filter @variscout/azure-app test:e2e`.

## Skills to consult

- `editing-azure-storage-auth` — for any auth, storage, or cloud sync changes
- `editing-investigation-workflow` — for editor/InvestigationMapView, HubComposer, etc.
- `writing-tests` — E2E data-testid conventions

## Related

- ADR-041 Zustand feature stores
- ADR-043 Teams entry experience
- ADR-059 Web-first deployment architecture
- docs/08-products/azure/authentication.md
- docs/08-products/azure/blob-storage-sync.md

````

- [ ] **Step 2: Write `apps/pwa/CLAUDE.md.new` (~30 lines)**

File `apps/pwa/CLAUDE.md.new`:

```markdown
# @variscout/pwa

Free PWA. Session-only (no persistence), Context-based state, education tier.

## Hard rules

- No persistence. No IndexedDB, no localStorage, no cloud sync. Session ends, data is gone. This is the product principle.
- Tailwind v4 requires `@source` directives in `src/index.css` for shared packages (`@source "../../../packages/ui/src/**/*.tsx"`, etc).
- Free tier only — branding is shown in chart footers (`isPaidTier()` from `@variscout/core/tier` returns false).

## Invariants

- State via React Context (`DataContext`). No Zustand stores in PWA.
- Embedded mode supported for iframes (see flows in `docs/02-journeys/flows/pwa-education.md`).
- Entry: `src/components/Dashboard.tsx`.

## Test command

```bash
pnpm --filter @variscout/pwa test
````

E2E: `pnpm --filter @variscout/pwa test:e2e`.

## Skills to consult

- `writing-tests` — RTL patterns, E2E data-testid conventions

## Related

- ADR-004 Offline-first
- ADR-012 PWA browser-only
- ADR-033 Pricing simplification

````

- [ ] **Step 3: Verify**

```bash
wc -l apps/*/CLAUDE.md.new
ls apps/*/CLAUDE.md 2>/dev/null
````

Expected: azure ≤75, pwa ≤35; no live CLAUDE.md in apps/.

- [ ] **Step 4: Commit**

```bash
git add apps/azure/CLAUDE.md.new apps/pwa/CLAUDE.md.new
git commit -m "docs(agent-arch): draft 2 app CLAUDE.md.new files (azure + pwa)

Phase 1 Foundation."
```

---

## Task 6: Draft Tier 1 human narrative — `docs/OVERVIEW.md`

**Files:**

- Create: `docs/OVERVIEW.md`

**Length target:** ~600 words.
**Curation sources:** `docs/01-vision/product-overview.md`, `docs/01-vision/constitution.md`, `docs/01-vision/philosophy.md`, `docs/01-vision/methodology.md`, `docs/08-products/feature-parity.md`, `docs/08-products/tier-philosophy.md`.
**Audience:** Someone returning to VariScout after absence. Needs to re-understand what the product does, the journey model, the modes, and the tier structure.

- [ ] **Step 1: Write OVERVIEW.md**

File `docs/OVERVIEW.md`:

```markdown
---
title: VariScout — What It Does In Practice
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-17
related: [product-overview, modes, tiers, coscout, journey]
---

# VariScout — What It Does In Practice

VariScout is **structured investigation for process improvement**. A browser-based, offline-first tool for quality engineers, lean practitioners, and analysts to explore variation in process data, identify suspected causes, and drive improvement actions. Data stays in the customer's environment throughout.

## The journey model

Every investigation follows one spine: **FRAME → SCOUT → INVESTIGATE → IMPROVE**.

- **FRAME.** User states the problem (data-first or hypothesis-first entry). CoScout helps articulate.
- **SCOUT.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **INVESTIGATE.** User picks suspected causes — data-derived, gemba-observed, or expert-supplied — and examines each with Evidence Map, statistics, and targeted questions. Journal accumulates findings.
- **IMPROVE.** Hubs of evidence converge on improvement ideas. Prioritization by impact × feasibility. Action items captured.

The spine never changes. Analysis modes vary the tools used inside each phase.

## The six analysis modes

1. **Standard** (default). Continuous measurement data. I-Chart, Boxplot, Pareto, Stats panel. Most common entry point — quality engineers, analysts, students.
2. **Capability.** Cp/Cpk against specifications. Histogram, probability plot. Optional subgroup capability (ADR-038). Used for process qualification and SPC.
3. **Yamazumi** (lean). Activity-level cycle time analysis. Stacked bars by VA/NVA/Waste/Wait (fixed colors), takt line, rebalancing targets. Used by industrial engineers and continuous improvement leads.
4. **Performance** (multi-channel). Fill heads, cavities, nozzles. Per-channel Cpk scatter, cross-channel Boxplot comparison, worst-first Pareto. Used by process engineers monitoring multi-stream equipment.
5. **Defect** (events → rates). Event logs transformed into defect rates per time unit. Pareto of defect types, cross-type evidence map. Used by quality engineers tracking PPM.
6. **Process Flow** (design-only, not yet coded). Intended for process-level bottleneck analysis and flow diagnostics.

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout's methodology coaching adapts per mode.

## The three tiers

| Tier           | Distribution      | Price   | Capability                                                           |
| -------------- | ----------------- | ------- | -------------------------------------------------------------------- |
| PWA            | Public URL        | Free    | Full analysis, session-only, no persistence. Training and education. |
| Azure Standard | Azure Marketplace | €79/mo  | Full analysis + CoScout AI, local (IndexedDB) persistence.           |
| Azure Team     | Azure Marketplace | €199/mo | + Teams entry, Blob Storage sync, Knowledge Base.                    |

Same analytical capability everywhere. Tier changes collaboration, persistence, and AI.

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override. CoScout is modular (tier1/2/3 prompt layering), mode-aware (methodology coaching varies by analysis mode), and tool-calling (25-tool registry gated by phase/mode/tier).

## Customer-owned data

Processing happens in the browser. When data moves (Blob Storage sync, AI calls), it stays in the customer's Azure tenant — no VariScout-operated cloud. This is a core product principle, not a feature.

## Where to go next

- User flows and personas: `USER-JOURNEYS.md`
- Data lifecycle (parse → stats → persist → sync): `DATA-FLOW.md`
- Mode-specific journeys: `USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`
- Feature parity table: `docs/08-products/feature-parity.md`
- Constitution (10 principles): `docs/01-vision/constitution.md`
```

- [ ] **Step 2: Verify**

```bash
wc -w docs/OVERVIEW.md
grep -c "^##" docs/OVERVIEW.md
```

Expected: word count ~550–650; at least 6 sections.

- [ ] **Step 3: Commit**

```bash
git add docs/OVERVIEW.md
git commit -m "docs(agent-arch): draft Tier 1 human narrative — OVERVIEW.md

Phase 1 Foundation — curated from existing vision docs. @imported by root CLAUDE.md.new."
```

---

## Task 7: Draft Tier 1 human narrative — `docs/USER-JOURNEYS.md`

**Files:**

- Create: `docs/USER-JOURNEYS.md`

**Length target:** ~800 words.
**Curation sources:** all 10 files in `docs/02-journeys/personas/`, top 6 flows in `docs/02-journeys/flows/` (first-time, return-visitor, azure-daily-use, pwa-education, factor-intelligence, azure-first-analysis).
**Required sections:** The 10 personas (1 line each), The unified journey spine, Per-mode distinctive experience (one short paragraph per mode + link to Tier 2 doc).

- [ ] **Step 1: Write USER-JOURNEYS.md**

File `docs/USER-JOURNEYS.md`:

```markdown
---
title: VariScout User Journeys — Personas & Flows
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-17
related: [personas, flows, journey, modes]
---

# VariScout User Journeys — Personas & Flows

Ten personas drive VariScout's design decisions. Each follows the same journey spine (FRAME → SCOUT → INVESTIGATE → IMPROVE); the tools they use inside each phase vary by analysis mode.

## The ten personas

1. **Analyst Alex** — data analyst, uses Standard mode, lives in statistics and charts.
2. **Engineer Eeva** — process engineer, uses Capability + Performance modes, specs-driven.
3. **Green-Belt Gary** — Six Sigma green-belt, formal DMAIC, uses multiple modes across a project.
4. **OpEx Olivia** — operational excellence lead, portfolio view, uses Project Dashboard.
5. **Trainer Tina** — facilitator, uses PWA tier for workshops and classroom exercises.
6. **Student Sara** — first-time learner, uses PWA, embedded or standalone.
7. **Curious Carlos** — discovery mode, exploratory, comes in via content or SEO.
8. **Evaluator Erik** — prospective buyer, evaluating the product for a team.
9. **Admin Aino** — Azure admin, provisions tenants, manages access, reviews telemetry.
10. **Field Fiona** — gemba observer, captures photos and notes on the floor (mobile flows).

Full persona details: `docs/02-journeys/personas/`.

## The unified journey spine

Every investigation — Standard, Yamazumi, Performance, Defect, Capability, or Process Flow — follows this spine:

1. **FRAME.** User names the problem. Three entry points per P5 (amended constitution): upfront hypothesis, evidence-ranked from data (Factor Intelligence), or observation-triggered (from a Four Lenses finding). Problem Statement captures Watson's 3 Qs.

2. **SCOUT.** Data is parsed (wide-form, stack columns, defect events all supported). Characteristic types inferred. The Four Lenses surface variation patterns. First hypotheses emerge.

3. **INVESTIGATE.** User picks one or more suspected causes — the SuspectedCause hub model (ADR-064) is the organizing entity. Each hub accumulates evidence: data (Evidence Map edges with R²adj from best-subsets regression), gemba (photos, notes), expert knowledge. The investigation spine has three threads (ADR-066): regression discovery, hub UX, EDA heartbeat.

4. **IMPROVE.** Hubs with strong evidence become HMW ("How Might We") brainstorming starters. Ideas prioritized by timeframe × cost × risk × impact (ADR-035). Selected ideas become action items; implementation captured, outcome compared to prediction via What-If Explorer.

## Per-mode distinctive experience

### Standard mode

The default for Alex, Gary, and most Azure Standard tier users. Entry: paste or upload data, map columns. Dashboard: I-Chart for time order, Boxplot for factor comparison, Pareto for category pile-up, Stats panel with Cp/Cpk/mean/sigma. Investigation proceeds by picking factors from Pareto ranks or Boxplot outliers, drilling into Evidence Map edges. Covered in this document; no separate mode journey doc.

### Yamazumi mode

Lean practitioners (industrial engineers, continuous improvement leads). Timing activities at each step, classifying each minute as Value-Adding, Necessary NVA, Waste, or Wait. Stacked yamazumi bars reveal which steps exceed takt. Rebalancing and waste elimination targets emerge from gaps to takt. **Deep journey:** `USER-JOURNEYS-YAMAZUMI.md`.

### Performance mode

Multi-channel analysts (injection molding cavities, filling heads, nozzles). Per-channel Cpk plotted; worst channels surface in Pareto. Cross-channel Boxplot shows distribution drift. Drill into a single channel for capability deep-dive. **Deep journey:** `USER-JOURNEYS-PERFORMANCE.md`.

### Defect mode

Quality engineers tracking PPM. Raw defect event logs are transformed into rates per time unit (mode transform runs during import; DefectDetectedModal confirms). Pareto of defect types, cross-type Evidence Map revealing patterns across multiple defect categories. **Deep journey:** `USER-JOURNEYS-DEFECT.md`.

### Capability mode

Quality engineers computing Cp/Cpk against specifications. Histogram + probability plot + capability statistics. Subgroup capability (ADR-038) when a subgroup column is mapped — Cp/Cpk/Pp/Ppk split by common-cause vs total variation. **Deep journey:** `USER-JOURNEYS-CAPABILITY.md`.

### Process Flow mode

Designed but not coded. Intended for bottleneck analysis across process steps. **Design reference:** `USER-JOURNEYS-PROCESS-FLOW.md`.

## Canonical flows

- **First-time user (any tier):** `docs/02-journeys/flows/first-time.md`
- **Returning user (Azure):** `docs/02-journeys/flows/return-visitor.md` + `project-reopen.md`
- **Azure daily use:** `docs/02-journeys/flows/azure-daily-use.md`
- **PWA education/workshop:** `docs/02-journeys/flows/pwa-education.md`
- **Factor Intelligence discovery:** `docs/02-journeys/flows/factor-intelligence.md`

Thirteen additional flows (distribution-specific: SEO, content, social, enterprise, mobile) in `docs/02-journeys/flows/`. These are reference, not orientation.
```

- [ ] **Step 2: Verify**

```bash
wc -w docs/USER-JOURNEYS.md
grep -c "^##" docs/USER-JOURNEYS.md
```

Expected: word count ~750–900; at least 4 top-level sections.

- [ ] **Step 3: Commit**

```bash
git add docs/USER-JOURNEYS.md
git commit -m "docs(agent-arch): draft Tier 1 human narrative — USER-JOURNEYS.md

Phase 1 Foundation — curated from docs/02-journeys/personas and flows. @imported by root CLAUDE.md.new."
```

---

## Task 8: Draft Tier 1 human narrative — `docs/DATA-FLOW.md`

**Files:**

- Create: `docs/DATA-FLOW.md`

**Length target:** ~600 words.
**Curation sources:** `docs/05-technical/architecture/data-flow.md`, `docs/05-technical/architecture/data-pipeline-map.md`, `docs/03-features/data/`, `docs/08-products/azure/blob-storage-sync.md`, `docs/08-products/azure/authentication.md`, ADR-059.
**Required sections:** Parse boundary (B1), Stats engine, Persistence (per tier), Sync (Azure Team), Customer-owned principle.

- [ ] **Step 1: Write DATA-FLOW.md**

File `docs/DATA-FLOW.md`:

```markdown
---
title: VariScout Data Lifecycle
audience: [engineer]
category: architecture
status: stable
last-reviewed: 2026-04-17
related: [data-flow, persistence, sync, customer-owned, blob-storage, indexeddb, easyauth]
---

# VariScout Data Lifecycle

Data enters VariScout in the browser, stays in the browser for analysis, and — on paid tiers — can sync to storage **in the customer's own Azure tenant**. No data ever touches VariScout-operated cloud infrastructure. This is the **customer-owned data** principle, and every architectural decision downstream respects it.

## 1. Parse boundary (B1 — the first numeric gate)

Users paste text, upload CSV, or drag a file. `packages/core/src/parser/` detects columns, types, wide-form stacks (ADR-050), and defect formats (ADR-066). The parser applies the first numeric-safety boundary:

- `toNumericValue()` rejects `NaN` and returns `undefined` for unparseable values.
- Column types are inferred: continuous, categorical, ordinal, date, stack.
- Wide-form headers are unpacked into long-form on the fly where needed.

**No value flagged as unparseable is silently zeroed.** Downstream code sees `undefined` or a valid number.

## 2. Mode transforms (pre-stats aggregation)

Two modes apply a transform between parse and stats:

- **Yamazumi:** `computeYamazumiData()` aggregates raw timing observations into per-step × activity-type stacked totals.
- **Defect:** `computeDefectRates()` aggregates defect event logs into rates per time unit. Triggered when `detectDefectFormat()` identifies the input shape during import; user confirms via `DefectDetectedModal`.

Other modes pass raw parsed data straight to stats.

## 3. Stats engine (B2 — the second numeric gate)

`packages/core/src/stats/` computes descriptive stats, capability (Cp/Cpk/Pp/Ppk), ANOVA, OLS regression, Evidence Map R²adj, control limits, probability plot positions, and more. All stats functions return `number | undefined` — **never `NaN` or `Infinity`**. `safeMath.ts` (safeDivide, safeLog, safeSqrt) is the standard primitive.

Two-pass best subsets with interaction screening (ADR-067) drives Evidence Map. NIST Longley benchmark validates regression against Minitab/JMP.

## 4. Persistence (varies by tier)

| Tier           | Storage                      | Scope                                                         |
| -------------- | ---------------------------- | ------------------------------------------------------------- |
| PWA            | None                         | Session-only. Refresh = data gone. Intentional.               |
| Azure Standard | IndexedDB (local to browser) | Project lives on the user's device. Persists across sessions. |
| Azure Team     | IndexedDB + Blob Storage     | Same as Standard, plus cross-device sync.                     |

IndexedDB schema in `apps/azure/src/db/schema.ts` (Dexie). `services/localDb.ts` is the facade. sessionStore from `@variscout/stores` persists UI session state via middleware; document-level persistence goes through `useProjectActions` (domain stores).

## 5. Sync (Azure Team only)

`services/cloudSync.ts` pushes/pulls project documents to/from Blob Storage in the **customer's tenant**. Flow:

1. User authenticates via EasyAuth (`/api/me` returns identity). No MSAL in the client.
2. Client calls `/api/storage-token` (in `apps/azure/server.js`). Server mints a short-lived SAS token scoped to the user's container.
3. Client uses SAS to read/write blobs directly. VariScout server never sees the data.
4. Conflict resolution: last-write-wins at document level. Granular CRDT-style merge is deferred.

SAS lifetime, container structure, and RBAC rules: `docs/08-products/azure/blob-storage-sync.md`.

## 6. Display boundary (B3 — the third numeric gate)

UI code never calls `.toFixed()` on stat values. `formatStatistic()` from `@variscout/core/i18n` guards every displayed number with `Number.isFinite()` and locale-aware formatting. ESLint enforces this (in Phase 3 of the doc architecture migration; currently a text convention).

## 7. AI boundary (CoScout)

CoScout calls leave the browser but stay in the customer's tenant (Azure OpenAI endpoint provisioned in the customer's subscription). Prompts include investigation state (findings, hubs, causal links, evidence map topology) but **never raw data rows beyond what the user has exposed in charts**. Visual grounding markers (ADR-057) reference chart elements by ID, not data. Tool calls (25-tool registry) return structured diffs the user confirms before applying.

## 8. Telemetry (App Insights — Azure only)

`apps/azure/src/lib/appInsights.ts`. Logs structural events (mode changes, feature usage counts, durations) — **never PII, never raw data**. Telemetry violations are a priority fix.

## Trust chain summary

Parse → transform → stats → persist → sync → display → AI. Every boundary either validates or passes through, never silently corrupts. Three numeric gates (B1, B2, B3) guarantee no `NaN`/`Infinity` reaches the user. Customer-owned principle guarantees no data leaves customer tenant.

## Reference

- ADR-023 Data lifecycle
- ADR-050 Wide-form stack columns
- ADR-059 Web-first deployment architecture
- ADR-069 Three-boundary numeric safety
- docs/05-technical/architecture/data-flow.md
- docs/05-technical/architecture/data-pipeline-map.md
- docs/08-products/azure/blob-storage-sync.md
```

- [ ] **Step 2: Verify**

```bash
wc -w docs/DATA-FLOW.md
grep -c "^##" docs/DATA-FLOW.md
```

Expected: word count ~600–750; at least 8 sections.

- [ ] **Step 3: Commit**

```bash
git add docs/DATA-FLOW.md
git commit -m "docs(agent-arch): draft Tier 1 human narrative — DATA-FLOW.md

Phase 1 Foundation — curated from architecture docs + ADRs. @imported by root CLAUDE.md.new."
```

---

## Task 9: Draft 5 Tier 2 per-mode journey docs

**Files (all created in this task):**

- Create: `docs/USER-JOURNEYS-YAMAZUMI.md`
- Create: `docs/USER-JOURNEYS-PERFORMANCE.md`
- Create: `docs/USER-JOURNEYS-DEFECT.md`
- Create: `docs/USER-JOURNEYS-CAPABILITY.md`
- Create: `docs/USER-JOURNEYS-PROCESS-FLOW.md`

**Common template** — every file in this task follows this exact structure:

```markdown
---
title: {Mode} Mode — User Journey
audience: [engineer, analyst]
category: reference
status: stable (or: design — for process-flow)
last-reviewed: 2026-04-17
related: [{mode}, journey, {2-3 more tags}]
---

# {Mode} Mode — User Journey

## Who uses this mode

{2–3 sentence persona pass with specific roles}

## What they want to achieve

{2–3 sentences on the job-to-be-done}

## How they use VariScout for it

{Walkthrough of the path: entry → data step → analysis step → insight → handoff to improvement}

## What makes this mode distinctive

- {3–5 bullets on what's unique: chart types, transforms, coaching, constraints}

## Design reference

- **Spec:** {path to design spec}
- **ADR:** {relevant ADR(s)}
- **Code:** {key code paths in packages/core and packages/charts}
```

Length target per file: 500–700 words.

- [ ] **Step 1: Write `docs/USER-JOURNEYS-YAMAZUMI.md`**

Sources: `docs/03-features/analysis/yamazumi.md`, ADR-034, `docs/superpowers/specs/2026-03-20-yamazumi-analysis-mode-design.md`, `docs/superpowers/specs/2026-03-21-yamazumi-reporting-design.md`. Focus on: lean practitioner persona, activity classification journey, takt comparison, rebalancing insight. Mention fixed VA/NVA/Waste/Wait colors, `computeYamazumiData()` transform, taktTime line, idle time as a first-class metric, per-step stacked bars. Include a line about when dots fall back from boxplot (N<7).

- [ ] **Step 2: Write `docs/USER-JOURNEYS-PERFORMANCE.md`**

Sources: `docs/03-features/analysis/performance-mode.md`, `docs/03-features/workflows/performance-mode-workflow.md`. Focus on: multi-channel analyst (fill heads, cavities, nozzles), per-channel Cpk scatter, cross-channel Boxplot, worst-first Pareto, drill-down to single-channel capability. Mention `ChannelResult[]`, `selectedMeasure`, up to 5 channels in Boxplot, up to 20 in Pareto.

- [ ] **Step 3: Write `docs/USER-JOURNEYS-DEFECT.md`**

Sources: `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md`, `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md`. Focus on: quality engineer tracking PPM, raw event log entry, `detectDefectFormat()` → `DefectDetectedModal`, `computeDefectRates()` transform, Pareto by defect type, cross-type Evidence Map. Mention the three-view model (single-type / cross-type / merged).

- [ ] **Step 4: Write `docs/USER-JOURNEYS-CAPABILITY.md`**

Sources: `docs/03-features/analysis/capability.md`, `docs/03-features/analysis/subgroup-capability.md`, ADR-038, `docs/superpowers/specs/2026-03-21-capability-time-subgrouping.md`. Focus on: quality engineer computing Cp/Cpk, setting specs (LSL/USL/target), histogram + probability plot interpretation, subgroup capability (Cp vs Pp, Cpk vs Ppk, common-cause vs total), when to use. **Include how-to elements:** step-by-step for setting specs, interpreting a failed Cpk, deciding if process is capable.

- [ ] **Step 5: Write `docs/USER-JOURNEYS-PROCESS-FLOW.md`**

Sources: `docs/03-features/` (if process-flow entry exists), most recent process-flow design spec in `docs/superpowers/specs/`. Mark `status: design` in frontmatter. State clearly: "This mode is designed but not yet coded. Journey described is the intended experience when implementation ships." Focus on: bottleneck analyst persona, process step mapping, queue/wait visualization, throughput diagnostics. Length can be shorter (~500 words) since it's forward-looking.

- [ ] **Step 6: Verify all 5 files**

```bash
wc -w docs/USER-JOURNEYS-*.md
```

Expected: each file 500–750 words.

```bash
for f in docs/USER-JOURNEYS-*.md; do
  head -10 "$f" | grep -q "^last-reviewed: 2026-04-17" || echo "MISSING FRONTMATTER: $f"
done
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add docs/USER-JOURNEYS-YAMAZUMI.md docs/USER-JOURNEYS-PERFORMANCE.md docs/USER-JOURNEYS-DEFECT.md docs/USER-JOURNEYS-CAPABILITY.md docs/USER-JOURNEYS-PROCESS-FLOW.md
git commit -m "docs(agent-arch): draft 5 Tier 2 per-mode journey docs

Phase 1 Foundation — yamazumi, performance, defect, capability, process-flow (design-only placeholder)."
```

---

## Task 10: Phase 1 gate verification

**Files:**

- Read: all files created in Tasks 1–9

This task verifies Phase 1 output before handing off to Phase 2. No code changes.

- [ ] **Step 1: Verify full test suite still passes**

```bash
pnpm test 2>&1 | tail -10
```

Expected: exit code 0, test count unchanged from baseline (5792), no regressions.

- [ ] **Step 2: Verify build still succeeds**

```bash
pnpm build 2>&1 | tail -20
```

Expected: exit code 0, all packages and apps build cleanly.

- [ ] **Step 3: Verify no live agent-config files were modified**

```bash
git diff HEAD~10..HEAD -- CLAUDE.md .claude/rules/ MEMORY.md 2>&1
```

Expected: no diff output (or confirm all commits in this phase only added `.new` files, new skills/, and new docs/ files — never touched live CLAUDE.md, rules, or MEMORY.md).

- [ ] **Step 4: Count created files**

```bash
ls .claude/skills/*/SKILL.md | wc -l
ls packages/*/CLAUDE.md.new | wc -l
ls apps/*/CLAUDE.md.new | wc -l
ls docs/OVERVIEW.md docs/USER-JOURNEYS.md docs/DATA-FLOW.md 2>/dev/null | wc -l
ls docs/USER-JOURNEYS-*.md | wc -l
ls CLAUDE.md.new 2>/dev/null
```

Expected:

- 12 (skills)
- 6 (package CLAUDE.md.new)
- 2 (app CLAUDE.md.new)
- 3 (Tier 1 docs)
- 5 (Tier 2 docs)
- `CLAUDE.md.new` exists

- [ ] **Step 5: 15-minute readability self-test**

Open `docs/OVERVIEW.md` + `docs/USER-JOURNEYS.md` + `docs/DATA-FLOW.md`. Read them in order. Check:

- Can a newcomer explain what VariScout does, the 6 modes, and the tier structure after reading OVERVIEW? (Y/N)
- Can a newcomer name the 10 personas and 4 journey phases after reading USER-JOURNEYS? (Y/N)
- Can a newcomer trace a data value from parse to display after reading DATA-FLOW? (Y/N)

If any answer is N, revise the relevant doc and recommit.

- [ ] **Step 6: Run existing doc health check**

```bash
bash scripts/check-doc-health.sh 2>&1 | tail -20
```

Expected: exit code 0, no new broken links, spec index is current (the 2026-04-17 agent-docs-architecture spec was added in the brainstorming step).

- [ ] **Step 7: Verify frontmatter on all new docs**

```bash
for f in docs/OVERVIEW.md docs/USER-JOURNEYS.md docs/DATA-FLOW.md docs/USER-JOURNEYS-*.md docs/09-baseline/2026-04-17-agent-docs-baseline.md; do
  head -1 "$f" | grep -q "^---$" || echo "MISSING FRONTMATTER: $f"
done
```

Expected: no output.

- [ ] **Step 8: Write Phase 1 completion note**

Append to `docs/09-baseline/2026-04-17-agent-docs-baseline.md`:

```markdown
## Phase 1 Completion

**Date completed:** {FILL-IN}
**Status:** Phase 1 Foundation delivered. All files created as `.new` variants or new docs. Old system fully operational.

**Files created:**

- 12 skills with frontmatter-only SKILL.md
- 8 package/app CLAUDE.md.new drafts
- 1 root CLAUDE.md.new draft
- 3 Tier 1 human narrative docs (OVERVIEW, USER-JOURNEYS, DATA-FLOW)
- 5 Tier 2 per-mode journey docs

**Tests:** 5792/5792 passing.
**Build:** clean.
**Readability self-test:** passed.

**Next phase:** Phase 2 — populate skill SKILL.md bodies + atomic switchover. See `docs/superpowers/plans/` for Phase 2 plan (to be written).
```

- [ ] **Step 9: Final Phase 1 commit**

```bash
git add docs/09-baseline/2026-04-17-agent-docs-baseline.md
git commit -m "docs(agent-arch): Phase 1 Foundation complete

- 12 skills scaffolded (frontmatter only)
- 8 package/app CLAUDE.md.new drafts
- 1 root CLAUDE.md.new draft
- 3 Tier 1 human narrative docs
- 5 Tier 2 per-mode journey docs
- Zero deletions, zero live file changes, tests still pass 5792/5792

Phase 2 (population + switchover) to follow in a separate plan."
```

---

## Phase 1 Summary

**What shipped:**

- Full scaffolding of A++ architecture as a fully additive delta
- Zero breaking changes; old agent-facing system unchanged and active
- Readable human comprehension layer (8 narrative docs)
- Reversible — any commit in this phase can be reverted without affecting live agent behavior

**What didn't ship (deliberately):**

- Skill SKILL.md bodies are empty (frontmatter-only)
- `.new` files are not yet active — live CLAUDE.md still in effect
- `.claude/rules/` not deleted (Phase 3)
- `docs/archive/` not deleted (Phase 3)
- ESLint plugins not implemented (Phase 3)
- Hooks not implemented (Phase 3)

**Sign-off criteria:** All Task 10 checks pass. Next plan (Phase 2) can then be written against the now-existing scaffold.

---

## Self-Review Notes

This plan was self-reviewed against `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md`:

**Spec coverage:**

- Layer 1 (root CLAUDE.md ≤50 lines): Task 3 ✓
- Layer 2 (8 per-package CLAUDE.mds): Tasks 4–5 ✓
- Layer 3 (12 skills with descriptions): Task 2 ✓ (bodies deferred to Phase 2 per spec)
- Tier 1 human docs (3): Tasks 6–8 ✓
- Tier 2 per-mode journey docs (5): Task 9 ✓
- Baseline measurement (pre-migration): Task 1 ✓
- Phase 1 gate (fully additive, zero breakage): Task 10 ✓

**Deferred to later plans** (matches spec's phase plan):

- Skill body population → Phase 2 plan
- Skill reference files (EXPORTS, COLORS; YAMAZUMI, PERFORMANCE, DEFECT, PROCESS-FLOW) → Phase 2 plan
- Atomic swap → Phase 2 plan
- ESLint plugins → Phase 3 plan
- Pre-commit/pre-edit hooks → Phase 3 plan
- `.claude/rules/` deletion → Phase 3 plan
- `docs/archive/` deletion → Phase 3 plan
- MEMORY.md scope reduction → Phase 3 plan
- CI gate → Phase 3 plan

**Placeholders checked:** Two `{FILL-IN}` markers intentionally remain — both in Task 1 Step 4 (baseline measurements filled during execution) and Task 10 Step 8 (date of completion). These are not plan gaps; they are execution-time data.

**Type consistency:** N/A (markdown-only plan, no type references).

**Commit discipline:** 8 commits across Tasks 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 — one per logical deliverable group. Meets "frequent commits" principle without fragmenting related files.
