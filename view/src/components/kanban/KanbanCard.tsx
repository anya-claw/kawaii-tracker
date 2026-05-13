import styled from '@emotion/styled'
import type { TodoItem } from '../../shared/api/schema'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { GripVertical, Check, Plus, Clock, ArrowRight, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { CountdownBadge } from '../shared/CountdownBadge'
import { KanbanAPI } from '../../shared/api'
import { useState } from 'react'

const CardContainer = styled.div<{ isDragging: boolean; isDone: boolean; isDropTarget?: boolean }>`
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme, isDropTarget }) => (isDropTarget ? theme.colors.primary : theme.colors.border)};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    padding: ${({ theme }) => theme.spacing(2)};
    margin-bottom: ${({ theme }) => theme.spacing(1.5)};
    box-shadow: ${({ theme, isDragging, isDropTarget }) => (isDragging ? theme.shadows.hover : isDropTarget ? `0 0 0 2px ${theme.colors.primary}40` : theme.shadows.card)};
    opacity: ${({ isDragging, isDone }) => (isDragging ? 0.5 : isDone ? 0.6 : 1)};
    transition: ${props => props.theme.transitions.default};
    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.98);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    display: flex;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(1)};

    &:hover {
        box-shadow: ${({ theme }) => theme.shadows.hover};
        border-color: ${({ theme }) => theme.colors.primary}30;
    }

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(1.5)};
        margin-bottom: ${({ theme }) => theme.spacing(1)};
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

    @media (max-width: 768px) {
        display: none; /* Hide drag handle on mobile */
    }
`

const MobileActions = styled.div`
    display: none;
    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-left: auto;
    }
`

const MobileActionBtn = styled.button<{ variant?: 'default' | 'success' | 'warning' }>`
    background: ${({ theme, variant }) =>
        variant === 'success'
            ? theme.colors.success + '20'
            : variant === 'warning'
              ? theme.colors.danger + '20'
              : theme.colors.surfaceAlt};
    color: ${({ theme, variant }) =>
        variant === 'success'
            ? theme.colors.success
            : variant === 'warning'
              ? theme.colors.danger
              : theme.colors.textMuted};
    border: 1px solid
        ${({ theme, variant }) =>
            variant === 'success'
                ? theme.colors.success + '40'
                : variant === 'warning'
                  ? theme.colors.danger + '40'
                  : theme.colors.border};
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: ${props => props.theme.transitions.fast};

    &:hover {
        background: ${({ theme, variant }) =>
            variant === 'success'
                ? theme.colors.success + '30'
                : variant === 'warning'
                  ? theme.colors.danger + '30'
                  : theme.colors.sidebarHover};
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
        transform: scale(1.05);
    }
`

const CheckIcon = styled(Check)`
    color: #fff;
`

const Content = styled.div<{ isDone: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    ${({ isDone }) =>
        isDone &&
        `
        opacity: 0.6;
    `}
`

const Title = styled.h4<{ isDone: boolean }>`
    margin: 0;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text};
    ${({ isDone }) =>
        isDone &&
        `
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

const SubTaskItem = styled.div<{ isDone: boolean; isDragging: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.text};
    padding: 6px 8px;
    background-color: ${({ theme }) => theme.colors.background};
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    transition: ${props => props.theme.transitions.fast};
    flex-direction: column;
    opacity: ${({ isDragging }) => (isDragging ? 0.4 : 1)};

    ${({ isDone }) =>
        isDone &&
        `
        text-decoration: line-through;
        opacity: 0.6;
    `}

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

const SubTaskRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
`

const SubTaskDragHandle = styled.div`
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    flex-shrink: 0;
    &:active {
        cursor: grabbing;
    }
    @media (max-width: 768px) {
        display: none;
    }
`

const SubTaskDesc = styled.span`
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-left: 20px;
    margin-top: 2px;
`

const AddSubTaskBtn = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-top: 4px;
    cursor: pointer;
    transition: ${props => props.theme.transitions.fast};

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
    color: ${({ theme, isOverdue }) => (isOverdue ? theme.colors.danger : theme.colors.textMuted)};
    background-color: ${({ isOverdue, theme }) => (isOverdue ? theme.colors.danger + '15' : 'transparent')};
    padding: 2px 4px;
    border-radius: 4px;
`

const PriorityBadge = styled.span<{ priority: string }>`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
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

const SubTaskCheckbox = styled(CheckboxWrapper)`
    width: 16px;
    height: 16px;
    min-width: 14px;
`

const SubTaskTitle = styled.span`
    flex: 1;
    font-size: 1rem;
`

const SubTaskPriority = styled(PriorityBadge)`
    font-size: 0.6rem;
    padding: 1px 4px;
`

const MoveMenuWrapper = styled.div`
    position: relative;
`

const MoveMenuDropdown = styled.div`
    position: absolute;
    right: 0;
    top: 100%;
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: 4px;
    z-index: 10;
    min-width: 120px;
    box-shadow: ${({ theme }) => theme.shadows.hover};
`

const MoveMenuButton = styled.button`
    display: block;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text};

    &:hover {
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'high':
            return <ArrowUp size={10} />
        case 'low':
            return <ArrowDown size={10} />
        default:
            return <Minus size={10} />
    }
}

interface SubTaskDraggableProps {
    sub: TodoItem
    onEditSubTask?: (item: TodoItem) => void
    onStatusChange?: (id: number, status: 'pending' | 'doing' | 'done') => void
}

function SubTaskDraggable({ sub, onEditSubTask, onStatusChange }: SubTaskDraggableProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `sub-${sub.id}`,
        data: { type: 'SubTask', item: sub }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <SubTaskItem
            ref={setNodeRef}
            style={style}
            isDone={sub.status === 'done'}
            isDragging={isDragging}
            onClick={() => onEditSubTask?.(sub)}
        >
            <SubTaskRow>
                <SubTaskDragHandle {...attributes} {...listeners}>
                    <GripVertical size={12} />
                </SubTaskDragHandle>
                <SubTaskCheckbox
                    checked={sub.status === 'done'}
                    onClick={e => {
                        e.stopPropagation()
                        const newSt = sub.status === 'done' ? 'pending' : 'done'
                        KanbanAPI.updateTodo(sub.id, { status: newSt })
                            .then(() => {
                                onStatusChange?.(sub.id, newSt)
                            })
                            .catch(err => {
                                const message =
                                    err instanceof Error ? err.message : 'Failed to update status'
                                alert(message)
                            })
                    }}
                >
                    {sub.status === 'done' && <CheckIcon size={10} />}
                </SubTaskCheckbox>
                <SubTaskTitle>{sub.title}</SubTaskTitle>
                <SubTaskPriority priority={sub.priority || 'low'}>
                    {getPriorityIcon(sub.priority || 'low')}
                </SubTaskPriority>
            </SubTaskRow>
            {sub.description && <SubTaskDesc>{sub.description}</SubTaskDesc>}
        </SubTaskItem>
    )
}

interface Props {
    item: TodoItem
    subItems?: TodoItem[]
    onStatusChange?: (id: number, status: 'pending' | 'doing' | 'done') => void
    onClick?: () => void
    onAddSubTask?: () => void
    onEditSubTask?: (item: TodoItem) => void
    allGroups?: { id: number; name: string }[]
    onMoveToGroup?: (todoId: number, groupId: number) => void
    /** Set of todo IDs that have subtasks — used to prevent nesting */
    todosWithChildren?: Set<number>
}

export function KanbanCard({
    item,
    subItems = [],
    onStatusChange,
    onClick,
    onAddSubTask,
    onEditSubTask,
    allGroups = [],
    onMoveToGroup,
    todosWithChildren = new Set()
}: Props) {
    const hasChildren = subItems.length > 0
    const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
        id: item.id.toString(),
        data: { type: 'TodoItem', item, hasChildren }
    })

    // Droppable zone — SubTasks can be dropped onto this Todo to become its children
    const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
        id: `todo-drop-${item.id}`,
        data: { type: 'TodoItem', item, hasChildren }
    })

    // Combine both refs
    const setNodeRef = (el: HTMLDivElement | null) => {
        setSortableRef(el)
        setDropRef(el)
    }

    const [showMoveMenu, setShowMoveMenu] = useState(false)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    const isDone = item.status === 'done'
    const isOverdue = item.due_date ? new Date(item.due_date) < new Date() && !isDone : false

    const formatDueDate = (dateStr: string) => {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return dateStr
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        const newStatus = isDone ? 'pending' : 'done'
        try {
            await KanbanAPI.updateTodo(item.id, { status: newStatus })
            onStatusChange?.(item.id, newStatus)
        } catch (err: unknown) {
            console.error('Failed to toggle status', err)
            const message = err instanceof Error ? err.message : 'Failed to update status'
            alert(message)
        }
    }

    const handleMobileStatusChange = async (newStatus: 'pending' | 'doing' | 'done') => {
        try {
            await KanbanAPI.updateTodo(item.id, { status: newStatus })
            onStatusChange?.(item.id, newStatus)
        } catch (err: unknown) {
            console.error('Failed to change status', err)
            const message = err instanceof Error ? err.message : 'Failed to update status'
            alert(message)
        }
    }

    const handleMoveToGroup = async (groupId: number) => {
        setShowMoveMenu(false)
        if (onMoveToGroup) {
            onMoveToGroup(item.id, groupId)
        } else {
            try {
                await KanbanAPI.updateTodo(item.id, { todo_group_id: groupId })
                onStatusChange?.(item.id, item.status) // Trigger refresh
            } catch (err: unknown) {
                console.error('Failed to move', err)
                const message = err instanceof Error ? err.message : 'Failed to move task'
                alert(message)
            }
        }
    }

    return (
        <CardContainer ref={setNodeRef} style={style} isDragging={isDragging} isDone={isDone} isDropTarget={isDropOver} onClick={onClick}>
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
                        {getPriorityIcon(item.priority || 'low')}
                        {(item.priority || 'low').toUpperCase()}
                    </PriorityBadge>
                    {item.due_date && <CountdownBadge dueDate={item.due_date} />}
                </MetaRow>

                {(subItems.length > 0 || onAddSubTask) && (
                    <SubTasksContainer onClick={e => e.stopPropagation()}>
                        {subItems.map(sub => (
                            <SubTaskDraggable
                                key={sub.id}
                                sub={sub}
                                onEditSubTask={onEditSubTask}
                                onStatusChange={onStatusChange}
                            />
                        ))}
                        {onAddSubTask && (
                            <AddSubTaskBtn onClick={onAddSubTask}>
                                <Plus size={12} /> Add Subtask
                            </AddSubTaskBtn>
                        )}
                    </SubTasksContainer>
                )}
            </Content>

            {/* Mobile Actions */}
            <MobileActions onClick={e => e.stopPropagation()}>
                {item.status !== 'done' && (
                    <MobileActionBtn variant="success" onClick={() => handleMobileStatusChange('done')}>
                        <Check size={12} /> Done
                    </MobileActionBtn>
                )}
                {item.status === 'done' && (
                    <MobileActionBtn onClick={() => handleMobileStatusChange('pending')}>Undo</MobileActionBtn>
                )}
                {allGroups.length > 1 && (
                    <MoveMenuWrapper>
                        <MobileActionBtn onClick={() => setShowMoveMenu(!showMoveMenu)}>
                            <ArrowRight size={12} /> Move
                        </MobileActionBtn>
                        {showMoveMenu && (
                            <MoveMenuDropdown>
                                {allGroups
                                    .filter(g => g.id !== item.todo_group_id)
                                    .map(g => (
                                        <MoveMenuButton key={g.id} onClick={() => handleMoveToGroup(g.id)}>
                                            {g.name}
                                        </MoveMenuButton>
                                    ))}
                            </MoveMenuDropdown>
                        )}
                    </MoveMenuWrapper>
                )}
            </MobileActions>
        </CardContainer>
    )
}
