import { useState, useCallback, useRef } from 'react';
import { useVChatContext } from './VChatProvider';
import type { ChatMessage } from './types';

let msgCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++msgCounter}`;
}

export interface UseVChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  reset: () => void;
}

export function useVChat(): UseVChatReturn {
  const { config } = useVChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(
    typeof window !== 'undefined'
      ? localStorage.getItem(`vchat_conv_${config.botId}`)
      : null
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    conversationIdRef.current = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`vchat_conv_${config.botId}`);
    }
  }, [config.botId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    const assistantMsg: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${config.apiUrl}/api/bots/${config.botId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversation_id: conversationIdRef.current,
        }),
      });

      if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.conversation_id) {
              conversationIdRef.current = parsed.conversation_id;
              if (typeof window !== 'undefined') {
                localStorage.setItem(`vchat_conv_${config.botId}`, parsed.conversation_id);
              }
            }
            if (parsed.token) {
              content += parsed.token;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content,
                  contextChunks: parsed.context_chunks ?? last.contextChunks,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errMsg);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${errMsg}`,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [config.apiUrl, config.botId, isLoading]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    conversationId: conversationIdRef.current,
    reset,
  };
}
