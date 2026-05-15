import { useState } from 'react';
import type { FileAttachment, ImageAttachment, PdfAttachment } from '@/types';
import { isPdf, isImage } from '@/types';
import { revokePdfUrl } from '@/services/pdf';

interface Props {
  files: FileAttachment[];
  onRemove: (id: string) => void;
}

export function FilePreview({ files, onRemove }: Props) {
  if (!files.length) return null;

  const handleRemove = (file: FileAttachment) => {
    if (isPdf(file)) revokePdfUrl(file.blobUrl);
    onRemove(file.id);
  };

  return (
    <div className="file-preview-root">
      {files.map((file) =>
        isPdf(file) ? (
          <PdfCard key={file.id} pdf={file} onRemove={() => handleRemove(file)} />
        ) : isImage(file) ? (
          <ImageCard key={file.id} img={file} onRemove={() => handleRemove(file)} />
        ) : null
      )}
    </div>
  );
}

// ── Image card ────────────────────────────────────────────────

function ImageCard({ img, onRemove }: { img: ImageAttachment; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="file-card img-card">
        <img
          src={img.dataUrl}
          alt={img.name}
          className="img-thumb"
          onClick={() => setExpanded(true)}
          title="클릭하여 크게 보기"
        />
        <button type="button" className="file-card-remove" onClick={onRemove} aria-label="삭제">
          ✕
        </button>
        <span className="file-card-name">{img.name}</span>
      </div>

      {expanded && (
        <div className="lightbox" onClick={() => setExpanded(false)}>
          <img src={img.dataUrl} alt={img.name} className="lightbox-img" />
          <button type="button" className="lightbox-close">
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ── PDF card ──────────────────────────────────────────────────

function PdfCard({ pdf, onRemove }: { pdf: PdfAttachment; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="file-card pdf-card">
        <button
          type="button"
          className="pdf-thumb"
          onClick={() => setExpanded((v) => !v)}
          title="클릭하여 PDF 미리보기"
        >
          <span className="pdf-icon">📄</span>
          <span className="pdf-meta">
            <span className="pdf-name">{pdf.name}</span>
            <span className="pdf-pages">
              {pdf.pageCount}페이지 · {formatSize(pdf.size)}
            </span>
          </span>
          <span className="pdf-toggle">{expanded ? '▲' : '▼'}</span>
        </button>
        <button type="button" className="file-card-remove" onClick={onRemove} aria-label="삭제">
          ✕
        </button>
      </div>

      {expanded && (
        <div className="pdf-embed-wrap">
          <iframe src={pdf.blobUrl} title={pdf.name} className="pdf-embed" />
        </div>
      )}
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
