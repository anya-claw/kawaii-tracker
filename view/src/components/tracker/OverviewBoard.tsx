import { useState, useEffect, useCallback, useMemo } from 'react'
import styled from '@emotion/styled'
import { Tag, Calendar, CheckCircle2, Clock, Target, Award, BarChart2 } from 'lucide-react'
import { TrackerAPI, KanbanAPI } from '../../shared/api'
import type { DashboardStat, TodoItem, TrackerEvent } from '../../shared/api/schema'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import { useTheme } from '@emotion/react'

const DashboardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
`

const StatPanel = styled.div`
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing(3)};
    box-shadow: ${({ theme }) => theme.shadows.card};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`

const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    margin-bottom: ${({ theme }) => theme.spacing(2)};

    h3 {
        font-size: 1rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.text};
        margin: 0;
    }
`

const PanelIcon = styled.div<{ color: string }>`
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${({ color }) => color}20;
    display: flex;
    align-items: center;
    justify-content: center;
`

const BigNumber = styled.div`
    font-size: 2.5rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    font-family: 'Misans', sans-serif;
`

const NumberLabel = styled.div`
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 600;
`

const ChartsGrid = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: ${({ theme }) => theme.spacing(3)};

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`

const ChartPanel = styled(StatPanel)`
    min-height: 340px;
`

const TodoList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`

const TodoCard = styled.div<{ priority: string; index: number }>`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(2.5)};
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    border: 1px solid ${({ theme }) => theme.colors.border};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    animation: slideInRight 0.4s ease forwards;
    animation-delay: ${({ index }) => index * 0.1}s;
    opacity: 0;
    transition: ${props => props.theme.transitions.fast};
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 4px;
        background: ${({ theme, priority }) =>
            priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#ffd166' : theme.colors.primary};
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: ${({ theme }) => theme.shadows.card};
        border-color: ${({ theme, priority }) =>
            priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#ffd166' : theme.colors.primary};
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`

