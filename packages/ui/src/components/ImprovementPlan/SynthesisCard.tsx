import React from 'react';
import { useTranslation } from '@variscout/hooks';

export interface SynthesisCardProps {
  synthesis?: string;
  onSynthesisChange?: (text: string) => void;
  readOnly?: boolean;
  /** Linked finding badges to show */
  linkedFindings?: Array<{ id: string; text: string }>;
}

const MAX_CHARS = 500;

export const SynthesisCard: React.FC<SynthesisCardProps> = ({
  synthesis = '',
  onSynthesisChange,
  readOnly = false,
  linkedFindings,
}) => {
  const { t } = useTranslation();
  const remaining = MAX_CHARS - synthesis.length;

  return (
    <div
      data-testid="synthesis-card"
      className="rounded-lg border border-edge bg-surface-secondary p-4"
    >
      <h3 className="text-sm font-semibold text-content mb-2">{t('synthesis.title')}</h3>

      {readOnly ? (
        <p data-testid="synthesis-text" className="text-sm text-content whitespace-pre-wrap">
          {synthesis || (
            <span className="italic text-content/50">{t('synthesis.placeholder')}</span>
          )}
        </p>
      ) : (
        <div>
          <textarea
            data-testid="synthesis-input"
            className="w-full rounded border border-edge bg-surface p-2 text-sm text-content placeholder:text-content/40 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            maxLength={MAX_CHARS}
            placeholder={t('synthesis.placeholder')}
            value={synthesis}
            onChange={e => onSynthesisChange?.(e.target.value)}
          />
          <div
            data-testid="synthesis-char-count"
            className={`text-xs text-right mt-1 ${
              remaining < 50 ? 'text-amber-500' : 'text-content/50'
            }`}
          >
            {remaining} / {MAX_CHARS}
          </div>
        </div>
      )}

      {linkedFindings && linkedFindings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {linkedFindings.map(f => (
            <span
              key={f.id}
              data-testid={`synthesis-finding-badge-${f.id}`}
              className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs text-content/70 border border-edge"
              title={f.text}
            >
              {f.text.length > 40 ? `${f.text.slice(0, 37)}...` : f.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
