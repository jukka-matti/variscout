import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock @variscout/core
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    isTeamAIPlan: vi.fn(),
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

import { AdminKnowledgeSetup } from '../AdminKnowledgeSetup';
import { isTeamAIPlan, isPreviewEnabled, setPreviewEnabled } from '@variscout/core';
import { isKnowledgeBaseAvailable } from '../../services/searchService';
import { getRuntimeConfig } from '../../lib/runtimeConfig';

const mockIsTeamAIPlan = vi.mocked(isTeamAIPlan);
const mockIsPreviewEnabled = vi.mocked(isPreviewEnabled);
const mockSetPreviewEnabled = vi.mocked(setPreviewEnabled);
const mockIsKnowledgeBaseAvailable = vi.mocked(isKnowledgeBaseAvailable);
const mockGetRuntimeConfig = vi.mocked(getRuntimeConfig);

describe('AdminKnowledgeSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTeamAIPlan.mockReturnValue(true);
    mockIsPreviewEnabled.mockReturnValue(true);
    mockIsKnowledgeBaseAvailable.mockReturnValue(true);
    mockGetRuntimeConfig.mockReturnValue({
      plan: 'enterprise',
      functionUrl: '',
      aiEndpoint: '',
      aiSearchEndpoint: 'https://search.example.com',
      aiSearchIndex: 'findings',
    });
  });

  it('renders heading and preview badge', () => {
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows Team AI plan active when isTeamAIPlan returns true', () => {
    mockIsTeamAIPlan.mockReturnValue(true);
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Team AI plan')).toBeInTheDocument();
    expect(screen.getByText('(Active)')).toBeInTheDocument();
  });

  it('shows Team AI plan required when isTeamAIPlan returns false', () => {
    mockIsTeamAIPlan.mockReturnValue(false);
    render(<AdminKnowledgeSetup />);
    expect(screen.getByText('Team AI plan')).toBeInTheDocument();
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
      functionUrl: '',
      aiEndpoint: '',
      aiSearchEndpoint: '',
      aiSearchIndex: '',
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

  it('disables toggle button when not Team AI plan', () => {
    mockIsTeamAIPlan.mockReturnValue(false);
    render(<AdminKnowledgeSetup />);

    const toggleButton = screen.getByRole('button', { name: /preview/i });
    expect(toggleButton).toBeDisabled();
  });
});
