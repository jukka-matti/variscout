---
tier: ephemeral
purpose: build
title: 'Doc Alignment Wave 0 — cross-cutting fixes + Apply-phase sensor'
audience: both
status: active
date: 2026-06-02
layer: spec
---

# Doc Alignment Wave 0 — cross-cutting fixes + Apply-phase sensor

> **For agentic workers:** Execute task-by-task. Each task ends in `pnpm docs:check:frontmatter` (fast) and a commit. Ground every edit against shipped code at the current `main` before writing — do not transcribe stale prose. Steps use `- [ ]`.

**Goal:** clear the inherited cross-cutting drift (the docs 4 tabs cross-reference) + reframe the one L1 doc that materially lags + archive the superseded `question-driven-analyze.md` + add the Apply-phase sensor that stops the backlog recurring.

**Approach:** single-implementer, docs-direct-to-main, commit per task. User-facing edits are **terse and mechanical** (audience = internal + AI agents). Adopt `last-verified` + `verified-against-commit` frontmatter on every doc touched.

**Gate:** `pnpm docs:check:frontmatter` (937-doc validator) + `pnpm docs:check` (diagram/cross-ref/dead-link) must stay green. Source-of-truth for "what shipped": the design spec, ADR-082/085/086/088/089, and the per-tab audit in `investigations.md`.

**Commit stamp:** `verified-against-commit` = the `git rev-parse --short HEAD` at edit time.

---

## Task 1: `specifications.md` → thin product-overview map

**Files:** Modify `docs/03-features/specifications.md`

The audit (Project/Process/Report) flagged this `last-reviewed 2026-05-16` doc as the shared offender. Fix the stale facts and **strip duplicated feature detail** (it should be a map, not the territory — feature mechanics live in their L3 docs).

