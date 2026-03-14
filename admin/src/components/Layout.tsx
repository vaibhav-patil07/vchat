import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bot, MessageSquare, LogOut, Users, Sun, Moon, Monitor, Code2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  const navLink = (to: string, label: string, Icon: typeof Bot, match: (p: string) => boolean) => (
    <Link
      to={to}
      title={label}
      className={`text-sm font-medium transition-colors ${
        match(location.pathname) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
              <MessageSquare className="w-6 h-6" />
              VChat
            </Link>
            <nav className="flex items-center gap-3 sm:gap-6">
              {navLink('/', 'Bots', Bot, (p) => p === '/' || p.startsWith('/bots'))}
              {navLink('/integration', 'SDK', Code2, (p) => p === '/integration')}
              {user?.role === 'admin' && navLink('/users', 'Users', Users, (p) => p === '/users')}
              <button
                onClick={cycleTheme}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title={`Theme: ${theme}`}
              >
                <ThemeIcon className="w-4 h-4" />
              </button>
              {user && (
                <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-border">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                      {user.role === 'guest' ? 'G' : user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">
                      {user.role === 'guest' ? 'Guest' : user.email}
                    </span>
                    {user.role === 'guest' && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        GUEST
                      </span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
