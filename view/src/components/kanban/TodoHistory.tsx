import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { KanbanAPI } from '../../shared/api'
import type { TodoItem } from '../../shared/api/schema'
import { CheckCircle2, Clock } from 'lucide-react'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`

const HistoryCard = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: ${({ theme }) => theme.spacing(2.5)};
    border: 1px solid ${({ theme }) => theme.colors.success};
    box-shadow: ${({ theme }) => theme.shadows.soft};
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0.8;
`

const TitleArea = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: line-through;
    text-decoration-color: ${({ theme }) => theme.colors.textMuted};
`

const DateInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8rem;
`

export function TodoHistory() {
    const [completedTodos, setCompletedTodos] = useState<TodoItem[]>([])

    useEffect(() => {
        // KanbanAPI.getGroups() gives all groups and items.
        // We'll extract items that are "done" or implicitly completed if they're in a "Done" column.
        // The DTO has status='done', let's use that, or just show all for now since status isn't heavily used in the simple drag-drop.
        // Wait, the schema has `status: 'pending' | 'doing' | 'done'`.
        // For now, let's just grab all items and sort by updated_at to simulate a history log.
        KanbanAPI.getGroups()
            .then(groups => {
                const allItems = groups.map(g => g.items).flat()
                // Sort by updated_at descending
                allItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                setCompletedTodos(allItems)
            })
            .catch(console.error)
    }, [])

    return (
        <Container>
            <p style={{ color: '#9aa0a6', fontSize: '0.9rem', marginBottom: '8px' }}>
                Showing recently updated Kanban tasks.
            </p>
            {completedTodos.length === 0 ? (
                <p style={{ color: '#9aa0a6' }}>No task history found.</p>
            ) : (
                completedTodos.map(todo => (
                    <HistoryCard key={todo.id}>
                        <TitleArea>
                            <CheckCircle2 size={18} color="#b5ead7" />
                            <span style={{ fontWeight: 600 }}>{todo.title}</span>
                            {todo.priority === 'high' && (
                                <span style={{ fontSize: '0.75rem', color: '#ff9a9e' }}>[HIGH]</span>
                            )}
                        </TitleArea>
                        <DateInfo>
                            <Clock size={14} />
                            Updated: {new Date(todo.updated_at).toLocaleString()}
                        </DateInfo>
                    </HistoryCard>
                ))
            )}
        </Container>
    )
}
