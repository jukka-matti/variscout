// apps/pwa/src/components/VrsImportButton.tsx
import { useRef, type ChangeEvent } from 'react';
import { FileUp } from 'lucide-react';
import {
  parseDocumentSnapshotVrs,
  type DocumentSnapshotVrsFile,
} from '@variscout/stores/document-snapshot-vrs';

export interface VrsImportButtonProps {
  onImport: (imported: DocumentSnapshotVrsFile) => void;
}

export function VrsImportButton({ onImport }: VrsImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = parseDocumentSnapshotVrs(text);
      onImport(imported);
    } catch (err) {
      window.alert(`Could not import .vrs: ${(err as Error).message}`);
    } finally {
      e.target.value = ''; // reset so re-uploading the same file fires onChange
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".vrs,application/json"
        onChange={onChange}
        style={{ display: 'none' }}
        aria-label="import .vrs file"
        data-testid="vrs-import-input"
      />
      <button
        type="button"
        data-testid="vrs-import-button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-content-secondary transition-colors"
      >
        <FileUp size={12} />
        Import .vrs file
      </button>
    </>
  );
}
