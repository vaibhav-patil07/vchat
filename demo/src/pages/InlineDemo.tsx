import { ChatWindow } from '@vchat/react';
import { CodeBlock } from '../components/CodeBlock';

export function InlineDemo() {
  return (
    <div>
      <div style={sectionHeader}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>ChatWindow</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          An inline chat component that you can embed directly in your page layout.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={liveLabel}>Live Preview</div>
          <div style={previewFrame}>
            <ChatWindow
              title="Support Chat"
              welcomeMessage="Welcome! Ask me anything about VChat."
              placeholder="Ask a question..."
              style={{ height: 460 }}
            />
          </div>
        </div>

        <div>
          <CodeBlock
            title="Usage"
            code={`import { VChatProvider, ChatWindow } from '@vchat/react';
import '@vchat/react/style.css';

function SupportPage() {
  return (
    <VChatProvider
      apiUrl="http://localhost:8000"
      botId="your-bot-id"
    >
      <div className="page-layout">
        <h1>Help Center</h1>
        <ChatWindow
          title="Support Chat"
          welcomeMessage="Welcome! How can we help?"
          placeholder="Ask a question..."
          style={{ height: 500 }}
        />
      </div>
    </VChatProvider>
  );
}`}
          />

          <div style={{ ...card, marginTop: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>When to use ChatWindow</h4>
            <ul style={listStyle}>
              <li>Dedicated help/support pages</li>
              <li>Side panels in dashboards</li>
              <li>Full-page chat experiences</li>
              <li>When you want the chat always visible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionHeader: React.CSSProperties = { marginBottom: 24 };

const liveLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#22c55e',
  marginBottom: 8,
};

const previewFrame: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '16px 20px',
};

const listStyle: React.CSSProperties = {
  paddingLeft: 18,
  fontSize: 13,
  color: '#64748b',
  lineHeight: 1.8,
};
