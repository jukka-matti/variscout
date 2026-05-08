import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepNodeMarker } from '../StepNodeMarker';

const suspectedHub = {
  id: 'hub-1',
  name: 'Chamber 3 thermal drift',
  status: 'suspected' as const,
};

const confirmedHub = {
  id: 'hub-2',
  name: 'Shift change effect',
  status: 'confirmed' as const,
};

describe('StepNodeMarker', () => {
  it('renders nothing for no hubs', () => {
    const { container } = render(<StepNodeMarker hubs={[]} onClick={() => undefined} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the hub count', () => {
    render(<StepNodeMarker hubs={[suspectedHub, confirmedHub]} onClick={() => undefined} />);

    expect(screen.getByTestId('step-node-marker')).toHaveTextContent('2');
  });

  it('uses warning style when any hub is suspected', () => {
    render(<StepNodeMarker hubs={[suspectedHub]} onClick={() => undefined} />);

    expect(screen.getByTestId('step-node-marker').className).toMatch(/status-warning/);
  });

  it('uses info style when all hubs are confirmed', () => {
    render(<StepNodeMarker hubs={[confirmedHub]} onClick={() => undefined} />);

    expect(screen.getByTestId('step-node-marker').className).toMatch(/status-info/);
  });

  it('lists hub names in accessible label and tooltip', () => {
    render(<StepNodeMarker hubs={[suspectedHub, confirmedHub]} onClick={() => undefined} />);

    const marker = screen.getByTestId('step-node-marker');
    expect(marker).toHaveAttribute('aria-label', expect.stringContaining(suspectedHub.name));
    expect(marker).toHaveAttribute('title', expect.stringContaining(confirmedHub.name));
  });

  it('calls onClick when selected', () => {
    const onClick = vi.fn();
    render(<StepNodeMarker hubs={[suspectedHub]} onClick={onClick} />);

    fireEvent.click(screen.getByTestId('step-node-marker'));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