- [ ] **Step 1: Fix the nav line.** `:58` prints `[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]` → must be `[Home] [Project] [Process] [Explore] [Analyze] [Improve] [Report]` (PR #218 rename: EDA→Explore, Investigation→Analyze).
- [ ] **Step 2: Fix the feature row.** `:64–66` `**Analyze** | EDA / charts…  **Investigation** | Wall + Evidence Map → suspected causes` → relabel to `**Explore** | EDA / charts / Factor Intelligence` and `**Analyze** | Wall + Evidence Map → hypotheses`.
- [ ] **Step 3: Fix stage vocabulary.** Replace every user-facing `Sustainment` with `Control` (`:64, :71, :100–101, :109–116`). Stages = `Charter → Approach → Control`. (Leave any code-identifier mentions alone — but this doc is user-facing prose, so all instances are labels.)
- [ ] **Step 4: Fix the Process row.** `:65` `Canvas / process map (State + Edit modes per V1 spec §3.3)` → `Canvas / process map (Linked Views; State/Edit binary retired per LV1-C)`.
- [ ] **Step 5: De-duplicate.** Replace any section that re-documents feature mechanics (lifecycle internals, Wall mechanics, capability math) with a one-line pointer to the canonical L3 doc (`→ see workflows/analyze-wall.md`, etc.). Keep: what-is-it, ICP, nav, stages, pricing, positioning, metrics, out-of-scope.
- [ ] **Step 6: Frontmatter.** Add `last-verified: 2026-06-02` + `verified-against-commit: <HEAD>`; keep `status: active`.
- [ ] **Step 7: Verify + commit.** `pnpm docs:check:frontmatter` green; `rg -n "Investigation\]|Sustainment|State \+ Edit" docs/03-features/specifications.md` returns nothing. Commit: `docs(wave0): slim specifications.md to a current overview map`.

## Task 2: `ia-nav-model.md` → de-personalize + nav/stage vocab

**Files:** Modify `docs/02-journeys/ia-nav-model.md`

- [ ] **Step 1: Collapse the persona-access table.** `:94–106` shows a per-persona (Lead/Member/Sponsor) tab-access matrix. Wedge §3.5 deleted persona routing → access is **per-project membership ACL**, not per-persona tab gating. Replace the matrix with: Home/all tabs visible to any project member; the only access distinction is project-membership (Lead invites Members/Sponsors per-project; Sponsor is read-mostly, non-gating).
- [ ] **Step 2: Fix Home framing.** `:88` `Home / Report are not scoped by the cascade (Home is project-level…)` → Home is the **cascade origin** (active-IP selected here scopes Process/Explore/Analyze/Improve/Report). Report is a cascade consumer.
- [ ] **Step 3: Fix accessible-projects copy.** `:44–47` "Sponsors see only sponsored Projects…" → reframe as membership-filtered (per-project ACL), Sponsor non-gating.
- [ ] **Step 4: Frontmatter** `last-verified` + `verified-against-commit`.
- [ ] **Step 5: Verify + commit.** `pnpm docs:check` green (this doc has diagrams — confirm the incremental doc-graph check passes). Commit: `docs(wave0): de-personalize ia-nav-model + fix cascade/stage copy`.

## Task 3: `USER-JOURNEYS*` → Analyze sub-journey + terminology

**Files:** Modify `docs/USER-JOURNEYS.md`, `docs/USER-JOURNEYS-PROCESS-FLOW.md`, `docs/USER-JOURNEYS-CAPABILITY.md`

- [ ] **Step 1: PROCESS-FLOW `:42`.** `creates a SuspectedCause` → `creates a Hypothesis` (ADR-085: SuspectedCause never a type).
- [ ] **Step 2: CAPABILITY `:65`.** `Improve stage (action tracker) and Sustainment ("did the fix hold?")` → `Improve tab (top-level verb tab) and the Control stage` (Improve is a top-level tab; Sustainment→Control).
- [ ] **Step 3: Refresh the Analyze sub-journey in `USER-JOURNEYS.md`.** The analyst flow is now scope-first: drill → capture Finding → compound `ProblemStatementScope` → hypotheses → model-builder → test-plan triad → disconfirmation → per-hypothesis What-If Cpk → Improve handoff. Replace any mode/lens-picker or question-tree narration. **Terse** — a few sentences, grounded against ADR-085/088/089 + the spine in `methodology.md` (already current).
- [ ] **Step 4: Frontmatter** on each touched file.
- [ ] **Step 5: Verify + commit.** `rg -n "SuspectedCause|mode/lens|question tree" docs/USER-JOURNEYS*.md` clean. Commit: `docs(wave0): refresh Analyze sub-journey + journey terminology`.

## Task 4: `eda-mental-model.md` (L1) → reframe §2–7

**Files:** Modify `docs/01-vision/eda-mental-model.md`

The supersession banner (§1) exists but §2–7 still treat `Question` as a tracked entity + name `SuspectedCause` + "three projections". Reframe the body (not just the banner) to the shipped model.

- [ ] **Step 1: Ground.** Read ADR-085 (drop Question / ProblemStatementScope first-class), ADR-086 (unified canvas), ADR-089 (retire mode/lens), and `methodology.md` (current spine). Note the current entities: Finding, ProblemStatementScope, Hypothesis, CausalLink.
- [ ] **Step 2: Reframe §2–7.** Replace Question-tree / "three projections" / SuspectedCause framing with: one `y=f(x)` → two projections (Evidence Map factor-centric + Wall hypothesis-centric) on a unified canvas; scope = WHERE (first-class), hypotheses = WHY (nested); mode/lens retired (four charts always-on; four lenses = pedagogy). **Terse** — this is an internal mental-model doc, not a tutorial. Preserve genuinely-historical references only inside clearly-marked "(pre-IM-1, historical)" asides.
- [ ] **Step 3: Frontmatter** `last-verified` + `verified-against-commit`; keep the supersession banner.
- [ ] **Step 4: Verify + commit.** `rg -n "three projections|SuspectedCause" docs/01-vision/eda-mental-model.md` returns only historical-aside lines. `pnpm docs:check` green. Commit: `docs(wave0): reframe eda-mental-model §2-7 to the shipped scope-first model`.

## Task 5: Archive `question-driven-analyze.md` (salvage first)

**Files:** Create `docs/archive/workflows/question-driven-analyze.md` (move); Modify `docs/03-features/workflows/analyze-wall.md` (salvage), `apps/docs/astro.config.mjs` (slug), `docs/01-vision/methodology.md` (pointer if needed)

- [ ] **Step 1: Salvage the 2 worthwhile bits.** Port into `analyze-wall.md` (or `docs/03-features/learning/glossary.md` if a better fit): (a) the η²-based validation thresholds (`≥15%` supports / `<5%` ruled-out / `5–15%` partial) if not already present; (b) the "**never root cause** — Suspected vs Supported" terminology note. Drop everything else (Question-tree mechanics, SuspectedCause hubs, old tier matrix, mode-axis, ADR-056 Questions tab, DIAMOND phases — all stale).
- [ ] **Step 2: Move the file.** `git mv docs/03-features/workflows/question-driven-analyze.md docs/archive/workflows/question-driven-analyze.md`. Add a top banner: `> **Archived 2026-06-02 — superseded by [analyze-wall.md] + the investigation-surface spec (ADR-085). Historical only.**` Set frontmatter `status: archived`.
- [ ] **Step 3: Fix the sidebar slug.** In `apps/docs/astro.config.mjs` find the `03-features/workflows/question-driven-analyze` sidebar entry and remove it (or repoint to the archive). Verify Starlight build doesn't break: the slug must resolve or be gone.
- [ ] **Step 4: Verify pointer.** `methodology.md:365` already marks question-driven as historical — confirm it still resolves (or update to point at the archive path).
- [ ] **Step 5: Verify + commit.** `pnpm docs:check` (dead-link check must pass — no doc should link to the old path). Commit: `docs(wave0): archive question-driven-analyze, salvage thresholds+terminology`.

## Task 6: Stub-doc triage (honest flagging)

**Files:** Modify `docs/03-features/data/{acl,etag-concurrency,export,cloud-sync}.md`, `docs/03-features/ai/coscout.md`

These May stubs ("body to be expanded") are owned by later waves (data → Wave 2, coscout → Wave 3). Wave 0 only makes them **honest** — no content fill.

- [ ] **Step 1:** For each stub, add `last-verified: 2026-06-02` + `verified-against-commit: <HEAD>` and a one-line body banner: `> **Stub — canonical content lands in Wave N of the doc-alignment initiative (see plans/2026-06-02-doc-alignment-master-plan.md).**` (N = 2 for data/\*, 3 for coscout).
- [ ] **Step 2: Verify + commit.** `pnpm docs:check:frontmatter` green. Commit: `docs(wave0): flag May persistence/coscout stubs honestly (owned by later waves)`.

## Task 7: Minor cross-cutting line-fixes

**Files:** Modify `docs/02-journeys/personas/lead.md`, `docs/05-technical/architecture/mental-model-hierarchy.md`, `docs/05-technical/architecture/ai-context-engineering.md`, `docs/03-features/workflows/four-lenses-workflow.md`

- [ ] **Step 1:** `lead.md:50` `run Four Lenses` → `explore the always-on charts (drill into patterns)` (ADR-089: lenses are pedagogy, not a step).
- [ ] **Step 2:** `mental-model-hierarchy.md:89` `SuspectedCauseHub` → `SuspectedCause (pre-IM-1; now Hypothesis)`.
- [ ] **Step 3:** `ai-context-engineering.md` `:45, :73, :77, :278` — replace deleted-function refs: `buildCoScoutSystemPrompt()` → `assembleCoScoutPrompt()`; `buildInvestigationContext()` → `formatAnalyzeContext()`; `buildSuggestedQuestions()` → current entry point; `SuspectedCause hubs` → `Hypothesis hubs`. (Ground against `packages/core/src/ai/prompts/coScout/` to confirm current names.)
- [ ] **Step 4:** `four-lenses-workflow.md:200` — remove the `| Pp/Ppk | Long-term performance | > 1.33 |` row (ADR-084: Cp/Cpk only, no Pp/Ppk).
- [ ] **Step 5: Verify + commit.** `rg -n "Four Lenses|SuspectedCauseHub|buildCoScoutSystemPrompt|Pp/Ppk" docs/` shows only intended/historical hits. Commit: `docs(wave0): minor cross-cutting terminology line-fixes`.

## Task 8: Apply-phase sensor in the frontmatter validator

**Files:** Modify `scripts/check-doc-frontmatter.mjs`; Test: `scripts/__tests__/check-doc-frontmatter.apply-phase.test.mjs` (create, if a sibling test dir exists; else a `node --test` inline run); Modify `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` (mark 2b shipped)

The validator already HARD-FAILs anti-pattern filenames + enforces `implements:`/`serves:`. **Net-new:** a WARN when a `status: delivered` design spec has `implements:` targets whose files were not modified after the spec landed (un-applied doc propagation).

- [ ] **Step 1: Write the failing test.** Given a fixture spec frontmatter `{status:'delivered', implements:['docs/x.md']}` where `docs/x.md`'s last-commit predates the spec's last-commit, the check yields a WARN entry `apply-phase: delivered spec '<spec>' has un-applied implements target 'docs/x.md'`. Assert it returns the warning; assert it does NOT warn when the target was modified after the spec.
- [ ] **Step 2: Run it, confirm fail.** `node --test scripts/__tests__/check-doc-frontmatter.apply-phase.test.mjs` → FAIL (function not exported).
- [ ] **Step 3: Implement.** Add an exported pure helper `checkApplyPhase(specRel, fm, gitLastModified)` where `gitLastModified(path)` returns a commit timestamp (inject `git log -1 --format=%ct -- <path>` via a passed-in resolver so the test can stub it). WARN (not HARD-FAIL — many legacy specs are pre-discipline) when `fm.status==='delivered'` && spec is a design spec && every `implements:` target's mtime < spec's mtime. Wire it into the diff/full run alongside the existing `delivered-by` WARN; add a `show('Apply-phase: delivered spec with un-applied implements target (WARN)', …, true)` reporter line.
- [ ] **Step 4: Run tests, confirm pass.** `node --test …` → PASS. Then full `pnpm docs:check:frontmatter` — confirm exit 0 (WARN doesn't fail the build) and that it surfaces real un-applied specs (expected: the investigation-surface + factors specs, until their waves land).
- [ ] **Step 5: Mark 2b shipped.** In `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` migration table (`:416`) flip Play 2b `🟡 NEXT` → `🟢 SHIPPED (validator extensions 2026-05-17; Apply-phase sensor 2026-06-02)`. Update the `:407` status banner line similarly.
- [ ] **Step 6: Commit.** `git add scripts/check-doc-frontmatter.mjs scripts/__tests__/ docs/superpowers/specs/2026-05-16-docs-strategy-design.md && git commit -m "feat(docs-validator): add Apply-phase sensor; mark Play 2b shipped"`.

---

## Self-review checklist (run after execution, before declaring Wave 0 done)

- [ ] `pnpm docs:check:frontmatter` exit 0; `pnpm docs:check` all green.
- [ ] `rg -n "\\[Analyze\\] \\[Investigation\\]|Sustainment(?!.*code)|State \\+ Edit modes|run Four Lenses|SuspectedCauseHub|Pp/Ppk" docs/` returns only intended historical/code hits.
- [ ] No doc links to `03-features/workflows/question-driven-analyze.md` (dead-link check green).
- [ ] Every doc touched carries `last-verified: 2026-06-02` + `verified-against-commit`.
- [ ] The Apply-phase sensor surfaces the known un-applied specs (proves it works) without failing the build.
- [ ] Update the master plan tracker: check `Wave 0`.
