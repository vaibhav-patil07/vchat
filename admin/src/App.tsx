import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BotSettings } from './pages/BotSettings';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { TestChat } from './pages/TestChat';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bots/:id/settings" element={<BotSettings />} />
            <Route path="/bots/:id/knowledge" element={<KnowledgeBase />} />
            <Route path="/bots/:id/chat" element={<TestChat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
