/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePreview } from '../ImagePreview';

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
}));

describe('ImagePreview', () => {
  it('renders image thumbnails', () => {
    const images = [{ id: '1', dataUrl: 'data:image/jpeg;base64,abc', filename: 'photo.jpg' }];
    render(<ImagePreview images={images} onRemove={vi.fn()} />);
    expect(screen.getByAltText('photo.jpg')).toBeInTheDocument();
  });

  it('calls onRemove when X clicked', () => {
    const onRemove = vi.fn();
    const images = [{ id: '1', dataUrl: 'data:image/jpeg;base64,abc' }];
    render(<ImagePreview images={images} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('renders nothing when no images', () => {
    const { container } = render(<ImagePreview images={[]} onRemove={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple images', () => {
    const images = [
      { id: '1', dataUrl: 'data:image/jpeg;base64,abc', filename: 'first.jpg' },
      { id: '2', dataUrl: 'data:image/png;base64,def', filename: 'second.png' },
    ];
    render(<ImagePreview images={images} onRemove={vi.fn()} />);
    expect(screen.getByAltText('first.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('second.png')).toBeInTheDocument();
  });

  it('uses fallback alt text when filename is absent', () => {
    const images = [{ id: '1', dataUrl: 'data:image/jpeg;base64,abc' }];
    render(<ImagePreview images={images} onRemove={vi.fn()} />);
    expect(screen.getByAltText('Attached image')).toBeInTheDocument();
  });

  it('renders a remove button per image', () => {
    const images = [
      { id: '1', dataUrl: 'data:image/jpeg;base64,abc', filename: 'a.jpg' },
      { id: '2', dataUrl: 'data:image/png;base64,def', filename: 'b.png' },
    ];
    render(<ImagePreview images={images} onRemove={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(2);
  });
});
