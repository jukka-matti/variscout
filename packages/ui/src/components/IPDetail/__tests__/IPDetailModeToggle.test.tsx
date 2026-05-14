import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailModeToggle from '../IPDetailModeToggle';

describe('IPDetailModeToggle', () => {
  it('marks the active mode visually', () => {
    render(<IPDetailModeToggle mode="overview" onModeChange={() => {}} />);
    expect(screen.getByTestId('mode-overview')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mode-sections')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onModeChange when toggle clicked', () => {
    const onChange = vi.fn();
    render(<IPDetailModeToggle mode="overview" onModeChange={onChange} />);
    fireEvent.click(screen.getByTestId('mode-sections'));
    expect(onChange).toHaveBeenCalledWith('sections');
  });
});
