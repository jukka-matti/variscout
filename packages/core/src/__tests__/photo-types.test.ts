/**
 * Tests for PhotoAttachment types and createPhotoAttachment factory
 */
import { describe, it, expect } from 'vitest';
import { createPhotoAttachment } from '../findings';
import type { PhotoAttachment, PhotoUploadStatus } from '../findings';

describe('createPhotoAttachment', () => {
  it('creates a photo attachment with default pending status', () => {
    const photo = createPhotoAttachment('test_photo.jpg');

    expect(photo.id).toBeTruthy();
    expect(photo.filename).toBe('test_photo.jpg');
    expect(photo.uploadStatus).toBe('pending');
    expect(photo.capturedAt).toBeGreaterThan(0);
    expect(photo.driveItemId).toBeUndefined();
    expect(photo.thumbnailDataUrl).toBeUndefined();
  });

  it('generates unique IDs for each attachment', () => {
    const photo1 = createPhotoAttachment('a.jpg');
    const photo2 = createPhotoAttachment('b.jpg');

    expect(photo1.id).not.toBe(photo2.id);
  });

  it('preserves the filename as given', () => {
    const photo = createPhotoAttachment('my_cool_photo_2026.jpg');
    expect(photo.filename).toBe('my_cool_photo_2026.jpg');
  });

  it('has correct type shape', () => {
    const photo: PhotoAttachment = {
      id: 'test-id',
      filename: 'photo.jpg',
      driveItemId: 'drive-123',
      thumbnailDataUrl: 'data:image/jpeg;base64,abc',
      uploadStatus: 'uploaded',
      capturedAt: 1000,
    };

    expect(photo.uploadStatus).toBe('uploaded');
    expect(photo.driveItemId).toBe('drive-123');
    expect(photo.thumbnailDataUrl).toBe('data:image/jpeg;base64,abc');
  });

  it('PhotoUploadStatus type accepts valid values', () => {
    const statuses: PhotoUploadStatus[] = ['pending', 'uploaded', 'failed'];
    expect(statuses).toHaveLength(3);
  });
});
