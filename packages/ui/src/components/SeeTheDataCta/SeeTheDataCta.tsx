/**
 * SeeTheDataCta — FRAME b0 primary action.
 *
 * Small primary-action button rendered at the bottom of the FRAME b0 view.
 * Clicking fires the onClick callback; the parent (FrameView, W3-8) wires
 * navigation to the Analysis tab with current Y/X selections applied.
 *
 * Disabled state: caller passes `disabled={true}` when no Y is selected.
 * Optional `disabledHint` shown via `title` attribute (hover tooltip only).
 *
 * Hard rules:
 * - Presentational primitive — props-based, no Zustand access.
 * - i18n via useTranslation hook — no hardcoded English strings.
 * - Semantic Tailwind only (active uses bg-blue-500 like TimelineWindowPicker
 *   active pill; disabled keeps the same color and adds opacity-60 +
 *   cursor-not-allowed).
 * - Single <button>; no nested buttons.
 * - No `aria-description`; aria-label falls back to the i18n label.
 */

import { useTranslation } from '@variscout/hooks';

export interface SeeTheDataCtaProps {
  /** Fired when user clicks. Not called when disabled. */
  onClick: () => void;
  /** Disable state — typically true when no Y is selected. */
  disabled?: boolean;
  /** Optional disabled-state hint shown via title attribute when disabled. */
  disabledHint?: string;
  /** Optional aria-label override; defaults to the i18n label. */
  ariaLabel?: string;
  /** Optional className for layout. */
  className?: string;
}

const baseClass =
  'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-blue-500 text-white transition-colors';
const enabledClass = 'hover:bg-blue-600 cursor-pointer';
const disabledClass = 'opacity-60 cursor-not-allowed';

export function SeeTheDataCta({
  onClick,
  disabled = false,
  disabledHint,
  ariaLabel,
  className,
}: SeeTheDataCtaProps) {
  const { t } = useTranslation();

  const label = t('frame.b0.seeData.cta');
  const computedAriaLabel = ariaLabel ?? label;

  // Only set title when disabled — enabled buttons don't get the tooltip.
  const titleAttr = disabled && disabledHint ? disabledHint : undefined;

  const buttonClass = [baseClass, disabled ? disabledClass : enabledClass, className]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={computedAriaLabel}
      title={titleAttr}
      className={buttonClass}
      data-testid="see-the-data-cta"
      data-disabled={disabled ? 'true' : 'false'}
    >
      {label}
    </button>
  );
}
