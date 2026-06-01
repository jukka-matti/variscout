---
tier: living
purpose: design
title: 'Documentation Alignment — closing the Apply-phase backlog across the shipped V1 surface'
audience: both
status: draft
date: 2026-06-02
last-verified: 2026-06-02
verified-against-commit: fff607f2
layer: spec
topic:
  [
    documentation,
    sdd,
    doc-discipline,
    apply-phase,
    investigation-surface,
    persistence,
    wedge-v1,
    governance,
  ]
related:
  - docs/superpowers/specs/2026-05-16-docs-strategy-design.md
  - docs/superpowers/specs/2026-05-18-spec-driven-development-design.md
  - docs/agent-context/doc-discipline.md
  - docs/07-decisions/adr-083-eight-purpose-doc-taxonomy.md
  - docs/ephemeral/investigations.md
  - docs/decision-log.md
implements:
  - docs/superpowers/specs/2026-05-18-spec-driven-development-design.md
  - docs/superpowers/specs/2026-05-29-investigation-surface-design.md
  - docs/superpowers/specs/2026-05-31-factors-evaluation-design.md
---

# Documentation Alignment — closing the Apply-phase backlog across the shipped V1 surface

> **For agentic workers:** This is a master sequencer + design, not a task-level plan. Each Wave gets a dedicated `docs/superpowers/plans/YYYY-MM-DD-doc-align-wave-N.md` via `superpowers:writing-plans` at execution time. Re-check `main` and ground every doc against shipped code (per `feedback_subagent_grounding_catches_drift`) before writing.

## 1. Context — the disease, not the symptoms

The V1 wedge pivot, the investigation-surface arc (IM-0…IM-7), the Factors & Evaluation follow-on (FE-1/2a/2b), Linked Views, and the R5/R6 persistence refactor shipped a large amount of new product behaviour. A grounded audit (2026-06-02, multi-agent, against commit `fff607f2`) inventoried **57 shipped capabilities + specs** and mapped each to its canonical documentation:

| Doc status | Count | Meaning                               |
| ---------- | ----- | ------------------------------------- |
| 🟢 current | 10    | doc matches shipped reality           |
| 🟡 stale   | 7     | doc exists but lags shipped behaviour |
| 🟠 partial | 12    | stub or fragment; incomplete          |
| 🔴 missing | 28    | no canonical doc exists               |

**Only ~1 in 6 shipped capabilities has a current canonical doc.** The full per-capability matrix lives in the audit transcripts; the cluster-level rollup is §4 below.

**Root cause (the disease):** the SDD _Apply phase_ is systematically skipped. The team writes the design spec and ships the code, but the doc-propagation step — update/create the L1/L2/L3 canonical docs the spec's `implements:` points at — does not run. The specs ledger proves the pattern: `2026-05-29-investigation-surface`, `2026-05-31-factors-evaluation`, `2026-05-26-canvas-connection-journey`, and `2026-05-28-state-edit-mode` are all _delivered_ (code shipped) with their target docs never written. The SDD Apply-phase + the Play 2b SSoT validator exist precisely to prevent this, but the validator is unshipped, so nothing enforces it. **Stale docs are the symptom; the unenforced Apply phase is the disease.** This spec fixes both.

## 2. Goal & non-goals

**Goal:** every shipped V1 surface has exactly one current, grounded canonical doc — cross-layer duplication removed and the Apply-phase discipline made mechanical — so that **a developer or an AI agent can reconstruct the shipped behaviour from the docs without reading the code**, and the backlog stops re-accumulating. We adopt the _existing_ SDD 5-layer structure rather than inventing a new one.

**Primary reader (locked 2026-06-02): internal — the dev + AI agents grounding against the docs + onboarding.** NOT end-user / docs-site / marketing copy. Optimize for accuracy, groundedness, and intent diagrams over prose polish; **terse and mechanical is correct, not a compromise.** Success = an agent grounding on the doc gets the truth, fast.

