import type { IPCauseRow, IPReportOverviewSection } from '@variscout/core';

export interface IPOverviewReportProps {
  sections: readonly IPReportOverviewSection[];
  causeRows: readonly IPCauseRow[];
}

export function IPOverviewReport({ sections, causeRows }: IPOverviewReportProps) {
  return (
    <div className="space-y-6" data-testid="ip-overview-report">
      {sections.map(section => (
        <section
          key={section.title}
          className="rounded-lg border border-edge bg-surface p-4"
          data-report-section
        >
          <h2 className="text-lg font-semibold text-content">{section.title}</h2>
          {section.items.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {section.items.map((item, index) => (
                <li key={`${section.title}-${index}`} className="text-sm text-content-secondary">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-content-tertiary">No report details yet.</p>
          )}
          {section.title === 'What we found + what we did' && causeRows.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {causeRows.map(row => (
                <article
                  key={row.hypothesisId}
                  className="rounded-md border border-edge bg-surface-secondary p-3"
                >
                  <h3 className="text-sm font-semibold text-content">{row.title}</h3>
                  <p className="mt-1 text-sm text-content-secondary">{row.synthesis}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-content-tertiary">
                    <span>{row.selectedIdea ?? 'No selected idea yet'}</span>
                    <span>{row.actionProgressLabel}</span>
                    <span>{row.verificationLabel}</span>
                    <span>{row.miniChartType}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
