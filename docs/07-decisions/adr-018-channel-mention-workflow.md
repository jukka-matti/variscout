# ADR-018: Channel @Mention Workflow — Mobile Finding to Team Action

**Status**: Accepted

**Date**: 2026-03-02

**Related**: ADR-016 (Teams integration), ADR-015 (investigation board), ADR-007 (marketplace distribution)

---

## Context

ADR-015 established findings as a lightweight investigation tool: "NOT project management — no
assignees, no due dates, no priority levels." ADR-016 added Teams integration with URL sharing
(`shareWebContent`) and deep links, with Adaptive Cards noted as planned.

Field supervisors on their phones now have a gap: they can observe a pattern in a chart and pin
it as a finding, but there's no way to assign it to a specific person and notify them to
investigate. The current workflow requires:

1. Pin finding → 2. Open findings panel → 3. Tap share → 4. Pick conversation in Teams share
   dialog → 5. Separately tell the person in chat to look at it

This is 5 steps with context-switching. The desired workflow:

1. Tap chart bar → 2. Type observation + pick person → 3. Pin & Share → done (colleague gets
   @mention notification in the channel with a deep link)

Additionally, a bug exists: the note text typed in MobileCategorySheet is silently discarded
when creating chart observations. All mobile chart findings are created with empty text.

### Why now

- The mobile carousel (ADR-016 Phase 2) and MobileCategorySheet are implemented and stable
- Teams context already provides `teamId` and `channelId` in channel tabs
- The OBO token exchange infrastructure (ADR-016 Phase 6) supports scope extension
- The `ChannelMessage.Send` permission fits naturally into the existing admin consent flow
  (IT admins already approve `Files.ReadWrite.All` and `Channel.ReadBasic.All`)

---

## Decision

**Extend the Finding data model with an optional assignee and enable true @mention posting
to the current Teams channel from the mobile chart interaction sheet.**

This consciously relaxes ADR-015's "no assignees" constraint for the Team plan only. The
assignee is lightweight — a display name and UPN, not a full project management system.
There are no due dates, priorities, or assignment notifications outside of Teams channels.

### Finding Assignee (Data Model Extension)

```typescript
interface FindingAssignee {
  /** Azure AD user principal name (e.g. jane@contoso.com) */
  upn: string;
  /** Display name for UI rendering */
  displayName: string;
  /** Azure AD object ID — used for Graph @mention entity */
  userId?: string;
}

// Finding interface gains:
assignee?: FindingAssignee;
```

The field is optional. Existing `.vrs` files load without modification. The PWA ignores it.
Standard plan does not render the assignee UI.

### Mobile Interaction Flow

```
Tap boxplot box / Pareto bar
  → MobileCategorySheet opens (existing)
    → Type observation note (bug fix: text now preserved)
    → "Pin as Finding" button
      → Finding created with note + chart source
      → Sheet transitions to confirmation phase:
        ┌──────────────────────────────────┐
        │  Finding created                 │
        │  "Machine B runs hot"            │
        │                                  │
        │  [Assign & Share to Teams]       │
        │  [Done]                          │
        └──────────────────────────────────┘
      → "Assign & Share" tapped:
        ┌──────────────────────────────────┐
        │  Assign to: [Search people     ] │
        │    ┌─────────────────────────┐   │
        │    │ Jane Smith              │   │
        │    │ Karl Virtanen           │   │
        │    └─────────────────────────┘   │
        │                                  │
        │  [Share to Channel]              │
        └──────────────────────────────────┘
      → Posts @mention message to current channel
```

### Channel @Mention (Graph API)

When in a Teams channel tab (`isChannelTab() && isTeamPlan()`), the app posts directly to
the current channel via Graph API:

```
POST /teams/{teamId}/channels/{channelId}/messages

{
  "body": {
    "contentType": "html",
    "content": "<at id=\"0\">Jane Smith</at> Machine B showing 38% contribution.
                Cpk 0.7 — <a href=\"{deepLink}\">Open in VariScout</a>"
  },
  "mentions": [{
    "id": 0,
    "mentionText": "Jane Smith",
    "mentioned": {
      "user": {
        "id": "{azure-ad-user-id}",
        "displayName": "Jane Smith",
        "userIdentityType": "aadUser"
      }
    }
  }]
}
```

