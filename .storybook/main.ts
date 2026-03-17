import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['./stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async config => {
    // Ensure Tailwind CSS is processed
    return config;
  },
};

export default config;
