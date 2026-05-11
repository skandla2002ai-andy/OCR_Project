import { useEffect, useRef } from 'react';
import type { Message } from '@/types';

interface Props {
  messages: Message[];
  streamingContent: string;
}

export function MessageList({ messages, streamingContent }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  if (!messages.length && !streamingContent) {
    return (
      <div className="message-empty">
        <p>새 대화를 시작하세요.</p>
        <p className="message-empty-hint">
          텍스트 · 이미지(Ctrl+V) · PDF 드래그 앤 드롭을 지원합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {streamingContent && (
        <div className="message-bubble assistant streaming">
          <span className="message-role">AI</span>
          <div className="message-content">
            {streamingContent}
            <span className="cursor">▋</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-bubble ${message.role}`}>
      <span className="message-role">{isUser ? '나' : 'AI'}</span>

      {message.images?.map((img) => (
        <img key={img.id} src={img.dataUrl} alt={img.name} className="message-image" />
      ))}

      {message.pdfs?.map((pdf) => (
        <div key={pdf.id} className="message-pdf-chip">
          📄 {pdf.name}
          <span className="message-pdf-pages">{pdf.pageCount}p</span>
        </div>
      ))}

      <div className="message-content">{message.content}</div>
    </div>
  );
}
