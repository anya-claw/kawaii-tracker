import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import {
    CheckCircle2,
    Circle,
    Flame,
    Award,
    Calendar,
    Repeat,
    CalendarDays,
    BookOpen,
    Hash,
    BarChart3,
    Footprints,
    Plus,
    Trash2
} from 'lucide-react'

export function Habits() {
    const [dashboard, setDashboard] = useState<any[]>([])
    const [showCheckin, setShowCheckin] = useState<string | null>(null)
    const [details, setDetails] = useState('')
    const [mood, setMood] = useState('')
    const [showAddHabit, setShowAddHabit] = useState(false)
    const [newHabit, setNewHabit] = useState({ task: '', description: '', type: 'daily', target: 1 })

    const loadDashboard = useCallback(async () => {
        try {
            const data = await api.getDashboard()
            setDashboard(data)
        } catch (e) {
            console.error('Failed to load dashboard:', e)
        }
    }, [])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const handleCheckin = async (taskName: string) => {
        try {
            await api.addEvent({ task: taskName, details: details || undefined, mood: mood || undefined })
            setShowCheckin(null)
            setDetails('')
            setMood('')
            loadDashboard()
        } catch (e: any) {
            alert(e.message)
        }
    }

    const dailyTasks = dashboard.filter(t => t.type === 'daily')
    const otherTasks = dashboard.filter(t => t.type !== 'daily')

    const handleDeleteHabit = async (taskName: string) => {
        if (!confirm(`Are you sure you want to delete the habit "${taskName}"?`)) return
        try {
            await api.deleteTask(taskName)
            loadDashboard()
        } catch (e: any) {
            alert(e.message)
        }
    }

    const handleAddHabit = async () => {
        if (!newHabit.task.trim()) {
            alert('Task name is required')
            return
        }
        const payload: any = { task: newHabit.task.trim() }
        if (newHabit.description) payload.description = newHabit.description
        if (newHabit.type === 'daily') {
            payload.recurring_option = { type: 'daily', target: newHabit.target }
        } else if (newHabit.type === 'weekly') {
            payload.recurring_option = { type: 'weekly', target: newHabit.target }
        }

        try {
            await api.createTask(payload)
            setShowAddHabit(false)
            setNewHabit({ task: '', description: '', type: 'daily', target: 1 })
            loadDashboard()
        } catch (e: any) {
            alert(e.message)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habits</h1>
                <button
                    onClick={() => setShowAddHabit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition"
                >
                    <Plus size={18} /> New Habit
                </button>
            </div>

            {/* Today's Overview (Daily Tasks) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold mb-5 text-gray-900 dark:text-gray-50">
                    <CalendarDays className="text-brand-500 dark:text-brand-400" size={20} /> Today's Overview
                </h2>

                {dailyTasks.length === 0 ? (
                    <p className="text-gray-500 text-sm">No daily tasks found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dailyTasks.map(tag => {
                            const done = tag.today_done
                            const streak = tag.current_streak > 0

                            return (
                                <div
                                    key={tag.task}
                                    className={`relative rounded-xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                    ${
                        done
                            ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                                >
                                    <button
                                        onClick={() => !done && setShowCheckin(tag.task)}
                                        className="absolute top-3 right-3 transition-transform hover:scale-110"
                                    >
                                        {done ? (
                                            <CheckCircle2 className="text-emerald-500" size={24} />
                                        ) : (
                                            <Circle
                                                className="text-gray-300 dark:text-gray-500 hover:text-brand-400"
                                                size={24}
                                            />
                                        )}
                                    </button>

                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center
                        ${done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}
                                            >
                                                <BookOpen
                                                    size={16}
                                                    className={
                                                        done
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-gray-400'
                                                    }
                                                />
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                                                {tag.task}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteHabit(tag.task)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                                            title="Delete Habit"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 pl-[42px]">
                                        {tag.description || ''}
                                    </p>

                                    <div className="flex items-center gap-4 pl-[42px]">
                                        {streak && (
                                            <span className="flex items-center gap-1 text-xs font-medium text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                                <Flame size={14} /> {tag.current_streak}d
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <CalendarDays size={14} /> {tag.today_completed}/{tag.daily_target}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Non-daily tags */}
            {otherTasks.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="flex items-center gap-2 text-base font-semibold mb-5 text-gray-900 dark:text-gray-50">
                        <Hash className="text-brand-500 dark:text-brand-400" size={20} /> Other Tasks
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherTasks.map(tag => (
                            <div
                                key={tag.task}
                                className="relative rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                {!tag.today_done && (
                                    <button
                                        onClick={() => setShowCheckin(tag.task)}
                                        className="absolute top-3 right-3 transition-transform hover:scale-110"
                                    >
                                        <Circle
                                            className="text-gray-300 dark:text-gray-500 hover:text-brand-400"
                                            size={24}
                                        />
                                    </button>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                                            <Hash className="text-brand-500" size={16} />
                                        </div>
                                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                                            {tag.task}
                                        </span>
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                            {tag.type}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteHabit(tag.task)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                                        title="Delete Habit"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 pl-[42px]">
                                    {tag.description || ''}
                                </p>
                                <div className="flex items-center gap-4 pl-[42px] text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <BarChart3 size={14} /> {tag.total_days || tag.total_weeks || 0} total
                                    </span>
                                    {tag.type === 'weekly' && (
                                        <span className="flex items-center gap-1">
                                            <CalendarDays size={14} /> {tag.week_completed}/{tag.weekly_target} this
                                            week
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Habit Modal */}
            {showAddHabit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Habit</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Habit Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Reading"
                                    value={newHabit.task}
                                    onChange={e => setNewHabit({ ...newHabit, task: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Read 10 pages"
                                    value={newHabit.description}
                                    onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={newHabit.type}
                                        onChange={e => setNewHabit({ ...newHabit, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="one-off">One-off / Free</option>
                                    </select>
                                </div>
                                {newHabit.type !== 'one-off' && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Target (times)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newHabit.target}
                                            onChange={e =>
                                                setNewHabit({
                                                    ...newHabit,
                                                    target: Math.max(1, parseInt(e.target.value) || 1)
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddHabit(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddHabit}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkin Modal */}
            {showCheckin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Check in: {showCheckin}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Record your progress</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Details (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="What did you accomplish?"
                                    value={details}
                                    onChange={e => setDetails(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-gray-900 dark:text-white transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mood (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="How do you feel?"
                                    value={mood}
                                    onChange={e => setMood(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-gray-900 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
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
    )
}
