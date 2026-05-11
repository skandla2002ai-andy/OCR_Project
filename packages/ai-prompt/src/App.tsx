import { useState, useEffect, useCallback } from 'react';
import type { ImageAttachment, AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { getSettings } from '@/services/db';
import {
  createConversation,
  deleteConversation,
  addMessage,
  updateMessageContent,
} from '@/services/db';
import { useAI } from '@/hooks/useAI';
import { useConversations, useMessages } from '@/hooks/useDb';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { MessageList } from '@/components/MessageList';
import { PromptInput } from '@/components/PromptInput';
import { SettingsPanel } from '@/components/SettingsPanel';

export default function App() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const conversations = useConversations();
  const messages = useMessages(activeConvId);
  const { status, error, stream, abort } = useAI();

  useEffect(() => {
    void getSettings().then((s) => {
      setSettings(s);
      if (!s.apiKey && s.apiEndpointMode === 'anthropic') {
        setShowSettings(true);
      }
    });
  }, []);

  const handleNewConversation = useCallback(async () => {
    const conv = await createConversation(settings.model);
    setActiveConvId(conv.id);
  }, [settings.model]);

  const handleSubmit = useCallback(
    async (text: string, images: ImageAttachment[]) => {
      let convId = activeConvId;
      if (!convId) {
        const conv = await createConversation(settings.model, text.slice(0, 50) || '새 대화');
        convId = conv.id;
        setActiveConvId(convId);
      }

      await addMessage({ conversationId: convId, role: 'user', content: text, images });

      const allMessages = [
        ...messages,
        {
          id: '',
          conversationId: convId,
          role: 'user' as const,
          content: text,
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
    <div className={`app-root ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
