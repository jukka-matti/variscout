import type { Preview } from 'storybook/preview-api';
import '../packages/ui/src/styles/theme.css';
import '../packages/ui/src/styles/components.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Color theme',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', icon: 'moon', title: 'Dark' },
          { value: 'light', icon: 'sun', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
    chartMode: {
      name: 'Chart Mode',
      description: 'Chart color mode',
      defaultValue: 'technical',
      toolbar: {
        icon: 'graphline',
        items: [
          { value: 'technical', title: 'Technical' },
          { value: 'executive', title: 'Executive' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme || 'dark');
      document.documentElement.setAttribute(
        'data-chart-mode',
        context.globals.chartMode || 'technical'
      );
      return <Story />;
    },
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
  },
};

export default preview;
