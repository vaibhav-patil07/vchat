import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Settings, BookOpen, MessageSquare, Trash2 } from 'lucide-react';
import { api, type Bot } from '../api/client';

export function Dashboard() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: bots, isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: api.bots.list,
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

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bots</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage your chatbots</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Bot
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex gap-3">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Bot name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100">
            Cancel
          </button>
        </form>
      )}

      {bots && bots.length === 0 && !showCreate && (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No bots yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first chatbot to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Create Bot
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bots?.map((bot: Bot) => (
          <div key={bot.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 truncate">{bot.name}</h3>
              <button
                onClick={() => { if (confirm('Delete this bot?')) deleteMutation.mutate(bot.id); }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {bot.provider}/{bot.model_name}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{bot.document_count} docs</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{bot.conversation_count} chats</span>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/bots/${bot.id}/settings`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <Link
                to={`/bots/${bot.id}/knowledge`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Knowledge
              </Link>
              <Link
                to={`/bots/${bot.id}/chat`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
