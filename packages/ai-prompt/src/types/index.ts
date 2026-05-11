export type AIModel = 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ImageAttachment {
  id: string;
  name: string;
  dataUrl: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  size: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  images?: ImageAttachment[];
  createdAt: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: AIModel;
  createdAt: Date;
  updatedAt: Date;
}

export type ApiEndpointMode = 'anthropic' | 'proxy';

export interface AppSettings {
  apiKey: string;
  apiEndpointMode: ApiEndpointMode;
  proxyEndpoint: string;
  model: AIModel;
  maxTokens: number;
  systemPrompt: string;
  temperature: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiEndpointMode: 'proxy',
  proxyEndpoint: '/api/ai',
  model: 'claude-sonnet-4-6',
  maxTokens: 4096,
  systemPrompt: '',
  temperature: 1,
};
