---
title: 'V2 ACL gap: pendingInvites recipientUserId'
purpose: remember
tier: card
status: archived
date: 2026-05-16
topic: ['investigation', 'logged']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-16 (logged); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# V2 ACL gap: pendingInvites recipientUserId

**Surfaced by:** PR-WV1-3 code review.

`useProjectMembershipStore.acceptInvite` doesn't filter pendingInvites by current-user recipient. localStorage is per-browser in V1 single-user PWA, so the gap is dormant. PR-WV1-5 (Azure AD auth wiring + per-user store key) closes this when Azure adds real auth-aware invite delivery.

**Promotion path:** Revisit in PR-WV1-5 when per-user persistence keys are addressed.
