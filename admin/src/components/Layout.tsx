import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bot, MessageSquare, LogOut, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLink = (to: string, label: string, Icon: typeof Bot, match: (p: string) => boolean) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        match(location.pathname) ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="w-4 h-4" />
        {label}
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
              <MessageSquare className="w-6 h-6" />
              VChat
            </Link>
            <nav className="flex items-center gap-6">
              {navLink('/', 'Bots', Bot, (p) => p === '/' || p.startsWith('/bots'))}
              {user?.role === 'admin' && navLink('/users', 'Users', Users, (p) => p === '/users')}
              {user && (
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {user.role === 'guest' ? 'G' : user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-sm text-gray-600">
                      {user.role === 'guest' ? 'Guest' : user.email}
                    </span>
                    {user.role === 'guest' && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        GUEST
                      </span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
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
