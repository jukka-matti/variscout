---
tier: ephemeral
purpose: build
title: Canvas Migration PR9 — Legacy component cleanup
audience: human
category: implementation
status: active
last-reviewed: 2026-05-08
related:
  - docs/superpowers/specs/2026-05-04-canvas-migration-design.md
  - docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md
  - docs/decision-log.md
layer: spec
---

# Canvas Migration PR9 — Legacy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Sonnet workhorse for implementer + per-task spec/quality reviewers; Opus reserved for final-branch review.

**Goal:** Delete the orphaned `LayeredProcessView` directory + the deprecated `ProcessMap/ProcessMapBase.tsx` re-export stub; sweep remaining doc/comment references; close out PR9 in the canvas-migration spec, decision-log, and memory.

**Architecture:** PR9 is the strangler-pattern's final retirement step — Canvas (PR1+) replaced both legacy surfaces; PR8 closed the vision-spec gaps; PR9 deletes the now-orphaned components. **Scope correction from spec text:** the canvas-migration spec §6 PR9 row also lists `apps/pwa/src/components/views/FrameView.tsx` and `apps/azure/src/components/editor/FrameView.tsx` for deletion — but both files are now ~170-line **thin route shells** mounting `<CanvasWorkspace/>` (PR8 sub-PR 8e modified them to wire `onOpenWall`). Deleting them would require inlining ~30 LOC of store-wiring into already-large `App.tsx` + `Editor.tsx`. **PRESERVE FrameView shells**; document the deviation in the spec §6 row + decision-log per `feedback_check_shipped_patterns_first`.

**Tech Stack:** TypeScript / React / Vite / Vitest / Tailwind. Worktree at `.worktrees/canvas-pr9-legacy-cleanup/` per `feedback_one_worktree_per_agent`. Branch `canvas-pr9-legacy-cleanup` off `main` at `bdc1a2f3`.

---

## Recon (already done)

| Target                                                            | Callers in production code                                                                                                                  | Verdict              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `packages/ui/src/components/LayeredProcessView/`                  | 0 (only re-exported through `packages/ui/src/index.ts:682-687`; no app or test mounts it outside its own directory)                         | DELETE               |
| `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` (stub) | 0 — `Canvas/index.tsx:31` and `Canvas/__tests__/CanvasProcessMap.test.tsx:4` already import from canonical `Canvas/internal/ProcessMapBase` | DELETE               |
| `apps/pwa/src/components/views/FrameView.tsx`                     | mounted from `apps/pwa/src/App.tsx:108` (lazy) + `:1049` — thin shell delegating to `CanvasWorkspace`                                       | PRESERVE (deviation) |
| `apps/azure/src/components/editor/FrameView.tsx`                  | mounted from `apps/azure/src/pages/Editor.tsx:106` + `:1601` — thin shell delegating to `CanvasWorkspace`                                   | PRESERVE (deviation) |

**Comment-only stragglers** (text-only, no functional impact):

- `packages/ui/src/components/FrameViewB0/FrameViewB0.tsx:16,71` — JSDoc/diagram references to `LayeredProcessViewWithCapability`.
- `packages/ui/src/components/ProcessStepsExpander/ProcessStepsExpander.tsx:6` — JSDoc reference to `<LayeredProcessView />`.
- `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts:46` — JSDoc reference: "LayeredProcessView passes 'spatial'."
- `packages/core/src/processHub.ts:152` — JSDoc reference: "chart filtering across the LayeredProcessView."
- `packages/hooks/src/useProductionLineGlanceOpsToggle.ts:32` — JSDoc reference: "URL ?ops state for the LayeredProcessView Operations band's …"

**Feature-parity doc:** `docs/08-products/feature-parity.md:76` and `:78` reference "LayeredProcessView Operations band" as a shipped feature row + cross-reference inside another row.

---

## File structure

**Files DELETED:**

- `packages/ui/src/components/LayeredProcessView/LayeredProcessView.tsx`
- `packages/ui/src/components/LayeredProcessView/LayeredProcessViewWithCapability.tsx`
- `packages/ui/src/components/LayeredProcessView/index.ts`
- `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessView.test.tsx`
- `packages/ui/src/components/LayeredProcessView/__tests__/LayeredProcessViewWithCapability.test.tsx`
- `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx`
- (the `ProcessMap/` directory becomes empty after the stub deletion → also remove)

**Files MODIFIED:**

