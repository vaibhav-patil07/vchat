import { createContext, useContext, type ReactNode } from "react";
import type { VChatConfig, VChatTheme, ToolConfig } from "./types";

export interface VChatContextValue {
  config: VChatConfig;
  theme: VChatTheme;
}

const VChatContext = createContext<VChatContextValue | null>(null);

export function useVChatContext(): VChatContextValue {
  const ctx = useContext(VChatContext);
  if (!ctx)
    throw new Error("useVChatContext must be used within <VChatProvider>");
  return ctx;
}

export interface VChatProviderProps {
  apiUrl: string;
  botId: string;
  showTools?: boolean;
  toolConfig?: ToolConfig;
  theme?: VChatTheme;
  children: ReactNode;
}

export function VChatProvider({
  apiUrl,
  botId,
  showTools = false,
  toolConfig,
  theme = {},
  children,
}: VChatProviderProps) {
  const config: VChatConfig = { apiUrl, botId, showTools, toolConfig };
  return (
    <VChatContext.Provider value={{ config, theme }}>
      {children}
    </VChatContext.Provider>
  );
}
