import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  isToggle?: boolean;
  isActive?: boolean;
  isDanger?: boolean;
  dividerBefore?: boolean;
}

interface ToolbarDropdownProps {
  label: string;
  icon: React.ReactNode;
  items: DropdownItem[];
  disabled?: boolean;
}

/**
 * Reusable toolbar dropdown component
 * Used for grouping related actions (Export, View, etc.)
 */
const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
  label,
  icon,
  items,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    if (!item.isToggle) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors
          ${
            isOpen
              ? 'text-white bg-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{ minHeight: 44 }}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.dividerBefore && index > 0 && <div className="h-px bg-slate-700 my-1" />}
              <button
                onClick={() => handleItemClick(item)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                  ${
                    item.isDanger
                      ? 'text-red-400 hover:bg-red-400/10'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                {item.icon && <span className="flex-shrink-0 w-4">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.isToggle && (
                  <span
                    className={`
                    w-8 h-5 rounded-full transition-colors flex items-center
                    ${item.isActive ? 'bg-blue-600 justify-end' : 'bg-slate-600 justify-start'}
                  `}
                  >
                    <span className="w-4 h-4 bg-white rounded-full mx-0.5 shadow" />
                  </span>
                )}
                {item.shortcut && !item.isToggle && (
                  <span className="text-xs text-slate-500 font-mono">{item.shortcut}</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolbarDropdown;
