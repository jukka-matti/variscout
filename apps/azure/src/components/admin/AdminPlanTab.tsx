import React from 'react';
import { Check, Lock, ExternalLink } from 'lucide-react';
import { getPlan, type MarketplacePlan } from '@variscout/core';

interface PlanCard {
  id: MarketplacePlan;
  name: string;
  price: string;
  description: string;
}

const PLANS: PlanCard[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: '€99/mo',
    description: 'Full analysis, local file storage',
  },
  {
    id: 'team',
    name: 'Team',
    price: '€199/mo',
    description: 'Teams, OneDrive, SharePoint, mobile',
  },
  {
    id: 'team-ai',
    name: 'Team AI',
    price: '€279/mo',
    description: 'AI Knowledge Base, enhanced CoScout',
  },
];

interface FeatureRow {
  name: string;
  standard: boolean;
  team: boolean;
  teamAi: boolean;
}

const FEATURES: FeatureRow[] = [
  { name: 'I-Chart, Boxplot, Pareto, Stats', standard: true, team: true, teamAi: true },
  { name: 'Capability analysis (Cp/Cpk)', standard: true, team: true, teamAi: true },
  { name: 'Performance Mode (multi-channel)', standard: true, team: true, teamAi: true },
  { name: 'ANOVA & factor analysis', standard: true, team: true, teamAi: true },
  { name: 'Findings & investigation workflow', standard: true, team: true, teamAi: true },
  { name: 'What-If simulation', standard: true, team: true, teamAi: true },
  { name: 'CSV/Excel import', standard: true, team: true, teamAi: true },
  { name: 'Report export (PDF)', standard: true, team: true, teamAi: true },
  { name: 'IndexedDB local storage', standard: true, team: true, teamAi: true },
  { name: 'Up to 6 factors', standard: true, team: true, teamAi: true },
  { name: 'Up to 100K rows', standard: true, team: true, teamAi: true },
  { name: 'OneDrive project sync', standard: false, team: true, teamAi: true },
  { name: 'SharePoint file picker', standard: false, team: true, teamAi: true },
  { name: 'Microsoft Teams integration', standard: false, team: true, teamAi: true },
  { name: 'Channel-based collaboration', standard: false, team: true, teamAi: true },
  { name: 'Mobile-optimized UI', standard: false, team: true, teamAi: true },
  { name: 'CoScout AI assistant', standard: false, team: false, teamAi: true },
  { name: 'NarrativeBar insights', standard: false, team: false, teamAi: true },
  { name: 'Chart insight chips', standard: false, team: false, teamAi: true },
  { name: 'Knowledge Base (SharePoint search)', standard: false, team: false, teamAi: true },
  { name: 'AI-suggested actions', standard: false, team: false, teamAi: true },
];

function featureAvailable(row: FeatureRow, plan: MarketplacePlan): boolean {
  if (plan === 'standard') return row.standard;
  if (plan === 'team') return row.team;
  return row.teamAi;
}

export function AdminPlanTab() {
  const currentPlan = getPlan();

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
                <h3 className="text-sm font-semibold text-content">{plan.name}</h3>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-content mb-1">{plan.price}</p>
              <p className="text-xs text-content-secondary">{plan.description}</p>
            </div>
          );
        })}
      </div>

      {/* Feature matrix */}
      <section className="bg-surface-secondary/50 border border-edge rounded-lg overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className="text-left py-3 px-4 text-content font-semibold">Feature</th>
              {PLANS.map(plan => (
                <th
                  key={plan.id}
                  className={`text-center py-3 px-3 font-semibold ${
                    plan.id === currentPlan ? 'text-blue-400' : 'text-content-secondary'
                  }`}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {FEATURES.map(row => (
              <tr key={row.name}>
                <td className="py-2.5 px-4 text-content text-xs">{row.name}</td>
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
          Manage Subscription in Azure
        </a>
      </div>
    </div>
  );
}
