import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeContextMenu } from '../EdgeContextMenu';

vi.mock('lucide-react', () => ({
  MessageCircleQuestion: () => null,
  Bot: () => null,
  Link: () => null,
}));

const defaultProps = {
  factorA: 'Temperature',
  factorB: 'Pressure',
  x: 100,
  y: 200,
  onAskQuestion: vi.fn(),
  onAskCoScout: vi.fn(),
  onPromoteToCausal: vi.fn(),
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EdgeContextMenu', () => {
  it('renders 3 menu items', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
  });

  it('shows factor names in ask question label', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    expect(screen.getByRole('menuitem', { name: /Temperature.*Pressure/i })).toBeInTheDocument();
  });

  it('calls onAskQuestion with both factors when ask question is clicked', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    fireEvent.click(items[0]);
    expect(defaultProps.onAskQuestion).toHaveBeenCalledWith('Temperature', 'Pressure');
  });

  it('calls onAskCoScout with both factors when ask CoScout is clicked', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    fireEvent.click(items[1]);
    expect(defaultProps.onAskCoScout).toHaveBeenCalledWith('Temperature', 'Pressure');
  });

  it('calls onPromoteToCausal with both factors when promote is clicked', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    fireEvent.click(items[2]);
    expect(defaultProps.onPromoteToCausal).toHaveBeenCalledWith('Temperature', 'Pressure');
  });

  it('calls onClose after each button click', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const items = screen.getAllByRole('menuitem');
    fireEvent.click(items[0]);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', () => {
    render(<EdgeContextMenu {...defaultProps} />);
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', () => {
    const { container } = render(<EdgeContextMenu {...defaultProps} />);
    // The backdrop is the first fixed inset-0 div
    const backdrop = container.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