**Driver (locked 2026-06-02): coherence, not launch timing.** We document the current shipped truth at a **frozen code state** — **this initiative completes before further product refactoring resumes.** The R-series (Codex) pauses until the Waves land, so docs are written against a stable target, not a moving one. Because the driver is coherence (not an imminent launch), the Analyze journey-rewrite stays Wave 1 and Save/Access stays Wave 2. See decision-log 2026-06-02.

**Non-goals (explicitly out of scope):**

- **Play 1b folder restructure** (`01-vision/…` → `stable/`·`living/`·`ephemeral/`·`cards/`). Deliberately deferred to a post-V1 quiet window; orthogonal `git mv` work. We author docs with correct SDD frontmatter _in place_; the folder move happens later.
- **Full SDD M0–M5 retrofit of all ~48 existing feature files.** We bring SDD discipline only to the docs we touch or create in these Waves.
- **Documenting deferred/unbuilt features as if shipped.** The auto-link engine (IM-3, post-IM-4) and similar are documented _as deferred_, not as live.
- **Re-opening product decisions.** This is documentation alignment; where docs and code disagree, code wins (per CLAUDE.md). Genuine design questions surfaced during writing graduate to `decision-log.md`, they are not resolved inside a doc edit.
- **Machine-translating the 31 non-English locale status labels** (`wall.status.confirmed` → "Supported"). That is a localization-team task; the English-placeholder convention is the accepted interim.

## 3. Documentation architecture (adopt the existing SDD stack)

We do **not** invent a structure. The repo already prescribes the SDD 5-layer stack (`2026-05-18-spec-driven-development-design.md`) + the 8-purpose × 4-tier schema (ADR-083, `scripts/docs-frontmatter-schema.mjs`). Play 1a (schema + enforcement) shipped; the layer model is defined; Play 1b/2b and M0–M5 are not yet rolled out. We map onto it:

- **L1 vision** (`docs/01-vision/*`) — the _why_ and the mental model. The one structural rewrite here is `eda-mental-model.md` §2–7 (superseded by ADR-085/089).
- **L2 journeys** (`docs/USER-JOURNEYS.md`, `docs/02-journeys/*`) — **the spine.** The end-to-end 7-tab walkthrough is _one coherent narrative_, read top-to-bottom. `USER-JOURNEYS.md` is mostly current; the Analyze sub-journey is the one genuine flow rewrite.
- **L3 features** (`docs/03-features/*`) — **focused per-surface docs.** Each carries `layer: L3`, `kind:` (ui|workflow|engine|infrastructure), `serves:` → its L2 journey, `implements:` ← the upstream design spec, and a mandatory intent diagram. This is the "many docs" tier — but **de-duplicated and clustered**, not 1-doc-per-capability.
- **L4 engineering / package `CLAUDE.md`** — **developer-internal** concepts. Engine internals are NOT user-facing L3 docs.
- **L5 ADRs** — decisions (already largely current: ADRs 082–089).

**The "one doc or many?" resolution:** one coherent **spine** (L2) + a **consolidated** set of focused **feature docs** (L3) + a **thin overview** (L1) — _not_ a single mega-doc and _not_ the 70-doc scatter. The thing we kill is **cross-layer duplication** (the same nav/stage/mode facts repeated in the overview _and_ the journey _and_ the feature docs), because that overlap is what drifts silently. Each fact gets exactly one home: spine = flow/sequence; feature doc = mechanics; ADR = why.

**Audience split (locked):** user-facing surfaces → L3 feature docs; developer-internal engines (thin app-feature factories, `wallLayout`, `FindingSource` union, `buildAIContext` internals, canvas-viewport store, dirty-state fingerprint algorithm, server storage boundary internals) → L4 / package `CLAUDE.md`. This prevents manufacturing ~28 docs nobody reads.

## 4. Cluster → canonical-doc map

The 28 missing + 19 stale/partial capabilities cluster into ~12 coherent canonical homes (plus the dev-internal targets and the cross-cutting fixes).

### User-facing (L3)

