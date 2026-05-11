import { useState, useRef, useCallback } from 'react';
import type { ImageAttachment, PdfAttachment, FileAttachment } from '@/types';
import { isPdf, isImage } from '@/types';
import { useClipboardPaste, readImageFromClipboard } from '@/hooks/useClipboard';
import { useDragDrop } from '@/hooks/useDragDrop';
import { FilePreview } from './FilePreview';

interface Props {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  onSubmit: (text: string, images: ImageAttachment[], pdfs: PdfAttachment[]) => void;
  isStreaming: boolean;
  onAbort: () => void;
}

export function PromptInput({ files, onFilesChange, onSubmit, isStreaming, onAbort }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addImages = useCallback(
    (imgs: ImageAttachment[]) => {
      onFilesChange([...files, ...imgs]);
    },
    [files, onFilesChange]
  );

  const addPdfs = useCallback(
    (pdfs: PdfAttachment[]) => {
      onFilesChange([...files, ...pdfs]);
    },
    [files, onFilesChange]
  );

  const { handlePaste } = useClipboardPaste(addImages);
  const { isDragging, dragProps, processFiles } = useDragDrop({
    onImages: addImages,
    onPdfs: addPdfs,
  });

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !files.length) return;
    const images = files.filter(isImage);
    const pdfs = files.filter(isPdf);
    onSubmit(trimmed, images, pdfs);
    setText('');
    onFilesChange([]);
    textareaRef.current?.focus();
  }, [text, files, onSubmit, onFilesChange]);

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
      if (e.target.files) void processFiles(e.target.files);
      e.target.value = '';
    },
    [processFiles]
  );

  return (
    <div className={`prompt-input-root ${isDragging ? 'dragging' : ''}`} {...dragProps}>
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-overlay-inner">
            <span className="drop-icon">📂</span>
            <span>이미지 또는 PDF 파일을 놓으세요</span>
          </div>
        </div>
      )}

      <FilePreview
        files={files}
        onRemove={(id) => onFilesChange(files.filter((f) => f.id !== id))}
      />

      <div className="prompt-input-row">
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력 · 이미지/PDF를 붙여넣거나 드래그하세요…"
          rows={3}
          disabled={isStreaming}
        />

        <div className="prompt-actions">
          <label className="icon-btn" title="이미지·PDF 파일 선택">
            📎
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
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
              disabled={!text.trim() && !files.length}
            >
              전송 ↵
            </button>
          )}
        </div>
      </div>

      <p className="prompt-hint">
        Enter: 전송 · Shift+Enter: 줄바꿈 · 이미지/PDF Ctrl+V · 드래그 앤 드롭 가능
      </p>
    </div>
  );
}
