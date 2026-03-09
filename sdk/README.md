# vchat7

Embeddable AI chatbot widget for React applications with streaming support.

## Installation

```bash
npm install vchat7
```

## Quick Start

```tsx
import { VChatProvider, ChatWidget } from 'vchat7';
import 'vchat7/style.css';

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

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiUrl` | `string` | Yes | Base URL of your VChat API |
| `botId` | `string` | Yes | Bot ID to connect to |
| `theme` | `VChatTheme` | No | Global theme overrides |

### `<ChatWidget>`

Floating chat bubble with expand/collapse panel. Drop it anywhere in your app.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Widget position |
| `theme` | `VChatTheme` | `{}` | Theme overrides (merges with provider theme) |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder |
| `welcomeMessage` | `string` | `'Hello! How can I help you?'` | Initial greeting |
| `title` | `string` | `'Chat'` | Header title |

### `<ChatWindow>`

Inline chat panel for embedding directly in your page layout.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS class |
| `style` | `CSSProperties` | — | Inline styles |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder |
| `welcomeMessage` | `string` | `'Hello! How can I help you?'` | Initial greeting |
| `title` | `string` | `'Chat'` | Header title |

### `useVChat()` Hook

Access chat state and actions programmatically.

```tsx
const { messages, sendMessage, isLoading, error, conversationId, reset } = useVChat();
```

| Return | Type | Description |
|--------|------|-------------|
| `messages` | `ChatMessage[]` | Chat history |
| `sendMessage` | `(text: string) => Promise<void>` | Send a message |
| `isLoading` | `boolean` | Whether a response is streaming |
| `error` | `string \| null` | Last error message |
| `conversationId` | `string \| null` | Current conversation ID |
| `reset` | `() => void` | Clear messages and start over |

## Theming

Pass a `VChatTheme` object to `<VChatProvider>` or individual components:

```tsx
<VChatProvider
  apiUrl="https://your-api.example.com"
  botId="your-bot-id"
  theme={{
    primaryColor: '#6366f1',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 12,
    headerBackground: '#6366f1',
    headerTextColor: '#ffffff',
  }}
>
  <ChatWidget />
</VChatProvider>
```

## License

MIT
