import React from 'react';
import { ThemeToggle as ThemeToggleBase, useTheme } from '@variscout/ui';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return <ThemeToggleBase mode={theme.mode} onModeChange={mode => setTheme({ mode })} />;
};

export default ThemeToggle;
