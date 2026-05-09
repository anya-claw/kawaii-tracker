import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface DashboardItem {
  task: string;
  description: string | null;
  type: 'daily' | 'weekly' | 'one-off';
  daily_target?: number;
  weekly_target?: number;
  daily_target_display?: number;
  today_completed?: number;
  today_progress?: string;
  today_done?: boolean;
  week_completed?: number;
  week_progress?: string;
  current_streak: number;
  longest_streak: number;
  total_days?: number;
  total_weeks?: number;
}

export function Habits() {
  const [dashboard, setDashboard] = useState<DashboardItem[]>([]);
  const [showCheckin, setShowCheckin] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [mood, setMood] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleCheckin = async (taskName: string) => {
    try {
      await api.addEvent({ task: taskName, details: details || undefined, mood: mood || undefined });
      setShowCheckin(null);
      setDetails('');
      setMood('');
      loadDashboard();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getProgress = (item: DashboardItem) => {
    if (item.type === 'weekly') {
      return { current: item.week_completed || 0, total: item.weekly_target || 1 };
    }
    return { current: item.today_completed || 0, total: item.daily_target || 1 };
  };

  return (
    <div>
      {dashboard.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📝</div>
          <p>No tasks yet. Create one from the CLI!</p>
        </div>
      ) : (
        dashboard.map(item => {
          const progress = getProgress(item);
          const percent = Math.min(100, (progress.current / progress.total) * 100);
          const isDone = item.type === 'weekly'
            ? (item.week_completed || 0) >= (item.weekly_target || 1)
            : item.today_done;

          return (
            <div className="card" key={item.task}>
              <div className="card-header">
                <span className="card-title">{item.task}</span>
                <span className={`card-badge ${
                  item.type === 'daily' ? 'badge-daily' :
                  item.type === 'weekly' ? 'badge-weekly' : 'badge-oneoff'
                }`}>
                  {item.type === 'daily' && `Daily${(item.daily_target || 1) > 1 ? ` ${item.daily_target}x` : ''}`}
                  {item.type === 'weekly' && `Weekly ${item.weekly_target}x`}
                  {item.type === 'one-off' && 'One-off'}
                </span>
              </div>

              {item.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
                  {item.description}
                </p>
              )}

              {item.type !== 'one-off' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span>{item.type === 'weekly' ? 'This Week' : 'Today'}</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                </>
              )}

              <div className="stats-row">
                <div className="stat-item">🔥 {item.current_streak} streak</div>
                <div className="stat-item">🏆 {item.longest_streak} best</div>
                <div className="stat-item">📅 {item.total_days || item.total_weeks || 0} total</div>
              </div>

              {!isDone && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12, width: '100%' }}
                  onClick={() => setShowCheckin(item.task)}
                >
                  ✅ Check In
                </button>
              )}
              {isDone && (
                <div className="card-badge badge-done" style={{ marginTop: 12, textAlign: 'center', display: 'block' }}>
                  ✅ Done!
                </div>
              )}
            </div>
          );
        })
      )}

      {showCheckin && (
        <div className="modal-overlay" onClick={() => setShowCheckin(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Check in: {showCheckin}</h2>
            <div className="input-group">
              <label className="input-label">Details (optional)</label>
              <input
                className="input"
                placeholder="What did you do?"
                value={details}
                onChange={e => setDetails(e.target.value)}
                autoFocus
              />
            </div>
            <div className="input-group">
              <label className="input-label">Mood (optional)</label>
              <input
                className="input"
                placeholder="🌟 😊 😐 😩"
                value={mood}
                onChange={e => setMood(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCheckin(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleCheckin(showCheckin)}>Check In</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
