---
tier: ephemeral
purpose: build
title: 'Analyze Wall redesign — Codex app dispatch prompts (AW-1…AW-DOC)'
status: active
date: 2026-06-08
layer: spec
related:
  - docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md
  - docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md
---

# Analyze Wall Redesign — Codex App Dispatch Prompts

Paste one block at a time into the **Codex app**. **One PR in flight**; fire the next only after the previous merges. Each runs the v2 full loop (ground → author its own sub-plan → build → verify → **merge**). Per-PR detail lives in the master plan's matching `### AW-N` section — Codex reads it in Task 0.

**Order:** AW-1 → AW-2 → AW-3 → AW-4 (demo-minimum) → AW-5 · AW-6 · AW-7 · AW-8 · AW-9 → AW-DOC. AW-5 has no dependency (can slot anytime); AW-9 is unblocked (CS-15 merged). PR #336 stays a draft cherry-pick source — close it after AW-2 + AW-9 land.

---

## AW-1 · Wall readable default scale (fix L-4) — demo-critical

```text
Work in the VariScout repo on a fresh branch feat/aw-1-wall-readable-scale off latest origin/main. You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-1 section of docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md and spec section 7.6 of docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md. You are implementing AW-1: Wall readable default scale (fix the L-4 gap), the first demo-critical PR of the redesign.

Task 0 — ground, then author the contract. This fixes a verified gap: L-4 shipped but the populated Wall still renders ~0.55x and Fit is a no-op (two decoupled scaling layers; the sparse bbox spans full canvas height). Read in code: packages/ui/src/components/AnalyzeWall/wallLayout.ts (computeWallContentBBox ~:311-367, formatWallViewBox), WallCanvas.tsx (populatedViewBox ~:773-777, the <svg viewBox>/<g scale> seam ~:1321-1329), and apps' fitWallToContent (AnalyzeWorkspace.tsx:592, AnalyzeView.tsx:242). Write docs/superpowers/plans/2026-06-08-aw-1-wall-readable-scale.md in the L-1 sub-plan format, commit it, then build straight through (no plan-review stop).

Non-negotiables:
- Pick ONE scaling authority. Recommended: make fitWallToContent recompute AND apply the SVG viewBox (the layer that owns default scale), not just reset inner zoom/pan. Unify the two decoupled layers.
- Tighten computeWallContentBBox for sparse Walls: exclude the always-present scope anchor / factor band / tributary footer when there are no factor glyphs (or clamp to occupied rows).
- Out: snap-river re-layout (deferred).
- Load-bearing test (the existing tests only assert onFit fires): assert (a) default-entry effective scale is legible — content fills >= a viewport threshold (bbox-to-client ratio) — AND (b) pressing Fit on a zoomed Wall actually changes scale. Negative control, not a presence check.
- Don't disturb the legibility surface (suspected-cause card, evidence angles, activity line, Causes matrix); status ladder stays Suspected / Supported / Ruled out. Both apps in parity; test fixtures = factories.

Self-merge gates: bash scripts/pr-ready-check.sh green at the END + browser verification — load ?sample=analyze-showcase, confirm the Wall content fills the canvas on entry (measure viewBox vs client) and that Fit is NOT a no-op after panning/zooming away. Before/after screenshots in the PR body, both apps. Then gh pr merge --merge --delete-branch (never --squash).
```

## AW-2 · Canvas-first chrome — demo-critical (Opus; split AW-2a/2b if the sub-plan exceeds ~8 tasks)

```text
Work in the VariScout repo on a fresh branch feat/aw-2-canvas-first-chrome off latest origin/main (after AW-1 has merged). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-2 section of docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md and spec section 7.2. You are implementing AW-2: Canvas-first chrome — the canvas owns ~85%+ of the Analyze viewport (baseline ~30-40%). This is the largest, judgment-heavy PR — if your sub-plan exceeds ~8 tasks, split into AW-2a/AW-2b sequential PRs.

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-2-canvas-first-chrome.md, commit, build straight through.

Non-negotiables:
- Cherry-pick OverallProblemHeader from PR #336 into the single thin top bar, and MOUNT IT IN BOTH APPS (PR #336 was Azure-only).
- Left "Investigation conclusions" rail → collapsible/overlay.
- View-mode toggle → compact floating control on the canvas corner.
- Missing-evidence digest → thin collapsible nudge.
- best-subsets / ModelBuilderBand → on-demand overlay (toggle, not always-on).
- Out: the drawers (Phase 4), CoScout, the lens cut (AW-4).
- Every relocated chrome element must stay reachable (overlay/float/collapse) — no loss of function.
- Don't disturb the legibility surface; status ladder Suspected / Supported / Ruled out; both apps in parity; fixtures = factories.

Self-merge gates: pr-ready-check green + browser verification — measure canvas share >= ~80% on BOTH apps, and confirm every moved chrome element is still reachable. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-3 · Legible gates — demo-critical

```text
Work in the VariScout repo on a fresh branch feat/aw-3-legible-gates off latest origin/main (after AW-2). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-3 section of the master plan and spec section 7.3. You are implementing AW-3: the gate (HOLDS N/M) reads as a labeled legible badge, not a cryptic tiny diamond.

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-3-legible-gates.md, commit, build straight through.

