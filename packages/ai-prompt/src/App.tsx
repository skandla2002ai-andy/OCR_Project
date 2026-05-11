import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ImageAttachment, PdfAttachment, FileAttachment, AppSettings } from '@/types';
import { isPdf, DEFAULT_SETTINGS } from '@/types';
import { getSettings } from '@/services/db';
import {
  createConversation,
  deleteConversation,
  addMessage,
  updateMessageContent,
} from '@/services/db';
import { revokePdfUrl } from '@/services/pdf';
import { useAI } from '@/hooks/useAI';
import { useConversations, useMessages } from '@/hooks/useDb';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { MessageList } from '@/components/MessageList';
import { PromptInput } from '@/components/PromptInput';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ViewerPanel } from '@/components/ViewerPanel';

export default function App() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(360);

  const conversations = useConversations();
  const messages = useMessages(activeConvId);
  const { status, error, stream, abort } = useAI();

  // Collect all images from current conversation for the viewer
  const conversationImages = useMemo<ImageAttachment[]>(
    () => messages.flatMap((m) => m.images ?? []),
    [messages]
  );

  // Open viewer automatically when files are attached
  useEffect(() => {
    if (pendingFiles.length > 0) setViewerOpen(true);
  }, [pendingFiles.length]);

  const handleRemovePending = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file && isPdf(file)) revokePdfUrl(file.blobUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  useEffect(() => {
    void getSettings().then((s) => {
      setSettings(s);
      if (s.provider === 'anthropic' && !s.anthropicApiKey) setShowSettings(true);
    });
  }, []);

  const handleNewConversation = useCallback(async () => {
    const conv = await createConversation(settings.model);
    setActiveConvId(conv.id);
  }, [settings.model]);

  const handleSubmit = useCallback(
    async (text: string, images: ImageAttachment[], pdfs: PdfAttachment[]) => {
      let convId = activeConvId;
      if (!convId) {
        const title = text.slice(0, 50) || pdfs[0]?.name || images[0]?.name || '새 대화';
        const conv = await createConversation(settings.model, title);
        convId = conv.id;
        setActiveConvId(convId);
      }

      // PDF 텍스트를 메시지 앞에 주입
      const pdfContext = pdfs
        .map((p) => `[PDF: ${p.name} (${p.pageCount}페이지)]\n${p.text}`)
        .join('\n\n---\n\n');
      const fullContent = pdfContext ? `${pdfContext}\n\n---\n\n${text}` : text;

      await addMessage({
        conversationId: convId,
        role: 'user',
        content: text,
        images,
        pdfs: pdfs.map(({ id, name, pageCount }) => ({ id, name, pageCount })),
      });

      const allMessages = [
        ...messages,
        {
          id: '',
          conversationId: convId,
          role: 'user' as const,
          content: fullContent,
          images,
          createdAt: new Date(),
        },
      ];

      setStreamText('');

      const assistantMsg = await addMessage({
        conversationId: convId,
        role: 'assistant',
        content: '',
      });

      let accumulated = '';

      await stream(
        allMessages,
        settings,
        (chunk) => {
          accumulated += chunk;
          setStreamText(accumulated);
        },
        async (full) => {
          setStreamText('');
          await updateMessageContent(assistantMsg.id, full);
        }
      );
    },
    [activeConvId, messages, settings, stream]
  );

  return (
    <div
      className={`app-root ${sidebarOpen ? 'sidebar-open' : ''} ${viewerOpen ? 'viewer-open' : ''}`}
    >
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onCreate={handleNewConversation}
        onDelete={async (id) => {
          await deleteConversation(id);
          if (activeConvId === id) setActiveConvId(null);
        }}
      />

      {viewerOpen && (
        <ViewerPanel
          pendingFiles={pendingFiles}
          conversationImages={conversationImages}
          onRemovePending={handleRemovePending}
          width={viewerWidth}
          onWidthChange={setViewerWidth}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <div className="main-pane">
        <header className="app-header">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSidebarOpen((p) => !p)}
            title="사이드바 토글"
          >
            ☰
          </button>
          <span className="app-title">AI Prompt</span>
          <div className="header-right">
            {error && (
              <span className="error-badge" title={error}>
                ⚠ 오류
              </span>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setViewerOpen((p) => !p)}
              title="파일 뷰어 토글"
            >
              🗂
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowSettings(true)}
              title="설정"
            >
              ⚙
            </button>
          </div>
        </header>

        <div className="messages-pane">
          <MessageList messages={messages} streamingContent={streamText} />
        </div>

        <div className="input-pane">
          <PromptInput
            files={pendingFiles}
            onFilesChange={setPendingFiles}
            onSubmit={handleSubmit}
            isStreaming={status === 'streaming'}
            onAbort={abort}
          />
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSaved={(s) => {
            setSettings(s);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
