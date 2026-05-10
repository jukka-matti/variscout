import React from 'react';
import { BackgroundSnapshot, type BackgroundSnapshotProps } from './BackgroundSnapshot';

export interface BackgroundSectionProps {
  snapshot?: BackgroundSnapshotProps['snapshot'];
  current?: BackgroundSnapshotProps['current'];
  onRefreshFromLive?: BackgroundSnapshotProps['onRefreshFromLive'];
  manualNarrative?: string;
  onManualNarrativeChange?: (value: string) => void;
}

const inputClassName =
  'w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  snapshot,
  current,
  onRefreshFromLive,
  manualNarrative = '',
  onManualNarrativeChange,
}) => {
  return (
    <div className="space-y-4">
      <BackgroundSnapshot
        snapshot={snapshot}
        current={current}
        onRefreshFromLive={onRefreshFromLive}
      />

      <label className="block space-y-2">
        <span className="text-sm font-medium text-content">Manual narrative</span>
        <textarea
          className={`${inputClassName} min-h-32 resize-y`}
          value={manualNarrative}
          onChange={event => onManualNarrativeChange?.(event.target.value)}
        />
      </label>
    </div>
  );
};
