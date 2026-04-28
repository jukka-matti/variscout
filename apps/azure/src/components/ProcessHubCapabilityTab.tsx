/**
 * ProcessHubCapabilityTab — placeholder. Real implementation in T10.
 */
import React from 'react';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';

export interface ProcessHubCapabilityTabProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

export const ProcessHubCapabilityTab: React.FC<ProcessHubCapabilityTabProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-sm text-content-secondary">
      Capability dashboard wiring lands in T10.
    </div>
  );
};

export default ProcessHubCapabilityTab;
