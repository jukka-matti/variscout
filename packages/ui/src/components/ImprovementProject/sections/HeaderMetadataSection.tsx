import React from 'react';
import type { ImprovementProjectMetadata } from '@variscout/core/improvementProject';

type Team = NonNullable<ImprovementProjectMetadata['team']>;
type TeamMember = Team[number];
type TeamRole = TeamMember['role'];
type FinancialImpact = NonNullable<ImprovementProjectMetadata['financialImpact']>;

export interface HeaderMetadataSectionProps {
  title: string;
  onTitleChange?: (title: string) => void;
  team?: ImprovementProjectMetadata['team'];
  onTeamChange?: (team: Team) => void;
  businessCase?: string;
  onBusinessCaseChange?: (value: string) => void;
  financialImpact?: ImprovementProjectMetadata['financialImpact'];
  onFinancialImpactChange?: (value: FinancialImpact) => void;
  investigationId?: string;
  investigationOptions?: Array<{ id: string; name: string }>;
  onInvestigationIdChange?: (id: string | undefined) => void;
}

// Charter team[] documents the DMAIC governance roles for the project (Champion,
// executive Sponsor, Process Owner, etc.). These are NOT ACL roles — the wedge V1
// project-membership ACL lives in `members[]` with 3 roles (Lead/Member/Sponsor)
// gated via `canAccess()` from `@variscout/core/projectMembership` per ADR-082.
// The two role models legitimately coexist: documentary metadata vs access control.
const TEAM_ROLES: Array<{ value: TeamRole; label: string }> = [
  { value: 'champion', label: 'Champion' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'projectLead', label: 'Project lead' },
  { value: 'teamMember', label: 'Team member' },
  { value: 'processOwner', label: 'Process owner' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SEK', 'NOK', 'DKK'];
const DEFAULT_CURRENCY = 'USD';

const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

const labelClassName = 'text-sm font-medium text-content';

function updateTeamMember(team: Team, index: number, nextMember: TeamMember): Team {
  return team.map((member, memberIndex) => (memberIndex === index ? nextMember : member));
}

export const HeaderMetadataSection: React.FC<HeaderMetadataSectionProps> = ({
  title,
  onTitleChange,
  team = [],
  onTeamChange,
  businessCase = '',
  onBusinessCaseChange,
  financialImpact,
  onFinancialImpactChange,
  investigationId,
  investigationOptions = [],
  onInvestigationIdChange,
}) => {
  const titleErrorId = 'improvement-project-title-error';
  const titleIsBlank = title.trim().length === 0;
  const currency = financialImpact?.currency ?? DEFAULT_CURRENCY;

  const emitFinancialImpact = (partial: Partial<FinancialImpact>) => {
    onFinancialImpactChange?.({
      amount: financialImpact?.amount,
      currency,
      ...partial,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className={labelClassName} htmlFor="improvement-project-title">
          Project title
        </label>
        <input
          id="improvement-project-title"
          className={inputClassName}
          value={title}
          onChange={event => onTitleChange?.(event.target.value)}
          aria-invalid={titleIsBlank}
          aria-describedby={titleIsBlank ? titleErrorId : undefined}
          required
        />
        {titleIsBlank ? (
          <p id={titleErrorId} className="text-sm font-medium text-danger" role="alert">
            Project title is required.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-content">Team</h3>
          <button
            type="button"
            className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent/20"
            onClick={() =>
              onTeamChange?.([...team, { role: 'teamMember', person: { displayName: '' } }])
            }
          >
            Add team member
          </button>
        </div>

        {team.length > 0 ? (
          <div className="space-y-3">
            {team.map((member, index) => (
              <div
                key={`${member.role}-${member.person.displayName}-${index}`}
                className="grid gap-3 rounded-md border border-edge bg-surface-secondary p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                data-testid="metadata-team-row"
              >
                <label className="space-y-1">
                  <span className={labelClassName}>Role</span>
                  <select
                    className={inputClassName}
                    value={member.role}
                    onChange={event =>
                      onTeamChange?.(
                        updateTeamMember(team, index, {
                          ...member,
                          role: event.target.value as TeamRole,
                        })
                      )
                    }
                  >
                    {TEAM_ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className={labelClassName}>Display name</span>
                  <input
                    className={inputClassName}
                    value={member.person.displayName}
                    onChange={event =>
                      onTeamChange?.(
                        updateTeamMember(team, index, {
                          ...member,
                          person: { ...member.person, displayName: event.target.value },
                        })
                      )
                    }
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    onClick={() =>
                      onTeamChange?.(team.filter((_, memberIndex) => memberIndex !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-content/60">No team members added.</p>
        )}
      </div>

      <div className="space-y-2">
        <label className={labelClassName} htmlFor="improvement-project-business-case">
          Business case
        </label>
        <textarea
          id="improvement-project-business-case"
          className={`${inputClassName} min-h-28 resize-y`}
          value={businessCase}
          onChange={event => onBusinessCaseChange?.(event.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="space-y-1">
          <span className={labelClassName}>Financial impact amount</span>
          <input
            className={inputClassName}
            type="number"
            inputMode="decimal"
            value={financialImpact?.amount ?? ''}
            onChange={event => {
              const nextAmount = event.currentTarget.valueAsNumber;

              emitFinancialImpact({
                amount: Number.isFinite(nextAmount) ? nextAmount : undefined,
              });
            }}
          />
        </label>

        <label className="space-y-1">
          <span className={labelClassName}>Financial impact currency</span>
          <select
            className={inputClassName}
            value={currency}
            onChange={event => emitFinancialImpact({ currency: event.target.value })}
          >
            {CURRENCIES.map(currencyOption => (
              <option key={currencyOption} value={currencyOption}>
                {currencyOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1">
        <span className={labelClassName}>Linked investigation</span>
        <select
          className={inputClassName}
          value={investigationId ?? ''}
          onChange={event =>
            onInvestigationIdChange?.(event.target.value === '' ? undefined : event.target.value)
          }
        >
          <option value="">No linked investigation</option>
          {investigationOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
