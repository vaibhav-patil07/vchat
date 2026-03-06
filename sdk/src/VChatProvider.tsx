import { createContext, useContext, type ReactNode } from 'react';
import type { VChatConfig, VChatTheme } from './types';

export interface VChatContextValue {
  config: VChatConfig;
  theme: VChatTheme;
}

const VChatContext = createContext<VChatContextValue | null>(null);

export function useVChatContext(): VChatContextValue {
  const ctx = useContext(VChatContext);
  if (!ctx) throw new Error('useVChatContext must be used within <VChatProvider>');
  return ctx;
}

export interface VChatProviderProps {
  apiUrl: string;
  botId: string;
  theme?: VChatTheme;
  children: ReactNode;
}

export function VChatProvider({ apiUrl, botId, theme = {}, children }: VChatProviderProps) {
  const config: VChatConfig = { apiUrl, botId };
  return (
    <VChatContext.Provider value={{ config, theme }}>
      {children}
    </VChatContext.Provider>
  );
}