1. **Investigation Surface / Analyze** _(the journey rewrite)_ — scope (WHERE, first-class `ProblemStatementScope`) + Wall + hypotheses (WHY) + model-builder band + test-plan triad + disconfirmation ("Try to break it") + per-hypothesis What-If Cpk + Evidence Map + Focus lens. Home: refresh `workflows/analyze-wall.md` to current (it predates the May specs) + a new spine doc `workflows/investigation-surface.md`; sub-capabilities are _sections within_, not separate docs. Archive `workflows/question-driven-analyze.md` (superseded; salvage η²-thresholds + "never root cause" terminology first).
2. **Findings & Hypotheses domain** — Finding lifecycle, `FindingSource` (user-facing parts), validation status (supports/counts-against/inconclusive), CausalLink/contribution. New `workflows/findings-hypotheses.md`.
3. **Save, Load & Access** _(launch-critical — R6 shipped + unlaunched)_ — `DocumentSnapshot`, save semantics (PWA export-only vs Azure durable Save/Save-As identity), dirty-state, `.vrs` envelope, ETag conflict UX, ACL/access enforcement. Refresh the `data/{storage,export,acl,etag-concurrency,cloud-sync}.md` stubs + a new `data/save-and-load.md` user contract.
4. **Collaboration** — comment threads + @mentions + attachments + `ActionItem` + invitations + active-IP cascade. New `workflows/collaboration.md` (or folded into findings-hypotheses + acl).
5. **CoScout / AI context** — refresh `ai/coscout.md` (stub) + the user-facing parts of `buildAIContext`/`recentComments`.
6. **Measurement Plan (DCP)** — `workflows/measurement-plan-dcp.md` (current; minor refresh).
7. **Values⇄Capability** — refresh `analysis/subgroup-capability.md` into the "one surviving specs-gated view" framing (Cp/Cpk only).
8. **Home tab** — _new_ `workflows/home.md` (PWA training-funnel vs Azure durable doc-list, PendingInvitesBanner, active-IP cascade origin).
9. **Report tab** — _new_ `workflows/report.md` (ReportView, distributions-not-aggregates per ADR-073, snapshot export).
10. **Process tab** — refresh `workflows/process-maps.md` (canvas substrate, State/Edit retirement, analysisScopeStore bridge).
11. **Explore tab** — refresh `analysis/index.md` + linked-views scope drill; drop residual mode/lens + Pp/Ppk.
12. **Project + Improve tabs** — refresh `workflows/{project-dashboard,improvement-workspace}.md` (Project=collaboration container, Hub↔IP 1:1, Charter→optional non-blocking sign-off; Improve = top-level verb tab, ImprovementWorkspaceBase).

### Developer-internal (L4 / package `CLAUDE.md`)

Thin app-feature factories → `packages/stores/CLAUDE.md`; `wallLayout.computeWallLayout` + Focus-lens BFS → `packages/ui/CLAUDE.md`; `FindingSource` union + `buildAIContext` internals → `packages/core/CLAUDE.md`; dirty-state fingerprint algorithm + server storage boundary internals → an L4 persistence note.

### Cross-cutting (touched once, several tabs benefit)

`specifications.md` slimmed to a thin product-overview map (no duplicated feature detail); `ia-nav-model.md` de-personalized (collapse the persona-access table) + nav/stage vocabulary; `USER-JOURNEYS.md` Analyze sub-journey refreshed; `eda-mental-model.md` (L1) §2–7 reframed per ADR-085/089.

## 5. Governance — make the Apply phase mechanical

The recurrence guard is as important as the content. In scope:

