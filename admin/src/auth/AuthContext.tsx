import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { jwtDecode } from './jwt';

export type Role = 'admin' | 'user' | 'guest';

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  role: Role;
  botLimit: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (credential: string, role: Role, botLimit: number | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): { user: AuthUser; token: string } | null {
  const token = localStorage.getItem('vchat_token');
  const raw = localStorage.getItem('vchat_user');
  if (!token || !raw) return null;
  try {
    const user = JSON.parse(raw) as AuthUser;
    if (user.role !== 'guest') {
      const payload = jwtDecode(token);
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('vchat_token');
        localStorage.removeItem('vchat_user');
        return null;
      }
    }
    return { token, user };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadSession);

  const login = useCallback((credential: string, role: Role, botLimit: number | null) => {
    let user: AuthUser;
    if (role === 'guest') {
      user = { email: 'guest', name: 'Guest', picture: '', role: 'guest', botLimit };
    } else {
      const payload = jwtDecode(credential);
      user = {
        email: payload.email ?? '',
        name: payload.name ?? '',
        picture: payload.picture ?? '',
        role,
        botLimit,
      };
    }
    localStorage.setItem('vchat_token', credential);
    localStorage.setItem('vchat_user', JSON.stringify(user));
    setSession({ token: credential, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vchat_token');
    localStorage.removeItem('vchat_user');
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
