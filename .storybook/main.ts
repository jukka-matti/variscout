import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['./stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async config => {
    // Ensure Tailwind CSS is processed via Vite plugin
    config.plugins = [...(config.plugins || []), tailwindcss()];
    return config;
  },
};

export default config;
