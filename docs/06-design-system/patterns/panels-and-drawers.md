---
title: 'Panels and Drawers'
---

# Panels and Drawers

Panel patterns for VariScout, aligned with [Fluent 2 design principles](../../07-decisions/adr-017-fluent-design-alignment.md). Covers when to use each type, CSS patterns, responsive behavior, and dismiss conventions.

## Decision Framework

### When to use which panel type

| Type        | Fluent 2 Name   | User Intent                        | Content Relationship     | Example                    |
| ----------- | --------------- | ---------------------------------- | ------------------------ | -------------------------- |
| Inline      | `DrawerInline`  | Work with panel _and_ main content | Simultaneous / reference | DataPanel, FindingsPanel   |
| Overlay     | `DrawerOverlay` | Focused attention on panel         | Interrupting / settings  | SettingsPanel              |
| Full-screen | Page / route    | Dedicated workflow                 | Replaces main content    | WhatIfPage                 |
| Modal       | `Dialog`        | Quick confirmation or form         | Blocking interaction     | Reset confirmation, modals |

### Decision tree

```
Need to show supplementary content?
├── User needs BOTH panel and main content visible?
│   └── YES → Inline panel (flex-shrink-0, resizable divider)
├── User needs FOCUSED attention on panel content?
│   └── YES → Overlay panel (fixed, backdrop, slide-in-right)
├── Content is a full workflow (multiple steps, complex interaction)?
│   └── YES → Full-screen page (route or full-viewport component)
└── Quick confirmation or small form?
    └── YES → Modal dialog (centered, backdrop blur)
```

---

## Panel Type Specifications

### Inline Panel

Sits beside the main content in a flex row. User works with both simultaneously.

**Fluent 2 equivalent**: `DrawerInline`

**CSS pattern**:

```jsx
<div className="flex flex-1 overflow-hidden">
  <main className="flex-1 overflow-hidden">{content}</main>
  {/* Resizable divider */}
  <div
    className="w-1 bg-surface-tertiary hover:bg-blue-500 cursor-col-resize flex-shrink-0"
    onMouseDown={handleMouseDown}
  />
  {/* Panel */}
  <div
    className="flex-shrink-0 bg-surface-secondary border-l border-edge flex flex-col overflow-hidden"
    style={{ width }}
  >
    {panelContent}
  </div>
</div>
```

**Current implementations**:

| Panel             | Width Range | Default | Storage Key                        | File                                                             |
| ----------------- | ----------- | ------- | ---------------------------------- | ---------------------------------------------------------------- |
| DataPanel (PWA)   | 280–600px   | 350px   | `variscout-data-panel-width`       | `apps/pwa/src/components/data/DataPanel.tsx`                     |
| DataPanel (Azure) | 280–600px   | 350px   | `variscout-azure-data-panel-width` | `apps/azure/src/components/data/DataPanel.tsx`                   |
| FindingsPanel     | 320–600px   | 384px   | App-specific via `resizeConfig`    | `packages/ui/src/components/FindingsPanel/FindingsPanelBase.tsx` |

**Width persistence**: All inline panels use `useResizablePanel` from `@variscout/hooks`, which persists width to `localStorage` via the storage key.

**Dismiss**: X button + Escape key. No backdrop (content is always visible alongside).

---

### Overlay Panel

Covers part of the screen with a backdrop. User focuses on panel content.

**Fluent 2 equivalent**: `DrawerOverlay`

**CSS pattern**:

```jsx
<div className="fixed inset-0 z-[60] flex items-start justify-end">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/40" onClick={onClose} />
  {/* Panel */}
  <div
    className="relative w-80 h-full bg-surface border-l border-edge shadow-2xl
                  overflow-y-auto animate-slide-in-right"
  >
    {panelContent}
  </div>
</div>
```

**Current implementations**:

| Panel         | Width | z-index  | Animation      | File                                                             |
| ------------- | ----- | -------- | -------------- | ---------------------------------------------------------------- |
| SettingsPanel | 320px | `z-[60]` | slide-in-right | `packages/ui/src/components/SettingsPanel/SettingsPanelBase.tsx` |

