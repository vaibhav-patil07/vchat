type Tab = 'widget' | 'inline' | 'headless';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; description: string }[] = [
  { id: 'widget', label: 'ChatWidget', description: 'Floating bubble' },
  { id: 'inline', label: 'ChatWindow', description: 'Inline embed' },
  { id: 'headless', label: 'useVChat', description: 'Custom hook' },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={headerInner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={logoIcon}>V</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>VChat SDK Demo</h1>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>@vchat/react integration examples</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                ...tabBtn,
                background: activeTab === t.id ? '#6366f1' : 'transparent',
                color: activeTab === t.id ? '#fff' : '#64748b',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>{t.description}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e2e8f0',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const headerInner: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '12px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 12,
};

const logoIcon: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 18,
};

const tabBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  transition: 'all 0.15s',
};