Non-negotiables:
- Render the gate with a clear label (e.g. "HOLDS 38/42 · H1 ∧ H2") + legible glyph at default scale, composing the shipped runAndCheck output (WallCanvas.tsx:871-893). Keep the onComposeGate drag. Optionally add a small GateBadge component in AnalyzeWall/.
- Out: new gate semantics (the engine is shipped — GateNode, runAndCheck).
- Status ladder Suspected / Supported / Ruled out; both apps; fixtures = factories.

Self-merge gates: pr-ready-check green + browser verification — the gate is readable at default scale and HOLDS reflects the scope's gateNode eval, both apps. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-4 · Demote the Evidence Map — demo-critical (completes demo-minimum)

```text
Work in the VariScout repo on a fresh branch feat/aw-4-demote-evidence-map off latest origin/main (after AW-2). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-4 section of the master plan and spec section 7. You are implementing AW-4: Analyze lands on the Wall; primary lenses = Wall + Causes.

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-4-demote-evidence-map.md, commit, build straight through.

Non-negotiables:
- Default viewMode 'map' → 'wall' (canvasViewportStore.ts:141 + normalizeCanvasViewMode; keep 'causes').
- Drop the Evidence Map lens from the primary toggle in both apps, but KEEP the Findings view (mind the two-layer analyzeViewMode 'map'|'findings' + wallViewMode 'map'|'wall'|'causes' toggle — verify Findings survives and only the Evidence Map lens leaves).
- Park CausalLink authoring (don't mount CausalLinkCreator/AnalyzeMapView in the primary flow).
- DO NOT delete EvidenceMapBase (Report's read-only timeline + PWA mobile still use it). DO NOT touch CausalLink persistence/read (Report + AI read it).
- Load-bearing test: Analyze opens on Wall; primary toggle offers Wall|Causes (no Map); Report STILL renders the evidence map.
- ADR-066 supersession is deferred to AW-DOC.

Self-merge gates: pr-ready-check green + browser verification — lands on Wall, Report unaffected, both apps. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-5 · Wire Finding.scopeId reader → findings-per-scope (no dependency)

```text
Work in the VariScout repo on a fresh branch feat/aw-5-findings-per-scope off latest origin/main. You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-5 section of the master plan and spec section 7.4. You are implementing AW-5: findings show within their scope (close the write-only gap).

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-5-findings-per-scope.md, commit, build straight through.

Non-negotiables:
- Read Finding.scopeId; filter/group the Wall's findings + the left finding list by the active scope (capture already stamps scopeId via addFinding). Files: WallCanvas.tsx findings filter, FindingsLog/finding-list selectors, analyzeStore/useFindings scope-scoped selector, AnalyzeWorkspace.tsx activeScope derivation (~:266-285).
- Keep the hub findingIds/counterFindingIds clue-split intact (orthogonal). Out: changing the clue-split; the lineage trail.
- Load-bearing test: a finding captured in scope B does NOT appear under scope A (negative control); loose findings (no hub) still render.
- Both apps; fixtures = factories.

Self-merge gates: pr-ready-check green + browser verification — switching scope shows that scope's findings, both apps. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-6 · Current scope + switcher (reframe ScopeRail)

```text
Work in the VariScout repo on a fresh branch feat/aw-6-current-scope-switcher off latest origin/main (after AW-5 and AW-2). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-6 section of the master plan and spec section 7.5. You are implementing AW-6: current scope prominent + switch across the few flat sibling scopes; NO lineage trail.

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-6-current-scope-switcher.md, commit, build straight through.

Non-negotiables:
- The scope anchor / problem-condition shows the CURRENT scope; add a compact scope switcher.
- Reframe ScopeRail.tsx from a broad→narrow lineage trail into current-scope + switcher (this is the PR #336 ScopeRail reframe).
- Keep FLAT scopes, NO recursion. Out: lineage metadata as a build target (stays optional additive); child-scope recursion (canon non-goal).
- Both apps; fixtures = factories.

Self-merge gates: pr-ready-check green + browser verification — current scope visible, switching works, flat-no-recursion preserved, both apps. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-7 · Left object-detail drawer (no-AI)

```text
Work in the VariScout repo on a fresh branch feat/aw-7-object-detail-drawer off latest origin/main (after AW-2). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-7 section of the master plan and spec section 7.7. You are implementing AW-7: select a Wall object → a left drawer with Evidence / Comments / Activity — the deterministic, no-AI home.

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-7-object-detail-drawer.md, commit, build straight through.

