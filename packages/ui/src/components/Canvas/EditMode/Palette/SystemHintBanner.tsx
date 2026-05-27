import React from 'react';

export type SystemHintKind = 'batch' | 'time' | 'parsing';

export interface SystemHintBannerProps {
  kind: SystemHintKind;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  onDismiss?: () => void;
}

const KIND_STYLES: Record<SystemHintKind, { container: string; text: string; icon: string }> = {
  batch: {
    container: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: '💡',
  },
  time: {
    container: 'bg-cyan-50 border-cyan-200',
    text: 'text-cyan-800',
    icon: '💡',
  },
  parsing: {
    container: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: '⚠',
  },
};

export const SystemHintBanner: React.FC<SystemHintBannerProps> = ({
  kind,
  message,
  ctaLabel,
  onCta,
  onDismiss,
}) => {
  const styles = KIND_STYLES[kind];
  return (
    <div
      role="region"
      aria-label="System hint"
      data-testid={`system-hint-banner-${kind}`}
      data-kind={kind}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${styles.container}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {styles.icon}
      </span>
      <p className={`flex-1 text-sm ${styles.text}`}>{message}</p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className={`text-sm font-medium underline-offset-2 hover:underline ${styles.text}`}
          data-testid={`system-hint-banner-${kind}-cta`}
        >
          {ctaLabel}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss hint"
          data-testid={`system-hint-banner-${kind}-dismiss`}
          className={`text-base leading-none ${styles.text} hover:opacity-70`}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SystemHintBanner;
