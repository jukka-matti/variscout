---
title: 'Canvas drift indicator missing (vision §5.2)'
purpose: remember
tier: card
status: archived
date: 2026-05-07
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-06
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-07 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Canvas drift indicator missing (vision §5.2)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06.

**Description:** Vision §5.2 commits each step card to display a **drift indicator** — recent vs prior, when snapshot history exists. `CanvasStepCardModel` (`packages/hooks/src/useCanvasStepCards.ts`) has no `drift` or `priorStats` field, and the card UI has no drift rendering. Drift is methodologically core (Watson's "did this process change?"); shipping cards without it leaves the cadence-read flow incomplete.

**Possible directions:**

- Data model extension: `drift?: { direction: 'up' | 'down' | 'flat'; magnitude: number; threshold: number }` on `CanvasStepCardModel`.
- Snapshot reference: read prior `EvidenceSnapshot` per-step capability (slice 3 shipped per-row provenance + snapshot stamping).
- UI: small ↑ / ↓ / → arrow + magnitude % near the capability badge; arrow shape avoids H6 color-only signaling.
- Threshold: ±5% default (rule TBD); user-configurable later.

**Promotion path:** PR8b of the canvas migration sequence. Requires `EvidenceSnapshot` history reader (mostly shipped); UI + model extension lands in one ~6-task PR.

**Resolution:** PR8-8b — `computeStepDrift` engine in `@variscout/core/canvas`, direction-of-improvement-aware (Cpk first, then mean per `MeasureSpec.characteristicType`), default 5% threshold. `CanvasStepCardModel.drift?` populates when a `priorStepStats` Map is supplied. PWA + Azure FrameView read `evidenceSnapshots.listByHub`, pick the most-recent live snapshot's `stepCapabilities`, and pass through. Producer-side stamping of `EvidenceSnapshot.stepCapabilities` at snapshot-create time is deferred to a separate slice; until that lands, the indicator stays inert.
