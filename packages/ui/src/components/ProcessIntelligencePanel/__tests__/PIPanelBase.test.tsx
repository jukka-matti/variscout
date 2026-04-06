import { describe, it, expect, vi } from 'vitest';
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

  describe('controlled tab mode', () => {
    it('renders the content for the controlled activeTab prop', () => {
      render(<PIPanelBase tabs={tabsConfig} activeTab="questions" />);
      expect(screen.getByTestId('config-questions-content')).toBeDefined();
      expect(screen.queryByTestId('config-stats-content')).toBeNull();
    });

    it('calls onTabChange when a tab is clicked in controlled mode', () => {
      const onTabChange = vi.fn();
      render(<PIPanelBase tabs={tabsConfig} activeTab="stats" onTabChange={onTabChange} />);
      fireEvent.click(screen.getByTestId('pi-tab-questions'));
      expect(onTabChange).toHaveBeenCalledWith('questions');
    });

    it('does not change displayed content without external state update in controlled mode', () => {
      const onTabChange = vi.fn();
      render(<PIPanelBase tabs={tabsConfig} activeTab="stats" onTabChange={onTabChange} />);
      fireEvent.click(screen.getByTestId('pi-tab-journal'));
      // activeTab prop is still 'stats' — content unchanged
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
      expect(screen.queryByTestId('config-journal-content')).toBeNull();
      expect(onTabChange).toHaveBeenCalledWith('journal');
    });

    it('updates displayed content when activeTab prop changes externally', () => {
      const { rerender } = render(<PIPanelBase tabs={tabsConfig} activeTab="stats" />);
      expect(screen.getByTestId('config-stats-content')).toBeDefined();

      rerender(<PIPanelBase tabs={tabsConfig} activeTab="journal" />);
      expect(screen.getByTestId('config-journal-content')).toBeDefined();
      expect(screen.queryByTestId('config-stats-content')).toBeNull();
    });

    it('controlled mode works in compact layout', () => {
      render(<PIPanelBase tabs={tabsConfig} compact={true} activeTab="questions" />);
      expect(screen.getByTestId('config-questions-content')).toBeDefined();
    });
  });

  describe('overflow items with onSelect callback', () => {
    it('calls onSelect callback and does not show inline content', () => {
      const onSelect = vi.fn();
      const items: PIPanelBaseProps['overflowItems'] = [
        { id: 'modal-item', label: 'Open Modal', onSelect },
      ];

      render(<PIPanelBase tabs={tabsConfig} overflowItems={items} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-modal-item'));

      expect(onSelect).toHaveBeenCalledWith('modal-item');
      // Tab content still shown — no inline overflow content
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
      expect(screen.queryByTestId('pi-overflow-content-modal-item')).toBeNull();
    });

    it('does not show close button after onSelect item is clicked', () => {
      const onSelect = vi.fn();
      const items: PIPanelBaseProps['overflowItems'] = [
        { id: 'data', label: 'Data Table', onSelect },
      ];

      render(<PIPanelBase tabs={tabsConfig} overflowItems={items} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));

      expect(screen.queryByTestId('pi-overflow-close-data')).toBeNull();
    });

    it('handles mix of inline-content and onSelect overflow items', () => {
      const onSelect = vi.fn();
      const items: PIPanelBaseProps['overflowItems'] = [
        {
          id: 'whatif',
          label: 'What-If',
          content: <div data-testid="whatif-content">Simulator</div>,
        },
        { id: 'data', label: 'Data Table', onSelect },
      ];

      render(<PIPanelBase tabs={tabsConfig} overflowItems={items} />);

      // Trigger onSelect item
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(onSelect).toHaveBeenCalledWith('data');
      expect(screen.queryByTestId('whatif-content')).toBeNull();

      // Now open the inline item
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-whatif'));
      expect(screen.getByTestId('whatif-content')).toBeDefined();
    });
  });
});
