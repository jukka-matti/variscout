---
title: 'ADR-017: Fluent 2 Design Principle Alignment'
---

# ADR-017: Fluent 2 Design Principle Alignment

**Status**: Accepted

**Date**: 2026-03-02

**Related**: ADR-007 (marketplace distribution), ADR-016 (Teams integration)

---

## Context

VariScout's Azure app is distributed via Azure Marketplace into M365 tenants, integrated with Teams, OneDrive, and Graph API. Users in these environments work daily with Outlook, Teams, SharePoint, and other Microsoft tools that follow Fluent 2 design principles. A tool that _feels_ foreign in this context creates friction — users expect panels, drawers, modals, and dismiss behaviors to work the way they do across the M365 suite.

Microsoft's Marketplace review process evaluates whether apps provide a coherent experience within the M365 ecosystem. While there is no strict requirement to adopt Fluent UI components, apps that follow Fluent interaction patterns (panel taxonomy, dismiss behaviors, responsive conversion) pass review more smoothly and receive fewer user complaints.

VariScout's current implementation already follows many Fluent 2 patterns organically — inline panels for simultaneous content, overlay panels for focused attention, responsive phone conversion, Escape-to-dismiss. However, this alignment is undocumented. Developers adding new panels or drawers have no decision framework and must reverse-engineer existing implementations.

Two questions this ADR answers:

1. Should VariScout formally adopt Fluent 2 design principles?
2. Should VariScout adopt the `@fluentui/react-components` library?

---

## Decision

**Adopt Fluent 2 interaction patterns and panel taxonomy as design principles. Do NOT adopt the Fluent UI component library.**

### What this means

VariScout follows Fluent 2's _interaction model_ — the rules governing when to use inline vs. overlay panels, how dismiss behaviors work, how panels convert on smaller screens, and how z-index layering is structured. Developers consult the [Panels and Drawers](../06-design-system/patterns/panels-and-drawers.md) design system doc when adding new panel types.

Fluent 2 panel taxonomy mapped to VariScout:

| Fluent 2 Concept | VariScout Equivalent            | When to Use                           |
| ---------------- | ------------------------------- | ------------------------------------- |
| `DrawerInline`   | Inline panel (`flex-shrink-0`)  | Simultaneous content (data, findings) |
| `DrawerOverlay`  | Overlay panel (`fixed inset-0`) | Focused attention (settings)          |
| `Dialog`         | Modal (`z-50`)                  | Confirmations, quick forms            |
| `Sheet` (mobile) | Phone full-screen (`z-40`)      | Phone panel conversion                |

Dismiss behaviors follow Fluent 2 conventions:

| Behavior       | Inline | Overlay | Modal |
| -------------- | ------ | ------- | ----- |
| X button       | Yes    | Yes     | Yes   |
| Escape key     | Yes    | Yes     | Yes   |
| Backdrop click | N/A    | Yes     | Yes   |

### What this does NOT mean

- **No Fluent UI library**: We do not add `@fluentui/react-components` as a dependency. VariScout uses Tailwind CSS with semantic tokens. Adding a component library would create a dual styling system, increase bundle size (~200KB), and conflict with our existing design system.
- **No Fluent color tokens**: VariScout has its own semantic color system (`bg-surface`, `text-content`, `border-edge`) documented in the design system. These already provide theme-aware light/dark support.
- **No visual redesign**: Existing components are not restyled to look like Fluent controls. The alignment is behavioral (how panels open, close, layer) not visual (how buttons render).
- **No Fluent typography scale**: VariScout uses its own type scale (Tailwind defaults + chart font scaling).

### Alignment inventory

Current implementations that already follow Fluent 2 principles:

| Fluent 2 Principle              | VariScout Implementation                                             | File Reference                                                   |
| ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Inline drawer for parallel work | DataPanel (data table beside charts)                                 | `apps/azure/src/components/data/DataPanel.tsx`                   |
| Inline drawer for parallel work | FindingsPanel (findings beside charts)                               | `packages/ui/src/components/FindingsPanel/FindingsPanelBase.tsx` |
| Overlay drawer for focus        | SettingsPanel (backdrop + slide-in-right)                            | `packages/ui/src/components/SettingsPanel/SettingsPanelBase.tsx` |
| Full-screen page for workflows  | WhatIfPage (dedicated simulation workspace)                          | `packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx`       |
| Dialog for confirmations        | Standard modal (centered, backdrop blur)                             | `docs/06-design-system/components/foundational-patterns.md`      |
| Sheet for mobile                | Phone FindingsPanel (slide-up full-screen)                           | `apps/azure/src/pages/Editor.tsx:1017`                           |
| Escape-to-dismiss               | All panels and modals                                                | `FindingsPanelBase.tsx:99`, `SettingsPanelBase.tsx:59`           |
| Backdrop click closes overlay   | SettingsPanel backdrop                                               | `SettingsPanelBase.tsx:73`                                       |
| Resizable inline panels         | DataPanel, FindingsPanel (drag divider)                              | `useResizablePanel` from `@variscout/hooks`                      |
| Responsive conversion           | FindingsPanel: inline (desktop) → overlay (phone)                    | `Editor.tsx:1015-1017`                                           |
| Slide-in-right animation        | SettingsPanel (0.25s ease-out)                                       | `packages/ui/src/styles/components.css:94`                       |
| Slide-up animation              | Phone overlays (0.3s ease-out)                                       | `packages/ui/src/styles/components.css:78`                       |
| Z-index layering                | Sticky → nav → phone overlays → modals → overlay panels → skip links | See z-index scale in panels-and-drawers.md                       |

---

## Consequences

### Easier

- **Marketplace review**: Aligned interaction patterns reduce reviewer friction and user complaints about "non-native" behavior
- **Developer guidance**: New panels have a documented decision framework — developers don't guess or copy-paste inconsistently
- **User familiarity**: M365 users encounter expected panel behaviors (Escape, backdrop click, responsive conversion)
- **Audit trail**: This ADR records the deliberate choice to align on principles without library dependency

### Harder

- **Decision overhead**: Developers must consult the panel decision framework before adding new panel types (minor — a 30-second table lookup)
- **Maintenance**: The alignment inventory must be updated when new panel types are added
- **Not enforced by tooling**: Unlike adopting a component library, principle alignment relies on documentation and code review rather than compile-time checks

---

## See Also

- [Panels and Drawers](../06-design-system/patterns/panels-and-drawers.md) — Practical decision framework and implementation reference
- [Foundational Patterns](../06-design-system/components/foundational-patterns.md) — Buttons, forms, cards, modals, z-index scale
- [Fluent 2 Drawer documentation](https://fluent2.microsoft.design/components/web/react/drawer)
