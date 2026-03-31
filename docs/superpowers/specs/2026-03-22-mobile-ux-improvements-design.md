---
title: 'Mobile UX Improvements — Design Spec'
---

# Mobile UX Improvements — Design Spec

**Date:** 2026-03-22
**Status:** Design
**Scope:** Bottom tab bar, SettingsPanel mobile, Report View mobile actions, component polish

---

## Problem

VariScout's core mobile analysis flow works well (carousel, drill-down, findings overlays, LTTB, Web Worker all implemented). However:

1. **Navigation** relies on a hidden overflow menu (⋮) — workspace switching requires 2+ taps
2. **CoScout** is not directly accessible from the toolbar on phone — only reachable via chart interaction
3. **SettingsPanel** is broken on phone (320px panel on 375px screen)
4. **Report View** actions (PDF, publish, share, audience toggle) are hidden on phone
5. **Several components** have minor mobile polish issues (touch targets, safe-area, wrapping)

## Solution

### 1. Bottom Tab Bar (`MobileTabBar`)

New shared component in `@variscout/ui`, phone only (<640px).

**Azure App — 4 tabs + NarrativeBar CoScout access:**

```
┌──────────────────────────────────────────────────┐
│  [Chart Carousel / Workspace Content]            │
│                                                  │
├──────────────────────────────────────────────────┤
│  Machine C explains 47%...    [Ask CoScout]      │  ← NarrativeBar (AI only)
├──────────────────────────────────────────────────┤
│  📊 Analysis  │  📌 Findings(3)  │  🔧 Improve  │  ⋯ More  │  ← Tab Bar
└──────────────────────────────────────────────────┘
```

**PWA App — 3 tabs (no AI, no Improve):**

```
┌──────────────────────────────────────────────────┐
│  [Chart Carousel / Workspace Content]            │
│                                                  │
├──────────────────────────────────────────────────┤
│  📊 Analysis     │     📌 Findings     │     ⋯ More     │  ← Tab Bar
└──────────────────────────────────────────────────┘
```

#### Tab Definitions

| Tab      | Icon             | Label    | Action                             | Badge          | Visibility                    |
| -------- | ---------------- | -------- | ---------------------------------- | -------------- | ----------------------------- |
| Analysis | `BarChart3`      | Analysis | Switch to chart carousel (default) | —              | Always                        |
| Findings | `Pin`            | Findings | Open FindingsPanel overlay         | Count when > 0 | Always                        |
| Improve  | `Lightbulb`      | Improve  | Open ImprovementWorkspace          | —              | Azure only, when `hasFactors` |
| More     | `MoreHorizontal` | More     | Open bottom sheet menu             | —              | Always                        |

#### "More" Menu Items

**Azure:**

- Report View
- What-If Simulator
- Settings
- Add More Data (paste/upload/manual)
- Edit Data
- Export CSV
- Data Table

**PWA:**

- What-If Simulator
- Settings
- Export CSV
- Data Table
- New Analysis

#### Tab Visibility Rules

- **Analysis**: always visible (default active tab)
- **Findings**: always visible, red badge with count when `findings.length > 0`
- **Improve**: Azure only, visible when `hasFactors` (matches existing EditorToolbar gating). Shows helpful empty state: "Pin findings from the Analysis view, then brainstorm improvement ideas here."
- **More**: always visible

#### CoScout Access (Azure Only)

CoScout is contextual — accessed via:

1. **NarrativeBar "Ask CoScout" pill button** — always visible above tab bar when AI is available
2. **MobileCategorySheet "Ask CoScout"** — when tapping chart categories

