import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { Target, Calendar, Award, Flame, CheckCircle2, Circle } from 'lucide-react'

interface DashboardItem {
    task: string
    description: string | null
    type: 'daily' | 'weekly' | 'one-off'
    daily_target?: number
    weekly_target?: number
    today_completed?: number
    today_quota?: number
    today_done?: boolean
    week_completed?: number
    current_streak: number
    longest_streak: number
    total_days?: number
    total_weeks?: number
}

export function GlobalDashboard() {
    const [dashboard, setDashboard] = useState<DashboardItem[]>([])
    const [todoStats, setTodoStats] = useState({ pending: 0, completedToday: 0 })
    const [urgentTodos, setUrgentTodos] = useState<any[]>([])

    const loadData = useCallback(async () => {
        try {
            const [dashData, boardData] = await Promise.all([api.getDashboard(), api.getTodoBoard()])
            setDashboard(dashData)

            let pending = 0
            let completedToday = 0
            let urgent: any[] = []
            const now = new Date()
            boardData.forEach((col: any) => {
                pending += col.items.length
                completedToday += col.completed_items.length
                col.items.forEach((item: any) => {
                    if (
                        item.end_at &&
                        new Date(item.end_at) <= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                    ) {
                        urgent.push(item)
                    }
                })
            })
            setTodoStats({ pending, completedToday })
            setUrgentTodos(urgent)
        } catch (e) {
            console.error('Failed to load dashboard:', e)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleCheckIn = async (taskName: string) => {
        try {
            await api.addEvent({ task: taskName, mood: '🌟' })
            await loadData()
        } catch (e: any) {
            alert(e.message)
        }
    }

    const activeHabits = dashboard.filter(d => d.type !== 'one-off')
    const completedHabits = activeHabits.filter(h => h.today_done)
    const pendingHabits = activeHabits.filter(h => !h.today_done)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Overview</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Here's your progress for today</p>
            </header>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Habits Done</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                                {completedHabits.length}{' '}
                                <span className="text-sm text-gray-400 font-normal">/ {activeHabits.length}</span>
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <CheckSquareIcon />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Tasks</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{todoStats.pending}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Completed</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                                {todoStats.completedToday}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-xl">
                            <Flame size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Best Streak</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                                {Math.max(0, ...activeHabits.map(h => h.current_streak))}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Needs Attention */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                            <Circle size={20} className="text-amber-500" /> Action Required
                        </h3>
                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded-full font-medium">
                            {pendingHabits.length} Habits, {urgentTodos.length} Tasks
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-[#3c3326]/50">
                        {pendingHabits.length === 0 && urgentTodos.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <CheckCircle2 size={32} className="mx-auto mb-3 text-green-500 opacity-50" />
                                <p>All caught up for today!</p>
                            </div>
                        ) : (
                            <>
                                {pendingHabits.map(h => (
                                    <div
                                        key={h.task}
                                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-50">{h.task}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {h.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                                    {h.today_completed || 0} / {h.today_quota || h.daily_target || 1}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {h.type === 'weekly' ? 'Daily Quota' : 'Today'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleCheckIn(h.task)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 dark:text-brand-400 rounded-lg flex items-center justify-center"
                                                title="Check In"
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {urgentTodos.map(todo => (
                                    <div
                                        key={`todo-${todo.id}`}
                                        className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-50">{todo.name}</p>
                                                <p className="text-xs text-red-500 dark:text-red-400">
                                                    Due: {new Date(todo.end_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                await api.completeTodoItem(todo.id)
                                                await loadData()
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 dark:text-brand-400 rounded-lg flex items-center justify-center"
                                            title="Mark as Complete"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Done Today */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-green-500" /> Completed Today
                        </h3>
                        <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                            {completedHabits.length} Habits
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-[#3c3326]/50">
                        {completedHabits.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <p>No habits completed yet.</p>
                            </div>
                        ) : (
                            completedHabits.map(h => (
                                <div
                                    key={h.task}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span className="font-medium text-gray-900 dark:text-gray-50">{h.task}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-full font-medium">
                                                <Flame size={12} /> {h.current_streak} streak
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {h.today_completed || 0} / {h.today_quota || h.daily_target || 1}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCheckIn(h.task)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-[#3c3326]/40 dark:hover:bg-gray-700 dark:text-gray-400 rounded-lg flex items-center justify-center"
                                            title="Add Extra Check-In"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function CheckSquareIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
    )
}
