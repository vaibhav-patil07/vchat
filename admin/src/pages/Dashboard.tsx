import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Settings, BookOpen, MessageSquare, Trash2, Filter, History } from 'lucide-react';
import { api, type Bot } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const isAdmin = user?.role === 'admin';

  const { data: bots, isLoading } = useQuery({
    queryKey: ['bots', ownerFilter],
    queryFn: () => api.bots.list(ownerFilter || undefined),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.bots.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setShowCreate(false);
      setNewName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.bots.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bots'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) createMutation.mutate(newName.trim());
  };

  const botLimit = user?.botLimit;
  const atLimit = botLimit != null && (bots?.length ?? 0) >= botLimit;

  const ownerOptions: { value: string; label: string }[] = [
    { value: '', label: 'All users' },
    { value: user?.email ?? '', label: 'My bots' },
    { value: 'guest', label: 'Guest bots' },
  ];
  if (users) {
    for (const u of users) {
      if (u.email !== user?.email) {
        ownerOptions.push({ value: u.email, label: u.email });
      }
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bots</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {botLimit != null
              ? `${bots?.length ?? 0} / ${botLimit} bots`
              : 'Create and manage your chatbots'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="pl-8 pr-3 py-2 border border-input rounded-lg text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                {ownerOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            disabled={atLimit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={atLimit ? 'Bot limit reached' : undefined}
          >
            <Plus className="w-4 h-4" />
            Create Bot
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-card rounded-xl border border-border shadow-sm flex gap-3">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Bot name..."
            className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary">
            Cancel
          </button>
        </form>
      )}

      {bots && bots.length === 0 && !showCreate && (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No bots yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {ownerFilter ? 'No bots found for this filter' : 'Create your first chatbot to get started'}
          </p>
          {!ownerFilter && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Bot
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bots?.map((bot: Bot) => (
          <div key={bot.id} className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-card-foreground truncate">{bot.name}</h3>
              <button
                onClick={() => { if (confirm('Delete this bot?')) deleteMutation.mutate(bot.id); }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {bot.provider}/{bot.model_name}
            </p>
            {isAdmin && (
              <p className="text-[11px] text-muted-foreground/70 mb-3 truncate">
                by {bot.created_by}
              </p>
            )}
            {!isAdmin && <div className="mb-3" />}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{bot.document_count} docs</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{bot.conversation_count} chats</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Link
                  to={`/bots/${bot.id}/settings`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
                <Link
                  to={`/bots/${bot.id}/knowledge`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Knowledge
                </Link>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/bots/${bot.id}/chat`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat
                </Link>
                {isAdmin && (
                  <Link
                    to={`/bots/${bot.id}/history`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    History
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
