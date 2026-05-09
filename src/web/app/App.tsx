import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Login } from './Login';
import { Habits } from './Habits';
import { TodoBoard } from './TodoBoard';
import { GlobalDashboard } from './GlobalDashboard';
import { useTheme } from './ThemeContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  KanbanSquare, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X
} from 'lucide-react';

type View = 'dashboard' | 'habits' | 'todo';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const checkAuth = useCallback(async () => {
    try {
      await api.getTasks();
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'habits', label: 'Habits', icon: <CheckSquare size={20} /> },
    { id: 'todo', label: 'Tasks', icon: <KanbanSquare size={20} /> },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#1a1a2e] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-pink-500 dark:from-brand-400 dark:to-pink-400 bg-clip-text text-transparent">
          Kawaii Tracker
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-500 dark:text-gray-400">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex p-6 items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-pink-500 dark:from-brand-400 dark:to-pink-400 bg-clip-text text-transparent">
            Kawaii Tracker
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 md:py-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button 
            onClick={toggleTheme}
            className="hidden md:flex w-full items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button 
            onClick={() => { api.logout(); setAuthenticated(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-0 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {activeView === 'dashboard' && <GlobalDashboard />}
          {activeView === 'habits' && <Habits />}
          {activeView === 'todo' && <TodoBoard />}
        </div>
      </main>
    </div>
  );
}
