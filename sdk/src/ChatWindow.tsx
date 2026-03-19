import { useState, useRef, useEffect, type CSSProperties } from "react";
import { useVChat } from "./useVChat";
import { useVChatContext } from "./VChatProvider";
import { renderMarkdown } from "./markdown";
import { ToolPills } from "./ToolPills";
import { useTools } from "./useTools";

export interface ChatWindowProps {
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  welcomeMessage?: string;
  title?: string;
  onToolClick?: (toolName: string, description: string) => void;
}

export function ChatWindow({
  className = "",
  style,
  placeholder = "Type a message...",
  welcomeMessage = "Hello! How can I help you?",
  title = "Chat",
  onToolClick,
}: ChatWindowProps) {
  const { theme, config } = useVChatContext();
  const { messages, sendMessage, isLoading } = useVChat();
  const { tools } = useTools();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleToolClick = (toolName: string, description: string) => {
    if (onToolClick) {
      onToolClick(toolName, description);
    } else {
      // Find the tool to check its parameters
      const tool = tools.find((t) => t.name === toolName);
      const displayName = tool?.displayName || toolName;

      if (tool && tool.parameters) {
        const requiredParams = tool.parameters.required || [];

        if (requiredParams.length > 0) {
          // Tool has required parameters, make a natural request
          sendMessage(`I want to use the ${displayName} tool. Can you help me with that?`);
        } else {
          // Tool has no required parameters, execute directly
          sendMessage(`Please use the ${displayName} tool`);
        }
      } else {
        // Fallback: natural request
        sendMessage(`I want to use the ${displayName} tool. Can you help me?`);
      }
    }
  };

  const cssVars = {
    "--vchat-primary": theme.primaryColor,
    "--vchat-bg": theme.backgroundColor,
    "--vchat-chat-bg": theme.chatBackground,
    "--vchat-text": theme.textColor,
    "--vchat-user-bubble": theme.userBubbleColor,
    "--vchat-user-bubble-text": theme.userBubbleTextColor,
    "--vchat-ai-bubble": theme.aiBubbleColor,
    "--vchat-ai-bubble-text": theme.aiBubbleTextColor,
    "--vchat-radius": theme.borderRadius
      ? `${theme.borderRadius}px`
      : undefined,
    "--vchat-header-bg": theme.headerBackground,
    "--vchat-header-text": theme.headerTextColor,
    "--vchat-font": theme.fontFamily,
  } as CSSProperties;

  return (
    <div
      className={`vchat-widget vchat-window ${className}`}
      style={{ ...cssVars, ...style }}
    >
      <div className="vchat-header">
        <span className="vchat-header-title">{title}</span>
      </div>
      <div className="vchat-messages">
        {messages.length === 0 && (
          <div className="vchat-welcome">{welcomeMessage}</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`vchat-msg ${msg.role}`}>
            <div className="vchat-msg-avatar">
              {msg.role === "user" ? "U" : "AI"}
            </div>
            <div className="vchat-msg-bubble">
              {isLoading && msg.role === "assistant" && msg.content === "" ? (
                <span className="vchat-typing" />
              ) : (
                <span
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(msg.content),
                  }}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {config.showTools && <ToolPills onToolClick={handleToolClick} />}
      <form className="vchat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          className="vchat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="vchat-send"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