CoScout is NOT a tab (it's a contextual conversation, not a workspace).

#### Replaces

The phone overflow menu (⋮) in EditorToolbar. The toolbar on phone simplifies to: `[← Back] [Project Name] [☁ Sync] [💾 Save]`.

#### Component Design

```typescript
interface MobileTabBarProps {
  activeTab: 'analysis' | 'findings' | 'improve' | 'more';
  onTabChange: (tab: string) => void;
  findingsCount?: number;
  showImproveTab?: boolean; // Azure only, when hasFactors
}
```

- Fixed bottom, above safe area inset
- Height: 50px + safe-area-inset-bottom
- Background: `bg-surface-primary` with top border
- Touch targets: 44px minimum per tab
- Active tab: `text-blue-500` (primary color)
- Inactive: `text-content-muted`
- Badge: red circle with white count text

### 2. SettingsPanel Mobile Overlay

On phone (`isPhone`), render as full-screen overlay instead of 320px right-side panel.

**Pattern:** Same as FindingsPanel/CoScout overlays in `Editor.tsx`:

```typescript
{isPhone && panels.isSettingsOpen ? (
  <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
    <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
      <h2 className="text-sm font-semibold text-content">Settings</h2>
      <button onClick={closeSettings} style={{ minWidth: 44, minHeight: 44 }}>
        <X size={16} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto">
      <SettingsPanelBase /* existing props */ />
    </div>
  </div>
) : (
  /* existing desktop dialog rendering */
)}
```

Accessed from "More" tab menu on phone.

### 3. Report View Mobile Actions

Add mobile-visible action buttons in report header. Currently hidden in sidebar (`hidden lg:flex`).

**Add to report header (visible on phone, hidden on desktop):**

```html
<div className="flex gap-2 lg:hidden px-4 py-2 border-b border-edge">
  <button>📄 PDF</button>
  <button>📤 Share</button>
  <button>☁ Publish</button>
  <!-- Team plan only -->
</div>
```

**Audience toggle:** Render as a separate row below the action buttons on phone, hidden on desktop:

```html
<!-- Mobile action bar: below report header, above content -->
<div className="lg:hidden border-b border-edge">
  <div className="flex gap-2 px-4 py-2">
    <button>📄 PDF</button>
    <button>📤 Share</button>
    <button>☁ Publish</button>
    <!-- Team plan only -->
  </div>
  <div className="flex gap-1 px-4 pb-2">
    <button className="active">Technical</button>
    <button>Summary</button>
  </div>
</div>
```

### 4. OneDrive File Picker Mobile

**Approach:** Deferred to Chrome visual testing phase. This is a separate concern from the tab bar / polish work.

- Test File Picker v8 popup on mobile Chrome during Chrome testing
- If broken: add `isPhone` check in `useFilePicker.ts`, fall back to native `<input type="file">` on phone
- If works: no change needed
- Decision owner: developer during Chrome test phase
- Not in scope for the initial implementation PR

### 5. Component Polish

| Component                | File                                                                      | Fix                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ImprovementWorkspaceBase | `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx` | Add `truncate` to title h2. Add `safe-area-bottom` / `pb-[env(safe-area-inset-bottom)]` to sticky summary bar. Update empty state text to guide user.                                                      |
| HypothesisTreeView       | `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx`           | Phone only (<640px): reduce node indentation from `ml-4` to `sm:ml-3` (Tailwind: `ml-3 sm:ml-4` — smaller on phone, normal on tablet+). Add `min-w-0` to inline form input containers to prevent overflow. |
| PrioritizationMatrix     | `packages/ui/src/components/ImprovementPlan/PrioritizationMatrix.tsx`     | Increase axis selector and preset button touch targets to `min-h-[44px]` on phone.                                                                                                                         |
| WhatIfPageBase           | `packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx`                | Add `flex-wrap` to header right-side info labels for graceful wrapping on narrow screens.                                                                                                                  |

### 6. ImprovementWorkspace Empty State Enhancement

Update empty states based on workspace content:

| State                                   | Condition                                                 | Message                                                                                                 |
| --------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| No findings at all                      | `findings.length === 0`                                   | "Pin findings from the Analysis view, then brainstorm improvement ideas here."                          |
| Findings exist, no supported hypotheses | `hypotheses.length > 0` but none `supported`/`partial`    | "Validate your hypotheses in the Findings view. Supported hypotheses unlock improvement brainstorming." |
| Supported hypotheses, no ideas          | Hypotheses `supported`/`partial` but `ideas.length === 0` | Current `improve.noIdeas` text (existing behavior)                                                      |

### 7. "More" Menu Implementation

The "More" tab opens a **bottom sheet** (not a dropdown or new screen). Uses the existing bottom sheet pattern from MobileCategorySheet:

- Slide-up animation (`animate-slide-up`)
- Backdrop dismiss on tap outside
- Safe-area-inset-bottom
- Menu items with 44px min touch targets
- Same items as current phone overflow menu, reorganized

---

## Platform Availability

| Feature                     | PWA    | Azure Standard   | Azure Team  |
| --------------------------- | ------ | ---------------- | ----------- |
| Bottom tab bar              | 3 tabs | 4 tabs           | 4 tabs      |
| NarrativeBar CoScout access | —      | Yes              | Yes         |
| Improve tab                 | —      | Yes              | Yes         |
| Settings overlay            | Yes    | Yes              | Yes         |
| Report mobile actions       | —      | Yes (no publish) | Yes         |
| File Picker fallback        | —      | —                | Test needed |
| Component polish            | Yes    | Yes              | Yes         |

---

## Notes

- Yamazumi and Performance Mode are Azure-only analysis modes, accessible from the Analysis tab's chart header mode toggle — not separate tabs
- The bottom tab bar only appears on phone (<640px). Tablet and desktop keep the current toolbar layout
- The "More" menu replaces the current phone overflow menu (⋮) — same items, different access point
