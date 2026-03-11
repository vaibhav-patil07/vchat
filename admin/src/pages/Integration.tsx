import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Code2, MessageSquare, PanelRight, Puzzle } from "lucide-react";
import {
  VChatProvider,
  ChatWidget,
  ChatWindow,
  useVChat,
  type ChatMessage,
} from "@vchat/react";
import "@vchat/react/style.css";
import { api, type Bot } from "../api/client";
import { CodeBlock } from "../components/CodeBlock";

type Tab = "widget" | "inline" | "headless";

const tabs: { id: Tab; label: string; icon: typeof Code2; desc: string }[] = [
  {
    id: "widget",
    label: "ChatWidget",
    icon: MessageSquare,
    desc: "Floating bubble",
  },
  { id: "inline", label: "ChatWindow", icon: PanelRight, desc: "Inline embed" },
  { id: "headless", label: "useVChat", icon: Puzzle, desc: "Custom hook" },
];

export function Integration() {
  const [tab, setTab] = useState<Tab>("widget");
  const [selectedBotId, setSelectedBotId] = useState("");

  const { data: bots } = useQuery({
    queryKey: ["bots"],
    queryFn: () => api.bots.list(),
  });

  const selectedBot = bots?.find((b) => b.id === selectedBotId);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">SDK Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Embed a VChat bot into any React application with{" "}
          <code className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono">
            vchat7
          </code>
        </p>
      </div>

      {/* Install + Bot selector */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">
            1. Install the SDK
          </h3>
          <div className="bg-[#1e293b] rounded-lg px-4 py-3 font-mono text-sm text-[#e2e8f0]">
            npm install vchat7
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">
            2. Select a bot to preview
          </h3>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Choose a bot...</option>
            {bots?.map((bot: Bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 border-b border-border pb-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className="hidden sm:inline text-xs opacity-60">
                {t.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {selectedBotId ? (
        <VChatProvider apiUrl={apiUrl} botId={selectedBotId}>
          {tab === "widget" && (
            <WidgetTab
              botId={selectedBotId}
              botName={selectedBot?.name ?? ""}
              apiUrl={apiUrl}
            />
          )}
          {tab === "inline" && (
            <InlineTab botName={selectedBot?.name ?? ""} apiUrl={apiUrl} />
          )}
          {tab === "headless" && <HeadlessTab />}
        </VChatProvider>
      ) : (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Code2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Select a bot to see the live preview
          </p>
          <p className="text-xs text-muted-foreground">
            Pick a bot from the dropdown above to test each integration mode
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Widget Tab ---------- */

function WidgetTab({
  botId,
  botName,
  apiUrl,
}: {
  botId: string;
  botName: string;
  apiUrl: string;
}) {
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">(
    "bottom-right",
  );
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [chatBackground, setChatBackground] = useState("#ffffff");
  const [userBubbleColor, setUserBubbleColor] = useState("#6366f1");
  const [userBubbleTextColor, setUserBubbleTextColor] = useState("#ffffff");
  const [aiBubbleColor, setAiBubbleColor] = useState("#f3f4f6");
  const [aiBubbleTextColor, setAiBubbleTextColor] = useState("#1f2937");

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-card-foreground mb-1">
              ChatWidget
            </h3>
            <p className="text-sm text-muted-foreground">
              A floating chat bubble in the corner of the page. Click the bubble
              to try it.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Position
            </label>
            <div className="flex gap-2">
              {(["bottom-right", "bottom-left"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    position === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-8 border-none cursor-pointer rounded"
              />
              <code className="text-sm text-muted-foreground">
                {primaryColor}
              </code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Chat Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={chatBackground}
                onChange={(e) => setChatBackground(e.target.value)}
                className="w-10 h-8 border-none cursor-pointer rounded"
              />
              <code className="text-sm text-muted-foreground">
                {chatBackground}
              </code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              User Bubble Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={userBubbleColor}
                onChange={(e) => setUserBubbleColor(e.target.value)}
                className="w-10 h-8 border-none cursor-pointer rounded"
              />
              <code className="text-sm text-muted-foreground">
                {userBubbleColor}
              </code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              User Bubble Text
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={userBubbleTextColor}
                onChange={(e) => setUserBubbleTextColor(e.target.value)}
                className="w-10 h-8 border-none cursor-pointer rounded"
              />
              <code className="text-sm text-muted-foreground">
                {userBubbleTextColor}
              </code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              AI Bubble Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={aiBubbleColor}
                onChange={(e) => setAiBubbleColor(e.target.value)}
                className="w-10 h-8 border-none cursor-pointer rounded"
              />
              <code className="text-sm text-muted-foreground">
                {aiBubbleColor}
              </code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              AI Bubble Text
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={aiBubbleTextColor}
                onChange={(e) => setAiBubbleTextColor(e.target.value)}
                className="w-10 h-8 border-none cursor-pointer rounded"
              />
              <code className="text-sm text-muted-foreground">
                {aiBubbleTextColor}
              </code>
            </div>
          </div>
        </div>

        <CodeBlock
          title="Usage"
          code={`import { VChatProvider, ChatWidget } from 'vchat7';
import 'vchat7/style.css';

function App() {
  return (
    <VChatProvider
      apiUrl="${apiUrl}"
      botId="${botId}"
    >
      <ChatWidget
        position="${position}"
        theme={{
          primaryColor: "${primaryColor}",
          chatBackground: "${chatBackground}",
          userBubbleColor: "${userBubbleColor}",
          userBubbleTextColor: "${userBubbleTextColor}",
          aiBubbleColor: "${aiBubbleColor}",
          aiBubbleTextColor: "${aiBubbleTextColor}",
        }}
        welcomeMessage="Hi! How can I help?"
        placeholder="Type a message..."
      />
      {/* Your app content */}
    </VChatProvider>
  );
}`}
        />
      </div>

      <ChatWidget
        position={position}
        theme={{ primaryColor, chatBackground, userBubbleColor, userBubbleTextColor, aiBubbleColor, aiBubbleTextColor }}
        welcomeMessage={`Hi! I'm ${botName}. Ask me anything.`}
        placeholder="Type a message..."
        title={botName}
      />
    </div>
  );
}

/* ---------- Inline Tab ---------- */

function InlineTab({ botName, apiUrl }: { botName: string; apiUrl: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <div>
        <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
          Live Preview
        </div>
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <ChatWindow
            title={botName}
            welcomeMessage={`Welcome! Ask me anything about ${botName}.`}
            placeholder="Ask a question..."
            style={{ height: 460 }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <CodeBlock
          title="Usage"
          code={`import { VChatProvider, ChatWindow } from 'vchat7';
import 'vchat7/style.css';

function SupportPage() {
  return (
    <VChatProvider
      apiUrl="${apiUrl}"
      botId="your-bot-id"
      theme={{
        primaryColor: '#6366f1',
        chatBackground: '#ffffff',
        userBubbleColor: '#6366f1',
        userBubbleTextColor: '#ffffff',
        aiBubbleColor: '#f3f4f6',
        aiBubbleTextColor: '#1f2937',
      }}
    >
      <div className="page-layout">
        <h1>Help Center</h1>
        <ChatWindow
          title="${botName}"
          welcomeMessage="Welcome! How can we help?"
          placeholder="Ask a question..."
          style={{ height: 500 }}
        />
      </div>
    </VChatProvider>
  );
}`}
        />

        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h4 className="text-sm font-semibold text-card-foreground mb-2">
            When to use ChatWindow
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
            <li>Dedicated help/support pages</li>
            <li>Side panels in dashboards</li>
            <li>Full-page chat experiences</li>
            <li>When you want the chat always visible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------- Headless Tab ---------- */

function HeadlessTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <div>
        <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
          Live Preview &mdash; Custom UI
        </div>
        <CustomChatUI />
      </div>

      <CodeBlock
        title="Usage"
        code={`import { useVChat, VChatProvider } from 'vchat7';
import 'vchat7/style.css';

function CustomChat() {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    reset,
  } = useVChat();

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong>
          <span>{msg.content}</span>
        </div>
      ))}

      {isLoading && <p>Thinking...</p>}
      {error && <p>Error: {error}</p>}

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e =>
          e.key === 'Enter' && handleSend()
        }
      />
      <button onClick={handleSend}>Send</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`}
      />
    </div>
  );
}

function CustomChatUI() {
  const { messages, sendMessage, isLoading, error, reset } = useVChat();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[480px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
        <span className="text-sm font-semibold text-card-foreground">
          Custom Chat UI
        </span>
        <button
          onClick={reset}
          className="px-3 py-1 text-xs border border-input rounded-md text-muted-foreground hover:text-foreground bg-card transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center m-auto text-sm">
            This chat uses the headless{" "}
            <code className="px-1 py-0.5 bg-secondary rounded text-xs font-mono">
              useVChat()
            </code>{" "}
            hook with a fully custom UI.
          </p>
        )}
        {messages.map((msg: ChatMessage) => (
          <div key={msg.id} className="mb-3">
            <div
              className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${
                msg.role === "user"
                  ? "text-primary"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {msg.role === "user" ? "You" : "Assistant"}
            </div>
            <div
              className={`text-sm leading-relaxed whitespace-pre-wrap rounded-lg px-3.5 py-2.5 ${
                msg.role === "user"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {msg.content}
              {isLoading && msg.role === "assistant" && msg.content === "" && (
                <span className="text-muted-foreground">Thinking...</span>
              )}
            </div>
          </div>
        ))}
        {error && (
          <div className="px-3 py-2 bg-destructive/10 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type something..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
