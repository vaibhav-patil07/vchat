# vchat7

Embeddable AI chatbot widget for React applications with streaming support and MCP tool calling.

## Installation

```bash
npm install vchat7
```

**Peer dependencies:** React 18+

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { VChatProvider, ChatWidget } from "vchat7";
import "vchat7/style.css";

function App() {
  return (
    <VChatProvider apiUrl="https://your-api.example.com" botId="your-bot-id">
      <ChatWidget />
    </VChatProvider>
  );
}
```

## Components

### `<VChatProvider>`

Wraps your app and provides the API connection context.

| Prop         | Type         | Required | Description                                    |
| ------------ | ------------ | -------- | ---------------------------------------------- |
| `apiUrl`     | `string`     | Yes      | Base URL of your VChat API                     |
| `botId`      | `string`     | Yes      | Bot ID to connect to                           |
| `showTools`  | `boolean`    | No       | Enable tool pills display (default: false)    |
| `toolConfig` | `ToolConfig` | No       | Tool configuration overrides                   |
| `theme`      | `VChatTheme` | No       | Global theme overrides                         |

### `<ChatWidget>`

Floating chat bubble with expand/collapse panel. Drop it anywhere in your app.

| Prop             | Type                              | Default                        | Description                                  |
| ---------------- | --------------------------------- | ------------------------------ | -------------------------------------------- |
| `position`       | `'bottom-right' \| 'bottom-left'` | `'bottom-right'`               | Widget position                              |
| `theme`          | `VChatTheme`                      | `{}`                           | Theme overrides (merges with provider theme) |
| `placeholder`    | `string`                          | `'Type a message...'`          | Input placeholder                            |
| `welcomeMessage` | `string`                          | `'Hello! How can I help you?'` | Initial greeting                             |
| `title`          | `string`                          | `'Chat'`                       | Header title                                 |
| `onToolClick`    | `(name, desc) => void`            | —                              | Custom tool click handler                    |

### `<ChatWindow>`

Inline chat panel for embedding directly in your page layout.

| Prop             | Type            | Default                        | Description          |
| ---------------- | --------------- | ------------------------------ | -------------------- |
| `className`      | `string`        | `''`                           | Additional CSS class |
| `style`          | `CSSProperties` | —                              | Inline styles        |
| `placeholder`    | `string`        | `'Type a message...'`          | Input placeholder    |
| `welcomeMessage` | `string`        | `'Hello! How can I help you?'` | Initial greeting     |
| `title`          | `string`        | `'Chat'`                       | Header title         |
| `onToolClick`    | `(name, desc) => void` | —                       | Custom tool click handler |

### `useVChat()` Hook

Access chat state and actions programmatically for fully custom UIs.

```tsx
import { useVChat, VChatProvider } from "vchat7";

