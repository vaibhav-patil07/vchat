export interface VChatConfig {
  apiUrl: string;
  botId: string;
  showTools?: boolean;
  toolConfig?: ToolConfig;
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
  role: "user" | "assistant";
  content: string;
  contextChunks?: string[];
  createdAt: Date;
}

export type WidgetPosition = "bottom-right" | "bottom-left";

export interface ToolConfig {
  enabled: boolean;
  displayNames?: Record<string, string>; // tool_name -> display_name
  hiddenTools?: string[]; // tools to hide
  customOrder?: string[]; // custom ordering of tools
}

export interface Tool {
  name: string;
  description: string;
  displayName?: string;
  parameters?: any;
  server_url?: string;
}
