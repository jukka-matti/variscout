---
title: 'Q8 revised: PWA persistence opt-in instead of default-on; `.vrs` files double as shareable training scenarios'
purpose: decide
tier: card
status: active
date: 2026-05-03
topic: ['decisions', 'investigation', 'methodology', 'azure']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Q8 revised: PWA persistence opt-in instead of default-on; `.vrs` files double as shareable training scenarios

Original Q8 ("PWA = local Hub-of-one with IndexedDB persistence") was too aggressive — it would have surprised users on shared computers and conflated "PWA _can_ persist" with "PWA _must_ persist." Revised Q8 (Option 4 hybrid): session-only by default; opt-in via "Save to this browser" for IndexedDB-backed Hub-of-one AND `.vrs` file export/import always available. Both paths preserved as user-agency escape hatches. **Strategic rationale:** PWA serves LSSGB training, demos, casual personal analysis, and **trainers authoring custom scenarios for their students**. Trainers package datasets + Hub state + sample investigations into a `.vrs` bundle and share via LMS / email; students import the bundle to start from a prepared training state. This positions PWA as the methodology-teaching surface and `.vrs` as the scenario-distribution format. Each persona's persistence consent is explicit (training students opt in once and auto-save; demo users skip; privacy-conscious users export to file; trainers export+share). Companies still use Azure tier for centralized + secure persistence per ADR-059. Constitution P1 (browser-only processing) and P8 (no AI in free tier) preserved. `apps/pwa/CLAUDE.md` hard rule updated from "no persistence" to "session-only by default; opt-in IndexedDB allowed; `.vrs` import/export for trainer-shared scenarios." Vision spec §7 tier paragraph + §8 Q8 row updated. Framing-layer spec V1 scope expands to include opt-in "Save to browser" affordance + `.vrs` export/import + IndexedDB schema loaded post-opt-in. _Pinned 2026-05-03._
