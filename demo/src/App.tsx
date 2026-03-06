import { useState } from 'react';
import { VChatProvider } from '@vchat/react';
import '@vchat/react/style.css';

import { Header } from './components/Header';
import { SetupBanner } from './components/SetupBanner';
import { WidgetDemo } from './pages/WidgetDemo';
import { InlineDemo } from './pages/InlineDemo';
import { HeadlessDemo } from './pages/HeadlessDemo';

type Tab = 'widget' | 'inline' | 'headless';

export default function App() {
  const [tab, setTab] = useState<Tab>('widget');
  const [botId, setBotId] = useState(() => localStorage.getItem('vchat_demo_bot_id') || '');
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('vchat_demo_api_url') || 'http://localhost:8000');

  const handleSaveConfig = (newApiUrl: string, newBotId: string) => {
    setApiUrl(newApiUrl);
    setBotId(newBotId);
    localStorage.setItem('vchat_demo_api_url', newApiUrl);
    localStorage.setItem('vchat_demo_bot_id', newBotId);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab={tab} onTabChange={setTab} />

      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        <SetupBanner apiUrl={apiUrl} botId={botId} onSave={handleSaveConfig} />

        {botId ? (
          <VChatProvider apiUrl={apiUrl} botId={botId}>
            {tab === 'widget' && <WidgetDemo />}
            {tab === 'inline' && <InlineDemo />}
            {tab === 'headless' && <HeadlessDemo />}
          </VChatProvider>
        ) : (
          <div style={emptyState}>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>
              Enter your Bot ID above to start the demo
            </p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
              Create a bot in the Admin UI first, then paste its ID here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const emptyState: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 20px',
  textAlign: 'center',
};