const TodoIconWrapper = styled.div<{ priority: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${({ theme, priority }) =>
        priority === 'high'
            ? `${theme.colors.danger}15`
            : priority === 'medium'
              ? `#ffd16615`
              : `${theme.colors.primary}15`};
    color: ${({ theme, priority }) =>
        priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#ffd166' : theme.colors.primary};
`

const TodoContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
`

const TodoItemTitle = styled.span`
    font-size: 1.05rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
`

const TodoBadges = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`

const Badge = styled.span<{ variant?: 'default' | 'danger' | 'warning' }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: ${({ theme, variant }) =>
        variant === 'danger'
            ? `${theme.colors.danger}15`
            : variant === 'warning'
              ? '#ffd16620'
              : theme.colors.surfaceAlt};
    color: ${({ theme, variant }) =>
        variant === 'danger' ? theme.colors.danger : variant === 'warning' ? '#d99e00' : theme.colors.textMuted};
    border: 1px solid
        ${({ theme, variant }) =>
            variant === 'danger'
                ? `${theme.colors.danger}30`
                : variant === 'warning'
                  ? '#ffd16640'
                  : theme.colors.border};
`

const FadeOutCard = styled(TodoCard)`
    position: relative;
    opacity: 0.6;
    pointer-events: none;
    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60%;
        background: linear-gradient(to bottom, transparent, ${({ theme }) => theme.colors.background});
    }
`

const EmptyStateContainer = styled(StatPanel)<{ hasMoreContent?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: ${({ hasMoreContent }) => (hasMoreContent ? '240px' : '120px')};
    flex: 1;
`

const SectionTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.text};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
`

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
`

const ViewMoreLink = styled.span`
    font-size: 0.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.7;
    }
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(5)};
`

// Helper formatting dates safely
const getPastDateString = (daysAgo: number) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
}

export function OverviewBoard({
    navigate
}: {
    navigate: (
        tab: 'overview' | 'tracker-statistic' | 'tracker-events' | 'tracker-tags' | 'todo-board' | 'todo-history'
    ) => void
}) {
    const theme = useTheme()
    const [stats, setStats] = useState<DashboardStat[]>([])
    const [pendingTodos, setPendingTodos] = useState<(TodoItem & { group_name?: string })[]>([])
    const [allItems, setAllItems] = useState<(TodoItem & { group_name?: string })[]>([])
    const [events, setEvents] = useState<TrackerEvent[]>([])

    const loadData = useCallback(async () => {
        try {
            const data = await TrackerAPI.getDashboard()
            setStats(data)

            const eventsData = await TrackerAPI.getEvents('30d')
            setEvents(eventsData)

            const groups = await KanbanAPI.getGroups()
            const flattedItems = groups.map(g => g.items.map(item => ({ ...item, group_name: g.group.name }))).flat()
            setAllItems(flattedItems)

            const pending = flattedItems
                .filter(i => i.status !== 'done')
                .sort((a, b) => {
                    const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
                    const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0)
                    if (pDiff !== 0) return pDiff
                    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                    if (a.due_date) return -1
                    if (b.due_date) return 1
                    return 0
                })
                .slice(0, 5)
            setPendingTodos(pending)
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData()
    }, [loadData])

    // --- Chart Data Calculations ---

    // 1. Task Completion Pie Data
    const pieData = useMemo(() => {
        if (!allItems.length) return []
        const done = allItems.filter(i => i.status === 'done').length

        let overdue = 0
        let normalPending = 0

        const now = new Date().getTime()
        allItems
            .filter(i => i.status !== 'done')
            .forEach(i => {
                if (i.due_date && new Date(i.due_date).getTime() < now) {
                    overdue++
                } else {
                    normalPending++
                }
            })

        return [
            { name: 'Done', value: done, color: theme.colors.success },
            { name: 'Pending', value: normalPending, color: theme.colors.primary },
            { name: 'Overdue', value: overdue, color: theme.colors.danger }
        ].filter(v => v.value > 0)
    }, [allItems, theme])

    // 2. Daily Activity Curve (Last 7 Days)
    const curveData = useMemo(() => {
        const data = []
        for (let i = 6; i >= 0; i--) {
            const dateStr = getPastDateString(i)
            // count habits done matching this date (event history)
            const habitsCount = events.filter(e => e.created_at && e.created_at.startsWith(dateStr)).length || 0
            const newTasks = allItems.filter(t => t.created_at && t.created_at.startsWith(dateStr)).length

            data.push({
                date: dateStr.slice(5), // mm-dd
                habits: habitsCount,
                newTasks: newTasks
            })
        }
        return data
    }, [events, allItems])

    // Summary stats
    const totalStreak = stats.reduce((sum, s) => sum + s.daily_streak, 0)
    const totalCheckins = stats.reduce((sum, s) => sum + s.total_days, 0)
    const completedToday = stats.filter(s => s.period_done).length
    const completionRate = stats.length > 0 ? Math.round((completedToday / stats.length) * 100) : 0

    return (
        <Container>
            {/* Top Overview Badges */}
            <DashboardGrid>
                <StatPanel>
                    <PanelHeader>
                        <PanelIcon color="#ff8fb3">
                            <Target size={18} color="#ff8fb3" />
                        </PanelIcon>
                        <h3>Habits Done</h3>
                    </PanelHeader>
                    <div>
                        <BigNumber>
                            {completedToday} / {stats.length}
                        </BigNumber>
                        <NumberLabel>Completed today ({completionRate}%)</NumberLabel>
                    </div>
                </StatPanel>

                <StatPanel>
                    <PanelHeader>
                        <PanelIcon color="#ff9a9e">
                            <Award size={18} color="#ff9a9e" />
                        </PanelIcon>
                        <h3>Active Streaks</h3>
                    </PanelHeader>
                    <div>
                        <BigNumber>{totalStreak}</BigNumber>
                        <NumberLabel>Total streak days</NumberLabel>
                    </div>
                </StatPanel>

                <StatPanel>
                    <PanelHeader>
                        <PanelIcon color="#ffd166">
                            <Clock size={18} color="#ffd166" />
                        </PanelIcon>
                        <h3>Tasks Pending</h3>
                    </PanelHeader>
                    <div>
                        <BigNumber>{pendingTodos.length}</BigNumber>
                        <NumberLabel>Requires attention</NumberLabel>
                    </div>
                </StatPanel>

                <StatPanel>
                    <PanelHeader>
                        <PanelIcon color="#a2d5c6">
                            <CheckCircle2 size={18} color="#a2d5c6" />
                        </PanelIcon>
                        <h3>Total Tracking</h3>
                    </PanelHeader>
                    <div>
                        <BigNumber>{totalCheckins}</BigNumber>
                        <NumberLabel>All-time check-in records</NumberLabel>
                    </div>
                </StatPanel>
            </DashboardGrid>

            {/* Analytics Charts */}
            <section>
                <SectionTitle>
                    <BarChart2 size={20} color={theme.colors.primary} />
                    Analytics Output
                </SectionTitle>
                <ChartsGrid>
                    {/* Line Chart */}
                    <ChartPanel>
                        <PanelHeader>
                            <h3>7-Day Activity Curve</h3>
                        </PanelHeader>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ffd166" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ffd166" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} vertical={false} />
                                <XAxis dataKey="date" stroke={theme.colors.textMuted} tick={{ fontSize: 12 }} />
                                <YAxis stroke={theme.colors.textMuted} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: 8,
                                        border: '1px solid ' + theme.colors.border,
                                        boxShadow: theme.shadows.card
                                    }}
                                    itemStyle={{ color: theme.colors.text }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="habits"
                                    name="Habit Check-ins"
                                    stroke={theme.colors.primary}
                                    fillOpacity={1}
                                    fill="url(#colorHabits)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="newTasks"
                                    name="New Tasks Added"
                                    stroke="#ffd166"
                                    fillOpacity={1}
                                    fill="url(#colorTasks)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    {/* Pie Chart */}
                    <ChartPanel>
                        <PanelHeader>
                            <h3>To-Do Board State</h3>
                        </PanelHeader>
                        <ResponsiveContainer width="100%" height={260}>
                            {pieData.length > 0 ? (
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1000}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 8,
                                            border: '1px solid ' + theme.colors.border,
                                            boxShadow: theme.shadows.card
                                        }}
                                        itemStyle={{ color: theme.colors.text }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            ) : (
                                <div
                                    style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: theme.colors.textMuted
                                    }}
                                >
                                    No data available
                                </div>
                            )}
                        </ResponsiveContainer>
                    </ChartPanel>
                </ChartsGrid>
            </section>

            <ChartsGrid style={{ alignItems: 'stretch' }}>
                {/* Priority To-Dos */}
                <section style={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionHeader>
                        <SectionTitle>
                            <Calendar size={20} color="#ff8fb3" />
                            Priority To-Dos
                        </SectionTitle>
                        <ViewMoreLink onClick={() => navigate('todo-board')}>View More &gt;</ViewMoreLink>
                    </SectionHeader>
                    {pendingTodos.length === 0 ? (
                        <EmptyStateContainer hasMoreContent={stats.filter(s => !s.period_done).length > 0}>
                            <NumberLabel style={{ textAlign: 'center' }}>All caught up!</NumberLabel>
                        </EmptyStateContainer>
                    ) : (
                        <TodoList>
                            {pendingTodos.slice(0, 3).map((todo, idx) => {
                                const CardComponent = idx === 2 ? FadeOutCard : TodoCard
                                return (
                                    <CardComponent key={todo.id} priority={todo.priority} index={idx}>
                                        <TodoIconWrapper priority={todo.priority}>
                                            <CheckCircle2 size={24} />
                                        </TodoIconWrapper>
                                        <TodoContent>
                                            <TodoItemTitle>{todo.title}</TodoItemTitle>
                                            <TodoBadges>
                                                {todo.priority && (
                                                    <Badge
                                                        variant={
                                                            todo.priority === 'high'
                                                                ? 'danger'
                                                                : todo.priority === 'medium'
                                                                  ? 'warning'
                                                                  : 'default'
                                                        }
                                                    >
                                                        {todo.priority}
                                                    </Badge>
                                                )}
                                                {todo.group_name && (
                                                    <Badge>
                                                        <Tag size={12} />
                                                        {todo.group_name}
                                                    </Badge>
                                                )}
                                            </TodoBadges>
                                        </TodoContent>
                                        {todo.due_date && (
                                            <Badge style={{ background: 'transparent', border: 'none' }}>
                                                <Calendar size={12} />
                                                {new Date(todo.due_date).toLocaleDateString()}
                                            </Badge>
                                        )}
                                    </CardComponent>
                                )
                            })}
                        </TodoList>
                    )}
                </section>

                {/* Pending Habits */}
                <section style={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionHeader>
                        <SectionTitle>
                            <Target size={20} color="#a2d5c6" />
                            Today's Pending Events
                        </SectionTitle>
                        <ViewMoreLink onClick={() => navigate('tracker-events')}>View More &gt;</ViewMoreLink>
                    </SectionHeader>
                    {stats.filter(s => !s.period_done).length === 0 ? (
                        <EmptyStateContainer hasMoreContent={pendingTodos.length > 0}>
                            <NumberLabel style={{ textAlign: 'center' }}>All tracking done for today!</NumberLabel>
                        </EmptyStateContainer>
                    ) : (
                        <TodoList>
                            {stats
                                .filter(s => !s.period_done)
                                .slice(0, 3)
                                .map((stat, idx) => {
                                    const CardComponent = idx === 2 ? FadeOutCard : TodoCard
                                    return (
                                        <CardComponent key={stat.tag} priority="medium" index={idx}>
                                            <TodoIconWrapper priority="medium">
                                                <Target size={20} />
                                            </TodoIconWrapper>
                                            <TodoContent>
                                                <TodoItemTitle>{stat.tag}</TodoItemTitle>
                                                <TodoBadges>
                                                    <Badge variant="default">{stat.type}</Badge>
                                                    <Badge style={{ background: 'transparent', border: 'none' }}>
                                                        {stat.period_progress}
                                                    </Badge>
                                                </TodoBadges>
                                            </TodoContent>
                                        </CardComponent>
                                    )
                                })}
                        </TodoList>
                    )}
                </section>
            </ChartsGrid>
        </Container>
    )
}