function CustomChat() {
  const { messages, sendMessage, isLoading, error, conversationId, reset } =
    useVChat();

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <button onClick={() => sendMessage("Hello!")}>Send</button>
      <button onClick={reset}>Reset</button>
      {isLoading && <p>Thinking...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

| Return           | Type                              | Description                                         |
| ---------------- | --------------------------------- | --------------------------------------------------- |
| `messages`       | `ChatMessage[]`                   | Chat history                                        |
| `sendMessage`    | `(text: string) => Promise<void>` | Send a message (streams response via SSE)           |
| `isLoading`      | `boolean`                         | Whether a response is streaming                     |
| `error`          | `string \| null`                  | Last error message                                  |
| `conversationId` | `string \| null`                  | Current conversation ID (persisted in localStorage) |
| `reset`          | `() => void`                      | Clear messages and start over                       |

## Tool Calling Support

VChat7 supports MCP (Model Context Protocol) tool calling, allowing your bots to interact with external tools and services.

### Enabling Tool Pills

To show clickable tool buttons in the chat interface:

```tsx
<VChatProvider
  apiUrl="https://your-api.example.com"
  botId="your-bot-id"
  showTools={true}
>
  <ChatWidget />
</VChatProvider>
```

### Tool Configuration

You can customize how tools appear and behave:

```tsx
<VChatProvider
  apiUrl="https://your-api.example.com"
  botId="your-bot-id"
  showTools={true}
  toolConfig={{
    enabled: true,
    displayNames: {
      "send_email": "Send Email",
      "get_weather": "Check Weather"
    },
    hiddenTools: ["internal_tool"],
    customOrder: ["send_email", "get_weather"]
  }}
>
  <ChatWidget />
</VChatProvider>
```

### `<ToolPills>` Component

Display tool buttons separately from chat components:

```tsx
import { VChatProvider, ToolPills, useTools } from "vchat7";

function MyToolbar() {
  const handleToolClick = (toolName: string, description: string) => {
    console.log(`User clicked tool: ${toolName}`);
    // Custom handling logic
  };

  return (
    <VChatProvider apiUrl="..." botId="..." showTools={true}>
      <ToolPills onToolClick={handleToolClick} />
    </VChatProvider>
  );
}
```

### `useTools()` Hook

Access tool data programmatically:

```tsx
import { useTools, VChatProvider } from "vchat7";

function CustomToolInterface() {
  const { tools, isLoading, error } = useTools();

  if (isLoading) return <div>Loading tools...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Available Tools:</h3>
      {tools.map(tool => (
        <button key={tool.name} onClick={() => handleTool(tool)}>
          {tool.displayName || tool.name}
        </button>
      ))}
    </div>
  );
}
```

### Tool Configuration Types

```tsx
interface ToolConfig {
  enabled: boolean;
  displayNames?: Record<string, string>; // tool_name -> display_name
  hiddenTools?: string[]; // tools to hide from UI
  customOrder?: string[]; // custom ordering of tools
}

interface Tool {
  name: string;
  description: string;
  displayName?: string;
  parameters?: any; // JSON schema for tool parameters
  server_url?: string;
}
```

### How Tool Calling Works

1. **Bot Configuration**: Bot owners configure MCP servers in the admin panel
2. **Tool Discovery**: Available tools are automatically discovered from MCP servers
3. **Tool Pills**: When `showTools={true}`, clickable tool buttons appear in the chat
4. **Natural Execution**: Clicking a tool sends a natural language request to the bot
5. **Parameter Collection**: If tools need parameters, the AI asks for them conversationally
6. **Automatic Execution**: Once parameters are provided, tools execute automatically
7. **Result Display**: Tool results are presented naturally in the conversation

## Theming

Pass a `VChatTheme` object to `<VChatProvider>` or individual components:

```tsx
<VChatProvider
  apiUrl="https://your-api.example.com"
  botId="your-bot-id"
  theme={{
    primaryColor: "#6366f1",
    backgroundColor: "#ffffff",
    chatBackground: "#f8fafc",
    textColor: "#1f2937",
    userBubbleColor: "#6366f1",
    userBubbleTextColor: "#ffffff",
    aiBubbleColor: "#f3f4f6",
    aiBubbleTextColor: "#1f2937",
    fontFamily: "Inter, sans-serif",
    borderRadius: 12,
    headerBackground: "#6366f1",
    headerTextColor: "#ffffff",
  }}
>
  <ChatWidget />
</VChatProvider>
```

| Property              | Type     | Default                    | Description                                           |
| --------------------- | -------- | -------------------------- | ----------------------------------------------------- |
| `primaryColor`        | `string` | `'#6366f1'`                | Accent color for buttons, send button, trigger bubble |
| `backgroundColor`     | `string` | `'#ffffff'`                | Outer panel/window background                         |
| `chatBackground`      | `string` | Inherits `backgroundColor` | Messages area and input background                    |
| `textColor`           | `string` | `'#1f2937'`                | Assistant message text color                          |
| `userBubbleColor`     | `string` | Same as `primaryColor`     | User message bubble background                        |
| `userBubbleTextColor` | `string` | `'#ffffff'`                | User message bubble text color                        |
| `aiBubbleColor`       | `string` | `'#f3f4f6'`                | AI message bubble background                          |
| `aiBubbleTextColor`   | `string` | Same as `textColor`        | AI message bubble text color                          |
| `fontFamily`          | `string` | `system-ui, sans-serif`    | Font family                                           |
| `borderRadius`        | `number` | `12`                       | Border radius in pixels                               |
| `headerBackground`    | `string` | Same as `primaryColor`     | Chat header background                                |
| `headerTextColor`     | `string` | `'#ffffff'`                | Chat header text color                                |

### Dark mode example

```tsx
<VChatProvider
  apiUrl="https://your-api.example.com"
  botId="your-bot-id"
  theme={{
    primaryColor: "#818cf8",
    backgroundColor: "#1e293b",
    chatBackground: "#0f172a",
    textColor: "#f1f5f9",
    userBubbleColor: "#818cf8",
    userBubbleTextColor: "#ffffff",
    aiBubbleColor: "#1e293b",
    aiBubbleTextColor: "#f1f5f9",
    headerBackground: "#334155",
    headerTextColor: "#f1f5f9",
  }}
>
  <ChatWidget />
</VChatProvider>
```

## License

MIT
