# Mobile UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bottom tab bar navigation for phone users, fix SettingsPanel mobile layout, add Report View mobile actions, and polish 4 components for touch-friendly mobile UX.

**Architecture:** New `MobileTabBar` shared component in `@variscout/ui` replaces the phone overflow menu in both Azure and PWA apps. Phone layout restructured so tab bar controls workspace switching (Analysis/Findings/Improve/More). SettingsPanel gets full-screen overlay on phone (same pattern as FindingsPanel/CoScout). Report View gets mobile-visible action buttons. Four components get CSS polish for phone screens.

**Tech Stack:** TypeScript, React, Tailwind CSS (semantic tokens), `@variscout/ui`, lucide-react icons

**Spec:** `docs/superpowers/specs/2026-03-22-mobile-ux-improvements-design.md`

---

### Task 1: Create MobileTabBar component

**Files:**

- Create: `packages/ui/src/components/MobileTabBar/index.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create the component**

Create `packages/ui/src/components/MobileTabBar/index.tsx`:

```typescript
import React from 'react';
import { BarChart3, Pin, Lightbulb, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

export type MobileTab = 'analysis' | 'findings' | 'improve' | 'more';

export interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  findingsCount?: number;
  showImproveTab?: boolean;
}

const tabs: Array<{ id: MobileTab; icon: React.ElementType; labelKey: string }> = [
  { id: 'analysis', icon: BarChart3, labelKey: 'mobile.tab.analysis' },
  { id: 'findings', icon: Pin, labelKey: 'mobile.tab.findings' },
  { id: 'improve', icon: Lightbulb, labelKey: 'mobile.tab.improve' },
  { id: 'more', icon: MoreHorizontal, labelKey: 'mobile.tab.more' },
];

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  findingsCount = 0,
  showImproveTab = false,
}) => {
  const { t } = useTranslation();

  const visibleTabs = tabs.filter(
    tab => tab.id !== 'improve' || showImproveTab
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-primary border-t border-edge safe-area-bottom"
      data-testid="mobile-tab-bar"
    >
      <div className="flex justify-around items-center h-[50px]">
        {visibleTabs.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-500' : 'text-content-muted'
              }`}
              style={{ minWidth: 44, minHeight: 44 }}
              data-testid={`mobile-tab-${id}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={20} />
                {id === 'findings' && findingsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {findingsCount > 9 ? '9+' : findingsCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 font-medium">
                {t(labelKey, id.charAt(0).toUpperCase() + id.slice(1))}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
```

- [ ] **Step 2: Export from `@variscout/ui`**

In `packages/ui/src/index.ts`, add near other mobile component exports:

```typescript
export { MobileTabBar, type MobileTabBarProps, type MobileTab } from './components/MobileTabBar';
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @variscout/ui build`

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/MobileTabBar/ packages/ui/src/index.ts
git commit -m "feat: add MobileTabBar component for phone navigation

4-tab layout (Analysis|Findings|Improve|More) with badge support,
safe-area-bottom, 44px touch targets. Phone only (<640px).

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 2: Wire MobileTabBar into Azure Editor

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/azure/src/components/EditorToolbar.tsx`

- [ ] **Step 1: Add MobileTabBar state and import to Editor.tsx**

In `apps/azure/src/pages/Editor.tsx`:

- Import `MobileTabBar` and `MobileTab` from `@variscout/ui`
- Add state: `const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('analysis');`

- [ ] **Step 2: Add MobileTabBar render in Editor.tsx**

After the main content area (near the end of the component JSX, before closing `</div>`), add:

```typescript
{/* Mobile Tab Bar — phone only */}
{isPhone && rawData.length > 0 && (
  <MobileTabBar
    activeTab={mobileActiveTab}
    onTabChange={(tab) => {
      setMobileActiveTab(tab);
      if (tab === 'findings') panels.setIsFindingsOpen(true);
      if (tab === 'improve') panels.setIsImprovementOpen(true);
      if (tab === 'analysis') {
        panels.setIsFindingsOpen(false);
        panels.setIsImprovementOpen(false);
      }
      // 'more' handled by a bottom sheet (Task 3)
    }}
    findingsCount={findingsState.findings.length}
    showImproveTab={factors.length > 0}
  />
)}
```

- [ ] **Step 3: Add bottom padding for tab bar**

Where the main content area is rendered, add `pb-[62px]` when on phone (to account for tab bar height + safe area). This prevents the tab bar from overlapping content.

- [ ] **Step 4: Simplify phone toolbar in EditorToolbar.tsx**

In `apps/azure/src/components/EditorToolbar.tsx`:

- Remove the phone overflow menu (lines ~410-527) — this moves to the "More" tab
- Keep only: back button, project name, sync icon, save button on phone
- Add a new prop `showOverflowMenu?: boolean` (default true) and pass `false` from Editor when phone tab bar is active

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @variscout/azure-app test`

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx apps/azure/src/components/EditorToolbar.tsx
git commit -m "feat: integrate MobileTabBar into Azure Editor

Replace phone overflow menu with bottom tab bar. Tabs: Analysis,
Findings, Improve, More. Toolbar simplified on phone.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 3: Create "More" bottom sheet menu

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`

- [ ] **Step 1: Add "More" sheet state and render**

When `mobileActiveTab === 'more'`, render a bottom sheet with the menu items that were in the overflow menu. Follow the MobileCategorySheet pattern (backdrop + slide-up + 44px touch targets).

Create inline or extract a `MobileMoreSheet` component:

```typescript
{mobileActiveTab === 'more' && isPhone && (
  <>
    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileActiveTab('analysis')} />
    <div className="fixed bottom-[50px] left-0 right-0 bg-surface-primary border-t border-edge rounded-t-2xl z-50 animate-slide-up safe-area-bottom">
      <div className="py-2 max-h-[60vh] overflow-y-auto">
        {/* Menu items: Report, What-If, Settings, Add Data, Edit, CSV, Data Table */}
        <button onClick={() => { onOpenReport(); setMobileActiveTab('analysis'); }}
          className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-content hover:bg-surface-tertiary">
          <FileText size={18} /> Report
        </button>
        {/* ... repeat for each menu item ... */}
      </div>
    </div>
  </>
)}
```

- [ ] **Step 2: Include all items from old overflow menu**

Items: Report, What-If, Settings, Add More Data, Edit Data, Export CSV, Data Table. Use same callbacks as the old EditorToolbar overflow.

- [ ] **Step 3: Verify manually**

Run: `pnpm dev` — open Azure app at 375px, verify More sheet appears.

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx
git commit -m "feat: add More bottom sheet menu for mobile tab bar

Contains Report, What-If, Settings, data operations.
Replaces old toolbar overflow menu on phone.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 4: Wire MobileTabBar into PWA

**Files:**

- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add MobileTabBar to PWA**

Import `MobileTabBar`, add state, render at bottom of component (same pattern as Azure but 3 tabs — no Improve tab):

```typescript
{!panels.isDesktop && rawData.length > 0 && (
  <MobileTabBar
    activeTab={mobileActiveTab}
    onTabChange={(tab) => {
      setMobileActiveTab(tab);
      if (tab === 'findings') panels.setIsFindingsPanelOpen(true);
      if (tab === 'analysis') panels.setIsFindingsPanelOpen(false);
      // 'more' opens bottom sheet
    }}
    findingsCount={findingsState.findings.length}
    showImproveTab={false}
  />
)}
```

- [ ] **Step 2: Add PWA "More" bottom sheet**

Simpler than Azure — items: What-If, Settings, Export CSV, Data Table, New Analysis.

- [ ] **Step 3: Add bottom padding for tab bar content area**

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @variscout/pwa test`

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat: integrate MobileTabBar into PWA

3-tab layout (Analysis|Findings|More) for phone users.
More sheet contains What-If, Settings, Export, Data Table.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 5: SettingsPanel full-screen overlay on phone

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add phone overlay for Settings in Azure Editor**

Find where SettingsPanelBase is rendered in Editor.tsx. Wrap with phone overlay pattern:

```typescript
{isPhone && panels.isSettingsOpen ? (
  <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
    <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
      <h2 className="text-sm font-semibold text-content">{t('settings.title', 'Settings')}</h2>
      <button onClick={() => panels.setIsSettingsOpen(false)}
        className="p-2 rounded-lg text-content-muted hover:text-content"
        style={{ minWidth: 44, minHeight: 44 }}>
        <X size={20} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto">
      <SettingsPanelBase isOpen={true} onClose={() => panels.setIsSettingsOpen(false)} {...settingsProps} />
    </div>
  </div>
) : (
  <SettingsPanelBase isOpen={panels.isSettingsOpen} onClose={() => panels.setIsSettingsOpen(false)} {...settingsProps} />
)}
```

- [ ] **Step 2: Add same pattern in PWA App.tsx**

Same overlay pattern for PWA settings panel.

- [ ] **Step 3: Run tests**

Run: `pnpm -r test`

- [ ] **Step 4: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx apps/pwa/src/App.tsx
git commit -m "fix: render SettingsPanel as full-screen overlay on phone

Fixes broken 320px panel on 375px phone screens. Same overlay
pattern as FindingsPanel/CoScout.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 6: Report View mobile actions + audience toggle

**Files:**

- Modify: `packages/ui/src/components/ReportView/ReportViewBase.tsx`

- [ ] **Step 1: Add mobile action bar below report header**

In ReportViewBase.tsx, after the header section and before the main content, add a mobile-only action bar:

```typescript
{/* Mobile action bar — visible on phone, hidden on desktop where sidebar has these */}
<div className="lg:hidden border-b border-edge">
  <div className="flex items-center gap-2 px-4 py-2">
    {onPrintReport && (
      <button onClick={onPrintReport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-secondary rounded-lg hover:bg-surface-tertiary" style={{ minHeight: 36 }}>
        <FileText size={14} /> PDF
      </button>
    )}
    {onShare && (
      <button onClick={onShare} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-secondary rounded-lg hover:bg-surface-tertiary" style={{ minHeight: 36 }}>
        <Share2 size={14} /> Share
      </button>
    )}
    {onPublish && (
      <button onClick={onPublish} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-secondary rounded-lg hover:bg-surface-tertiary" style={{ minHeight: 36 }}>
        <Cloud size={14} /> Publish
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 2: Show audience toggle on phone**

Change the audience toggle from `hidden sm:flex` to always visible. Or add a duplicate in the mobile action bar above.

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @variscout/ui build`

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ReportView/ReportViewBase.tsx
git commit -m "feat: add mobile action bar to Report View

Show PDF, Share, Publish buttons on phone where sidebar is hidden.
Show audience toggle on all screen sizes.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 7: Component polish — ImprovementWorkspace + empty states

**Files:**

- Modify: `packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx`

- [ ] **Step 1: Add `truncate` to title**

At line ~160, add `truncate` class to the h2 title.

- [ ] **Step 2: Add safe-area-bottom to sticky summary bar**

At line ~227, add `safe-area-bottom` class to the sticky bar wrapper.

- [ ] **Step 3: Update empty state text**

Replace the single `improve.noIdeas` empty state with contextual messages. Read the component to understand how `hypotheses` are passed, then add condition-based messaging:

- No findings: "Pin findings from the Analysis view, then brainstorm improvement ideas here."
- Hypotheses exist but none supported: "Validate your hypotheses in the Findings view. Supported hypotheses unlock improvement brainstorming."
- Supported hypotheses but no ideas: existing `improve.noIdeas` text

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ImprovementPlan/ImprovementWorkspaceBase.tsx
git commit -m "fix: improve mobile UX for ImprovementWorkspace

Add title truncation, safe-area-bottom on sticky bar, and
contextual empty state messages guiding the user workflow.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 8: Component polish — HypothesisTree, PrioritizationMatrix, WhatIfPage

**Files:**

- Modify: `packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx`
- Modify: `packages/ui/src/components/ImprovementPlan/PrioritizationMatrix.tsx`
- Modify: `packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx`

- [ ] **Step 1: HypothesisTree — reduce phone indentation**

Change node indentation from `ml-4` to `ml-3 sm:ml-4` for phone-friendly layout. Add `min-w-0` to inline form input containers.

- [ ] **Step 2: PrioritizationMatrix — touch targets**

Increase axis selector dropdowns and preset buttons to `min-h-[44px]` for touch compliance.

- [ ] **Step 3: WhatIfPage — header flex-wrap**

Add `flex-wrap` to the header right-side info container so labels wrap gracefully on narrow screens.

- [ ] **Step 4: Run tests**

Run: `pnpm -r test`

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/FindingsLog/HypothesisTreeView.tsx
git add packages/ui/src/components/ImprovementPlan/PrioritizationMatrix.tsx
git add packages/ui/src/components/WhatIfPage/WhatIfPageBase.tsx
git commit -m "fix: mobile polish for HypothesisTree, PrioritizationMatrix, WhatIfPage

Reduce tree indentation on phone, increase touch targets on matrix
controls, add flex-wrap to What-If header labels.

Co-Authored-By: ruflo <ruv@ruv.net>"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm -r test`
Expected: All tests PASS.

- [ ] **Step 2: Build all packages**

Run: `pnpm build`

- [ ] **Step 3: Chrome visual testing at 375px**

Run: `pnpm dev`
Open Chrome at 375px width (iPhone SE):

- [ ] Tab bar visible with 4 tabs (Azure) / 3 tabs (PWA)
- [ ] Tap Analysis → chart carousel
- [ ] Tap Findings → full-screen overlay
- [ ] Tap Improve → workspace with empty state (if no findings)
- [ ] Tap More → bottom sheet with menu items
- [ ] NarrativeBar "Ask CoScout" visible above tab bar (Azure with AI)
- [ ] Settings opens as full-screen overlay (not 320px panel)
- [ ] Report View shows PDF/Share/Publish actions on phone
- [ ] Report audience toggle visible on phone
- [ ] ImprovementWorkspace title doesn't overflow
- [ ] HypothesisTree readable at depth 3
- [ ] PrioritizationMatrix controls have 44px touch targets
