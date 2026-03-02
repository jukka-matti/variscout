/**
 * Tests for AnnotationContextMenu component
 *
 * Validates: highlight color options, clear highlight, observation button,
 * hasFinding gating, close-on-Escape, and callback wiring.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AnnotationContextMenu } from '../AnnotationContextMenu';
import type { AnnotationContextMenuProps } from '../AnnotationContextMenu';

const defaultProps: AnnotationContextMenuProps = {
  categoryKey: 'Machine A',
  hasFinding: false,
  position: { x: 100, y: 200 },
  onSetHighlight: vi.fn(),
  onAddObservation: vi.fn(),
  onClose: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AnnotationContextMenu', () => {
  it('renders a menu with role="menu"', () => {
    render(<AnnotationContextMenu {...defaultProps} />);
    expect(screen.getByRole('menu')).toBeDefined();
  });

  it('renders all three highlight color options', () => {
    render(<AnnotationContextMenu {...defaultProps} />);
    expect(screen.getByText('Red highlight')).toBeDefined();
    expect(screen.getByText('Amber highlight')).toBeDefined();
    expect(screen.getByText('Green highlight')).toBeDefined();
  });

  it('renders "Clear highlight" option', () => {
    render(<AnnotationContextMenu {...defaultProps} />);
    expect(screen.getByText('Clear highlight')).toBeDefined();
  });

  it('renders "Add observation" button when hasFinding is false', () => {
    render(<AnnotationContextMenu {...defaultProps} hasFinding={false} />);
    expect(screen.getByText('Add observation')).toBeDefined();
  });

  it('hides "Add observation" button when hasFinding is true', () => {
    render(<AnnotationContextMenu {...defaultProps} hasFinding={true} />);
    expect(screen.queryByText('Add observation')).toBeNull();
  });

  it('calls onSetHighlight with color and onClose when highlight option is clicked', () => {
    const onSetHighlight = vi.fn();
    const onClose = vi.fn();
    render(
      <AnnotationContextMenu {...defaultProps} onSetHighlight={onSetHighlight} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('Red highlight'));
    expect(onSetHighlight).toHaveBeenCalledWith('red');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSetHighlight(undefined) and onClose when "Clear highlight" is clicked', () => {
    const onSetHighlight = vi.fn();
    const onClose = vi.fn();
    render(
      <AnnotationContextMenu {...defaultProps} onSetHighlight={onSetHighlight} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('Clear highlight'));
    expect(onSetHighlight).toHaveBeenCalledWith(undefined);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onAddObservation and onClose when "Add observation" is clicked', () => {
    const onAddObservation = vi.fn();
    const onClose = vi.fn();
    render(
      <AnnotationContextMenu
        {...defaultProps}
        onAddObservation={onAddObservation}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Add observation'));
    expect(onAddObservation).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "active" label next to the current highlight color', () => {
    render(<AnnotationContextMenu {...defaultProps} currentHighlight="amber" />);
    // The "active" label appears next to the matching color
    expect(screen.getByText('active')).toBeDefined();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<AnnotationContextMenu {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('positions at the given screen coordinates', () => {
    render(<AnnotationContextMenu {...defaultProps} position={{ x: 150, y: 300 }} />);
    const menu = screen.getByTestId('annotation-context-menu');
    expect(menu.style.left).toBe('150px');
    expect(menu.style.top).toBe('300px');
  });

  it('renders all options as menuitems', () => {
    render(<AnnotationContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    // 3 highlight colors + clear highlight + add observation = 5
    expect(items).toHaveLength(5);
  });

  it('renders 4 menuitems when hasFinding is true (no observation button)', () => {
    render(<AnnotationContextMenu {...defaultProps} hasFinding={true} />);
    const items = screen.getAllByRole('menuitem');
    // 3 highlight colors + clear highlight = 4
    expect(items).toHaveLength(4);
  });
});
