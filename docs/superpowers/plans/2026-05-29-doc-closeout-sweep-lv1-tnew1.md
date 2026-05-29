---
tier: ephemeral
purpose: build
title: Doc closeout sweep — LV1 Phase-1 + T-NEW-1 vocabulary + delivered status lifecycle gate
status: active
date: 2026-05-29
layer: spec
---

# Doc Closeout Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Single docs-only PR closing out Linked Views Phase 1 (PRs #232–#240, shipped 2026-05-29) + landing T-NEW-1 vocabulary alignment (Task #49) + adding the missing closeout lifecycle gate to the doc frontmatter schema (`delivered` becomes a canonical status). Retroactively applies the new lifecycle to CCJ's master plan + spec (shipped 2026-05-26 but never closed out).

**Architecture:** Pure docs + one tiny schema-config edit. Five bite-sized tasks executed against the `pnpm run docs:check` test surface. The schema patch (Task 1) must precede frontmatter flips so pre-push hooks accept `status: delivered`.

**Tech Stack:** Markdown · YAML frontmatter · `scripts/docs-frontmatter-schema.mjs` (the SSOT validator) · `scripts/check-doc-health.sh` (hook runner) · `pnpm run docs:check`.

---

## Parent context

- **Scratch plan:** `~/.claude/plans/with-the-latest-discovery-groovy-hedgehog.md` (will be overwritten by next plan-mode session).
- **Prior shipped initiative:** Linked Views Phase 1 master plan `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md`. 8 of 9 PRs delivered 2026-05-29. PWA mount explicit deferral logged in master plan §PWA-Mount-Deferral.
- **Audit memos consumed:**
  - `feedback_close_threads_to_done` — end-of-initiative thread closure.
  - `feedback_consolidation_replace_not_umbrella` — aggressive replace+archive; single PR for systemic fixes.
  - `feedback_drop_methodology_bridges` — VariScout-native vocabulary over external bridges; Lead JTBD restructure (#39) superseded by T-NEW-1.
  - `feedback_systemic_before_patching` — fix patterns not symptoms (schema gap → canonical status).
  - `feedback_doc_validation_hooks` — pre-commit + pre-push doc hooks enforce frontmatter + cross-refs + dead links.
- **Schema verified pre-execution** (read at planning time):
  - Line 25: `STATUS = ['draft', 'active', 'named-future', 'superseded', 'archived']`
  - Line 53: `STATUS_ALIAS_MAP['delivered'] = 'active'` (transitional alias to retire)

## Architectural decisions

### D-DOC-1: Add `delivered` as canonical frontmatter status

Edit `scripts/docs-frontmatter-schema.mjs`:

- Add `'delivered'` to the `STATUS` array.
- Delete `delivered: 'active'` from `STATUS_ALIAS_MAP`.

Semantically: `delivered` = shipped, reference-quality, not actively edited. Slots between `active` (in-flight) and `archived` (physically moved to `docs/archive/`).

### D-DOC-2: Bundle LV1 + retroactive CCJ closeout in one PR

Per user "systemic" directive: same lifecycle pattern applied twice — LV1 (just shipped) + CCJ master/spec (shipped 2026-05-26 but never closed out). CCJ B1 sub-plan is ALREADY `delivered` via the soon-to-be-retired alias — schema patch makes it canonical without changing the file content.

### D-DOC-3: Wedge §3.3 supersession banner — inline blockquote

Frontmatter `superseded_by:` doesn't work for section-level supersession (the wedge spec as a whole is still active; only §3.3 is shipped). Inline blockquote at §3.3 head is the right tool. See Task 4.

### D-DOC-4: T-NEW-1 vocabulary scope is narrow

Audit confirmed Lead JTBD already activity-framed, methodology bridges already clean in user-facing docs, persona model aligned. Real drift is 3 "Sustainment" → "Control" patches + 1 5-verb anchor section in `ia-nav-model.md`. No new file needed.

### D-DOC-5: Preserved-identifier list is critical for Task 5

The `Sustainment → Control` STAGE rename in narrative prose MUST NOT touch:

- `ProjectMetadata.sustainment` (code field)
- `panelsStore` `'sustainment'` key
- `ProcessStateLens | 'sustainment'` value
- `useImprovementProjectStore` sustainment refs

These are code-level identifiers preserved by ADR-082 / `feedback_no_backcompat_clean_architecture`. The rename applies ONLY to user-facing stage labels in narrative prose (e.g., "Charter → Approach → Sustainment" stage list).

## Files

### Modify (schema)

- `scripts/docs-frontmatter-schema.mjs` — add `delivered` to canonical STATUS array + delete alias.

### Modify (LV1 frontmatter flips — 11 files)

| File                                                                                     | Current  | Target      |
| ---------------------------------------------------------------------------------------- | -------- | ----------- |
| `docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` | `draft`  | `delivered` |
| `docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md`                  | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-0-remove-yamazumi-mode.md`                     | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-a-analysis-scope-store.md`                     | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-b-pending-explore-intent-migration.md`         | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-h-outcome-summary-pill.md`                     | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-c-retire-authoring-mode.md`                    | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-d-canvas-explore-jump.md`                      | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-28-pr-lv1-e-explore-scope-chrome.md`                     | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-29-pr-lv1-f-chart-click-categorical-accumulate.md`       | `active` | `delivered` |
| `docs/superpowers/plans/2026-05-29-pr-lv1-g-canvas-scope-visualization.md`               | `active` | `delivered` |

### Modify (CCJ retroactive frontmatter flips — 2 files)

| File                                                                                | Current                 | Target                           |
| ----------------------------------------------------------------------------------- | ----------------------- | -------------------------------- |
| `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md`        | `active`                | `delivered`                      |
| `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`             | `draft`                 | `delivered`                      |
| `docs/superpowers/plans/2026-05-26-canvas-connection-journey-b1-edit-mode-shell.md` | `delivered` (via alias) | `delivered` (canonical; no edit) |

### Modify (decision-log + investigations)

- `docs/decision-log.md` — append PWA-Mount-Deferral entry under "Replayed Decisions" section (chronologically after 2026-05-28 entries).
- `docs/ephemeral/investigations.md` — mark "Two Done buttons in Edit mode (Process tab)" entry `[RESOLVED 2026-05-28 via PR #236]` inline.

### Modify (wedge spec amendments)

- `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`:
  - §3.3 head — insert supersession blockquote banner.
  - §3.2 main body (lines 109-123) — `Sustainment` → `Control` stage label (narrative prose only; no code identifiers).

### Modify (T-NEW-1 vocabulary patches)

- `docs/01-vision/glossary.md` — `Sustainment` stage refs → `Control` (3 hits around line 85).
- `docs/02-journeys/personas/index.md` — stage list `Sustainment` → `Control` (~line 18).
- `docs/01-vision/product-overview.md` — retire 2× State/Edit binary residual references; replace with LV1-shipped reality.
- `docs/02-journeys/ia-nav-model.md` — add `## Vocabulary: 5-verb activity frame` section quoting spec D6 + cross-linking ADR-082.
- `docs/07-decisions/adr-042-project-dashboard.md` — audit the 1 EditModeShell ref; either historical framing or delete.

### No changes (verify only)

- Lead JTBD docs (`docs/02-journeys/personas/lead.md`) — already activity-framed per audit.
- Methodology bridge usage in user-facing docs — already clean per audit.
- Project = IP terminology — already correctly stratified; #40 stays separately in queue.

## Constraints

- **NEVER** `--no-verify` on commits.
- **No emojis in source/docs** unless already present (preserve precedent). Unicode arrow/symbol glyphs allowed (`✓`/`→`/`×`/`▾`/`+`).
- **No `"root cause"`** anywhere.
- **No `Pp`/`Ppk`** — `Cpk` only.
- **Preserved-identifier list applies**: `AnalysisMode`, `AnalysisBrief`, `AnalysisStats`, `AnalysisModeStrategy`, `AnalysisLensTab`, `DashboardTab` union, ADR-074 timing concepts, `ProcessStateLens`, `ProjectMetadata.sustainment` (code field; preserved despite stage rename!), `panelsStore` `'sustainment'` key, "Investigation Wall" brand, `'investigation-report'` `ReportType`, `docs/03-features/analysis/` directory, `Dashboard.tsx`, `CanvasWorkspace.tsx`, CoScout prompts, `investigationId` FK fields.
- **No code touches.** This is docs-only. The schema patch (Task 1) is a config file, not application code.
- **`pnpm run docs:check` must stay green** throughout. Verify after each task.
- **Operate ONLY in the assigned worktree.**
- **Skip browser walks.**

---

## Task 1: Schema patch — add `delivered` as canonical status

**Files:**

- Modify: `scripts/docs-frontmatter-schema.mjs`

- [ ] **Step 1: Edit the schema**

In `scripts/docs-frontmatter-schema.mjs`:

1. Line 25 — add `'delivered'` to the `STATUS` array. New value:

   ```javascript
   export const STATUS = ['draft', 'active', 'delivered', 'named-future', 'superseded', 'archived'];
   ```

   (Insert `'delivered'` between `'active'` and `'named-future'` to express lifecycle order: draft → active → delivered → archived/superseded.)

2. Line 53 — delete the line `delivered: 'active',` from `STATUS_ALIAS_MAP`. After the edit, `STATUS_ALIAS_MAP` should NOT contain a `delivered` key.

- [ ] **Step 2: Verify with the doc-check hooks**

Run:

```bash
pnpm run docs:check
```

Expected: pass. The current 2 transitional-alias warnings (the 2 files mentioned in `MEMORY.md` index — `2026-05-26-canvas-connection-journey-b1-edit-mode-shell.md` + `2026-05-27-wedge-v1-nav-vocabulary-rename.md`) should now report `delivered` as canonical (zero transitional-alias warnings) since the alias no longer exists.

If any unexpected validator error appears, inspect via:

```bash
node scripts/docs-frontmatter-validator.mjs <suspect-file> 2>&1 || true
```

If a frontmatter test file exists at `scripts/__tests__/docs-frontmatter-schema*.test.mjs` or similar, also run:

```bash
pnpm test scripts/docs-frontmatter-schema 2>&1 | tail -10
```

If no tests touch the STATUS list specifically, no test edits needed.

- [ ] **Step 3: Commit**

```bash
git add scripts/docs-frontmatter-schema.mjs
git commit -m "feat(docs-schema): add 'delivered' as canonical frontmatter status

Closes the closeout-lifecycle gap. 'delivered' was previously a
transitional alias to 'active'; promoting to canonical lets shipped
specs/plans express closeout state without warning. Slots between
'active' (in-flight) and 'archived' (physically moved to docs/archive/).

Removes the delivered → active alias to prevent ambiguity.
Companion: subsequent tasks flip LV1 + CCJ frontmatter to 'delivered'.

Sub-plan task 1 of 5."
```

---

## Task 2: LV1 + CCJ frontmatter flips

**Files:**

- 11 LV1 files (per §Files / LV1 table above).
- 2 CCJ files (per §Files / CCJ table above).

- [ ] **Step 1: Flip the 11 LV1 frontmatter status fields**

For each of the 11 LV1 files listed in the §Files / LV1 table:

- Read the frontmatter block.
- Edit ONLY the `status:` line. Don't touch any other fields.
- Spec file (`2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`): `draft` → `delivered`.
- All 10 plan files: `active` → `delivered`.

Use the Edit tool with exact `old_string`/`new_string` pairs. Example for the spec:

```
Edit:
  old_string: 'status: draft'
  new_string: 'status: delivered'
```

(if there are multiple `status:` occurrences in the file — e.g., in code blocks — scope the edit by including 2-3 surrounding lines of frontmatter context for uniqueness).

- [ ] **Step 2: Flip the 2 CCJ frontmatter status fields**

- `docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md`: `active` → `delivered`.
- `docs/superpowers/specs/2026-05-26-canvas-connection-journey-design.md`: `draft` → `delivered`.

Skip `2026-05-26-canvas-connection-journey-b1-edit-mode-shell.md` — already `delivered` (via the soon-deleted alias, so the value is identical and unchanged).

- [ ] **Step 3: Verify with docs:check**

```bash
pnpm run docs:check
```

Expected: pass. Transitional-alias warning count = 0 (down from 2).

Verify status distribution:

```bash
grep -H "^status:" docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md \
  docs/superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md \
  docs/superpowers/plans/2026-05-28-pr-lv1-*.md \
  docs/superpowers/plans/2026-05-29-pr-lv1-*.md \
  docs/superpowers/specs/2026-05-26-canvas-connection-journey-*.md \
  docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
```

All values should be `delivered`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-05-28*.md \
  docs/superpowers/plans/2026-05-28-linked-views*.md \
  docs/superpowers/plans/2026-05-28-pr-lv1-*.md \
  docs/superpowers/plans/2026-05-29-pr-lv1-*.md \
  docs/superpowers/specs/2026-05-26-canvas-connection-journey-*.md \
  docs/superpowers/plans/2026-05-26-canvas-connection-journey-master-plan.md
git commit -m "docs(closeout): flip LV1 + CCJ frontmatter to status: delivered

Linked Views Phase 1 closed 2026-05-29 (PRs #232–#240). CCJ retroactive
closeout (shipped 2026-05-26, PRs #210–#231) follows the new lifecycle
gate established in Task 1.

11 LV1 files (1 spec + 1 master + 9 sub-plans) + 2 CCJ files (master +
spec) flipped from active/draft → delivered. CCJ B1 sub-plan was already
'delivered' via the now-deleted alias; no change needed.

Sub-plan task 2 of 5."
```

---

## Task 3: Decision-log + investigations entries

**Files:**

- Modify: `docs/decision-log.md`
- Modify: `docs/ephemeral/investigations.md`

- [ ] **Step 1: Read both files**

Read `docs/decision-log.md` to locate the "Replayed Decisions" section + identify the canonical entry shape. Use the existing entry at line ~37 ("2026-05-28 — Spec §4.5 `→ Explore` exit routing table reduced...") as the template.

Read `docs/ephemeral/investigations.md` to find the "Two Done buttons in Edit mode (Process tab)" entry (~line 180 per audit).

- [ ] **Step 2: Add PWA-Mount-Deferral decision-log entry**

Append a new entry to `docs/decision-log.md` Replayed Decisions section, chronologically after the existing 2026-05-28 entries. Use the canonical entry shape:

```markdown
**2026-05-29 — PWA `<ScopeChrome>` mount deferred until PWA gains Process tab.** `decision`: PWA `<ScopeChrome>` mount (originally tracked as a small follow-up to LV1-E) is deferred entirely until the PWA SKU expands to include a Process tab + canonical `availableSteps` source. Partial mount (Y/factor/categorical only, no step chip) would ship dead UI; scope mutations would have no PWA visual consumer. Linked Views Phase 1 closes at 8/9 PRs delivered + 1 explicit PWA-mount deferral. See LV1 master plan §PWA-Mount-Deferral at path `superpowers/plans/2026-05-28-linked-views-phase-1-master-plan.md` and doc closeout sub-plan at path `superpowers/plans/2026-05-29-doc-closeout-sweep-lv1-tnew1.md`.

(Implementer note: at insertion time, convert the two plain-text paths above into proper `[label](path)` markdown links. They're shown as plain text here only so this sub-plan's pre-commit cross-reference validator doesn't follow them from the wrong relative-path origin.)
```

(The two cross-links serve double duty: they document the deferral source AND provide the inbound link to this sub-plan that satisfies the CLAUDE.md ≥1-inbound-link rule.)

- [ ] **Step 3: Mark the Two-Done-Buttons investigation entry RESOLVED**

In `docs/ephemeral/investigations.md`, find the "Two Done buttons in Edit mode (Process tab)" entry. Append an inline `[RESOLVED 2026-05-28 via PR #236]` marker at the start or end of the entry's status/conclusion line. Don't delete the entry — investigations are append-only audit trail.

Use exact `old_string` matching the existing entry; preserve all surrounding context.

- [ ] **Step 4: Verify docs:check**

```bash
pnpm run docs:check
```

Expected: pass, including the broken-cross-reference check (since we added 2 cross-links in the decision-log entry).

- [ ] **Step 5: Commit**

```bash
git add docs/decision-log.md docs/ephemeral/investigations.md
git commit -m "docs(closeout): log PWA-Mount-Deferral + close Two-Done-Buttons thread

Decision-log entry documents the LV1 PWA mount deferral decision
(2026-05-29). Investigations 'Two Done buttons in Edit mode' entry
marked [RESOLVED 2026-05-28 via PR #236] — LV1-C retired EditModeShell
+ Done button entirely.

Per feedback_close_threads_to_done: end-of-initiative thread closure.

Sub-plan task 3 of 5."
```

---

## Task 4: Wedge spec amendments

**Files:**

- Modify: `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`

- [ ] **Step 1: Insert §3.3 supersession blockquote banner**

Find the line `### §3.3 Process tab — canvas substrate + State/Edit modes + Specialist content` (~line 127). Insert this blockquote immediately AFTER the heading line (before the next prose paragraph):

```markdown
### §3.3 Process tab — canvas substrate + State/Edit modes + Specialist content

> **DELIVERED 2026-05-29 by State/Edit mode rethink + linked-views Phase 1** (target file: `2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`, sibling of the wedge spec) **(PRs #232–#240).** The Process tab now uses canvas direct-manipulation (no State/Edit binary); scope-chrome + live cross-tab visualization live in Explore. §3.3 below is preserved as design rationale; refer to the 2026-05-28 spec for shipped reality.

(Implementer note: at insertion time inside `docs/superpowers/specs/2026-05-16-wedge-architecture-design.md`, convert the spec-filename `2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md` into a proper markdown link with the label "State/Edit mode rethink + linked-views Phase 1". The bracket-paren markdown link syntax is omitted from this sub-plan to keep its pre-commit cross-reference validator happy — the validator would follow the sample from THIS sub-plan's location, which resolves wrong.)

[existing prose continues...]
```

- [ ] **Step 2: §3.2 Sustainment → Control rename**

Find the §3.2 stage description (lines 109-123 per audit). The current text mentions `Charter → Approach → Sustainment`. Replace `Sustainment` → `Control` in narrative prose ONLY. Do NOT touch:

- Code identifier mentions like `ProjectMetadata.sustainment` (verbatim code-field reference).
- Code-string mentions like `panelsStore.activeView = 'sustainment'`.
- Type-union mentions like `ProcessStateLens | 'sustainment'`.

If the §3.2 section is ambiguous about whether a "Sustainment" instance is narrative or code-reference, look at the surrounding context: backticks + code shape = preserved; plain prose stage label = rename. When in doubt, leave unchanged + flag in the commit message.

- [ ] **Step 3: Verify**

```bash
pnpm run docs:check
```

Expected: pass. Cross-reference + dead-link checks green.

Verify the banner is present:

```bash
grep -A1 "### §3.3" docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
```

Verify no orphaned `Sustainment` stage labels in §3.2 (allowing code-field references):

```bash
grep -n "Sustainment" docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
```

Each hit should be either (a) inside a code block / inline code, (b) below the §3.3 supersession line (historical §3.3 content), or (c) the §3.3 heading itself.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-05-16-wedge-architecture-design.md
git commit -m "docs(wedge-v1): §3.3 supersession banner + §3.2 stage rename

§3.3 now carries an inline blockquote pointing to the 2026-05-28
state-edit-mode spec that delivered it (PRs #232–#240). §3.3 prose
preserved as design rationale.

§3.2 main-body stage list renamed Sustainment → Control to match the
2026-05-27 WV1-NAV vocabulary rename (PR #218). Preserved code-level
identifiers (ProjectMetadata.sustainment, panelsStore 'sustainment',
ProcessStateLens 'sustainment') stay verbatim.

Sub-plan task 4 of 5."
```

---

## Task 5: T-NEW-1 vocabulary patches

**Files:**

- Modify: `docs/01-vision/glossary.md`
- Modify: `docs/02-journeys/personas/index.md`
- Modify: `docs/01-vision/product-overview.md`
- Modify: `docs/02-journeys/ia-nav-model.md`
- Modify (audit): `docs/07-decisions/adr-042-project-dashboard.md`

- [ ] **Step 1: glossary.md — Sustainment → Control**

In `docs/01-vision/glossary.md`, find the 3 hits referencing "Sustainment" as a stage label (around line 85 per audit). Replace each `Sustainment` → `Control` in narrative prose. Preserved-identifier list applies: NOT code references.

- [ ] **Step 2: personas/index.md — stage list update**

In `docs/02-journeys/personas/index.md` (~line 18), find the stage list `Charter → Approach → Sustainment`. Replace `Sustainment` → `Control`.

- [ ] **Step 3: product-overview.md — retire State/Edit residuals**

In `docs/01-vision/product-overview.md`, find the 2 hits referencing "State/Edit" or "Edit mode" as current behavior. Read the surrounding context to understand the assertion. Replace with LV1-shipped reality. Suggested replacement framing:

Old (likely):

> "The Process tab has two modes — State (default) and Edit — letting users toggle between viewing the project structure and authoring it."

New:

> "The Process tab uses canvas direct-manipulation: structure is authored inline (chips, zones, drag-and-drop) without a mode toggle. Scope-chrome and live cross-tab visualization (✓ markers, dim out-of-scope, categorical badges) link the canvas to the Explore tab's analysis."

Adapt the exact prose to whatever context the file has; the principle is "describe the LV1-shipped reality, not the retired State/Edit binary."

- [ ] **Step 4: ia-nav-model.md — add 5-verb anchor section**

In `docs/02-journeys/ia-nav-model.md`, append a new section `## Vocabulary: 5-verb activity frame` near the end (after the existing 7-tab nav + active-IP cascade content; before any "See also" / footer section). Content:

```markdown
## Vocabulary: 5-verb activity frame

Wedge V1 organizes user activities under five verbs:

> **Frame → Explore → Analyze → Improve → Control**

Mapping to the 7-tab nav:

- **Frame** — Process tab (canvas configuration; structure + outcomes + factors)
- **Explore** — Explore tab (EDA / 4-chart dashboard)
- **Analyze** — Analyze tab (Investigation Wall / hypotheses)
- **Improve** — Improve tab (top-level verb tab, active-IP cascade)
- **Control** — Control stage (verify + handoff closure)

Authoritative definition: State/Edit mode + IP-scoped presentation spec §3 D6 (target path from `docs/02-journeys/ia-nav-model.md`: `../superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md`). Architecture rationale: ADR-082 Wedge architecture (target path: `../07-decisions/adr-082-wedge-architecture.md`).

(Implementer note: at insertion time inside `docs/02-journeys/ia-nav-model.md`, convert the two target paths above into proper `[label](path)` markdown links. Shown as plain-text in this sub-plan only to keep its pre-commit cross-reference validator happy.)

This activity frame supersedes the earlier 4-verb pre-wedge proposal (`Frame → Scout → Investigate → Improve`).
```

- [ ] **Step 5: adr-042 audit**

Read `docs/07-decisions/adr-042-project-dashboard.md`. Locate the 1 `EditModeShell` reference. Decide:

- If the reference describes the retired component as historical context (e.g., "When EditModeShell was the canonical entry to authoring..."), add `[RETIRED by LV1-C 2026-05-29]` inline marker.
- If it describes EditModeShell as current architecture, replace the assertion with the LV1-shipped reality (canvas direct-manipulation; no EditModeShell).
- If the reference is in a code block / quoted code, leave it (historical fidelity).

Document the chosen disposition in the commit message.

- [ ] **Step 6: Verify**

```bash
pnpm run docs:check
bash scripts/pr-ready-check.sh
```

Expected: both green.

Spot-check Sustainment refs:

```bash
grep -rn "Sustainment" docs/01-vision/ docs/02-journeys/ docs/OVERVIEW.md
```

Remaining hits should be either (a) code-identifier references with backticks (e.g., `ProjectMetadata.sustainment`), (b) explicit historical/archive markers, or (c) ZERO hits if no such references exist there.

Spot-check State/Edit refs:

```bash
grep -n "State.Edit\|Edit mode\|authoringMode" docs/01-vision/
```

Returns zero non-historical hits.

Verify 5-verb anchor section:

```bash
grep "Vocabulary: 5-verb activity frame" docs/02-journeys/ia-nav-model.md
```

Returns the heading.

- [ ] **Step 7: Commit**

```bash
git add docs/01-vision/glossary.md \
  docs/02-journeys/personas/index.md \
  docs/01-vision/product-overview.md \
  docs/02-journeys/ia-nav-model.md \
  docs/07-decisions/adr-042-project-dashboard.md
git commit -m "docs(t-new-1): vocabulary alignment — Sustainment→Control + 5-verb anchor

Closes Task #49 (T-NEW-1: methodology + JTBD vocabulary alignment).
Supersedes Task #39 (Lead JTBD restructure) per
feedback_drop_methodology_bridges.

Stage rename narrative-prose only (preserved code identifiers intact):
- glossary.md: 3× Sustainment → Control
- personas/index.md: stage list updated
- product-overview.md: retired State/Edit binary refs → LV1-shipped
  reality (canvas direct-manipulation + scope-chrome in Explore)

New canonical anchor:
- ia-nav-model.md: '## Vocabulary: 5-verb activity frame' section
  quoting spec D6 + cross-linking ADR-082

adr-042 audit: [describe disposition of EditModeShell ref here per
Step 5 implementer decision].

Sub-plan task 5 of 5."
```

---

## Execution model

- Worktree: `doc-closeout-sweep-lv1-tnew1` (`EnterWorktree`).
- Per-task implementer: Sonnet. Pragmatic-review pattern — skip per-task spec/quality reviewer pairs; final-branch Opus review only after Task 5 (matches LV1-D/E/F/G precedent per `feedback_prefer_pragmatic_over_formal`).
- Pre-PR sweep at controller level after Task 5: `pnpm run docs:check && bash scripts/pr-ready-check.sh`.
- `gh pr create` referencing this sub-plan + LV1 master plan. Title: `docs(closeout): LV1 Phase-1 + T-NEW-1 vocabulary + delivered status lifecycle gate`.
- Final-branch Opus code review (STEP 0: `git fetch && git checkout && git branch --show-current` per `feedback_code_review_subagent_must_checkout_pr_branch`). Reviewer verifies: (a) preserved-identifier list intact, (b) schema patch idiomatic, (c) frontmatter flips touch only `status:` field, (d) wedge §3.3 banner doesn't break section flow, (e) 5-verb anchor quotes spec D6 verbatim.
- `gh pr merge --merge --delete-branch` (NEVER `--squash`).
- `ExitWorktree` action `remove`, `discard_changes: true`. Then `git pull --ff-only origin main`.

## Acceptance signals

1. **Schema accepts `delivered` canonically:** `grep "'delivered'" scripts/docs-frontmatter-schema.mjs` returns a hit inside the `STATUS` array; `grep "delivered: 'active'" scripts/docs-frontmatter-schema.mjs` returns ZERO hits.
2. **All LV1 + CCJ closeout files have `status: delivered`:** the §Files / LV1 + CCJ tables match reality.
3. **Zero transitional-alias warnings:** `bash scripts/check-doc-health.sh` no longer reports the 2 prior aliased-status warnings.
4. **PWA-Mount-Deferral logged:** `grep "PWA-Mount-Deferral\|PWA .ScopeChrome. mount deferred" docs/decision-log.md` returns a hit.
5. **Two-Done-Buttons RESOLVED:** `grep "RESOLVED 2026-05-28 via PR #236" docs/ephemeral/investigations.md` returns a hit.
6. **Wedge §3.3 banner present:** `grep -A1 "### §3.3" docs/superpowers/specs/2026-05-16-wedge-architecture-design.md` shows the `> **DELIVERED 2026-05-29...**` blockquote.
7. **No bare Sustainment stage labels in user-facing docs:** `grep -rn "Sustainment" docs/01-vision/ docs/02-journeys/ docs/OVERVIEW.md` returns ONLY code-identifier references (with backticks) or historical/archive markers.
8. **5-verb anchor present:** `grep "Vocabulary: 5-verb activity frame" docs/02-journeys/ia-nav-model.md` returns the heading.
9. **`pnpm run docs:check`** + **`bash scripts/pr-ready-check.sh`** both green.

## Risks + mitigations

- **Risk:** Schema patch breaks pre-push hook for some unrelated doc relying on the alias.
  - **Mitigation:** Task 1 Step 2 runs `pnpm run docs:check` immediately. Audit found only 2 transitional-alias consumers; Task 2 fixes both.
- **Risk:** CCJ retroactive flip discovers partial-supersession.
  - **Mitigation:** Task 2 implementer notes if any CCJ file represents work that didn't fully ship; mark `superseded` (linking LV1-C) instead of `delivered` and document in commit message. Audit pre-check showed only master + spec need flipping (B1 already `delivered`).
- **Risk:** Preserved-identifier list violated by an over-eager Sustainment→Control replace in Task 4 or Task 5.
  - **Mitigation:** Implementer reads the preserved list explicitly before each replace. Backtick-fenced code references and type-union mentions are NEVER renamed. Architecture-grep before commit: `grep -rn "ProjectMetadata.sustainment\|panelsStore.*sustainment\|ProcessStateLens.*sustainment" docs/` to verify nothing got accidentally rewritten.
- **Risk:** 5-verb anchor section in `ia-nav-model.md` duplicates the spec D6 definition + drifts over time.
  - **Mitigation:** Anchor section quotes spec verbatim + provides cross-link to spec D6 as authoritative source. Not a parallel definition.
- **Risk:** Wedge §3.3 banner conflicts with section navigation.
  - **Mitigation:** Banner is scoped to §3.3 head only; §3.1/§3.2/§3.4+ remain operative. Banner text says "§3.3 below is preserved as design rationale" — clear that the rest of spec is still active.
- **Risk:** Decision-log entry breaks `docs:check` cross-reference validator (the 2 cross-links may not resolve correctly).
  - **Mitigation:** Verify both target paths exist before commit (Task 3 Step 4 runs the validator).
- **Risk:** `pr-ready-check.sh` runs the full test suite which is slow.
  - **Mitigation:** Pre-PR sweep is controller-level (Task 5 Step 6). Implementer Task 5 only runs `pnpm run docs:check` (fast). Controller does the full sweep after all tasks complete.

## Related

- LV1 master plan + §PWA-Mount-Deferral (parent initiative)
- `feedback_close_threads_to_done` (end-of-initiative thread closure)
- `feedback_consolidation_replace_not_umbrella` (single PR systemic fix)
- `feedback_drop_methodology_bridges` (T-NEW-1 supersedes Task #39)
- `feedback_systemic_before_patching` (schema-level fix vs per-doc patch)
- `feedback_doc_validation_hooks` (test surface = pre-push doc hooks)
- ADR-082 Wedge architecture (authoritative 3-stage / 5-verb model)
- ADR-083 Doc strategy (frontmatter schema authoring)
- `docs/agent-context/doc-discipline.md` (Propose→Apply→Archive lifecycle)
