import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { CheckCircle2, Circle, Flame, Award, Calendar, Repeat, CalendarDays } from 'lucide-react';

export function Habits() {
  const [dashboard, setDashboard] = useState<any[]>([]);
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

  const getProgress = (item: any) => {
    if (item.type === 'weekly') {
      return { current: item.week_completed || 0, total: item.weekly_target || 1 };
    }
    return { current: item.today_completed || 0, total: item.daily_target || 1 };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Habit Tracker</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track your daily and weekly habits</p>
      </header>

      {dashboard.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-800">
          <CalendarDays size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No habits tracked yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create your first task from the CLI!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard.map(item => {
            const progress = getProgress(item);
            const percent = Math.min(100, (progress.current / progress.total) * 100);
            const isDone = item.type === 'weekly'
              ? (item.week_completed || 0) >= (item.weekly_target || 1)
              : item.today_done;

            return (
              <div 
                key={item.task} 
                className={`bg-white dark:bg-[#1a1a2e] rounded-2xl border transition-all duration-300 overflow-hidden
                  ${isDone 
                    ? 'border-green-200 dark:border-green-900/30 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
                    : 'border-gray-100 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700/50 hover:shadow-md'
                  }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {item.task}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${item.type === 'daily' ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' :
                            item.type === 'weekly' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                        >
                          {item.type === 'daily' ? <Repeat size={12} /> : <Calendar size={12} />}
                          {item.type === 'daily' && `Daily${(item.daily_target || 1) > 1 ? ` ${item.daily_target}x` : ''}`}
                          {item.type === 'weekly' && `Weekly ${item.weekly_target}x`}
                          {item.type === 'one-off' && 'One-off'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {item.description}
                    </p>
                  )}

                  {item.type !== 'one-off' && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <span>{item.type === 'weekly' ? 'This Week Progress' : 'Today Progress'}</span>
                        <span>{progress.current} / {progress.total}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-brand-500 to-pink-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-gray-50 dark:border-gray-800/50 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-orange-500 mb-1">
                        <Flame size={18} />
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{item.current_streak}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Streak</div>
                    </div>
                    <div className="text-center border-x border-gray-50 dark:border-gray-800/50">
                      <div className="flex items-center justify-center text-yellow-500 mb-1">
                        <Award size={18} />
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{item.longest_streak}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Best</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-blue-500 mb-1">
                        <Calendar size={18} />
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{item.total_days || item.total_weeks || 0}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
                    </div>
                  </div>

                  {!isDone ? (
                    <button
                      onClick={() => setShowCheckin(item.task)}
                      className="w-full py-3 px-4 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 dark:text-brand-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors group"
                    >
                      <Circle size={18} className="group-hover:hidden" />
                      <CheckCircle2 size={18} className="hidden group-hover:block" />
                      Check In Now
                    </button>
                  ) : (
                    <div className="w-full py-3 px-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium rounded-xl flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCheckin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Check in: {showCheckin}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Record your progress</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details (optional)</label>
                <input
                  type="text"
                  placeholder="What did you accomplish?"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-gray-900 dark:text-white transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mood (optional)</label>
                <input
                  type="text"
                  placeholder="How do you feel? 🌟 😊"
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-gray-900 dark:text-white transition-all"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f0f0f]/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowCheckin(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleCheckin(showCheckin)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
