# Sharing & Continuity UX — P0 + P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified Share dropdown to the Editor toolbar with toast feedback for all share actions, and improve deep link error messages for recipients.

**Architecture:** Extract the toast notification system from the storage layer into a standalone `ToastContext` so both sync and share notifications flow through one system. Add a `ShareDropdown` component to `EditorToolbar` that generates deep links and shares via Teams SDK. Extend `classifySyncError()` to distinguish 401/403/plan-mismatch for better recipient error UX.

**Tech Stack:** React 18, TypeScript, lucide-react, @microsoft/teams-js, Vitest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-22-sharing-continuity-design.md`

---

## File Structure

### New Files

| File                                                         | Responsibility                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `apps/azure/src/context/ToastContext.tsx`                    | `ToastProvider` + `useToast` hook — app-wide toast notification state     |
| `apps/azure/src/context/__tests__/ToastContext.test.tsx`     | Tests for toast add/dismiss/auto-clear lifecycle                          |
| `apps/azure/src/components/ShareDropdown.tsx`                | Share dropdown menu component (Copy link, Share in Teams, Publish report) |
| `apps/azure/src/components/__tests__/ShareDropdown.test.tsx` | Tests for conditional menu items based on context                         |
| `apps/azure/src/services/__tests__/deepLinks.share.test.ts`  | Tests for new `buildCurrentViewLink()` utility                            |

### Modified Files

| File                                          | Changes                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/azure/src/services/deepLinks.ts`        | Add `buildCurrentViewLink()` helper                                                             |
| `apps/azure/src/components/SyncToast.tsx`     | No changes needed — remains a pure render component                                             |
| `apps/azure/src/App.tsx`                      | Wrap with `ToastProvider`, update `SyncToasts` to bridge storage→toast                          |
| `apps/azure/src/components/EditorToolbar.tsx` | Add Share button + dropdown (desktop), share items in overflow menu (phone)                     |
| `apps/azure/src/pages/Editor.tsx`             | Wire share handlers, pass toast to share hooks                                                  |
| `apps/azure/src/services/storage.ts`          | Extend `SyncErrorCategory` with `'forbidden'` + `'plan-mismatch'`; update `classifySyncError()` |
| `apps/azure/src/hooks/useTeamsShare.ts`       | Add `onToast` callback option                                                                   |
| `apps/azure/src/hooks/useShareFinding.ts`     | Add `onToast` callback option                                                                   |

---

## Task 1: ToastContext — Provider + Hook

**Files:**

- Create: `apps/azure/src/context/ToastContext.tsx`
- Create: `apps/azure/src/context/__tests__/ToastContext.test.tsx`

- [ ] **Step 1: Write failing tests for ToastContext**

```typescript
// apps/azure/src/context/__tests__/ToastContext.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../ToastContext';
import type { SyncNotification } from '../../services/storage';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastContext', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current.notifications).toEqual([]);
  });

  it('showToast adds a notification', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast({ type: 'success', message: 'Link copied' });
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Link copied');
    expect(result.current.notifications[0].id).toBeTruthy();
  });

  it('dismissToast removes a notification', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast({ type: 'info', message: 'Test' });
    });
    const id = result.current.notifications[0].id;
    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.notifications).toHaveLength(0);
  });

  it('auto-dismisses after dismissAfter ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast({ type: 'success', message: 'Auto', dismissAfter: 3000 });
    });
    expect(result.current.notifications).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.notifications).toHaveLength(0);
    vi.useRealTimers();
  });

  it('caps at 5 notifications', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.showToast({ type: 'info', message: `Msg ${i}` });
      }
    });
    expect(result.current.notifications.length).toBeLessThanOrEqual(5);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/context/__tests__/ToastContext.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ToastContext**

```typescript
// apps/azure/src/context/ToastContext.tsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { SyncNotification } from '../services/storage';

interface ToastContextValue {
  notifications: SyncNotification[];
  /** Add a toast. If `id` is provided (e.g. bridged from storage), it's preserved. */
  showToast: (notif: Omit<SyncNotification, 'id'> & { id?: string }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((notif: Omit<SyncNotification, 'id'> & { id?: string }) => {
    const id = notif.id || `toast-${++toastCounter}`;
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }]); // max 5

    if (notif.dismissAfter) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        timersRef.current.delete(id);
      }, notif.dismissAfter);
      timersRef.current.set(id, timer);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ notifications, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/context/__tests__/ToastContext.test.tsx`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/context/ToastContext.tsx apps/azure/src/context/__tests__/ToastContext.test.tsx
git commit -m "feat(azure): add ToastContext for app-wide toast notifications"
```

