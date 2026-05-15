import { useState, useCallback, useRef } from 'react';
import type { ImageAttachment, PdfAttachment } from '@/types';
import { loadPdf } from '@/services/pdf';

const ACCEPTED_IMAGE = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const ACCEPTED_PDF = ['application/pdf'];

interface UseDragDropOptions {
  onImages: (imgs: ImageAttachment[]) => void;
  onPdfs: (pdfs: PdfAttachment[]) => void;
}

async function fileToImage(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        kind: 'image',
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: reader.result as string,
        mediaType: file.type as ImageAttachment['mediaType'],
        size: file.size,
      });
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

async function fileToPdf(file: File): Promise<PdfAttachment> {
  const { blobUrl, pageCount, text } = await loadPdf(file);
  return {
    kind: 'pdf',
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    blobUrl,
    pageCount,
    text,
  };
}

export function useDragDrop({ onImages, onPdfs }: UseDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const imageFiles = files.filter((f) => ACCEPTED_IMAGE.includes(f.type));
      const pdfFiles = files.filter((f) => ACCEPTED_PDF.includes(f.type));

      if (imageFiles.length > 0) {
        const images = await Promise.all(imageFiles.map(fileToImage));
        onImages(images);
      }
      if (pdfFiles.length > 0) {
        const pdfs = await Promise.all(pdfFiles.map(fileToPdf));
        onPdfs(pdfs);
      }
    },
    [onImages, onPdfs]
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      void processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return { isDragging, dragProps: { onDragEnter, onDragLeave, onDragOver, onDrop }, processFiles };
}
