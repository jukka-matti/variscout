---
title: 'Agent Docs Architecture — Phase 2: Migration'
status: delivered
date: 2026-04-17
---

# Agent-Facing Documentation Architecture — Phase 2 (Migration + Switchover) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Populate the 12 skill SKILL.md bodies drafted in Phase 1, add 6 skill reference files (EXPORTS.md + COLORS.md for `editing-charts`; YAMAZUMI.md + PERFORMANCE.md + DEFECT.md + PROCESS-FLOW.md for `editing-analysis-modes`), then atomically swap the 9 `CLAUDE.md.new` files (root + 8 package/app) into live position while preserving old versions as `.bak`. At end of Phase 2, the A++ architecture is active. Phase 3 adds enforcement and deletes obsolete files.

**Architecture:** Skill body content is synthesized from three sources: (1) existing `.claude/rules/*.md` files for skills that directly replace a rule file (charts, testing, ruflo, maintaining-documentation, monorepo); (2) ADRs and design specs for new skills (statistics, coscout-prompts, evidence-map, investigation-workflow, azure-storage-auth, analysis-modes, i18n). Content is terse, imperative, technically concrete — follows Anthropic's skill-authoring best practices (≤500 lines per SKILL.md body, reference files one level deep, TOC required for references >100 lines).

**Tech Stack:** Markdown only. Pre-commit hook `pnpm docs:check` runs on each commit. Vitest suite (5818 tests) must stay green throughout.

**Reference spec:** `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md`
**Predecessor plan:** `docs/superpowers/plans/2026-04-17-agent-docs-architecture-phase1-foundation.md` (delivered 2026-04-17, baseline at `docs/09-baseline/2026-04-17-agent-docs-baseline.md`)

---

## File Structure — Phase 2 deliverables

**Skill body population (12 SKILL.md files modified in place):**

- `.claude/skills/editing-charts/SKILL.md` — body populated + `EXPORTS.md` + `COLORS.md` created
- `.claude/skills/editing-statistics/SKILL.md` — body populated
- `.claude/skills/editing-coscout-prompts/SKILL.md` — body populated
- `.claude/skills/editing-evidence-map/SKILL.md` — body populated
- `.claude/skills/editing-investigation-workflow/SKILL.md` — body populated
- `.claude/skills/editing-azure-storage-auth/SKILL.md` — body populated
- `.claude/skills/editing-analysis-modes/SKILL.md` — body populated + `YAMAZUMI.md` + `PERFORMANCE.md` + `DEFECT.md` + `PROCESS-FLOW.md` created
- `.claude/skills/writing-tests/SKILL.md` — body populated
- `.claude/skills/adding-i18n-messages/SKILL.md` — body populated
- `.claude/skills/maintaining-documentation/SKILL.md` — body populated
- `.claude/skills/using-ruflo/SKILL.md` — body populated
- `.claude/skills/editing-monorepo-structure/SKILL.md` — body populated

**Atomic swap (9 live files replaced, old preserved as `.bak`):**

- `/CLAUDE.md` ← `/CLAUDE.md.new` (old: 181 lines → new: 50 lines; old → `/CLAUDE.md.bak`)
- `packages/{core,charts,hooks,ui,stores,data}/CLAUDE.md` ← `packages/*/CLAUDE.md.new` (new live files; no prior live version)
- `apps/{azure,pwa}/CLAUDE.md` ← `apps/*/CLAUDE.md.new` (new live files; no prior live version)

**Preserved unchanged:**

- `.claude/rules/*.md` (all 6 files) — stays active until Phase 3 deletion. Acts as belt-and-suspenders during Phase 2.
- `docs/archive/` — untouched until Phase 3.
- `MEMORY.md` (user-level) — untouched until Phase 3.
- All Tier 1 + Tier 2 narrative docs, all ADRs, all specs — untouched.

---

## Conventions used in this plan

- **Skill body contract:** Every SKILL.md body follows the same structural backbone: `# Skill Name` → `## When this skill applies` (2-3 sentences) → `## Core patterns` → `## Gotchas` (non-obvious failure modes) → `## Reference`. Length ≤500 lines per Anthropic guidance.
- **Reference file contract:** Tables, lookup data, long code examples live in `.md` files one level deep from SKILL.md. Each reference file >100 lines starts with a TOC.
- **Gotchas section is mandatory.** Anthropic's skill best-practices guide: "The most valuable content in any skill is the Gotchas section." Every skill must have 3-6 gotchas drawn from real VariScout patterns.
- **No fluff.** Per Anthropic: "Claude is already very smart. Only add context Claude doesn't already have." Skip explanations Claude can infer.
- **One commit per skill** for clear revert granularity. Atomic swap is its own commit.
- **Commit message style:** `docs(agent-arch): populate {skill-name} skill body` (or `chore(agent-arch): atomic swap CLAUDE.md files` for the swap task).
- **Co-Authored-By trailer** required on every commit: `Co-Authored-By: ruflo <ruv@ruv.net>`.

---

## Sequencing strategy

Tasks 1–12 populate skills. They are mostly independent — each skill is a standalone deliverable. Tasks can run in any order, though for clarity this plan presents them grouped by complexity: **mechanical migrations** (Tasks 1–5, direct from `.claude/rules/*.md`) come first, **synthesis skills** (Tasks 6–11) next, **editing-analysis-modes with 4 reference files** (Task 12) is biggest. Task 13 is the atomic swap. Task 14 is verification.

**Important:** Do not run atomic swap (Task 13) until Tasks 1–12 are all committed. Skill bodies are the subject of the swap's value proposition — activating CLAUDE.md.new files without populated skills means the agent loses `.claude/rules/` eager-loaded content with no semantic skill fallback.

---

## Task 1: Populate `editing-charts` skill body + 2 reference files

**Files:**

- Modify: `.claude/skills/editing-charts/SKILL.md` (replace comment body)
- Create: `.claude/skills/editing-charts/EXPORTS.md`
- Create: `.claude/skills/editing-charts/COLORS.md`

**Sources to read before writing:**

- `.claude/rules/charts.md` (278 lines — primary source; condense and restructure into SKILL.md body + 2 reference files)
- `packages/charts/src/colors.ts` (exact color constants)
- `packages/hooks/src/useChartCopy.ts` (export dimensions reference)