- **Ship Play 2b SSoT validator** (already "ready to ship, safe-parallel"): HARD-FAIL on `*-amendment-*.md` / `*-revision-*.md` anti-pattern filenames under `docs/superpowers/specs/`; edit-in-place enforcement; decision-log append-only warning; WARN on a design spec `status: delivered` without its `implements:` targets touched (the Apply-phase sensor).
- **Adopt the prescribed freshness fields** — `last-verified` + `verified-against-commit` (NOT the ad-hoc `last-reviewed`) on every doc we touch or create, so drift becomes visible.
- **Mandatory intent diagrams** on every L3 doc per its `kind:` (ASCII/Mermaid wireframe for `ui`, sequence for `workflow`, flowchart for `engine`).
- **Steward hook** (when its phase lands) will then flag L3 specs missing intent diagrams or with stale `last-verified`.

## 6. Prioritised waves

Sequenced load-bearing-user-facing first, developer-internal last, governance threaded early.

- **Wave 0 — cross-cutting + governance (fast, highest leverage).** Slim `specifications.md`; de-personalize `ia-nav-model.md`; refresh the `USER-JOURNEYS.md` Analyze sub-journey + `eda-mental-model.md`; archive `question-driven-analyze.md`; triage the May stub docs. **Ship Play 2b validator** so the Apply-phase discipline holds for every later Wave.
- **Wave 1 — Investigation Surface / Analyze** (cluster 1). The load-bearing journey rewrite + its feature doc-set.
- **Wave 2 — Save / Load / Access** (cluster 3). The R6 persistence surface, documented against the frozen post-R6e state — the freeze (below) is what makes this safe to write, since R6 is otherwise still being reshaped.
- **Wave 3 — Findings / Collaboration + CoScout** (clusters 2, 4, 5).
- **Wave 4 — remaining surfaces** (clusters 6–12): Home + Report _new_; Process/Explore/Improve/Project refresh; Measurement-Plan + Values⇄Capability refresh.
- **Wave 5 — developer/architecture docs** (L4 / package `CLAUDE.md`).

Each Wave is a separate plan + PR (or small PR cluster) per `feedback_master_plan_for_multi_subsystem_specs`; cap at ~6–8 docs/PR.

**Freeze (locked 2026-06-02):** product refactoring (the R-series) pauses until these Waves complete — docs are written against a frozen code state. Any in-flight refactor _doc_ work (e.g. R6f's persistence-residue sweep) folds into Wave 0/2 rather than running in parallel. Resuming refactoring before the initiative completes re-opens the moving-target problem and is out of scope.

## 7. Lifecycle & method

- **Propose → Apply → Archive** per `doc-discipline.md`. This spec is the Propose; each Wave plan executes Apply against the canonical L1/L2/L3 docs; superseded docs (e.g. `question-driven-analyze.md`) move to `docs/archive/` with a delivered/superseded banner.
- **Grounded authoring:** every doc is written/verified against actual shipped code at the named commit, not against prior prose (`feedback_subagent_grounding_catches_drift`).
- **Upstream spec status:** as part of the relevant Wave, flip the now-delivered upstream specs (`2026-05-29-investigation-surface`, `2026-05-31-factors-evaluation`) from `draft` → `delivered` and run their §13 Apply-phase items.

## 8. Open decisions (resolve at Wave-plan time, not now)

- Whether **Collaboration** (cluster 4) is its own doc or folds into Findings-Hypotheses + ACL — decide at Wave 3 planning by content weight.
- Whether the **Investigation Surface spine** is one doc or a spine + Wall split — decide at Wave 1 planning (lean: spine doc + refreshed `analyze-wall.md`).
- Exact L4 home for dev-internal notes (package `CLAUDE.md` vs a new `docs/05-technical/` L4 doc) — decide at Wave 5.

## 9. See also

- `docs/ephemeral/investigations.md` — the "Doc + user-journey alignment" entry (the per-tab scoreboard + this initiative's origin).
- `docs/superpowers/specs/2026-05-18-spec-driven-development-design.md` — the SDD stack this adopts.
- `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` — Play sequence (1a shipped; 1b/2b pending).
- `docs/agent-context/doc-discipline.md` — Propose→Apply→Archive + anti-pattern enforcement.
- `docs/superpowers/specs/2026-05-29-investigation-surface-design.md` §13 — the doc-propagation map this Wave 1 executes.
