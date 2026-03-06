interface CodeBlockProps {
  title: string;
  code: string;
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  return (
    <div style={wrapper}>
      <div style={header}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{title}</span>
      </div>
      <pre style={pre}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const wrapper: React.CSSProperties = {
  borderRadius: 10,
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  background: '#1e293b',
};

const header: React.CSSProperties = {
  padding: '8px 16px',
  background: '#0f172a',
  borderBottom: '1px solid #334155',
};

const pre: React.CSSProperties = {
  padding: '16px',
  margin: 0,
  overflow: 'auto',
  fontSize: 13,
  lineHeight: 1.6,
  color: '#e2e8f0',
  fontFamily: '"Fira Code", "Cascadia Code", monospace',
};
