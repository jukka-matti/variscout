---
tier: living
purpose: design
title: 'View: durability UX — first-capture nudge and invite gate'
audience: human
status: active
layer: L2
topic: [wireframes, durability, save, export, invite, first-session]
related:
  - docs/02-journeys/wireframes/index.md
  - docs/superpowers/specs/2026-06-06-first-session-journey-design.md
---

# View: `durability-ux`

FSJ-9 adds two small protections around the first session: a calm durability nudge after the analyst's own first Finding, and a disabled invite explanation until the project is saved and named.

```
Explore / Analyze after first own Finding capture
┌──────────────────────────────────────────────────────────────────────┐
│ Finding saved. Save this investigation so you can come back to it.    │
│ [Save]                                             Dismiss            │  Azure
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Finding saved. Export this investigation so you can come back to it.  │
│ [Export]                                           Dismiss            │  PWA
└──────────────────────────────────────────────────────────────────────┘
```

```
Project / Charter team area before collaboration
┌──────────────────────────────────────────────────────────────────────┐
│ Team                                                        Invite    │
│                                                              disabled │
│ Save and rename this project before inviting others.                 │
│ No members yet — invite your team.                                   │
└──────────────────────────────────────────────────────────────────────┘
```

## Interaction Contract

- The nudge fires only from the user's own capture save path. Imported or restored findings are not a trigger.
- It fires once per session, is dismissible, and is non-modal. It is primary protection; native close protection is only a backstop.
- Azure uses the verb **Save**. PWA uses **Export** because `.vrs` export is the PWA durability path.
- PWA native close protection applies only while an own capture has not yet been exported.
- Invite affordances remain visible but disabled until the Azure project has an explicit save and a non-default title.
- The disabled explanation points at both requirements: save and rename. It does not open the invite modal.
