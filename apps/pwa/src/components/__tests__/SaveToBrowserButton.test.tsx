// apps/pwa/src/components/__tests__/SaveToBrowserButton.test.tsx
import 'fake-indexeddb/auto';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveToBrowserButton } from '../SaveToBrowserButton';
import { hubRepository } from '../../db/hubRepository';
import { pwaHubRepository } from '../../persistence';
import { DEFAULT_PROCESS_HUB } from '@variscout/core/processHub';

const hub = { ...DEFAULT_PROCESS_HUB, processGoal: 'Test goal.' };

describe('SaveToBrowserButton', () => {
  beforeEach(async () => {
    await hubRepository.clearAll();
  });

  it('shows "Save to this browser" when not opted in', async () => {
    render(<SaveToBrowserButton currentHub={hub} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save to this browser/i })).toBeInTheDocument()
    );
  });

  it('clicking save opts in + persists Hub', async () => {
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /save to this browser/i }));
    await waitFor(async () => expect(await hubRepository.getOptInFlag()).toBe(true));
    expect(await hubRepository.loadHub()).toMatchObject({ processGoal: 'Test goal.' });
  });

  it('after opt-in, button shows "Saved · Forget"', async () => {
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub(hub);
    render(<SaveToBrowserButton currentHub={hub} />);
    expect(await screen.findByRole('button', { name: /saved.*forget/i })).toBeInTheDocument();
  });

  it('clicking Forget after confirm clears persistence', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await hubRepository.setOptInFlag(true);
    await hubRepository.saveHub(hub);
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /saved.*forget/i }));
    await waitFor(async () => expect(await hubRepository.getOptInFlag()).toBe(false));
    expect(await hubRepository.loadHub()).toBeNull();
  });

  it('clicking save routes through pwaHubRepository.dispatch with HUB_PERSIST_SNAPSHOT', async () => {
    // Verifies the dispatch path is exercised — the write goes through
    // pwaHubRepository.dispatch rather than hubRepository.saveHub directly.
    const dispatchSpy = vi.spyOn(pwaHubRepository, 'dispatch');
    render(<SaveToBrowserButton currentHub={hub} />);
    fireEvent.click(await screen.findByRole('button', { name: /save to this browser/i }));
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalled());
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'HUB_PERSIST_SNAPSHOT',
        hub: expect.objectContaining({ processGoal: 'Test goal.' }),
      })
    );
    dispatchSpy.mockRestore();
  });
});
