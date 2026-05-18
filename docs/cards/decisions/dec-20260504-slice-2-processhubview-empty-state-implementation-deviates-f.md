---
title: 'Slice 2: ProcessHubView empty-state implementation deviates from inline-panel design'
purpose: decide
tier: card
status: active
date: 2026-05-04
topic: ['decisions', 'canvas', 'azure', 'spec']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Slice 2: ProcessHubView empty-state implementation deviates from inline-panel design

The plan specified "ProcessHubView renders HubCreationFlow inline when Hub is incomplete." Shipped implementation uses an amber CTA in ProcessHubView that redirects to Editor's existing paste/upload flow, which then renders HubCreationFlow Stages 1→2→3 inside the Editor gate. **Decision: ship the redirect-to-Editor-paste-flow path; do NOT block slice 2 on re-implementing inline-panel.** Rationale: Editor.tsx already owns paste/upload infrastructure; duplicating it into ProcessHubView would have required reimplementing the full paste pipeline inline. The user reaches HubCreationFlow Stages 1→2→3 either way — the route is the only difference. **Supersedes** plan section "Azure Hub-creation entry: empty-state inline panel" in `docs/superpowers/plans/lets-do-slice-2-synchronous-sonnet.md`. **Carry-forward:** revisit when ProcessHubView gains its canvas surface (Spec 2 territory) — the inline-panel design is the natural home for canvas creation once the canvas exists. Also carry-forward: `expectedOutcomeNote` field in `ColumnMappingConfirmPayload` has no home on `ProcessHub` yet — downstream handlers currently ignore it. Add to `ProcessHub` metadata when the field lands. _Pinned 2026-05-04._
