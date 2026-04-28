import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceMigrationBanner } from '../ProductionLineGlanceMigrationBanner';

describe('ProductionLineGlanceMigrationBanner', () => {
  it('renders count + primary action when count > 0', () => {
    render(<ProductionLineGlanceMigrationBanner count={3} onMapClick={vi.fn()} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /map columns/i })).toBeInTheDocument();
  });

  it('renders nothing when count === 0', () => {
    const { container } = render(
      <ProductionLineGlanceMigrationBanner count={0} onMapClick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('fires onMapClick when primary action is clicked', () => {
    const onMapClick = vi.fn();
    render(<ProductionLineGlanceMigrationBanner count={3} onMapClick={onMapClick} />);
    fireEvent.click(screen.getByRole('button', { name: /map columns/i }));
    expect(onMapClick).toHaveBeenCalledOnce();
  });

  it('uses singular wording for count=1', () => {
    render(<ProductionLineGlanceMigrationBanner count={1} onMapClick={vi.fn()} />);
    expect(screen.getByText(/1 investigation is not yet mapped/i)).toBeInTheDocument();
  });
});
