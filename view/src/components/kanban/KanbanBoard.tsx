import { useState, useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { KanbanAPI } from '../../shared/api'
import type { GroupWithItems, TodoItem, TodoGroup } from '../../shared/api/schema'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { Plus } from 'lucide-react'
import { Modal } from '../shared/Modal'
import { FormGroup, ButtonGroup, Button } from '../shared/Form'

const BoardContainer = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing(3)};
    overflow-x: auto;
    height: 100%;
    padding-bottom: ${({ theme }) => theme.spacing(2)};
    align-items: flex-start;
`

const AddGroupButton = styled.button`
    min-width: 300px;
    height: 60px;
    background-color: transparent;
    border: 2px dashed ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing(1)};
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 1rem;
    font-weight: 600;
    transition: ${({ theme }) => theme.transitions.default};

    &:hover {
        border-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.primary};
        background-color: ${({ theme }) => theme.colors.sidebarHover};
    }
`

export function KanbanBoard() {
    const [groups, setGroups] = useState<GroupWithItems[]>([])
    const [activeItem, setActiveItem] = useState<TodoItem | null>(null)
    const [activeGroup, setActiveGroup] = useState<TodoGroup | null>(null)

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [todoForm, setTodoForm] = useState<Partial<TodoItem>>({})
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null)
    const [activeParentId, setActiveParentId] = useState<number | null>(null)

    useEffect(() => {
        KanbanAPI.getGroups().then(setGroups).catch(console.error)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const type = active.data.current?.type
        if (type === 'TodoItem') {
            setActiveItem(active.data.current?.item as TodoItem)
        } else if (type === 'Column') {
            setActiveGroup(active.data.current?.group as TodoGroup)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const isActiveColumn = active.data.current?.type === 'Column'
        const isOverColumn = over.data.current?.type === 'Column'

        // --- Column reordering ---
        if (isActiveColumn && isOverColumn) {
            setGroups(prev => {
                const oldIndex = prev.findIndex(g => `column-${g.group.id}` === activeId)
                const newIndex = prev.findIndex(g => `column-${g.group.id}` === overId)
                if (oldIndex === -1 || newIndex === -1) return prev
                return arrayMove(prev, oldIndex, newIndex)
            })
            return
        }

        const isActiveTask = active.data.current?.type === 'TodoItem'
        const isOverTask = over.data.current?.type === 'TodoItem'

        if (!isActiveTask) return

        setGroups(prev => {
            const activeItems = prev.map(g => g.items).flat()
            const activeItem = activeItems.find(i => i.id.toString() === activeId)
            if (!activeItem) return prev

            if (isOverTask) {
                const overItem = activeItems.find(i => i.id.toString() === overId)
                if (!overItem) return prev

                if (activeItem.todo_group_id !== overItem.todo_group_id) {
                    // Move to different group
                    const newGroups = [...prev]
                    const sourceGroup = newGroups.find(g => g.group.id === activeItem.todo_group_id)!
                    const targetGroup = newGroups.find(g => g.group.id === overItem.todo_group_id)!

                    sourceGroup.items = sourceGroup.items.filter(i => i.id !== activeItem.id)

                    const clonedItem = { ...activeItem, todo_group_id: targetGroup.group.id }
                    const targetIndex = targetGroup.items.findIndex(i => i.id === overItem.id)
                    targetGroup.items.splice(targetIndex, 0, clonedItem)

                    return newGroups
                } else {
                    // Reorder in same group
                    const newGroups = [...prev]
                    const group = newGroups.find(g => g.group.id === activeItem.todo_group_id)!
                    const oldIndex = group.items.findIndex(i => i.id === activeItem.id)
                    const newIndex = group.items.findIndex(i => i.id === overItem.id)

                    group.items.splice(oldIndex, 1)
                    group.items.splice(newIndex, 0, activeItem)

                    return newGroups
                }
            }

            if (isOverColumn) {
                const targetGroupId = over.data.current?.group.id
                if (activeItem.todo_group_id !== targetGroupId) {
                    const newGroups = [...prev]
                    const sourceGroup = newGroups.find(g => g.group.id === activeItem.todo_group_id)!
                    const targetGroup = newGroups.find(g => g.group.id === targetGroupId)!

                    sourceGroup.items = sourceGroup.items.filter(i => i.id !== activeItem.id)
                    const clonedItem = { ...activeItem, todo_group_id: targetGroupId }
                    targetGroup.items.push(clonedItem)

                    return newGroups
                }
            }

            return prev
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active } = event
        const activeType = active.data.current?.type

        // --- Column drag end ---
        if (activeType === 'Column') {
            setActiveGroup(null)
            // Sync all group order_index with backend
            try {
                const updates = groups.map((g, index) => KanbanAPI.updateGroup(g.group.id, { order_index: index }))
                await Promise.all(updates)
            } catch (e) {
                console.error('Failed to sync group order', e)
            }
            return
        }

        // --- Todo item drag end ---
        setActiveItem(null)
        const activeId = active.id
        const activeItemFromState = groups
            .map(g => g.items)
            .flat()
            .find(i => i.id.toString() === activeId)

        if (activeItemFromState) {
            const group = groups.find(g => g.group.id === activeItemFromState.todo_group_id)
            if (group) {
                const index = group.items.findIndex(i => i.id === activeItemFromState.id)

                // Sync with backend
                try {
                    await KanbanAPI.updateTodo(activeItemFromState.id, {
                        todo_group_id: activeItemFromState.todo_group_id,
                        order_index: index * 10 // scale index to avoid collision
                    })
                } catch (e) {
                    console.error('Failed to sync todo', e)
                    // In a real app, we might revert state here on failure
                }
            }
        }
    }

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!groupName.trim()) return
        try {
            const newGroup = await KanbanAPI.createGroup({ name: groupName, order_index: -1 })
            setGroups(prev => [...prev, { group: newGroup, items: [] }])
            setIsGroupModalOpen(false)
            setGroupName('')
        } catch (e) {
            console.error(e)
            alert('Failed to create group.')
        }
    }

    const openTodoModal = (groupId: number, todo?: TodoItem, parentId?: number) => {
        setActiveGroupId(groupId)
        setActiveParentId(parentId || null)
        if (todo && !parentId) {
            setEditingTodoId(todo.id)
            setTodoForm({
                title: todo.title,
                description: todo.description || '',
                priority: todo.priority,
                due_date: todo.due_date || ''
            })
        } else {
            setEditingTodoId(null)
            setTodoForm({ title: '', description: '', priority: 'low', due_date: '' })
        }
        setIsTodoModalOpen(true)
    }

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!todoForm.title?.trim() || activeGroupId === null) return
        try {
            if (editingTodoId) {
                const updatedTodo = await KanbanAPI.updateTodo(editingTodoId, {
                    title: todoForm.title,
                    description: todoForm.description || undefined,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    priority: todoForm.priority as any,
                    due_date: todoForm.due_date || undefined
                })
                setGroups(prev =>
                    prev.map(g => ({
                        ...g,
                        items: g.items.map(item => (item.id === editingTodoId ? { ...item, ...updatedTodo } : item))
                    }))
                )
            } else {
                const group = groups.find(g => g.group.id === activeGroupId)
                const orderIndex = group ? group.items.length * 10 : 0
                const newTodo = await KanbanAPI.createTodo({
                    todo_group_id: activeGroupId,
                    parent_id: activeParentId || undefined,
                    title: todoForm.title,
                    description: todoForm.description || undefined,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    priority: todoForm.priority as any,
                    due_date: todoForm.due_date || undefined,
                    order_index: orderIndex
                })
                setGroups(prev =>
                    prev.map(g => {
                        if (g.group.id === activeGroupId) {
                            return { ...g, items: [...g.items, newTodo] }
                        }
                        return g
                    })
                )
            }
            setIsTodoModalOpen(false)
        } catch (e) {
            console.error(e)
            alert('Failed to save todo.')
        }
    }

    const columnIds = useMemo(() => groups.map(g => `column-${g.group.id}`), [groups])

    const handleStatusChange = (id: number, newStatus: 'pending' | 'doing' | 'done') => {
        setGroups(prev =>
            prev.map(g => ({
                ...g,
                items: g.items.map(item => (item.id === id ? { ...item, status: newStatus } : item))
            }))
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                <BoardContainer>
                    {groups.map(group => (
                        <KanbanColumn
                            key={group.group.id}
                            group={group}
                            onAddTodo={openTodoModal}
                            onEditTodo={(todo) => openTodoModal(group.group.id, todo)}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                    <AddGroupButton onClick={() => setIsGroupModalOpen(true)}>
                        <Plus size={20} />
                        Add Group
                    </AddGroupButton>
                </BoardContainer>
            </SortableContext>

            <DragOverlay>
                {activeItem ? <KanbanCard item={activeItem} /> : null}
                {activeGroup ? (
                    <div
                        style={{
                            width: 300,
                            minWidth: 300,
                            background: 'var(--colors-background, #fff)',
                            border: '1px solid var(--colors-border, #e0e0e0)',
                            borderRadius: 8,
                            padding: 12,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                        }}
                    >
                        <h3 style={{ margin: 0 }}>{activeGroup.name}</h3>
                    </div>
                ) : null}
            </DragOverlay>

            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="New Kanban Group">
                <form onSubmit={handleAddGroup}>
                    <FormGroup>
                        <label>Group Name</label>
                        <input
                            autoFocus
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="e.g. Backlog"
                        />
                    </FormGroup>
                    <ButtonGroup>
                        <Button type="button" onClick={() => setIsGroupModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create Group
                        </Button>
                    </ButtonGroup>
                </form>
            </Modal>

            <Modal isOpen={isTodoModalOpen} onClose={() => setIsTodoModalOpen(false)} title={editingTodoId ? "Edit Todo Task" : "New Todo Task"}>
                <form onSubmit={handleAddTodo}>
                    <FormGroup>
                        <label>Title</label>
                        <input
                            autoFocus
                            value={todoForm.title || ''}
                            onChange={e => setTodoForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Task title"
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Description (Optional)</label>
                        <textarea
                            value={todoForm.description || ''}
                            onChange={e => setTodoForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add more details here..."
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Due Date (Optional)</label>
                        <input
                            type="date"
                            value={todoForm.due_date || ''}
                            onChange={e => setTodoForm(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                    </FormGroup>
                    <FormGroup>
                        <label>Priority</label>
                        <select
                            value={todoForm.priority || 'low'}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={e => setTodoForm(prev => ({ ...prev, priority: e.target.value as any }))}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </FormGroup>
                    <ButtonGroup>
                        <Button type="button" onClick={() => setIsTodoModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingTodoId ? "Save Changes" : "Add Task"}
                        </Button>
                    </ButtonGroup>
                </form>
            </Modal>
        </DndContext>
    )
}
