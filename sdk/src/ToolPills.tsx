import type { CSSProperties } from 'react';
import { useTools } from './useTools';
import { useVChatContext } from './VChatProvider';

export interface ToolPillsProps {
  className?: string;
  style?: CSSProperties;
  onToolClick?: (toolName: string, description: string) => void;
}

export function ToolPills({ className = '', style, onToolClick }: ToolPillsProps) {
  const { theme } = useVChatContext();
  const { tools, isLoading, error } = useTools();

  if (!tools.length && !isLoading) return null;

  const cssVars = {
    '--vchat-primary': theme.primaryColor,
    '--vchat-bg': theme.backgroundColor,
    '--vchat-text': theme.textColor,
    '--vchat-radius': theme.borderRadius ? `${theme.borderRadius}px` : undefined,
    '--vchat-font': theme.fontFamily,
  } as CSSProperties;

  const handleToolClick = (tool: any) => {
    if (onToolClick) {
      onToolClick(tool.name, tool.description);
    }
  };

  return (
    <div className={`vchat-tool-pills ${className}`} style={{ ...cssVars, ...style }}>
      {isLoading && (
        <div className="vchat-tool-pill vchat-tool-pill-loading">
          <span className="vchat-tool-pill-spinner" />
          Loading tools...
        </div>
      )}
      
      {error && (
        <div className="vchat-tool-pill vchat-tool-pill-error">
          Failed to load tools
        </div>
      )}

      {tools.map((tool) => (
        <button
          key={tool.name}
          className="vchat-tool-pill"
          onClick={() => handleToolClick(tool)}
          title={tool.description}
          type="button"
        >
          <span className="vchat-tool-pill-icon">🔧</span>
          <span className="vchat-tool-pill-name">{tool.displayName || tool.name}</span>
        </button>
      ))}
    </div>
  );
}