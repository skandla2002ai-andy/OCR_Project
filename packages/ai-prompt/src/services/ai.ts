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
  const apiMessages = messages.filter((m) => m.role !== 'system').map(formatForApi);

  if (settings.apiEndpointMode === 'proxy') {
    return streamViaProxy(apiMessages, settings, onChunk, onDone, onError, signal);
  }
  return streamDirect(apiMessages, settings, onChunk, onDone, onError, signal);
}

function formatForApi(msg: Message): Anthropic.MessageParam {
  if (!msg.images?.length) {
    return { role: msg.role as 'user' | 'assistant', content: msg.content };
  }
  return {
    role: msg.role as 'user' | 'assistant',
    content: [...msg.images.map(imgToBlock), { type: 'text' as const, text: msg.content }],
  };
}

function imgToBlock(img: ImageAttachment): Anthropic.ImageBlockParam {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.dataUrl.split(',')[1],
    },
  };
}

async function streamDirect(
  messages: Anthropic.MessageParam[],
  settings: AppSettings,
  onChunk: ChunkCallback,
  onDone: DoneCallback,
  onError: ErrorCallback,
  signal?: AbortSignal
): Promise<void> {
  const client = new Anthropic({
    apiKey: settings.apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const stream = client.messages.stream(
      {
        model: settings.model,
        max_tokens: settings.maxTokens,
        system: settings.systemPrompt || undefined,
        messages,
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
    if ((err as Error).name !== 'AbortError') {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

async function streamViaProxy(
  messages: Anthropic.MessageParam[],
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
        messages,
        stream: true,
      }),
      signal,
    });

    if (!resp.ok) {
      throw new Error(`Server error: ${resp.status} ${resp.statusText}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data) as { delta?: { text?: string } };
          const text = parsed.delta?.text ?? '';
          if (text) {
            full += text;
            onChunk(text);
          }
        } catch {
          /* skip malformed SSE */
        }
      }
    }
    onDone(full);
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
