import React from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';

export interface ContextLinkItem {
  id: string;
  label: string;
  description?: string;
}

export interface MultiLinkPickerProps<TItem extends ContextLinkItem = ContextLinkItem> {
  label: string;
  items: readonly TItem[];
  onNavigate: (item: TItem) => void;
  onClose: () => void;
}

export function MultiLinkPicker<TItem extends ContextLinkItem = ContextLinkItem>({
  label,
  items,
  onNavigate,
  onClose,
}: MultiLinkPickerProps<TItem>) {
  const titleId = React.useId();

  const handleSelect = (item: TItem) => {
    onNavigate(item);
    onClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        data-testid="multi-link-picker-backdrop"
        aria-label={`Dismiss ${label} picker`}
        className="absolute inset-0 h-full w-full bg-black/40"
        onClick={onClose}
      />
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
          fallbackFocus: '[data-testid="multi-link-picker-dialog"]',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          data-testid="multi-link-picker-dialog"
          className="relative w-full max-w-sm rounded-lg border border-edge bg-surface-secondary p-4 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-sm font-semibold text-content">
                {label}
              </h2>
              <p className="mt-1 text-xs text-content-secondary">Choose where to continue.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${label} picker`}
              className="rounded-md p-1 text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content focus:outline-none focus:ring-2 focus:ring-status-info/50"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <ul aria-label={`${label} links`} className="mt-4 space-y-2">
            {items.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  aria-label={item.label}
                  className="flex w-full flex-col rounded-md border border-edge bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-status-info/50"
                >
                  <span className="text-sm font-medium text-content">{item.label}</span>
                  {item.description && (
                    <span className="mt-0.5 text-xs text-content-secondary">
                      {item.description}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </FocusTrap>
    </div>
  );
}
