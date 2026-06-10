import React from 'react';
import { ControlForm, ControlVerificationBand } from '@variscout/ui';
import type { DataRow, ProcessHub, SpecLimits } from '@variscout/core';
import { useControlPanelModel, useSustainmentComparison } from '@variscout/hooks';
import { pwaHubRepository } from '../persistence';

interface ControlPanelProps {
  activeHub?: ProcessHub;
  targetId?: string;
  rawData?: DataRow[];
  timeColumn?: string | null;
  specs?: SpecLimits;
  onBack: () => void;
}

const buttonClassName =
  'rounded-md border border-edge bg-surface px-3 py-2 text-left text-sm font-medium text-content transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring';

const ControlPanel: React.FC<ControlPanelProps> = ({
  activeHub,
  targetId,
  rawData = [],
  timeColumn,
  specs,
  onBack,
}) => {
  const {
    records,
    selectedRecord,
    reviews,
    error,
    heading,
    selectRecord,
    updateSelectedRecord,
    logRecheck,
  } = useControlPanelModel({ activeHub, targetId, repository: pwaHubRepository });
  const comparison = useSustainmentComparison({
    rows: rawData,
    timeColumn,
    specs,
    record: selectedRecord,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-surface-primary p-4 text-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Control</h2>
          <p className="text-sm text-content-secondary">{heading}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Back to FRAME
        </button>
      </div>

      {!activeHub ? (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Create or select a Process Hub before opening sustainment.
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm">
          {error}
        </p>
      ) : records.length > 1 && !selectedRecord ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-content">Choose a sustainment record</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {records.map(record => (
              <button
                key={record.id}
                type="button"
                className={buttonClassName}
                onClick={() => selectRecord(record.id)}
              >
                {record.title}
              </button>
            ))}
          </div>
        </div>
      ) : selectedRecord ? (
        <>
          <ControlVerificationBand
            record={selectedRecord}
            comparison={comparison}
            reviews={reviews}
            rawData={rawData}
            timeColumn={timeColumn}
            specs={specs}
          />
          <ControlForm
            record={selectedRecord}
            reviews={reviews}
            rawData={rawData}
            timeColumn={timeColumn}
            specs={specs}
            comparison={comparison}
            onRecordChange={updateSelectedRecord}
            onLogRecheck={logRecheck}
          />
        </>
      ) : (
        <p className="rounded-md border border-edge bg-surface-secondary p-4 text-sm text-content-secondary">
          Creating sustainment record...
        </p>
      )}
    </div>
  );
};

export default ControlPanel;
