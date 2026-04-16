import React from 'react';
import {
  YamazumiDetectedModal,
  CapabilitySuggestionModal,
  DefectDetectedModal,
} from '@variscout/ui';
import type {
  YamazumiDetection,
  DefectDetection,
  DefectMapping,
  SubgroupConfig,
  SpecLimits,
  StatsResult,
} from '@variscout/core';

interface EditorModalsProps {
  // Yamazumi detection
  yamazumiDetection: YamazumiDetection | null;
  onEnableYamazumi: (taktTime: number | undefined) => void;
  onDeclineYamazumi: () => void;
  // Defect detection
  defectDetection: DefectDetection | null;
  columnNames: string[];
  onEnableDefect: (mapping: DefectMapping) => void;
  onDeclineDefect: () => void;
  // Capability suggestion
  showCapabilitySuggestion: boolean;
  onStartCapability: (config: SubgroupConfig) => void;
  onStartStandard: () => void;
  factorColumns: string[];
  // New: data context for capability modal
  dataFilename: string | null;
  outcome: string | null;
  rowCount: number;
  specs: SpecLimits;
  stats: StatsResult | null;
  cpkTarget: number | undefined;
  onSpecsChange: (specs: SpecLimits) => void;
  onCpkTargetChange: (target: number | undefined) => void;
}

export const EditorModals: React.FC<EditorModalsProps> = ({
  yamazumiDetection,
  onEnableYamazumi,
  onDeclineYamazumi,
  defectDetection,
  columnNames,
  onEnableDefect,
  onDeclineDefect,
  showCapabilitySuggestion,
  onStartCapability,
  onStartStandard,
  factorColumns,
  dataFilename,
  outcome,
  rowCount,
  specs,
  stats,
  cpkTarget,
  onSpecsChange,
  onCpkTargetChange,
}) => {
  return (
    <>
      {yamazumiDetection && (
        <YamazumiDetectedModal
          detection={yamazumiDetection}
          onEnable={onEnableYamazumi}
          onDecline={onDeclineYamazumi}
        />
      )}
      {defectDetection && (
        <DefectDetectedModal
          detection={defectDetection}
          columnNames={columnNames}
          onEnable={onEnableDefect}
          onDismiss={onDeclineDefect}
        />
      )}
      {showCapabilitySuggestion && (
        <CapabilitySuggestionModal
          onStartCapability={onStartCapability}
          onStartStandard={onStartStandard}
          factorColumns={factorColumns}
          dataFilename={dataFilename}
          outcome={outcome}
          rowCount={rowCount}
          specs={specs}
          stats={stats}
          cpkTarget={cpkTarget}
          onSpecsChange={onSpecsChange}
          onCpkTargetChange={onCpkTargetChange}
        />
      )}
    </>
  );
};
