import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bot, MessageSquare } from 'lucide-react';

export function Layout() {
  const location = useLocation();

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
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  Bots
                </span>
              </Link>
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
