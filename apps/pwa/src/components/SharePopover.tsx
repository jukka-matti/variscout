import React, { useRef, useEffect, useState } from 'react';
import { FileSpreadsheet, Image, X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

const imageIcon = <Image size={16} />;
const fileSpreadsheetIcon = <FileSpreadsheet size={16} />;

interface ShareMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  onClose: () => void;
}

const ShareMenuItem: React.FC<ShareMenuItemProps> = ({
  icon,
  label,
  description,
  onClick,
  onClose,
}) => (
  <button
    onClick={() => {
      onClick();
      onClose();
    }}
    aria-label={label}
    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-surface-tertiary/50 rounded-lg transition-colors group"
  >
    <div className="p-1.5 bg-surface-tertiary rounded-lg text-content-secondary group-hover:text-white group-hover:bg-surface-elevated transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-content group-hover:text-white">{label}</div>
      <div className="text-xs text-content-muted group-hover:text-content-secondary">
        {description}
      </div>
    </div>
  </button>
);

interface SharePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV: () => void;
  onExportImage: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

const SharePopover: React.FC<SharePopoverProps> = ({
  isOpen,
  onClose,
  onExportCSV,
  onExportImage,
  anchorRef,
}) => {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Calculate position based on anchor
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, anchorRef]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        popoverRef.current &&
        target &&
        !popoverRef.current.contains(target) &&
        !anchorRef?.current?.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  // Close on escape
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

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-72 bg-surface-secondary border border-edge rounded-xl shadow-2xl overflow-hidden animate-fade-in"
      style={{
        top: position.top,
        right: position.right,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <h3 className="text-sm font-semibold text-white">{t('nav.export')}</h3>
        <button
          onClick={onClose}
          className="p-1 text-content-secondary hover:text-white rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Options */}
      <div className="p-2">
        <ShareMenuItem
          icon={imageIcon}
          label={t('export.asImage')}
          description={t('export.imageDesc')}
          onClick={onExportImage}
          onClose={onClose}
        />
        <ShareMenuItem
          icon={fileSpreadsheetIcon}
          label={t('export.asCsv')}
          description={t('export.csvDesc')}
          onClick={onExportCSV}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default SharePopover;
