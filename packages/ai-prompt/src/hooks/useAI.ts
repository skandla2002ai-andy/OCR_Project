import { useState, useRef, useCallback } from 'react';
import { streamCompletion } from '@/services/ai';
import type { Message, AppSettings } from '@/types';

export type AIStatus = 'idle' | 'streaming' | 'error';

export function useAI() {
  const [status, setStatus] = useState<AIStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (
      messages: Message[],
      settings: AppSettings,
      onChunk: (text: string) => void,
      onDone: (full: string) => void
    ) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setStatus('streaming');
      setError(null);

      await streamCompletion(
        messages,
        settings,
        onChunk,
        (full) => {
          setStatus('idle');
          onDone(full);
        },
        (err) => {
          setStatus('error');
          setError(err.message);
        },
        ctrl.signal
      );
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);

  return { status, error, stream, abort };
}
