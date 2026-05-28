/**
 * NoActiveProjectGuidance — verb-tab empty state when `activeIP == null`.
 *
 * Originally Improve-tab-specific (PR-WV1-2); generalized in E1 T6 to serve
 * the Process tab too. Optional `heading` / `description` / `ctaLabel`
 * overrides let each verb tab supply its own copy while the defaults
 * preserve the Improve consumer's behaviour (no migration needed at
 * `ImproveTabRoot`).
 */

const DEFAULT_HEADING = 'No active project';
const DEFAULT_DESCRIPTION =
  'Improvement work happens inside a chartered project. Pick a project from Home, or create a new one to start tracking actions and ideating with the PDCA workbench.';
const DEFAULT_CTA_LABEL = 'Go to Home';

export interface NoActiveProjectGuidanceProps {
  onGoHome: () => void;
  /** Override the heading. Default "No active project". */
  heading?: string;
  /** Override the body paragraph. Default is Improve-scoped copy. */
  description?: string;
  /** Override the CTA label. Default "Go to Home". */
  ctaLabel?: string;
}

export function NoActiveProjectGuidance({
  onGoHome,
  heading = DEFAULT_HEADING,
  description = DEFAULT_DESCRIPTION,
  ctaLabel = DEFAULT_CTA_LABEL,
}: NoActiveProjectGuidanceProps) {
  return (
    <section role="alert" className="p-8 text-content max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">{heading}</h2>
      <p className="text-content-secondary mb-4">{description}</p>
      <button
        type="button"
        onClick={onGoHome}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        {ctaLabel}
      </button>
    </section>
  );
}
