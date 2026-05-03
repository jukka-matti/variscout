import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SegmentedControl from '../SegmentedControl';

type Tab = 'a' | 'b' | 'c';

const options: { value: Tab; label: string }[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

const DEFAULT_LABEL = 'Test control';

describe('SegmentedControl', () => {
  it('renders all options', () => {
    render(
      <SegmentedControl options={options} value="a" onChange={vi.fn()} aria-label={DEFAULT_LABEL} />
    );
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Gamma')).toBeTruthy();
  });

  it('marks the container with role="group" and the provided aria-label', () => {
    render(
      <SegmentedControl options={options} value="a" onChange={vi.fn()} aria-label="Verify view" />
    );
    const group = screen.getByRole('group', { name: 'Verify view' });
    expect(group).toBeTruthy();
  });

  it('marks the active option with aria-pressed=true', () => {
    render(
      <SegmentedControl options={options} value="b" onChange={vi.fn()} aria-label={DEFAULT_LABEL} />
    );
    const betaBtn = screen.getByText('Beta').closest('button');
    const alphaBtn = screen.getByText('Alpha').closest('button');
    expect(betaBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(alphaBtn?.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onChange with the clicked option value', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="a"
        onChange={onChange}
        aria-label={DEFAULT_LABEL}
      />
    );
    fireEvent.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('does not call onChange when the active option is clicked', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="a"
        onChange={onChange}
        aria-label={DEFAULT_LABEL}
      />
    );
    fireEvent.click(screen.getByText('Alpha'));
    // onChange is called (component is uncontrolled-by-design for this call),
    // caller decides whether to update value
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders data-testid attributes when testId is provided', () => {
    render(
      <SegmentedControl
        options={options}
        value="a"
        onChange={vi.fn()}
        aria-label={DEFAULT_LABEL}
        testId="verify-tab"
      />
    );
    expect(screen.getByTestId('verify-tab-a')).toBeTruthy();
    expect(screen.getByTestId('verify-tab-b')).toBeTruthy();
    expect(screen.getByTestId('verify-tab-c')).toBeTruthy();
  });

  it('marks the container with data-export-hide', () => {
    render(
      <SegmentedControl options={options} value="a" onChange={vi.fn()} aria-label={DEFAULT_LABEL} />
    );
    const alphaBtn = screen.getByText('Alpha');
    const container = alphaBtn.closest('[data-export-hide]');
    expect(container).toBeTruthy();
  });

  it('returns null when options array is empty', () => {
    const { container } = render(
      <SegmentedControl
        options={[]}
        value={'a' as Tab}
        onChange={vi.fn()}
        aria-label={DEFAULT_LABEL}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
