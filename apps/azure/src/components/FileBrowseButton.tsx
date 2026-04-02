/**
 * FileBrowseButton — Local file browsing button.
 *
 * SharePoint picker removed per ADR-059. Now wraps a native <input type="file">.
 */

import React, { useRef, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

/** Minimal FilePickerResult for API compatibility (no SharePoint fields) */
export interface FilePickerResult {
  id: string;
  name: string;
  '@sharePoint.endpoint': string;
  parentReference: { driveId: string };
}

export type PickerMode = 'files' | 'folders';

export interface FileBrowseButtonProps {
  mode: PickerMode;
  filters?: string[];
  onPick: (items: FilePickerResult[]) => void;
  /** Fire with a local File (from native file input) */
  onLocalFile?: (file: File) => void;
  label?: string;
  localLabel?: string;
  className?: string;
  showLocalFallback?: boolean;
  entryPath?: { web?: string; list?: string; folder?: string };
  size?: 'sm' | 'md';
}

const FileBrowseButton: React.FC<FileBrowseButtonProps> = ({
  filters,
  onLocalFile,
  label,
  localLabel,
  className = '',
  size = 'md',
}) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? localLabel ?? t('file.open');
  const localInputRef = useRef<HTMLInputElement>(null);

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

  // Convert filters to accept string for native input
  const accept = filters?.join(',') ?? '';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {onLocalFile && (
        <>
          <button
            onClick={() => localInputRef.current?.click()}
            className={`inline-flex items-center justify-center ${sizeClasses} font-medium rounded-lg transition-colors
              bg-blue-600 text-white hover:bg-blue-700`}
          >
            <FolderOpen size={size === 'sm' ? 14 : 16} />
            {resolvedLabel}
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
