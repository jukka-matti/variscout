import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { MessageCircleQuestion, Bot, Link } from 'lucide-react';

export interface EdgeContextMenuProps {
  factorA: string;
  factorB: string;
  x: number;
  y: number;
  onAskQuestion: (factorA: string, factorB: string) => void;
  onAskCoScout: (factorA: string, factorB: string) => void;
  onPromoteToCausal: (factorA: string, factorB: string) => void;
  onClose: () => void;
}

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  factorA,
  factorB,
  x,
  y,
  onAskQuestion,
  onAskCoScout,
  onPromoteToCausal,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [clampedPos, setClampedPos] = useState({ left: x, top: y });

  const items = [
    {
      icon: MessageCircleQuestion,
      label: `Ask about ${factorA} \u00d7 ${factorB}`,
      action: () => onAskQuestion(factorA, factorB),
    },
    {
      icon: Bot,
      label: `Ask CoScout about this relationship`,
      action: () => onAskCoScout(factorA, factorB),
    },
    {
      icon: Link,
      label: `Promote to causal link`,
      action: () => onPromoteToCausal(factorA, factorB),
    },
  ];

  // Clamp position to viewport bounds after render
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const clampedLeft = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 8 : x;
    const clampedTop =
      y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 8 : y;
    setClampedPos({ left: clampedLeft, top: clampedTop });
  }, [x, y]);

  // Auto-focus first menu item on mount
  useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    firstItem?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-50 bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[200px]"
        style={{ left: `${clampedPos.left}px`, top: `${clampedPos.top}px` }}
        onKeyDown={handleKeyDown}
      >
        {items.map(item => (
          <button
            key={item.label}
            role="menuitem"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-content hover:bg-surface-secondary transition-colors text-left"
            onClick={() => {
              item.action();
              onClose();
            }}
          >
            <item.icon size={14} className="text-content-secondary" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
