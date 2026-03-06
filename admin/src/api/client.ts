const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Bot {
  id: string;
  name: string;
  system_prompt: string;
  provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  document_count: number;
  conversation_count: number;
}

export interface BotCreate {
  name: string;
  system_prompt?: string;
  provider?: string;
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface BotUpdate {
  name?: string;
  system_prompt?: string;
  provider?: string;
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface Document {
  id: string;
  bot_id: string;
  filename: string;
  content_type: string;
  chunk_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  bot_id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  context_chunks: string | null;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  bot_id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

export const api = {
  bots: {
    list: () => request<Bot[]>('/bots'),
    get: (id: string) => request<Bot>(`/bots/${id}`),
    create: (data: BotCreate) => request<Bot>('/bots', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: BotUpdate) => request<Bot>(`/bots/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/bots/${id}`, { method: 'DELETE' }),
  },
  documents: {
    list: (botId: string) => request<Document[]>(`/bots/${botId}/documents`),
    upload: async (botId: string, file: File): Promise<Document> => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BASE}/bots/${botId}/documents`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    delete: (botId: string, docId: string) => request<void>(`/bots/${botId}/documents/${docId}`, { method: 'DELETE' }),
  },
  conversations: {
    list: (botId: string) => request<Conversation[]>(`/bots/${botId}/conversations`),
    get: (id: string) => request<ConversationDetail>(`/conversations/${id}`),
  },
  chat: (botId: string, message: string, conversationId?: string) => {
    return fetch(`${BASE}/bots/${botId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  },
};
