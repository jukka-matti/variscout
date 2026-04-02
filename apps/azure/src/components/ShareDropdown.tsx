import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link, Upload } from 'lucide-react';
import type { SyncNotification } from '../services/storage';

interface ShareDropdownProps {
  deepLinkUrl: string;
  showPublishReport: boolean;
  onPublishReport: () => void;
  onToast: (notif: Omit<SyncNotification, 'id'>) => void;
}

export const ShareDropdown: React.FC<ShareDropdownProps> = ({
  deepLinkUrl,
  showPublishReport,
  onPublishReport,
  onToast,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleCopyLink = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(deepLinkUrl);
      onToast({ type: 'success', message: 'Link copied to clipboard', dismissAfter: 3000 });
    } catch {
      onToast({ type: 'error', message: "Couldn't copy link. Try again." });
    }
  };

  const handlePublishReport = () => {
    setOpen(false);
    onPublishReport();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-tertiary"
        title="Share"
        data-testid="btn-share"
      >
        <Share2 size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:bg-surface-tertiary transition-colors"
          >
            <Link size={15} />
            Copy link
          </button>
          {showPublishReport && (
            <button
              onClick={handlePublishReport}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-content hover:bg-surface-tertiary transition-colors"
            >
              <Upload size={15} />
              Publish report
            </button>
          )}
        </div>
      )}
    </div>
  );
};
