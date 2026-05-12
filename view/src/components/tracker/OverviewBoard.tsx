import { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { Tag, Calendar } from 'lucide-react'
import { TrackerAPI, KanbanAPI } from '../../shared/api'
import type { DashboardStat, TodoItem } from '../../shared/api/schema'
import { HabitCard } from './HabitCard'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'

const TrackerContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: ${({ theme }) => theme.spacing(3)};
`

const TodoContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: ${({ theme }) => theme.spacing(2)};
`

const TodoCard = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing(2)};
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(2)};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        transform: translateY(-2px);
        box-shadow: ${({ theme }) => theme.shadows.hover};
    }
`

const TodoCheckbox = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 2px solid ${({ theme }) => theme.colors.border};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        border-color: ${({ theme }) => theme.colors.success};
        background-color: ${({ theme }) => theme.colors.success}22;
    }
`

const TodoContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
`

const TodoTitle = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
`

const TodoMeta = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const PriorityBadge = styled.span<{ priority: string }>`
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
    align-self: flex-start;
    background-color: ${({ theme, priority }) =>
        priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#ffd166' : theme.colors.secondary};
    color: #fff;
`

export function OverviewBoard() {
    const [stats, setStats] = useState<DashboardStat[]>([])
    const [pendingTodos, setPendingTodos] = useState<(TodoItem & { group_name?: string })[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [details, setDetails] = useState('')
    const [mood, setMood] = useState('')

    const loadData = useCallback(async () => {
        try {
            const data = await TrackerAPI.getDashboard()
            setStats(data)

            const groups = await KanbanAPI.getGroups()
            const allItems = groups.map(g => g.items.map(item => ({ ...item, group_name: g.group.name }))).flat()
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
                .slice(0, 5)
            setPendingTodos(pending)
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount is a valid effect use case
        void loadData()
    }, [loadData])

    const handleToggleTodo = async (todo: TodoItem) => {
        try {
            await KanbanAPI.updateTodo(todo.id, { status: 'done' })
            loadData() // Refresh both habits and todos
        } catch (e) {
            console.error(e)
        }
    }

    const openCheckInModal = (tag: string) => {
        setSelectedTag(tag)
        setDetails('')
        setMood('')
        setModalOpen(true)
    }

    const handleConfirmCheckIn = async () => {
        if (!selectedTag) return
        try {
            await TrackerAPI.checkIn({
                tag: selectedTag,
                details: details.trim() || undefined,
                mood: mood.trim() || undefined
            })
            setModalOpen(false)
            setSelectedTag('')
            await loadData()
        } catch (e) {
            console.error(e)
            alert('Failed to check in.')
        }
    }

    const dailyTags = stats.filter(t => t.type === 'daily')
    const weeklyTags = stats.filter(t => t.type === 'weekly')
    const otherTags = stats.filter(t => t.type !== 'daily' && t.type !== 'weekly')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#ffb3c6' }}>Top To-Dos</h2>
                <TodoContainer>
                    {pendingTodos.length === 0 ? <p style={{ color: '#9aa0a6' }}>All caught up!</p> : null}
                    {pendingTodos.map(todo => (
                        <TodoCard key={todo.id}>
                            <TodoCheckbox onClick={() => handleToggleTodo(todo)} />
                            <TodoContent>
                                <TodoTitle>{todo.title}</TodoTitle>
                                <TodoMeta>
                                    {todo.group_name && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Tag size={12} /> {todo.group_name}
                                        </span>
                                    )}
                                    {todo.due_date && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                                            <Calendar size={12} /> {new Date(todo.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </TodoMeta>
                            </TodoContent>
                            <PriorityBadge priority={todo.priority}>{todo.priority.toUpperCase()}</PriorityBadge>
                        </TodoCard>
                    ))}
                </TodoContainer>
            </section>

            <section>
                <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#ff8fb3' }}>Today's Overview</h2>
                <TrackerContainer>
                    {dailyTags.length === 0 ? <p style={{ color: '#9aa0a6' }}>No daily habits found.</p> : null}
                    {dailyTags.map(stat => (
                        <HabitCard key={stat.tag} stat={stat} onCheckIn={openCheckInModal} />
                    ))}
                </TrackerContainer>
            </section>

            <section>
                <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#a2d5c6' }}>This Week</h2>
                <TrackerContainer>
                    {weeklyTags.length === 0 ? <p style={{ color: '#9aa0a6' }}>No weekly habits found.</p> : null}
                    {weeklyTags.map(stat => (
                        <HabitCard key={stat.tag} stat={stat} onCheckIn={openCheckInModal} />
                    ))}
                </TrackerContainer>
            </section>

            {otherTags.length > 0 && (
                <section>
                    <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#ff9a9e' }}>Other Challenges</h2>
                    <TrackerContainer>
                        {otherTags.map(stat => (
                            <HabitCard key={stat.tag} stat={stat} onCheckIn={openCheckInModal} />
                        ))}
                    </TrackerContainer>
                </section>
            )}

            {/* Check-in Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Check In: ${selectedTag}`}>
                <FormGroup>
                    <label>Details</label>
                    <textarea
                        placeholder="How did it go? (optional)"
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        rows={3}
                    />
                </FormGroup>
                <FormGroup>
                    <label>Mood</label>
                    <input
                        placeholder="😊 🎉 😤 ... (optional emoji)"
                        value={mood}
                        onChange={e => setMood(e.target.value)}
                    />
                </FormGroup>
                <ButtonGroup>
                    <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirmCheckIn}>
                        ✓ Check In
                    </Button>
                </ButtonGroup>
            </Modal>
        </div>
    )
}
