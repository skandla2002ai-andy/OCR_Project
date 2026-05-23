import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';
import type { Conversation, Message } from '@/types';

export function useConversations(): Conversation[] {
  return useLiveQuery(() => db.conversations.orderBy('updatedAt').reverse().toArray(), []) ?? [];
}

export function useMessages(conversationId: string | null): Message[] {
  return (
    useLiveQuery(
      (): Promise<Message[]> =>
        conversationId
          ? db.messages.where('conversationId').equals(conversationId).sortBy('createdAt')
          : Promise.resolve([]),
      [conversationId]
    ) ?? []
  );
}
