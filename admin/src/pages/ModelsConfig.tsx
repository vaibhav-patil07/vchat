import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Check, Cpu, X } from "lucide-react";
import { api, type ProviderModelConfig } from "../api/client";

export function ModelsConfig() {
  const queryClient = useQueryClient();
  const [draftProviders, setDraftProviders] = useState<
    ProviderModelConfig[] | null
  >(null);
  const [newModels, setNewModels] = useState<Record<string, string>>({});
  const [newProviderValue, setNewProviderValue] = useState("");
  const [newProviderLabel, setNewProviderLabel] = useState("");
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: api.models.list,
  });

  const providers = draftProviders ?? data?.providers ?? [];

  const updateProviders = (
    updater: (prev: ProviderModelConfig[]) => ProviderModelConfig[],
  ) => {
    setDraftProviders((prev) => updater(prev ?? data?.providers ?? []));
  };

  const updateMutation = useMutation({
    mutationFn: (nextProviders: ProviderModelConfig[]) =>
      api.models.update(nextProviders),
    onSuccess: (updated) => {
      queryClient.setQueryData(["models"], updated);
      setDraftProviders(null);
      setError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAddModel = (providerValue: string) => {
    const modelName = (newModels[providerValue] || "").trim();
    if (!modelName) return;

    updateProviders((prev) =>
      prev.map((p) => {
        if (p.value !== providerValue) return p;
        if (p.models.includes(modelName)) return p;
        return { ...p, models: [...p.models, modelName] };
      }),
    );
    setNewModels((prev) => ({ ...prev, [providerValue]: "" }));
    setError("");
  };

  const handleRemoveModel = (providerValue: string, modelName: string) => {
    updateProviders((prev) =>
      prev.map((p) => {
        if (p.value !== providerValue) return p;
        return { ...p, models: p.models.filter((m) => m !== modelName) };
      }),
    );
  };

  const handleToggleUpcoming = (providerValue: string) => {
    updateProviders((prev) =>
      prev.map((p) =>
        p.value === providerValue ? { ...p, upcoming: !p.upcoming } : p,
      ),
    );
  };

  const handleLabelChange = (providerValue: string, label: string) => {
    updateProviders((prev) =>
      prev.map((p) => (p.value === providerValue ? { ...p, label } : p)),
    );
  };

  const handleAddProvider = () => {
    const value = newProviderValue.trim().toLowerCase();
    const label = newProviderLabel.trim();
    if (!value || !label) return;
    if (providers.some((p) => p.value === value)) {
      setError(`Provider "${value}" already exists.`);
      return;
    }
    updateProviders((prev) => [
      ...prev,
      { value, label, models: [], upcoming: false },
    ]);
    setNewProviderValue("");
    setNewProviderLabel("");
    setShowAddProvider(false);
    setError("");
  };

  const handleRemoveProvider = (providerValue: string) => {
    if (providers.length <= 1) return;
    updateProviders((prev) => prev.filter((p) => p.value !== providerValue));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    updateMutation.mutate(providers);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bot Models</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure available LLM providers and models for bots.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddProvider((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-input rounded-lg bg-card text-card-foreground hover:bg-secondary/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      {showAddProvider && (
        <div className="mb-6 p-4 bg-card rounded-xl border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-card-foreground">
              New Provider
            </h2>
            <button
              type="button"
              onClick={() => setShowAddProvider(false)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={newProviderValue}
              onChange={(e) => setNewProviderValue(e.target.value)}
              placeholder="Provider ID (e.g. openai)"
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              value={newProviderLabel}
              onChange={(e) => setNewProviderLabel(e.target.value)}
              placeholder="Display label (e.g. OpenAI (Cloud))"
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddProvider}
              disabled={!newProviderValue.trim() || !newProviderLabel.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {providers.map((provider) => (
          <div
            key={provider.value}
            className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <Cpu className="w-5 h-5 text-primary shrink-0" />
                <input
                  type="text"
                  value={provider.label}
                  onChange={(e) =>
                    handleLabelChange(provider.value, e.target.value)
                  }
                  className="font-semibold text-card-foreground bg-transparent border border-transparent hover:border-input focus:border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <code className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono">
                  {provider.value}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleUpcoming(provider.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    provider.upcoming
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  }`}
                >
                  {provider.upcoming ? "Upcoming (Disabled)" : "Enabled"}
                </button>
                {providers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProvider(provider.value)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove provider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {provider.models.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No models configured for this provider.
                </p>
              ) : (
                <div className="divide-y divide-border border border-border rounded-lg bg-background">
                  {provider.models.map((model) => (
                    <div
                      key={model}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <code className="text-xs font-mono text-foreground">
                        {model}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleRemoveModel(provider.value, model)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title={`Remove ${model}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newModels[provider.value] || ""}
                onChange={(e) =>
                  setNewModels((prev) => ({
                    ...prev,
                    [provider.value]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddModel(provider.value);
                  }
                }}
                placeholder="Add model ID (e.g. llama-3.3-70b-versatile)"
                className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => handleAddModel(provider.value)}
                disabled={!(newModels[provider.value] || "").trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Model
              </button>
            </div>
          </div>
        ))}

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