**Dismiss**: X button + Escape key + backdrop click.

---

### Full-Screen Page

Replaces the main content entirely for dedicated workflows.

**Fluent 2 equivalent**: Dedicated page / route

**CSS pattern**:

```jsx
<div className="flex flex-col h-full bg-surface overflow-y-auto">
  {/* Header with back button */}
  <div className="flex items-center gap-3 p-4 border-b border-edge">
    <button onClick={onBack}>
      <ArrowLeft />
    </button>
    <h1>Page Title</h1>
  </div>
  {/* Page content */}
  <div className="flex-1 p-6">{content}</div>
</div>
```

**Current implementations**:

| Page       | Entry Point                                 | File                                                       |
| ---------- | ------------------------------------------- | ---------------------------------------------------------- |
| WhatIfPage | Header button (PWA), toolbar button (Azure) | `packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx` |

**Dismiss**: Back button (ArrowLeft). Escape typically not bound (page-level, not panel).

---

### Modal Dialog

Centered overlay for quick confirmations or compact forms. See [Foundational Patterns § Modals](../components/foundational-patterns.md#4-modals) for full patterns.

**Fluent 2 equivalent**: `Dialog`

**Dismiss**: X button + Escape key + backdrop click.

---

## Responsive Conversion

When the viewport is below the phone breakpoint (< 640px, `useIsMobile(640)`), inline panels convert to full-screen overlays.

| Panel         | Desktop (≥ 640px)             | Phone (< 640px)                        |
| ------------- | ----------------------------- | -------------------------------------- |
| DataPanel     | Inline with resizable divider | Hidden; opens as DataTableModal        |
| FindingsPanel | Inline with resizable divider | Full-screen overlay (`z-40`, slide-up) |
| SettingsPanel | Overlay (`z-[60]`)            | Same (overlay already works on phone)  |

**Phone FindingsPanel pattern** (`Editor.tsx:1015`):

```jsx
{isPhone && panels.isFindingsOpen ? (
  <div className="fixed inset-0 z-40 bg-surface flex flex-col animate-slide-up safe-area-bottom">
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
      <h2 className="text-sm font-semibold text-content">Findings</h2>
      <button onClick={onClose} style={{ minWidth: 44, minHeight: 44 }}>
        <X size={20} />
      </button>
    </div>
    <FindingsPanel ... />
  </div>
) : (
  /* Desktop inline panel */
  <FindingsPanel ... />
)}
```

Touch targets on phone use minimum 44×44px dimensions (`minWidth: 44, minHeight: 44`).

---

## Planned: Symmetric Sidebar Architecture

The panel architecture is evolving toward a symmetric model with two cross-cutting sidebars toggled from the header:

```
┌──────┬──────────────────────┬────────┐
│Stats │  Workspace content   │CoScout │
│/Data │  (Analysis /         │(AI)    │
│(left)│   Investigation /    │(right) │
│      │   Improvement)       │        │
└──────┴──────────────────────┴────────┘
```

| Sidebar        | Side  | Width                 | Tabs                                                            | Toggle      |
| -------------- | ----- | --------------------- | --------------------------------------------------------------- | ----------- |
| **Stats/Data** | Left  | 280-320px             | Stats \| Questions \| Journal \| Docs (overflow: Data, What-If) | Header icon |
| **CoScout**    | Right | 320-600px (resizable) | AI conversation (adapts to active workspace)                    | Header icon |

**Key changes from current architecture:**

- Stats panel moves from grid slot (320px card in bottom-right) to left sidebar
- Data panel merges into Stats as a tab (reduces panel count)
- CoScout becomes a cross-cutting right sidebar (works in any workspace, not just Investigation)
- Both sidebars are independent toggles — any combination can be open simultaneously
- Charts resize to remaining center width
- Mobile: no sidebars — Stats is carousel position, CoScout is full-screen overlay

**Findings panel:** Becomes the center content of the Investigation workspace tab (not a sidebar). Can still be popped out to a separate window.

See [Dashboard Chrome Redesign spec](../../superpowers/specs/2026-03-28-dashboard-chrome-redesign.md) for the full design.

## Z-Index Scale

Extended from the [Foundational Patterns](../components/foundational-patterns.md#backdrop--z-index) z-index table:

| Level              | z-index   | Usage                                | Examples                                   |
| ------------------ | --------- | ------------------------------------ | ------------------------------------------ |
| Sticky headers     | `z-10`    | Table headers, app header            | `DataTableBase` thead, `AppHeader`         |
| Navigation         | `z-30`    | Sticky nav bars                      | Dashboard nav bar                          |
| Phone overlays     | `z-40`    | Full-screen phone panels, backdrops  | Phone FindingsPanel, MobileMenu backdrop   |
| Modals & dropdowns | `z-50`    | Standard modals, popovers, menus     | Confirmation modal, AxisEditor, MobileMenu |
| Overlay panels     | `z-[60]`  | Panels above modals (settings, sync) | SettingsPanel, SyncToast                   |
| Skip links         | `z-[100]` | Accessibility skip-to-content        | Skip link (`sr-only focus:z-[100]`)        |

**Rule**: Overlay panels use `z-[60]` so they appear above any modal that may be open underneath. Phone full-screen overlays use `z-40` because they replace the main content (no modal beneath).

---

## Dismiss Behavior Matrix

| Panel Type  | X Button | Escape | Backdrop Click | Back Button |
| ----------- | -------- | ------ | -------------- | ----------- |
| Inline      | Yes      | Yes    | N/A            | No          |
| Overlay     | Yes      | Yes    | Yes            | No          |
| Full-screen | No       | No     | N/A            | Yes         |
| Modal       | Yes      | Yes    | Yes            | No          |

All dismiss handlers use the same `useEffect` pattern:

```jsx
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);
```

---

## Animation Specifications

| Animation         | Class                    | Duration | Easing   | Direction   | Used By                      |
| ----------------- | ------------------------ | -------- | -------- | ----------- | ---------------------------- |
| Slide from right  | `animate-slide-in-right` | 0.25s    | ease-out | translateX  | SettingsPanel                |
| Slide from bottom | `animate-slide-up`       | 0.3s     | ease-out | translateY  | Phone overlays, mobile menus |
| Fade in           | `animate-fade-in`        | 0.15s    | ease-out | opacity + Y | Popovers, dropdown menus     |

Defined in `packages/ui/src/styles/components.css`.

**Reduced motion**: Use `prefers-reduced-motion: reduce` media query to disable animations. Currently applied to chart highlight animations in `apps/pwa/src/index.css`. Panel animations should respect this preference — when adding new animations, wrap with:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-slide-in-right,
  .animate-slide-up {
    animation: none;
  }
}
```

---

## Adding a New Panel — Checklist

1. **Choose panel type**: Consult the decision tree above
2. **Pick z-index**: Use the z-index scale table
3. **Implement dismiss**: X button + Escape (all types), backdrop click (overlay/modal), back button (full-screen)
4. **Add animation**: `animate-slide-in-right` (side panels), `animate-slide-up` (bottom/phone panels)
5. **Handle responsive**: If inline panel, decide phone behavior (hide, convert to overlay, or convert to modal)
6. **Persist width**: For inline resizable panels, use `useResizablePanel` with a unique storage key
7. **Touch targets**: Ensure 44×44px minimum for phone interactions
8. **Test Escape**: Verify `useEffect` cleanup removes listener on close
9. **Update this doc**: Add the new panel to the relevant implementation table

---

## See Also

- [ADR-017: Fluent 2 Design Alignment](../../07-decisions/adr-017-fluent-design-alignment.md) — Decision to adopt principles without library
- [Foundational Patterns](../components/foundational-patterns.md) — Buttons, forms, cards, modals
- [Layout](layout.md) — Page layout patterns, dashboard grid, responsive breakpoints
- [Interactions](interactions.md) — Inline editing, context menus, drag-and-drop
