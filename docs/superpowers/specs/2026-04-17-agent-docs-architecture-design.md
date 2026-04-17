---
title: Agent-Facing Documentation Architecture (A++)
audience: [engineer]
category: architecture
status: draft
related:
  [claude-md, skills, documentation, governance, agent-context, progressive-disclosure, opus-4-7]
---

# Agent-Facing Documentation Architecture (A++)

## Context

**Current state.** Always-loaded agent context totals ~1,080 lines per turn: `CLAUDE.md` (181) + `.claude/rules/*.md` (724, six files) + `MEMORY.md` routing entries (~175). `docs/` holds 455 markdown files — 71 ADRs, 64 specs, 65 archived, ~250 other.

**Confirmed failure modes.** User identified **C (context overload)** — agent sees too much, picks wrong pattern, mixes archived with current guidance — and **D (duplicate-source conflict)** — same fact lives in CLAUDE.md, `rules/`, an ADR, and a spec with slight drift, and the agent arbitrates incorrectly.

**Anthropic's April 2026 guidance** confirms VariScout violates 7 of 8 current best practices for agent-facing documentation:

| Guidance                                      | VariScout                              | Verdict                   |
| --------------------------------------------- | -------------------------------------- | ------------------------- |
| CLAUDE.md <300 lines (ideal <60)              | 181 + 724 rules = ~905 always-on       | Severely bloated          |
| No file-by-file codebase descriptions         | Task→docs table with hundreds of paths | Explicit anti-pattern     |
| Skills for domain-sometimes knowledge         | `.claude/rules/` eager-loaded instead  | Wrong mechanism           |
| Nested CLAUDE.md for monorepos                | Single root only                       | Missing built-in feature  |
| `@path` imports for progressive disclosure    | Not used                               | Missing built-in feature  |
| Hooks for deterministic enforcement           | None for docs/conventions              | Missing                   |
| No long explanations                          | "Key Patterns" inlines ADR summaries   | Anti-pattern              |
| Retrieval over recall (self-stated principle) | ~900 lines pre-loaded                  | Contradicts own principle |

**Opus 4.7 constraints** (per model card + prompt-engineering guidance):

- Interprets instructions more literally — soft phrasing ("try to", "prefer") carries heavier weight
- Prompt caching rewards stable pre-loaded context
- Reasons more, uses tools less — interim-status scaffolding no longer needed

**Complexity to preserve** (this is not inflation — it is load-bearing): 10 personas × 14 use cases × 6 analysis modes × 3 tiers; 4 apps × 6 packages × 78 shared hooks × 80+ UI component modules; CoScout AI as sub-product (25-tool registry, modular prompts); customer-owned data principle with browser→IndexedDB→Blob sync. **The corpus stays; the loading model changes.**

**Intended outcome.**

- ≥70% reduction in always-loaded context per turn
- Elimination of duplicate-source conflicts via strict ownership + SSOT enforcement
- Preservation of all load-bearing domain knowledge via semantic/on-demand retrieval
- Curated human comprehension layer so the project remains understandable when returning after absence
- Migration from text conventions to deterministic enforcement (ESLint + hooks) wherever feasible

## Primary Reader Model

**Agent-primary infrastructure + curated human comprehension layer.**

- Agent layer: invariants + skills + executable checks, token-lean, SSOT-enforced
- Human layer: 3 Tier 1 always-`@imported` narrative docs + 5 Tier 2 per-mode journey docs (lazy)

## Architecture: 5-Layer Model

```
Layer 1: ROOT INVARIANTS (always-loaded, ≤50 lines)
  /CLAUDE.md — principles, commands, @imports, pointers

Layer 2: PACKAGE CONTEXT (auto-loaded when editing that package)
  packages/*/CLAUDE.md, apps/*/CLAUDE.md
  30-80 lines each, package-specific invariants only

Layer 3: SKILLS (semantic trigger, metadata pre-loaded only)
  .claude/skills/<domain>/SKILL.md (≤500 lines body)
  Full content loaded only when description matches task

Layer 4: RETRIEVAL CORPUS (read on demand)
  docs/07-decisions/, docs/superpowers/specs/,
  docs/03-features/, docs/05-technical/, docs/02-journeys/
  Indexed via docs/index.md

Layer 5: ENFORCEMENT (deterministic)
  ESLint plugins + pre-commit hooks + pre-edit advisories
```

