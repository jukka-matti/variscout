import { describe, it, expect } from 'vitest';
import { validateChannelCount, MAX_CHANNELS, CHANNEL_WARNING_THRESHOLD } from '../tier';

describe('validateChannelCount', () => {
  it('returns exceeded=false when count is under MAX_CHANNELS', () => {
    expect(validateChannelCount(500)).toEqual({
      exceeded: false,
      current: 500,
      max: MAX_CHANNELS,
      showWarning: false,
    });
  });

  it('returns exceeded=true when count exceeds MAX_CHANNELS', () => {
    expect(validateChannelCount(MAX_CHANNELS + 1)).toEqual({
      exceeded: true,
      current: MAX_CHANNELS + 1,
      max: MAX_CHANNELS,
      showWarning: false,
    });
  });

  it('returns showWarning=true when count is between warning threshold and max', () => {
    expect(validateChannelCount(CHANNEL_WARNING_THRESHOLD + 1)).toEqual({
      exceeded: false,
      current: CHANNEL_WARNING_THRESHOLD + 1,
      max: MAX_CHANNELS,
      showWarning: true,
    });
  });
});
