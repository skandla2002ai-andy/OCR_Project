import { useCallback } from 'react';
import type { ImageAttachment } from '@/types';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
type AcceptedType = (typeof ACCEPTED_IMAGE_TYPES)[number];

function isAccepted(type: string): type is AcceptedType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

async function fileToAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        kind: 'image',
        id: crypto.randomUUID(),
        name: file.name || 'pasted-image',
        dataUrl: reader.result as string,
        mediaType: file.type as AcceptedType,
        size: file.size,
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useClipboardPaste(
  onImages: (imgs: ImageAttachment[]) => void,
  onText?: (text: string) => void
) {
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent | ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);

      const imageItems = items.filter((item) => item.kind === 'file' && isAccepted(item.type));

      if (imageItems.length > 0) {
        e.preventDefault();
        const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
        const attachments = await Promise.all(files.map(fileToAttachment));
        onImages(attachments);
        return;
      }

      const textItem = items.find((item) => item.kind === 'string' && item.type === 'text/plain');
      if (textItem && onText) {
        textItem.getAsString((text) => onText(text));
      }
    },
    [onImages, onText]
  );

  return { handlePaste };
}

export async function readImageFromClipboard(): Promise<ImageAttachment | null> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (isAccepted(type)) {
          const blob = await item.getType(type);
          const file = new File([blob], 'clipboard-image', { type });
          return fileToAttachment(file);
        }
      }
    }
  } catch {
    // Clipboard API not available or permission denied
  }
  return null;
}
