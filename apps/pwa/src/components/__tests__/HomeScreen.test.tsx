import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// vi.mock() BEFORE component imports — prevents infinite-loop hang.
vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      tf: (key: string) => key,
      locale: 'en' as const,
      formatNumber: (v: number) => String(v),
    }),
  };
});

vi.mock('../data/SampleSection', () => ({
  default: () => <div data-testid="sample-section" />,
}));

vi.mock('../VrsImportButton', () => ({
  VrsImportButton: () => <div data-testid="vrs-import-button" />,
}));

import HomeScreen from '../HomeScreen';
import {
  useProjectMembershipStore,
  getProjectMembershipInitialState,
  projectMembershipStorageKey,
} from '@variscout/stores';
import type { Invitation } from '@variscout/core/projectMembership';

const inviteA: Invitation = {
  id: 'inv-1',
  projectId: 'ip-1',
  createdAt: 1,
  deletedAt: null,
  userId: 'mira@org',
  displayName: 'Mira',
  role: 'member',
  invitedAt: 1,
  status: 'pending',
};

const defaultProps = {
  onLoadSample: vi.fn(),
  onOpenPaste: vi.fn(),
  onOpenManualEntry: vi.fn(),
};

describe('HomeScreen — PendingInvitesBanner integration', () => {
  beforeEach(() => {
    useProjectMembershipStore.setState(getProjectMembershipInitialState());
  });

  it('does not render the banner when there are no pending invites', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.queryByRole('region', { name: /pending invitations/i })).not.toBeInTheDocument();
  });

  it('renders the banner when pending invites exist', () => {
    // PWA uses 'analyst@local' as the stable per-user membership key (see HomeScreen.tsx);
    // invitesByUser is keyed by the full storage key (URL-encoded), not the raw userId.
    useProjectMembershipStore.setState({
      invitesByUser: { [projectMembershipStorageKey('analyst@local')]: [inviteA] },
    });
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByRole('region', { name: /pending invitations/i })).toBeInTheDocument();
  });
});
