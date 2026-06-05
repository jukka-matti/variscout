---
title: 'First-session journey designed: the altitude model, the b0 landing, the capture grammar + wireframes-in-spec process rule'
purpose: decide
tier: card
status: active
date: 2026-06-06
topic: ['decisions', 'first-session', 'journey', 'landing', 'capture', 'wireframes', 'process']
last-verified: 2026-06-06
supersedes: []
---

> **Decision card** — captures the 2026-06-06 first-session-journey brainstorm outcomes. Spec: [`2026-06-06-first-session-journey-design.md`](../../superpowers/specs/2026-06-06-first-session-journey-design.md). Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# First-session journey designed: the altitude model, the landing, the capture grammar

Owner-led brainstorm (live `--chrome` walk + visual-companion wireframes; 9 grounding subagents + a 3-lens adversarial panel). Ran standalone per the 2026-06-05 overlap analysis — no forcing design object shared with the Home / #12 / CoScout / Project-tab queued sessions; Home sequenced after with a scope fence (this spec owns the empty landing end-to-end; Home inherits it locked).

**The altitude model becomes the product's organizing frame.** One axis (L1 System → L2 Process → L3 Step → Explore → the condition), one grammar (engine proposes via chips/banners, analyst decides — never modal for what the system can answer), one unit (the Finding — a condition always expressed in factors, filing back to its step via `processLocation`), one wrapper (the Untitled project). Landing rule: land at the highest altitude the data has established. The five framing-concept generations (LayeredProcessView bands · 8f L1–L3 · CCJ drag-zones · FrameViewB0 picker · ColumnMapping wizard) are integrated by the spec §2 concept registry — click assigns a role, drag assigns a place, same chips throughout; only the wizard retires (demoted to the "Fix data…" hatch).

**Key calls:** (1) every data entry auto-creates an in-memory Untitled project (Word-style: unsaved until explicit save; save nudge at first Finding; `beforeunload` guard; Azure's `useNewHubProvision` 'Untitled hub' default corroborates; PWA unchanged per R6d) — dissolves the E1 T6 Process-tab gate and completes IM-0a's 1:1. (2) Paste/sample land on the Process tab pre-filled by existing inference (grounding verdict: the wizard was "confirmation theater" — `detectColumns` writes Y/X before the modal renders); detection tiers = quiet chips (time/types) vs loud confirm-banners (defect · wide · step-timestamp pairs → the shipped `StepTimingsModal`). (3) One capture card, four entries (pin / brush / point / engine signal); brush is intent (card opens on release); carving gestures mint derived factors on save — what plugs brushed findings into CS-12's derived-edge machinery. (4) Findings-forward Wall arrival + the `HypothesisStatus` ladder as presentation (gestures drive status via proposal chips; dropdown = override; enum untouched).

**Process rule adopted (owner): user-facing specs embed wireframes.** Canonical named-view wireframes at `docs/02-journeys/wireframes/` (journey step → named view → feature → component traceability); reviewer pairs verify built interaction against the view doc; Apply-phase doc propagation per-initiative at delivery, not batch. Rationale: prose-only specs bred the 5-generation fragmentation — the UI/UX POV was missing from the artifacts, not the people. CLAUDE.md + doc-discipline.md updated; `first-time.md` (stale Yamazumi draft) banner'd as the fossil exhibit, rewritten at delivery.

Guarded regressions named in spec §7: b0 multi-outcome parity before wizard demotion; no-numeric-Y stranding; `handleMappingCancel` rawData wipe; defect/wide stay confirm-not-auto; uniform row-count guardrail. Build phased P1–P4 (route+demote → detections→chips → capture+Wall → writer collapse), PWA before Azure mirror, ~25 `confirmColumnMapping` E2E rewrites budgeted first-class.