- [ ] **Step 1: Write `.claude/skills/editing-charts/SKILL.md` body**

Replace the HTML comment placeholder with a body that follows this structure:

```markdown
---
name: editing-charts
description: Use when editing packages/charts/ or chart wrappers in apps. Chart component patterns (Base + responsive wrapper), theme-aware colors via useChartTheme, chartColors/chromeColors constants, export dimensions, Pareto/Boxplot overflow for many categories, LTTB decimation, chart annotations, dot plot fallback for small N, violin mode, boxplot sorting.
---

# Editing Charts

## When this skill applies

Triggered when editing `packages/charts/**` or any chart wrapper in `apps/*/`.

## Core patterns

[condense from rules/charts.md: component pattern (Base + wrapper, both exported), props interface naming, theme via useChartTheme (NOT data-theme attribute), responsive utilities from @variscout/core/responsive, adaptive category limits (boxplot MIN_BOX_STEP=50px, pareto max 20 + "Others"), dot plot fallback (N<7 per category), LTTB decimation (force-include violations), chart annotations via ChartAnnotationLayer + Finding source metadata, ChartDownloadMenu + useChartCopy, right-click context menu pattern]

## Performance charts (multi-channel)

[briefly: PerformanceIChart/Boxplot/Pareto/Capability Base exports, ChannelResult[] props, selectedMeasure drill-down, 5-cap boxplot and 20-cap pareto per rules/charts.md]

## Yamazumi chart

[VA/NVA/Waste/Wait fixed colors, takt time line, slot mapping per mode]

## Gotchas

- React.memo() is handled by React Compiler — adding it manually is redundant and occasionally harmful.
- Never read `data-theme` directly in a chart component — use `useChartTheme()`. Theme changes don't trigger re-render without the hook.
- Boxplot auto-switches to dots per-category when a group has < MIN_BOXPLOT_VALUES (7) points. A single chart can mix boxes and dots.
- I-Chart LTTB decimation must force-include control-limit violations. Dropping them silently is a correctness bug.
- Export dimensions are fixed (see EXPORTS.md). Copy/download always renders at export dimensions via useChartCopy, not the on-screen size.

## Reference

- Export dimensions (PNG/SVG/clipboard): `EXPORTS.md` (sibling file)
- Full theme + chart color mapping: `COLORS.md` (sibling file)
- ADR-002 Visx charts
- ADR-005 Props-based charts
- ADR-051 Chart many categories
- docs/06-design-system/charts/
```

Target length: 180-250 lines.

- [ ] **Step 2: Write `.claude/skills/editing-charts/EXPORTS.md`**

Content: the full export dimensions table currently in `rules/charts.md` under "## Chart Export", plus the supporting notes (dashboard auto-height, pixelRatio 2, wide vs compact chart breakpoints). Start with a 5-line TOC since this file is 70-120 lines.

- [ ] **Step 3: Write `.claude/skills/editing-charts/COLORS.md`**

Content: the full chrome color mapping table from `rules/charts.md` under "## Theme-Aware Colors", plus `chartColors`/`operatorColors` palettes from `packages/charts/src/colors.ts`. TOC if >100 lines.

- [ ] **Step 4: Verify structure**

```bash
wc -l .claude/skills/editing-charts/*.md
head -1 .claude/skills/editing-charts/SKILL.md | grep -q "^---$" && echo "frontmatter OK"
grep -c "^## Gotchas" .claude/skills/editing-charts/SKILL.md
```

Expected: SKILL.md 150-300 lines; EXPORTS.md 50-120 lines; COLORS.md 50-120 lines; frontmatter present; Gotchas section present.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/editing-charts/
git commit -m "$(cat <<'EOF'
docs(agent-arch): populate editing-charts skill body + reference files

Migrated from .claude/rules/charts.md (278 lines) into SKILL.md (semantic-triggered)
+ EXPORTS.md + COLORS.md reference files.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 2: Populate `writing-tests` skill body

**Files:**

- Modify: `.claude/skills/writing-tests/SKILL.md`

**Sources:**

- `.claude/rules/testing.md` (145 lines — primary source)
- `docs/05-technical/implementation/testing.md` (supplementary)

- [ ] **Step 1: Write skill body**

Preserve the Phase 1 frontmatter. Replace the HTML comment body with content covering:

