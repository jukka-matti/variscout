import React from 'react';
import { MessageCircleQuestion, FileText, Bot, ArrowRight } from 'lucide-react';

export interface NodeContextMenuProps {
  factor: string;
  x: number;
  y: number;
  onAskQuestion: (factor: string) => void;
  onCreateFinding: (factor: string) => void;
  onAskCoScout: (factor: string) => void;
  onDrillDown: (factor: string) => void;
  onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  factor,
  x,
  y,
  onAskQuestion,
  onCreateFinding,
  onAskCoScout,
  onDrillDown,
  onClose,
}) => {
  const items = [
    {
      icon: MessageCircleQuestion,
      label: `Ask about ${factor}`,
      action: () => onAskQuestion(factor),
    },
    {
      icon: FileText,
      label: `Create finding for ${factor}`,
      action: () => onCreateFinding(factor),
    },
    {
      icon: Bot,
      label: `Ask CoScout about ${factor}`,
      action: () => onAskCoScout(factor),
    },
    {
      icon: ArrowRight,
      label: `Drill down to ${factor}`,
      action: () => onDrillDown(factor),
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[200px]"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {items.map(item => (
          <button
            key={item.label}
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
