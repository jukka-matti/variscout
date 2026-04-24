import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock @variscout/core
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    hasTeamFeatures: vi.fn(),
    isPreviewEnabled: vi.fn(),
    setPreviewEnabled: vi.fn(),
  };
});

// Mock searchService
vi.mock('../../services/searchService', () => ({
  isKnowledgeBaseAvailable: vi.fn(),
}));

// Mock runtimeConfig
vi.mock('../../lib/runtimeConfig', () => ({
  getRuntimeConfig: vi.fn(),
}));

import { AdminKnowledgeSetup } from '../admin/AdminKnowledgeSetup';
import { hasTeamFeatures, isPreviewEnabled, setPreviewEnabled } from '@variscout/core';
import { isKnowledgeBaseAvailable } from '../../services/searchService';
import { getRuntimeConfig } from '../../lib/runtimeConfig';

const mockHasTeamFeatures = vi.mocked(hasTeamFeatures);
const mockIsPreviewEnabled = vi.mocked(isPreviewEnabled);
const mockSetPreviewEnabled = vi.mocked(setPreviewEnabled);
const mockIsKnowledgeBaseAvailable = vi.mocked(isKnowledgeBaseAvailable);
const mockGetRuntimeConfig = vi.mocked(getRuntimeConfig);

describe('AdminKnowledgeSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasTeamFeatures.mockReturnValue(true);
    mockIsPreviewEnabled.mockReturnValue(true);
    mockIsKnowledgeBaseAvailable.mockReturnValue(true);
    mockGetRuntimeConfig.mockReturnValue({
      plan: 'enterprise',
      aiEndpoint: '',
      aiSearchEndpoint: 'https://search.example.com',
      aiSearchIndex: 'findings',
      appInsightsConnectionString: '',
      voiceInputEnabled: false,
      speechToTextDeployment: '',
    });
  });

  it('renders heading and preview badge', () => {
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows Team plan active when hasTeamFeatures returns true', () => {
    mockHasTeamFeatures.mockReturnValue(true);
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Team plan')).toBeInTheDocument();
    expect(screen.getByText('(Active)')).toBeInTheDocument();
  });

  it('shows Team plan required when hasTeamFeatures returns false', () => {
    mockHasTeamFeatures.mockReturnValue(false);
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Team plan')).toBeInTheDocument();
    expect(screen.getByText('(Required)')).toBeInTheDocument();
  });

  it('shows search endpoint configured when aiSearchEndpoint is present', () => {
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Search endpoint configured')).toBeInTheDocument();
    expect(screen.getByText('(https://search.example.com)')).toBeInTheDocument();
  });

  it('shows search endpoint not configured when aiSearchEndpoint is missing', () => {
    mockGetRuntimeConfig.mockReturnValue({
      plan: '',
      aiEndpoint: '',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
      appInsightsConnectionString: '',
      voiceInputEnabled: false,
      speechToTextDeployment: '',
    });
    // Also clear env var
    import.meta.env.VITE_AI_SEARCH_ENDPOINT = '';
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('(Not configured)')).toBeInTheDocument();
  });

  it('shows preview enabled status', () => {
    mockIsPreviewEnabled.mockReturnValue(true);
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Preview feature enabled')).toBeInTheDocument();
    expect(screen.getByText('(On)')).toBeInTheDocument();
  });

  it('toggle button calls setPreviewEnabled', () => {
    mockIsPreviewEnabled.mockReturnValue(false);
    render(<AdminKnowledgeSetup />);

    const toggleButton = screen.getByRole('button', { name: /enable preview/i });
    fireEvent.click(toggleButton);

    expect(mockSetPreviewEnabled).toHaveBeenCalledWith('knowledge-base', true);
  });

  it('disables toggle button when not Team plan', () => {
    mockHasTeamFeatures.mockReturnValue(false);
    render(<AdminKnowledgeSetup />);

    const toggleButton = screen.getByRole('button', { name: /preview/i });
    expect(toggleButton).toBeDisabled();
  });
});
