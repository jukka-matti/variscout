---
title: 'Modals'
---

# Modals

Modal dialog patterns for PWA.

## Standard Modal

```jsx
{
  isOpen && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Modal Title</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">Content goes here</div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Confirm</button>
        </div>
      </div>
    </div>
  );
}
```

## Confirmation Modal

Compact modal for confirmations:

```jsx
<div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 w-full max-w-sm">
  <h3 className="text-sm font-semibold text-white mb-2">Reset Analysis?</h3>
  <p className="text-xs text-slate-400 mb-4">All data will be cleared. This cannot be undone.</p>
  <div className="flex justify-end gap-2">
    <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
    <button className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg">Reset</button>
  </div>
</div>
```

## Full-Screen Modal

For expanded chart views:

```jsx
<div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-slate-700">
    <div className="flex items-center gap-3">
      <TrendingUp className="text-blue-400" />
      <h2 className="text-lg font-semibold text-white">Chart Title</h2>
    </div>
    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
      <X size={20} />
    </button>
  </div>

  {/* Full chart area */}
  <div className="flex-1 p-4">
    <Chart />
  </div>

  {/* Footer stats */}
  <div className="p-4 border-t border-slate-700 bg-slate-800/50">Stats bar</div>
</div>
```

## Sheet/Drawer (Mobile)

Slide-up panel for mobile:

```jsx
<div className="fixed inset-0 z-50 bg-black/50">
  <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col">
    {/* Drag handle */}
    <div className="flex justify-center py-3">
      <div className="w-10 h-1 bg-slate-600 rounded-full" />
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-4">Content</div>
  </div>
</div>
```

## Modal Sizing

| Size | Max Width           | Usage           |
| ---- | ------------------- | --------------- |
| sm   | `max-w-sm` (384px)  | Confirmations   |
| md   | `max-w-md` (448px)  | Simple forms    |
| lg   | `max-w-lg` (512px)  | Standard modals |
| xl   | `max-w-xl` (576px)  | Complex content |
| 2xl  | `max-w-2xl` (672px) | Data tables     |

## Keyboard Handling

```jsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

## Backdrop

Standard backdrop with blur:

```jsx
className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm';
```

For less prominent modals:

```jsx
className = 'fixed inset-0 z-50 bg-black/40';
```

## Z-Index Scale

| Level   | z-index   | Usage                |
| ------- | --------- | -------------------- |
| Modal   | `z-50`    | Standard modals      |
| Tooltip | `z-[60]`  | Tooltips over modals |
| Toast   | `z-[100]` | Notifications        |
