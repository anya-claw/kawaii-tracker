import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { CheckSquare, Calendar, History as HistoryIcon } from 'lucide-react'

interface TodoItemData {
    id: number
    name: string
    completed_at: string | null
    end_at: string | null
    group_id: number
}

export function TodoHistory() {
    const [items, setItems] = useState<TodoItemData[]>([])
    const [loading, setLoading] = useState(true)

    const loadItems = useCallback(async () => {
        setLoading(true)
        try {
            // Load all items and filter completed locally, or add endpoint params later if backend supports it.
            // Currently getting board structure, but for history we might need a flat list.
            const groups = await api.getTodoBoard()
            let completed: TodoItemData[] = []
            for (const col of groups) {
                completed = completed.concat(col.completed_items)
            }
            // Sort by completed_at descending
            completed.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
            setItems(completed)
        } catch (e) {
            console.error('Failed to load history:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadItems()
    }, [loadItems])

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Todo History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Review your completed tasks.</p>
            </header>

            {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <HistoryIcon size={36} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                        No completed tasks yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        Once you check off tasks from your board, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-4 transition-all"
                        >
                            <div className="text-emerald-500 mt-0.5 shrink-0">
                                <CheckSquare size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-through opacity-80">
                                    {item.name}
                                </h3>
                                <div className="mt-2 flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        Completed: {new Date(item.completed_at!).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
