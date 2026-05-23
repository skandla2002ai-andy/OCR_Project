import Dexie, { type Table } from 'dexie';
import type { Conversation, Message, AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingRow {
  key: string;
  value: unknown;
}

class AppDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super('ai-prompt-db');
    this.version(1).stores({
      conversations: 'id, createdAt, updatedAt',
      messages: 'id, conversationId, createdAt',
      settings: 'key',
    });
  }
}

export const db = new AppDatabase();

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.settings.toArray();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...map } as AppSettings;
}

export async function saveSetting(key: keyof AppSettings, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    for (const [key, value] of Object.entries(partial)) {
      await db.settings.put({ key, value });
    }
  });
}

export async function createConversation(
  model: Conversation['model'],
  title = '새 대화'
): Promise<Conversation> {
  const now = new Date();
  const conv: Conversation = {
    id: crypto.randomUUID(),
    title,
    model,
    createdAt: now,
    updatedAt: now,
  };
  await db.conversations.add(conv);
  return conv;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await db.conversations.update(id, { title, updatedAt: new Date() });
}

export async function deleteConversation(id: string): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages], async () => {
    await db.conversations.delete(id);
    await db.messages.where('conversationId').equals(id).delete();
  });
}

export async function addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
  const full: Message = { ...msg, id: crypto.randomUUID(), createdAt: new Date() };
  await db.messages.add(full);
  await db.conversations.update(msg.conversationId, { updatedAt: new Date() });
  return full;
}

export async function updateMessageContent(id: string, content: string): Promise<void> {
  await db.messages.update(id, { content });
}
