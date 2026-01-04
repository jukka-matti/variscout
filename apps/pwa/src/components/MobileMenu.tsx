import React, { useEffect, useRef } from 'react';
import {
  FolderOpen,
  FileDown,
  FileSpreadsheet,
  Image,
  Maximize2,
  Minimize2,
  Settings,
  Plus,
  X,
  Table,
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjects: () => void;
  onDownloadFile: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  onToggleLargeMode: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenDataTable: () => void;
  isLargeMode: boolean;
}

/**
 * Mobile menu with grouped sections matching desktop dropdowns
 */
const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onOpenProjects,
  onDownloadFile,
  onExportCSV,
  onExportImage,
  onToggleLargeMode,
  onOpenSettings,
  onReset,
  onOpenDataTable,
  isLargeMode,
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
                    : 'text-slate-300 hover:bg-slate-700/50 active:bg-slate-700'
                }
                transition-colors`}
      style={{ minHeight: 48 }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
        className="fixed right-2 top-14 w-64 max-h-[80vh] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-y-auto z-50 sm:hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded touch-feedback"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-2">
          {/* Export Section */}
          <SectionHeader title="Export" />
          <MenuItem
            icon={<FileDown size={18} />}
            label="Download Project (.vrs)"
            onClick={onDownloadFile}
          />
          <MenuItem
            icon={<FileSpreadsheet size={18} />}
            label="Export as CSV"
            onClick={onExportCSV}
          />
          <MenuItem icon={<Image size={18} />} label="Export as Image" onClick={onExportImage} />

          <div className="h-px bg-slate-700 my-2" />

          {/* View Section */}
          <SectionHeader title="View" />
          <MenuItem icon={<Table size={18} />} label="Data Table" onClick={onOpenDataTable} />
          <MenuItem
            icon={isLargeMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            label={isLargeMode ? 'Exit Large Mode' : 'Large Mode'}
            onClick={onToggleLargeMode}
          />

          <div className="h-px bg-slate-700 my-2" />

          {/* Project Section */}
          <SectionHeader title="Project" />
          <MenuItem icon={<FolderOpen size={18} />} label="Open Project" onClick={onOpenProjects} />
          <MenuItem icon={<Plus size={18} />} label="New Analysis" onClick={onReset} />

          <div className="h-px bg-slate-700 my-2" />

          {/* Settings */}
          <MenuItem icon={<Settings size={18} />} label="Settings" onClick={onOpenSettings} />
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
