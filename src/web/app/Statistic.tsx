import React from 'react'
import { BarChart3, TrendingUp, CalendarDays } from 'lucide-react'

export function Statistic() {
    return (
        <div className="h-full flex flex-col space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Statistics</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Your progress and productivity metrics.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">84%</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">12 Days</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Done</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50">1,248</h3>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">Detailed Charts Coming Soon</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    We're actively building the detailed statistics view so you can track your habits and to-dos over
                    time using beautiful graphs.
                </p>
            </div>
        </div>
    )
}
