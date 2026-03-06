import { useState } from 'react';

interface SetupBannerProps {
  apiUrl: string;
  botId: string;
  onSave: (apiUrl: string, botId: string) => void;
}

export function SetupBanner({ apiUrl, botId, onSave }: SetupBannerProps) {
  const [editing, setEditing] = useState(!botId);
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localBotId, setLocalBotId] = useState(botId);

  const handleSave = () => {
    onSave(localApiUrl.trim(), localBotId.trim());
    if (localBotId.trim()) setEditing(false);
  };

  if (!editing && botId) {
    return (
      <div style={connectedBanner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={dot} />
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Connected to <strong style={{ color: '#1e293b' }}>{apiUrl}</strong> &mdash; Bot <code style={codePill}>{botId.slice(0, 8)}...</code>
          </span>
        </div>
        <button onClick={() => setEditing(true)} style={editBtn}>Change</button>
      </div>
    );
  }

  return (
    <div style={setupCard}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Connect to your VChat API</h3>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Enter the API URL and a Bot ID from your admin dashboard.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={localApiUrl}
          onChange={e => setLocalApiUrl(e.target.value)}
          placeholder="API URL (e.g. http://localhost:8000)"
          style={{ ...inputStyle, maxWidth: 300 }}
        />
        <input
          value={localBotId}
          onChange={e => setLocalBotId(e.target.value)}
          placeholder="Bot ID (UUID)"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={handleSave} style={saveBtn}>Connect</button>
      </div>
    </div>
  );
}

const setupCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 24,
};

const connectedBanner: React.CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 10,
  padding: '10px 16px',
  marginBottom: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 8,
};

const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#22c55e',
  flexShrink: 0,
};

const codePill: React.CSSProperties = {
  background: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 12,
  fontFamily: 'monospace',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  minWidth: 200,
};

const saveBtn: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const editBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '4px 12px',
  fontSize: 12,
  color: '#64748b',
  cursor: 'pointer',
};
