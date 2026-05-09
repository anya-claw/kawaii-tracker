import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { Trash2, Edit, Calendar, Filter } from 'lucide-react'

export function History() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all')

    const loadEvents = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch the most recent 100 events
            const data = await api.getEvents({ limit: '100' })
            setEvents(data.data || [])
        } catch (e) {
            console.error('Failed to load events:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return
        try {
            await api.deleteEvent(id)
            loadEvents()
        } catch (e) {
            console.error('Failed to delete event:', e)
        }
    }

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true
        const date = new Date(event.created_at)
        const now = new Date()

        const isSameDay = (d1: Date, d2: Date) =>
            d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

        if (filter === 'today') return isSameDay(date, now)
        if (filter === 'yesterday') {
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            return isSameDay(date, yesterday)
        }
        if (filter === 'week') {
            const weekAgo = new Date(now)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return date >= weekAgo
        }
        if (filter === 'month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }
        return true
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Events History</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review your habit tracking events.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <Filter size={16} className="text-gray-400 mr-1 shrink-0" />
                    {(['all', 'today', 'yesterday', 'week', 'month'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
                                filter === f
                                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Calendar size={32} className="mx-auto mb-3 text-gray-400 opacity-50" />
                        <p>No records found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Task
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Value
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredEvents.map(event => (
                                <tr
                                    key={event.id}
                                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                        {new Date(event.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="font-medium text-gray-900 dark:text-gray-50">
                                            {event.task_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        {event.mood || <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-6 py-3">
                                        {event.completed ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full text-xs font-medium">
                                                Completed
                                            </span>
                                        ) : event.daily_mark ? (
                                            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                                Placeholder
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-xs font-medium">
                                                Record
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
