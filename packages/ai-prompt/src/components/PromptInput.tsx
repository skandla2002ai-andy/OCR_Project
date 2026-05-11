import { useState, useRef, useCallback } from 'react';
import type { ImageAttachment } from '@/types';
import { useClipboardPaste, readImageFromClipboard } from '@/hooks/useClipboard';
import { ImagePreview } from './ImagePreview';

interface Props {
  onSubmit: (text: string, images: ImageAttachment[]) => void;
  isStreaming: boolean;
  onAbort: () => void;
}

export function PromptInput({ onSubmit, isStreaming, onAbort }: Props) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addImages = useCallback((imgs: ImageAttachment[]) => {
    setImages((prev) => [...prev, ...imgs]);
  }, []);

  const { handlePaste } = useClipboardPaste(addImages);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !images.length) return;
    onSubmit(trimmed, images);
    setText('');
    setImages([]);
    textareaRef.current?.focus();
  }, [text, images, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleImageButton = useCallback(async () => {
    const img = await readImageFromClipboard();
    if (img) addImages([img]);
  }, [addImages]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const readers = files.map(
        (file) =>
          new Promise<ImageAttachment>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                dataUrl: reader.result as string,
                mediaType: file.type as ImageAttachment['mediaType'],
                size: file.size,
              });
            reader.readAsDataURL(file);
          })
      );
      void Promise.all(readers).then(addImages);
      e.target.value = '';
    },
    [addImages]
  );

  return (
    <div className="prompt-input-root">
      <ImagePreview
        images={images}
        onRemove={(id) => setImages((p) => p.filter((i) => i.id !== id))}
      />

      <div className="prompt-input-row">
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하거나 이미지를 붙여넣으세요 (Ctrl+V / Cmd+V)…"
          rows={3}
          disabled={isStreaming}
        />

        <div className="prompt-actions">
          <label className="icon-btn" title="파일에서 이미지 추가">
            📎
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </label>

          <button
            type="button"
            className="icon-btn"
            title="클립보드 이미지 붙여넣기"
            onClick={handleImageButton}
          >
            🖼
          </button>

          {isStreaming ? (
            <button type="button" className="send-btn abort-btn" onClick={onAbort}>
              ■ 중지
            </button>
          ) : (
            <button
              type="button"
              className="send-btn"
              onClick={handleSubmit}
              disabled={!text.trim() && !images.length}
            >
              전송 ↵
            </button>
          )}
        </div>
      </div>

      <p className="prompt-hint">Enter: 전송 · Shift+Enter: 줄바꿈 · 이미지 Ctrl+V 가능</p>
    </div>
  );
}
