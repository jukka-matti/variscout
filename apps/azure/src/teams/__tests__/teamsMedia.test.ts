import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock teamsContext
const mockIsInTeams = vi.fn();
vi.mock('../teamsContext', () => ({
  isInTeams: () => mockIsInTeams(),
}));

// Mock @microsoft/teams-js media module
const mockIsSupported = vi.fn();
const mockSelectMedia = vi.fn();

vi.mock('@microsoft/teams-js', () => ({
  media: {
    isSupported: () => mockIsSupported(),
    selectMedia: (...args: unknown[]) => mockSelectMedia(...args),
    MediaType: { Image: 1 },
    Source: { Camera: 1, Gallery: 2 },
    CameraStartMode: { Photo: 1 },
  },
}));

describe('teamsMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function loadModule() {
    return import('../teamsMedia');
  }

  describe('isTeamsMediaAvailable', () => {
    it('returns false when not in Teams', async () => {
      mockIsInTeams.mockReturnValue(false);
      mockIsSupported.mockReturnValue(true);

      const mod = await loadModule();
      expect(mod.isTeamsMediaAvailable()).toBe(false);
    });

    it('returns false when media is not supported', async () => {
      mockIsInTeams.mockReturnValue(true);
      mockIsSupported.mockReturnValue(false);

      const mod = await loadModule();
      expect(mod.isTeamsMediaAvailable()).toBe(false);
    });

    it('returns true when in Teams and media is supported', async () => {
      mockIsInTeams.mockReturnValue(true);
      mockIsSupported.mockReturnValue(true);

      const mod = await loadModule();
      expect(mod.isTeamsMediaAvailable()).toBe(true);
    });
  });

  describe('capturePhotoFromTeams', () => {
    it('returns null when user cancels (empty result)', async () => {
      mockSelectMedia.mockResolvedValueOnce([]);

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();
      expect(result).toBeNull();
    });

    it('returns null when selectMedia returns null', async () => {
      mockSelectMedia.mockResolvedValueOnce(null);

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();
      expect(result).toBeNull();
    });

    it('returns a File when photo is captured successfully', async () => {
      const testBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      mockSelectMedia.mockResolvedValueOnce([
        {
          name: 'camera_photo.jpg',
          getMedia: (cb: (err: null, blob: Blob) => void) => cb(null, testBlob),
        },
      ]);

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();

      expect(result).toBeInstanceOf(File);
      expect(result!.name).toBe('camera_photo.jpg');
      expect(result!.type).toBe('image/jpeg');
    });

    it('uses fallback filename when name is missing', async () => {
      const testBlob = new Blob(['data'], { type: 'image/jpeg' });
      mockSelectMedia.mockResolvedValueOnce([
        {
          name: undefined,
          getMedia: (cb: (err: null, blob: Blob) => void) => cb(null, testBlob),
        },
      ]);

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();

      expect(result).toBeInstanceOf(File);
      expect(result!.name).toMatch(/^teams_photo_\d+\.jpg$/);
    });

    it('rejects when getMedia returns an error', async () => {
      mockSelectMedia.mockResolvedValueOnce([
        {
          name: 'photo.jpg',
          getMedia: (cb: (err: { message: string; errorCode: number }) => void) =>
            cb({ message: 'Permission denied', errorCode: 500 }),
        },
      ]);

      const mod = await loadModule();
      await expect(mod.capturePhotoFromTeams()).rejects.toThrow('Permission denied');
    });

    it('rejects when getMedia returns no blob', async () => {
      mockSelectMedia.mockResolvedValueOnce([
        {
          name: 'photo.jpg',
          getMedia: (cb: (err: null, blob: null) => void) => cb(null, null),
        },
      ]);

      const mod = await loadModule();
      await expect(mod.capturePhotoFromTeams()).rejects.toThrow('No media returned');
    });

    it('passes correct config to selectMedia', async () => {
      mockSelectMedia.mockResolvedValueOnce([]);

      const mod = await loadModule();
      await mod.capturePhotoFromTeams();

      expect(mockSelectMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          maxMediaCount: 1,
          imageProps: expect.objectContaining({
            ink: false,
            enableFilter: false,
            cameraSwitcher: true,
          }),
        })
      );
    });
  });
});
