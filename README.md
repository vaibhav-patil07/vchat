# VChat - Embeddable AI Chatbot System

A complete chatbot platform with a Python API backend, React admin UI, and an embeddable React SDK.

## Architecture

```
vchat/
├── api/       → Python FastAPI backend (LLM + RAG + REST API)
├── admin/     → React admin dashboard (bot management, knowledge base, test chat)
├── sdk/       → @vchat/react npm package (embeddable chat widget)
├── demo/      → Demo app showcasing all SDK integration modes
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) (for local models) or a Groq/Together AI API key

### 1. Start the API

```bash
cd api
cp .env.example .env          # Edit with your API keys / preferences
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If using Ollama, pull a model first:

```bash
ollama pull llama3.2:3b
```

### 2. Start the Admin UI

```bash
cd admin
npm install
npm run dev    # Opens at http://localhost:5173
```

### 3. Use the SDK in your React app

```bash
npm install vchat7
```

```tsx
import { VChatProvider, ChatWidget } from "@vchat/react";
import "@vchat/react/style.css";

function App() {
  return (
    <VChatProvider apiUrl="http://localhost:8000" botId="your-bot-id">
      <ChatWidget
        position="bottom-right"
        welcomeMessage="Hi! How can I help?"
        theme={{ primaryColor: "#6366f1" }}
      />
    </VChatProvider>
  );
}
```

### 4. Run the SDK Demo App

```bash
cd demo
npm install
npm run dev    # Opens at http://localhost:5174
```

The demo app has three tabs showcasing each SDK integration mode:

- **ChatWidget** — Floating bubble with live customization (position, color)
- **ChatWindow** — Inline chat embedded in the page
- **useVChat** — Headless hook with a fully custom UI

Enter your API URL and a Bot ID (from the Admin UI) to connect.

### Docker Compose (API + Ollama)

```bash
cp api/.env.example api/.env
docker compose up
```

## LLM Providers

| Provider            | Setup                      | Models                             |
| ------------------- | -------------------------- | ---------------------------------- |
| Ollama (local)      | Install Ollama, pull model | llama3.2:3b, phi3.5, gemma2:2b     |
| Groq (cloud)        | Set `GROQ_API_KEY`         | llama-3.2-3b-preview, mixtral-8x7b |
| Together AI (cloud) | Set `TOGETHER_API_KEY`     | Llama-3.2-3B-Instruct-Turbo        |

## SDK Components

- **`<VChatProvider>`** — Context provider. Wraps your app.
- **`<ChatWidget>`** — Floating chat bubble with popup panel.
- **`<ChatWindow>`** — Inline chat component.
- **`useVChat()`** — Headless hook for building custom chat UIs.
