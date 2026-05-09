import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { Login } from './Login'
import { Habits } from './Habits'
import { TodoBoard } from './TodoBoard'
import { TodoHistory } from './TodoHistory'
import { GlobalDashboard } from './GlobalDashboard'
import { History } from './History'
import { useTheme } from './ThemeContext'
import {
    LayoutDashboard,
    CheckSquare,
    KanbanSquare,
    History as HistoryIcon,
    Settings,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    Activity,
    BarChart3,
    ChevronDown,
    ChevronRight,
    ListTodo
} from 'lucide-react'
import { Statistic } from './Statistic'

type View = 'dashboard' | 'habit_events' | 'habit_tasks' | 'todo_board' | 'todo_history' | 'statistic'

export default function App() {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null)
    const [activeView, setActiveView] = useState<View>('dashboard')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [habitsExpanded, setHabitsExpanded] = useState(true)
    const [todoExpanded, setTodoExpanded] = useState(true)
    const { theme, toggleTheme } = useTheme()

    const checkAuth = useCallback(async () => {
        try {
            await api.getTasks()
            setAuthenticated(true)
        } catch {
            setAuthenticated(false)
        }
    }, [])

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    if (authenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        )
    }

    if (!authenticated) {
        return <Login onLogin={() => setAuthenticated(true)} />
    }

    const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
        { view: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview' },
        { view: 'habits', icon: <Activity size={20} />, label: 'Habit Tracker' },
        { view: 'todo', icon: <KanbanSquare size={20} />, label: 'To-do Board' },
        { view: 'history', icon: <HistoryIcon size={20} />, label: 'Events & History' },
        { view: 'statistic', icon: <BarChart3 size={20} />, label: 'Statistics' }
    ]

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">
                        K
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight">Kawaii</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-all"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-all"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-300 ease-out md:relative md:translate-x-0 flex flex-col ${
                    mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-300 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-brand-500/20">
                        K
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight">Kawaii</h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">
                            Tracker
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => {
                            setActiveView('dashboard')
                            setMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                            activeView === 'dashboard'
                                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                        }`}
                    >
                        <span
                            className={
                                activeView === 'dashboard'
                                    ? 'text-brand-600 dark:text-brand-400'
                                    : 'text-gray-400 dark:text-gray-500'
                            }
                        >
                            <LayoutDashboard size={20} />
                        </span>
                        Overview
                    </button>

                    {/* Habit Tracker Group */}
                    <div className="mt-2">
                        <button
                            onClick={() => setHabitsExpanded(!habitsExpanded)}
                            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors uppercase tracking-wider"
                        >
                            <span className="flex items-center gap-2">
                                <Activity size={14} /> Habit Tracker
                            </span>
                            {habitsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-300 space-y-0.5 ${habitsExpanded ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                        >
                            <button
                                onClick={() => {
                                    setActiveView('habit_events')
                                    setMobileMenuOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                                    activeView === 'habit_events'
                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                                }`}
                            >
                                <HistoryIcon
                                    size={16}
                                    className={activeView === 'habit_events' ? 'text-brand-500' : 'text-gray-400'}
                                />{' '}
                                Events
                            </button>
                            <button
                                onClick={() => {
                                    setActiveView('habit_tasks')
                                    setMobileMenuOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                                    activeView === 'habit_tasks'
                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                                }`}
                            >
                                <CheckSquare
                                    size={16}
                                    className={activeView === 'habit_tasks' ? 'text-brand-500' : 'text-gray-400'}
                                />{' '}
                                Tasks
                            </button>
                        </div>
                    </div>

                    {/* To-do Group */}
                    <div className="mt-2">
                        <button
                            onClick={() => setTodoExpanded(!todoExpanded)}
                            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors uppercase tracking-wider"
                        >
                            <span className="flex items-center gap-2">
                                <KanbanSquare size={14} /> To-do
                            </span>
                            {todoExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-300 space-y-0.5 ${todoExpanded ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                        >
                            <button
                                onClick={() => {
                                    setActiveView('todo_board')
                                    setMobileMenuOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                                    activeView === 'todo_board'
                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                                }`}
                            >
                                <ListTodo
                                    size={16}
                                    className={activeView === 'todo_board' ? 'text-brand-500' : 'text-gray-400'}
                                />{' '}
                                Board
                            </button>
                            <button
                                onClick={() => {
                                    setActiveView('todo_history')
                                    setMobileMenuOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                                    activeView === 'todo_history'
                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                                }`}
                            >
                                <HistoryIcon
                                    size={16}
                                    className={activeView === 'todo_history' ? 'text-brand-500' : 'text-gray-400'}
                                />{' '}
                                History
                            </button>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="pt-2">
                        <button
                            onClick={() => {
                                setActiveView('statistic')
                                setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                                activeView === 'statistic'
                                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                            }`}
                        >
                            <span
                                className={
                                    activeView === 'statistic'
                                        ? 'text-brand-600 dark:text-brand-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                }
                            >
                                <BarChart3 size={20} />
                            </span>
                            Statistics
                        </button>
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                    <button
                        onClick={toggleTheme}
                        className="hidden md:flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 transition-all"
                    >
                        {theme === 'dark' ? (
                            <Sun size={18} className="text-amber-500" />
                        ) : (
                            <Moon size={18} className="text-gray-400" />
                        )}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button
                        onClick={() => {
                            api.logout()
                            setAuthenticated(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-h-screen overflow-y-auto w-full md:max-w-7xl md:mx-auto">
                <div className="h-full p-4 md:p-8 animate-in fade-in duration-300">
                    {activeView === 'dashboard' && <GlobalDashboard />}
                    {activeView === 'habit_tasks' && <Habits />}
                    {activeView === 'todo_board' && <TodoBoard />}
                    {activeView === 'habit_events' && <History />}
                    {activeView === 'todo_history' && <TodoHistory />}
                    {activeView === 'statistic' && <Statistic />}
                </div>
            </main>
        </div>
    )
}
