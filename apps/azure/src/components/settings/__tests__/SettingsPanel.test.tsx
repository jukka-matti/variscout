import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../context/ThemeContext';

// Mock DataContext BEFORE importing SettingsPanel
const mockDisplayOptions = {
  showFilterContext: true,
  lockYAxisToFullData: true,
};
const mockSetDisplayOptions = vi.fn();

vi.mock('../../../context/DataContext', () => ({
  useData: () => ({
    displayOptions: mockDisplayOptions,
    setDisplayOptions: mockSetDisplayOptions,
  }),
}));

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const map: Record<string, string> = {
          'nav.settings': 'Settings',
          'display.preferences': 'Display Preferences',
          'display.chartTextSize': 'Chart Text Size',
          'display.compact': 'Compact',
          'display.normal': 'Normal',
          'display.large': 'Large',
          'display.lockYAxis': 'Lock Y-axis',
          'display.filterContext': 'Filter context',
          'display.showSpecs': 'Show specifications',
          'settings.language': 'Language',
          'action.close': 'Close',
        };
        return map[key] ?? key;
      },
      locale: 'en' as const,
      formatNumber: (v: number, d = 2) => v.toFixed(d),
      formatStat: (v: number, d = 2) => v.toFixed(d),
      formatPct: (v: number, d = 1) => `${(v * 100).toFixed(d)}%`,
    }),
  };
});

// Import component AFTER mocking its dependencies
import SettingsPanel from '../SettingsPanel';

// Partially mock lucide-react — keep real exports for transitive @variscout/ui imports
vi.mock('lucide-react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    X: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="icon-x" data-size={size} className={className} />
    ),
    Sun: ({ size }: { size?: number }) => <span data-testid="icon-sun" data-size={size} />,
    Moon: ({ size }: { size?: number }) => <span data-testid="icon-moon" data-size={size} />,
    Monitor: ({ size }: { size?: number }) => <span data-testid="icon-monitor" data-size={size} />,
  };
});

function renderPanel(isOpen: boolean, onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <ThemeProvider>
        <SettingsPanel isOpen={isOpen} onClose={onClose} />
      </ThemeProvider>
    ),
  };
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // HTMLDialogElement and matchMedia stubs provided by shared test/setup.ts
  });

  it('does not render when isOpen is false', () => {
    const { container } = renderPanel(false);

    // Dialog is rendered but not open (showModal not called)
    const dialog = container.querySelector('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog!.hasAttribute('open')).toBe(false);
  });

  it('renders panel content when isOpen is true', () => {
    renderPanel(true);

    // Dialog should be open
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Chart Text Size')).toBeInTheDocument();
  });

  it('shows Display Preferences section with 2 global toggles', () => {
    renderPanel(true);

    expect(screen.getByText('Display Preferences')).toBeInTheDocument();
    expect(screen.getByText('Lock Y-axis')).toBeInTheDocument();
    expect(screen.getByText('Filter context')).toBeInTheDocument();
    // Removed toggles should not be present
    expect(screen.queryByText('Show specification limits')).not.toBeInTheDocument();
    expect(screen.queryByText('Show Cpk capability')).not.toBeInTheDocument();
  });

  it('shows theme toggle with Light/Dark/System buttons', () => {
    renderPanel(true);

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('does not show accent color section (removed)', () => {
    renderPanel(true);

    expect(screen.queryByText('Company Accent')).not.toBeInTheDocument();
  });

  it('calls setTheme when a theme mode is clicked', () => {
    renderPanel(true);

    // Default is dark; click Light
    fireEvent.click(screen.getByText('Light'));

    // The Light button should become active (bg-blue-600 class)
    expect(screen.getByLabelText('Switch to Light theme')).toHaveClass('bg-blue-600');

    // Dark button should no longer be active
    expect(screen.getByLabelText('Switch to Dark theme')).not.toHaveClass('bg-blue-600');
  });

  it('shows chart font scale options (Compact/Normal/Large)', () => {
    renderPanel(true);

    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);

    fireEvent.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderPanel(true, onClose);

    // Click the <dialog> element directly (backdrop click: target === currentTarget)
    const dialog = container.querySelector('dialog')!;
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
