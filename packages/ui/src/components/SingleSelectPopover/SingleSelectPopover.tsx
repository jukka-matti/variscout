// packages/ui/src/components/SingleSelectPopover/SingleSelectPopover.tsx
import { useEffect } from 'react';
import { Check } from 'lucide-react';

export interface SingleSelectPopoverOption {
  readonly value: string;
  readonly label: string;
}

export interface SingleSelectPopoverNullOption {
  readonly label: string;
  readonly onSelect: () => void;
}

export interface SingleSelectPopoverProps {
  readonly options: ReadonlyArray<SingleSelectPopoverOption>;
  readonly activeValue: string | undefined;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly anchorRect?: DOMRect;
  readonly title?: string;
  readonly nullOption?: SingleSelectPopoverNullOption;
}

export function SingleSelectPopover({
  options,
  activeValue,
  onSelect,
  onClose,
  anchorRect,
  title,
  nullOption,
}: SingleSelectPopoverProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const top = anchorRect ? anchorRect.bottom + 4 : 80;
  const left = anchorRect ? anchorRect.left : 16;

  return (
    <>
      <div data-testid="single-select-backdrop" onClick={onClose} className="fixed inset-0 z-40" />
      <div
        data-testid="single-select-popover"
        role="listbox"
        style={{ top, left }}
        className="fixed z-50 min-w-[12rem] rounded-md border border-edge bg-surface-secondary py-1 shadow-lg"
      >
        {title && (
          <div className="px-3 py-1 text-xs text-content-muted uppercase tracking-wide">
            {title}
          </div>
        )}
        {nullOption && (
          <button
            type="button"
            data-testid="single-select-null-option"
            onClick={() => nullOption.onSelect()}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-content-secondary hover:bg-surface-tertiary/50"
          >
            <span className="inline-block w-4" />
            {nullOption.label}
          </button>
        )}
        {options.map(opt => {
          const isActive = opt.value === activeValue;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isActive}
              data-testid={`single-select-option-${opt.value}`}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onSelect(opt.value)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-content hover:bg-surface-tertiary/50"
            >
              <span className="inline-block w-4">
                {isActive && <Check size={14} className="text-content-secondary" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
