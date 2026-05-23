import { useState, useRef, useEffect, useCallback } from 'react';
import type { FileAttachment, ImageAttachment } from '@/types';
import { isPdf, isImage } from '@/types';
import { revokePdfUrl } from '@/services/pdf';

interface Props {
  pendingFiles: FileAttachment[];
  conversationImages: ImageAttachment[];
  onRemovePending: (id: string) => void;
  width: number;
  onWidthChange: (w: number) => void;
  onClose: () => void;
}

export function ViewerPanel({
  pendingFiles,
  conversationImages,
  onRemovePending,
  width,
  onWidthChange,
  onClose,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  // 모든 미리볼 수 있는 파일 = pending(전체) + 대화의 이미지
  const allFiles: (FileAttachment & { fromConv?: boolean })[] = [
    ...pendingFiles,
    ...conversationImages
      .filter((img) => !pendingFiles.some((p) => p.id === img.id))
      .map((img) => ({ ...img, fromConv: true as const })),
  ];

  // 선택 파일이 목록에서 사라지면 첫 번째로 fallback
  const selected = allFiles.find((f) => f.id === selectedId) ?? allFiles[0] ?? null;

  useEffect(() => {
    if (!selectedId && allFiles.length > 0) setSelectedId(allFiles[0].id);
  }, [allFiles.length]); // eslint-disable-line

  // ── 리사이즈 핸들 ──────────────────────────────────────────
  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startX.current = e.clientX;
      startW.current = width;
      e.preventDefault();
    },
    [width]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      onWidthChange(Math.max(220, Math.min(680, startW.current + delta)));
    };
    const onUp = () => {
      isResizing.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onWidthChange]);

  const handleRemove = useCallback(
    (file: FileAttachment) => {
      if (isPdf(file)) revokePdfUrl(file.blobUrl);
      onRemovePending(file.id);
      setSelectedId(null);
    },
    [onRemovePending]
  );

  return (
    <div className="viewer-panel" style={{ width }}>
      {/* 헤더 */}
      <div className="viewer-header">
        <span className="viewer-title">파일 뷰어</span>
        <span className="viewer-count">{allFiles.length}개</span>
        <button type="button" className="icon-btn viewer-close" onClick={onClose} title="닫기">
          ✕
        </button>
      </div>

      {/* 썸네일 목록 */}
      <div className="viewer-thumb-bar">
        {allFiles.length === 0 ? (
          <span className="viewer-no-files">첨부 파일 없음</span>
        ) : (
          allFiles.map((file) => (
            <ThumbItem
              key={file.id}
              file={file}
              isSelected={file.id === selected?.id}
              isPending={!('fromConv' in file && file.fromConv)}
              onClick={() => setSelectedId(file.id)}
              onRemove={
                !('fromConv' in file && file.fromConv) ? () => handleRemove(file) : undefined
              }
            />
          ))
        )}
      </div>

      {/* 미리보기 영역 */}
      <div className="viewer-preview">
        {selected == null && (
          <div className="viewer-placeholder">
            <span>📂</span>
            <p>
              파일을 첨부하면
              <br />
              여기서 바로 확인할 수 있습니다
            </p>
          </div>
        )}

        {selected && isImage(selected) && (
          <div className="viewer-img-wrap">
            <img src={selected.dataUrl} alt={selected.name} className="viewer-img" />
            <span className="viewer-filename">{selected.name}</span>
          </div>
        )}

        {selected && isPdf(selected) && (
          <div className="viewer-pdf-wrap">
            <div className="viewer-pdf-info">
              📄 {selected.name}
              <span className="viewer-pdf-pages">{selected.pageCount}페이지</span>
            </div>
            <iframe src={selected.blobUrl} title={selected.name} className="viewer-pdf-embed" />
          </div>
        )}
      </div>

      {/* 리사이즈 핸들 */}
      <div
        className="viewer-resize-handle"
        onMouseDown={onResizeStart}
        title="드래그하여 크기 조절"
      />
    </div>
  );
}

// ── 썸네일 아이템 ─────────────────────────────────────────────

interface ThumbProps {
  file: FileAttachment;
  isSelected: boolean;
  isPending: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

function ThumbItem({ file, isSelected, isPending, onClick, onRemove }: ThumbProps) {
  return (
    <div
      className={`viewer-thumb ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={file.name}
    >
      {isImage(file) ? (
        <img src={file.dataUrl} alt={file.name} className="viewer-thumb-img" />
      ) : (
        <div className="viewer-thumb-pdf">
          <span>📄</span>
          <span className="viewer-thumb-pdf-name">{file.name.replace(/\.pdf$/i, '')}</span>
        </div>
      )}

      {isPending && <span className="viewer-thumb-badge">전송 예정</span>}

      {onRemove && (
        <button
          type="button"
          className="viewer-thumb-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="삭제"
        >
          ✕
        </button>
      )}
    </div>
  );
}