- `packages/ui/src/components/index.ts` — none (re-exports are in `packages/ui/src/index.ts` only)
- `packages/ui/src/index.ts` — remove the 6 LayeredProcessView re-export lines (682-687).
- `packages/ui/src/components/FrameViewB0/FrameViewB0.tsx` — JSDoc text update (lines 16, 71).
- `packages/ui/src/components/ProcessStepsExpander/ProcessStepsExpander.tsx` — JSDoc text update (line 6).
- `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts` — JSDoc text update (line 46).
- `packages/core/src/processHub.ts` — JSDoc text update (line 152).
- `packages/hooks/src/useProductionLineGlanceOpsToggle.ts` — JSDoc text update (line 32).
- `docs/08-products/feature-parity.md` — remove the LayeredProcessView Operations band row (line 78); update the ProductionLineGlanceDashboard row (line 76) to remove the "LayeredProcessView Operations band" mention.
- `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` §6 PR9 row — mark SHIPPED with the FrameView-preserve deviation noted.
- `docs/decision-log.md` — new entry: "Canvas Migration PR9 cleanup SHIPPED + FrameView-preserve deviation."
- `~/.claude/projects/.../memory/MEMORY.md` and `project_pr8_canvas_vision_alignment (memory entry)` — extend the "PR9 cleanup unblocked" line to "PR9 cleanup SHIPPED 2026-05-08."

**Files PRESERVED (deviation from spec):**

- `apps/pwa/src/components/views/FrameView.tsx` — thin route shell, kept.
- `apps/azure/src/components/editor/FrameView.tsx` — thin route shell, kept.

---

## Task 1: Delete LayeredProcessView re-exports + directory

**Files:**

- Modify: `packages/ui/src/index.ts:682-687`
- Delete: `packages/ui/src/components/LayeredProcessView/` (entire directory, 5 files)

**Goal:** Remove the public-API re-exports first (so any forgotten caller surfaces as a TS error), then delete the directory.

- [ ] **Step 1: Remove the re-exports from `packages/ui/src/index.ts`**

Read the current contents of lines 682-687 — they are:

```ts
export { LayeredProcessView, type LayeredProcessViewProps } from './components/LayeredProcessView';
export { LayeredProcessViewWithCapability } from './components/LayeredProcessView';
export type {
  LayeredProcessViewWithCapabilityProps,
  ProductionLineGlanceOpsMode,
} from './components/LayeredProcessView';
```

Decision: `ProductionLineGlanceOpsMode` is also re-exported from this block. Verify with `grep -rn "ProductionLineGlanceOpsMode" packages/` whether it has any callers. If callers exist, keep the type but re-export it from its canonical home (likely `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts`). If no callers, drop it.

Replace the entire block (lines 682-687, six lines total) with **zero** lines (or with a single blank line if the surrounding context needs it). Run `pnpm --filter @variscout/ui run typecheck` to confirm any orphaned imports are caught early.

- [ ] **Step 2: Delete the LayeredProcessView directory**

Run:

```bash
rm -rf packages/ui/src/components/LayeredProcessView
```

- [ ] **Step 3: Run the test suite to confirm no regressions**

Run: `pnpm --filter @variscout/ui test`
Expected: PASS, with the @variscout/ui test count down by ~10–30 tests (the 2 deleted test files; current count from PR8 closure was 1709).

If `ProductionLineGlanceOpsMode` had callers, this is the moment to fix the import path before re-running.

- [ ] **Step 4: Run a full repo build to confirm cross-package consumers are clean**

Run: `pnpm build`
Expected: all packages build green; no `Module not found: '@variscout/ui'` errors.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/index.ts packages/ui/src/components/LayeredProcessView
git commit -m "$(cat <<'EOF'
feat(pr9): delete LayeredProcessView (orphaned post-Canvas migration)

Canvas + CanvasWorkspace fully replaced LayeredProcessView through PR1-PR8;
no production callers remained. Removes the directory + the @variscout/ui
re-exports.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 2: Delete the orphaned ProcessMap/ProcessMapBase deprecation stub

**Files:**

- Delete: `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx`
- Delete: `packages/ui/src/components/ProcessMap/` (becomes empty after the file deletion)

**Goal:** The stub at `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` is a 244-byte re-export pointing to `./Canvas/internal/ProcessMapBase`. Recon confirmed both production callers (`Canvas/index.tsx:31` and `Canvas/__tests__/CanvasProcessMap.test.tsx:4`) already import from the canonical `internal/` path. The stub is orphaned.

