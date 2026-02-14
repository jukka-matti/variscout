# TODO — Remaining Implementation Work

Captured after Investigation Mindmap + What-If Simulator delivery (2026-02-14).
All 816 tests pass. Both features functional across PWA and Azure.

---

## 1. Azure Mindmap Gaps

- [x] **No popout window** — Ported MindmapWindow.tsx with localStorage sync + postMessage drill commands; popout detected via `?view=mindmap` before MSAL auth

## 2. Azure What-If Gaps

- [x] **No full-page WhatIfPage** — Added WhatIfPage.tsx with header, back navigation, outcome/filter info (matches PWA)
- [x] **No settings entry point** — Added Beaker icon button in Editor header bar (shown when specs are set)

## 3. Documentation Updates

- [x] **Feature-parity doc** — renamed "Variation funnel" to "Investigation Mindmap"; added "What-If Simulator" row
- [x] **Website learning content** — `learnData.ts` updated to say "Investigation Mindmap"
- [x] **Core JSDoc comments** — `variation.ts` JSDoc references updated

## 4. Minor Polish (Optional)

- PWA MindmapPanel line 34 comment says "Replaces FunnelPanel" — historical note, fine to keep
- `useVariationTracking` line 82 references "variation funnel" concept — fine to keep
