import { useState } from 'react'
import styled from '@emotion/styled'
import type { GroupWithItems, TodoItem } from '../../shared/api/schema'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { KanbanCard } from './KanbanCard'
import { useDroppable } from '@dnd-kit/core'
import { Plus, GripHorizontal, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'

const ColumnWrapper = styled.div<{ isDragging: boolean }>`
    opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
`

const ColumnContainer = styled.div`
    background-color: ${({ theme }) => theme.colors.background};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    width: 300px;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
    border: 1px solid ${({ theme }) => theme.colors.border};
    transition: ${props => props.theme.transitions.default};

    @media (max-width: 768px) {
        width: 100%;
        min-width: unset;
        border-radius: ${({ theme }) => theme.borderRadius.small};
    }
`

const ColumnHeader = styled.div`
    padding: ${({ theme }) => theme.spacing(2)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: grab;
    user-select: none;
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.medium} ${({ theme }) => theme.borderRadius.medium} 0 0;

    &:active {
        cursor: grabbing;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        color: ${({ theme }) => theme.colors.text};
        font-weight: 700;
    }

    @media (max-width: 768px) {
        cursor: default;
        padding: ${({ theme }) => theme.spacing(1.5)};
        border-radius: ${({ theme }) => theme.borderRadius.small} ${({ theme }) => theme.borderRadius.small} 0 0;
    }
`

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(1)};

    span {
        background-color: ${({ theme }) => theme.colors.primary}20;
        color: ${({ theme }) => theme.colors.primary};
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
    }

    button {
        background: none;
        color: ${({ theme }) => theme.colors.primary};
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        border-radius: ${({ theme }) => theme.borderRadius.small};
        transition: ${props => props.theme.transitions.fast};

        &:hover {
            background-color: ${({ theme }) => theme.colors.sidebarHover};
            transform: scale(1.1);
        }
    }
`

const DragHandle = styled.div`
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    cursor: grab;
    &:active {
        cursor: grabbing;
    }

    @media (max-width: 768px) {
        display: none;
    }
`

const ItemList = styled.div<{ isOver: boolean }>`
    padding: ${({ theme }) => theme.spacing(2)};
    flex: 1;
    overflow-y: auto;
    background-color: ${({ isOver, theme }) => (isOver ? theme.colors.sidebarHover : 'transparent')};
    transition: background-color 0.2s;

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(1.5)};
    }
`

const CompletedSection = styled.div`
    margin-top: ${({ theme }) => theme.spacing(1)};
    padding-top: ${({ theme }) => theme.spacing(1)};
    border-top: 1px dashed ${({ theme }) => theme.colors.border};
`

const CompletedHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: pointer;
    padding: 4px 0;
    margin-bottom: 8px;
    user-select: none;

    &:hover {
        color: ${({ theme }) => theme.colors.text};
    }
`

interface Props {
    group: GroupWithItems
    allGroups?: { id: number; name: string }[]
    onAddTodo: (groupId: number, parentId?: number) => void
    onEditTodo?: (todo: TodoItem) => void
    onAddSubTask?: (parent: TodoItem) => void
    onStatusChange?: (id: number, status: 'pending' | 'doing' | 'done') => void
    onMoveToGroup?: (todoId: number, groupId: number) => void
    onDeleteGroup?: (groupId: number) => void
}

export function KanbanColumn({
    group,
    allGroups = [],
    onAddTodo,
    onEditTodo,
    onAddSubTask,
    onStatusChange,
    onMoveToGroup,
    onDeleteGroup
}: Props) {
    const [showCompleted, setShowCompleted] = useState(false)
    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: `column-${group.group.id}`,
        data: { type: 'Column', group: group.group }
    })

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `group-${group.group.id}`,
        data: {
            type: 'Column',
            group: group.group
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    const pendingItems = group.items.filter(item => item.status !== 'done')
    const completedItems = group.items.filter(item => item.status === 'done')

    const topLevelPending = pendingItems.filter(item => item.parent_id === null)
    const topLevelCompleted = completedItems.filter(item => item.parent_id === null)

    const getSubItems = (parentId: number) => group.items.filter(item => item.parent_id === parentId)

    return (
        <ColumnWrapper ref={setSortableRef} style={style} isDragging={isDragging}>
            <ColumnContainer>
                <ColumnHeader {...attributes} {...listeners}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <DragHandle>
                            <GripHorizontal size={16} />
                        </DragHandle>
                        <h3>{group.group.name}</h3>
                    </div>
                    <HeaderActions>
                        <span>{group.items.filter(i => i.parent_id === null).length}</span>
                        <button
                            onClick={e => {
                                e.stopPropagation()
                                onAddTodo(group.group.id)
                            }}
                        >
                            <Plus size={16} />
                        </button>
                        {onDeleteGroup && (
                            <button
                                style={{
                                    marginLeft: 4,
                                    color: '#ef4444'
                                }}
                                onClick={e => {
                                    e.stopPropagation()
                                    if (confirm('Are you sure you want to delete this board and all its tasks?')) {
                                        onDeleteGroup(group.group.id)
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </HeaderActions>
                </ColumnHeader>

                <ItemList ref={setDroppableRef} isOver={isOver}>
                    <SortableContext
                        items={topLevelPending.map(i => i.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        {topLevelPending.map(item => (
                            <KanbanCard
                                key={item.id}
                                item={item}
                                subItems={getSubItems(item.id)}
                                onStatusChange={onStatusChange}
                                onClick={() => onEditTodo?.(item)}
                                onAddSubTask={() => onAddSubTask?.(item)}
                                onEditSubTask={sub => onEditTodo?.(sub)}
                                allGroups={allGroups}
                                onMoveToGroup={onMoveToGroup}
                            />
                        ))}
                    </SortableContext>

                    {topLevelCompleted.length > 0 && (
                        <CompletedSection>
                            <CompletedHeader onClick={() => setShowCompleted(!showCompleted)}>
                                {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                Completed ({topLevelCompleted.length})
                            </CompletedHeader>
                            {showCompleted && (
                                <SortableContext
                                    items={topLevelCompleted.map(i => i.id.toString())}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {topLevelCompleted.map(item => (
                                        <KanbanCard
                                            key={item.id}
                                            item={item}
                                            subItems={getSubItems(item.id)}
                                            onStatusChange={onStatusChange}
                                            onClick={() => onEditTodo?.(item)}
                                            onAddSubTask={() => onAddSubTask?.(item)}
                                            onEditSubTask={sub => onEditTodo?.(sub)}
                                            allGroups={allGroups}
                                            onMoveToGroup={onMoveToGroup}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </CompletedSection>
                    )}
                </ItemList>
            </ColumnContainer>
        </ColumnWrapper>
    )
}
