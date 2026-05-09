import React, { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import {
    Plus,
    X,
    CheckSquare,
    Square,
    ListTodo,
    ChevronRight,
    GripVertical,
    Trash2,
    Calendar,
    AlertCircle,
    GripHorizontal
} from 'lucide-react'
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DragOverlay
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ───────────────────────────────────────────────
interface TodoItemData {
    id: number
    name: string
    completed_at: string | null
    parent_id: number | null
    group_id: number
    end_at: string | null
    position: number
}

interface BoardColumn {
    group: { id: number; name: string; description: string | null; position: number }
    items: TodoItemData[]
    completed_items: TodoItemData[]
}

// ─── Todo Item Card ──────────────────────────────────────
function TodoItemCard({
    item,
    isSub = false,
    dragHandle,
    onToggle,
    onDelete,
    isDragging = false
}: {
    item: TodoItemData
    isSub?: boolean
    dragHandle?: any
    onToggle?: (item: TodoItemData) => void
    onDelete?: (id: number) => void
    isDragging?: boolean
}) {
    const isOverdue = item.end_at && new Date(item.end_at) < new Date() && !item.completed_at
    const isCompleted = !!item.completed_at

    return (
        <div
            className={`group relative flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 border
        ${
            isDragging
                ? 'bg-brand-50/80 dark:bg-gray-800/80 border-brand-300 dark:border-brand-500/50 shadow-xl scale-[1.02] rotate-1'
                : isCompleted
                  ? 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/50 opacity-60 hover:opacity-90'
                  : isOverdue
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 shadow-sm hover:shadow-md'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-gray-600'
        }
        ${isSub ? 'ml-8' : ''}
      `}
        >
            {/* Drag Handle */}
            {dragHandle && (
                <button
                    {...dragHandle}
                    className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-brand-400 dark:text-gray-600 dark:hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                    <GripVertical size={16} />
                </button>
            )}

            {/* Checkbox */}
            <button
                onClick={() => onToggle && onToggle(item)}
                className={`mt-0.5 flex-shrink-0 transition-all duration-200 ${
                    isCompleted
                        ? 'text-emerald-500 hover:text-emerald-400 scale-110'
                        : 'text-gray-300 dark:text-gray-600 hover:text-brand-500 dark:hover:text-brand-400 hover:scale-110'
                }`}
            >
                {isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p
                    className={`text-sm font-medium leading-snug ${
                        isCompleted
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-800 dark:text-gray-100'
                    }`}
                >
                    {item.name}
                </p>

                {/* Meta Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                        #{item.id}
                    </span>
                    {item.end_at && (
                        <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                isOverdue
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                        >
                            {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
                            {new Date(item.end_at).toLocaleDateString('zh-CN', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    )}
                </div>
            </div>

            {/* Delete */}
            {onDelete && (
                <button
                    onClick={() => onDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-all p-1 flex-shrink-0"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            )}

            {/* Sub-item connector line */}
            {isSub && <div className="absolute -left-5 top-5 w-4 h-px bg-gray-200 dark:bg-gray-700" />}
        </div>
    )
}

// ─── Sortable Task Item ───────────────────────────────
function SortableTask({
    id,
    item,
    childrenItems,
    onToggle,
    onDelete
}: {
    id: number
    item: TodoItemData
    childrenItems: TodoItemData[]
    onToggle: (item: TodoItemData) => void
    onDelete: (id: number) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        data: { type: 'Task', item }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <TodoItemCard item={item} dragHandle={listeners} onToggle={onToggle} onDelete={onDelete} />
            {childrenItems.length > 0 && (
                <div className="relative">
                    <div className="absolute left-[22px] top-0 bottom-4 w-px bg-gray-200 dark:bg-gray-800" />
                    {childrenItems.map(child => (
                        <TodoItemCard key={child.id} item={child} isSub onToggle={onToggle} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Sortable Column ───────────────────────────────
function SortableColumn({
    col,
    onDeleteGroup,
    onToggleItem,
    onDeleteItem,
    showCompleted,
    setShowCompleted,
    setShowAddItem
}: {
    col: BoardColumn
    onDeleteGroup: (id: number) => void
    onToggleItem: (item: TodoItemData) => void
    onDeleteItem: (id: number) => void
    showCompleted: number | null
    setShowCompleted: (val: number | null) => void
    setShowAddItem: (id: number) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: col.group.id,
        data: { type: 'Column', column: col }
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1
    }

    const parentItems = col.items.filter(i => !i.parent_id)
    const parentIds = parentItems.map(i => i.id)

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`w-[340px] shrink-0 flex flex-col bg-gray-50/60 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-colors ${
                isDragging ? 'ring-2 ring-brand-500' : ''
            }`}
        >
            {/* Column Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0" {...attributes} {...listeners}>
                    <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">
                        <GripHorizontal size={16} />
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-400 dark:bg-brand-500 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-50 truncate">{col.group.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gray-200/70 dark:bg-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {parentItems.length}
                    </span>
                </div>
                <button
                    onClick={() => onDeleteGroup(col.group.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete column"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Task List container */}
            <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                <SortableContext items={parentIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {parentItems.map(parent => {
                            const children = col.items.filter(i => i.parent_id === parent.id)
                            return (
                                <SortableTask
                                    key={parent.id}
                                    id={parent.id}
                                    item={parent}
                                    childrenItems={children}
                                    onToggle={onToggleItem}
                                    onDelete={onDeleteItem}
                                />
                            )
                        })}
                    </div>
                </SortableContext>

                {/* Add Task Button */}
                <button
                    onClick={() => setShowAddItem(col.group.id)}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-500/50 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all font-medium text-sm"
                >
                    <Plus size={16} /> Add Task
                </button>

                {/* Completed Items Section */}
                {col.completed_items.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setShowCompleted(showCompleted === col.group.id ? null : col.group.id)}
                            className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-3 w-full"
                        >
                            <ChevronRight
                                size={14}
                                className={`transition-transform duration-200 ${
                                    showCompleted === col.group.id ? 'rotate-90' : ''
                                }`}
                            />
                            Completed ({col.completed_items.length})
                        </button>

                        <div
                            className={`space-y-1 overflow-hidden transition-all duration-300 ${
                                showCompleted === col.group.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        >
                            {col.completed_items.map(item => (
                                <TodoItemCard
                                    key={item.id}
                                    item={item}
                                    onToggle={onToggleItem}
                                    onDelete={onDeleteItem}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Board Component ────────────────────────────────
export function TodoBoard() {
    const [board, setBoard] = useState<BoardColumn[]>([])
    const [showAddGroup, setShowAddGroup] = useState(false)
    const [showAddItem, setShowAddItem] = useState<number | null>(null)
    const [showCompleted, setShowCompleted] = useState<number | null>(null)

    // Drag overlay state
    const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null)
    const [activeTask, setActiveTask] = useState<TodoItemData | null>(null)

    // Forms
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDesc, setNewGroupDesc] = useState('')
    const [newItemName, setNewItemName] = useState('')
    const [newItemParent, setNewItemParent] = useState<number | undefined>()
    const [newItemEndAt, setNewItemEndAt] = useState('')

    const loadBoard = useCallback(async () => {
        try {
            const data = await api.getTodoBoard()
            setBoard(data)
        } catch (e) {
            console.error('Failed to load board:', e)
        }
    }, [])

    useEffect(() => {
        loadBoard()
    }, [loadBoard])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // ─── Drag Handlers ────────────────────────────
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        if (active.data.current?.type === 'Column') {
            setActiveColumn(active.data.current.column)
        } else if (active.data.current?.type === 'Task') {
            setActiveTask(active.data.current.item)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeType = active.data.current?.type
        const overType = over.data.current?.type

        if (activeType === 'Task') {
            const activeId = active.id
            const overId = over.id

            const activeColumnIndex = board.findIndex(col => col.items.some(i => i.id === activeId))
            let overColumnIndex = board.findIndex(col => col.group.id === overId)
            if (overColumnIndex === -1) {
                overColumnIndex = board.findIndex(col => col.items.some(i => i.id === overId))
            }

            if (activeColumnIndex === -1 || overColumnIndex === -1 || activeColumnIndex === overColumnIndex) {
                return
            }

            // Optimistic update for cross-column drag
            setBoard(prev => {
                const next = [...prev]
                const activeItems = [...next[activeColumnIndex].items]
                const overItems = [...next[overColumnIndex].items]

                const activeItemIndex = activeItems.findIndex(i => i.id === activeId)
                if (activeItemIndex === -1) return prev

                const activeItem = { ...activeItems[activeItemIndex] }

                // Remove from original column
                activeItems.splice(activeItemIndex, 1)

                // Update group_id
                activeItem.group_id = next[overColumnIndex].group.id

                // Determine insertion index in new column
                let overItemIndex = overType === 'Task' ? overItems.findIndex(i => i.id === overId) : overItems.length
                if (overItemIndex === -1) overItemIndex = overItems.length

                overItems.splice(overItemIndex, 0, activeItem)

                next[activeColumnIndex] = { ...next[activeColumnIndex], items: activeItems }
                next[overColumnIndex] = { ...next[overColumnIndex], items: overItems }

                return next
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveColumn(null)
        setActiveTask(null)

        const { active, over } = event
        if (!over) return

        const activeType = active.data.current?.type

        if (activeType === 'Column') {
            const oldIndex = board.findIndex(c => c.group.id === active.id)
            const newIndex = board.findIndex(c => c.group.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const reordered = arrayMove(board, oldIndex, newIndex)
                setBoard(reordered)

                // Persist
                const positions = reordered.map((col, idx) => ({
                    id: col.group.id,
                    position: idx
                }))
                try {
                    await api.reorderTodoGroups(positions)
                } catch (e) {
                    console.error('Failed to reorder columns', e)
                    loadBoard() // Revert
                }
            }
        } else if (activeType === 'Task') {
            // Find the item in its CURRENT column (after dragOver optimistic update)
            const activeId = active.id
            const colIndex = board.findIndex(col => col.items.some(i => i.id === activeId))
            if (colIndex === -1) return

            const col = board[colIndex]
            const parentItems = col.items.filter(i => !i.parent_id)

            const overId = over.id
            const oldIndex = parentItems.findIndex(i => i.id === activeId)
            const newIndex = parentItems.findIndex(i => i.id === overId)

            let reordered = [...parentItems]
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                reordered = arrayMove([...parentItems], oldIndex, newIndex)
            }

            // Update board locally to snap into exact final sorted place
            setBoard(prev => {
                const newBoard = [...prev]
                const updatedItems = [...reordered, ...col.items.filter(i => i.parent_id)]
                newBoard[colIndex] = { ...col, items: updatedItems }
                return newBoard
            })

            // Persist the changes
            try {
                // If it moved columns, the original group_id in active.data.current.item won't match its current col.group.id
                const originalGroupId = active.data.current?.item.group_id
                if (originalGroupId !== col.group.id) {
                    await api.updateTodoItem(activeId as number, { group_id: col.group.id })
                }

                // Update positions within this new/final column
                const positions = reordered.map((item: TodoItemData, idx: number) => ({
                    id: item.id,
                    position: idx
                }))
                await api.reorderTodoItems(positions)
            } catch (e) {
                console.error('Failed to reorder/move item', e)
                loadBoard() // Revert
            }
        }
    }

    // ─── Actions ─────────────────────────────────────
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return
        try {
            await api.createTodoGroup({ name: newGroupName, description: newGroupDesc })
            setShowAddGroup(false)
            setNewGroupName('')
            setNewGroupDesc('')
            loadBoard()
        } catch (e) {
            console.error('Failed to create group:', e)
        }
    }

    const handleDeleteGroup = async (id: number) => {
        if (!confirm('Delete this group and all its tasks?')) return
        try {
            await api.deleteTodoGroup(id)
            loadBoard()
        } catch (e) {
            console.error('Failed to delete group:', e)
        }
    }

    const handleCreateItem = async (groupId: number) => {
        if (!newItemName.trim()) return
        try {
            await api.createTodoItem({
                name: newItemName,
                group_id: groupId,
                parent_id: newItemParent,
                end_at: newItemEndAt || undefined
            })
            setShowAddItem(null)
            setNewItemName('')
            setNewItemParent(undefined)
            setNewItemEndAt('')
            loadBoard()
        } catch (e) {
            console.error('Failed to create item:', e)
        }
    }

    const handleToggleComplete = async (item: TodoItemData) => {
        try {
            await api.updateTodoItem(item.id, {
                completed_at: item.completed_at ? null : new Date().toISOString()
            })
            loadBoard()
        } catch (e) {
            console.error('Failed to toggle item:', e)
        }
    }

    const handleDeleteItem = async (id: number) => {
        try {
            await api.deleteTodoItem(id)
            loadBoard()
        } catch (e) {
            console.error('Failed to delete item:', e)
        }
    }

    const columnIds = board.map(c => c.group.id)

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">To-do Board</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Organize your tasks and goals.</p>
                </div>
                <button
                    onClick={() => setShowAddGroup(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl font-medium transition-all shadow-sm active:scale-95"
                >
                    <Plus size={18} /> New Column
                </button>
            </div>

            {/* Empty State */}
            {board.length === 0 && !showAddGroup && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 bg-brand-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <ListTodo size={36} className="text-brand-400 dark:text-brand-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Start organizing</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
                        Create your first column and start adding tasks. Drag them around to reorder.
                    </p>
                    <button
                        onClick={() => setShowAddGroup(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white hover:bg-brand-700 active:scale-95 rounded-2xl font-medium transition-all shadow-md"
                    >
                        <Plus size={18} /> Create First Column
                    </button>
                </div>
            )}

            {/* Board Columns */}
            {board.length > 0 && (
                <div className="flex-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-5 min-h-[520px] h-full items-start">
                            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                                {board.map(col => (
                                    <SortableColumn
                                        key={col.group.id}
                                        col={col}
                                        onDeleteGroup={handleDeleteGroup}
                                        onToggleItem={handleToggleComplete}
                                        onDeleteItem={handleDeleteItem}
                                        showCompleted={showCompleted}
                                        setShowCompleted={setShowCompleted}
                                        setShowAddItem={setShowAddItem}
                                    />
                                ))}
                            </SortableContext>
                        </div>

                        {/* Drag Overlay for smooth animations */}
                        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ duration: 200 })}>
                            {activeColumn && (
                                <SortableColumn
                                    col={activeColumn}
                                    onDeleteGroup={() => {}}
                                    onToggleItem={() => {}}
                                    onDeleteItem={() => {}}
                                    showCompleted={null}
                                    setShowCompleted={() => {}}
                                    setShowAddItem={() => {}}
                                />
                            )}
                            {activeTask && <TodoItemCard item={activeTask} isDragging />}
                        </DragOverlay>
                    </DndContext>
                </div>
            )}

            {/* Add Group Modal */}
            {showAddGroup && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-xl zoom-in-95 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Create New Column</h3>
                            <button
                                onClick={() => setShowAddGroup(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Column Name
                                </label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="e.g. Backlog, In Progress..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:text-gray-100 transition-all"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                                />
                            </div>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!newGroupName.trim()}
                                className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Create Column
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddItem && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-xl zoom-in-95 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Add New Task</h3>
                            <button
                                onClick={() => setShowAddItem(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Task Name
                                </label>
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:text-gray-100 transition-all"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleCreateItem(showAddItem)}
                                />
                            </div>

                            {/* Parent Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Sub-task of (Optional)
                                </label>
                                <select
                                    value={newItemParent || ''}
                                    onChange={e =>
                                        setNewItemParent(e.target.value ? Number(e.target.value) : undefined)
                                    }
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:text-gray-100 appearance-none transition-all"
                                >
                                    <option value="">None (Top-level task)</option>
                                    {board
                                        .find(c => c.group.id === showAddItem)
                                        ?.items.filter(i => !i.parent_id && !i.completed_at)
                                        .map(parent => (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Deadline (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={newItemEndAt}
                                    onChange={e => setNewItemEndAt(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:text-gray-100 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>

                            <button
                                onClick={() => handleCreateItem(showAddItem)}
                                disabled={!newItemName.trim()}
                                className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                            >
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
