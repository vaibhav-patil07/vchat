import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, ChevronDown, ChevronUp, User, Bot } from 'lucide-react';
import { api } from '../api/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  contextChunks?: string[];
}

export function TestChat() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [expandedContext, setExpandedContext] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: bot } = useQuery({
    queryKey: ['bot', id],
    queryFn: () => api.bots.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !id) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    try {
      const res = await api.chat(id, userMessage, conversationId);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let chunks: string[] = [];

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.conversation_id) setConversationId(parsed.conversation_id);
            if (parsed.context_chunks) chunks = parsed.context_chunks;
            if (parsed.token) {
              assistantContent += parsed.token;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                  contextChunks: chunks.length > 0 ? chunks : undefined,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Chat &mdash; {bot?.name}</h1>
        <button
          onClick={() => { setMessages([]); setConversationId(undefined); }}
          className="ml-auto text-xs text-gray-500 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded-lg"
        >
          New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Send a message to start chatting
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && isStreaming && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-indigo-600 ml-0.5 animate-pulse" />
                )}
              </div>
              {msg.contextChunks && msg.contextChunks.length > 0 && (
                <div className="mt-1">
                  <button
                    onClick={() => setExpandedContext(expandedContext === i ? null : i)}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {expandedContext === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {msg.contextChunks.length} context chunks used
                  </button>
                  {expandedContext === i && (
                    <div className="mt-2 space-y-2">
                      {msg.contextChunks.map((chunk, ci) => (
                        <div key={ci} className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 text-gray-700 whitespace-pre-wrap">
                          {chunk}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isStreaming}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
