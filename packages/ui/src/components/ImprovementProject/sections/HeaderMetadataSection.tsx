import React from 'react';
import type { ImprovementProjectMetadata } from '@variscout/core/improvementProject';

type FinancialImpact = NonNullable<ImprovementProjectMetadata['financialImpact']>;

export interface HeaderMetadataSectionProps {
  title: string;
  onTitleChange?: (title: string) => void;
  businessCase?: string;
  onBusinessCaseChange?: (value: string) => void;
  financialImpact?: ImprovementProjectMetadata['financialImpact'];
  onFinancialImpactChange?: (value: FinancialImpact) => void;
  projectId?: string;
  projectOptions?: Array<{ id: string; name: string }>;
  onProjectIdChange?: (id: string | undefined) => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SEK', 'NOK', 'DKK'];
const DEFAULT_CURRENCY = 'USD';

const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

const labelClassName = 'text-sm font-medium text-content';

export const HeaderMetadataSection: React.FC<HeaderMetadataSectionProps> = ({
  title,
  onTitleChange,
  businessCase = '',
  onBusinessCaseChange,
  financialImpact,
  onFinancialImpactChange,
  projectId,
  projectOptions = [],
  onProjectIdChange,
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
          value={projectId ?? ''}
          onChange={event =>
            onProjectIdChange?.(event.target.value === '' ? undefined : event.target.value)
          }
        >
          <option value="">No linked investigation</option>
          {projectOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