---

## Task 2: Bridge Storage Notifications into ToastContext

**Files:**

- Modify: `apps/azure/src/App.tsx`

- [ ] **Step 1: Read current App.tsx SyncToasts function**

The current `SyncToasts` component at `App.tsx:332-335` reads from `useStorage()` and passes to `SyncToastContainer`. We need to bridge storage notifications into `ToastContext` so the toast container reads from one source.

- [ ] **Step 2: Update App.tsx — wrap with ToastProvider and bridge storage→toast**

In `App.tsx`, add `ToastProvider` wrapping the app. Update `SyncToasts`:

```typescript
// In imports, add:
import { ToastProvider, useToast } from './context/ToastContext';

// Replace the SyncToasts function (lines 332-335) with:
function SyncToasts() {
  const { notifications: storageNotifs, dismissNotification } = useStorage();
  const { notifications: toastNotifs, showToast, dismissToast } = useToast();

  // Bridge: push storage notifications into toast context, preserving original IDs.
  // showToast accepts an optional `id` override — we must use the storage notification's
  // original id so that dismissing works across both systems.
  const prevStorageRef = React.useRef<string[]>([]);
  React.useEffect(() => {
    const prevIds = new Set(prevStorageRef.current);
    for (const notif of storageNotifs) {
      if (!prevIds.has(notif.id)) {
        // Pass the full notification including id — showToast preserves it when provided
        showToast(notif);
      }
    }
    prevStorageRef.current = storageNotifs.map(n => n.id);
  }, [storageNotifs, showToast]);

  // Dismiss in both systems
  const handleDismiss = React.useCallback((id: string) => {
    dismissToast(id);
    dismissNotification(id);
  }, [dismissToast, dismissNotification]);

  return <SyncToastContainer notifications={toastNotifs} onDismiss={handleDismiss} />;
}
```

Wrap the app root with `<ToastProvider>` — add it around the outermost component inside the existing provider tree. Find the return statement of the main `App` component and wrap:

```tsx
return <ToastProvider>{/* existing content */}</ToastProvider>;
```

- [ ] **Step 3: Run existing SyncToast tests to verify no regression**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/components/__tests__/SyncToast.test.tsx`
Expected: All existing tests PASS (SyncToastContainer props interface unchanged)

- [ ] **Step 4: Run full azure test suite to verify no regression**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/App.tsx
git commit -m "feat(azure): bridge storage notifications through ToastContext"
```

---

## Task 3: buildCurrentViewLink — Deep Link for Current View

**Files:**

- Modify: `apps/azure/src/services/deepLinks.ts`
- Create: `apps/azure/src/services/__tests__/deepLinks.share.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/azure/src/services/__tests__/deepLinks.share.test.ts
import { describe, it, expect } from 'vitest';
import { buildCurrentViewLink } from '../deepLinks';

describe('buildCurrentViewLink', () => {
  const base = 'https://variscout.example.com';

  it('builds link with project only', () => {
    const url = buildCurrentViewLink(base, 'Coffee', {});
    expect(url).toBe('https://variscout.example.com/?project=Coffee');
  });

  it('includes chart param when focused', () => {
    const url = buildCurrentViewLink(base, 'Coffee', { focusedChart: 'ichart' });
    expect(url).toContain('chart=ichart');
  });

  it('includes finding param when highlighted', () => {
    const url = buildCurrentViewLink(base, 'Coffee', { findingId: 'f-123' });
    expect(url).toContain('finding=f-123');
  });

  it('includes mode=report when in report view', () => {
    const url = buildCurrentViewLink(base, 'Coffee', { mode: 'report' });
    expect(url).toContain('mode=report');
  });

  it('combines multiple params', () => {
    const url = buildCurrentViewLink(base, 'Coffee', {
      focusedChart: 'boxplot',
      findingId: 'f-456',
    });
    expect(url).toContain('project=Coffee');
    expect(url).toContain('chart=boxplot');
    expect(url).toContain('finding=f-456');
  });

  it('encodes project names with spaces', () => {
    const url = buildCurrentViewLink(base, 'My Project', {});
    expect(url).toContain('project=My+Project');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/services/__tests__/deepLinks.share.test.ts`
Expected: FAIL — function not exported

- [ ] **Step 3: Add buildCurrentViewLink to deepLinks.ts**

