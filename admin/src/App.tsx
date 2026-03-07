import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BotSettings } from './pages/BotSettings';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { TestChat } from './pages/TestChat';
import { Users } from './pages/Users';
import { Integration } from './pages/Integration';
import { Login } from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function ProtectedRoutes() {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        {user.role === 'admin' && <Route path="/users" element={<Users />} />}
        <Route path="/integration" element={<Integration />} />
        <Route path="/bots/:id/settings" element={<BotSettings />} />
        <Route path="/bots/:id/knowledge" element={<KnowledgeBase />} />
        <Route path="/bots/:id/chat" element={<TestChat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ProtectedRoutes />
            </BrowserRouter>
          </QueryClientProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