The `teamId` and `channelId` come from `getTeamsContext()` (already available). The
`userId` comes from the People Picker search result.

### Fallback Chain

```
isChannelTab() && isTeamPlan()?
├── Yes → POST /channels/{id}/messages → real @mention with notification bell
└── No  → isInTeams()?
    ├── Yes → sharing.shareWebContent() → URL card (user picks conversation)
    └── No  → navigator.clipboard.writeText(url) → copy deep link
```

The channel @mention is the fast path for the target persona (supervisor in a channel tab).
All other contexts gracefully fall back to existing sharing mechanisms.

### People Search

Colleagues are searched via `GET /me/people?$search="{query}"` (Graph People API). This
returns people relevant to the signed-in user — org chart adjacency, recent collaborators,
Teams channel members. Debounced at 300ms, max 5 results displayed.

### Permission Extension

| Permission            | Type      | Consent | Purpose                   | Status              |
| --------------------- | --------- | ------- | ------------------------- | ------------------- |
| `People.Read`         | Delegated | User    | People picker search      | **New** (Team plan) |
| `ChannelMessage.Send` | Delegated | Admin   | Channel @mention messages | **New** (Team plan) |

Both are additive to the existing Team plan scope string. `ChannelMessage.Send` requires
admin consent but fits naturally into the existing consent flow — IT admins already approve
`Files.ReadWrite.All` and `Channel.ReadBasic.All` during Managed App deployment.

The OBO token exchange function gains scope flexibility: the client sends requested scopes,
the function validates against a server-side allowlist before exchanging.

Standard plan scope string is unchanged. PWA is unaffected.

### Security Considerations

- **Scope allowlist**: The OBO Azure Function validates requested scopes against a hardcoded
  allowlist. The client cannot request arbitrary Graph permissions.
- **Channel-scoped posting**: Messages are posted to the channel the app is installed in —
  the user cannot target arbitrary channels. `channelId` comes from Teams context, not user
  input.
- **Assignee is advisory**: The `FindingAssignee` field is a display hint, not an access
  control mechanism. Any channel member can view and update any finding.
- **No escalation path**: The app posts messages as the signed-in user (delegated permission),
  not as a service principal. Messages appear with the user's name and avatar — fully
  attributable.

---

## Consequences

### Easier

- **3-tap investigation dispatch**: Tap chart → type observation → Pin & Share. Colleague
  gets a Teams notification bell with a deep link directly to the finding.
- **Natural supervisor workflow**: Observation, assignment, and notification happen in a
  single interaction on the factory floor — no app switching or manual forwarding.
- **Audit trail**: The channel message provides a timestamped record of who flagged what
  and who was assigned, visible to the entire team.

### Harder

- **Admin consent expansion**: `ChannelMessage.Send` requires admin approval. This is one
  more scope in the existing consent flow but may raise questions from cautious IT admins.
  Mitigation: document that messages are always user-attributed (delegated, not app-only).
- **OBO scope flexibility**: The token exchange function becomes slightly more complex with
  scope allowlisting, but this is a one-time infrastructure change.
- **ADR-015 evolution**: The "no assignees" constraint is relaxed for Team plan. This is
  a conscious design choice — assignment here is lightweight (name + UPN), not a PM system.

---

## Related Decisions

- [ADR-015: Investigation Board](adr-015-investigation-board.md) — Findings system (extended
  here with assignee)
- [ADR-016: Teams Integration](adr-016-teams-integration.md) — Teams SDK foundation, mobile
  layout, sharing (extended here with channel @mention)
- [ADR-007: Azure Marketplace Distribution](adr-007-azure-marketplace-distribution.md) —
  Standard vs Team plan gating

---

## Implementation Phases

| Phase | Scope                                                             | Size   |
| ----- | ----------------------------------------------------------------- | ------ |
| 1     | Bug fix: note text flows through MobileChartCarousel              | Small  |
| 2     | FindingAssignee data model + useFindings update                   | Small  |
| 3     | People Picker + graphPeople service (People.Read)                 | Medium |
| 4     | Post-pin "Assign & Share" flow in MobileCategorySheet             | Medium |
| 5     | Channel @mention via Graph (ChannelMessage.Send) + OBO scope flex | Medium |
