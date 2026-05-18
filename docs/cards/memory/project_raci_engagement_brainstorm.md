---
title: 'RACI engagement brainstorm 2026-04-25 (PAUSED)'
description: 'Paused brainstorm — engagement-profile RACI design with 6 Discovery anchors + events-not-notifications layer; proposed ADR-071 supersedes ADR-015; Control Plan deferred to separate future spec'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 9fcad6aeb1deff6e
origin-session-id: 27066a29-b565-48ec-87f8-e6c61c9e6d25
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_raci_engagement_brainstorm.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

User (Six Sigma MBB) and Claude brainstormed RACI integration into VariScout on 2026-04-25, converging on three deliverables (six Discovery anchors as Identity layer + events-not-notifications Engagement layer + ADR-071 supersession of ADR-015). User paused before implementation.

**Why**: User has active strategic interest in multi-user collaboration features. ADR-015 (2024)'s blanket rejection of PM features is stale relative to current reality (Investigation Wall, FRAME, Azure tier with EasyAuth, audience-toggled exports). User explicitly said ADR-015 "is old, we should supersede it or something".

**How to apply**: When the user resumes RACI / collaboration / "who owns what" topic, route to:

- Spec (status: brainstorm): `docs/superpowers/specs/2026-04-25-engagement-profile-raci-design.md`
- Full thinking history: `~/.claude/plans/i-realized-how-can-federated-breeze.md`

Key synthesis to recall:

- **Two profiles**: Engagement (today's VariScout, person-named, episodic, chartered) vs Operations (future, role-named with shift rotation, recurring, signal-fired). Brainstorm scopes Engagement only.
- **Two layers within Engagement**: Identity (RACI metadata, six optional fields, fits Constitution P2) + Engagement (per-role default views + events-not-notifications architecture).
- **Six Identity anchors** (Discovery half of the lifecycle, all optional, reuse `FindingAssignee` shape where applicable): `IssueStatement.sponsor`, `ProcessMapNode.responsibleRole`, `Question.assignee`, `SuspectedCause.status += 'pending-validation'`, `ImprovementIdea.assignee`, `FindingOutcome.verifiedBy`.
- **Events not notifications**: VariScout emits typed `EngagementEvent` to a customer-configurable webhook; customer routes via Teams / Power Automate / Outlook. Avoids duplicating customer comms stack and respects ADR-059.
- **Control Plan** deferred to its own future spec — it's the bridge from Engagement → Operations profile (per-row RACI table, role-named, post-VERIFY sustainment artifact).
- **Phased delivery (when implementing)**: A = Identity layer (PWA + Azure); B = Engagement structural (Azure-only); C = Engagement events (Azure-only).
