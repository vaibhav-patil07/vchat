import { useState } from 'react';
import { useVChat } from '@vchat/react';
import { CodeBlock } from '../components/CodeBlock';

export function HeadlessDemo() {
  return (
    <div>
      <div style={sectionHeader}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>useVChat Hook</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
          A headless hook for building completely custom chat UIs. Full control over rendering.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={liveLabel}>Live Preview &mdash; Custom UI</div>
          <CustomChatUI />
        </div>

        <CodeBlock
          title="Usage"
          code={`import { useVChat, VChatProvider } from '@vchat/react';

function CustomChat() {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    reset,
  } = useVChat();

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong>
          <span>{msg.content}</span>
        </div>
      ))}

      {isLoading && <p>Thinking...</p>}
      {error && <p>Error: {error}</p>}

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e =>
          e.key === 'Enter' && handleSend()
        }
      />
      <button onClick={handleSend}>Send</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`}
        />
      </div>
    </div>
  );
}

function CustomChatUI() {
  const { messages, sendMessage, isLoading, error, reset } = useVChat();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div style={chatContainer}>
      <div style={chatHeader}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Custom Chat UI</span>
        <button onClick={reset} style={resetBtn}>Reset</button>
      </div>

      <div style={messagesArea}>
        {messages.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', margin: 'auto', fontSize: 13 }}>
            This chat uses the headless useVChat() hook with a fully custom UI.
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: msg.role === 'user' ? '#6366f1' : '#059669',
              marginBottom: 4,
              letterSpacing: '0.03em',
            }}>
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: '#1e293b',
              background: msg.role === 'user' ? '#f1f5f9' : '#ecfdf5',
              padding: '10px 14px',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
              {isLoading && msg.role === 'assistant' && msg.content === '' && (
                <span style={{ color: '#94a3b8' }}>Thinking...</span>
              )}
            </div>
          </div>
        ))}
        {error && (
          <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}
      </div>

      <div style={inputArea}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type something..."
          disabled={isLoading}
          style={inputStyle}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()} style={sendBtn}>
          Send
        </button>
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

const chatContainer: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  height: 480,
};

const chatHeader: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#fafafa',
};

const resetBtn: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 12,
  background: '#fff',
  color: '#64748b',
  cursor: 'pointer',
};

const messagesArea: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
};

const inputArea: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
};

const sendBtn: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  opacity: 1,
};
