import Anthropic from '@anthropic-ai/sdk';
import type { Message, ImageAttachment, AppSettings } from '@/types';

export type ChunkCallback = (text: string) => void;
export type DoneCallback = (fullText: string) => void;
export type ErrorCallback = (err: Error) => void;

export async function streamCompletion(
  messages: Message[],
  settings: AppSettings,
  onChunk: ChunkCallback,
  onDone: DoneCallback,
  onError: ErrorCallback,
  signal?: AbortSignal
): Promise<void> {
  const userMessages = messages.filter((m) => m.role !== 'system');

  switch (settings.provider) {
    case 'anthropic':
      return streamAnthropic(userMessages, settings, onChunk, onDone, onError, signal);
    case 'proxy':
      return streamProxy(userMessages, settings, onChunk, onDone, onError, signal);
    case 'ollama':
      return streamOllama(userMessages, settings, onChunk, onDone, onError, signal);
    case 'openai':
      return streamOpenAI(userMessages, settings, onChunk, onDone, onError, signal);
  }
}

// ── Anthropic 직접 ────────────────────────────────────────────

function toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
  return messages.map((msg) => {
    if (!msg.images?.length) {
      return { role: msg.role as 'user' | 'assistant', content: msg.content };
    }
    return {
      role: msg.role as 'user' | 'assistant',
      content: [
        ...msg.images.map(imgToAnthropicBlock),
        { type: 'text' as const, text: msg.content },
      ],
    };
  });
}

function imgToAnthropicBlock(img: ImageAttachment): Anthropic.ImageBlockParam {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.dataUrl.split(',')[1],
    },
  };
}

async function streamAnthropic(
  messages: Message[],
  settings: AppSettings,
  onChunk: ChunkCallback,
  onDone: DoneCallback,
  onError: ErrorCallback,
  signal?: AbortSignal
): Promise<void> {
  const client = new Anthropic({
    apiKey: settings.anthropicApiKey,
    dangerouslyAllowBrowser: true,
  });
  try {
    const stream = client.messages.stream(
      {
        model: settings.model,
        max_tokens: settings.maxTokens,
        system: settings.systemPrompt || undefined,
        messages: toAnthropicMessages(messages),
      },
      { signal }
    );
    let full = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        full += event.delta.text;
        onChunk(event.delta.text);
      }
    }
    onDone(full);
  } catch (err) {
    if ((err as Error).name !== 'AbortError') onError(toError(err));
  }
}

// ── 서버 프록시 (SSE) ─────────────────────────────────────────

async function streamProxy(
  messages: Message[],
  settings: AppSettings,
  onChunk: ChunkCallback,
  onDone: DoneCallback,
  onError: ErrorCallback,
  signal?: AbortSignal
): Promise<void> {
  try {
    const resp = await fetch(settings.proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: settings.maxTokens,
        system: settings.systemPrompt || undefined,
        messages: toAnthropicMessages(messages),
        stream: true,
      }),
      signal,
    });
    if (!resp.ok) throw new Error(`Server error: ${resp.status} ${resp.statusText}`);
    await readSSE(resp, onChunk, onDone);
  } catch (err) {
    if ((err as Error).name !== 'AbortError') onError(toError(err));
  }
}

// ── Ollama ────────────────────────────────────────────────────

interface OllamaChunk {
  message?: { content?: string };
  done?: boolean;
}

async function streamOllama(
  messages: Message[],
  settings: AppSettings,
  onChunk: ChunkCallback,
  onDone: DoneCallback,
  onError: ErrorCallback,
  signal?: AbortSignal
): Promise<void> {
  const base = settings.ollamaBaseUrl.replace(/\/$/, '');
  const ollamaMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
    // Ollama 멀티모달: images 필드에 base64 배열 (vision 모델 전용)
    ...(m.images?.length ? { images: m.images.map((i) => i.dataUrl.split(',')[1]) } : {}),
  }));

  try {
    const resp = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollamaModel,
        messages: ollamaMessages,
        stream: true,
        options: { num_predict: settings.maxTokens, temperature: settings.temperature },
        ...(settings.systemPrompt ? { system: settings.systemPrompt } : {}),
      }),
      signal,
    });
    if (!resp.ok) throw new Error(`Ollama error: ${resp.status} ${resp.statusText}`);

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let full = '';
    let buf = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as OllamaChunk;
          const text = parsed.message?.content ?? '';
          if (text) {
            full += text;
            onChunk(text);
          }
          if (parsed.done) {
            onDone(full);
            return;
          }
        } catch {
          /* skip */
        }
      }
    }
    onDone(full);
  } catch (err) {
    if ((err as Error).name !== 'AbortError') onError(toError(err));
  }
}

// ── OpenAI / 호환 API ─────────────────────────────────────────

interface OpenAIMessage {
  role: string;
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

function toOpenAIMessages(messages: Message[]): OpenAIMessage[] {
  return messages.map((msg) => {
    if (!msg.images?.length) return { role: msg.role, content: msg.content };
    return {
      role: msg.role,
      content: [
        ...msg.images.map((img) => ({
          type: 'image_url' as const,
          image_url: { url: img.dataUrl },
        })),
        { type: 'text' as const, text: msg.content },
      ],
    };
  });
}

async function streamOpenAI(
  messages: Message[],
  settings: AppSettings,
  onChunk: ChunkCallback,
  onDone: DoneCallback,
  onError: ErrorCallback,
  signal?: AbortSignal
): Promise<void> {
  const base = settings.openaiBaseUrl.replace(/\/$/, '');
  const openAIMessages: OpenAIMessage[] = [];
  if (settings.systemPrompt)
    openAIMessages.push({ role: 'system', content: settings.systemPrompt });
  openAIMessages.push(...toOpenAIMessages(messages));

  try {
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.openaiApiKey ? { Authorization: `Bearer ${settings.openaiApiKey}` } : {}),
      },
      body: JSON.stringify({
        model: settings.openaiModel,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        messages: openAIMessages,
        stream: true,
      }),
      signal,
    });
    if (!resp.ok) throw new Error(`OpenAI error: ${resp.status} ${resp.statusText}`);
    await readSSE(resp, onChunk, onDone);
  } catch (err) {
    if ((err as Error).name !== 'AbortError') onError(toError(err));
  }
}

// ── 공통 SSE 파서 (Anthropic proxy + OpenAI 형식 공용) ────────

async function readSSE(
  resp: Response,
  onChunk: ChunkCallback,
  onDone: DoneCallback
): Promise<void> {
  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let full = '';
  let buf = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        onDone(full);
        return;
      }
      try {
        const parsed = JSON.parse(data) as {
          delta?: { text?: string };
          choices?: { delta?: { content?: string } }[];
        };
        const text = parsed.delta?.text ?? parsed.choices?.[0]?.delta?.content ?? '';
        if (text) {
          full += text;
          onChunk(text);
        }
      } catch {
        /* skip */
      }
    }
  }
  onDone(full);
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}
