import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoxplotDisplayToggle from '../BoxplotDisplayToggle';
import { boxplotDisplayToggleAzureColorScheme } from '../BoxplotDisplayToggle';

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
    showContributionLabels: false,
    onToggleViolin: vi.fn(),
    onToggleContributionLabels: vi.fn(),
  };

  it('renders trigger button', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    expect(screen.getByLabelText('Boxplot display options')).toBeTruthy();
  });

  it('opens popover on click', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    expect(screen.getByText('Distribution shape')).toBeTruthy();
    expect(screen.getByText('Contribution labels')).toBeTruthy();
  });

  it('closes popover on second click', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    const trigger = screen.getByLabelText('Boxplot display options');
    fireEvent.click(trigger);
    expect(screen.getByText('Distribution shape')).toBeTruthy();

    fireEvent.click(trigger);
    expect(screen.queryByText('Distribution shape')).toBeNull();
  });

  it('renders both toggles with correct checked state', () => {
    render(
      <BoxplotDisplayToggle {...defaultProps} showViolin={true} showContributionLabels={true} />
    );

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
  });

  it('renders unchecked when both false', () => {
    render(<BoxplotDisplayToggle {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it('fires onToggleViolin when distribution shape is toggled', () => {
    const onToggleViolin = vi.fn();
    render(<BoxplotDisplayToggle {...defaultProps} onToggleViolin={onToggleViolin} />);

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onToggleViolin).toHaveBeenCalledWith(true);
  });

  it('fires onToggleContributionLabels when contribution labels is toggled', () => {
    const onToggleContributionLabels = vi.fn();
    render(
      <BoxplotDisplayToggle
        {...defaultProps}
        onToggleContributionLabels={onToggleContributionLabels}
      />
    );

    fireEvent.click(screen.getByLabelText('Boxplot display options'));

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(onToggleContributionLabels).toHaveBeenCalledWith(true);
  });

  it('applies azure color scheme with slate classes', () => {
    render(
      <BoxplotDisplayToggle {...defaultProps} colorScheme={boxplotDisplayToggleAzureColorScheme} />
    );

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

      expect(screen.queryByText('Sort')).toBeNull();
      expect(screen.queryByText('Name')).toBeNull();
    });

    it('renders sort section when onSortChange is provided', () => {
      render(<BoxplotDisplayToggle {...sortProps} />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      expect(screen.getByText('Sort')).toBeTruthy();
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

      const dirButton = screen.getByLabelText('Sort ascending');
      fireEvent.click(dirButton);

      expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
    });

    it('shows descending label when direction is desc', () => {
      render(<BoxplotDisplayToggle {...sortProps} sortDirection="desc" />);
      fireEvent.click(screen.getByLabelText('Boxplot display options'));

      expect(screen.getByLabelText('Sort descending')).toBeTruthy();
    });
  });
});
