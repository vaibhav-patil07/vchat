export interface VChatConfig {
  apiUrl: string;
  botId: string;
}

export interface VChatTheme {
  primaryColor?: string;
  backgroundColor?: string;
  chatBackground?: string;
  textColor?: string;
  userBubbleColor?: string;
  userBubbleTextColor?: string;
  aiBubbleColor?: string;
  aiBubbleTextColor?: string;
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
