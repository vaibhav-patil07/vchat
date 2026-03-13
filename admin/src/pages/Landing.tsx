import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Bot,
  BookOpen,
  Settings2,
  Code2,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

const features = [
  {
    icon: Bot,
    title: 'Bot as a Service',
    description: 'Create and deploy intelligent chatbots in minutes. Each bot is fully configurable with its own personality, rules, and knowledge.',
  },
  {
    icon: Settings2,
    title: 'Configurable Models',
    description: 'Choose from multiple LLM providers — Ollama, Groq, or Together AI — and switch models on the fly with adjustable temperature and token limits.',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base (RAG)',
    description: 'Upload PDF, TXT, or Markdown documents. Your bot uses Retrieval-Augmented Generation to answer questions grounded in your own data.',
  },
  {
    icon: Code2,
    title: 'Embeddable SDK',
    description: 'Drop a React widget, inline chat window, or headless hook into any app. One line of code to add AI chat to your product.',
  },
  {
    icon: Users,
    title: 'Multi-User Access',
    description: 'Invite team members via Google sign-in with configurable bot limits per user. Guests can trial with a limited sandbox.',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description: 'Google OAuth authentication, role-based access control, and per-user bot isolation keep your data safe.',
  },
];

const steps = [
  { step: '1', title: 'Create a Bot', description: 'Name it, choose a model provider, and set the system prompt.' },
  { step: '2', title: 'Add Knowledge', description: 'Upload documents — they get chunked and embedded automatically.' },
  { step: '3', title: 'Embed Anywhere', description: 'Use the React SDK to add the bot to your website or app.' },
];

export function Landing() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <MessageSquare className="w-6 h-6" />
            VChat
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={cycleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            <Zap className="w-3 h-3" />
            AI Chatbot Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Build AI Chatbots
            <br />
            <span className="text-primary">Powered by Your Data</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10">
            Create intelligent, knowledge-aware chatbots with configurable LLM providers.
            Upload your documents, pick a model, and embed a chat widget in any React app — all in minutes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete platform for building, managing, and deploying AI-powered chatbots with your own knowledge base.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to go from zero to a deployed chatbot.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model providers */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Flexible Model Providers</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Bring your own model or use a hosted provider. Switch between them at any time — no code changes needed.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { name: 'Ollama', desc: 'Run models locally on your own hardware. Full privacy, zero API costs.', tag: 'Local', upcoming: true },
            { name: 'Groq', desc: 'Ultra-fast inference with LPU technology. Lightning-quick responses at scale.', tag: 'Cloud', upcoming: false },
            { name: 'Together AI', desc: 'Access a wide catalog of models via a simple API.', tag: 'Cloud', upcoming: true },
          ].map((p) => (
            <div key={p.name} className={`relative bg-card rounded-xl border border-border p-6 text-center ${p.upcoming ? 'opacity-60' : ''}`}>
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-3">
                {p.tag}
              </span>
              {p.upcoming && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  Upcoming
                </span>
              )}
              <h3 className="font-semibold text-card-foreground mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">
            Ready to Build Your Bot?
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
            Sign in to create your first AI chatbot, upload your knowledge base, and embed it anywhere.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-primary bg-white rounded-xl hover:bg-white/90 transition-colors shadow-lg"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">VChat</span>
            <span>&middot; AI Chatbot Platform</span>
          </div>
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vaibhav Patil. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
