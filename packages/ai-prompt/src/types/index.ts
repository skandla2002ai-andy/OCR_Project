export type AIModel = 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ImageAttachment {
  kind: 'image';
  id: string;
  name: string;
  dataUrl: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  size: number;
}

export interface PdfAttachment {
  kind: 'pdf';
  id: string;
  name: string;
  size: number;
  blobUrl: string; // object URL for <iframe> preview (revoke on remove)
  pageCount: number;
  text: string; // extracted text → injected into AI message
}

export type FileAttachment = ImageAttachment | PdfAttachment;

export function isPdf(a: FileAttachment): a is PdfAttachment {
  return a.kind === 'pdf';
}

export function isImage(a: FileAttachment): a is ImageAttachment {
  return a.kind === 'image';
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  images?: ImageAttachment[];
  pdfs?: Pick<PdfAttachment, 'id' | 'name' | 'pageCount'>[];
  createdAt: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

/** AI 연결 방식 */
export type ApiProvider =
  | 'anthropic' // Anthropic 직접 (API 키)
  | 'proxy' // 자체 서버 프록시 (SSE)
  | 'ollama' // 로컬 Ollama (키 없음)
  | 'openai'; // OpenAI / 호환 API

export interface AppSettings {
  provider: ApiProvider;
  anthropicApiKey: string;
  proxyEndpoint: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  model: AIModel;
  maxTokens: number;
  systemPrompt: string;
  temperature: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'proxy',
  anthropicApiKey: '',
  proxyEndpoint: '/api/ai',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3',
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiModel: 'gpt-4o',
  model: 'claude-sonnet-4-6',
  maxTokens: 4096,
  systemPrompt: '',
  temperature: 1,
};

export const PROVIDER_LABELS: Record<ApiProvider, string> = {
  anthropic: 'Anthropic 직접 (Claude API)',
  proxy: '서버 프록시 (자체 백엔드)',
  ollama: 'Ollama (로컬 LLM)',
  openai: 'OpenAI / 호환 API',
};
