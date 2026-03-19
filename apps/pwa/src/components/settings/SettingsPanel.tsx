import React from 'react';
import { SettingsPanelBase, ThemeToggle } from '@variscout/ui';
import { useTranslation } from '@variscout/hooks';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { displayOptions, setDisplayOptions } = useData();
  const { theme, setTheme } = useTheme();

  return (
    <SettingsPanelBase
      isOpen={isOpen}
      onClose={onClose}
      displayOptions={displayOptions}
      setDisplayOptions={setDisplayOptions}
      chartFontScale={theme.chartFontScale ?? 'normal'}
      onChartFontScaleChange={scale => setTheme({ chartFontScale: scale })}
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
