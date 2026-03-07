import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { MessageSquare, ShieldAlert, Users } from 'lucide-react';
import { useAuth, type Role } from '../auth/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError('No credential received from Google');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${response.credential}` },
      });

      if (res.status === 403) {
        setError('Access denied. Your email is not authorized. Ask the admin to add you.');
        return;
      }
      if (!res.ok) {
        setError('Authentication failed. Please try again.');
        return;
      }

      const data = await res.json();
      login(response.credential, data.role as Role, data.bot_limit ?? null);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGuestLogin = async () => {
    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (!res.ok) {
        setError('Could not start guest session. Please try again.');
        return;
      }
      const data = await res.json();
      const guestMe = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const meData = guestMe.ok ? await guestMe.json() : {};
      login(data.token, 'guest', meData.bot_limit ?? 3);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">VChat Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to manage your bots</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {verifying ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
              Verifying...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  theme="outline"
                  size="large"
                  width="300"
                  text="signin_with"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={handleGuestLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4" />
                Continue as Guest
              </button>

              <p className="text-xs text-gray-400 text-center">
                Guests can create up to 3 bots to try things out.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
