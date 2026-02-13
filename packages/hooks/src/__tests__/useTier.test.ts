/**
 * Tests for useTier hook
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { configureTier } from '@variscout/core';
import { useTier } from '../useTier';

describe('useTier hook', () => {
  beforeEach(() => {
    configureTier(null);
  });

  it('returns correct tier info for free tier', () => {
    const { result } = renderHook(() => useTier());

    expect(result.current.tier).toBe('free');
    expect(result.current.isPaid).toBe(false);
    expect(result.current.maxChannels).toBe(5);
    expect(result.current.description).toBe('Free (Demo)');
    expect(result.current.warningThreshold).toBe(700);
  });

  it('returns correct tier info for enterprise tier', () => {
    configureTier('enterprise');
    const { result } = renderHook(() => useTier());

    expect(result.current.tier).toBe('enterprise');
    expect(result.current.isPaid).toBe(true);
    expect(result.current.maxChannels).toBe(1500);
    expect(result.current.description).toBe('Enterprise');
  });

  it('returns upgrade URL containing Azure Marketplace', () => {
    const { result } = renderHook(() => useTier());

    expect(result.current.upgradeUrl).toContain('azuremarketplace.microsoft.com');
  });

  describe('validateChannels', () => {
    it('returns not exceeded for valid channel count', () => {
      const { result } = renderHook(() => useTier());
      const validation = result.current.validateChannels(3);

      expect(validation.exceeded).toBe(false);
      expect(validation.current).toBe(3);
      expect(validation.max).toBe(5);
    });

    it('returns exceeded for over-limit channel count on free tier', () => {
      const { result } = renderHook(() => useTier());
      const validation = result.current.validateChannels(6);

      expect(validation.exceeded).toBe(true);
      expect(validation.current).toBe(6);
      expect(validation.max).toBe(5);
    });

    it('shows warning at threshold for enterprise tier', () => {
      configureTier('enterprise');
      const { result } = renderHook(() => useTier());
      const validation = result.current.validateChannels(700);

      expect(validation.exceeded).toBe(false);
      expect(validation.showWarning).toBe(true);
    });
  });

  describe('getChannelWarning', () => {
    it('returns null when no warning needed', () => {
      const { result } = renderHook(() => useTier());
      const warning = result.current.getChannelWarning(3);

      expect(warning).toBeNull();
    });

    it('returns exceeded warning for free tier over limit', () => {
      const { result } = renderHook(() => useTier());
      const warning = result.current.getChannelWarning(6);

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('exceeded');
      expect(warning!.title).toBe('Free Tier Limit Reached');
      expect(warning!.showUpgrade).toBe(true);
    });

    it('returns exceeded warning for enterprise tier over limit', () => {
      configureTier('enterprise');
      const { result } = renderHook(() => useTier());
      const warning = result.current.getChannelWarning(1501);

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('exceeded');
      expect(warning!.title).toBe('Channel Limit Exceeded');
      expect(warning!.showUpgrade).toBe(false);
    });

    it('returns performance warning at threshold', () => {
      configureTier('enterprise');
      const { result } = renderHook(() => useTier());
      const warning = result.current.getChannelWarning(800);

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('performance');
      expect(warning!.title).toBe('Performance Advisory');
      expect(warning!.showUpgrade).toBe(false);
    });
  });
});
