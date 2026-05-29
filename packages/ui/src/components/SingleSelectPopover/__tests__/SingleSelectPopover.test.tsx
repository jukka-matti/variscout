// packages/ui/src/components/SingleSelectPopover/__tests__/SingleSelectPopover.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleSelectPopover } from '../SingleSelectPopover';

const baseProps = {
  options: [
    { value: 'yield', label: 'yield' },
    { value: 'defectRate', label: 'defectRate' },
    { value: 'cycleTime', label: 'cycleTime' },
  ],
  activeValue: 'yield' as string | undefined,
  onSelect: vi.fn(),
  onClose: vi.fn(),
};

describe('SingleSelectPopover', () => {
  it('renders all options', () => {
    render(<SingleSelectPopover {...baseProps} />);
    expect(screen.getByText('yield')).toBeInTheDocument();
    expect(screen.getByText('defectRate')).toBeInTheDocument();
    expect(screen.getByText('cycleTime')).toBeInTheDocument();
  });

  it('marks the active value with a check icon', () => {
    render(<SingleSelectPopover {...baseProps} />);
    const activeRow = screen.getByTestId('single-select-option-yield');
    expect(activeRow).toHaveAttribute('data-active', 'true');
  });

  it('fires onSelect when an option is clicked', () => {
    const onSelect = vi.fn();
    render(<SingleSelectPopover {...baseProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('single-select-option-defectRate'));
    expect(onSelect).toHaveBeenCalledWith('defectRate');
  });

  it('fires onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<SingleSelectPopover {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SingleSelectPopover {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('single-select-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the nullOption row when provided and fires its onSelect', () => {
    const nullSelect = vi.fn();
    render(
      <SingleSelectPopover
        {...baseProps}
        nullOption={{ label: 'All steps', onSelect: nullSelect }}
      />
    );
    fireEvent.click(screen.getByTestId('single-select-null-option'));
    expect(nullSelect).toHaveBeenCalledTimes(1);
  });

  it('renders a title when provided', () => {
    render(<SingleSelectPopover {...baseProps} title="Choose outcome" />);
    expect(screen.getByText('Choose outcome')).toBeInTheDocument();
  });
});
