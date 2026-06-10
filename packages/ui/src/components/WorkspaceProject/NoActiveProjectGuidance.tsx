/**
 * NoActiveProjectGuidance — verb-tab empty state when `workspaceProject == null`.
 *
 * Originally Improve-tab-specific (PR-WV1-2); generalized in E1 T6 to serve
 * the Process tab too, then relocated under `components/WorkspaceProject/` in E1 T8
 * since the component is now generic to any verb-tab whose `workspaceProject` cascade
 * may be empty. Optional `heading` / `description` / `ctaLabel` overrides let
 * each verb tab supply its own copy while the defaults preserve the Improve
 * consumer's behaviour (no migration needed at `ImproveTabRoot`).
 */

const DEFAULT_HEADING = 'Workspace unavailable';
const DEFAULT_DESCRIPTION =
  'Open or create a Workspace to continue framing, analyzing, improving, and reporting.';
const DEFAULT_CTA_LABEL = 'Go to Home';

export interface NoActiveProjectGuidanceProps {
  onGoHome: () => void;
  /** Override the heading. Default "Workspace unavailable". */
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
