/**
 * PerformanceSetupPanel - Azure wrapper for PerformanceSetupPanelBase
 *
 * Connects the shared base component to Azure DataContext and tier system.
 * Includes channel limit validation and upgrade prompts.
 */

import React, { useMemo, useCallback } from 'react';
import {
  PerformanceSetupPanelBase,
  performanceSetupPanelDefaultColorScheme,
  type PerformanceSetupPanelTierProps,
} from '@variscout/ui';
import { useTier } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import { detectChannelColumns } from '@variscout/core';

interface PerformanceSetupPanelProps {
  /** 'inline' for PerformanceDashboard, 'modal' for dialog */
  variant?: 'inline' | 'modal';
  /** Initial selection (for modal) */
  initialSelection?: string[];
  /** Initial label (for modal) */
  initialLabel?: string;
  /** Callback when setup is confirmed */
  onEnable?: (columns: string[], label: string) => void;
  /** Callback when cancelled (modal only) */
  onCancel?: () => void;
  /** Callback to navigate to settings */
  onOpenSettings?: () => void;
}

const PerformanceSetupPanel: React.FC<PerformanceSetupPanelProps> = ({
  variant = 'inline',
  initialSelection,
  initialLabel,
  onEnable,
  onCancel,
  onOpenSettings,
}) => {
  const rawData = useProjectStore(s => s.rawData);
  const specs = useProjectStore(s => s.specs);
  const currentMeasureColumns = useProjectStore(s => s.measureColumns);
  const currentMeasureLabel = useProjectStore(s => s.measureLabel);
  const currentCpkTarget = useProjectStore(s => s.cpkTarget);
  const setMeasureColumns = useProjectStore(s => s.setMeasureColumns);
  const setMeasureLabel = useProjectStore(s => s.setMeasureLabel);
  const setAnalysisMode = useProjectStore(s => s.setAnalysisMode);
  const setCpkTarget = useProjectStore(s => s.setCpkTarget);

  // Tier information for channel limit validation
  const { tier, maxChannels, upgradeUrl, validateChannels } = useTier();

  // Detect available numeric columns
  const availableColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    return detectChannelColumns(rawData);
  }, [rawData]);

  const hasData = rawData.length > 0;
  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  // Tier props for base component
  const tierProps: PerformanceSetupPanelTierProps = useMemo(
    () => ({
      tier,
      maxChannels,
      upgradeUrl,
      validateChannels,
    }),
    [tier, maxChannels, upgradeUrl, validateChannels]
  );

  const handleEnable = useCallback(
    (columns: string[], label: string, cpkTarget: number) => {
      if (onEnable) {
        onEnable(columns, label);
      } else {
        setMeasureColumns(columns);
        setMeasureLabel(label);
        setCpkTarget(cpkTarget);
        setAnalysisMode('performance');
      }
    },
    [onEnable, setMeasureColumns, setMeasureLabel, setCpkTarget, setAnalysisMode]
  );

  return (
    <PerformanceSetupPanelBase
      variant={variant}
      availableColumns={availableColumns}
      hasData={hasData}
      hasSpecs={hasSpecs}
      initialSelection={initialSelection ?? currentMeasureColumns ?? []}
      initialLabel={initialLabel ?? currentMeasureLabel ?? 'Measure'}
      initialCpkTarget={currentCpkTarget ?? 1.33}
      onEnable={handleEnable}
      onCancel={onCancel}
      onOpenSettings={onOpenSettings}
      colorScheme={performanceSetupPanelDefaultColorScheme}
      tierProps={tierProps}
    />
  );
};

export default PerformanceSetupPanel;
