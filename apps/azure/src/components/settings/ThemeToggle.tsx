import React from 'react';
import { ThemeToggle as ThemeToggleBase } from '@variscout/ui';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return <ThemeToggleBase mode={theme.mode} onModeChange={mode => setTheme({ mode })} />;
};

export default ThemeToggle;