Non-negotiables:
- New ObjectDetailDrawer in packages/ui/src/components/AnalyzeWall/: a left drawer shell (slim handle closed → drawer open, collapse-by-default for canvas-first); tabs scoped to the selected object (finding/cause/scope/plan); selection state.
- Absorb the conclusions rail. Reuse shipped FindingCard / comments (useHypotheses/useFindings add+edit) / activity bands.
- Out: CoScout (AW-8). Works with ZERO AI.
- PWA parity OR a logged PWA-mount deferral — decide in the sub-plan.

Self-merge gates: pr-ready-check green + browser verification — select object → drawer shows its detail; comments add/edit; canvas-first preserved. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-8 · CoScout right-drawer slot (Azure only)

```text
Work in the VariScout repo on a fresh branch feat/aw-8-coscout-drawer-slot off latest origin/main (after AW-2 and AW-7). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-8 section of the master plan and spec section 7.7. You are implementing AW-8: reserve CoScout's home — slim handle + drawer shell + tab scaffold + REF hook. CONTENT STAYS CS-14 (not this PR).

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-8-coscout-drawer-slot.md, commit, build straight through.

Non-negotiables:
- Right drawer shell (slim handle closed → drawer open); tab scaffold Coach / Evidence / Actions; object-scoped header; reserve the [REF] visual-grounding hook (onRefActivate exists); re-home the existing CoScoutSection into the drawer; panelsStore.isCoScoutOpen becomes the drawer open-state.
- Azure only (PWA has no CoScout). Out: CoScout content/behaviour and the cross-tab highlight (both CS-14).
- CS-10 fence intact: CoScout NEVER sets status.

Self-merge gates: pr-ready-check green + browser verification (Azure) — CoScout opens as the right drawer scoped to the selected object; slim handle when closed; canvas-first preserved. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-9 · Extend the Analyze→Explore WHERE handoff (categorical, additive)

```text
Work in the VariScout repo on a fresh branch feat/aw-9-explore-where-handoff off latest origin/main (CS-15 is merged, so this is unblocked). You own the whole loop: ground → author the sub-plan → build → verify → merge.

Read AGENTS.md, then the AW-9 section of the master plan and spec sections 5 and 7.10. You are implementing AW-9: the chip jump carries the full categorical WHERE (+ optional origin) and Explore applies it to the charts; PWA parity.

Task 0 — ground, then author docs/superpowers/plans/2026-06-08-aw-9-explore-where-handoff.md, commit, build straight through.

Non-negotiables:
- Extend ChipNavigationTarget ADDITIVELY (optional predicates?: ConditionLeaf[] on ALL target kinds + optional findingId?/hypothesisId? origin).
- Apply categorical predicates to projectStore.filters — reuse conditionLeavesToCategoricalFilters from PR #336. Files: navigateToExploreForChip.ts (additive), AnalyzeWorkspace/AnalyzeView call-sites, Dashboard reverse-mirror, hypothesisCondition.ts (reuse helper). Wire the PWA call-site + ScopeChrome mount.
- Out: numeric-range predicates (between/gt/lt) — DEFERRED (needs a projectStore.filters model change beyond membership; separate follow-up spec).
- CS-15's Process-Canvas chip gestures must be unaffected (additive). Both apps.
- After this lands: close PR #336 (its header landed via AW-2, its categorical handoff via AW-9).

Self-merge gates: pr-ready-check green + browser verification — jump from a cause/factor carries the categorical WHERE into Explore charts (not just a chip), both apps. Screenshots in the PR body. Then gh pr merge --merge --delete-branch.
```

## AW-DOC · Doc propagation (Apply at delivery — docs only)

```text
Work in the VariScout repo on a fresh branch feat/aw-doc-propagation off latest origin/main (after the AW PRs above have landed). You own the whole loop: ground → build → verify → merge.

Read AGENTS.md, then the AW-DOC section of docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md.

In scope:
- Supersede ADR-066 (Evidence Map owns center/default → stale).
- Update docs/03-features/workflows/analyze-wall.md + investigation-surface.md: Wall + Causes lenses, canvas-first, current-scope, two-drawer, Map demoted, CausalLink not-now.
- Decision-log entries: Map demotion, lineage-trail-demoted, two-drawer, the "% viewport = canvas" metric, CS-15 coordination.
- Confirm the suspected-cause-card / causes-matrix wireframes stay current.
- Re-status the river-roots Wall spec note if needed.

Docs only. Gate = pnpm docs:check green + the pre-push doc hooks. Then gh pr merge --merge --delete-branch (never --squash).
```
