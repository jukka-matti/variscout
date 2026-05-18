---
title: 'Canvas Migration PR8 Vision Alignment SHIPPED across 4 sub-PRs (#137 + #138 + #140 + #141)'
purpose: decide
tier: card
status: active
date: 2026-05-08
topic: ['decisions', 'canvas', 'capability', 'investigation']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Canvas Migration PR8 Vision Alignment SHIPPED across 4 sub-PRs (#137 + #138 + #140 + #141)

Master plan [`docs/superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md`](superpowers/plans/2026-05-07-canvas-pr8-vision-alignment-master.md) closed; promoted `status: delivered` 2026-05-08. **Five unmet vision-spec commitments closed via PR8 sub-PRs**: (1) §5.3 + §2.4 mode-aware response-path CTAs — 8a #137 `0dc9b102` 2026-05-07 (2-state CTA machine, per-path `WorkflowReadinessSignals`, hub-level Charter entity); (2) §5.2 drift indicator — 8b #138 2026-05-07 (↑/↓/→ + magnitude vs. prior snapshot capability on `CanvasStepCardModel`); (3) §5.2 time-series mini-chart — 8b #138 (`CanvasStepMiniChart` numeric+`distinct>30` branch with parser `timeColumn` + LTTB downsampling; supersedes the prior first-12-raw-values pseudo-binning, which is now `docs/investigations.md` followup); (4) §3.4 user-authored hypothesis arrows — 8d #140 `dfcab3c4` 2026-05-08 (top-level mode-agnostic draw tool, pointer-event SVG rubber-band, two-step commit with no Cmd+Z, View-layer active-tool state — deviates from master plan §4 8d note that placed it in mode-2 / Annotation; deviation user-confirmed); (5) §5.6 Wall mirror dual-home — 8e #141 `d2915bbc` 2026-05-08 (Fork 1 honored verbatim per `feedback_honor_vision_commitments`: `WallCanvas` embedded as canvas overlay layer, shared `useWallLayoutStore` viewport, click-to-drill into Investigation tab → Wall destination, viewport-adaptive `WallShortcutButton` re-skin <768px, hidden until ≥1 hub/question/finding via `useHasInvestigationContent`, pointer-transparent under 8d's draw-hypothesis tool). **Sixth commitment — §5.4 levels-as-pan/zoom (8f) — tracked separately** under the not-yet-written canvas viewport architecture spec + ADR-080 per master plan D2 (architecture choice between react-flow-style transform vs hand-rolled SVG/CSS warrants its own brainstorm, not a sub-PR). **Process invariants honored**: each sub-PR followed brainstorm → plan → branch → PR → `pr-ready-check.sh` → subagent code review → squash-merge per CLAUDE.md root rules; subagent-driven default with Sonnet workhorse + Opus final review per master plan D6; each sub-PR's `docs/investigations.md` entry marked `[RESOLVED]` at merge time; specs promoted `active → delivered` post-merge. **F-series sequence forward**: PR9 cleanup (delete legacy `LayeredProcessView` / `ProcessMapBase` / `FrameView` per `apps/pwa/CLAUDE.md` + `apps/azure/CLAUDE.md` + `packages/ui/CLAUDE.md` deprecation notes) is now unblocked. _Pinned 2026-05-08._
