import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../context/ThemeContext';

// Mock DataContext BEFORE importing SettingsPanel
const mockDisplayOptions = {
  showCp: true,
  showCpk: true,
  showFilterContext: true,
  lockYAxisToFullData: true,
  showSpecs: true,
};
const mockSetDisplayOptions = vi.fn();

vi.mock('../../../context/DataContext', () => ({
  useData: () => ({
    displayOptions: mockDisplayOptions,
    setDisplayOptions: mockSetDisplayOptions,
  }),
}));

// Import component AFTER mocking its dependencies
import SettingsPanel from '../SettingsPanel';

// Mock lucide-react icons to simplify DOM output
vi.mock('lucide-react', () => ({
  X: ({ size, className }: { size?: number; className?: string }) => (
    <span data-testid="icon-x" data-size={size} className={className} />
  ),
  Sun: ({ size }: { size?: number }) => <span data-testid="icon-sun" data-size={size} />,
  Moon: ({ size }: { size?: number }) => <span data-testid="icon-moon" data-size={size} />,
  Monitor: ({ size }: { size?: number }) => <span data-testid="icon-monitor" data-size={size} />,
  Palette: ({ size }: { size?: number }) => <span data-testid="icon-palette" data-size={size} />,
}));

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

    // jsdom does not implement window.matchMedia; stub it for ThemeProvider
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('does not render when isOpen is false', () => {
    renderPanel(false);

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Appearance')).not.toBeInTheDocument();
  });

  it('renders panel content when isOpen is true', () => {
    renderPanel(true);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Company Accent')).toBeInTheDocument();
    expect(screen.getByText('Chart Text Size')).toBeInTheDocument();
  });

  it('shows Display Preferences section with all 4 global toggles', () => {
    renderPanel(true);

    expect(screen.getByText('Display Preferences')).toBeInTheDocument();
    expect(screen.getByText('Lock Y-axis when drilling')).toBeInTheDocument();
    expect(screen.getByText('Show specification limits')).toBeInTheDocument();
    expect(screen.getByText('Show Cpk capability')).toBeInTheDocument();
    expect(screen.getByText('Show filter context on charts')).toBeInTheDocument();
  });

  it('shows theme toggle with Light/Dark/System buttons', () => {
    renderPanel(true);

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('shows accent color presets', () => {
    renderPanel(true);

    // 7 color presets + 1 reset button
    const accentButtons = screen.getAllByRole('button').filter(btn => {
      const label = btn.getAttribute('aria-label');
      return label?.startsWith('Set accent color') || label === 'Reset accent color';
    });
    expect(accentButtons).toHaveLength(8); // 7 presets + reset

    // Verify specific preset labels
    expect(screen.getByLabelText('Set accent color to #3b82f6')).toBeInTheDocument();
    expect(screen.getByLabelText('Set accent color to #8b5cf6')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset accent color')).toBeInTheDocument();
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

  it('calls setTheme when an accent color is clicked', () => {
    renderPanel(true);

    const violetButton = screen.getByLabelText('Set accent color to #8b5cf6');
    fireEvent.click(violetButton);

    // After clicking, the violet button should have the active border (border-white scale-110)
    expect(violetButton).toHaveClass('border-white');
  });

  it('shows chart font scale options (Compact/Normal/Large)', () => {
    renderPanel(true);

    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();

    // Should show the multiplier values
    expect(screen.getByText('0.85x')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('1.15x')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);

    fireEvent.click(screen.getByLabelText('Close settings'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderPanel(true, onClose);

    // The backdrop is the first child div with bg-black/40 class
    const backdrop = container.querySelector('.bg-black\\/40');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
