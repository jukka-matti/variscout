---
title: 'PR 1 — Wedge V1 Phase A Doc Completion'
status: draft
last-reviewed: 2026-05-17
parent: docs/archive/specs/2026-05-17-wedge-phase-a-doc-completion-design.md
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
layer: spec
---

# PR 1 — Wedge V1 Phase A Doc Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan. **Single Opus implementer dispatch with internal Architect → Migration → Validator phases** (per `feedback_atomic_sweep_one_dispatch`) — upgraded from Sonnet → Opus because the anchor rewrites are HIGH-criticality strategic content (canonical anchors that every downstream artifact inherits from; high judgment density + integration breadth + low reversibility). Per-task commits inside one dispatch. End-of-task two-stage review: **Sonnet spec reviewer** (mechanical pattern-matching) + **Opus quality reviewer** (craft-quality on strategic prose). **Opus final-branch reviewer** before squash-merge. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the wedge spec §13 Phase A commitment — rewrite 7 canonical anchor docs to reflect wedge V1 architecture, fix audit-caught drift in OVERVIEW + ADR-082 + CLAUDE.md files, and create the Phase C plan artifact.

**Architecture:** Docs-only PR, ~14 files, ~5-7 hours of implementer work. One worktree. Per-anchor commits for granular rollback. The implementer reads current state → applies guidance → verifies via grep + `pnpm docs:check` → commits.

**Tech Stack:** Markdown + YAML frontmatter. No code changes. Validators: `pnpm lint` (lint-staged prettier + ADR-074 + CLAUDE.md SSOT + doc-graph + frontmatter + dead-link). No browser walk per `feedback_wedge_v1_no_migration_no_backcompat`.

**Spec:** [`docs/archive/specs/2026-05-17-wedge-phase-a-doc-completion-design.md`](../../archive/specs/2026-05-17-wedge-phase-a-doc-completion-design.md)

---

## Vocabulary rules (apply across all tasks)

- **Use `VariScout`** for the current product (today, V1, single €120/mo SKU)
- **Use `VariScout Process`** for the named-future enterprise platform
- **Do NOT use "wedge"** in customer-facing anchors (positioning, business-bible, roadmap, OVERVIEW, USER-JOURNEYS, llms.txt, README, membership-philosophy)
- **"Wedge" stays** in: ADR-082, decision-log.md, sub-plans, commit messages, root CLAUDE.md workflow/feedback sections (developer-facing)
- **Price:** `€120/month` everywhere as current truth (preserve `€79/€199` only in clearly-historical migration contexts)

---

## Task 0: Worktree setup

**Files:**

- Create: `.worktrees/feat/wedge-phase-a-doc-cleanup` (worktree directory)

- [ ] **Step 1: Create worktree off main**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite
git worktree add .worktrees/feat/wedge-phase-a-doc-cleanup -b feat/wedge-phase-a-doc-cleanup main
```

- [ ] **Step 2: Install dependencies + verify clean baseline**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
pnpm install 2>&1 | tail -3
pnpm docs:check 2>&1 | tail -5
```

Expected: install done; docs:check green (529+ docs validated).

---

## Task 1: Architect phase — read current state of all 7 anchor docs

This is the **internal Architect phase** of the atomic-sweep pattern. The implementer reads everything before editing anything. No commit yet — outputs a working-notes map.

**Files (read-only):**