### Ownership rules (strict, SSOT-enforced)

| Fact type           | Owned by                    | Forbidden in     |
| ------------------- | --------------------------- | ---------------- |
| Core principles     | Layer 1 (root CLAUDE.md)    | Anywhere else    |
| Package invariants  | Layer 2 (package CLAUDE.md) | Layer 1, rules/  |
| Domain workflows    | Layer 3 (skills)            | Layer 1, Layer 2 |
| Decisions (why)     | Layer 4 (ADRs)              | Anywhere else    |
| Designs (what)      | Layer 4 (specs)             | Anywhere else    |
| Micro-conventions   | Layer 5 (hooks/lint)        | Text rules       |
| Session state       | `MEMORY.md`                 | `CLAUDE.md`      |
| Product orientation | 3 human docs (`@imported`)  | Layer 2/3/5      |

## Layer 1: Root `/CLAUDE.md` — target ≤50 lines

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

**Design notes.**

- Hard rules at top (Opus 4.7 literal interpretation favors explicit hardness)
- Hard vs advisory clearly separated
- No file paths beyond canonical directories — discovery via package CLAUDE.mds + `docs/index.md`
- `@imports` pull 3 human narrative docs at session start (Anthropic's built-in progressive disclosure)
- No "Key Patterns", no "Key Files" table, no task→docs routing — all moved to Layer 2/3/4

## Layer 2: Per-Package `CLAUDE.md` — 8 files

Identical section structure per file: **Purpose (1 line) → Hard rules → Invariants → Test command → Pointers to relevant skills/ADRs.** Auto-loaded by Claude Code when agent edits files in that directory.

| File                        | Est. lines | Key content                                                                                                                                                     |
| --------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/CLAUDE.md`   | ~80        | Pure TS, no React. Sub-path exports list. Numeric safety (return `number \| undefined`). Strategy pattern. No `Math.random` — use deterministic PRNGs in tests. |
| `packages/charts/CLAUDE.md` | ~50        | Props-based, no context. Export `ChartBase` + `Chart`. Theme via `useChartTheme`. `React.memo` not needed (React Compiler).                                     |
| `packages/hooks/CLAUDE.md`  | ~40        | All prefixed `use`. Depends on core only. Test pattern. i18n locale loader registration.                                                                        |
| `packages/ui/CLAUDE.md`     | ~50        | Component naming (`*Base`, `*WrapperBase`). May import `@variscout/stores` (documented exception). Accessibility: no nested `<button>`/`<a>`.                   |
| `packages/stores/CLAUDE.md` | ~40        | 4 domain stores. Selectors required. Test pattern: `setState(initial)` in `beforeEach`. sessionStore auto-persists.                                             |
| `packages/data/CLAUDE.md`   | ~20        | Sample datasets only; no logic. TS exports from `index.ts`.                                                                                                     |
| `apps/azure/CLAUDE.md`      | ~70        | FSD structure. IndexedDB via Dexie + Blob Storage. EasyAuth (no MSAL). Feature stores. Never log PII (customer-owned). Tailwind `@source` required.             |
| `apps/pwa/CLAUDE.md`        | ~30        | Session-only, no persistence. Context-based state. Tailwind `@source` required.                                                                                 |

**Deferred (optional):** `apps/website/CLAUDE.md`, `apps/docs/CLAUDE.md`.

**Typical loaded context per task.**

- Editing `packages/core/src/stats/bestSubsets.ts` → root (~45) + `packages/core/CLAUDE.md` (~80) = **~125 lines**
- Editing `apps/azure/src/features/investigation/…` → root (~45) + `apps/azure/CLAUDE.md` (~70) = **~115 lines**

## Layer 3: Skills — 12 skills in `.claude/skills/`

Anthropic loads only metadata (description field) eagerly; SKILL.md body loads only on semantic match.

| #   | Skill                            | Trigger description (abbreviated)                                                                                                                                                | Est. size                     | Replaces                     |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------- |
| 1   | `editing-charts`                 | Use when editing `packages/charts/` or chart wrappers. Chart patterns, theme, export dimensions, overflow, LTTB, annotations, dot plot fallback, violin, sorting.                | ~250 + EXPORTS.md + COLORS.md | rules/charts.md              |
| 2   | `editing-statistics`             | Use when editing `packages/core/src/stats/`. Numeric safety (three boundaries), two-pass best subsets, NIST validation, `safeMath.ts`.                                           | ~180                          | New (ADR-069, ADR-067)       |
| 3   | `editing-coscout-prompts`        | Use when editing AI prompts. Modular architecture, `assembleCoScoutPrompt()`, tier1/2/3, mode-aware coaching, tool registry.                                                     | ~200                          | New (ADR-047, 049, 060, 068) |
| 4   | `editing-evidence-map`           | Use when editing `packages/charts/src/EvidenceMap/` or `InvestigationMapView`. 3-layer SVG, props-based, interactions, popout sync, mobile patterns.                             | ~150                          | New                          |
| 5   | `editing-investigation-workflow` | Use when editing findings, hubs, causal links, questions. SuspectedCause hub model, CausalLink entity, three threads, FindingSource narrowing.                                   | ~200                          | New (ADR-064/065/066)        |
| 6   | `editing-azure-storage-auth`     | Use when editing Azure auth, storage, cloud sync. EasyAuth (no MSAL), IndexedDB via Dexie, Blob Storage + SAS, no-PII telemetry.                                                 | ~120                          | New (ADR-059)                |
| 7   | **`editing-analysis-modes`**     | Use when editing mode resolution, strategy, or mode-specific features (yamazumi, performance, defect, process-flow, capability). Strategy pattern, chart slot mapping, coaching. | ~300 + 4 mode reference files | New (ADR-047)                |
| 8   | `writing-tests`                  | Use when writing or modifying tests. Vitest + RTL + Playwright, `vi.mock` ordering, `toBeCloseTo`, Zustand pattern, i18n loader, E2E testids.                                    | ~180                          | rules/testing.md             |
| 9   | `adding-i18n-messages`           | Use when adding user-facing strings or translations. Locale loader registration, typed catalogs, Intl API, no concatenation.                                                     | ~80                           | New (ADR-025)                |
| 10  | `maintaining-documentation`      | Use when creating/updating ADRs, specs, diagrams. ADR template + index update, spec frontmatter, diagram health, spec index sync.                                                | ~120                          | rules/documentation.md       |
| 11  | `using-ruflo`                    | Use when using ruflo tools or memory. Semantic search, ruflo-vs-MEMORY.md decision, worker dispatch, hook error logs.                                                            | ~60                           | rules/ruflo.md               |
| 12  | `editing-monorepo-structure`     | Use when adding packages, changing package.json exports, or restructuring. Sub-path exports, dependency flow, Tailwind `@source`.                                                | ~80                           | rules/monorepo.md            |

### `editing-analysis-modes` skill structure (hybrid mode-first)

```
.claude/skills/editing-analysis-modes/
├── SKILL.md         # Strategy pattern, resolveMode/getStrategy, chart slot mapping per mode, CoScout coaching per mode, adding a new mode
├── YAMAZUMI.md      # computeYamazumiData, VA/NVA/Waste/Wait colors, takt time
├── PERFORMANCE.md   # ChannelResult[], multi-channel drill-down, per-channel Cpk
├── DEFECT.md        # detectDefectFormat, computeDefectRates, event→rate transform, DefectDetectedModal
└── PROCESS-FLOW.md  # Design-only: pointer to spec, intended journey
```

### Migration map (rules/ → new homes)

| Current file                        | Moves to                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rules/code-style.md` (51 lines)    | Hard rules → root; numeric safety → `editing-statistics` + ESLint; colors → `editing-charts` + ESLint; React → `packages/ui/CLAUDE.md`; accessibility → `packages/ui/CLAUDE.md`      |
| `rules/monorepo.md` (121 lines)     | Dependency flow → root; sub-paths → `packages/core/CLAUDE.md`; package-specifics → each package CLAUDE.md; `@source` → `apps/*/CLAUDE.md`; rest → `editing-monorepo-structure` skill |
| `rules/charts.md` (278 lines)       | `editing-charts` skill + EXPORTS.md + COLORS.md reference files                                                                                                                      |
| `rules/testing.md` (145 lines)      | `writing-tests` skill; E2E selectors → reference file                                                                                                                                |
| `rules/ruflo.md` (62 lines)         | `using-ruflo` skill                                                                                                                                                                  |
| `rules/documentation.md` (67 lines) | `maintaining-documentation` skill                                                                                                                                                    |

**Net:** 724 lines always-loaded → 0 lines always-loaded. Same content, retrieved on semantic match.

## Layer 4: Retrieval Corpus + Human Narrative Docs

### Preserved (no change)

- `docs/07-decisions/` — all 71 ADRs preserved
- `docs/superpowers/specs/` — all 64 specs preserved (living-doc policy retained)
- `docs/01-vision/`, `docs/02-journeys/` (personas + flows), `docs/03-features/`, `docs/05-technical/`, `docs/08-products/` — preserved
- `docs/04-cases/` — 14 use cases preserved
- `docs/index.md` — becomes agent-facing domain manifest

### Tier 1 human narrative docs (3 files, `@imported` from root CLAUDE.md)

| File                    | Size       | Purpose                                                                                                                          |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `docs/OVERVIEW.md`      | ~600 words | What VariScout does in practice. Journey spine. 6 analysis modes, 1-paragraph each. 3 tiers. CoScout role.                       |
| `docs/USER-JOURNEYS.md` | ~800 words | 10 personas + unified FRAME→SCOUT→INVESTIGATE→IMPROVE + brief per-mode "distinctive experience" sections cross-linked to Tier 2. |
| `docs/DATA-FLOW.md`     | ~600 words | Parse → stats → persist → sync lifecycle. Customer-owned principle. Three tiers of data handling.                                |

Content **curated from existing `docs/01-vision/`, `docs/02-journeys/personas/`, `docs/05-technical/architecture/`** — not written from scratch.

### Tier 2 per-mode journey docs (5 files, lazy)

Identical structure per file: Who uses this → What they want to achieve → How they use VariScout for it → What makes this mode distinctive → Design reference (spec + ADR + code paths).

| File                                 | Size       | Audience                                                                  |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------- |
| `docs/USER-JOURNEYS-YAMAZUMI.md`     | ~600 words | Lean practitioner, industrial engineer                                    |
| `docs/USER-JOURNEYS-PERFORMANCE.md`  | ~600 words | Multi-channel analyst (fill heads, cavities, nozzles)                     |
| `docs/USER-JOURNEYS-DEFECT.md`       | ~600 words | Quality engineer tracking PPM                                             |
| `docs/USER-JOURNEYS-CAPABILITY.md`   | ~700 words | Quality engineer computing Cp/Cpk; standalone + subgroup; how-to elements |
| `docs/USER-JOURNEYS-PROCESS-FLOW.md` | ~500 words | Placeholder (design-only); links to spec                                  |

### Deletions

| Path                                                    | Reason                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `.claude/rules/` (entire directory, 6 files, 724 lines) | Wrong mechanism (eager-load). Content migrated to Layers 2, 3, 5. |
| `docs/archive/` (65 files)                              | Labeled "HISTORICAL ONLY" by own policy. Git preserves history.   |

### MEMORY.md scope reduction

- Keep: user memories, feedback memories, project-state memories
- Remove: doc-routing entries (duplicates CLAUDE.md routing)
- New rule: MEMORY.md owns session state only; CLAUDE.md owns project routing

## Layer 5: Enforcement

### ESLint plugins (4 new rules)

| Rule                        | What it catches                                         | Files affected                                             |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `no-tofixed-on-stats`       | `.toFixed()` called on stat result variables            | `packages/**/*.ts`, `apps/**/*.ts(x)`                      |
| `no-hardcoded-chart-colors` | Hex literals in chart files                             | `packages/charts/**/*`                                     |
| `no-root-cause-language`    | "root cause" in user-facing strings, i18n, AI prompts   | `packages/core/src/i18n/`, `packages/core/src/ai/prompts/` |
| `no-interaction-moderator`  | "moderator"/"primary" in interaction/regression context | `packages/core/src/stats/`, docs                           |

### Pre-commit hooks (4)

| Hook                   | Purpose                                                          | Action                    |
| ---------------------- | ---------------------------------------------------------------- | ------------------------- |
| `check-spec-index`     | Spec index stale (existing script `scripts/check-doc-health.sh`) | Fail                      |
| `check-dead-links`     | Broken relative `.md` links                                      | Warn 2 weeks, then fail   |
| `check-ssot`           | Same content fingerprint in multiple CLAUDE.mds                  | Warn with file pair       |
| `check-claude-md-size` | CLAUDE.md exceeds target                                         | Warn at 80%, fail at 120% |

### Pre-edit advisories (2)

- Editing ADR without `last-reviewed` frontmatter update → warn
- Editing spec/doc without frontmatter → warn

## Critical Files — Create / Modify / Delete

### Create (new)

- `.claude/skills/{12 skill folders}/SKILL.md` + reference files
- `packages/{core,charts,hooks,ui,stores,data}/CLAUDE.md` (6 files)
- `apps/{azure,pwa}/CLAUDE.md` (2 files)
- `docs/OVERVIEW.md`, `docs/USER-JOURNEYS.md`, `docs/DATA-FLOW.md`
- `docs/USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`
- `tools/eslint-plugin-variscout/` with 4 rules
- `.husky/pre-commit` additions for SSOT + size + link checks

### Modify

- `/CLAUDE.md` — rewrite to ≤50 lines
- `/MEMORY.md` — scope to session state only
- `docs/index.md` — convert to domain manifest
- `eslint.config.js` (or equivalent) — register new plugin
- CI config — add doc-lint stage

### Delete

- `.claude/rules/` (entire directory)
- `docs/archive/` (entire directory, 65 files)

### Reference existing (reused, not recreated)

- `scripts/check-doc-health.sh` — wire into pre-commit
- `scripts/check-diagram-health.sh` — keep, reference from `maintaining-documentation` skill
- Existing ADRs 001-069 — unchanged
- Existing specs in `docs/superpowers/specs/` — unchanged
- Existing `docs/02-journeys/personas/` (10 files) — cross-linked from Tier 1

## Migration Plan — 4 Phases, ~3 Weeks Part-Time

### Phase 1: Foundation (week 1) — fully additive, zero breakage

1. Create `.claude/skills/` with 12 skill folders, each with SKILL.md frontmatter only (empty body, description written for semantic matching)
2. Draft 3 Tier 1 human narrative docs, curated from existing content
3. Draft 5 Tier 2 per-mode journey docs
4. Write new root CLAUDE.md → save as `CLAUDE.md.new` (old stays active)
5. Write 8 per-package CLAUDE.mds → save as `CLAUDE.md.new` in each package (not active)
6. **Zero deletion. Old system fully operational.**

### Phase 2: Content migration + switchover (week 2)

1. Populate 12 skill SKILL.md bodies, migrating content from `rules/` + relevant ADRs/specs
2. Add skill reference files (EXPORTS, COLORS for charts; YAMAZUMI, PERFORMANCE, DEFECT, PROCESS-FLOW for analysis-modes)
3. **Atomic swap:** `CLAUDE.md` → `CLAUDE.md.bak`; `CLAUDE.md.new` → `CLAUDE.md` (root + 8 packages)
4. Run `pnpm test` (5792 tests) — must pass
5. Spot-test 5 typical agent tasks, observe context loading and behavior
6. Adjust skill descriptions if discovery fails
7. Rollback plan: restore `.bak` files if regression

### Phase 3: Enforcement + cleanup (week 3)

1. Implement 4 ESLint plugins in `tools/eslint-plugin-variscout/`
2. Implement 4 pre-commit hooks + 2 pre-edit advisories
3. Run ESLint across codebase — fix existing violations
4. Delete `.claude/rules/` directory
5. Delete `docs/archive/` directory (create `archive-preserved` branch as safety net first)
6. Scope `MEMORY.md` to session state only (remove doc-routing entries)
7. Delete all `CLAUDE.md.bak` files
8. Add CI gate: warn mode for 2 weeks, then blocking

### Phase 4: Observe + iterate (ongoing, first month after Phase 3)

- Weekly: which skills activated? Which didn't? Tune descriptions per Anthropic iteration pattern
- Monthly: delete skills that never activate
- Promote manual correction patterns to ESLint rules when caught 3+ times
- Update `last-reviewed` dates on Tier 1/2 docs; refresh content as product evolves

## Verification

### Pre-migration baseline (before Phase 1)

1. **Evaluation suite:** Create 10 failure-mode prompts that historically triggered C/D failures. Record current correction rate.
2. **Token audit:** Measure always-loaded context for 5 task archetypes (chart edit, stats edit, AI prompt edit, Azure auth edit, test write).
3. **Existing test pass rate:** 5792/5792 passing (baseline).

### Phase-gated checks

- **Phase 1 gate:** Tier 1 docs readable in 15 min by someone unfamiliar with recent work (self-test).
- **Phase 2 gate:** `pnpm test` passes (5792/5792). Spot-test 5 tasks and observe correct context loading.
- **Phase 3 gate:** Zero ESLint errors after fixes. Zero broken links in doc-lint scan. Zero SSOT duplicates detected.
- **Phase 4 ongoing:** Weekly skill activation log reviewed.

### Success metrics

| Metric                               | Baseline                 | Target      | Measured at     |
| ------------------------------------ | ------------------------ | ----------- | --------------- |
| Always-loaded context (lines)        | ~1,080                   | ≤300        | End Phase 2     |
| Failure-mode correction rate         | TBD (measure in Phase 1) | −50%        | Phase 4 week 2  |
| Dead links across docs               | TBD (measure in Phase 1) | 0           | End Phase 3     |
| SSOT duplicates                      | TBD (measure in Phase 1) | 0           | End Phase 3     |
| Skills never activated after 1 month | —                        | ≤1 (delete) | Phase 4 month 1 |
| Test suite pass rate                 | 100% (5792)              | 100%        | Every phase     |

### End-to-end verification commands

```bash
# Baseline (pre-Phase 1)
pnpm test                                                   # expect 5792 passing
wc -l CLAUDE.md .claude/rules/*.md                          # baseline size
# Run 10 evaluation prompts manually, record correction count

# End of Phase 2
pnpm test                                                   # must still pass 5792
wc -l CLAUDE.md packages/*/CLAUDE.md apps/*/CLAUDE.md       # target sum ≤300
# Re-run 10 evaluation prompts, compare correction count

# End of Phase 3
pnpm lint                                                   # expect 0 errors from new rules
bash scripts/check-doc-health.sh                            # expect 0 broken links
pnpm test                                                   # must still pass 5792
```

## Risks & Mitigations

| Risk                                                            | Mitigation                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Skill metadata overhead (~1KB for 12 descriptions) eager-loaded | Acceptable; <0.1% of context window. Monitor; consolidate if it bloats                                                   |
| Agent under-triggers skills                                     | Observe weekly in first month; refine descriptions (concrete triggers, technical terms) per Anthropic iteration guidance |
| Per-package CLAUDE.md drifts from root (duplication)            | Pre-commit SSOT check by section-fingerprint matching                                                                    |
| Tier 1 human docs go stale                                      | `last-reviewed` frontmatter + 90-day warn hook                                                                           |
| ESLint plugin maintenance burden                                | Start with 4 simple rules; expand only when manual corrections catch same pattern 3+ times                               |
| `docs/archive/` deletion loses info                             | Git preserves; create `archive-preserved` safety branch before Phase 3                                                   |
| MEMORY.md loses routing convenience                             | Accept — was overlapping; CLAUDE.md owns project routing                                                                 |
| Migration causes temporary confusion during Phase 2             | Phase 1 is fully additive; Phase 2 swap is reversible via `.bak` files until Phase 3                                     |
| Opus 4.7 literal interpretation breaks existing soft phrasing   | Audit and rewrite soft language ("try to", "prefer") to explicit advisory tags during Phase 1                            |

## Opus 4.7 Specific Preparations

1. **Rewrite soft language** — replace "prefer X" / "try to Y" with "X is advisory; Y is mandatory" or similar explicit framing in all CLAUDE.mds
2. **Remove interim-status scaffolding** — no "summarize every N turns" patterns; 4.7 self-reports
3. **Leverage prompt caching** — root CLAUDE.md + 3 `@imports` should stabilize → cached after first turn. Do not change frequently.
4. **Description specificity** — skills use concrete terms (e.g., `useChartTheme`, `safeMath.ts`, `computeDefectRates`) not generic ("chart helpers") for stronger semantic matching
5. **Checkpoint discipline** — use `/clear` between unrelated migration tasks to avoid context accumulation

## Out of Scope (Explicitly Deferred)

- `apps/website/CLAUDE.md`, `apps/docs/CLAUDE.md` — optional; add if needed
- Generated human docs (from tagged code fragments) — defer until manual curation pain emerges
- Specs as YAML + executable test mappings — defer; spec-as-living-doc policy works
- ADR machine-readable template + auto-indexing — defer; `ls docs/07-decisions/` works
- Freshness dashboard — defer; `git log` + `last-reviewed` frontmatter + hook warning suffice
- Promoting this design to full automated doc-as-code system — revisit after 1-2 months of A++ operation

These are all C-tier elements intentionally deferred per "A now, C elements added incrementally when pain surfaces" principle.

## Summary

**What this achieves:**

- Always-loaded context drops from ~1,080 lines to ~125-250 (70-80% reduction)
- Attacks the two confirmed failure modes (C: overload, D: duplication) directly
- Adopts Anthropic's 5 currently-recommended mechanisms (tiny CLAUDE.md, nested CLAUDE.md, skills, `@imports`, hooks) — VariScout currently uses 0 of them correctly
- Preserves all load-bearing domain knowledge (ADRs, specs, features docs unchanged as retrieval corpus)
- Adds curated human comprehension layer (3 Tier 1 + 5 Tier 2) for project re-orientation
- Promotes top text conventions to deterministic enforcement via ESLint/hooks
- Tuned for Opus 4.7 literal interpretation + prompt caching

**What it costs:**

- ~3 weeks part-time effort across 4 phases
- Initial evaluation suite creation (10 failure-mode prompts)
- Ongoing observation discipline (weekly reviews in first month)
- ESLint plugin maintenance (4 rules, minimal surface)

## Implementation Plans

This spec is implemented in phased plans under `docs/superpowers/plans/`:

- [Phase 1: Foundation](../plans/2026-04-17-agent-docs-architecture-phase1-foundation.md) — fully additive scaffolding (12 skills, 8 package CLAUDE.md.new drafts, 3 Tier 1 + 5 Tier 2 human docs). Zero deletions.
- Phase 2: Content migration + atomic switchover — plan to be written after Phase 1 ships
- Phase 3: Enforcement + cleanup (ESLint + hooks + rules/ + archive/ deletion) — plan to be written after Phase 2 ships

## References

- [Anthropic: Best Practices for Claude Code (April 2026)](https://code.claude.com/docs/en/best-practices)
- [Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Anthropic: Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Claude Opus 4.7 model card](https://www.anthropic.com/claude/opus)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- Internal: `CLAUDE.md`, `.claude/rules/*.md`, `MEMORY.md`, `docs/index.md`, `docs/07-decisions/` (71 ADRs)
