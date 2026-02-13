import React, { useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Image,
  Presentation,
  Settings,
  Plus,
  X,
  Table,
  Target,
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onEnterPresentationMode: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenDataTable: () => void;
  onOpenSpecEditor?: () => void;
}

/**
 * Mobile menu with grouped sections matching desktop dropdowns
 */
const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onExportCSV,
  onExportImage,
  onEnterPresentationMode,
  onOpenSettings,
  onReset,
  onOpenDataTable,
  onOpenSpecEditor,
}) => {
  const menuRef = useRef<React.ElementRef<'div'>>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as globalThis.Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const MenuItem = ({
    icon,
    label,
    onClick,
    danger,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm touch-feedback
                ${
                  danger
                    ? 'text-red-400 hover:bg-red-400/10 active:bg-red-400/20'
                    : 'text-content hover:bg-surface-tertiary/50 active:bg-surface-tertiary'
                }
                transition-colors`}
      style={{ minHeight: 48 }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
      {title}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed right-2 top-14 w-64 max-h-[80vh] bg-surface-secondary border border-edge rounded-xl shadow-2xl overflow-y-auto z-50 sm:hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-1 text-content-secondary hover:text-white rounded touch-feedback"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-2">
          {/* Export Section */}
          <SectionHeader title="Export" />
          <MenuItem
            icon={<FileSpreadsheet size={18} />}
            label="Export as CSV"
            onClick={onExportCSV}
          />
          <MenuItem icon={<Image size={18} />} label="Export as Image" onClick={onExportImage} />

          <div className="h-px bg-surface-tertiary my-2" />

          {/* View Section */}
          <SectionHeader title="View" />
          <MenuItem icon={<Table size={18} />} label="Data Table" onClick={onOpenDataTable} />
          <MenuItem
            icon={<Presentation size={18} />}
            label="Presentation Mode"
            onClick={onEnterPresentationMode}
          />

          <div className="h-px bg-surface-tertiary my-2" />

          {/* Analysis Section */}
          <SectionHeader title="Analysis" />
          {onOpenSpecEditor && (
            <MenuItem
              icon={<Target size={18} />}
              label="Edit Specification Limits"
              onClick={onOpenSpecEditor}
            />
          )}
          <MenuItem icon={<Plus size={18} />} label="New Analysis" onClick={onReset} />

          <div className="h-px bg-surface-tertiary my-2" />

          {/* Settings */}
          <MenuItem icon={<Settings size={18} />} label="Settings" onClick={onOpenSettings} />
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
