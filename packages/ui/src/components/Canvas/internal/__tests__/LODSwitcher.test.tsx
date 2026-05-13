import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LODSwitcher } from '../LODSwitcher';

describe('LODSwitcher', () => {
  it('renders only the active level content', () => {
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
});