- [ ] **Step 1: Confirm no callers (defensive)**

Run:

```bash
grep -rln "from.*'../ProcessMap/ProcessMapBase'\|from \"../ProcessMap/ProcessMapBase\"" packages/ apps/
```

Expected: zero hits. If a hit appears, switch the import to `from '../Canvas/internal/ProcessMapBase'` and re-run before deleting.

- [ ] **Step 2: Delete the file + the now-empty directory**

```bash
rm packages/ui/src/components/ProcessMap/ProcessMapBase.tsx
rmdir packages/ui/src/components/ProcessMap
```

- [ ] **Step 3: Run @variscout/ui tests + repo build**

Run: `pnpm --filter @variscout/ui test`
Run: `pnpm build`
Expected: both green; test count unchanged from Task 1's baseline (no tests for the stub).

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ProcessMap
git commit -m "$(cat <<'EOF'
feat(pr9): delete orphaned ProcessMap/ProcessMapBase deprecation stub

The stub re-exported the canonical Canvas/internal/ProcessMapBase but
had zero callers — both production importers already use the canonical
path. Removes the empty ProcessMap/ directory.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 3: Sweep JSDoc/comment references + feature-parity doc

**Files:**

- Modify: `packages/ui/src/components/FrameViewB0/FrameViewB0.tsx` (lines 16, 71)
- Modify: `packages/ui/src/components/ProcessStepsExpander/ProcessStepsExpander.tsx` (line 6)
- Modify: `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts` (line 46)
- Modify: `packages/core/src/processHub.ts` (line 152)
- Modify: `packages/hooks/src/useProductionLineGlanceOpsToggle.ts` (line 32)
- Modify: `docs/08-products/feature-parity.md` (lines 76, 78)

**Goal:** Replace stale references to `LayeredProcessView` in code comments + the feature-parity doc with `Canvas` or context-appropriate phrasing. Per `feedback_fix_absorbed_violations_at_seam`: deletion is the right moment to clean up comment debt at the boundary.

- [ ] **Step 1: FrameViewB0 JSDoc**

Read `packages/ui/src/components/FrameViewB0/FrameViewB0.tsx` lines 1-80 to see the JSDoc/diagram block. Replace `LayeredProcessViewWithCapability` with `Canvas` (or `CanvasWorkspace` if the surrounding diagram already references the workspace).

- [ ] **Step 2: ProcessStepsExpander JSDoc**

Read `packages/ui/src/components/ProcessStepsExpander/ProcessStepsExpander.tsx` lines 1-15. Replace `<LayeredProcessView />` with `<Canvas />` (or generic "the canvas" if the JSDoc allows). Keep the JSDoc accurate — if `ProcessStepsExpander` is no longer used by any canvas-shaped surface, surface that as a Tier-3 followup investigations.md note rather than rewriting it speculatively.

- [ ] **Step 3: ProductionLineGlanceDashboard types JSDoc**

