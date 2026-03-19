import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Check,
  Copy,
  RefreshCw,
  TestTube,
  Plus,
  Trash2,
} from "lucide-react";
import {
  api,
  type BotUpdate,
  type McpServerConfig,
  type ToolConfig,
  type McpTestResult,
} from "../api/client";

const PROVIDERS = [
  {
    value: "ollama",
    label: "Ollama (Local)",
    models: ["llama3.2:3b", "llama3.2:1b", "phi3.5", "gemma2:2b", "mistral"],
    upcoming: true,
  },
  {
    value: "groq",
    label: "Groq (Cloud)",
    models: [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "qwen/qwen3-32b",
    ],
    upcoming: false,
  },
  {
    value: "together",
    label: "Together AI (Cloud)",
    models: [
      "meta-llama/Llama-3.2-3B-Instruct-Turbo",
      "Qwen/Qwen2.5-7B-Instruct-Turbo",
    ],
    upcoming: true,
  },
];

export function BotSettings() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);
  const [mcpTestResult, setMcpTestResult] = useState<McpTestResult | null>(
    null,
  );
  const [showMcpTest, setShowMcpTest] = useState(false);
  const [toolConfig, setToolConfig] = useState<ToolConfig>({
    display_names: {},
    hidden_tools: [],
    custom_order: [],
  });
  const [discoveredTools, setDiscoveredTools] = useState<
    Array<{
      name: string;
      description: string;
      server_name: string;
    }>
  >([]);
  const [hasEverDiscoveredTools, setHasEverDiscoveredTools] = useState(false);

  const { data: bot, isLoading } = useQuery({
    queryKey: ["bot", id],
    queryFn: () => api.bots.get(id!),
    enabled: !!id,
  });

  const [form, setForm] = useState<BotUpdate>({});

  useEffect(() => {
    if (bot) {
      // Batch all state updates to prevent cascading renders
      const newForm = {
        name: bot.name,
        system_prompt: bot.system_prompt,
        provider: bot.provider,
        model_name: bot.model_name,
        temperature: bot.temperature,
        max_tokens: bot.max_tokens,
        mcp_servers: bot.mcp_servers,
        tool_config: bot.tool_config,
      };

      const newMcpServers = bot.mcp_servers || [];
      
      let newToolConfig: ToolConfig;
      let newDiscoveredTools: Array<{
        name: string;
        description: string;
        server_name: string;
      }> = [];
      let newHasEverDiscoveredTools = false;

      // Initialize tool config
      if (bot.tool_config) {
        newToolConfig = bot.tool_config;

        // Reconstruct discovered tools from saved config
        const toolNames = Object.keys(bot.tool_config.display_names || {});
        if (toolNames.length > 0) {
          newDiscoveredTools = toolNames.map((name) => ({
            name,
            description: 'Run "Test Connection" to update description',
            server_name: "unknown",
          }));
          newHasEverDiscoveredTools = true;
        }
      } else {
        // Initialize with default empty tool config
        newToolConfig = {
          display_names: {},
          hidden_tools: [],
          custom_order: [],
        };
      }

      // If bot has MCP servers configured or has any tool_config, assume tools have been discovered before
      if ((bot.mcp_servers && bot.mcp_servers.length > 0) || bot.tool_config) {
        newHasEverDiscoveredTools = true;
      }

      // Apply all state updates
      setForm(newForm);
      setMcpServers(newMcpServers);
      setToolConfig(newToolConfig);
      setDiscoveredTools(newDiscoveredTools);
      setHasEverDiscoveredTools(newHasEverDiscoveredTools);
    }
  }, [bot]);

  const updateMutation = useMutation({
    mutationFn: (data: BotUpdate) => api.bots.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot", id] });
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: () => api.bots.regenerateToken(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot", id] });
    },
  });

  const testMcpMutation = useMutation({
    mutationFn: () => api.bots.testMcp(id!),
    onSuccess: (result) => {
      setMcpTestResult(result);
      setShowMcpTest(true);

      // Merge discovered tools with existing ones
      const newTools = result.servers
        .filter((server) => server.status === "success" && server.tools)
        .flatMap((server) =>
          server.tools!.map((tool) => ({
            name: tool.name,
            description: tool.description,
            server_name: server.name,
          })),
        );

      // Merge with existing discovered tools, avoiding duplicates
      const existingToolNames = new Set(discoveredTools.map((t) => t.name));
      const uniqueNewTools = newTools.filter(
        (tool) => !existingToolNames.has(tool.name),
      );

      setDiscoveredTools((prev) => [...prev, ...uniqueNewTools]);

      // Mark that we've discovered tools at least once
      if (newTools.length > 0) {
        setHasEverDiscoveredTools(true);
      }
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...form,
      mcp_servers: mcpServers,
      tool_config: toolConfig,
    });
  };

  const currentProvider = PROVIDERS.find((p) => p.value === form.provider);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!bot)
    return (
      <div className="text-center py-20 text-muted-foreground">
        Bot not found
      </div>
    );

  return (
    <div className="max-w-2xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bots
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Bot Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              System Prompt
            </label>
            <textarea
              rows={6}
              value={form.system_prompt || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, system_prompt: e.target.value }))
              }
              placeholder="You are a helpful assistant..."
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Define how the bot should behave, its persona, and any rules
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">
            Model Configuration
          </h2>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Provider
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {PROVIDERS.map((p) => {
                const isSelected = (form.provider || "groq") === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    disabled={p.upcoming}
                    onClick={() => {
                      if (!p.upcoming)
                        setForm((f) => ({
                          ...f,
                          provider: p.value,
                          model_name: p.models[0],
                        }));
                    }}
                    className={`relative px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                      p.upcoming
                        ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                        : isSelected
                          ? "border-primary bg-primary/5 text-primary ring-2 ring-primary"
                          : "border-input bg-background text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {p.label}
                    {p.upcoming && (
                      <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        Upcoming
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Model
            </label>
            <select
              value={form.model_name || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, model_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {currentProvider?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Temperature: {form.temperature?.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature ?? 0.7}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  temperature: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              min={1}
              max={8192}
              value={form.max_tokens ?? 1024}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  max_tokens: parseInt(e.target.value) || 1024,
                }))
              }
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* MCP Tools Configuration */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">MCP Tools</h2>
          <p className="text-sm text-muted-foreground">
            Configure Model Context Protocol (MCP) servers to enable tool
            calling for your bot.
          </p>

          {/* Bot Token Section */}
          <div className="border border-border rounded-lg p-4 bg-accent/10 space-y-3">
            <h4 className="text-sm font-medium text-foreground">Bot Token</h4>
            <p className="text-xs text-muted-foreground">
              This token is sent as X-VChat-Bot-Token header to MCP servers for
              authentication.
            </p>

            {bot?.mcp_token && (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background border border-input rounded text-xs font-mono break-all">
                  {bot.mcp_token}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(bot.mcp_token!)}
                  className="p-2 border border-input rounded hover:bg-secondary/50 transition-colors"
                  title="Copy token"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => regenerateTokenMutation.mutate()}
                  disabled={regenerateTokenMutation.isPending}
                  className="p-2 border border-input rounded hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  title="Regenerate token"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${regenerateTokenMutation.isPending ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* MCP Servers Section */}
          <div className="border border-border rounded-lg p-4 bg-accent/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                MCP Servers
              </h4>
              <button
                type="button"
                onClick={() =>
                  setMcpServers((prev) => [
                    ...prev,
                    { name: "", url: "", headers: {} },
                  ])
                }
                className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-input rounded hover:bg-secondary/50 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Server
              </button>
            </div>

            {mcpServers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No MCP servers configured. Add one to enable tool calling.
              </p>
            ) : (
              <div className="space-y-3">
                {mcpServers.map((server, index) => (
                  <div
                    key={index}
                    className="p-3 bg-background border border-input rounded space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Server name"
                        value={server.name}
                        onChange={(e) => {
                          const updated = [...mcpServers];
                          updated[index].name = e.target.value;
                          setMcpServers(updated);
                        }}
                        className="flex-1 px-2 py-1 text-xs border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMcpServers((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="Server URL (e.g., http://localhost:3001/mcp)"
                      value={server.url}
                      onChange={(e) => {
                        const updated = [...mcpServers];
                        updated[index].url = e.target.value;
                        setMcpServers(updated);
                      }}
                      className="w-full px-2 py-1 text-xs border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            )}

            {mcpServers.length > 0 && (
              <button
                type="button"
                onClick={() => testMcpMutation.mutate()}
                disabled={testMcpMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <TestTube
                  className={`w-3 h-3 ${testMcpMutation.isPending ? "animate-pulse" : ""}`}
                />
                {testMcpMutation.isPending ? "Testing..." : "Test Connection"}
              </button>
            )}
          </div>

          {/* Test Results */}
          {showMcpTest && mcpTestResult && (
            <div className="border border-border rounded-lg p-4 bg-accent/10 space-y-3">
              <h4 className="text-sm font-medium text-foreground">
                Connection Test Results
              </h4>
              <div className="space-y-2">
                {mcpTestResult.servers.map((server, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <div>
                      <span className="text-xs font-medium">{server.name}</span>
                      {server.status === "success" && server.tools && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({server.tools.length} tools)
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        server.status === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      }`}
                    >
                      {server.status === "success" ? "Connected" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Helper text for re-testing */}
          {hasEverDiscoveredTools && mcpServers.length > 0 && (
            <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                💡 <strong>Tip:</strong> If you've modified your MCP servers or
                they've added new tools, run "Test Connection" again to discover
                the latest available tools.
              </p>
            </div>
          )}

          {/* Tool Display Configuration */}
          <div className="border border-border rounded-lg p-4 bg-accent/10 space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Tool Display Configuration
            </h4>
            <p className="text-xs text-muted-foreground">
              Configure how tools appear in the SDK tool pills. Leave display
              name empty to use the default tool name.
            </p>

            {hasEverDiscoveredTools ? (
              <>
                {discoveredTools.length > 0 ? (
                  <div className="space-y-2 max-w-full overflow-hidden">
                    {discoveredTools.map((tool) => (
                      <div
                        key={`${tool.server_name}-${tool.name}`}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-background rounded border items-start"
                      >
                        <div className="min-w-0">
                          <div
                            className="text-xs font-mono font-medium text-foreground truncate"
                            title={tool.name}
                          >
                            {tool.name}
                          </div>
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={tool.description}
                          >
                            {tool.description ||
                              'Run "Test Connection" to update description'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <input
                            type="text"
                            placeholder={`Display name (default: ${tool.name})`}
                            value={toolConfig.display_names[tool.name] || ""}
                            onChange={(e) => {
                              setToolConfig((prev) => ({
                                ...prev,
                                display_names: {
                                  ...prev.display_names,
                                  [tool.name]: e.target.value,
                                },
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground mb-2">
                      No tools configured
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Run "Test Connection" above to re-discover tools from your
                      MCP servers, or manually configure tool display names if
                      you know the tool names.
                    </p>
                  </div>
                )}
              </>
            ) : mcpServers.length > 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background">
                <p className="text-sm text-muted-foreground mb-2">
                  No tools discovered yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the "Test Connection" button above to discover available
                  tools from your configured MCP servers.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-lg bg-background">
                <p className="text-sm text-muted-foreground mb-2">
                  No MCP servers configured
                </p>
                <p className="text-xs text-muted-foreground">
                  Add MCP servers above to configure tool display names and
                  visibility.
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />{" "}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
