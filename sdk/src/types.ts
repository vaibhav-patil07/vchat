export interface VChatConfig {
  apiUrl: string;
  botId: string;
}

export interface VChatTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  headerBackground?: string;
  headerTextColor?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contextChunks?: string[];
  createdAt: Date;
}

export type WidgetPosition = 'bottom-right' | 'bottom-left';
