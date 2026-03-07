import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  title: string;
  code: string;
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#1e293b]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f172a] border-b border-[#334155]">
        <span className="text-xs font-semibold text-[#94a3b8]">{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-[#94a3b8] hover:text-white transition-colors"
        >
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-auto text-[13px] leading-relaxed text-[#e2e8f0] font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
