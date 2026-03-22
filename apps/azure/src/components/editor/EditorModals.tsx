import React from 'react';
import { YamazumiDetectedModal, CapabilitySuggestionModal } from '@variscout/ui';
import type { YamazumiDetection, SubgroupConfig } from '@variscout/core';

interface EditorModalsProps {
  // Yamazumi detection
  yamazumiDetection: YamazumiDetection | null;
  onEnableYamazumi: (taktTime: number | undefined) => void;
  onDeclineYamazumi: () => void;
  // Capability suggestion
  showCapabilitySuggestion: boolean;
  onStartCapability: (config: SubgroupConfig) => void;
  onStartStandard: () => void;
  factorColumns: string[];
}

export const EditorModals: React.FC<EditorModalsProps> = ({
  yamazumiDetection,
  onEnableYamazumi,
  onDeclineYamazumi,
  showCapabilitySuggestion,
  onStartCapability,
  onStartStandard,
  factorColumns,
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
      {showCapabilitySuggestion && (
        <CapabilitySuggestionModal
          onStartCapability={onStartCapability}
          onStartStandard={onStartStandard}
          factorColumns={factorColumns}
        />
      )}
    </>
  );
};
