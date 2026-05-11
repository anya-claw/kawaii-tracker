import styled from '@emotion/styled'
import type { TodoItem } from '../../shared/api/schema'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check } from 'lucide-react'
import { KanbanAPI } from '../../shared/api'

const CardContainer = styled.div<{ isDragging: boolean; isDone: boolean }>`
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    padding: ${({ theme }) => theme.spacing(2)};
    margin-bottom: ${({ theme }) => theme.spacing(1.5)};
    box-shadow: ${({ theme, isDragging }) => (isDragging ? theme.shadows.hover : theme.shadows.soft)};
    opacity: ${({ isDragging, isDone }) => (isDragging ? 0.5 : isDone ? 0.6 : 1)};
    cursor: grab;

    display: flex;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(1)};

    &:hover {
        box-shadow: ${({ theme }) => theme.shadows.hover};
    }
`

const DragHandle = styled.div`
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 2px;
    cursor: grab;
    &:active {
        cursor: grabbing;
    }
`

const CheckboxWrapper = styled.div<{ checked: boolean }>`
    width: 20px;
    height: 20px;
    min-width: 20px;
    border-radius: 4px;
    border: 2px solid ${({ theme, checked }) => (checked ? theme.colors.primary : theme.colors.border)};
    background-color: ${({ theme, checked }) => (checked ? theme.colors.primary : 'transparent')};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-top: 2px;

    &:hover {
        border-color: ${({ theme }) => theme.colors.primary};
    }
`

const CheckIcon = styled(Check)`
    color: #fff;
    size: 14;
`

const Content = styled.div<{ isDone: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    ${({ isDone }) => isDone && `
        opacity: 0.6;
    `}
`

const Title = styled.h4<{ isDone: boolean }>`
    margin: 0;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text};
    ${({ isDone }) => isDone && `
        text-decoration: line-through;
        opacity: 0.7;
    `}
`

const Description = styled.p`
    margin: 0;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
`

const SubTasksContainer = styled.div`
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`

const SubTaskItem = styled.div<{ isDone: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text};
    padding: 4px 6px;
    background-color: rgba(0,0,0,0.02);
    border-radius: 4px;
    
    ${({ isDone }) => isDone && `
        text-decoration: line-through;
        opacity: 0.6;
    `}

    &:hover {
        background-color: rgba(0,0,0,0.04);
    }
`

const AddSubTaskBtn = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-top: 4px;
    cursor: pointer;
    &:hover {
        color: ${({ theme }) => theme.colors.primary};
    }
`

const MetaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
`

const DueDateBadge = styled.div<{ isOverdue: boolean }>`
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.7rem;
    color: ${({ theme, isOverdue }) => isOverdue ? theme.colors.danger : theme.colors.textMuted};
    background-color: ${({ theme, isOverdue }) => isOverdue ? 'rgba(255, 107, 107, 0.1)' : 'transparent'};
    padding: 2px 4px;
    border-radius: 4px;
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

interface Props {
    item: TodoItem
    subItems?: TodoItem[]
    onStatusChange?: (id: number, status: 'pending' | 'doing' | 'done') => void
    onClick?: () => void
    onAddSubTask?: () => void
    onEditSubTask?: (item: TodoItem) => void
}

export function KanbanCard({ item, subItems = [], onStatusChange, onClick, onAddSubTask, onEditSubTask }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id.toString(),
        data: { type: 'TodoItem', item }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    const isDone = item.status === 'done'
    const isOverdue = item.due_date ? new Date(item.due_date) < new Date() && !isDone : false

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        const newStatus = isDone ? 'pending' : 'done'
        try {
            await KanbanAPI.updateTodo(item.id, { status: newStatus })
            onStatusChange?.(item.id, newStatus)
        } catch (err) {
            console.error('Failed to toggle status', err)
        }
    }

    return (
        <CardContainer ref={setNodeRef} style={style} isDragging={isDragging} isDone={isDone} onClick={onClick}>
            <CheckboxWrapper checked={isDone} onClick={handleToggle} onMouseDown={e => e.stopPropagation()}>
                {isDone && <CheckIcon size={14} />}
            </CheckboxWrapper>
            <DragHandle {...attributes} {...listeners}>
                <GripVertical size={16} />
            </DragHandle>
            <Content isDone={isDone}>
                <Title isDone={isDone}>{item.title}</Title>
                {item.description && <Description>{item.description}</Description>}
                <MetaRow>
                    <PriorityBadge priority={item.priority || 'low'}>
                        {(item.priority || 'low').toUpperCase()}
                    </PriorityBadge>
                    {item.due_date && (
                        <DueDateBadge isOverdue={isOverdue}>
                            <Clock size={10} />
                            {item.due_date}
                        </DueDateBadge>
                    )}
                </MetaRow>

                {(subItems.length > 0 || onAddSubTask) && (
                    <SubTasksContainer onClick={e => e.stopPropagation()}>
                        {subItems.map(sub => (
                            <SubTaskItem key={sub.id} isDone={sub.status === 'done'} onClick={() => onEditSubTask?.(sub)}>
                                <CheckboxWrapper 
                                    style={{ width: 14, height: 14, minWidth: 14 }}
                                    checked={sub.status === 'done'} 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const newSt = sub.status === 'done' ? 'pending' : 'done'
                                        KanbanAPI.updateTodo(sub.id, { status: newSt }).then(() => {
                                            onStatusChange?.(sub.id, newSt)
                                        })
                                    }}
                                >
                                    {sub.status === 'done' && <CheckIcon size={10} />}
                                </CheckboxWrapper>
                                {sub.title}
                            </SubTaskItem>
                        ))}
                        {onAddSubTask && !isDone && (
                            <AddSubTaskBtn onClick={(e) => { e.stopPropagation(); onAddSubTask(); }}>
                                <Plus size={12} /> Add subtask
                            </AddSubTaskBtn>
                        )}
                    </SubTasksContainer>
                )}
            </Content>
        </CardContainer>
    )
}
