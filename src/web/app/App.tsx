import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { Login } from './Login';
import { Habits } from './Habits';
import { TodoBoard } from './TodoBoard';

type Tab = 'habits' | 'todo';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('habits');

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
    return <div className="app" style={{ textAlign: 'center', paddingTop: 100 }}>Loading...</div>;
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app">
      <div className="header">
        <h1>🐾 Kawaii Tracker</h1>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { api.logout(); setAuthenticated(false); }}>
            Logout
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          📊 Habits
        </button>
        <button
          className={`tab ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          📋 Todo
        </button>
      </div>

      {activeTab === 'habits' ? <Habits /> : <TodoBoard />}
    </div>
  );
}
