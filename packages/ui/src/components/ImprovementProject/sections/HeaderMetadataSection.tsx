import React from 'react';
import type { ImprovementProjectMetadata } from '@variscout/core/improvementProject';
import type { ProjectMember, ProjectRole } from '@variscout/core/projectMembership';

type FinancialImpact = NonNullable<ImprovementProjectMetadata['financialImpact']>;

export interface HeaderMetadataSectionProps {
  title: string;
  onTitleChange?: (title: string) => void;
  members?: ProjectMember[];
  onMembersChange?: (members: ProjectMember[]) => void;
  businessCase?: string;
  onBusinessCaseChange?: (value: string) => void;
  financialImpact?: ImprovementProjectMetadata['financialImpact'];
  onFinancialImpactChange?: (value: FinancialImpact) => void;
  investigationId?: string;
  investigationOptions?: Array<{ id: string; name: string }>;
  onInvestigationIdChange?: (id: string | undefined) => void;
}

const MEMBER_ROLES: Array<{ value: ProjectRole; label: string }> = [
  { value: 'lead', label: 'Lead' },
  { value: 'member', label: 'Member' },
  { value: 'sponsor', label: 'Sponsor' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SEK', 'NOK', 'DKK'];
const DEFAULT_CURRENCY = 'USD';

const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

const labelClassName = 'text-sm font-medium text-content';

function updateMember(
  members: ProjectMember[],
  index: number,
  nextMember: ProjectMember
): ProjectMember[] {
  return members.map((m, i) => (i === index ? nextMember : m));
}

function createBlankMember(now: number): ProjectMember {
  return {
    id: `pm-draft-${now}`,
    createdAt: now,
    deletedAt: null,
    userId: '',
    displayName: '',
    role: 'member',
    invitedAt: now,
  };
}

export const HeaderMetadataSection: React.FC<HeaderMetadataSectionProps> = ({
  title,
  onTitleChange,
  members = [],
  onMembersChange,
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
            onClick={() => onMembersChange?.([...members, createBlankMember(Date.now())])}
          >
            Add team member
          </button>
        </div>

        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={member.id}
                className="grid gap-3 rounded-md border border-edge bg-surface-secondary p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                data-testid="metadata-team-row"
              >
                <label className="space-y-1">
                  <span className={labelClassName}>Role</span>
                  <select
                    className={inputClassName}
                    value={member.role}
                    onChange={event =>
                      onMembersChange?.(
                        updateMember(members, index, {
                          ...member,
                          role: event.target.value as ProjectRole,
                        })
                      )
                    }
                  >
                    {MEMBER_ROLES.map(role => (
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
                    value={member.displayName}
                    onChange={event =>
                      onMembersChange?.(
                        updateMember(members, index, {
                          ...member,
                          displayName: event.target.value,
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
                      onMembersChange?.(members.filter((_, memberIndex) => memberIndex !== index))
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
