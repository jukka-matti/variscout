import React from 'react';
import { X } from 'lucide-react';

export interface ImagePreviewItem {
  id: string;
  dataUrl: string;
  filename?: string;
  mimeType?: string;
}

export interface ImagePreviewProps {
  images: ImagePreviewItem[];
  onRemove: (id: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images, onRemove }) => {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 px-3 pb-2 flex-wrap" data-testid="image-preview-row">
      {images.map(image => (
        <div
          key={image.id}
          className="relative flex-shrink-0 rounded-md overflow-hidden border border-edge"
          data-testid={`image-preview-${image.id}`}
        >
          <img
            src={image.dataUrl}
            alt={image.filename ?? 'Attached image'}
            className="block object-cover"
            style={{ maxHeight: 120, maxWidth: 120 }}
          />
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            aria-label={`Remove ${image.filename ?? 'image'}`}
            className="absolute top-0.5 right-0.5 p-0.5 bg-surface-secondary/80 hover:bg-surface-secondary rounded text-content-secondary hover:text-content transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

export { ImagePreview };