Add at the end of `apps/azure/src/services/deepLinks.ts`:

```typescript
/** Build a deep link for the current editor view state */
export function buildCurrentViewLink(
  baseUrl: string,
  project: string,
  state: { focusedChart?: string; findingId?: string; mode?: string }
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('project', project);
  if (state.focusedChart) url.searchParams.set('chart', state.focusedChart);
  if (state.findingId) url.searchParams.set('finding', state.findingId);
  if (state.mode) url.searchParams.set('mode', state.mode);
  return url.toString();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/services/__tests__/deepLinks.share.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Run existing deepLinks tests for regression**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/services/__tests__/deepLinks.test.ts`
Expected: All existing tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/services/deepLinks.ts apps/azure/src/services/__tests__/deepLinks.share.test.ts
git commit -m "feat(azure): add buildCurrentViewLink for share deep links"
```

---

## Task 4: ShareDropdown Component

**Files:**

- Create: `apps/azure/src/components/ShareDropdown.tsx`
- Create: `apps/azure/src/components/__tests__/ShareDropdown.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/azure/src/components/__tests__/ShareDropdown.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ShareDropdown } from '../ShareDropdown';

// Mock clipboard
const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

describe('ShareDropdown', () => {
  const defaultProps = {
    deepLinkUrl: 'https://example.com/?project=Test',
    isInTeams: false,
    showPublishReport: false,
    onShareTeams: vi.fn(),
    onPublishReport: vi.fn(),
    onToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share button', () => {
    render(<ShareDropdown {...defaultProps} />);
    expect(screen.getByTestId('btn-share')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Copy link')).toBeInTheDocument();
  });

  it('hides "Share in Teams" when not in Teams', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.queryByText('Share in Teams')).not.toBeInTheDocument();
  });

  it('shows "Share in Teams" when in Teams', () => {
    render(<ShareDropdown {...defaultProps} isInTeams={true} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Share in Teams')).toBeInTheDocument();
  });

  it('hides "Publish report" when not in report view', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.queryByText('Publish report')).not.toBeInTheDocument();
  });

  it('shows "Publish report" when in report view + team plan', () => {
    render(<ShareDropdown {...defaultProps} showPublishReport={true} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Publish report')).toBeInTheDocument();
  });

  it('copies link to clipboard and shows toast', async () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    fireEvent.click(screen.getByText('Copy link'));
    expect(writeText).toHaveBeenCalledWith('https://example.com/?project=Test');
    // Wait for async clipboard
    await vi.waitFor(() => {
      expect(defaultProps.onToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', message: expect.stringContaining('copied') })
      );
    });
  });

  it('calls onShareTeams when Share in Teams clicked', () => {
    render(<ShareDropdown {...defaultProps} isInTeams={true} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    fireEvent.click(screen.getByText('Share in Teams'));
    expect(defaultProps.onShareTeams).toHaveBeenCalled();
  });

  it('closes dropdown after action', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Copy link'));
    expect(screen.queryByText('Copy link')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/components/__tests__/ShareDropdown.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ShareDropdown**

```typescript
// apps/azure/src/components/ShareDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link, MessageSquare, Upload } from 'lucide-react';
import type { SyncNotification } from '../services/storage';

interface ShareDropdownProps {
  deepLinkUrl: string;
  isInTeams: boolean;
  showPublishReport: boolean;
  onShareTeams: () => void;
  onPublishReport: () => void;
  onToast: (notif: Omit<SyncNotification, 'id'>) => void;
}

export const ShareDropdown: React.FC<ShareDropdownProps> = ({
  deepLinkUrl,
  isInTeams,
  showPublishReport,
  onShareTeams,
  onPublishReport,
  onToast,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleCopyLink = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(deepLinkUrl);
      onToast({ type: 'success', message: 'Link copied to clipboard', dismissAfter: 3000 });
    } catch {
      onToast({ type: 'error', message: "Couldn't copy link. Try again." });
    }
  };

  const handleShareTeams = () => {
    setOpen(false);
    onShareTeams();
  };

  const handlePublishReport = () => {
    setOpen(false);
    onPublishReport();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
        title="Share"
        data-testid="btn-share"
      >
        <Share2 size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:bg-surface-tertiary transition-colors"
          >
            <Link size={15} />
            Copy link
          </button>
          {isInTeams && (
            <button
              onClick={handleShareTeams}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:bg-surface-tertiary transition-colors"
            >
              <MessageSquare size={15} />
              Share in Teams
            </button>
          )}
          {showPublishReport && (
            <button
              onClick={handlePublishReport}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:bg-surface-tertiary transition-colors"
            >
              <Upload size={15} />
              Publish report
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/components/__tests__/ShareDropdown.test.tsx`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/components/ShareDropdown.tsx apps/azure/src/components/__tests__/ShareDropdown.test.tsx
git commit -m "feat(azure): add ShareDropdown component with copy link and Teams share"
```

---

## Task 5: Wire ShareDropdown into EditorToolbar

**Files:**

- Modify: `apps/azure/src/components/EditorToolbar.tsx`
- Modify: `apps/azure/src/pages/Editor.tsx`

- [ ] **Step 1: Add share props to EditorToolbar**

In `EditorToolbar.tsx`, add to the `EditorToolbarProps` interface:

```typescript
/** Share callbacks — when provided, Share button appears in toolbar */
shareState?: {
  deepLinkUrl: string;
  isInTeams: boolean;
  showPublishReport: boolean;
  onShareTeams: () => void;
  onPublishReport: () => void;
  onToast: (notif: Omit<SyncNotification, 'id'>) => void;
};
```

Add imports:

```typescript
import { Share2 } from 'lucide-react'; // already may be unused, but add if needed
import { ShareDropdown } from './ShareDropdown';
import type { SyncNotification } from '../services/storage';
```

Destructure `shareState` from props.

- [ ] **Step 2: Add ShareDropdown to desktop toolbar**

In the desktop toolbar section (`{!isPhone && (` block), add the ShareDropdown between the Presentation button (line ~336) and the Findings toggle (line ~339):

```tsx
{
  /* Share */
}
{
  hasActiveData && shareState && <ShareDropdown {...shareState} />;
}
```

- [ ] **Step 3: Add share items to phone overflow menu**

In the overflow menu (the `{overflowOpen && (` block around line 426), add after the Presentation button item and before the Findings toggle item:

```tsx
{
  /* Share */
}
{
  shareState && (
    <>
      <div className="border-t border-edge my-1" />
      <button
        onClick={() => {
          setOverflowOpen(false);
          navigator.clipboard.writeText(shareState.deepLinkUrl).then(
            () =>
              shareState.onToast({
                type: 'success',
                message: 'Link copied to clipboard',
                dismissAfter: 3000,
              }),
            () => shareState.onToast({ type: 'error', message: "Couldn't copy link. Try again." })
          );
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
      >
        <Share2 size={16} />
        Copy link
      </button>
      {shareState.isInTeams && (
        <button
          onClick={() => {
            setOverflowOpen(false);
            shareState.onShareTeams();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-sm text-content hover:bg-surface-tertiary transition-colors"
        >
          <MessageSquare size={16} />
          Share in Teams
        </button>
      )}
    </>
  );
}
```

Add `MessageSquare` to the lucide-react import.

- [ ] **Step 4: Wire share handlers in Editor.tsx**

In `Editor.tsx`, add the share state wiring. The key dependencies are:

- `useToast()` from `../context/ToastContext` — for `showToast`
- `useTeamsShare()` — existing hook for Teams share
- `buildCurrentViewLink()` from `../services/deepLinks` — for deep link URL
- `isInTeams()` from `../teams` — for Teams detection
- `hasTeamFeatures()` — for publish report visibility

Build the `shareState` object in the Editor component:

```typescript
import { buildCurrentViewLink } from '../services/deepLinks';
import { useToast } from '../context/ToastContext';

// Inside Editor component:
const { showToast } = useToast();

const deepLinkUrl = useMemo(() => {
  if (!projectName) return '';
  const baseUrl = window.location.origin + window.location.pathname;
  return buildCurrentViewLink(baseUrl, projectName, {
    focusedChart: viewState?.focusedChart ?? undefined,
    findingId: highlightedFindingId ?? undefined,
    mode: currentViewMode === 'report' ? 'report' : undefined,
  });
}, [projectName, viewState?.focusedChart, highlightedFindingId, currentViewMode]);

const handleShareTeams = useCallback(() => {
  const payload = buildReportSharePayload(
    processDescription || projectName,
    projectName,
    window.location.origin + window.location.pathname,
    outcome ? stats?.cpk : undefined
  );
  share(payload).then(success => {
    if (success) {
      showToast({ type: 'success', message: 'Shared in Teams', dismissAfter: 3000 });
    } else {
      showToast({ type: 'info', message: 'Link copied to clipboard', dismissAfter: 3000 });
    }
  });
}, [share, projectName, processDescription, outcome, stats?.cpk, showToast]);

// Pass to EditorToolbar:
const shareState = useMemo(
  () => ({
    deepLinkUrl,
    isInTeams: isTeams,
    showPublishReport: currentViewMode === 'report' && hasTeamFeatures(),
    onShareTeams: handleShareTeams,
    onPublishReport: () => {
      /* P3 — wired later */
    },
    onToast: showToast,
  }),
  [deepLinkUrl, isTeams, currentViewMode, handleShareTeams, showToast]
);
```

Pass `shareState` to `<EditorToolbar shareState={shareState} ... />`.

Note: Find the exact variable names for `currentViewMode`, `highlightedFindingId`, `viewState`, `processDescription`, `stats`, `isTeams` by reading the existing Editor.tsx code. The names above are approximate — match to the actual variables used.

- [ ] **Step 5: Run full azure test suite**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/components/EditorToolbar.tsx apps/azure/src/pages/Editor.tsx
git commit -m "feat(azure): wire ShareDropdown into EditorToolbar with deep link + Teams share"
```

---

## Task 6: Add Toast to Existing Share Hooks

**Files:**

- Modify: `apps/azure/src/hooks/useTeamsShare.ts`
- Modify: `apps/azure/src/hooks/useShareFinding.ts`

- [ ] **Step 1: Add onToast option to useTeamsShare**

The hook currently returns `{ share, setDeepLink, isTeams }`. Add an optional `onToast` parameter to the hook:

```typescript
interface UseTeamsShareOptions {
  onToast?: (notif: Omit<SyncNotification, 'id'>) => void;
}

export function useTeamsShare(options?: UseTeamsShareOptions) {
  // ... existing code ...
  // After successful share in the share callback:
  // options?.onToast?.({ type: 'success', message: 'Shared in Teams', dismissAfter: 3000 });
}
```

Keep the existing return values unchanged. The toast is additive — callers that don't pass `onToast` get no change.

- [ ] **Step 2: Add onToast option to useShareFinding**

Similarly, add `onToast` to the existing options interface in `useShareFinding.ts`. After successful share/mention:

```typescript
options.onToast?.({ type: 'success', message: 'Finding shared to channel', dismissAfter: 3000 });
```

After failure:

```typescript
options.onToast?.({ type: 'error', message: "Couldn't share. Try again." });
```

- [ ] **Step 3: Run existing share hook tests**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/hooks/__tests__/useTeamsShare.test.ts apps/azure/src/hooks/__tests__/useShareFinding.test.ts`
Expected: All existing tests PASS (onToast is optional, no breaking changes)

- [ ] **Step 4: Update Editor.tsx to pass onToast to share hooks**

In Editor.tsx, pass `showToast` to the hook options:

```typescript
const { share, setDeepLink } = useTeamsShare({ onToast: showToast });
const { shareFinding, canMentionInChannel } = useShareFinding({
  projectName,
  baseUrl,
  onToast: showToast,
});
```

- [ ] **Step 5: Run full test suite**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/azure/src/hooks/useTeamsShare.ts apps/azure/src/hooks/useShareFinding.ts apps/azure/src/pages/Editor.tsx
git commit -m "feat(azure): add toast feedback to share hooks"
```

---

## Task 7: Extend Error Classification for Better Recipient Messages

**Files:**

- Modify: `apps/azure/src/services/storage.ts`

- [ ] **Step 1: Write failing tests for new error categories**

Add tests to the existing `storage.test.ts` (or create a focused test file):

```typescript
// In apps/azure/src/services/__tests__/storage.test.ts (or new file classifyError.test.ts)
import { describe, it, expect } from 'vitest';
import { classifySyncError } from '../storage';

describe('classifySyncError — extended categories', () => {
  it('classifies 403 as forbidden (not auth)', () => {
    const error = new Error('403 Forbidden');
    const result = classifySyncError(error);
    expect(result.category).toBe('forbidden');
    expect(result.retryable).toBe(false);
  });

  it('classifies 401 as auth', () => {
    const error = new Error('401 Unauthorized');
    const result = classifySyncError(error);
    expect(result.category).toBe('auth');
  });

  it('keeps 404 as not_found', () => {
    const error = new Error('404 Not Found');
    const result = classifySyncError(error);
    expect(result.category).toBe('not_found');
  });
});
```

- [ ] **Step 2: Run tests to verify 403 fails**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/services/__tests__/storage.test.ts`
Expected: 403 test FAILS (currently classified as 'auth')

- [ ] **Step 3: Update SyncErrorCategory and classifySyncError**

In `storage.ts`, extend the type:

```typescript
export type SyncErrorCategory =
  | 'auth'
  | 'forbidden' // NEW: 403 — no access to resource
  | 'plan-mismatch' // NEW: tried to load team project without team plan
  | 'network'
  | 'throttle'
  | 'server'
  | 'not_found'
  | 'unknown';
```

Update `classifySyncError()` at the 401/403 block (around line 140):

```typescript
// Replace the combined 401/403 check:
if (status === 401 || /unauthorized/i.test(msg)) {
  return { category: 'auth', retryable: false, message: 'Authentication expired' };
}
if (status === 403 || /forbidden/i.test(msg)) {
  return { category: 'forbidden', retryable: false, message: 'Access denied' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @variscout/azure-app test -- --run apps/azure/src/services/__tests__/storage.test.ts`
Expected: All tests PASS including new ones

- [ ] **Step 5: Commit**

```bash
git add apps/azure/src/services/storage.ts apps/azure/src/services/__tests__/storage.test.ts
git commit -m "feat(azure): distinguish 403 forbidden from 401 auth in error classification"
```

---

## Task 8: Map Error Codes to User-Friendly Messages in Editor

**Files:**

- Modify: `apps/azure/src/pages/Editor.tsx`

- [ ] **Step 1: Add error message mapping**

In Editor.tsx, create an error message map and update the error display. Find the current `loadError` state and where it's displayed (around the "Failed to load project" message).

Replace the generic error string with a typed error:

```typescript
type LoadErrorCode = 'not-found' | 'forbidden' | 'plan-mismatch' | 'offline' | 'auth' | 'unknown';

interface LoadError {
  code: LoadErrorCode;
  message: string;
  action?: { label: string; onClick: () => void };
}

const ERROR_MESSAGES: Record<LoadErrorCode, { message: string }> = {
  'not-found': {
    message:
      'Project not found. It may have been deleted or moved. Ask the person who shared this link.',
  },
  forbidden: {
    message:
      "This project is in a Teams channel you don't have access to. Ask a channel member to add you.",
  },
  'plan-mismatch': { message: 'This project requires a Team plan to access. Contact your admin.' },
  offline: {
    message:
      "You're offline and this project isn't cached locally. Connect to the internet to load it.",
  },
  auth: { message: 'Your session has expired.' },
  unknown: { message: 'Failed to load project. Please try again.' },
};
```

Update the `loadProject` catch handler to map `classifySyncError` categories to `LoadErrorCode`:

```typescript
.catch((error) => {
  const classified = classifySyncError(error);
  const code = classified.category === 'not_found' ? 'not-found'
    : classified.category === 'forbidden' ? 'forbidden'
    : classified.category === 'auth' ? 'auth'
    : !navigator.onLine ? 'offline'
    : 'unknown';
  const errorInfo = ERROR_MESSAGES[code];
  setLoadError({
    code,
    message: errorInfo.message,
    action: code === 'auth'
      ? { label: 'Sign in', onClick: () => { window.location.href = '/.auth/login/aad'; } }
      : code !== 'unknown'
        ? { label: 'Go to Dashboard', onClick: onBack }
        : undefined,
  });
})
```

Update the error display JSX to show the action button:

```tsx
{
  loadError && (
    <div className="mx-4 mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
      <p className="text-sm">{loadError.message}</p>
      {loadError.action && (
        <button
          onClick={loadError.action.onClick}
          className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
        >
          {loadError.action.label}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm --filter @variscout/azure-app test -- --run`
Expected: All tests PASS. Note: some Editor tests may need the `loadError` type updated if they mock it.

- [ ] **Step 3: Commit**

```bash
git add apps/azure/src/pages/Editor.tsx
git commit -m "feat(azure): show contextual error messages for failed deep links"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run full test suite across all packages**

Run: `pnpm test -- --run`
Expected: All ~3,000 tests PASS

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: All packages build without errors

- [ ] **Step 3: Commit spec document**

```bash
git add docs/superpowers/specs/2026-03-22-sharing-continuity-design.md docs/superpowers/plans/2026-03-22-sharing-continuity-p0-p1.md
git commit -m "docs: add sharing & continuity UX design spec and implementation plan"
```
