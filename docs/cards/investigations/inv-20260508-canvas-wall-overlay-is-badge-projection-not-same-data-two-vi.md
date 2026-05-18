---
title: 'Canvas Wall overlay is badge projection, not "same data, two views" mirror (vision §5.6)'
purpose: remember
tier: card
status: archived
date: 2026-05-08
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-06
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-08 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Canvas Wall overlay is badge projection, not "same data, two views" mirror (vision §5.6)

**Surfaced by:** Canvas PR6 retrospective design review, 2026-05-06.

**Description:** Vision §5.6 commits the Wall to be **dual-home**: _"It remains the canonical destination in the Investigation tab AND becomes one of the canvas overlays. **Same data, two views**."_ §5.4 even says: _"With overlays on, the canvas IS the Wall view."_ Codex's implementation is a lighter projection — per-step badge counts + linked item lists in the step overlay — not a mirror of the Wall's full graph. Defensible V1 (read-only cadence-scan) but unmet spec commitment.

**Possible directions:**

- Embed the Wall viewport: render `WallCanvas` (`packages/charts/src/InvestigationWall/`) inline as the canvas overlay layer. Same data, lighter chrome.
- Hybrid: keep badge-projection as cadence-scan; add an "expand to wall view" button in canvas chrome lifting the wall into a modal / right-rail.
- Status quo + spec amendment: accept badge-projection as V1 dual-home; amend §5.6 to say "destination = full graph; overlay = projected badges."

**Promotion path:** PR8e of the canvas migration sequence. Requires Spec 4 brainstorm extension to pick between embedded-wall vs badge-projection-as-canonical. ~6 tasks if embedded-wall is chosen; ~2 (just the spec amendment) if status quo.

**Resolution:** Sub-PR 8e embeds `WallCanvas` as the canvas Wall overlay with shared Wall viewport state and click-to-drill to the Investigation Wall destination; see `docs/superpowers/specs/2026-05-08-canvas-wall-overlay-design.md`.
