import React, { useEffect, useRef } from 'react';
import { SAMPLES } from '@variscout/data';
import type { SampleDataset } from '@variscout/data';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SampleDataPickerProps {
  onSelectSample: (sample: SampleDataset) => void;
  isOpen: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const SampleDataPicker: React.FC<SampleDataPickerProps> = ({ onSelectSample, isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSampleClick = (sample: SampleDataset): void => {
    onSelectSample(sample);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      data-testid="sample-picker-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Select sample dataset"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md mx-4 rounded-xl border border-edge bg-surface-secondary shadow-xl"
        data-testid="sample-picker-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-content">Select a sample dataset</h2>
          <button
            type="button"
            className="text-content-secondary hover:text-content transition-colors"
            onClick={onClose}
            aria-label="Close"
            data-testid="sample-picker-close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sample list */}
        <ul
          className="overflow-y-auto max-h-96 py-2"
          data-testid="sample-picker-list"
          role="listbox"
          aria-label="Sample datasets"
        >
          {SAMPLES.map(sample => (
            <li key={sample.urlKey} role="option" aria-selected="false">
              <button
                type="button"
                className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-surface-primary transition-colors"
                onClick={() => handleSampleClick(sample)}
                data-testid={`sample-picker-item-${sample.urlKey}`}
              >
                <span className="text-sm font-medium text-content">{sample.name}</span>
                <span className="text-xs text-content-secondary line-clamp-2">
                  {sample.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SampleDataPicker;