- `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` (source of truth for substance)
- `docs/decision-log.md` (the 2026-05-16 wedge entry — item #11 is the cleanup commitment)
- `docs/07-decisions/adr-082-wedge-architecture.md` (decision rationale)
- The 7 anchor docs + the 5 drift-fix targets

- [ ] **Step 1: Read the canonical sources**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
sed -n '1,150p' docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
sed -n '500,540p' docs/superpowers/specs/2026-05-16-wedge-architecture-design.md  # §13
grep -A 1 "Wedge pivot" docs/decision-log.md | head -3
```

- [ ] **Step 2: Read each anchor doc in current state**

```bash
wc -l docs/DATA-FLOW.md docs/01-vision/positioning.md docs/01-vision/business-bible.md docs/08-products/tier-philosophy.md docs/roadmap.md CLAUDE.md docs/llms.txt
# Expect ~1200 total lines across the 7 anchors
```

Read each file. Note current vocabulary (tier-language, "wedge" usage, price mentions).

- [ ] **Step 3: Output the migration map**

In the FIRST commit's message body (later in Task 3), list for each anchor:

- Current line count
- Top 3 concepts that need updating
- Whether "wedge" appears (count via `grep -ci wedge`)
- Whether `€99` / `€79` / `€199` appears

No file edited yet. Move to Migration phase.

---

## Task 2: Rewrite `docs/DATA-FLOW.md`

**Files:**

- Modify: `docs/DATA-FLOW.md` (currently 116 lines)

**Substance to capture:**

- Single-SKU data flow — no tier discrimination
- Project-membership ACL is the data-isolation layer (Hub-level data is tenant-wide; Project-formal data is membership-scoped per ADR-082 §4.4)
- PWA-free vs Azure-paid is a **capability** distinction, not a tier
- Three numeric-safety boundaries (ADR-069) unchanged
- Browser-only processing invariant (ADR-059) unchanged

**Vocabulary:** no "wedge" word; no "Team tier"; no `isPaidTier()` / `hasTeamFeatures()` mentions.

- [ ] **Step 1: Read current state**

```bash
cat /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup/docs/DATA-FLOW.md
```

- [ ] **Step 2: Rewrite in place**

Edit using the Edit tool. Preserve the numeric-safety boundary structure + existing ADR cross-refs. Replace tier-related framing with project-membership-ACL framing. Replace any "wedge" word with "V1" or "VariScout" depending on context.

- [ ] **Step 3: Verify**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
grep -i "wedge\|isPaidTier\|hasTeamFeatures\|Team tier" docs/DATA-FLOW.md
# Expect: zero hits (or only inside backticks as retired symbols documenting that they were retired)
grep "VariScout\|project-membership\|ADR-082\|ACL" docs/DATA-FLOW.md
# Expect: multiple hits
```

- [ ] **Step 4: Commit**

```bash
git add docs/DATA-FLOW.md
git commit -m "docs(wedge): rewrite DATA-FLOW.md for single-SKU + project-membership ACL"
```

---

## Task 3: Rewrite `docs/01-vision/positioning.md`

**Files:**

- Modify: `docs/01-vision/positioning.md` (currently 307 lines)

**Substance to capture:**

- "VariScout = structured investigation for process improvement"
- One product for improvement specialists at €120/month, Azure tenant-wide, project-membership ACLs
- Two-product roadmap: **VariScout today + VariScout Process future** (named-future, not announced; mentioned only when customers ask about enterprise use cases — per decision-log item #8)
- Positioning unchanged from pre-wedge: V1 delivers the whole sentence for one project lead and their invited team
- Audience: improvement specialists (Six Sigma BB, MBB, process improvement leads, quality engineers)

**Vocabulary:** no "wedge" word. Use "V1" or "today" or "the current product" instead.

- [ ] **Step 1: Read current state + count "wedge"**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
cat docs/01-vision/positioning.md
grep -c -i "wedge" docs/01-vision/positioning.md
```

- [ ] **Step 2: Rewrite**

Edit using the Edit tool. Apply vocabulary rules. Add a clear "Today: VariScout / Future: VariScout Process" section if not already present. Preserve any audience-specific positioning that pre-dates the wedge.

- [ ] **Step 3: Verify**

```bash
grep -i "wedge\|isPaidTier\|hasTeamFeatures" docs/01-vision/positioning.md
# Expect: zero hits
grep "VariScout Process\|€120\|project-membership" docs/01-vision/positioning.md
# Expect: at least one hit for "VariScout Process" and "€120"
```

- [ ] **Step 4: Commit**

```bash
git add docs/01-vision/positioning.md
git commit -m "docs(wedge): rewrite positioning.md (VariScout + VariScout Process, drop wedge word)"
```

---

## Task 4: Rewrite `docs/01-vision/business-bible.md`

**Files:**

- Modify: `docs/01-vision/business-bible.md` (currently 354 lines)

**Substance to capture:**

- Single-SKU strategy: VariScout at €120/month per Azure tenant, unlimited org users, unlimited projects
- Drop multi-tier funnel content (€79 / €199 tiering retired)
- Wedge→Process arc framed as **"today + future"** — don't use "wedge"
- VariScout Process scope: process-ownership platform features (Hub portfolios, 4 personas, auto pipelines, multi-source ingestion) — reserved for its own future spec, not detailed here
- ADR-082 H6 hypothesis ("per-deployment beats per-seat") preserved: €120 is still per-deployment

**Vocabulary:** no "wedge" word.

- [ ] **Step 1: Read current state**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
cat docs/01-vision/business-bible.md
```

- [ ] **Step 2: Rewrite**

Apply vocabulary rules. Replace multi-tier framing with single-SKU framing. Add "today + future" two-product narrative section if missing. Cross-link ADR-082 for the strategic rationale.

- [ ] **Step 3: Verify**

```bash
grep -i "wedge" docs/01-vision/business-bible.md
# Expect: zero hits
grep -i "€79\|€199" docs/01-vision/business-bible.md
# Expect: zero hits (or only inside a labeled "Pre-wedge pricing (retired)" historical box)
grep "VariScout Process\|€120\|single SKU" docs/01-vision/business-bible.md
# Expect: multiple hits
```

- [ ] **Step 4: Commit**

```bash
git add docs/01-vision/business-bible.md
git commit -m "docs(wedge): rewrite business-bible.md (single-SKU strategy, two-product narrative)"
```

---

## Task 5: Rename + rewrite `tier-philosophy.md` → `membership-philosophy.md`

**Files:**

- Delete: `docs/08-products/tier-philosophy.md` (199 lines)
- Create: `docs/08-products/membership-philosophy.md`

**Substance to capture:**

- Preserve philosophical framing: "one product, role-based access inside" (not feature-gating across tiers)
- New substance: Lead / Member / Sponsor ACL is the access model
- Cross-references: ADR-082 §4 (project membership model) + `packages/core/src/projectMembership/canAccess.ts`
- Three roles + their permissions matrix (per `canAccess.ts:11`):
  - Lead: edit-charter, edit-approach, edit-improve, edit-sustainment, manage-membership, view-report
  - Member: edit-charter, edit-approach, edit-improve, edit-sustainment, view-report (NO manage-membership)
  - Sponsor: view-report ONLY (read-only stakeholder)

**Vocabulary:** no "wedge"; no "tier-gating"; no "Team plan" / "Standard plan".

- [ ] **Step 1: Read current state of tier-philosophy.md**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
cat docs/08-products/tier-philosophy.md
```

- [ ] **Step 2: `git mv` to new path**

```bash
git mv docs/08-products/tier-philosophy.md docs/08-products/membership-philosophy.md
```

- [ ] **Step 3: Rewrite content + update frontmatter title**

Edit the file. Update frontmatter `title:` to "Membership Philosophy". Replace tier-based content with role-based-ACL content. Quote the permissions matrix verbatim (it's the authoritative source from canAccess.ts).

- [ ] **Step 4: Find + update any inbound links to tier-philosophy.md**

```bash
grep -rln "tier-philosophy\|tier-philosophy.md" /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup/docs/ 2>/dev/null
```

For each hit, update the link to `membership-philosophy.md`. If a doc indexes tier-philosophy.md by title, update the title reference too.

- [ ] **Step 5: Verify**

```bash
ls docs/08-products/membership-philosophy.md
ls docs/08-products/tier-philosophy.md 2>&1 | head -1
# Expect: new file exists, old file "No such file"
grep -rln "tier-philosophy" docs/ 2>/dev/null
# Expect: zero hits
grep -i "wedge" docs/08-products/membership-philosophy.md
# Expect: zero hits
```

- [ ] **Step 6: Commit**

```bash
git add docs/08-products/membership-philosophy.md
git add -u  # picks up the deletion + any inbound link updates
git commit -m "docs(wedge): rename tier-philosophy.md to membership-philosophy.md + rewrite content"
```

---

## Task 6: Update `docs/roadmap.md`

**Files:**

- Modify: `docs/roadmap.md` (currently 136 lines)

**Substance to capture:**

- Mark V1 (PRs #183, #185, #186, #187, #188, #189, #190) as SHIPPED with merge dates + commit SHAs
- Keep existing F-series + canvas migration tracking (developer-facing, OK)
- Add **VariScout Process** as a named-future horizon (no commitment dates; gated on V1 customer validation)
- Customer-facing sections drop "wedge"; F-series tracking sections can keep "wedge" if developer-facing

**Vocabulary:** mixed — customer-facing sections drop "wedge"; developer-facing F-series tracking can keep it.

- [ ] **Step 1: Read current state**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
cat docs/roadmap.md
```

- [ ] **Step 2: Update**

- Mark V1 SHIPPED with the 7 PR numbers + merge SHAs (see git log for PR numbers; my own session has them in the "Wedge V1 progress" PR-body sections)
- Add VariScout Process named-future horizon section
- Scrub "wedge" from any customer-facing sections (leave developer-facing F-series tracking)

- [ ] **Step 3: Verify**

```bash
grep -c "SHIPPED\|VariScout Process\|named-future" docs/roadmap.md
# Expect: at least 3 hits (V1 SHIPPED + Process named-future)
# Verify the customer-facing top section has zero "wedge" — check by reading the top 50 lines
head -50 docs/roadmap.md | grep -ci wedge
# Expect: zero (customer-facing top)
```

- [ ] **Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs(wedge): update roadmap.md — V1 SHIPPED + VariScout Process named-future"
```

---

## Task 7: Audit root `CLAUDE.md`

**Files:**

- Modify: `CLAUDE.md` (root — currently ~57 lines per the lint warning)

**Goal:** verify the wedge V1 framing is current. Likely minimal change — root CLAUDE.md was updated in our session (commits `bb296898` + `df3e9d81`). Verify:

- 7-tab nav order matches: `Home · Project · Process · Analyze · Investigation · Improve · Report`
- ADR references point to ADR-082
- Single-SKU + project-membership mentions are current
- "Wedge" is OK in workflow/feedback sections (developer-facing); should NOT be in user-positioning sections

- [ ] **Step 1: Read + check vocabulary**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
cat CLAUDE.md
grep -ni "wedge" CLAUDE.md
```

- [ ] **Step 2: If audit finds drift, fix surgically**

If 7-tab nav is wrong → fix.
If ADR-082 isn't referenced → add reference.
If "wedge" appears in opening positioning sentence → rewrite to "VariScout V1" framing.

If no drift found: skip Step 3 commit, log "no change needed" in the implementer's status report.

- [ ] **Step 3: Commit (only if changes made)**

```bash
git add CLAUDE.md
git commit -m "docs(wedge): audit root CLAUDE.md vocabulary + ADR refs"
```

---

## Task 8: Update `docs/llms.txt`

**Files:**

- Modify: `docs/llms.txt` (currently 72 lines)

**Substance to capture:**

- Updated agent entry points reflecting V1 anatomy:
  - 3-stage Project (Charter → Approach → Sustainment, NOT 4-stage)
  - 7-tab nav (per Task 6 amendment, NOT 6-tab)
  - Project-membership ACLs (Lead / Member / Sponsor, replacing tier-gating)
  - Single €120/mo SKU
- Pricing string in line 3 currently says "€99/mo, single tier — wedge pivot 2026-05-16" → update to "€120/mo, single SKU"
- Wedge spec line 9 description currently says "6-tab workflow nav... Improve as a stage inside Projects detail" — update to "7-tab workflow nav... Improve as a top-level verb tab per the 2026-05-16 amendment"
- Drop "wedge" word from customer-facing description prose (keep ADR-082 description "wedge architectural record" — historical decision name).

- [ ] **Step 1: Read full file**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
cat docs/llms.txt
```

- [ ] **Step 2: Update the price + nav description on lines 3 + 9 (verify exact line numbers first)**

Use the Edit tool. The "€99/mo, single tier — wedge pivot 2026-05-16" → "€120/mo, single SKU per Azure tenant". The "6-tab workflow nav (`Home · Projects · Process · Analyze · Investigation · Report`); Improve as a stage inside Projects detail" → "7-tab workflow nav (`Home · Project · Process · Analyze · Investigation · Improve · Report`); Improve as top-level verb tab per the 2026-05-16 amendment".

- [ ] **Step 3: Verify**

```bash
grep -n "€120\|€99\|6-tab\|7-tab\|wedge" docs/llms.txt
# Expect: €120 present; €99 absent; 7-tab present; 6-tab absent
# "wedge" may appear in line 10 ("wedge architectural record") — that's the ADR description, OK
```

- [ ] **Step 4: Commit**

```bash
git add docs/llms.txt
git commit -m "docs(wedge): update llms.txt agent manifest for V1 anatomy"
```

---

## Task 9: Drift fix — `docs/OVERVIEW.md` + `docs/USER-JOURNEYS.md`

**Files:**

- Modify: `docs/OVERVIEW.md:73,75` (€99 → €120)
- Modify: `docs/USER-JOURNEYS.md` (verify "wedge" usage; scrub if customer-facing)

- [ ] **Step 1: Edit OVERVIEW.md**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
grep -n "€99\|€120" docs/OVERVIEW.md
```

Replace `€99` → `€120` at lines 73 + 75 + any other current-truth pricing claims. Use the Edit tool.

- [ ] **Step 2: Check USER-JOURNEYS.md**

```bash
grep -ci "wedge" docs/USER-JOURNEYS.md
grep -n "€99\|€79\|€199" docs/USER-JOURNEYS.md
```

If "wedge" appears in customer-facing sections → scrub. If pricing strings appear as current truth → update.

- [ ] **Step 3: Verify both**

```bash
grep -i "wedge\|€99" docs/OVERVIEW.md docs/USER-JOURNEYS.md
# Expect: zero hits (or only superseded historical context)
```

- [ ] **Step 4: Commit**

```bash
git add docs/OVERVIEW.md docs/USER-JOURNEYS.md
git commit -m "docs(wedge): drift fix — OVERVIEW.md + USER-JOURNEYS.md €99→€120 + scrub wedge word"
```

---

## Task 10: Drift fix — `docs/07-decisions/adr-082-wedge-architecture.md`

**Files:**

- Modify: `docs/07-decisions/adr-082-wedge-architecture.md` (lines 9, 37, 67, 69, 70, 71, 117, 136 + §5.4 migration math)

**Substance:**

- Body text `€99` → `€120` everywhere current-truth pricing appears
- §5.4 migration math: update target price from €99 → €120 (existing customer transitions: €79 → €120 / €199 → €120 — the structure stays, just the target updates)
- ADR title stays "wedge-architecture" (historical decision name)

- [ ] **Step 1: Find all €99 mentions**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
grep -n "€99\|€79\|€199" docs/07-decisions/adr-082-wedge-architecture.md
```

- [ ] **Step 2: Update each one with judgment**

Use Edit tool. For each line:

- If the line is current-truth pricing claim (e.g., "Pricing: €99/month, single SKU") → update to €120
- If the line is migration-math context (e.g., "Customers currently on €79 Standard or €199 Team need a migration path") → keep €79/€199 (historical), update €99 → €120 in the same line (the target)
- If the line is rationale citing the original €99 decision (e.g., "Sits between the retired €79 Standard and €199 Team") → update €99 → €120 + adjust the surrounding logic to reflect €120 sits ABOVE rather than at-the-midpoint

- [ ] **Step 3: Verify**

```bash
grep -c "€120" docs/07-decisions/adr-082-wedge-architecture.md
# Expect: 5+ hits (the current-truth replacements)
grep -c "€99" docs/07-decisions/adr-082-wedge-architecture.md
# Expect: zero hits OR only historical-context references
```

- [ ] **Step 4: Commit**

```bash
git add docs/07-decisions/adr-082-wedge-architecture.md
git commit -m "docs(wedge): drift fix — ADR-082 €99→€120 (preserve §5.4 migration math structure)"
```

---

## Task 11: Drift fix — `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`

**Files:**

- Modify: `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` (~line 325 amendment marker + body €99 → €120)

**Substance:**

- The spec already has an amendment marker at §5.1 added in WV1-6
- Rewrite body §5.1 to current-truth €120 BELOW the marker
- Optionally tighten the marker to a footer date-stamp for readability (vs the current inline block)
- Preserve §5.4 migration math + §8.1 + §9.x as historical-context (labeled)

- [ ] **Step 1: Read §5.1 + amendment context**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
sed -n '315,345p' docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
```

- [ ] **Step 2: Rewrite §5.1 body to €120 current-truth**

Replace inline `€99` mentions in §5.1 body with `€120`. Keep the amendment marker but consider moving it to a footer "Amendments" section for cleaner reading. Verify §5.4 / §8.1 / §9.x are unchanged.

- [ ] **Step 3: Verify**

```bash
grep -n "€99\|€120" docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
# Expect: €120 in §5.1 body; €99 only in §5.4 / §8.1 / §9.x historical-context sections
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
git commit -m "docs(wedge): drift fix — wedge spec §5.1 body €99→€120 below amendment marker"
```

---

## Task 12: Drift fix — `apps/azure/CLAUDE.md`

**Files:**

- Modify: `apps/azure/CLAUDE.md:16,18,37`

**Substance:**

- Line 16: "Blob Storage sync for Team tier" → "Blob Storage sync (single €120 SKU)" or similar
- Line 18: `Tier-gating: paid features are guarded by isPaidTier() from @variscout/core/tier. Tier-gate INSIDE the surface...` → `Access-gating: project-formal features guarded by canAccess(userId, members, action) from @variscout/core/projectMembership (PR-WV1-1). ACL-gate INSIDE the surface, not at surface entry.`
- Line 37 `ADR-043 Teams entry experience` — verify ADR-043 still valid (audit said "unverified"). If ADR-043 is superseded by ADR-059, remove the line; if still relevant, leave.

- [ ] **Step 1: Read current state**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
sed -n '14,40p' apps/azure/CLAUDE.md
```

- [ ] **Step 2: Check ADR-043 status**

```bash
head -20 /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup/docs/07-decisions/adr-043-*.md 2>/dev/null | head -30
ls /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup/docs/archive/adrs/adr-043-* 2>/dev/null
```

If ADR-043 is in `docs/07-decisions/` (active) → keep the line; if in `docs/archive/adrs/` (superseded) → remove the line.

- [ ] **Step 3: Apply edits**

Use Edit tool. Replace the three drift items. Add a one-line note at the top of the file confirming the wedge V1 framing applies if it's missing.

- [ ] **Step 4: Verify**

```bash
grep -i "isPaidTier\|hasTeamFeatures\|Team tier\|Standard tier" apps/azure/CLAUDE.md
# Expect: zero hits
grep -i "canAccess\|project-membership" apps/azure/CLAUDE.md
# Expect: at least one hit
```

- [ ] **Step 5: Commit**

```bash
git add apps/azure/CLAUDE.md
git commit -m "docs(wedge): drift fix — apps/azure/CLAUDE.md tier-language retirement"
```

---

## Task 13: Drift fix — `packages/core/CLAUDE.md`

**Files:**

- Modify: `packages/core/CLAUDE.md:42` (the "team-only tools / tier: 'team'" sentence)

**Substance:**

- The line says: `Every tool in ai/prompts/coScout/tools/registry.ts MUST declare phases; team-only tools also set tier: 'team'. Ungated tools leak across phases/tiers (e.g., team tool appearing in PWA free).`
- Problem: under wedge V1 single SKU, "team tool appearing in PWA free" framing conflates internal prompt-cache phasing with retired customer-facing tier
- Fix: clarify that `tier: 'team'` in the registry is internal prompt-cache phasing (Tier 1 / Tier 3 cache strategy per ADR-068), NOT customer-facing pricing tier. Reword to remove the "PWA free" example which no longer maps.

**Note**: if `tier: 'team'` field itself turns out to be DEAD CODE (no consumers), that's a Phase C finding (code cleanup). This Phase A task fixes the DOC wording only.

- [ ] **Step 1: Read current state**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
sed -n '38,48p' packages/core/CLAUDE.md
```

- [ ] **Step 2: Check whether `tier: 'team'` in the registry has any consumers (informational only — do NOT fix code here)**

```bash
grep -rn "tier:\s*'team'\|entry.tier" /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup/packages/core/src/ai/ 2>/dev/null | head -10
```

If `entry.tier` field still has logic referencing it, log that in the Phase C plan artifact (Task 14) as a code-cleanup finding.

- [ ] **Step 3: Reword the CLAUDE.md line**

Use Edit tool. Suggested wording:

```
Every tool in `ai/prompts/coScout/tools/registry.ts` MUST declare `phases`. The `tier` field is an internal cache-phasing signal (per ADR-068 modular tiers — Tier 1 session-invariant vs Tier 3 per-session) — NOT customer-facing pricing tier. Ungated tools (missing phases) leak across investigation phases.
```

- [ ] **Step 4: Verify**

```bash
grep -i "PWA free\|team tool appearing" packages/core/CLAUDE.md
# Expect: zero hits
grep -i "cache-phasing\|prompt-cache\|ADR-068" packages/core/CLAUDE.md
# Expect: at least one hit
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/CLAUDE.md
git commit -m "docs(wedge): drift fix — packages/core/CLAUDE.md tool-registry tier clarification"
```

---

## Task 14: Create Phase C plan artifact

**Files:**

- Create: `docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md`

**Structure:**

```markdown
---
title: 'Phase C — Holistic Doc Audit → Triage → Apply'
status: draft
last-reviewed: 2026-05-17
parent: docs/archive/specs/2026-05-17-wedge-phase-a-doc-completion-design.md
related:
  - docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
---

# Phase C — Holistic Doc Audit → Triage → Apply

## Why this plan exists

The wedge spec §13 committed to a 3-phase doc cleanup. Phase A closed PR 1 (this PR). Phase C is the holistic ~500-doc audit + apply sweep. This plan operationalizes Phase C as 3 sequenced PRs: AMEND → ARCHIVE → DELETE.

Timing: execute after V1 customer validation per wedge spec §8 precondition #3.

## Triage buckets

(KEEP / AMEND / ARCHIVE / DELETE with definitions + archive-over-delete preference per `feedback_consolidation_replace_not_umbrella`)

## Stale-pattern detection vectors (8 categories)

(Each = one parallel Explore agent in the Audit phase)

1. Multi-tier pricing strings: `€79`, `€199`, "Standard plan", "Team tier", "paid tier", "free tier", "2-tier", "two-tier"
2. Retired symbols: `isPaidTier`, `hasTeamFeatures`, `useTier`, `LicenseTier`, `MarketplacePlan`, `BRANDING_COLORS`, `configureTier`, `configurePlan`
3. SharePoint references: `SharePoint`, `usePublishReport`, `useShareReport`, `Sites.Read.All`, ADR-026, ADR-030
4. Teams SDK references: `useTeamsCamera`, "Teams app", "Teams entry"
5. 4-persona model: `personaRole`, "4 personas", "four personas"
6. 6-tab nav (pre-amendment): "6 tabs", "six tabs", "Frame" as tab label, "Analysis" as tab label, "Projects" plural
7. Handoff stage: `Handoff` as stage, `showHandoff`, "4 stages", "Charter → Approach → Improve → Sustainment" (the OLD order)
8. "Wedge" in customer-facing docs (per Phase A vocabulary decision)

## Audit method (PR 2 entry)

- 8 parallel Explore agents, one per stale-pattern category
- Each produces a triage table: `file:line | pattern | bucket | proposed action`
- Aggregate into a single markdown table embedded in this plan doc (replacing this section's TBD placeholder)

## Apply method (PRs 2-4)

- **PR 2 (AMEND)**: Sonnet implementer dispatches the surgical edits batch. Estimated ~100-200 files. Mostly find-and-replace at known line numbers from the triage table.
- **PR 3 (ARCHIVE)**: Sonnet implementer moves superseded docs to `docs/archive/<topic>/` with supersession headers pointing to current truth. Estimated ~50-100 files.
- **PR 4 (DELETE)**: Sonnet implementer `git rm`s flagged-for-deletion docs. Estimated ~10-30 files.

KEEP-bucket docs need no PR.

## Doc directories in scope

- `docs/01-vision/`
- `docs/07-decisions/`
- `docs/08-products/`
- `docs/superpowers/specs/` (pre-wedge specs may need supersession markers)
- `docs/superpowers/plans/` (delivered plans — keep; in-flight plans — review)
- `docs/archive/` (pre-existing archive; verify supersession markers accurate)
- Per-package `CLAUDE.md` files
- Per-app `CLAUDE.md` files

## Out of Phase C scope

- `node_modules/`, build outputs, generated docs
- `.git/`, `.worktrees/`
- Code (only docs + comments touched in Phase C)

## Estimated effort

~5-7 days total across PRs 2-4.

## Followups from this plan's audit findings

(TBD — to be populated as the audit completes)
```

- [ ] **Step 1: Create the file**

Use the Write tool with the full content above (filling in the structure with the actual triage-bucket definitions, audit method, etc.).

- [ ] **Step 2: Verify**

```bash
ls docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md
pnpm docs:check 2>&1 | tail -5
# Expect: file exists; docs:check green
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md
git commit -m "docs(wedge): Phase C plan artifact — Audit → Triage → Apply structure"
```

---

## Task 15: Validator phase — final verification before review

**No file edits.** Run all verification commands documented in the spec.

- [ ] **Step 1: Zero "wedge" in customer-facing anchors**

```bash
cd /Users/jukka-mattiturtiainen/Projects/VariScout_lite/.worktrees/feat/wedge-phase-a-doc-cleanup
grep -in "\bwedge\b" docs/OVERVIEW.md docs/USER-JOURNEYS.md docs/01-vision/positioning.md docs/01-vision/business-bible.md docs/08-products/membership-philosophy.md docs/roadmap.md docs/llms.txt 2>/dev/null
# Expect: zero hits (or only inside the ADR-082 link description on llms.txt:10)
```

- [ ] **Step 2: Zero €99/€79/€199 as current-truth claims**

```bash
grep -rn "€99\|€79\|€199" docs/ README.md apps/azure/.env.example 2>/dev/null | grep -v "superseded\|migration\|historical\|§5.4\|§8.1\|§9\."
# Expect: zero hits
```

- [ ] **Step 3: Zero retired-symbol references in CLAUDE.md files**

```bash
grep -rn "isPaidTier\|hasTeamFeatures\|Team tier\|Standard tier" packages/*/CLAUDE.md apps/*/CLAUDE.md CLAUDE.md 2>/dev/null
# Expect: zero hits
```

- [ ] **Step 4: Phase A anchors mention V1 vocabulary**

```bash
grep -l "VariScout\|single SKU\|€120\|project-membership" docs/DATA-FLOW.md docs/01-vision/positioning.md docs/01-vision/business-bible.md docs/08-products/membership-philosophy.md docs/roadmap.md docs/llms.txt 2>/dev/null
# Expect: all 6 paths return
```

- [ ] **Step 5: tier-philosophy.md renamed**

```bash
ls docs/08-products/membership-philosophy.md 2>/dev/null
ls docs/08-products/tier-philosophy.md 2>&1 | head -1
# Expect: new file exists; old file "no such file"
```

- [ ] **Step 6: Phase C plan artifact exists**

```bash
ls docs/superpowers/plans/2026-05-17-phase-c-doc-audit.md
# Expect: file exists
```

- [ ] **Step 7: Docs health checks**

```bash
pnpm docs:check 2>&1 | tail -5
# Expect: 530+ docs validated, no broken refs, frontmatter clean
```

- [ ] **Step 8: Diff stat**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat | tail -5
# Expect: 13-14 commits, ~13 files, net likely +500/-300 (content rewrites add, drift fixes subtract)
```

If any check fails, fix + re-verify + commit the fix before reporting DONE.

---

## Task 16: Report DONE (no further edits)

Implementer reports DONE with:

- STATUS: DONE / DONE_WITH_CONCERNS
- All 13 commit SHAs in chronological order
- Validator results (PASS/FAIL per Step 1-8 of Task 15)
- One-paragraph self-review noting any deviations from the plan

Controller (this session) then:

- Runs `pnpm lint` + `pnpm docs:check` from the worktree root
- Pushes branch
- Opens PR via `gh pr create` with summary explaining Phase A closure + Phase C plan artifact
- Dispatches Opus final-branch review
- Hands back to user for squash-merge (does NOT auto-merge)

---

## Self-review checklist (this plan)

- [x] **Spec coverage**: every section of the spec maps to a task above (Task 2-8: anchor rewrites; Task 9-13: drift fixes; Task 14: Phase C plan; Task 15: validator)
- [x] **No placeholders**: all 16 tasks have concrete content + commands
- [x] **Type consistency**: vocabulary rules + verification grep patterns consistent across tasks
- [x] **Slice-size**: 16 tasks (some 1-step verification, some 4-step rewrites). Atomic-sweep pattern means ONE Sonnet dispatch handles all of them with internal phases — not 16 separate dispatches.
- [x] **Plan-time guardrails**: vocabulary rules surfaced upfront; verification baked into each task; commit cadence per-task.
