import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, ChevronDown, ChevronUp, User, Bot, Clock } from 'lucide-react';
import { api, type Conversation, type Message } from '../api/client';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function ChatHistory() {
  const { id: botId } = useParams<{ id: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedContext, setExpandedContext] = useState<string | null>(null);
  const [mobileShowMessages, setMobileShowMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: bot } = useQuery({
    queryKey: ['bot', botId],
    queryFn: () => api.bots.get(botId!),
    enabled: !!botId,
  });

  const { data: conversations, isLoading: loadingList } = useQuery({
    queryKey: ['conversations', botId],
    queryFn: () => api.conversations.list(botId!),
    enabled: !!botId,
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['conversation', selectedId],
    queryFn: () => api.conversations.get(selectedId!),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (conversations?.length && !selectedId) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowMessages(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-lg font-bold text-foreground truncate">
          Chat History &mdash; {bot?.name}
        </h1>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversation list -- full width on mobile, fixed sidebar on md+ */}
        <div className={`${mobileShowMessages ? 'hidden' : 'flex'} md:flex w-full md:w-72 md:shrink-0 bg-card rounded-xl border border-border shadow-sm flex-col`}>
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-card-foreground">
              Conversations
              {conversations && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({conversations.length})
                </span>
              )}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList && (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            {!loadingList && conversations?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4 text-center">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
            {conversations?.map((conv: Conversation) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${
                  selectedId === conv.id
                    ? 'bg-primary/10'
                    : 'hover:bg-accent'
                }`}
              >
                <p className="text-sm font-medium text-card-foreground truncate">
                  {conv.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(conv.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {conv.message_count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message viewer -- full width on mobile, flex-1 on md+ */}
        <div className={`${mobileShowMessages ? 'flex' : 'hidden'} md:flex flex-1 bg-card rounded-xl border border-border shadow-sm flex-col min-w-0`}>
          {!selectedId && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a conversation to view
            </div>
          )}
          {selectedId && loadingDetail && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          {selectedId && !loadingDetail && detail && (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setMobileShowMessages(false)}
                  className="md:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-card-foreground truncate">{detail.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(detail.created_at)} &middot; {detail.messages.length} messages
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {detail.messages.map((msg: Message) => {
                  const contextChunks = msg.context_chunks
                    ? (() => { try { return JSON.parse(msg.context_chunks) as string[]; } catch { return null; } })()
                    : null;
                  const contextKey = msg.id;

                  return (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-secondary-foreground rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {contextChunks && contextChunks.length > 0 && (
                          <div className="mt-1">
                            <button
                              onClick={() => setExpandedContext(expandedContext === contextKey ? null : contextKey)}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              {expandedContext === contextKey ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {contextChunks.length} context chunks used
                            </button>
                            {expandedContext === contextKey && (
                              <div className="mt-2 space-y-2">
                                {contextChunks.map((chunk: string, ci: number) => (
                                  <div key={ci} className="text-xs bg-accent border border-border rounded-lg p-3 text-accent-foreground whitespace-pre-wrap">
                                    {chunk}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
