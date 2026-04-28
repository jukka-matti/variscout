import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceFilterStrip } from '../ProductionLineGlanceFilterStrip';
import type { SpecLookupContext } from '@variscout/core/types';

describe('ProductionLineGlanceFilterStrip', () => {
  const baseProps = {
    availableContext: {
      hubColumns: ['product', 'shift'],
      tributaryGroups: [
        { tributaryLabel: 'Steel', columns: ['supplier'] },
        { tributaryLabel: 'Paint', columns: ['paintClass'] },
      ],
    },
    contextValueOptions: {
      product: ['Coke 12oz', 'Coke 16oz', 'Sprite 12oz'],
      shift: ['A', 'B', 'C'],
      supplier: ['TightCorp', 'WideCorp'],
      paintClass: ['Standard', 'Premium'],
    },
    value: {} as SpecLookupContext,
    onChange: vi.fn(),
  };

  it('renders one group per hub-level column', () => {
    render(<ProductionLineGlanceFilterStrip {...baseProps} />);
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('shift')).toBeInTheDocument();
  });

  it('renders tributary groups below hub-level groups, with tributary label header', () => {
    render(<ProductionLineGlanceFilterStrip {...baseProps} />);
    expect(screen.getByText('Steel')).toBeInTheDocument();
    expect(screen.getByText('Paint')).toBeInTheDocument();
    expect(screen.getByText('supplier')).toBeInTheDocument();
    expect(screen.getByText('paintClass')).toBeInTheDocument();
  });

  it('shows the current value as a selected chip', () => {
    render(
      <ProductionLineGlanceFilterStrip
        {...baseProps}
        value={{ product: 'Coke 12oz', supplier: 'TightCorp' }}
      />
    );
    const cokeChip = screen.getByRole('button', { name: /Coke 12oz/ });
    expect(cokeChip).toHaveAttribute('aria-pressed', 'true');
    const tightChip = screen.getByRole('button', { name: /TightCorp/ });
    expect(tightChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange with merged context when a chip is clicked', () => {
    const onChange = vi.fn();
    render(<ProductionLineGlanceFilterStrip {...baseProps} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Coke 12oz/ }));
    expect(onChange).toHaveBeenCalledWith({ product: 'Coke 12oz' });
  });

  it('clears a column when the active chip is clicked again', () => {
    const onChange = vi.fn();
    render(
      <ProductionLineGlanceFilterStrip
        {...baseProps}
        value={{ product: 'Coke 12oz' }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Coke 12oz/ }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('preserves other column selections when changing one column', () => {
    const onChange = vi.fn();
    render(
      <ProductionLineGlanceFilterStrip {...baseProps} value={{ shift: 'A' }} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Coke 12oz/ }));
    expect(onChange).toHaveBeenCalledWith({ shift: 'A', product: 'Coke 12oz' });
  });

  it('renders no chip buttons when no columns and no tributaries are configured', () => {
    const { container } = render(
      <ProductionLineGlanceFilterStrip
        availableContext={{ hubColumns: [] }}
        contextValueOptions={{}}
        value={{}}
        onChange={vi.fn()}
      />
    );
    expect(container.querySelectorAll('button').length).toBe(0);
  });
});
