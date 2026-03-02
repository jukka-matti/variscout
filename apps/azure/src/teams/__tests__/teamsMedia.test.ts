import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock teamsContext
const mockIsInTeams = vi.fn();
vi.mock('../teamsContext', () => ({
  isInTeams: () => mockIsInTeams(),
}));

// Mock @microsoft/teams-js media module
type SelectMediaCallback = (err: unknown, attachments: unknown[] | null) => void;
const mockSelectMedia = vi.fn();

vi.mock('@microsoft/teams-js', () => ({
  media: {
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

      const mod = await loadModule();
      expect(mod.isTeamsMediaAvailable()).toBe(false);
    });

    it('returns true when in Teams and selectMedia is a function', async () => {
      mockIsInTeams.mockReturnValue(true);

      const mod = await loadModule();
      expect(mod.isTeamsMediaAvailable()).toBe(true);
    });
  });

  describe('capturePhotoFromTeams', () => {
    it('returns null when user cancels (empty result)', async () => {
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, []);
      });

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();
      expect(result).toBeNull();
    });

    it('returns null when selectMedia returns null attachments', async () => {
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, null);
      });

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();
      expect(result).toBeNull();
    });

    it('returns a File when photo is captured successfully', async () => {
      const testBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, [
          {
            name: 'camera_photo.jpg',
            getMedia: (mediaCb: (err: null, blob: Blob) => void) => mediaCb(null, testBlob),
          },
        ]);
      });

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();

      expect(result).toBeInstanceOf(File);
      expect(result!.name).toBe('camera_photo.jpg');
      expect(result!.type).toBe('image/jpeg');
    });

    it('uses fallback filename when name is missing', async () => {
      const testBlob = new Blob(['data'], { type: 'image/jpeg' });
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, [
          {
            name: undefined,
            getMedia: (mediaCb: (err: null, blob: Blob) => void) => mediaCb(null, testBlob),
          },
        ]);
      });

      const mod = await loadModule();
      const result = await mod.capturePhotoFromTeams();

      expect(result).toBeInstanceOf(File);
      expect(result!.name).toMatch(/^teams_photo_\d+\.jpg$/);
    });

    it('rejects when selectMedia returns an error', async () => {
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb({ message: 'Not supported', errorCode: 100 }, []);
      });

      const mod = await loadModule();
      await expect(mod.capturePhotoFromTeams()).rejects.toThrow('Not supported');
    });

    it('rejects when getMedia returns an error', async () => {
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, [
          {
            name: 'photo.jpg',
            getMedia: (mediaCb: (err: { message: string; errorCode: number }) => void) =>
              mediaCb({ message: 'Permission denied', errorCode: 500 }),
          },
        ]);
      });

      const mod = await loadModule();
      await expect(mod.capturePhotoFromTeams()).rejects.toThrow('Permission denied');
    });

    it('rejects when getMedia returns no blob', async () => {
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, [
          {
            name: 'photo.jpg',
            getMedia: (mediaCb: (err: null, blob: null) => void) => mediaCb(null, null),
          },
        ]);
      });

      const mod = await loadModule();
      await expect(mod.capturePhotoFromTeams()).rejects.toThrow('No media returned');
    });

    it('passes correct config to selectMedia', async () => {
      mockSelectMedia.mockImplementation((_config: unknown, cb: SelectMediaCallback) => {
        cb(null, []);
      });

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
        }),
        expect.any(Function)
      );
    });
  });
});
