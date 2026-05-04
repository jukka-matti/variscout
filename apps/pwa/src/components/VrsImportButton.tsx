// apps/pwa/src/components/VrsImportButton.tsx
import { useRef, type ChangeEvent } from 'react';
import { vrsImport, type VrsFile } from '@variscout/core';

export interface VrsImportButtonProps {
  onImport: (imported: VrsFile) => void;
}

export function VrsImportButton({ onImport }: VrsImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = vrsImport(text);
      onImport(imported);
    } catch (err) {
      window.alert(`Could not import .vrs: ${(err as Error).message}`);
    } finally {
      e.target.value = ''; // reset so re-uploading the same file fires onChange
    }
  };

  return (
    <label>
      Import .vrs
      <input
        ref={inputRef}
        type="file"
        accept=".vrs,application/json"
        onChange={onChange}
        style={{ display: 'none' }}
        aria-label="import .vrs file"
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        Choose .vrs file
      </button>
    </label>
  );
}
