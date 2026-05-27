import React, { useEffect, useRef } from 'react';
import type { ParsingInterpretation } from '@variscout/core/parser';
import { getMenuItemsForKind } from './columnChipMenuItems';

export interface ColumnChipContextMenuProps {
  columnName: string;
  kind: ParsingInterpretation['kind'];
  anchor: { x: number; y: number };
  onItemSelect: (columnName: string, itemId: string) => void;
  onClose: () => void;
}

export const ColumnChipContextMenu: React.FC<ColumnChipContextMenuProps> = ({
  columnName,
  kind,
  anchor,
  onItemSelect,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const items = getMenuItemsForKind(kind);

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    first?.focus();
  }, []);

  return (
    <>
      <div
        data-testid="column-chip-menu-backdrop"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Actions for ${columnName}`}
        tabIndex={-1}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
        style={{ position: 'fixed', left: anchor.x, top: anchor.y, zIndex: 50 }}
        className="min-w-[14rem] rounded-md border border-edge bg-surface-primary py-1 shadow-md"
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-xs text-content hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none"
            onClick={() => {
              onItemSelect(columnName, item.id);
              onClose();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default ColumnChipContextMenu;