- **When this skill applies:** writing or modifying tests in any package
- **Core patterns:** framework choices (Vitest, RTL, Playwright); ownership matrix (which package tests what); commands per package; naming conventions
- **CRITICAL patterns:** `vi.mock()` BEFORE imports (infinite-loop prevention); `toBeCloseTo()` for floats; Zustand store test pattern (`setState(initialState)` in `beforeEach`); i18n locale loader registration in tests (reference with code example from `packages/core/src/i18n/__tests__/index.test.ts`); deterministic PRNG in stats tests (never `Math.random`)
- **E2E selectors:** the full `data-testid` table from rules/testing.md (keep in SKILL.md — short enough to inline, not a separate reference file)
- **Gotchas:** flaky test at `packages/hooks/src/__tests__/index.test.ts` under Turbo concurrency; total test count drift (check actual with `pnpm test`, don't hardcode); test files go in `__tests__/` directory alongside source, not parallel `tests/` folder

Target length: 150-220 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/writing-tests/SKILL.md
grep -c "^## Gotchas" .claude/skills/writing-tests/SKILL.md
git add .claude/skills/writing-tests/SKILL.md
git commit -m "docs(agent-arch): populate writing-tests skill body

Migrated from .claude/rules/testing.md (145 lines).

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 3: Populate `using-ruflo` skill body

**Files:**

- Modify: `.claude/skills/using-ruflo/SKILL.md`

**Sources:**

- `.claude/rules/ruflo.md` (62 lines — primary)
- `docs/05-technical/implementation/ruflo-workflow.md` (supplementary)

- [ ] **Step 1: Write body**

Cover: semantic memory search (`npx ruflo memory search --query`), ruflo-vs-MEMORY.md decision (routing = MEMORY.md, semantic = ruflo), worker dispatch patterns, pretrain after major refactoring, hook error logs at `/tmp/ruflo-hooks.log`, version pinned to 3.5.42 in `.mcp.json`. Gotchas: don't use ruflo for ephemeral task state (use TaskCreate); re-index after major refactors or ruflo's semantic search goes stale; MEMORY.md and ruflo serve different audiences (CLAUDE.md reader vs agent deep dive).

Target length: 80-130 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/using-ruflo/SKILL.md
git add .claude/skills/using-ruflo/SKILL.md
git commit -m "docs(agent-arch): populate using-ruflo skill body

Migrated from .claude/rules/ruflo.md.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 4: Populate `maintaining-documentation` skill body

**Files:**

- Modify: `.claude/skills/maintaining-documentation/SKILL.md`

**Sources:**

- `.claude/rules/documentation.md` (67 lines — primary)
- `docs/07-decisions/index.md` (ADR index format reference)
- `docs/superpowers/specs/index.md` (spec index format reference)
- `scripts/check-diagram-health.sh` and `scripts/check-doc-health.sh` (for explaining the checks)

- [ ] **Step 1: Write body**

Cover: ADR creation flow (sequential numbering → file → immediate index update), spec-anchored policy (living docs; status progression `draft → delivered` stays in place; archive only when superseded), required frontmatter fields (`title`, `audience`, `category`, `status`, `related`, `last-reviewed` for human-facing), Starlight-specific frontmatter for `apps/docs/` content, diagram health check (`bash scripts/check-diagram-health.sh`), spec index sync (pre-commit blocks stale index), 90-day review cadence in `.claude/rules/documentation.md` §Review Cadence.

Gotchas: orphan check scans `grep -r` the basename — every new doc under `docs/` needs to be referenced from some other doc or it fails pre-commit (fix: add reference from parent spec or the relevant ADR); ADR numbers are allocated at creation time, update `docs/07-decisions/index.md` in the same commit; design specs stay in `docs/superpowers/specs/` with `status: delivered` — don't archive living docs.

Target length: 120-180 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/maintaining-documentation/SKILL.md
git add .claude/skills/maintaining-documentation/SKILL.md
git commit -m "docs(agent-arch): populate maintaining-documentation skill body

Migrated from .claude/rules/documentation.md.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 5: Populate `editing-monorepo-structure` skill body

**Files:**

- Modify: `.claude/skills/editing-monorepo-structure/SKILL.md`

**Sources:**

- `.claude/rules/monorepo.md` (121 lines — primary; note that package-specific content has already moved to package CLAUDE.md.new files in Phase 1, so this skill covers **cross-package structure** only)
- `packages/core/package.json` (sub-path exports reference)

- [ ] **Step 1: Write body**

Cover: pnpm workspaces topology, downward-only dependency flow (core → hooks → ui → apps; packages never import apps), @variscout/core sub-path exports — list the 21 sub-paths in a compact table with one-line purpose, adding a new sub-path (update both `package.json` exports AND `tsconfig.json` paths), Tailwind v4 `@source` directive requirement in each app's `index.css` (responsive utilities silently break without them), workspace naming conventions (`@variscout/*`, `workspace:*` internal refs).

Gotchas: Tailwind v4 (`@tailwindcss/vite`) does not reliably auto-scan linked workspace packages in pnpm monorepos — `@source` is required, not optional. Sub-path exports need both package.json "exports" entries AND matching tsconfig "paths" or type resolution breaks. Packages must not import apps (ESLint `eslint-plugin-boundaries` may enforce this per ADR-048; confirm before asserting).

Target length: 100-160 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/editing-monorepo-structure/SKILL.md
git add .claude/skills/editing-monorepo-structure/SKILL.md
git commit -m "docs(agent-arch): populate editing-monorepo-structure skill body

Cross-package structure skill. Package-specific facts live in per-package CLAUDE.md.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 6: Populate `editing-statistics` skill body

**Files:**

- Modify: `.claude/skills/editing-statistics/SKILL.md`

**Sources:**

- `docs/07-decisions/adr-069-three-boundary-numeric-safety.md`
- `docs/07-decisions/adr-067-unified-glm-regression.md`
- `docs/07-decisions/adr-062-standard-anova-metrics.md`
- `docs/05-technical/statistics-reference.md`
- `packages/core/src/stats/safeMath.ts` (implementation)
- `packages/core/src/stats/bestSubsets.ts` (entry point for best subsets)
- `packages/core/src/stats/interactionScreening.ts` (Phase 2 logic)
- `packages/core/src/stats/designMatrix.ts` (interaction column construction)
- `packages/core/src/stats/olsRegression.ts` (QR solver)

- [ ] **Step 1: Write body**

Sections:

- **When this skill applies:** editing `packages/core/src/stats/` or statistical computation code.
- **Three-boundary numeric safety (ADR-069):** B1 parser rejects NaN (`toNumericValue`), B2 stats functions return `number | undefined` (`safeMath.ts` primitives: `safeDivide`, `safeLog`, `safeSqrt`), B3 display via `formatStatistic`. Boundary-by-boundary invariants.
- **Two-pass best subsets with interaction screening (ADR-067):** Pass 1 = 2^k main-effect subsets; Pass 2 = interaction pair screening on winners via partial F-test. Handles cont×cont, cont×cat, cat×cat. Pattern classification (ordinal = gap changes; disordinal = ranking reverses) — see user feedback memory: never use "moderator/primary" labels.
- **OLS regression:** QR solver in `olsRegression.ts`, NIST Longley benchmark validation, Minitab/JMP reference outputs.
- **ANOVA metrics (ADR-062):** η² (eta-squared), F, p-value; Category Total SS % is removed and should not be reintroduced.
- **Gotchas:** never return NaN/Infinity from an exported stats function (tests assert finite); never use `Math.random` in tests — deterministic PRNG required (see `stats/__tests__/` examples); never call `.toFixed()` inside stats code (violates the B2 contract); safeMath vs raw Math — always choose safeMath when the divisor or input could be zero/near-zero.
- **Reference:** ADRs, stats-reference.md, NIST Longley test file.

Target length: 180-280 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/editing-statistics/SKILL.md
grep -c "^## Gotchas" .claude/skills/editing-statistics/SKILL.md
git add .claude/skills/editing-statistics/SKILL.md
git commit -m "docs(agent-arch): populate editing-statistics skill body

Synthesized from ADR-067 (best subsets), ADR-069 (numeric safety), ADR-062 (ANOVA metrics).

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 7: Populate `editing-coscout-prompts` skill body

**Files:**

- Modify: `.claude/skills/editing-coscout-prompts/SKILL.md`

**Sources:**

- `docs/07-decisions/adr-047-analysis-mode-strategy.md`
- `docs/07-decisions/adr-049-coscout-context-and-memory.md`
- `docs/07-decisions/adr-060-coscout-intelligence-architecture.md`
- `docs/07-decisions/adr-068-coscout-cognitive-redesign.md`
- `docs/05-technical/architecture/coscout-prompt-architecture.md`
- `packages/core/src/ai/prompts/coScout/index.ts` (entry point)
- `packages/core/src/ai/prompts/coScout/tools/registry.ts` (25-tool registry)

- [ ] **Step 1: Write body**

Sections:

- **When this skill applies:** editing CoScout AI prompts or `packages/core/src/ai/prompts/`.
- **Modular prompt architecture:** `assembleCoScoutPrompt()` is the entry point returning `CoScoutPromptTiers` (tier1Static, tier2SemiStatic, tier3Dynamic, tools). **Deprecated:** `buildCoScoutSystemPrompt()` in `legacy.ts` — used only for test compatibility. New work must use the modular API.
- **Directory structure:** `role/`, `phases/` (per journey phase), `modes/` (per analysis mode), `context/` (investigation + data + knowledge formatters), `tools/` (typed registry).
- **25-tool registry:** phase/mode/tier-gated via `getToolsForPhase()`. New tools must register in `tools/registry.ts` with gate metadata.
- **Mode-aware coaching:** per-mode coaching hints in `modes/` subdirs. Strategy pattern couples mode resolution to CoScout methodology coaching (see `editing-analysis-modes` skill for mode specifics).
- **Visual grounding (ADR-057):** CoScout references chart elements by ID via REF markers. Never reference raw data rows in prompt.
- **Context wiring:** `useAIOrchestration.ts` passes `evidenceMapTopology`, `causalLinks`, `suspectedCauses` into context. Updating the shape requires updating both the hook and the context formatters.
- **Gotchas:** using `buildCoScoutSystemPrompt()` for new work (it's deprecated); forgetting to gate a new tool by phase/mode/tier in the registry (leaks into wrong phases); including raw data rows in prompts (violates customer-owned boundary + P5 "contribution not causation" — stick to aggregates and chart IDs); using "root cause" in any prompt string (use "contribution").
- **Reference:** ADRs, `coscout-prompt-architecture.md`, tool registry source.

Target length: 200-300 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/editing-coscout-prompts/SKILL.md
grep -c "^## Gotchas" .claude/skills/editing-coscout-prompts/SKILL.md
git add .claude/skills/editing-coscout-prompts/SKILL.md
git commit -m "docs(agent-arch): populate editing-coscout-prompts skill body

Synthesized from ADR-047/049/060/068 and coscout-prompt-architecture.md.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 8: Populate `editing-evidence-map` skill body

**Files:**

- Modify: `.claude/skills/editing-evidence-map/SKILL.md`

**Sources:**

- `docs/superpowers/specs/2026-04-05-evidence-map-design.md`
- `docs/superpowers/specs/2026-04-05-evidence-map-spine-design.md`
- `docs/superpowers/specs/2026-04-07-evidence-map-edge-interactions-design.md`
- `packages/charts/src/EvidenceMap/` (implementation)
- `apps/azure/src/components/editor/InvestigationMapView.tsx` (host integration)

- [ ] **Step 1: Write body**

Sections:

- **When this skill applies:** editing `packages/charts/src/EvidenceMap/` or `apps/azure/src/components/editor/InvestigationMapView.tsx`.
- **3-layer SVG architecture:** Layer 1 (Statistical — factor nodes by R²adj, 5 relationship types, equation bar; PWA + Azure). Layer 2 (Investigation — CausalLink directed edges, evidence badges D/G/E, gap markers; Azure only). Layer 3 (Synthesis — SuspectedCause hub convergence zones, projections; Azure only).
- **Props-based:** `useChartTheme`, `chartColors`/`chromeColors` constants; no context dependency.
- **Interactions:** click (detail), right-click (context menu), context menu → promote-to-causal, edge-detail card, SweetSpotCard, EdgeContextMenu.
- **Pop-out sync:** `usePopoutChannel` (BroadcastChannel + localStorage hydration). Edge/node selection propagates to pop-out window.
- **Mobile patterns:** `enableZoom` prop for pinch/pan; `compact` hides labels until zoom > 1.5x; `EvidenceMapEdgeSheet` bottom sheet.
- **Layout engine:** `evidenceMapLayout.ts` in `@variscout/core/stats` computes node positions from R²adj + causal structure.
- **Gotchas:** Layers 2-3 render only in Azure (PWA sees layer 1 only — don't rely on CausalLinks being visible in PWA builds); click vs right-click on an edge has different UX contracts (click=detail, right-click=actions) — don't swap them; props-based means no React context subscription — pass Evidence Map data explicitly through `useEvidenceMapData` hook in the host component; pop-out sync requires `usePopoutChannel` — don't implement BroadcastChannel directly.
- **Reference:** specs in `docs/superpowers/specs/2026-04-05-*` and `2026-04-07-*`.

Target length: 150-230 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/editing-evidence-map/SKILL.md
git add .claude/skills/editing-evidence-map/SKILL.md
git commit -m "docs(agent-arch): populate editing-evidence-map skill body

Synthesized from 2026-04-05-evidence-map-* and 2026-04-07-edge-interactions specs.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 9: Populate `editing-investigation-workflow` skill body

**Files:**

- Modify: `.claude/skills/editing-investigation-workflow/SKILL.md`

**Sources:**

- `docs/07-decisions/adr-015-investigation-board.md`
- `docs/07-decisions/adr-020-investigation-workflow.md`
- `docs/07-decisions/adr-053-question-driven-investigation.md`
- `docs/07-decisions/adr-064-suspected-cause-hub-model.md`
- `docs/07-decisions/adr-065-evidence-map-causal-graph.md`
- `docs/07-decisions/adr-066-evidence-map-investigation-center.md`
- `docs/superpowers/specs/2026-04-03-investigation-workspace-reframing-design.md`
- `docs/superpowers/specs/2026-04-04-investigation-spine-design.md`
- `packages/core/src/findings/` (Finding types, factories, helpers)
- `packages/stores/src/investigationStore.ts` (CausalLink + SuspectedCause entities)

- [ ] **Step 1: Write body**

Sections:

- **When this skill applies:** editing findings, SuspectedCause hubs, causal links, questions, or investigation spine components.
- **SuspectedCause hub model (ADR-064):** hubs are the organizing entity. Each hub accumulates evidence (data/gemba/expert), converges on improvement.
- **CausalLink entity:** lives in `investigationStore`. Directed edges. `wouldCreateCycle` utility lives in `@variscout/core/stats` (`packages/core/src/stats/causalGraph.ts`) — NOT in findings.
- **Three investigation threads (ADR-066):** regression discovery, hub UX, EDA heartbeat. All three render in parallel; editing one should not break the others.
- **FindingSource discriminated union:** narrow before accessing `.category` (use `'category' in src`). Variants: boxplot/pareto (category), ichart (anchorX/Y), yamazumi (category + activityType), coscout (messageId). Exhaustive switch required.
- **Question linking:** observation-triggered question linking via `QuestionLinkPrompt` (implements amended P5 entry point #3). `skipQuestionLinkPrompt` flag in sessionStore for users who dismiss it.
- **Persistence:** `suspectedCauses` + `causalLinks` persist via `useProjectActions` document-level persist (fixed April 2026 — see feedback memory on persistence gap).
- **Gotchas:** treating a FindingSource as a single shape (they're a union — always narrow); editing the CausalLink entity in `improvementStore` (wrong — it belongs to `investigationStore`); putting `wouldCreateCycle` in findings (it's in stats/causalGraph); using "root cause" language in any user-facing string (use "contribution" — P5).
- **Reference:** ADRs 015/020/053/064/065/066, investigation-spine spec.

Target length: 180-260 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/editing-investigation-workflow/SKILL.md
git add .claude/skills/editing-investigation-workflow/SKILL.md
git commit -m "docs(agent-arch): populate editing-investigation-workflow skill body

Synthesized from ADR-015/020/053/064/065/066 + investigation-spine spec.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 10: Populate `editing-azure-storage-auth` skill body

**Files:**

- Modify: `.claude/skills/editing-azure-storage-auth/SKILL.md`

**Sources:**

- `docs/07-decisions/adr-059-web-first-deployment-architecture.md`
- `docs/08-products/azure/authentication.md`
- `docs/08-products/azure/blob-storage-sync.md`
- `apps/azure/server.js` (server endpoints `/api/me`, `/api/storage-token`)
- `apps/azure/src/services/localDb.ts`, `cloudSync.ts`, `storage.ts`
- `apps/azure/src/db/schema.ts` (Dexie schema)
- `apps/azure/src/lib/appInsights.ts`

- [ ] **Step 1: Write body**

Sections:

- **When this skill applies:** editing Azure auth, storage, or cloud sync code in `apps/azure/`.
- **EasyAuth flow:** `/api/me` returns identity via Azure App Service EasyAuth cookie. Client never sees tokens. **No MSAL** in client code.
- **IndexedDB persistence (Azure Standard):** Dexie schema at `apps/azure/src/db/schema.ts`. `services/localDb.ts` is the facade.
- **Blob Storage sync (Azure Team):** `services/cloudSync.ts` pushes/pulls to blobs in the customer's tenant. SAS tokens minted by `/api/storage-token` in `server.js`. VariScout server never sees the data.
- **SAS token lifetime:** short-lived, scoped to user's container. Refresh on expiry — don't cache long-lived tokens.
- **Storage facade:** `services/storage.ts` abstracts local + cloud.
- **App Insights telemetry:** `src/lib/appInsights.ts`. Log structural events (counts, types, durations) — **NEVER PII, NEVER raw data**. Customer-owned principle violation = priority fix.
- **File Picker:** local only (`components/FileBrowseButton.tsx`). SharePoint picker removed per ADR-059.
- **Gotchas:** rolling your own auth instead of using EasyAuth (breaks cookie flow); logging user identity fields or query params to App Insights (PII leak — failing customer-owned); using SAS token after expiry (refresh via `/api/storage-token`); introducing a server-side data handler (violates browser-only principle).
- **Reference:** ADR-059, azure auth + blob-storage-sync docs.

Target length: 130-200 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/editing-azure-storage-auth/SKILL.md
git add .claude/skills/editing-azure-storage-auth/SKILL.md
git commit -m "docs(agent-arch): populate editing-azure-storage-auth skill body

Synthesized from ADR-059 + azure authentication/blob-storage-sync docs.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 11: Populate `adding-i18n-messages` skill body

**Files:**

- Modify: `.claude/skills/adding-i18n-messages/SKILL.md`

**Sources:**

- `docs/07-decisions/adr-025-internationalization.md`
- `packages/core/src/i18n/` (including messages/ subdirectory and index.ts)
- `packages/hooks/src/useTranslation.ts`, `useLocaleState.ts`
- `packages/core/src/i18n/__tests__/index.test.ts` (loader registration pattern)

- [ ] **Step 1: Write body**

Sections:

- **When this skill applies:** adding user-facing strings or new translation keys.
- **Locale loader registration:** apps call `registerLocaleLoaders()` at startup with `import.meta.glob` — core no longer calls `import.meta.glob` directly (per ADR-025 and the i18n feedback memory). Each app's `main.tsx` is the registration point.
- **Typed message catalogs:** messages defined in `packages/core/src/i18n/messages/{locale}.ts`. Type safety comes from the catalog shape — all locales must match the baseline.
- **Intl API for formatting:** use `formatMessage(key, parameters)` with ICU placeholders. **NEVER** string-concatenate translations (violates plural/gender handling).
- **Test setup:** tests that use translations must call `registerLocaleLoaders()` with `import.meta.glob` before `preloadLocale()`. Reference pattern in `packages/core/src/i18n/__tests__/index.test.ts`.
- **Adding a locale:** add `{locale}.ts` under `messages/`, match the catalog shape, update app `registerLocaleLoaders` globs if needed.
- **`formatStatistic()`** belongs to i18n (it's `@variscout/core/i18n` export) — hard rule: never call `.toFixed()` on stats, call `formatStatistic()`.
- **Gotchas:** forgetting to register loaders before preload in a test (empty catalog, tests pass silently with wrong output); concatenating translated substrings (breaks RTL + plural agreement); adding a key to only one locale (type mismatch breaks build); using `.toFixed()` instead of `formatStatistic()` on stat values.
- **Reference:** ADR-025, i18n test as example.

Target length: 100-160 lines.

- [ ] **Step 2: Verify + commit**

```bash
wc -l .claude/skills/adding-i18n-messages/SKILL.md
git add .claude/skills/adding-i18n-messages/SKILL.md
git commit -m "docs(agent-arch): populate adding-i18n-messages skill body

Synthesized from ADR-025 + packages/core/src/i18n.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

## Task 12: Populate `editing-analysis-modes` skill body + 4 reference files

**Files:**

- Modify: `.claude/skills/editing-analysis-modes/SKILL.md`
- Create: `.claude/skills/editing-analysis-modes/YAMAZUMI.md`
- Create: `.claude/skills/editing-analysis-modes/PERFORMANCE.md`
- Create: `.claude/skills/editing-analysis-modes/DEFECT.md`
- Create: `.claude/skills/editing-analysis-modes/PROCESS-FLOW.md`

**Sources:**

- `docs/07-decisions/adr-047-analysis-mode-strategy.md`
- `docs/07-decisions/adr-034-yamazumi-analysis-mode.md`
- `docs/07-decisions/adr-038-subgroup-capability.md`
- `docs/superpowers/specs/2026-04-16-defect-analysis-mode-design.md`
- `docs/superpowers/specs/2026-04-16-defect-evidence-map-integration-design.md`
- `packages/core/src/analysisStrategy.ts` (resolveMode + getStrategy)
- `packages/core/src/yamazumi/` (mode transform)
- `packages/core/src/defect/` (mode transform)
- `docs/03-features/analysis/yamazumi.md`, `performance-mode.md`, `defect-analysis.md`, `capability.md`
- `docs/USER-JOURNEYS-YAMAZUMI.md`, `USER-JOURNEYS-PERFORMANCE.md`, `USER-JOURNEYS-DEFECT.md`, `USER-JOURNEYS-CAPABILITY.md`, `USER-JOURNEYS-PROCESS-FLOW.md` (Tier 2 docs from Phase 1)

- [ ] **Step 1: Write `SKILL.md` body (the cross-cutting mode architecture)**

Sections:

- **When this skill applies:** editing mode resolution, strategy, or mode-specific features.
- **Strategy Pattern (ADR-047):** `resolveMode()` + `getStrategy()` in `packages/core/src/analysisStrategy.ts`. Each strategy carries: chart slot config (4 slots per mode), KPI type, report config, metric labels, AI coaching hints.
- **The 6 modes:** standard, capability, yamazumi, performance, defect, process-flow. Standard is default. Process-flow is design-only (no code yet).
- **Chart slot mapping (summary table — link to per-mode reference files for detail):** Standard = I-Chart / Boxplot / Pareto / Stats. Yamazumi = I-Chart(switchable metric) / YamazumiChart / Pareto(5 modes) / YamazumiSummary. Performance = CpkScatter / Boxplot(up to 5) / Pareto(up to 20 Cpk) / Capability. Defect = DefectIChart / DefectTypeBoxplot / DefectPareto / DefectSummary.
- **Mode transforms:** Yamazumi runs `computeYamazumiData()` between parse and stats. Defect runs `computeDefectRates()` (triggered by `detectDefectFormat()` via `DefectDetectedModal`). Other modes pass raw parsed data through.
- **CoScout coaching per mode:** methodology hints attached to strategy — lean for yamazumi, multi-channel for performance, defect-rate thinking for defect.
- **Adding a new mode:** register in `resolveMode()`, define strategy, add mode transform if needed, add a `USER-JOURNEYS-{MODE}.md` Tier 2 doc, add reference file in this skill.
- **Gotchas:** chart slot count is always 4 (don't introduce a 5th slot in a new mode — restructure chart types instead); mode transform must run BEFORE stats (not after); process-flow has no runtime code yet — don't write code against it; yamazumi activity-type colors are fixed (don't recolor per drill level).
- **Reference:** per-mode detail in sibling files `YAMAZUMI.md`, `PERFORMANCE.md`, `DEFECT.md`, `PROCESS-FLOW.md`. ADR-047 (strategy), ADR-034 (yamazumi), ADR-038 (subgroup capability), defect specs.

Target SKILL.md length: 200-300 lines.

- [ ] **Step 2: Write `YAMAZUMI.md`**

TOC at top. Cover: `computeYamazumiData()` aggregation logic, activity type classification (VA / NVA Required / Waste / Wait), fixed colors (VA #22c55e, NVA #f59e0b, Waste #ef4444, Wait #94a3b8), takt time line, idle time metric, chart slot mapping for yamazumi, per-mode CoScout coaching language.

Target: 80-140 lines.

- [ ] **Step 3: Write `PERFORMANCE.md`**

TOC. Cover: `ChannelResult[]` type, multi-channel drill-down via `selectedMeasure`, per-channel Cpk scatter in slot 1, cross-channel Boxplot up to 5 in slot 2, worst-first Pareto up to 20 in slot 3, per-channel Capability in slot 4, `operatorColors` palette, CoScout multi-channel coaching language.

Target: 80-140 lines.

- [ ] **Step 4: Write `DEFECT.md`**

TOC. Cover: defect event log input shape, `detectDefectFormat()` trigger, `DefectDetectedModal` UX, `computeDefectRates()` transform, defect type Pareto, cross-type Evidence Map (three-view model: single-type / cross-type / merged), `DefectTypeSelector` UI, COPQ alignment, sample dataset `manufacturing-defects`.

Target: 80-140 lines.

- [ ] **Step 5: Write `PROCESS-FLOW.md`**

Explicitly state: design-only, not yet coded. TOC. Cover: intended scope (bottleneck analysis across process steps, queue/wait visualization, throughput diagnostics), relationship to Yamazumi mode (drill-down from process-level to step-level), design references (specs in `docs/superpowers/specs/` related to process flow if any exist — do a fresh search: `ls docs/superpowers/specs/ | grep process`). Do not fabricate implementation details — forward-looking only.

Target: 50-100 lines.

- [ ] **Step 6: Verify all 5 files**

```bash
wc -l .claude/skills/editing-analysis-modes/*.md
grep -c "^## Gotchas" .claude/skills/editing-analysis-modes/SKILL.md
```

Expected: SKILL.md 200-350 lines, each reference file within target, Gotchas section present in SKILL.md.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/editing-analysis-modes/
git commit -m "$(cat <<'EOF'
docs(agent-arch): populate editing-analysis-modes skill body + 4 mode reference files

Synthesized from ADR-047 + per-mode ADRs/specs. Hybrid structure: cross-cutting
strategy pattern in SKILL.md; mode-specific details in YAMAZUMI.md,
PERFORMANCE.md, DEFECT.md, PROCESS-FLOW.md reference files.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 13: Atomic swap — activate the new CLAUDE.mds

**Files:**

- Rename: `/CLAUDE.md` → `/CLAUDE.md.bak` ; `/CLAUDE.md.new` → `/CLAUDE.md`
- Rename (×6): `packages/{core,charts,hooks,ui,stores,data}/CLAUDE.md.new` → `.../CLAUDE.md` (no prior file; `.bak` not needed)
- Rename (×2): `apps/{azure,pwa}/CLAUDE.md.new` → `.../CLAUDE.md` (no prior file; `.bak` not needed)

**DO NOT DELETE:** `.claude/rules/*.md` stays active. Both systems run in parallel through Phase 3.

- [ ] **Step 1: Confirm all skill bodies populated**

```bash
for f in .claude/skills/*/SKILL.md; do
  if grep -q "^<!-- Body to be populated in Phase 2" "$f"; then
    echo "STILL EMPTY: $f"
  fi
done
```

Expected: no output. If any skill still shows the Phase 1 placeholder, go back and complete that task.

- [ ] **Step 2: Confirm all `.new` files present**

```bash
ls CLAUDE.md.new packages/*/CLAUDE.md.new apps/{azure,pwa}/CLAUDE.md.new
```

Expected: 9 files listed (root + 6 packages + 2 apps).

- [ ] **Step 3: Rename root CLAUDE.md**

```bash
mv CLAUDE.md CLAUDE.md.bak
mv CLAUDE.md.new CLAUDE.md
```

- [ ] **Step 4: Rename package CLAUDE.mds**

```bash
for pkg in core charts hooks ui stores data; do
  mv "packages/$pkg/CLAUDE.md.new" "packages/$pkg/CLAUDE.md"
done
```

- [ ] **Step 5: Rename app CLAUDE.mds**

```bash
for app in azure pwa; do
  mv "apps/$app/CLAUDE.md.new" "apps/$app/CLAUDE.md"
done
```

- [ ] **Step 6: Verify new layout**

```bash
ls CLAUDE.md CLAUDE.md.bak
wc -l CLAUDE.md            # expect ~50
wc -l CLAUDE.md.bak        # expect 181
ls packages/*/CLAUDE.md    # expect 6 files
ls apps/*/CLAUDE.md        # expect 2 files
ls packages/*/CLAUDE.md.new apps/*/CLAUDE.md.new 2>/dev/null  # expect no output
```

- [ ] **Step 7: Run full test suite (swap must not break anything)**

```bash
pnpm test 2>&1 | tail -10
```

Expected: 5818/5818 passing.

- [ ] **Step 8: Run build**

```bash
pnpm build 2>&1 | tail -10
```

Expected: exit code 0, all packages and apps build cleanly.

- [ ] **Step 9: Run docs health**

```bash
bash scripts/check-diagram-health.sh 2>&1 | tail -10
bash scripts/check-doc-health.sh 2>&1 | tail -10
```

Expected: all checks pass.

- [ ] **Step 10: Commit the swap**

```bash
git add CLAUDE.md CLAUDE.md.bak packages/*/CLAUDE.md apps/*/CLAUDE.md
git commit -m "$(cat <<'EOF'
chore(agent-arch): atomic swap — activate A++ CLAUDE.md layout

Root CLAUDE.md now 50 lines (was 181; previous preserved as CLAUDE.md.bak).
8 nested package/app CLAUDE.mds activated (core, charts, hooks, ui, stores,
data + azure, pwa). 12 skills bodies populated; .claude/rules/ still live
as belt-and-suspenders through Phase 3.

Tests: 5818/5818 passing. Build clean.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

**Rollback plan if Step 7 or 8 fails:**

```bash
mv CLAUDE.md CLAUDE.md.new
mv CLAUDE.md.bak CLAUDE.md
for pkg in core charts hooks ui stores data; do
  mv "packages/$pkg/CLAUDE.md" "packages/$pkg/CLAUDE.md.new"
done
for app in azure pwa; do
  mv "apps/$app/CLAUDE.md" "apps/$app/CLAUDE.md.new"
done
```

Then investigate the failure before re-attempting.

---

## Task 14: Post-swap spot-test + description tuning

**Files:**

- Possibly modify: any skill SKILL.md whose description under-triggers

**Purpose:** Per Anthropic's skill iteration guidance (observe real behavior, refine descriptions), verify the new architecture activates the right skills on representative tasks.

- [ ] **Step 1: Design 5 spot-test prompts covering the most common agent tasks**

Record in a new section of `docs/09-baseline/2026-04-17-agent-docs-baseline.md` called "Phase 2 Spot-Test Results". The 5 prompts:

1. "Add a new chart annotation that shows a control-limit violation." — should trigger `editing-charts` (+ maybe `writing-tests` if asked for tests).
2. "Format a computed Cpk value for display in a new widget." — should avoid `.toFixed()`; reach for `formatStatistic()`. Related skills: `editing-statistics` or `adding-i18n-messages`.
3. "Add an idle-time metric to the Yamazumi mode's I-Chart slot." — should trigger `editing-analysis-modes` (+ read YAMAZUMI.md).
4. "Add a new translation key for the HMW Brainstorm modal title." — should trigger `adding-i18n-messages`.
5. "Persist a new `investigationSummary` field to Blob Storage when it changes." — should trigger `editing-azure-storage-auth` (+ understand persist lifecycle).

Run each prompt against the newly-activated layout, observe which skills the agent loads, and record:

- Did the expected skill activate? (Y/N)
- If N, what description change would have triggered it?

- [ ] **Step 2: Tune descriptions if necessary**

For any skill that under-triggered, edit the `description:` field in its `SKILL.md` frontmatter. Follow Anthropic's guidance: concrete terms (file paths, function names), "Use when…" lead-in, third-person, include both what and when. Commit any description changes separately with message `docs(agent-arch): tune {skill-name} description for discovery`.

- [ ] **Step 3: Record results in baseline doc**

Append a "Phase 2 Spot-Test Results" subsection under the existing "Phase 1 Completion" section of `docs/09-baseline/2026-04-17-agent-docs-baseline.md`. Include:

- Date of spot-test (actual date at time of execution)
- Each prompt + expected skill + observed skill(s) + verdict
- Any description tunings made

- [ ] **Step 4: Commit**

```bash
git add docs/09-baseline/2026-04-17-agent-docs-baseline.md
git commit -m "$(cat <<'EOF'
docs(agent-arch): Phase 2 spot-test results

Verified skill discovery on 5 representative tasks post-atomic-swap.
Description tunings (if any) captured in prior commits.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 15: Phase 2 completion + end-of-phase summary

**Files:**

- Modify: `docs/09-baseline/2026-04-17-agent-docs-baseline.md` (append Phase 2 completion section)

- [ ] **Step 1: Measure post-swap always-loaded context**

Root CLAUDE.md is now 50 lines. `.claude/rules/` still live (will be deleted in Phase 3). Per-package CLAUDE.mds are auto-loaded only when editing files in that directory.

```bash
wc -l CLAUDE.md .claude/rules/*.md packages/*/CLAUDE.md apps/*/CLAUDE.md
```

Record the new root + rules total, and note that the per-package CLAUDE.md footprint is _conditional_ (loaded only on relevant edits).

- [ ] **Step 2: Append "Phase 2 Completion" section**

To `docs/09-baseline/2026-04-17-agent-docs-baseline.md`, append a section listing:

- Date completed
- All 12 skills populated with bodies + gotchas sections
- 6 reference files created (2 under editing-charts, 4 under editing-analysis-modes)
- Atomic swap completed — new root 50 lines + 8 nested CLAUDE.mds live
- Old root preserved at `CLAUDE.md.bak` (pending deletion in Phase 3)
- `.claude/rules/` still live (belt-and-suspenders through Phase 3)
- Tests: 5818/5818 passing post-swap
- Build: clean post-swap
- Always-loaded context on root-only edits: ~50 lines (was 181 + 724 rules = 905 before migration). **Partial reduction achieved; remainder realized when `.claude/rules/` deletes in Phase 3.**
- Spot-test results: (link to subsection)

- [ ] **Step 3: Final Phase 2 commit**

```bash
git add docs/09-baseline/2026-04-17-agent-docs-baseline.md
git commit -m "$(cat <<'EOF'
docs(agent-arch): Phase 2 Migration + Switchover complete

- 12 skill bodies populated with Gotchas sections
- 6 reference files (2 for editing-charts, 4 for editing-analysis-modes)
- Atomic swap executed: root CLAUDE.md 50 lines (old preserved as .bak)
- 8 nested package/app CLAUDE.mds activated
- .claude/rules/ still live (deletion in Phase 3)
- Tests: 5818/5818 passing. Build clean.

Phase 3 (enforcement + cleanup) to follow in a separate plan.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Phase 2 Summary

**What shipped:**

- 12 skill bodies populated — semantic-triggered knowledge loading live
- 6 reference files (editing-charts, editing-analysis-modes) — progressive disclosure
- Root CLAUDE.md atomically swapped from 181 → 50 lines
- 8 nested package/app CLAUDE.mds activated (first time VariScout uses Anthropic's nested CLAUDE.md feature)
- Old root preserved at `CLAUDE.md.bak` pending Phase 3
- Spot-test + description-tuning feedback loop completed

**What didn't ship (deferred to Phase 3):**

- `.claude/rules/` deletion (still live as belt-and-suspenders)
- `docs/archive/` deletion
- ESLint plugins for numeric safety, hardcoded colors, terminology, interaction language
- Pre-commit hooks for SSOT, claude-md size, stale-adr warnings
- MEMORY.md scoping to session state only
- CLAUDE.md.bak deletion

**Sign-off criteria:** Task 13 test suite + build pass; Task 14 spot-tests yield correct skill discovery for at least 4 of 5 prompts (with description tuning applied for misses); Task 15 completion note appended to baseline doc.

---

## Self-Review Notes

Self-reviewed against `docs/superpowers/specs/2026-04-17-agent-docs-architecture-design.md` and the Phase 1 delivery:

**Spec coverage:**

- Layer 3 skill body population (all 12): Tasks 1–12 ✓
- Skill reference files (2 for charts, 4 for analysis-modes): Tasks 1, 12 ✓
- Atomic swap of root + 8 nested CLAUDE.mds: Task 13 ✓
- Post-swap verification (tests, build, docs:check): Task 13 steps 7-9 ✓
- Spot-test + description tuning (per Anthropic iteration pattern): Task 14 ✓
- Phase 2 completion note: Task 15 ✓
- Rollback plan documented: Task 13 ✓

**Deferred to Phase 3 plan** (matches spec's phase plan):

- ESLint plugins → Phase 3
- Pre-commit/pre-edit hooks → Phase 3
- `.claude/rules/` deletion → Phase 3
- `docs/archive/` deletion → Phase 3
- MEMORY.md scope reduction → Phase 3
- CLAUDE.md.bak deletion → Phase 3
- CI gate → Phase 3

**Placeholders check:** None. Every task has concrete source files, required sections, target lengths, verify commands, and commit messages. No "TBD" or "implement later" markers.

**Type consistency:** Skill name slugs are consistent throughout (all hyphenated lowercase). File paths use forward slashes (per Anthropic + cross-platform). Commit message prefix `docs(agent-arch):` or `chore(agent-arch):` is consistent.

**Commit discipline:** 15 commits (one per task) — matches "frequent commits" principle and gives per-skill revert granularity for Phase 2. Atomic swap is its own commit so revert is a single operation.
