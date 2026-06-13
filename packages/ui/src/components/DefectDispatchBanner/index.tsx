/**
 * DefectDispatchBanner — non-blocking auto-apply correction affordance (ER-5b).
 *
 * Shown when high-confidence defect detection auto-applies the defect mapping
 * without opening the modal gate. The banner:
 *   - Summarises the auto-detection ("⌖ Detected count data — analyzing defect rates")
 *   - Offers [adjust columns ▾] → opens the existing DefectDetectedModal for correction
 *   - Offers [use as standard data] → reverts to standard analysis mode
 *   - Has an explicit dismiss (×) — never auto-dismisses
 *
 * Props-based, store-free (ui *Base convention). All copy via i18n.
 */
import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

export interface DefectDispatchBannerProps {
  /**
   * Fired when the user clicks [adjust columns ▾] — caller opens the existing
   * DefectDetectedModal for mapping correction.
   */
  onAdjust: () => void;
  /**
   * Fired when the user clicks [use as standard data] — caller reverts to
   * standard analysis mode and clears the defect mapping.
   */
  onUseStandard: () => void;
  /** Fired when the user explicitly dismisses the banner with the × button. */
  onDismiss: () => void;
}

/**
 * DefectDispatchBanner — auto-apply confirmation strip with correction affordances.
 *
 * This banner is NEVER an entry gate — it appears AFTER the defect mapping has
 * already been auto-applied on high-confidence detection. It is a post-hoc
 * correction surface, not a blocking confirmation dialog.
 */
export const DefectDispatchBanner: React.FC<DefectDispatchBannerProps> = ({
  onAdjust,
  onUseStandard,
  onDismiss,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="defect-dispatch-banner"
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-md border border-status-info bg-status-info-soft px-3 py-2 text-[12px] text-content"
    >
      {/* Detection summary label */}
      <span className="flex-1 font-medium">{t('defect.dispatch.banner.label')}</span>

      {/* Correction affordances */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          data-testid="defect-dispatch-adjust"
          onClick={onAdjust}
          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-status-info border border-status-info hover:bg-status-info hover:text-white transition-colors"
        >
          {t('defect.dispatch.banner.adjust')}
        </button>
        <button
          type="button"
          data-testid="defect-dispatch-use-standard"
          onClick={onUseStandard}
          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-content-secondary border border-edge hover:bg-surface-secondary transition-colors"
        >
          {t('defect.dispatch.banner.useStandard')}
        </button>
      </div>

      {/* Explicit dismiss — never auto-dismisses */}
      <button
        type="button"
        data-testid="defect-dispatch-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 rounded p-0.5 text-content-muted hover:bg-surface-secondary transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default DefectDispatchBanner;
