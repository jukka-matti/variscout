/**
 * FileBrowseButton — Unified file/folder browsing button.
 *
 * ADR-030: Wraps useFilePicker for SharePoint + local browsing.
 * Shows cloud icon when SharePoint available, folder icon otherwise.
 * Optionally renders a native <input type="file"> as local fallback.
 */

import React, { useRef, useCallback } from 'react';
import { CloudUpload, FolderOpen } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import { useFilePicker, type FilePickerResult, type PickerMode } from '../hooks/useFilePicker';

export interface FileBrowseButtonProps {
  mode: PickerMode;
  filters?: string[];
  onPick: (items: FilePickerResult[]) => void;
  /** Also fire onPick with a local File (from native file input) */
  onLocalFile?: (file: File) => void;
  label?: string;
  localLabel?: string;
  className?: string;
  /** Show a native <input type="file"> as additional local option */
  showLocalFallback?: boolean;
  entryPath?: { web?: string; list?: string; folder?: string };
  size?: 'sm' | 'md';
}

const FileBrowseButton: React.FC<FileBrowseButtonProps> = ({
  mode,
  filters,
  onPick,
  onLocalFile,
  label,
  localLabel,
  className = '',
  showLocalFallback = false,
  entryPath,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const resolvedLocalLabel = localLabel ?? t('file.browseLocal');
  const localInputRef = useRef<HTMLInputElement>(null);

  const { open, isOpen, hasCloudAccess } = useFilePicker({
    mode,
    filters,
    allowLocalBrowse: true,
    entryPath,
    onPick,
  });

  const handleLocalFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onLocalFile) {
        onLocalFile(file);
      }
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [onLocalFile]
  );

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2.5 text-sm gap-2';

  const buttonLabel = label ?? (hasCloudAccess ? t('file.browseSharePoint') : t('file.open'));
  const Icon = hasCloudAccess ? CloudUpload : FolderOpen;

  // Convert filters to accept string for native input
  const accept = filters?.join(',') ?? '';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {hasCloudAccess && (
        <button
          onClick={open}
          disabled={isOpen}
          className={`inline-flex items-center justify-center ${sizeClasses} font-medium rounded-lg transition-colors
            ${
              isOpen
                ? 'bg-blue-600/50 text-white/60 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          <Icon size={size === 'sm' ? 14 : 16} />
          {buttonLabel}
        </button>
      )}

      {/* Local file fallback — always shown for Standard plan, optional for Team */}
      {(showLocalFallback || !hasCloudAccess) && onLocalFile && (
        <>
          <button
            onClick={() => localInputRef.current?.click()}
            className={`inline-flex items-center justify-center ${sizeClasses} font-medium rounded-lg transition-colors
              bg-surface-tertiary text-content hover:bg-surface-tertiary/80`}
          >
            <FolderOpen size={size === 'sm' ? 14 : 16} />
            {resolvedLocalLabel}
          </button>
          <input
            ref={localInputRef}
            type="file"
            accept={accept}
            onChange={handleLocalFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};

export { FileBrowseButton };
export type { FilePickerResult };
