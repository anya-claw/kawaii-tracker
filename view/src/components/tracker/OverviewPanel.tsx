import styled from '@emotion/styled'
import { useState, useEffect } from 'react'
import { CheckSquare, CalendarDays } from 'lucide-react'
import { TrackerAPI, KanbanAPI } from '../../shared/api'
import type { DashboardStat, TodoItem } from '../../shared/api/schema'

const OverviewContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
`

const WelcomeBanner = styled.div`
    background: linear-gradient(
        135deg,
        ${({ theme }) => theme.colors.primary},
        ${({ theme }) => theme.colors.secondary}
    );
    border-radius: ${({ theme }) => theme.borderRadius.large};
    padding: ${({ theme }) => theme.spacing(4)};
    color: white;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};
    box-shadow: ${({ theme }) => theme.shadows.soft};

    h2 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 800;
    }
    p {
        margin: 0;
        font-size: 1rem;
        opacity: 0.9;
    }
`

const SplitView = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(4)};

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`

const SectionCard = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    border: 1px solid ${({ theme }) => theme.colors.border};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    padding: ${({ theme }) => theme.spacing(3)};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding-bottom: ${({ theme }) => theme.spacing(2)};
    margin-bottom: ${({ theme }) => theme.spacing(1)};

    h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: ${({ theme }) => theme.colors.text};
        font-size: 1.2rem;
    }
`

const ItemList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1.5)};
`

const SimpleCard = styled.div`
    background-color: ${({ theme }) => theme.colors.background};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: ${({ theme }) => theme.spacing(2)};
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid transparent;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border};
        transform: translateX(2px);
    }
`

const Label = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    display: flex;
    align-items: center;
    gap: 8px;
`

const StatusBadge = styled.span<{ done?: boolean; priority?: string }>`
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: bold;
    color: white;
    background-color: ${({ theme, done, priority }) => {
        if (done) return theme.colors.success
        if (priority === 'high') return theme.colors.danger
        if (priority === 'medium') return '#ffd166'
        return theme.colors.primary
    }};
`

export function OverviewPanel() {
    const [habits, setHabits] = useState<DashboardStat[]>([])
    const [pendingTodos, setPendingTodos] = useState<TodoItem[]>([])

    const loadData = () => {
        Promise.all([TrackerAPI.getDashboard(), KanbanAPI.getGroups()])
            .then(([dashboardData, groups]) => {
                setHabits(dashboardData)

                const allItems = groups.map(g => g.items).flat()
                const pending = allItems
                    .filter(i => i.status !== 'done')
                    .sort((a, b) => {
                        const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
                        const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0)
                        if (pDiff !== 0) return pDiff
                        if (a.due_date && b.due_date) {
                            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                        }
                        if (a.due_date) return -1
                        if (b.due_date) return 1
                        return 0
                    })
                    .slice(0, 8)
                setPendingTodos(pending)
            })
            .catch(console.error)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleToggleTodo = async (todo: TodoItem) => {
        try {
            await KanbanAPI.updateTodo(todo.id, { status: 'done' })
            loadData() // Refresh
        } catch (e) {
            console.error(e)
        }
    }

    const todayDate = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    const pendingHabits = habits.filter(h => !h.period_done).length

    return (
        <OverviewContainer>
            <WelcomeBanner>
                <h2>Good Morning! 🌸</h2>
                <p>
                    Today is {todayDate}. You have {pendingHabits} habits pending and {pendingTodos.length} top tasks to
                    tackle.
                </p>
            </WelcomeBanner>

            <SplitView>
                <SectionCard>
                    <SectionHeader>
                        <h3>
                            <CalendarDays size={20} color="#a2d5c6" /> Today's Habits
                        </h3>
                    </SectionHeader>
                    <ItemList>
                        {habits.slice(0, 5).map(h => (
                            <SimpleCard key={h.tag}>
                                <Label>{h.tag}</Label>
                                <StatusBadge done={h.period_done}>
                                    {h.period_done ? 'Done' : h.period_progress}
                                </StatusBadge>
                            </SimpleCard>
                        ))}
                    </ItemList>
                </SectionCard>

                <SectionCard>
                    <SectionHeader>
                        <h3>
                            <CheckSquare size={20} color="#ff8fb3" /> Top To-Dos
                        </h3>
                    </SectionHeader>
                    <ItemList>
                        {pendingTodos.length === 0 ? (
                            <p style={{ color: '#9aa0a6', fontSize: '0.9rem' }}>All caught up!</p>
                        ) : null}
                        {pendingTodos.map(todo => (
                            <SimpleCard key={todo.id}>
                                <Label style={{ cursor: 'pointer' }} onClick={() => handleToggleTodo(todo)}>
                                    <div
                                        style={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: 4,
                                            border: '2px solid #a2d5c6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 4
                                        }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span>{todo.title}</span>
                                        {todo.due_date && (
                                            <span
                                                style={{ fontSize: '0.75rem', color: '#9aa0a6', fontWeight: 'normal' }}
                                            >
                                                📅 {new Date(todo.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </Label>
                                <StatusBadge priority={todo.priority}>{todo.priority.toUpperCase()}</StatusBadge>
                            </SimpleCard>
                        ))}
                    </ItemList>
                </SectionCard>
            </SplitView>
        </OverviewContainer>
    )
}
