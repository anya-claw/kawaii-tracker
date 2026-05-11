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
    const [historyItems, setHistoryItems] = useState<{ todo: TodoItem; groupName: string }[]>([])

    useEffect(() => {
        KanbanAPI.getGroups()
            .then(groups => {
                const allItems = groups.flatMap(g => 
                    g.items.map(item => ({ todo: item, groupName: g.group.name }))
                )
                // Filter only done items
                const doneItems = allItems.filter(item => item.todo.status === 'done')
                // Sort by updated_at descending
                doneItems.sort((a, b) => new Date(b.todo.updated_at).getTime() - new Date(a.todo.updated_at).getTime())
                setHistoryItems(doneItems)
            })
            .catch(console.error)
    }, [])

    return (
        <Container>
            <p style={{ color: '#9aa0a6', fontSize: '0.9rem', marginBottom: '8px' }}>
                Showing completed Todo tasks.
            </p>
            {historyItems.length === 0 ? (
                <p style={{ color: '#9aa0a6' }}>No completed tasks found.</p>
            ) : (
                historyItems.map(({ todo, groupName }) => (
                    <HistoryCard key={todo.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <TitleArea>
                                <CheckCircle2 size={18} color="#b5ead7" />
                                <span style={{ fontWeight: 600 }}>{todo.title}</span>
                                {todo.priority === 'high' && (
                                    <span style={{ fontSize: '0.75rem', color: '#ff9a9e' }}>[HIGH]</span>
                                )}
                            </TitleArea>
                            {todo.description && (
                                <span style={{ fontSize: '0.85rem', color: '#9aa0a6', paddingLeft: '24px' }}>
                                    {todo.description}
                                </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: '#a0a0a0', paddingLeft: '24px' }}>
                                Group: {groupName} {todo.due_date ? `| Due: ${todo.due_date}` : ''}
                            </span>
                        </div>
                        <DateInfo>
                            <Clock size={14} />
                            Completed: {new Date(todo.updated_at).toLocaleString()}
                        </DateInfo>
                    </HistoryCard>
                ))
            )}
        </Container>
    )
}
