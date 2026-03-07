import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Mail, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { api, type AllowedUser } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function Users() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [botLimit, setBotLimit] = useState(5);
  const [error, setError] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  });

  const addMutation = useMutation({
    mutationFn: ({ email, bot_limit }: { email: string; bot_limit: number }) =>
      api.users.add(email, bot_limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEmail('');
      setBotLimit(5);
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, bot_limit }: { id: string; bot_limit: number }) =>
      api.users.update(id, bot_limit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === user?.email.toLowerCase()) {
      setError("You can't add yourself — you're already the admin.");
      return;
    }
    if (trimmed === 'guest') {
      setError("Guest is already in the list.");
      return;
    }
    setError('');
    addMutation.mutate({ email: trimmed, bot_limit: botLimit });
  };

  const guestEntry = users?.find((u) => u.email === 'guest');
  const regularUsers = users?.filter((u) => u.email !== 'guest') ?? [];

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Allowed Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage who can access VChat and how many bots they can create.
        </p>
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <input
          type="number"
          min={1}
          max={100}
          value={botLimit}
          onChange={(e) => setBotLimit(parseInt(e.target.value) || 1)}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Bot limit"
        />
        <button
          type="submit"
          disabled={addMutation.isPending || !email.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {addMutation.isPending ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {/* Admin row */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                <span className="ml-2 text-[10px] font-medium bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  ADMIN
                </span>
              </div>
            </div>
            <span className="text-xs text-gray-400">Unlimited</span>
          </div>
        </div>

        {/* Guest row */}
        {guestEntry && (
          <div className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Guest</span>
                  <span className="ml-2 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    GUEST
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Limit:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={guestEntry.bot_limit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 100) {
                      updateMutation.mutate({ id: guestEntry.id, bot_limit: val });
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Regular users */}
        {regularUsers.map((u: AllowedUser) => (
          <div key={u.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.email}</p>
                <p className="text-xs text-gray-400">Added {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Limit:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={u.bot_limit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= 100) {
                        updateMutation.mutate({ id: u.id, bot_limit: val });
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => { if (confirm(`Remove ${u.email}?`)) removeMutation.mutate(u.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {regularUsers.length === 0 && !guestEntry && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No users added yet. Add an email above to grant access.
          </div>
        )}
      </div>
    </div>
  );
}
