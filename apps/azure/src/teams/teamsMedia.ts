/**
 * Teams SDK camera integration — uses media.selectMedia() when running
 * inside Teams for IT-auditable camera access via devicePermissions.
 *
 * Falls back to standard HTML file input when not in Teams or when
 * media capability is not available (e.g. desktop web, popout windows).
 */

import { media } from '@microsoft/teams-js';
import { isInTeams } from './teamsContext';

/**
 * Whether Teams media API is available at runtime.
 * Returns false outside Teams, on desktop web, or in popout windows.
 */
export function isTeamsMediaAvailable(): boolean {
  return isInTeams() && media.isSupported();
}

/**
 * Capture a photo using the Teams native camera/gallery picker.
 *
 * Returns a File that can be passed directly to processPhoto().
 * Returns null if the user cancels the picker.
 */
export async function capturePhotoFromTeams(): Promise<File | null> {
  const config: media.MediaInputs = {
    mediaType: media.MediaType.Image,
    maxMediaCount: 1,
    imageProps: {
      sources: [media.Source.Camera, media.Source.Gallery],
      startMode: media.CameraStartMode.Photo,
      ink: false,
      cameraSwitcher: true,
      textSticker: false,
      enableFilter: false,
    },
  };

  const result = await media.selectMedia(config);
  if (!result || result.length === 0) return null;

  const selected = result[0];

  // getMedia() returns the full blob via callback
  const blob = await new Promise<Blob>((resolve, reject) => {
    selected.getMedia((err, b) => {
      if (err) reject(new Error(err.message || `Teams media error: ${err.errorCode}`));
      else if (b) resolve(b);
      else reject(new Error('No media returned'));
    });
  });

  return new File([blob], selected.name || `teams_photo_${Date.now()}.jpg`, {
    type: blob.type || 'image/jpeg',
  });
}
