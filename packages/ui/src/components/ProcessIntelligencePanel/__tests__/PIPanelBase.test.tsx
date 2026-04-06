import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PIPanelBase from '../PIPanelBase';
import type { PIPanelBaseProps } from '../types';

const tabsConfig: PIPanelBaseProps['tabs'] = [
  {
    id: 'stats',
    label: 'Stats',
    content: <div data-testid="config-stats-content">Stats Content</div>,
  },
  {
    id: 'questions',
    label: 'Questions',
    badge: 5,
    content: <div data-testid="config-questions-content">Questions Content</div>,
  },
  {
    id: 'journal',
    label: 'Journal',
    content: <div data-testid="config-journal-content">Journal Content</div>,
  },
];

const overflowItems: PIPanelBaseProps['overflowItems'] = [
  {
    id: 'data',
    label: 'Data Table',
    content: <div data-testid="config-data-content">Data Table Content</div>,
  },
  {
    id: 'whatif',
    label: 'What-If',
    content: <div data-testid="config-whatif-content">What-If Content</div>,
  },
];

describe('PIPanelBase', () => {
  describe('tab rendering', () => {
    it('renders tab bar from tabs array', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      expect(screen.getByTestId('pi-tab-stats')).toBeDefined();
      expect(screen.getByTestId('pi-tab-questions')).toBeDefined();
      expect(screen.getByTestId('pi-tab-journal')).toBeDefined();
    });

    it('renders tab labels from tabs array', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      expect(screen.getByText('Stats')).toBeDefined();
      expect(screen.getByText('Questions')).toBeDefined();
      expect(screen.getByText('Journal')).toBeDefined();
    });

    it('renders first tab content by default', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
    });

    it('switches tab content when tab is clicked', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      fireEvent.click(screen.getByTestId('pi-tab-questions'));
      expect(screen.getByTestId('config-questions-content')).toBeDefined();
    });

    it('switches back to first tab when that tab is clicked', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      fireEvent.click(screen.getByTestId('pi-tab-questions'));
      fireEvent.click(screen.getByTestId('pi-tab-stats'));
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
    });

    it('shows badge on tab when badge > 0', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      expect(screen.getByText('5')).toBeDefined();
    });

    it('does not show badge when badge is 0', () => {
      const tabsWithZeroBadge = [{ id: 'a', label: 'A', badge: 0, content: <div>A</div> }];
      render(<PIPanelBase tabs={tabsWithZeroBadge} />);
      const badgeEls = screen.queryAllByText('0');
      expect(badgeEls.length).toBe(0);
    });

    it('wraps active tab content with correct data-testid', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      expect(screen.getByTestId('pi-tab-content-stats')).toBeDefined();
    });

    it('updates content wrapper testid on tab switch', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      fireEvent.click(screen.getByTestId('pi-tab-journal'));
      expect(screen.getByTestId('pi-tab-content-journal')).toBeDefined();
    });

    it('respects defaultTab prop', () => {
      render(<PIPanelBase tabs={tabsConfig} defaultTab="questions" />);
      expect(screen.getByTestId('config-questions-content')).toBeDefined();
    });
  });

  describe('overflow items', () => {
    it('renders overflow trigger button when overflowItems provided', () => {
      render(<PIPanelBase tabs={tabsConfig} overflowItems={overflowItems} />);
      expect(screen.getByTestId('pi-overflow-trigger')).toBeDefined();
    });

    it('does not render overflow trigger without overflowItems', () => {
      render(<PIPanelBase tabs={tabsConfig} />);
      expect(screen.queryByLabelText('More options')).toBeNull();
    });

    it('shows overflow menu items on trigger click', () => {
      render(<PIPanelBase tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      expect(screen.getByTestId('pi-overflow-item-data')).toBeDefined();
      expect(screen.getByTestId('pi-overflow-item-whatif')).toBeDefined();
    });

    it('shows overflow item content when selected', () => {
      render(<PIPanelBase tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(screen.getByTestId('config-data-content')).toBeDefined();
    });

    it('wraps overflow content with correct data-testid', () => {
      render(<PIPanelBase tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(screen.getByTestId('pi-overflow-content-data')).toBeDefined();
    });

    it('shows dismissible close button when overflow item is active', () => {
      render(<PIPanelBase tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(screen.getByTestId('pi-overflow-close-data')).toBeDefined();
    });

    it('closes overflow item and returns to tab content on close click', () => {
      render(<PIPanelBase tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      fireEvent.click(screen.getByTestId('pi-overflow-close-data'));
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
    });
  });

  describe('layout', () => {
    it('compact mode renders with scroll-touch class', () => {
      const { container } = render(<PIPanelBase tabs={tabsConfig} compact={true} />);
      expect(container.querySelector('.scroll-touch')).not.toBeNull();
    });

    it('desktop mode renders with bg-surface-secondary', () => {
      const { container } = render(<PIPanelBase tabs={tabsConfig} />);
      expect(container.querySelector('.bg-surface-secondary')).not.toBeNull();
    });

    it('applies custom className', () => {
      const { container } = render(<PIPanelBase tabs={tabsConfig} className="custom-class" />);
      expect(container.querySelector('.custom-class')).not.toBeNull();
    });
  });
});
