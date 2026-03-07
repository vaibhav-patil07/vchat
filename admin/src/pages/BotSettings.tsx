import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { api, type BotUpdate } from '../api/client';

const PROVIDERS = [
  { value: 'ollama', label: 'Ollama (Local)', models: ['llama3.2:3b', 'llama3.2:1b', 'phi3.5', 'gemma2:2b', 'mistral'] },
  { value: 'groq', label: 'Groq (Cloud)', models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'meta-llama/llama-4-scout-17b-16e-instruct', 'qwen/qwen3-32b'] },
  { value: 'together', label: 'Together AI (Cloud)', models: ['meta-llama/Llama-3.2-3B-Instruct-Turbo', 'Qwen/Qwen2.5-7B-Instruct-Turbo'] },
];

export function BotSettings() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: bot, isLoading } = useQuery({
    queryKey: ['bot', id],
    queryFn: () => api.bots.get(id!),
    enabled: !!id,
  });

  const [form, setForm] = useState<BotUpdate>({});

  useEffect(() => {
    if (bot) {
      setForm({
        name: bot.name,
        system_prompt: bot.system_prompt,
        provider: bot.provider,
        model_name: bot.model_name,
        temperature: bot.temperature,
        max_tokens: bot.max_tokens,
      });
    }
  }, [bot]);

  const updateMutation = useMutation({
    mutationFn: (data: BotUpdate) => api.bots.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', id] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const currentProvider = PROVIDERS.find(p => p.value === form.provider);

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!bot) return <div className="text-center py-20 text-muted-foreground">Bot not found</div>;

  return (
    <div className="max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Bots
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Bot Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">System Prompt</label>
            <textarea
              rows={6}
              value={form.system_prompt || ''}
              onChange={(e) => setForm(f => ({ ...f, system_prompt: e.target.value }))}
              placeholder="You are a helpful assistant..."
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y"
            />
            <p className="mt-1 text-xs text-muted-foreground">Define how the bot should behave, its persona, and any rules</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-card-foreground">Model Configuration</h2>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Provider</label>
            <select
              value={form.provider || 'ollama'}
              onChange={(e) => {
                const p = PROVIDERS.find(p => p.value === e.target.value);
                setForm(f => ({ ...f, provider: e.target.value, model_name: p?.models[0] }));
              }}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Model</label>
            <select
              value={form.model_name || ''}
              onChange={(e) => setForm(f => ({ ...f, model_name: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {currentProvider?.models.map(m => (
                <option key={m} value={m}>{m}</option>
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
              onChange={(e) => setForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Max Tokens</label>
            <input
              type="number"
              min={1}
              max={8192}
              value={form.max_tokens ?? 1024}
              onChange={(e) => setForm(f => ({ ...f, max_tokens: parseInt(e.target.value) || 1024 }))}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}</>}
        </button>
      </form>
    </div>
  );
}
