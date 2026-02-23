export interface ChartDownloadMenuColorScheme {
  trigger: string;
  triggerActive: string;
  popoverContainer: string;
  menuItem: string;
  menuItemIcon: string;
  menuItemLabel: string;
}

export interface ChartDownloadMenuProps {
  containerId: string;
  chartName: string;
  onDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg: (containerId: string, chartName: string) => void;
  colorScheme?: ChartDownloadMenuColorScheme;
}
