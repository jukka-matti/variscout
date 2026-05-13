import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { LODSwitcher } from '../LODSwitcher';

describe('LODSwitcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders only the active level content in stable state', () => {
    render(
      <LODSwitcher
        currentLevel="l2"
        l1={<div>System view</div>}
        l2={<div>Process view</div>}
        l3={<div>Step view</div>}
      />
    );

    expect(screen.getByText('Process view')).toBeInTheDocument();
    expect(screen.queryByText('System view')).not.toBeInTheDocument();
    expect(screen.queryByText('Step view')).not.toBeInTheDocument();
  });

  it('wraps the active level in a 150ms opacity transition container', () => {
    const { container } = render(
      <LODSwitcher
        currentLevel="l1"
        l1={<div>System view</div>}
        l2={<div>Process view</div>}
        l3={<div>Step view</div>}
      />
    );

    const wrapper = container.querySelector('[data-lod-wrapper]');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({
      opacity: '1',
      transitionProperty: 'opacity',
      transitionDuration: '150ms',
    });
  });

  it('mounts both outgoing and incoming renderers during the transition window', () => {
    const { rerender } = render(
      <LODSwitcher
        currentLevel="l1"
        l1={<div>System view</div>}
        l2={<div>Process view</div>}
        l3={<div>Step view</div>}
      />
    );

    // Trigger a level change.
    act(() => {
      rerender(
        <LODSwitcher
          currentLevel="l2"
          l1={<div>System view</div>}
          l2={<div>Process view</div>}
          l3={<div>Step view</div>}
        />
      );
    });

    // During the 150ms window both renderers should be in the DOM.
    expect(screen.getByText('System view')).toBeInTheDocument();
    expect(screen.getByText('Process view')).toBeInTheDocument();
  });

  it('unmounts the outgoing renderer after 150ms', () => {
    const { rerender } = render(
      <LODSwitcher
        currentLevel="l1"
        l1={<div>System view</div>}
        l2={<div>Process view</div>}
        l3={<div>Step view</div>}
      />
    );

    act(() => {
      rerender(
        <LODSwitcher
          currentLevel="l2"
          l1={<div>System view</div>}
          l2={<div>Process view</div>}
          l3={<div>Step view</div>}
        />
      );
    });

    // Advance past the cross-fade duration.
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Outgoing renderer is gone; only incoming remains.
    expect(screen.queryByText('System view')).not.toBeInTheDocument();
    expect(screen.getByText('Process view')).toBeInTheDocument();
  });

  it('outgoing div has data-lod-outgoing and incoming has data-lod-incoming during transition', () => {
    const { container, rerender } = render(
      <LODSwitcher
        currentLevel="l1"
        l1={<div>System view</div>}
        l2={<div>Process view</div>}
        l3={<div>Step view</div>}
      />
    );

    act(() => {
      rerender(
        <LODSwitcher
          currentLevel="l2"
          l1={<div>System view</div>}
          l2={<div>Process view</div>}
          l3={<div>Step view</div>}
        />
      );
    });

    expect(container.querySelector('[data-lod-outgoing]')).toBeInTheDocument();
    expect(container.querySelector('[data-lod-incoming]')).toBeInTheDocument();
  });
});
