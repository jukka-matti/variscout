import React, { useId, useState } from 'react';

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}) => {
  const generatedId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const headerId = `improvement-section-header-${generatedId}`;
  const panelId = `improvement-section-panel-${generatedId}`;

  const handleToggle = () => {
    const nextOpen = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <section className="rounded-lg border border-edge bg-surface">
      <button
        id={headerId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span>{title}</span>
        <span aria-hidden="true" className="text-content/60">
          {isOpen ? '-' : '+'}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-t border-edge px-4 py-4 text-sm text-content"
        >
          {children}
        </div>
      )}
    </section>
  );
};
