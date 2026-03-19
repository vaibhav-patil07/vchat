import { useState, useEffect } from 'react';
import { useVChatContext } from './VChatProvider';
import type { Tool } from './types';

export interface UseToolsReturn {
  tools: Tool[];
  isLoading: boolean;
  error: string | null;
}

export function useTools(): UseToolsReturn {
  const { config } = useVChatContext();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useTools: config.showTools =', config.showTools);
    console.log('useTools: apiUrl =', config.apiUrl);
    console.log('useTools: botId =', config.botId);
    
    if (!config.showTools) {
      console.log('useTools: showTools is false, not fetching tools');
      setTools([]);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const fetchTools = async () => {
      try {
        console.log('useTools: fetching tools from', `${config.apiUrl}/api/bots/${config.botId}/tools`);
        const res = await fetch(`${config.apiUrl}/api/bots/${config.botId}/tools`);
        if (!res.ok) {
          throw new Error(`Failed to fetch tools: ${res.status}`);
        }

        const data = await res.json();
        console.log('useTools: received data', data);
        if (!mounted) return;

        let fetchedTools: Tool[] = data.tools || [];
        
        // Use tool configuration from API if available, otherwise fall back to config
        const toolConfig = data.tool_config || config.toolConfig || {};
        const displayNames = toolConfig.display_names || config.toolConfig?.displayNames || {};
        const hiddenTools = toolConfig.hidden_tools || config.toolConfig?.hiddenTools || [];
        const customOrder = toolConfig.custom_order || config.toolConfig?.customOrder || [];

        // Apply tool configuration
        if (toolConfig || config.toolConfig) {
          // Filter out hidden tools
          fetchedTools = fetchedTools.filter(tool => !hiddenTools.includes(tool.name));
          
          // Apply display names
          fetchedTools = fetchedTools.map(tool => ({
            ...tool,
            displayName: displayNames[tool.name] || tool.name,
          }));

          // Apply custom ordering
          if (customOrder.length > 0) {
            const orderedTools: Tool[] = [];
            const toolMap = new Map(fetchedTools.map(tool => [tool.name, tool]));
            
            // Add tools in custom order first
            for (const toolName of customOrder) {
              const tool = toolMap.get(toolName);
              if (tool) {
                orderedTools.push(tool);
                toolMap.delete(toolName);
              }
            }
            
            // Add remaining tools
            orderedTools.push(...Array.from(toolMap.values()));
            fetchedTools = orderedTools;
          }
        }

        setTools(fetchedTools);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch tools');
        setTools([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTools();

    return () => {
      mounted = false;
    };
  }, [config.apiUrl, config.botId, config.showTools, config.toolConfig]);

  return { tools, isLoading, error };
}