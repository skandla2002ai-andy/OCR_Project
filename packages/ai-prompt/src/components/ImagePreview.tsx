import type { ImageAttachment } from '@/types';

interface Props {
  images: ImageAttachment[];
  onRemove: (id: string) => void;
}

export function ImagePreview({ images, onRemove }: Props) {
  if (!images.length) return null;

  return (
    <div className="image-preview-bar">
      {images.map((img) => (
        <div key={img.id} className="image-thumb-wrap">
          <img src={img.dataUrl} alt={img.name} className="image-thumb" />
          <button
            type="button"
            className="image-thumb-remove"
            onClick={() => onRemove(img.id)}
            aria-label="이미지 삭제"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
