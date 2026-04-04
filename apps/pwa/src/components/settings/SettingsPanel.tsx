import React from 'react';
import { SettingsPanelBase, ThemeToggle, useTheme } from '@variscout/ui';
import { useTranslation } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const displayOptions = useProjectStore(s => s.displayOptions);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const { theme, setTheme } = useTheme();

  return (
    <SettingsPanelBase
      isOpen={isOpen}
      onClose={onClose}
      displayOptions={displayOptions}
      setDisplayOptions={setDisplayOptions}
      density={theme.density ?? 'M'}
      onDensityChange={density => setTheme({ density })}
      idPrefix="pwa-setting"
      headerSections={
        <section>
          <h3 className="text-sm font-medium text-content mb-3">{t('display.appearance')}</h3>
          <ThemeToggle mode={theme.mode} onModeChange={mode => setTheme({ mode })} />
        </section>
      }
    />
  );
};

export default SettingsPanel;
