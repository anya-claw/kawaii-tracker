import { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { KanbanAPI } from '../../shared/api'
import type { TodoItem } from '../../shared/api/schema'
import { CheckCircle2, Clock, Tag, Calendar, AlertCircle, FileText, ArrowUp, ArrowDown, Minus } from 'lucide-react'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`

const HistoryCard = styled.div`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: ${({ theme }) => theme.spacing(2.5)};
    border: 1px solid ${({ theme }) => theme.colors.success}40;
    box-shadow: ${({ theme }) => theme.shadows.card};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
    opacity: 0.95;
    transition: ${props => props.theme.transitions.default};

    &:hover {
        opacity: 1;
        border-color: ${({ theme }) => theme.colors.success};
        box-shadow: ${({ theme }) => theme.shadows.hover};
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(2)};
    }
`

const TopRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(2)};
`

const TitleArea = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1.5)};
    color: ${({ theme }) => theme.colors.text};
    flex: 1;
`

const TitleText = styled.span`
    font-weight: 600;
    font-size: 1rem;
    text-decoration: line-through;
    text-decoration-color: ${({ theme }) => theme.colors.textMuted};
`

const PriorityBadge = styled.span<{ priority: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 700;
    background-color: ${({ theme, priority }) =>
        priority === 'high'
            ? theme.colors.danger + '30'
            : priority === 'medium'
              ? '#ffd16630'
              : theme.colors.secondary + '30'};
    color: ${({ theme, priority }) =>
        priority === 'high' ? theme.colors.danger : priority === 'medium' ? '#d4a000' : theme.colors.secondary};
`

const StatusBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 12px;
    background-color: ${({ theme }) => theme.colors.success}30;
    color: ${({ theme }) => theme.colors.success};
    font-size: 0.85rem;
    font-weight: 600;
`

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: ${({ theme }) => theme.spacing(2)};
    padding-left: ${({ theme }) => theme.spacing(3)};
`

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};

    svg {
        color: ${({ theme }) => theme.colors.primary}60;
    }

    span {
        color: ${({ theme }) => theme.colors.text};
        font-weight: 500;
    }
`

const DescriptionText = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    padding: ${({ theme }) => theme.spacing(1.5)};
    padding-left: ${({ theme }) => theme.spacing(3)};
    background-color: ${({ theme }) => theme.colors.surfaceAlt};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    margin-top: ${({ theme }) => theme.spacing(1)};
`

const TimeInfo = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: ${({ theme }) => theme.spacing(1.5)};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const TimeItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`

const HeaderText = styled.p`
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`

export function TodoHistory() {
    const [historyItems, setHistoryItems] = useState<{ todo: TodoItem; groupName: string }[]>([])

    useEffect(() => {
        KanbanAPI.getGroups()
            .then(groups => {
                const allItems = groups.flatMap(g => g.items.map(item => ({ todo: item, groupName: g.group.name })))
                // Filter only done items
                const doneItems = allItems.filter(item => item.todo.status === 'done')
                // Sort by updated_at descending
                doneItems.sort((a, b) => new Date(b.todo.updated_at).getTime() - new Date(a.todo.updated_at).getTime())
                setHistoryItems(doneItems)
            })
            .catch(console.error)
    }, [])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    }

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <ArrowUp size={14} />
            case 'low':
                return <ArrowDown size={14} />
            default:
                return <Minus size={14} />
        }
    }

    return (
        <Container>
            <HeaderText>✓ Completed Todo tasks history ({historyItems.length} items)</HeaderText>
            {historyItems.length === 0 ? (
                <p style={{ color: 'var(--textMuted)', textAlign: 'center', padding: '32px 0' }}>
                    No completed tasks found.
                </p>
            ) : (
                historyItems.map(({ todo, groupName }) => (
                    <HistoryCard key={todo.id}>
                        <TopRow>
                            <TitleArea>
                                <CheckCircle2 size={20} />
                                <TitleText>{todo.title}</TitleText>
                                <PriorityBadge priority={todo.priority}>
                                    {getPriorityIcon(todo.priority)}
                                    {todo.priority.toUpperCase()}
                                </PriorityBadge>
                            </TitleArea>
                            <StatusBadge>
                                <CheckCircle2 size={14} /> Done
                            </StatusBadge>
                        </TopRow>

                        <InfoGrid>
                            <InfoItem>
                                <Tag size={14} />
                                <span>{groupName}</span>
                            </InfoItem>
                            {todo.due_date && (
                                <InfoItem>
                                    <Calendar size={14} />
                                    <span>Due: {formatDate(todo.due_date)}</span>
                                </InfoItem>
                            )}
                            {todo.parent_id && (
                                <InfoItem>
                                    <AlertCircle size={14} />
                                    <span>Subtask</span>
                                </InfoItem>
                            )}
                        </InfoGrid>

                        {todo.description && (
                            <DescriptionText>
                                <FileText size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                {todo.description}
                            </DescriptionText>
                        )}

                        <TimeInfo>
                            <TimeItem>
                                <Clock size={14} />
                                Created: {formatDateTime(todo.created_at)}
                            </TimeItem>
                            <TimeItem>
                                <CheckCircle2 size={14} />
                                Completed: {formatDateTime(todo.updated_at)}
                            </TimeItem>
                        </TimeInfo>
                    </HistoryCard>
                ))
            )}
        </Container>
    )
}
