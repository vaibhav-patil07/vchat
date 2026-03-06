import { useState } from 'react';
import { ChatWidget } from '@vchat/react';
import type { WidgetPosition } from '@vchat/react';
import { CodeBlock } from '../components/CodeBlock';

export function WidgetDemo() {
  const [position, setPosition] = useState<WidgetPosition>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  return (
    <div>
      <div style={sectionHeader}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>ChatWidget</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          A floating chat bubble that opens a chat panel. Click the bubble in the corner to try it.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={card}>
          <h3 style={cardTitle}>Customize</h3>

          <label style={labelStyle}>Position</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['bottom-right', 'bottom-left'] as WidgetPosition[]).map(p => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                style={{
                  ...optionBtn,
                  background: position === p ? '#6366f1' : '#f1f5f9',
                  color: position === p ? '#fff' : '#475569',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <label style={labelStyle}>Primary Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }}
            />
            <code style={{ fontSize: 13, color: '#64748b' }}>{primaryColor}</code>
          </div>
        </div>

        <CodeBlock
          title="Usage"
          code={`import { VChatProvider, ChatWidget } from '@vchat/react';
import '@vchat/react/style.css';

function App() {
  return (
    <VChatProvider
      apiUrl="http://localhost:8000"
      botId="your-bot-id"
    >
      <ChatWidget
        position="${position}"
        theme={{ primaryColor: "${primaryColor}" }}
        welcomeMessage="Hi! How can I help?"
        placeholder="Type a message..."
      />
      {/* Your app content */}
    </VChatProvider>
  );
}`}
        />
      </div>

      <ChatWidget
        position={position}
        theme={{ primaryColor }}
        welcomeMessage="Hi there! I'm a VChat bot. Ask me anything."
        placeholder="Type a message..."
        title="VChat Demo"
      />
    </div>
  );
}

const sectionHeader: React.CSSProperties = { marginBottom: 24 };

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '20px 24px',
};

const cardTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 16,
  color: '#334155',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
};

const optionBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
};
