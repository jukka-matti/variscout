import React from 'react';
import { Check, Lock, ExternalLink } from 'lucide-react';
import { getPlan, type MarketplacePlan } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import type { MessageCatalog } from '@variscout/core';

interface PlanCard {
  id: MarketplacePlan;
  nameKey: keyof MessageCatalog;
  priceKey: keyof MessageCatalog;
  descKey: keyof MessageCatalog;
}

const PLANS: PlanCard[] = [
  {
    id: 'standard',
    nameKey: 'admin.planStandard',
    priceKey: 'admin.planStandardPrice',
    descKey: 'admin.planStandardDesc',
  },
  {
    id: 'team',
    nameKey: 'admin.planTeam',
    priceKey: 'admin.planTeamPrice',
    descKey: 'admin.planTeamDesc',
  },
  {
    id: 'team-ai',
    nameKey: 'admin.planTeamAI',
    priceKey: 'admin.planTeamAIPrice',
    descKey: 'admin.planTeamAIDesc',
  },
];

interface FeatureRow {
  nameKey: keyof MessageCatalog;
  standard: boolean;
  team: boolean;
  teamAi: boolean;
}

const FEATURES: FeatureRow[] = [
  { nameKey: 'feature.charts', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.capability', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.performance', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.anova', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.findingsWorkflow', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.whatIf', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.csvImport', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.reportExport', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.indexedDb', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.maxFactors', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.maxRows', standard: true, team: true, teamAi: true },
  { nameKey: 'feature.onedriveSync', standard: false, team: true, teamAi: true },
  { nameKey: 'feature.sharepointPicker', standard: false, team: true, teamAi: true },
  { nameKey: 'feature.teamsIntegration', standard: false, team: true, teamAi: true },
  { nameKey: 'feature.channelCollab', standard: false, team: true, teamAi: true },
  { nameKey: 'feature.mobileUi', standard: false, team: true, teamAi: true },
  { nameKey: 'feature.coScoutAi', standard: false, team: false, teamAi: true },
  { nameKey: 'feature.narrativeBar', standard: false, team: false, teamAi: true },
  { nameKey: 'feature.chartInsights', standard: false, team: false, teamAi: true },
  { nameKey: 'feature.knowledgeBase', standard: false, team: false, teamAi: true },
  { nameKey: 'feature.aiActions', standard: false, team: false, teamAi: true },
];

function featureAvailable(row: FeatureRow, plan: MarketplacePlan): boolean {
  if (plan === 'standard') return row.standard;
  if (plan === 'team') return row.team;
  return row.teamAi;
}

export function AdminPlanTab() {
  const currentPlan = getPlan();
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-4 ${
                isCurrent ? 'border-blue-500 bg-blue-500/5' : 'border-edge bg-surface-secondary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-content">{t(plan.nameKey)}</h3>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                    {t('admin.currentPlan')}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-content mb-1">{t(plan.priceKey)}</p>
              <p className="text-xs text-content-secondary">{t(plan.descKey)}</p>
            </div>
          );
        })}
      </div>

      {/* Feature matrix */}
      <section className="bg-surface-secondary/50 border border-edge rounded-lg overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className="text-left py-3 px-4 text-content font-semibold">
                {t('admin.feature')}
              </th>
              {PLANS.map(plan => (
                <th
                  key={plan.id}
                  className={`text-center py-3 px-3 font-semibold ${
                    plan.id === currentPlan ? 'text-blue-400' : 'text-content-secondary'
                  }`}
                >
                  {t(plan.nameKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {FEATURES.map(row => (
              <tr key={row.nameKey}>
                <td className="py-2.5 px-4 text-content text-xs">{t(row.nameKey)}</td>
                {PLANS.map(plan => {
                  const available = featureAvailable(row, plan.id);
                  const isCurrentCol = plan.id === currentPlan;
                  return (
                    <td
                      key={plan.id}
                      className={`text-center py-2.5 px-3 ${isCurrentCol ? 'bg-blue-500/5' : ''}`}
                    >
                      {available ? (
                        <Check size={14} className="inline text-green-500" />
                      ) : (
                        <Lock size={12} className="inline text-content-muted" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Manage subscription */}
      <div className="text-center">
        <a
          href="https://portal.azure.com/#view/Microsoft_Azure_Marketplace/ManageSubscriptionsBlade"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          <ExternalLink size={14} />
          {t('admin.manageSubscription')}
        </a>
      </div>
    </div>
  );
}