Read `packages/ui/src/components/ProductionLineGlanceDashboard/types.ts` lines 40-50. Replace `"LayeredProcessView passes 'spatial'."` with the actual modern caller (`Canvas`'s capability lens, if applicable) or simplify to `"Spatial reveal mode is used by the canvas's progressive-reveal callsites."` if the original caller has migrated.

- [ ] **Step 4: processHub.ts JSDoc**

Read `packages/core/src/processHub.ts` line 152 and surrounding context. Replace `"chart filtering across the LayeredProcessView."` with `"chart filtering across the canvas surface."` or similar.

- [ ] **Step 5: useProductionLineGlanceOpsToggle JSDoc**

Read `packages/hooks/src/useProductionLineGlanceOpsToggle.ts` line 32 and surrounding context. Replace `"URL ?ops state for the LayeredProcessView Operations band's …"` with `"URL ?ops state for the canvas's Operations band …"` (the Operations band concept is preserved inside Canvas; only the host name changed).

- [ ] **Step 6: feature-parity doc — line 78 row deletion**

Open `docs/08-products/feature-parity.md`. Find the row at line 78 with `**LayeredProcessView Operations band**` and delete it. The Operations band is now part of the Canvas capability lens; the table should not advertise a separate row for the deleted host component.

- [ ] **Step 7: feature-parity doc — line 76 row update**

In the same file, find the `**ProductionLineGlanceDashboard**` row (around line 76). Edit the trailing prose: remove `"; LayeredProcessView Operations band"` from the surfaces list. The dashboard is still used by the Hub Capability tab + Canvas (formerly LayeredProcessView's Operations band); update the prose to reflect that.

- [ ] **Step 8: Final repo grep — confirm zero remaining `LayeredProcessView` references in product code**

```bash
grep -rln "LayeredProcessView" packages/ apps/ --include="*.ts" --include="*.tsx"
```

Expected: zero hits. (Doc/spec-file references in `docs/` are out of scope for this task — they document history.)

- [ ] **Step 9: Run repo tests + build to ensure JSDoc edits don't break anything**

Run: `pnpm test` (full repo) — all packages should remain green.
Run: `pnpm build` — green.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/FrameViewB0/FrameViewB0.tsx \
        packages/ui/src/components/ProcessStepsExpander/ProcessStepsExpander.tsx \
        packages/ui/src/components/ProductionLineGlanceDashboard/types.ts \
        packages/core/src/processHub.ts \
        packages/hooks/src/useProductionLineGlanceOpsToggle.ts \
        docs/08-products/feature-parity.md
git commit -m "$(cat <<'EOF'
docs(pr9): sweep stale LayeredProcessView references in JSDoc + feature-parity

Five JSDoc blocks across @variscout/ui + @variscout/core + @variscout/hooks
referenced LayeredProcessView; canvas migration absorbed those surfaces.
Updates each comment to point at Canvas. Feature-parity doc loses the
Operations-band row (absorbed into Canvas's capability lens).

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
```

---

## Task 4: PR9 close-out — spec + decision-log + memory

**Files:**

- Modify: `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` (§6 PR9 row, around line 285-296)
- Modify: `docs/decision-log.md` (insert new SHIPPED entry near the top of §1 Replayed Decisions, dated 2026-05-08)
- Modify: `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/project_pr8_canvas_vision_alignment (memory entry)` (extend closure paragraph)
- Modify: `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/MEMORY.md` (extend the index entry one-liner)

**Goal:** Close the PR9 doc loop. Document the FrameView-preserve deviation explicitly so future sessions don't re-open the question.

- [ ] **Step 1: Update canvas-migration spec §6 PR9 row**

Read `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` lines 285-296. Replace the PR9 entry with a SHIPPED block:

```markdown
### PR9 — Cleanup: delete legacy components (renumbered from PR8)

**SHIPPED 2026-05-08** — branch `canvas-pr9-legacy-cleanup`, PR #<NNN>, merge `<SHA>`.

Deletions delivered:

- `packages/ui/src/components/LayeredProcessView/` — directory + @variscout/ui re-exports removed.
- `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` — orphaned deprecation stub deleted (real ProcessMapBase already lives at `Canvas/internal/ProcessMapBase`).
- Stale JSDoc + feature-parity doc references swept.

**Deviation from original spec text:** `apps/pwa/src/components/views/FrameView.tsx` and `apps/azure/src/components/editor/FrameView.tsx` were originally listed for deletion. Post-PR8 both files are ~170-line **thin route shells** mounting `<CanvasWorkspace/>` (PR8 sub-PR 8e wired `onOpenWall` through them). Deleting them would inline ~30 LOC of store-wiring into already-large `App.tsx` + `Editor.tsx` host files. **Decision: PRESERVE the FrameView shells** as part of the strangler pattern's lasting facade per `feedback_check_shipped_patterns_first`. The vision §6 commitment ("delete legacy canvas-rendering FrameView in same PR as Canvas ships") is honored by canvas-rendering having moved to `<CanvasWorkspace/>`; the route-shell layer the FrameViews now occupy is structurally different from the legacy FrameView.

**Acceptance:** legacy `LayeredProcessView` + `ProcessMapBase` removed; no production code references either; thin-shell FrameViews preserved as documented.
```

(Replace `<NNN>` and `<SHA>` after the PR is opened + merged.)

- [ ] **Step 2: Add decision-log entry**

Open `docs/decision-log.md`. Find the insertion point at the top of §1 Replayed Decisions (just below the latest `2026-05-08` entry — the PR8 SHIPPED entry). Insert:

```markdown
- **2026-05-08 — Canvas Migration PR9 legacy cleanup SHIPPED + FrameView-preserve deviation.** PR #<NNN> (merge `<SHA>`) deletes `packages/ui/src/components/LayeredProcessView/` (orphaned 5 files; 0 production callers post-Canvas migration) + the orphaned `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` deprecation stub (real component lives at `Canvas/internal/ProcessMapBase`). Sweeps 5 JSDoc references + the feature-parity doc's Operations-band row. **Deviation from canvas migration spec §6 PR9:** the spec listed `apps/pwa/src/components/views/FrameView.tsx` + `apps/azure/src/components/editor/FrameView.tsx` for deletion; post-PR8 both are ~170-line thin route shells mounting `<CanvasWorkspace/>` (sub-PR 8e wired `onOpenWall` through them). PRESERVED both per `feedback_check_shipped_patterns_first`: the strangler-pattern's facade layer is the right home for store-wiring + tier guards, and inlining ~30 LOC into already-large `App.tsx` + `Editor.tsx` would violate the workflow's slice-size discipline for marginal gain. The vision §6 commitment ("delete legacy canvas-rendering surfaces in the same PR as Canvas ships") is honored by canvas-rendering having moved to `<CanvasWorkspace/>` — the FrameView shells now hold a different responsibility (route shell) than the original legacy `FrameView` (canvas renderer). **Closes the canvas-migration spec PR9 row.** Strangler-pattern complete: Canvas is the only canvas-shaped surface in the codebase; LayeredProcessView + ProcessMapBase fully retired. _Pinned 2026-05-08._
```

(Replace `<NNN>` and `<SHA>` after the merge.)

- [ ] **Step 3: Update memory file**

Open `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/project_pr8_canvas_vision_alignment (memory entry)`. Find the `**Closure (CLOSED 2026-05-08):**` paragraph (added in PR8 close-out). Append at the end:

```
**PR9 cleanup SHIPPED 2026-05-08** (PR #<NNN>, merge `<SHA>`): `LayeredProcessView/` directory + orphaned `ProcessMap/ProcessMapBase.tsx` stub deleted; FrameView shells preserved per `feedback_check_shipped_patterns_first` (170-line thin shells mounting CanvasWorkspace; strangler-pattern's lasting facade). Strangler-pattern complete.
```

- [ ] **Step 4: Update memory index**

Open `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/memory/MEMORY.md`. Find the line:

```
- [Canvas Migration PR8 Vision Alignment SHIPPED](project_pr8_canvas_vision_alignment (memory entry)) — Master plan CLOSED 2026-05-08; 5 vision-spec gaps closed via 8a #137 (CTAs) + 8b #138 (drift+time-series) + 8d #140 (hypothesis-arrow draw) + 8e #141 (Wall mirror Fork 1). 8f tracked separately. PR9 cleanup unblocked.
```

Replace `PR9 cleanup unblocked.` with `PR9 cleanup SHIPPED 2026-05-08 (#<NNN>); FrameView shells preserved.`

- [ ] **Step 5: Commit (docs only — fine for direct-to-main per CLAUDE.md if PR9 is small)**

NOTE: this commit lands AFTER the PR is merged, since the PR number + merge SHA aren't known yet. The actual sequence is:

1. Commit Tasks 1-3 on the branch.
2. Push branch + open PR.
3. Address review feedback.
4. Squash-merge.
5. THEN commit Task 4 doc updates direct to main with the resolved PR number + SHA.

```bash
git add docs/superpowers/specs/2026-05-04-canvas-migration-design.md docs/decision-log.md
git commit -m "$(cat <<'EOF'
docs: PR9 SHIPPED — canvas migration strangler pattern complete

Closes the canvas-migration spec §6 PR9 row + adds decision-log entry
documenting the FrameView-preserve deviation. LayeredProcessView and
ProcessMapBase fully retired; the strangler pattern is complete.

Co-Authored-By: ruflo <ruv@ruv.net>
EOF
)"
git push origin main
```

(Memory edits in `~/.claude/...` are user-local and not version-controlled by the project repo; they're saved automatically when written.)

---

## Task 5: PR-ready check + final code review + open PR + merge

**Files:** none (read-only verification + PR lifecycle).

**Goal:** Run the standard PR-ready check, dispatch the final reviewer (Sonnet is sufficient — PR9 is small, well-scoped, mostly deletions), open the PR, address review feedback if any, squash-merge.

- [ ] **Step 1: Confirm branch is clean + sync with main**

```bash
git status                           # clean
git fetch origin
git log HEAD..origin/main --oneline  # should be empty (we branched off the latest main)
```

If main has advanced ≥10 commits since the branch was cut, merge main first per CLAUDE.md "Workflow" guidance.

- [ ] **Step 2: Run pr-ready-check**

```bash
bash scripts/pr-ready-check.sh
```

Expected: all checks green (build + lint + typecheck + tests + docs:check). Lint warnings remain pre-existing React-19 compiler warnings, not PR9 regressions.

- [ ] **Step 3: Dispatch the final code-reviewer subagent**

Sonnet is sufficient for PR9 (small, mostly deletion + JSDoc edits — no new architecture). Use `feature-dev:code-reviewer` agent type. Reviewer should walk:

1. Confirm the deleted files have zero remaining references.
2. Confirm `pnpm build` and `pnpm test` are green.
3. Confirm the JSDoc edits in Task 3 are accurate (Canvas IS the surface that absorbed each reference).
4. Confirm no inadvertent edits to `apps/pwa/src/components/views/FrameView.tsx` or `apps/azure/src/components/editor/FrameView.tsx` (those are the deviation — should be untouched).
5. Confirm no `// @ts-ignore` / `Math.random` / hardcoded palette colors / `: any` introduced.

Bundle any review nits in this PR per `feedback_bundle_followups_pre_merge`.

- [ ] **Step 4: Push + open PR**

```bash
git push -u origin canvas-pr9-legacy-cleanup
gh pr create --title "Canvas Migration PR9 — legacy cleanup (LayeredProcessView + ProcessMapBase)" --body "$(cat <<'EOF'
## Summary
- Deletes `packages/ui/src/components/LayeredProcessView/` (orphaned post-Canvas migration; 0 production callers).
- Deletes `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` deprecation stub (real component lives at `Canvas/internal/ProcessMapBase`).
- Sweeps 5 stale JSDoc references + the feature-parity doc's Operations-band row.

## Scope correction (deviation from spec)
The canvas-migration spec §6 PR9 row also listed `apps/pwa/src/components/views/FrameView.tsx` and `apps/azure/src/components/editor/FrameView.tsx` for deletion. Both files are now ~170-line thin route shells mounting `<CanvasWorkspace/>` (PR8 sub-PR 8e wired `onOpenWall` through them). PRESERVED both per `feedback_check_shipped_patterns_first` — the strangler pattern's facade layer is the right home for the store-wiring + tier guards. Documented in §6 PR9 row + decision-log.

## Test plan
- [x] `pnpm test` — full repo green
- [x] `pnpm build` — green
- [x] `grep -rln "LayeredProcessView" packages/ apps/ --include="*.ts" --include="*.tsx"` — zero hits

## Refs
- Plan: `docs/superpowers/plans/2026-05-08-canvas-pr9-legacy-cleanup.md`
- Spec: `docs/superpowers/specs/2026-05-04-canvas-migration-design.md` §6 PR9
- Master: `docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md` §7 closure

🤖 Generated with [ruflo](https://github.com/ruvnet/ruflo)
EOF
)"
```

- [ ] **Step 5: Address review feedback (if any)**

Apply fixes inside the same PR per `feedback_bundle_followups_pre_merge`. Re-run pr-ready-check + final reviewer if non-trivial.

- [ ] **Step 6: Squash-merge + cleanup**

```bash
gh pr merge <PR#> --squash --delete-branch
git checkout main
git pull --ff-only origin main
git worktree remove .worktrees/canvas-pr9-legacy-cleanup
git branch -D canvas-pr9-legacy-cleanup
```

- [ ] **Step 7: Run Task 4 doc updates direct to main**

Now that the PR# + merge SHA are known, run the Task 4 commit (steps 1-5) directly on `main` per CLAUDE.md (docs/scripts/etc allow direct-to-main). This avoids a second PR for pure doc updates.

---

## Summary

5 tasks. Tasks 1-3 are TDD-shaped deletion tasks; Task 4 is doc-only close-out (runs after merge); Task 5 is the standard PR lifecycle. Estimated ~1-2 hour wall-clock with subagent dispatches.

## Test plan

- Task 1: `pnpm --filter @variscout/ui test` green; `pnpm build` green; @variscout/ui test count drops by the count of LayeredProcessView tests.
- Task 2: same suite green; test count unchanged.
- Task 3: full repo `pnpm test` + `pnpm build` green; `grep -rln "LayeredProcessView" packages/ apps/ --include="*.ts" --include="*.tsx"` returns zero hits.
- Task 5: pr-ready-check green; final reviewer approves; PR squash-merges cleanly.
