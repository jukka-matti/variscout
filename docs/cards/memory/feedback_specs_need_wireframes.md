---
title: 'specs-need-wireframes'
description: 'User-facing specs must include wireframes — prose-only specs caused UI/UX fragmentation (5 framing generations); owner decides fast when seeing, slowly when reading'
purpose: remember
tier: card
status: active
date: 2026-06-05
topic: [memory, feedback]
related: []
verified-against-commit: 7712f1edb
last-verified: 2026-06-05
source-hash: 4fb77dc4b71a75f9
origin-session-id: 1a5f19e2-64ac-43a6-999b-55e8501292ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_specs_need_wireframes.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Owner insight (2026-06-06, first-session-journey brainstorm): "we are sometimes writing code, but the UI and UX POVs are missing." The pipeline (brainstorm → prose spec → plan → code) meant the first time any UI visually existed was when code rendered it — interaction design decided implicitly by implementers or by whatever component already existed. Result: 5 framing concept generations (LayeredProcessView bands → 8f L1-3 pan/zoom → CCJ drag-zones → FrameViewB0 picker → ColumnMapping wizard) coexisted, each coherent in code, never integrated — the journey "works but doesn't flow."

**Why:** The owner is a visual thinker — every major call in the first-session brainstorm was made within minutes of *seeing* an HTML mockup (visual companion), after weeks of the same concepts sitting unintegrated in prose. UI/UX POV was missing from the *artifacts*, not the people.

**How to apply:**
1. User-facing spec = must include wireframes. Brainstorm-companion HTML mockups graduate into the spec (assets dir next to the spec) + ASCII skeletons inline for the spine. Right-sized — no Figma ceremony.
2. Spec/quality reviewer pairs on user-facing tasks check the built interaction against the wireframe, not just the prose.
3. When brainstorming UI topics, offer the visual companion early — decisions land faster and truer.

First applied: `docs/superpowers/specs/2026-06-06-first-session-journey-design.md` (the altitude model + landing + capture grammar wireframes). Related: [[project_connective_surface_redesign]] (the fragmentation this fixes).
