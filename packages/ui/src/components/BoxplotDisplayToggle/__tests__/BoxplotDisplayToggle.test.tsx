import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'display.violin': 'Violin plot',
    'display.violinDesc': 'Show distribution shape',
    'display.contribution': 'Contribution',
    'display.contributionDesc': 'Show variation contribution',
    'display.sort': 'Sort',
    'display.ascending': 'Ascending',
    'display.descending': 'Descending',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      locale: 'en',
    }),
  };
});

import BoxplotDisplayToggle from '../BoxplotDisplayToggle';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  SlidersHorizontal: ({ size }: { size?: number }) => (
    <span data-testid="icon-sliders" data-size={size} />
  ),
  ArrowUpNarrowWide: ({ size }: { size?: number }) => (
    <span data-testid="icon-arrow-up" data-size={size} />
  ),
  ArrowDownWideNarrow: ({ size }: { size?: number }) => (
    <span data-testid="icon-arrow-down" data-size={size} />
  ),
}));

describe('BoxplotDisplayToggle', () => {
  const defaultProps = {
    showViolin: false,
    onToggleViolin: vi.fn(),
  };

  it('renders trigger button', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    expect(screen.getByLabelText('Boxplot display options')).toBeTruthy();
  });

  it('opens popover on click', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    expect(screen.getByText('Violin plot')).toBeTruthy();
  });

  it('closes popover on second click', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    const trigger = screen.getByLabelText('Boxplot display options');
    fireEvent.click(trigger);
    expect(screen.getByText('Violin plot')).toBeTruthy();

    fireEvent.click(trigger);
    expect(screen.queryByText('Violin plot')).toBeNull();
  });

  it('renders violin toggle with correct checked state', () => {
    render(<BoxplotDisplayToggle {...defaultProps} showViolin={true} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
  });

  it('renders unchecked when violin false', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
  });

  it('fires onToggleViolin when distribution shape is toggled', () => {
    const onToggleViolin = vi.fn();
    render(<BoxplotDisplayToggle {...defaultProps} onToggleViolin={onToggleViolin} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onToggleViolin).toHaveBeenCalledWith(true);
  });

  it('applies custom color scheme', () => {
    const customScheme = {
      trigger: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
      popoverContainer:
        'fixed w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50',
      checkbox: 'w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500',
      checkboxLabel: 'text-sm text-slate-300',
      description: 'text-xs text-slate-500',
      radioActive: 'bg-blue-500/20 border-blue-500 text-blue-400',
      radioInactive: 'bg-slate-800 border-slate-600 text-slate-400',
      directionButton: 'text-slate-400 hover:text-white',
      sectionLabel: 'text-xs font-medium text-slate-500',
    };
    render(<BoxplotDisplayToggle {...defaultProps} colorScheme={customScheme} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const popover = screen.getByRole('dialog');
    expect(popover.className).toContain('slate');
  });

  describe('sort controls', () => {
    const sortProps = {
      ...defaultProps,
      sortBy: 'name' as const,
      sortDirection: 'asc' as const,
      onSortChange: vi.fn(),
    };

    it('does not render sort section when onSortChange is not provided', () => {
      render(<BoxplotDisplayToggle {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      expect(screen.queryByText('Sort', { exact: true })).toBeNull();
      expect(screen.queryByText('Name')).toBeNull();
    });

    it('renders sort section when onSortChange is provided', () => {
      render(<BoxplotDisplayToggle {...sortProps} />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      expect(screen.getByText('Sort', { exact: true })).toBeTruthy();
      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('Mean')).toBeTruthy();
      expect(screen.getByText('Spread')).toBeTruthy();
    });

    it('highlights the active sort criterion', () => {
      render(<BoxplotDisplayToggle {...sortProps} sortBy="mean" />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      const meanButton = screen.getByText('Mean');
      expect(meanButton.closest('button')?.getAttribute('aria-pressed')).toBe('true');

      const nameButton = screen.getByText('Name');
      expect(nameButton.closest('button')?.getAttribute('aria-pressed')).toBe('false');
    });

    it('fires onSortChange with new criterion when clicking a sort option', () => {
      const onSortChange = vi.fn();
      render(<BoxplotDisplayToggle {...sortProps} onSortChange={onSortChange} />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      fireEvent.click(screen.getByText('Spread'));

      expect(onSortChange).toHaveBeenCalledWith('spread', 'asc');
    });

    it('fires onSortChange with toggled direction when clicking direction button', () => {
      const onSortChange = vi.fn();
      render(
        <BoxplotDisplayToggle {...sortProps} sortDirection="asc" onSortChange={onSortChange} />
      );
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      const dirButton = screen.getByLabelText('Ascending');
      fireEvent.click(dirButton);

      expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
    });

    it('shows descending label when direction is desc', () => {
      render(<BoxplotDisplayToggle {...sortProps} sortDirection="desc" />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      expect(screen.getByLabelText('Descending')).toBeTruthy();
    });
  });
});
