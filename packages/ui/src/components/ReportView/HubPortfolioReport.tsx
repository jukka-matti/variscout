import type { HubPortfolioReport as HubPortfolioReportModel } from '@variscout/core';

export interface HubPortfolioReportProps {
  report: HubPortfolioReportModel;
}

export function HubPortfolioReport({ report }: HubPortfolioReportProps) {
  return (
    <div className="space-y-6" data-testid="hub-portfolio-report">
      <section className="rounded-lg border border-edge bg-surface p-4">
        <h2 className="text-lg font-semibold text-content">Hub portfolio</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-content-tertiary">Capability</p>
            <p className="text-sm text-content-secondary">{report.capabilitySummary.label}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-content-tertiary">Cadence health</p>
            <p className="text-sm text-content-secondary">{report.cadenceHealthLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-content-tertiary">Drift signals</p>
            <p className="text-sm text-content-secondary">{report.driftSignalCount}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-edge bg-surface">
        <div className="border-b border-edge px-4 py-3">
          <h3 className="text-sm font-semibold text-content">Improvement Projects</h3>
        </div>
        <div className="divide-y divide-edge">
          {report.rows.length > 0 ? (
            report.rows.map(row => (
              <article key={row.id} className="grid gap-2 px-4 py-3 md:grid-cols-5">
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-content">{row.title}</p>
                  <p className="text-xs text-content-tertiary">{row.dayCounter} days open</p>
                </div>
                <p className="text-sm text-content-secondary">{row.status}</p>
                <p className="text-sm text-content-secondary">{row.cadenceLabel}</p>
                <p className="text-sm text-content-secondary">{row.driftLabel}</p>
              </article>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-content-tertiary">
              No Improvement Projects in this Hub yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
